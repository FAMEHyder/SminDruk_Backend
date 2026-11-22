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
    `You are a social media copywriter. Write a short, engaging ${platform} caption in a ${tone} tone based strictly on the user's topic. Return only the caption text.`,
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
    `You improve social media posts. Rewrite and polish the user's text to make it more ${tone}, clearer, and better structured while preserving the exact same meaning and context. Return only the improved post.`,
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

// POST /api/v1/ai/variations — AI Variations Generator for multiple pages
const generateVariations = asyncHandler(async (req, res) => {
  const text = requirePrompt(req.body.text || req.body.prompt, "text");
  const count = Math.min(50, Math.max(1, parseInt(req.body.count, 10) || 3));
  const platform = req.body.platform || "Facebook";

  const systemPrompt = `You are a professional copywriter. Your task is to rewrite the user's post content into exactly ${count} unique variations for ${platform}.

Instructions:
1. Rewrite the given text in other words.
2. Keep the exact same meaning, message, and context of the original text.
3. For each variation, use different vocabulary, different sentence phrasing, and different opening hooks so that each variation reads fresh and distinct.
4. Add relevant emojis that match the text naturally.
5. Keep each variation clean, ready-to-post, and under 2000 characters.
6. Strictly rewrite what the user provided without adding unrelated topics or outside themes.

OUTPUT FORMAT: Return ONLY a valid JSON array of strings containing exactly ${count} items. Do NOT wrap in markdown codeblocks. Do NOT add preamble or explanations.
Example format:
["First rewritten variation...", "Second rewritten variation...", "Third rewritten variation..."]`;

  const raw = await generateCompletion(systemPrompt, text);

  let variations = [];
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      variations = parsed.map((item) => (typeof item === "string" ? item.trim() : String(item))).filter(Boolean);
    }
  } catch {
    variations = raw
      .split(/\n\s*(?:\[?\d+[\.\)\]]|\-)\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (!variations.length) {
    variations = [text];
  }

  while (variations.length < count) {
    variations.push(variations[variations.length - 1] || text);
  }

  return new ApiResponse(200, "Variations generated successfully.", {
    variations: variations.slice(0, count),
  }).send(res);
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
  generateVariations,
};
