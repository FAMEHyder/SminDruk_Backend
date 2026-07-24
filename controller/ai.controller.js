import { generateCompletion } from "../utils/openai.js";
import { generateAndSaveImage } from "../utils/huggingfaceImage.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import GeneratedImage from "../models/generatedImage.model.js";

const requirePrompt = (value, field = "prompt") => {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw ApiError.badRequest(`${field} is required.`);
  return text;
};

// POST /api/v1/ai/caption — AI Caption Writer
const generateCaption = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);
  const { tone = "friendly", platform = "Facebook" } = req.body;

  const caption = await generateCompletion(
    `You are a social media copywriter. Write a short, engaging ${platform} caption in a ${tone} tone. Return only the caption text.`,
    prompt
  );

  return new ApiResponse(200, "Caption generated successfully.", { caption }).send(res);
});

// POST /api/v1/ai/hashtags — AI Hashtag Generator
const generateHashtags = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const hashtags = await generateCompletion(
    "You generate 8-12 relevant, trending social media hashtags. Respond with only the hashtags, space separated, each starting with #.",
    prompt
  );

  return new ApiResponse(200, "Hashtags generated successfully.", { hashtags }).send(res);
});

// POST /api/v1/ai/image-prompt — AI Image Prompt Generator
const generateImagePrompt = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt || req.body.text);

  const imagePrompt = await generateCompletion(
    "You write detailed image-generation prompts for social media visuals (Midjourney/DALL·E style). Return only one polished prompt, no preamble.",
    prompt
  );

  return new ApiResponse(200, "Image prompt generated successfully.", { imagePrompt }).send(res);
});

// POST /api/v1/ai/generate-image — Hugging Face FLUX image generation
const generateImage = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const result = await generateAndSaveImage(prompt);

  const record = await GeneratedImage.create({
    userId: req.user._id,
    prompt,
    imageUrl: result.imageUrl,
    provider: result.provider,
    model: result.model,
  });

  return new ApiResponse(200, "Image generated successfully.", {
    imageUrl: record.imageUrl,
    id: record._id,
    model: record.model,
    provider: record.provider,
    createdAt: record.createdAt,
  }).send(res);
});

// GET /api/v1/ai/history — previously generated images (newest first)
const getImageHistory = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { userId: req.user._id };

  const [items, total] = await Promise.all([
    GeneratedImage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GeneratedImage.countDocuments(filter),
  ]);

  return new ApiResponse(200, "Image generation history fetched successfully.", items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  }).send(res);
});

// POST /api/v1/ai/content-calendar — AI Content Calendar
const generateContentCalendar = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const calendar = await generateCompletion(
    "You are a social media strategist. Create a 7-day content calendar as a clear numbered list. Each day: post theme, caption angle, and best time. Keep it practical.",
    prompt
  );

  return new ApiResponse(200, "Content calendar generated successfully.", { calendar }).send(res);
});

// POST /api/v1/ai/improve — AI Post Improver
const improvePost = asyncHandler(async (req, res) => {
  const text = requirePrompt(req.body.text || req.body.prompt, "text");
  const { tone = "engaging" } = req.body;

  const improved = await generateCompletion(
    `You improve social media posts. Make the text more ${tone}, clearer, and higher converting while keeping the original meaning. Return only the improved post.`,
    text
  );

  return new ApiResponse(200, "Post improved successfully.", { improved }).send(res);
});

// POST /api/v1/ai/reply — AI Reply Generator
const generateReply = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt || req.body.text);

  const reply = await generateCompletion(
    "You write short, friendly, professional social media comment replies. Return only the reply text (1-3 sentences).",
    prompt
  );

  return new ApiResponse(200, "Reply generated successfully.", { reply }).send(res);
});

// POST /api/v1/ai/viral-ideas — AI Viral Post Ideas
const generateViralIdeas = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const ideas = await generateCompletion(
    "You generate 5 viral social media post ideas as a numbered list. Each idea: hook + why it could go viral. Be creative and platform-aware.",
    prompt
  );

  return new ApiResponse(200, "Viral ideas generated successfully.", { ideas }).send(res);
});

// POST /api/v1/ai/seo-blog — AI SEO Blog Writer
const generateSeoBlog = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const blog = await generateCompletion(
    "You are an SEO content writer. Write a short SEO-friendly blog outline with title, meta description, H2 sections, and a brief intro paragraph. Keep it useful and keyword-aware.",
    prompt
  );

  return new ApiResponse(200, "SEO blog draft generated successfully.", { blog }).send(res);
});

const rewriteCaption = asyncHandler(async (req, res) => {
  const text = requirePrompt(req.body.text, "text");
  const { tone = "casual" } = req.body;

  const rewritten = await generateCompletion(
    `Rewrite the following social media caption in a ${tone} tone, keeping it concise. Return only the rewritten caption.`,
    text
  );

  return new ApiResponse(200, "Caption rewritten successfully.", { rewritten }).send(res);
});

const translateCaption = asyncHandler(async (req, res) => {
  const text = requirePrompt(req.body.text, "text");
  const targetLanguage = requirePrompt(req.body.targetLanguage, "targetLanguage");

  const translated = await generateCompletion(
    `Translate the following text to ${targetLanguage}, keeping the tone natural for social media. Return only the translation.`,
    text
  );

  return new ApiResponse(200, "Caption translated successfully.", { translated }).send(res);
});

const generateContentIdeas = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const ideas = await generateCompletion(
    "You generate 5 creative social media content ideas as a numbered list, tailored to the brand described.",
    prompt
  );

  return new ApiResponse(200, "Content ideas generated successfully.", { ideas }).send(res);
});

const generateCta = asyncHandler(async (req, res) => {
  const prompt = requirePrompt(req.body.prompt);

  const cta = await generateCompletion(
    "You write a single, punchy call-to-action line for a social media post. Return only the CTA.",
    prompt
  );

  return new ApiResponse(200, "CTA generated successfully.", { cta }).send(res);
});

export {
  generateCaption,
  generateHashtags,
  generateImagePrompt,
  generateImage,
  getImageHistory,
  generateContentCalendar,
  improvePost,
  generateReply,
  generateViralIdeas,
  generateSeoBlog,
  rewriteCaption,
  translateCaption,
  generateContentIdeas,
  generateCta,
};
