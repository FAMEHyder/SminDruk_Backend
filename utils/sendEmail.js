import dns from "dns";
import nodemailer from "nodemailer";
import { getEnv, isProduction, isRailway } from "./env.js";
import logger from "./logger.js";

dns.setDefaultResultOrder("ipv4first");

const strip = (value) => String(value || "").trim().replace(/^["']|["']$/g, "");

const parseFrom = (from, user) => {
  const match = String(from || "").match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^["']|["']$/g, "") || "SminDruk",
      email: match[2].trim(),
    };
  }
  return { name: "SminDruk", email: user || from || "no-reply@smindruk.app" };
};

const getEmailConfig = () => {
  const user = strip(getEnv("EMAIL_USER", "SMTP_USER", "SMTP_USERNAME"));
  const pass = strip(getEnv("EMAIL_PASS", "SMTP_PASS", "SMTP_PASSWORD", "EMAIL_PASSWORD")).replace(/\s+/g, "");
  const resendKey = strip(getEnv("RESEND_API_KEY"));
  const brevoKey = strip(getEnv("BREVO_API_KEY", "SIB_API_KEY", "SENDINBLUE_API_KEY"));
  const emailjsServiceId = strip(getEnv("EMAILJS_SERVICE_ID"));
  const emailjsTemplateId = strip(getEnv("EMAILJS_TEMPLATE_ID"));
  const emailjsPublicKey = strip(getEnv("EMAILJS_PUBLIC_KEY", "EMAILJS_USER_ID"));
  const emailjsPrivateKey = strip(getEnv("EMAILJS_PRIVATE_KEY", "EMAILJS_ACCESS_TOKEN"));
  const emailjsReady = Boolean(emailjsServiceId && emailjsTemplateId && emailjsPublicKey);
  const fromEnv = strip(getEnv("EMAIL_FROM", "SMTP_FROM"));
  let host = strip(getEnv("EMAIL_HOST", "SMTP_HOST"));
  const port = Number(getEnv("EMAIL_PORT", "SMTP_PORT") || 587);
  if (!host && user.toLowerCase().endsWith("@gmail.com")) host = "smtp.gmail.com";
  const gmail = `${host} ${user}`.toLowerCase().includes("gmail");
  const from = gmail && user ? `SminDruk <${user}>` : fromEnv || (user ? `SminDruk <${user}>` : "SminDruk <no-reply@smindruk.app>");
  return { user, pass, host, port, from, resendKey, brevoKey, gmail, emailjsServiceId, emailjsTemplateId, emailjsPublicKey, emailjsPrivateKey, emailjsReady };
};

const isEmailConfigured = () => {
  const { user, pass, host, resendKey, brevoKey, emailjsReady } = getEmailConfig();
  if (emailjsReady || brevoKey || resendKey) return true;
  if (isRailway()) return false;
  return Boolean(host && user && pass);
};

const allowDevEmailBypass = () => !isProduction() && !isEmailConfigured();

const publicEmailSendError = (error) => {
  const raw = String(error?.response || error?.message || "Unknown email error");
  const lower = raw.toLowerCase();
  if (lower.includes("emailjs") || lower.includes("the user id is required")) {
    return "EmailJS rejected the request. Check EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY.";
  }
  if (lower.includes("brevo_api_key") || lower.includes("cannot use gmail smtp")) {
    return raw;
  }
  if (lower.includes("unauthorized") || lower.includes("unauthorised") || lower.includes("401")) {
    return "Brevo API key was rejected. Recreate BREVO_API_KEY and paste it into Railway.";
  }
  if (lower.includes("sender") || lower.includes("not verified") || lower.includes("invalid_parameter")) {
    return "Verify famehyder9999@gmail.com as a sender in Brevo (Senders, Domains), then try again.";
  }
  if (lower.includes("invalid login") || lower.includes("535") || lower.includes("534")) {
    return "Gmail rejected EMAIL_PASS. Railway still cannot use Gmail SMTP — add BREVO_API_KEY instead.";
  }
  if (lower.includes("timeout") || lower.includes("etimedout") || lower.includes("econn") || lower.includes("socket")) {
    return "Railway cannot reach Gmail SMTP. Add BREVO_API_KEY — Gmail App Password will not work on Railway.";
  }
  return raw.replace(/\s+/g, " ").slice(0, 180);
};

const createMailer = (options) =>
  nodemailer.createTransport({
    ...options,
    family: 4,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });

const smtpTransports = () => {
  const { user, pass, host, port, gmail } = getEmailConfig();
  const auth = { user, pass };
  if (gmail) {
    return [
      { host: "smtp.gmail.com", port: 465, secure: true, auth },
      { host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true, auth },
    ];
  }
  return [{ host, port, secure: port === 465, auth }];
};

const sendViaEmailJs = async ({ to, subject, html, otp }) => {
  const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, emailjsPrivateKey, user } = getEmailConfig();
  const code = otp || String(html || "").match(/\b(\d{6})\b/)?.[1] || "";
  const text = String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const payload = {
    service_id: emailjsServiceId,
    template_id: emailjsTemplateId,
    user_id: emailjsPublicKey,
    accessToken: emailjsPrivateKey,
    template_params: {
      to_email: to,
      to_name: "SminDruk user",
      from_name: "SminDruk",
      from_email: user || "no-reply@smindruk.app",
      reply_to: user || to,
      email: to,
      user_email: to,
      subject,
      message: text,
      html,
      otp: code,
      code,
      passcode: code,
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.FRONTEND_URL_LIVE || "https://smindruk.vercel.app",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `EmailJS failed with HTTP ${response.status}.`);
  }
  logger.info(`EmailJS sent "${subject}" to ${to}`);
};

