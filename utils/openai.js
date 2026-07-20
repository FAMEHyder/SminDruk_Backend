import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import logger from "./logger.js";

// Ensure Backend/.env is loaded even if this module is imported early.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

let client;

/**
 * Groq exposes an OpenAI-compatible chat API.
 * Uses GROQ_API_KEY from Backend/.env (OPENAI_API_KEY kept as fallback).
 */
const getClient = () => {
  if (client) return client;

  const apiKey = process.env.GROQ_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    logger.error("GROQ_API_KEY is not set. Real AI generation requires a valid Groq key.");
    return null;
  }

  client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
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
    throw new Error("AI is not configured. Add GROQ_API_KEY to Backend/.env and restart the server.");
  }

  try {
    const completion = await openai.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      throw new Error("AI returned an empty response. Please try again.");
    }
    return text;
  } catch (error) {
    const message = error?.error?.message || error?.message || "AI request failed.";
    logger.error(`Groq AI error: ${message}`);
    throw new Error(message);
  }
};

export { generateCompletion };
