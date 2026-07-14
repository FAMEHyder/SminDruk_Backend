import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ContactMessage from "../models/contactMessage.model.js";
import sendEmail from "../utils/sendEmail.js";
import logger from "../utils/logger.js";

// POST /api/v1/contact
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const entry = await ContactMessage.create({ type: "contact_form", name, email, subject, message });

  try {
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `New contact form submission: ${subject}`,
      html: `<p><b>${name}</b> (${email}) wrote:</p><p>${message}</p>`,
    });
  } catch (error) {
    logger.warn(`Contact notification email failed: ${error.message}`);
  }

  return new ApiResponse(201, "Your message has been received. We'll get back to you within 24 hours.", entry).send(
    res
  );
});

// POST /api/v1/contact/newsletter
const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const entry = await ContactMessage.findOneAndUpdate(
    { type: "newsletter", email },
    { type: "newsletter", email },
    { upsert: true, new: true }
  );

  return new ApiResponse(200, "Subscribed to the newsletter successfully.", entry).send(res);
});

// POST /api/v1/contact/support
const submitSupportRequest = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const entry = await ContactMessage.create({ type: "support_request", name, email, subject, message });

  return new ApiResponse(201, "Support request submitted successfully.", entry).send(res);
});

export { submitContactForm, subscribeNewsletter, submitSupportRequest };
