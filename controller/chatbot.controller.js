import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { retrieveRelevantChunks, getKnowledgeStats, loadKnowledgeBase } from "../utils/chatbotRag.js";
import { chatbotChat } from "../utils/chatbotAi.js";

// Warm knowledge base on first import (non-blocking errors logged inside loader).
try {
  loadKnowledgeBase();
} catch {
  /* loader logs */
}

const SYSTEM_PROMPT = `You are Zarshan, the friendly anime assistant for Smindruk — a Social Media Management SaaS.

Rules:
- Your name is Zarshan. If anyone asks your name, who you are, "what is our name", "what's your name", or similar — always answer clearly: "I'm Zarshan."
- Never call yourself Smindy or any other assistant name.
- For Smindruk product questions, answer using the provided CONTEXT from the knowledge base when it helps.
- If the question is irrelevant, off-topic, unrelated to Smindruk/social media management, or you cannot help with it: reply briefly with something like "I cannot assist you with this request." Do NOT mention docs, documentation, PRD, knowledge base, Connect Channels, Create Post, Calendar, Settings, or contacting support in that case.
- Never say phrases like "I don't have that in the Smindruk docs" or "not in the documentation."
- Be concise, clear, and helpful on relevant Smindruk topics. Use short paragraphs or bullets when useful.
- Instagram: Connect Channels uses Facebook Login with your Meta app. The Instagram professional (Business/Creator) account must be linked to a Facebook Page. Optional INSTAGRAM_APP_ID enables Instagram Login without a Page.
- Facebook Manage vs Dataset/Trending: explain accurately when asked.
- Token refresh: Facebook/Instagram tokens are refreshed from day 7 until day 60 (every 6 hours, Asia/Karachi). Admin warning at 45 days. After 60 days reconnect is required. X and LinkedIn refresh on the same cron.
- Facebook Live: Go Live for connected Pages and Bulk Live for trending dataset pages. Monthly live videos equal that plan's Facebook post limit (Free 30, Basic 200, Standard 500, Premium 1500).
- Do not reveal secrets, API keys, or raw tokens.
- You may greet warmly. Product name is Smindruk. Your personal name is Zarshan.`;

/**
 * POST /api/v1/chatbot/ask
 * Public (landing + dashboard). Body: { message, history? }
 */
const askChatbot = asyncHandler(async (req, res) => {
  const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
  if (!message || message.length < 2) {
    throw ApiError.badRequest("Please type a question for the assistant.");
  }
  if (message.length > 2000) {
    throw ApiError.badRequest("Message is too long (max 2000 characters).");
  }

  const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
  const chunks = retrieveRelevantChunks(message, 6);
  const context = chunks.length
    ? chunks.join("\n\n---\n\n")
    : "No strong match in the knowledge base for this question.";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `CONTEXT FROM SMINDRUK PRD KNOWLEDGE BASE:\n\n${context.slice(0, 14000)}`,
    },
  ];

  for (const item of history) {
    if (!item || typeof item.content !== "string") continue;
    const role = item.role === "assistant" ? "assistant" : "user";
    const content = item.content.trim().slice(0, 1500);
    if (content) messages.push({ role, content });
  }

  messages.push({ role: "user", content: message });

  try {
    const reply = await chatbotChat(messages);
    return new ApiResponse(200, "Chatbot reply ready.", {
      reply,
      assistantName: "Zarshan",
    }).send(res);
  } catch (error) {
    const msg = error?.message || "Chatbot request failed.";
    if (/not configured|GROQ/i.test(msg)) {
      throw ApiError.badRequest(msg);
    }
    throw ApiError.badRequest(msg);
  }
});

/**
 * GET /api/v1/chatbot/health
 */
const chatbotHealth = asyncHandler(async (_req, res) => {
  const stats = getKnowledgeStats();
  return new ApiResponse(200, "Chatbot status.", {
    ...stats,
    assistantName: "Zarshan",
  }).send(res);
});

export { askChatbot, chatbotHealth };
