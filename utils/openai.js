import OpenAI from "openai";
import logger from "./logger.js";

let client;

const getClient = () => {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn("OPENAI_API_KEY is not set. AI features will return mock responses.");
      return null;
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

/**
 * Generic chat completion helper used by the AI module
 * (caption generator, hashtag generator, rewrite, translate, ideas, CTA).
 * @param {string} systemPrompt
 * @param {string} userPrompt
 */
const generateCompletion = async (systemPrompt, userPrompt) => {
  const openai = getClient();

  if (!openai) {
    return `[Mock AI response] ${userPrompt.slice(0, 120)}...`;
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
};

export { generateCompletion };
