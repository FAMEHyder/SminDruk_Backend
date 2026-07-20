import OpenAI from "openai";
import logger from "./logger.js";

let client;

/**
 * Groq exposes an OpenAI-compatible chat API.
 * Uses GROQ_API_KEY from Backend/.env (OPENAI_API_KEY kept as fallback).
 */
const getClient = () => {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      logger.warn("GROQ_API_KEY is not set. AI features will return mock responses.");
      return null;
    }
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
};

const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

/**
 * Generic chat completion helper used by the AI module.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 */
const generateCompletion = async (systemPrompt, userPrompt) => {
  const openai = getClient();

  if (!openai) {
    return `[Mock AI response] ${userPrompt.slice(0, 120)}...`;
  }

  const completion = await openai.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
};

export { generateCompletion };
