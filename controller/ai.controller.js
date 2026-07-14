import { generateCompletion } from "../utils/openai.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";

// POST /api/v1/ai/caption
const generateCaption = asyncHandler(async (req, res) => {
  const { prompt, tone = "friendly", platform = "Instagram" } = req.body;

  const caption = await generateCompletion(
    `You are a social media copywriter. Write a short, engaging ${platform} caption in a ${tone} tone.`,
    prompt
  );

  return new ApiResponse(200, "Caption generated successfully.", { caption }).send(res);
});

// POST /api/v1/ai/hashtags
const generateHashtags = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  const hashtags = await generateCompletion(
    "You generate 5-8 relevant, trending social media hashtags. Respond with only the hashtags, space separated.",
    prompt
  );

  return new ApiResponse(200, "Hashtags generated successfully.", { hashtags }).send(res);
});

// POST /api/v1/ai/rewrite
const rewriteCaption = asyncHandler(async (req, res) => {
  const { text, tone = "casual" } = req.body;

  const rewritten = await generateCompletion(
    `Rewrite the following social media caption in a ${tone} tone, keeping it concise.`,
    text
  );

  return new ApiResponse(200, "Caption rewritten successfully.", { rewritten }).send(res);
});

// POST /api/v1/ai/translate
const translateCaption = asyncHandler(async (req, res) => {
  const { text, targetLanguage } = req.body;

  const translated = await generateCompletion(
    `Translate the following text to ${targetLanguage}, keeping the tone natural for social media.`,
    text
  );

  return new ApiResponse(200, "Caption translated successfully.", { translated }).send(res);
});

// POST /api/v1/ai/content-ideas
const generateContentIdeas = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  const ideas = await generateCompletion(
    "You generate 5 creative social media content ideas as a numbered list, tailored to the brand described.",
    prompt
  );

  return new ApiResponse(200, "Content ideas generated successfully.", { ideas }).send(res);
});

// POST /api/v1/ai/cta
const generateCta = asyncHandler(async (req, res) => {
  const { prompt } = req.body;

  const cta = await generateCompletion(
    "You write a single, punchy call-to-action line for a social media post.",
    prompt
  );

  return new ApiResponse(200, "CTA generated successfully.", { cta }).send(res);
});

export { generateCaption,
  generateHashtags,
  rewriteCaption,
  translateCaption,
  generateContentIdeas,
  generateCta, };
