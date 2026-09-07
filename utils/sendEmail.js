import nodemailer from "nodemailer";
import { getEnv, isProduction } from "./env.js";
import logger from "./logger.js";

const getEmailConfig = () => {
  const user = getEnv("EMAIL_USER", "SMTP_USER", "SMTP_USERNAME");
  const pass = (getEnv("EMAIL_PASS", "SMTP_PASS", "SMTP_PASSWORD", "EMAIL_PASSWORD") || "").replace(/\s+/g, "");
  const resendKey = getEnv("RESEND_API_KEY");
  const from =
    getEnv("EMAIL_FROM", "SMTP_FROM") ||
    (user ? `SminDruk <${user}>` : "SminDruk <no-reply@smindruk.app>");
  let host = getEnv("EMAIL_HOST", "SMTP_HOST");
  const port = Number(getEnv("EMAIL_PORT", "SMTP_PORT") || 587);
  if (!host && user?.toLowerCase().endsWith("@gmail.com")) host = "smtp.gmail.com";
  return { user, pass, host, port, from, resendKey };
};

const isEmailConfigured = () => {
  const { user, pass, host, resendKey } = getEmailConfig();
  return Boolean(resendKey) || Boolean(host && user && pass);
};

const allowDevEmailBypass = () => !isProduction() && !isEmailConfigured();

const createMailer = (options) =>
  nodemailer.createTransport({
    ...options,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: { minVersion: "TLSv1.2" },
  });

const smtpTransports = () => {
  const { user, pass, host, port } = getEmailConfig();
  const auth = { user, pass };
  const gmail = `${host} ${user}`.toLowerCase().includes("gmail");
  if (gmail) {
    return [
      { host: "smtp.gmail.com", port: 465, secure: true, auth },
      { service: "gmail", auth },
      { host: "smtp.gmail.com", port: 587, secure: false, requireTLS: true, auth },
    ];
  }
  return [{ host, port, secure: port === 465, auth }];
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
      await mailer.sendMail({ from, to, subject, html });
      return;
    } catch (error) {
      lastError = error;
      logger.warn(`SMTP attempt failed (${options.host || options.service || "smtp"}): ${error.message}`);
    }
  }
  throw lastError || new Error("SMTP send failed.");
};

/**
 * Sends a transactional email through SMTP or Resend.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS.");
  }

  const { from, resendKey } = getEmailConfig();
  try {
    if (resendKey) {
      await sendViaResend({ to, subject, html, from });
      return;
    }
    await sendViaSmtp({ to, subject, html, from });
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

const wrapEmail = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#666">If you did not request this, you can ignore this email.</p>
  </div>
`;

const passwordResetEmail = (resetUrl) =>
  wrapEmail(
    "Reset your SminDruk password",
    `<p>We received a request to reset your password. This link expires in 1 hour.</p>
     <p style="margin:24px 0"><a href="${resetUrl}" style="background:#111;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset password</a></p>
     <p style="font-size:13px;color:#666;word-break:break-all">${resetUrl}</p>`
  );

const verificationEmail = (code) =>
  wrapEmail(
    "Verify your SminDruk account",
    `<p>Your verification code is:</p>
     <p style="font-size:28px;letter-spacing:4px;font-weight:bold;margin:16px 0">${code}</p>`
  );

export default sendEmail;
export { getEmailConfig, isEmailConfigured, allowDevEmailBypass, passwordResetEmail, verificationEmail };
