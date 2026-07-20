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

const SYSTEM_PROMPT = `You are Smindy, the friendly anime assistant for Smindruk — a Social Media Management SaaS.

Rules:
- Answer ONLY using the provided CONTEXT from the Smindruk Product Requirements / knowledge base.
- If the context does not contain the answer, say you don't have that in the Smindruk docs and suggest Connect Channels, Create Post, Calendar, Settings, or contacting support.
- Be concise, clear, and helpful. Use short paragraphs or bullets when useful.
- Never invent Instagram/LinkedIn/X publishing steps as live — those are Coming Soon unless context says otherwise.
- Facebook Manage vs Dataset/Trending: explain accurately when asked.
- Token refresh: 45-day refresh_due window, 60-day cron_expired, daily cron 12:00 Asia/Karachi.
- Do not reveal secrets, API keys, or raw tokens.
- You may greet warmly. Product name is Smindruk.`;

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
    : "No matching sections found. Use general Smindruk product knowledge from training only if unavoidable; prefer saying docs lack this detail.";

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
      assistantName: "Smindy",
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
    assistantName: "Smindy",
  }).send(res);
});

export { askChatbot, chatbotHealth };