const sendViaBrevo = async ({ to, subject, html, from, user }) => {
  const { brevoKey } = getEmailConfig();
  const sender = parseFrom(from, user);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey,
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Brevo failed with HTTP ${response.status}.`);
  }
};

const sendViaResend = async ({ to, subject, html, from }) => {
  const { resendKey } = getEmailConfig();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Resend failed with HTTP ${response.status}.`);
  }
};

const sendViaSmtp = async ({ to, subject, html, from }) => {
  let lastError;
  for (const options of smtpTransports()) {
    try {
      const mailer = createMailer(options);
      await mailer.sendMail({ from, to, subject, html, replyTo: from });
      logger.info(`Email sent to ${to} via ${options.host}:${options.port}`);
      return;
    } catch (error) {
      lastError = error;
      logger.warn(`SMTP attempt failed (${options.host}:${options.port}): ${error.message}`);
    }
  }
  throw lastError || new Error("SMTP send failed.");
};

/**
 * Sends a transactional email through Brevo/Resend HTTP APIs, or local SMTP.
 * Railway cannot open Gmail SMTP ports, so production uses HTTPS only.
 */
const sendEmail = async ({ to, subject, html, otp }) => {
  const { from, user, resendKey, brevoKey, emailjsReady } = getEmailConfig();

  if (emailjsReady) {
    await sendViaEmailJs({ to, subject, html, otp });
    return;
  }
  if (brevoKey) {
    await sendViaBrevo({ to, subject, html, from, user });
    return;
  }
  if (resendKey) {
    await sendViaResend({ to, subject, html, from });
    return;
  }
  if (isRailway()) {
    throw new Error("Railway cannot use Gmail SMTP. Add EmailJS keys (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY) or BREVO_API_KEY.");
  }
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured. Set EmailJS keys, BREVO_API_KEY, or local EMAIL_HOST/EMAIL_USER/EMAIL_PASS.");
  }
  await sendViaSmtp({ to, subject, html, from });
};

const wrapEmail = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#666">If you did not request this, you can ignore this email.</p>
  </div>
`;

const passwordResetOtpEmail = (code) =>
  wrapEmail(
    "Your SminDruk password reset code",
    `<p>Use this one-time code to reset your password. It expires in 1 minute.</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:bold;margin:16px 0">${code}</p>`
  );

const verificationEmail = (code) =>
  wrapEmail(
    "Verify your SminDruk account",
    `<p>Your verification code is:</p>
     <p style="font-size:28px;letter-spacing:4px;font-weight:bold;margin:16px 0">${code}</p>`
  );

export default sendEmail;
export {
  getEmailConfig,
  isEmailConfigured,
  allowDevEmailBypass,
  publicEmailSendError,
  passwordResetOtpEmail,
  verificationEmail,
};
