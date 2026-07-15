import { z } from "zod";

/**
 * Central place for Zod request-validation schemas.
 * Used by middleware/validate.middleware.js via validate(schema).
 */
const authValidators = {
  register: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
  forgotPassword: z.object({
    email: z.string().email("Invalid email address"),
  }),
  resetPassword: z.object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  verifyEmail: z.object({
    email: z.string().email("Invalid email address"),
    code: z.string().min(6, "Verification code is required"),
  }),
  resendVerification: z.object({
    email: z.string().email("Invalid email address"),
  }),
};

const userValidators = {
  updateProfile: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    bio: z.string().max(280).optional(),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
};

const workspaceValidators = {
  create: z.object({
    name: z.string().min(1, "Workspace name is required"),
    description: z.string().optional(),
  }),
  invite: z.object({
    email: z.string().email(),
    role: z.enum(["admin", "editor", "viewer"]),
  }),
};

const postValidators = {
  create: z.object({
    workspaceId: z.string().min(1),
    type: z.enum(["text", "image", "carousel", "video", "reel", "story"]),
    content: z.string().max(2200).optional(),
    platforms: z.array(z.enum(["facebook", "instagram", "linkedin", "x", "tiktok", "pinterest"])).min(1),
    mediaIds: z.array(z.string()).optional(),
    socialAccountIds: z.array(z.string()).optional(),
    scheduledAt: z.string().datetime().optional(),
    status: z.enum(["draft", "scheduled", "published"]).optional(),
  }),
};

const aiValidators = {
  caption: z.object({
    prompt: z.string().min(3),
    tone: z.string().optional(),
    platform: z.string().optional(),
  }),
  hashtags: z.object({
    prompt: z.string().min(3),
  }),
  rewrite: z.object({
    text: z.string().min(3),
    tone: z.string().optional(),
  }),
  translate: z.object({
    text: z.string().min(1),
    targetLanguage: z.string().min(2),
  }),
};

const contactValidators = {
  contactForm: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(10),
  }),
  newsletter: z.object({
    email: z.string().email(),
  }),
};

export { authValidators,
  userValidators,
  workspaceValidators,
  postValidators,
  aiValidators,
  contactValidators, };
