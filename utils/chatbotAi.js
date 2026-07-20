/**
 * Groq client for the Smindruk product chatbot ONLY.
 * Intentionally separate from utils/openai.js so Create Post caption AI stays untouched.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import logger from "./logger.js";

const ENV_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
dotenv.config({ path: ENV_PATH, override: true });

let client;
let clientKey;

const resolveApiKey = () => {
  dotenv.config({ path: ENV_PATH, override: true });
  const fromEnv =
    process.env.GROQ_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  try {
    if (!fs.existsSync(ENV_PATH)) return "";
    const raw = fs.readFileSync(ENV_PATH, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if ((key === "GROQ_API_KEY" || key === "GROK_API_KEY" || key === "OPENAI_API_KEY") && value) {
        return value;
      }
    }
  } catch {
    /* ignore */
  }
  return "";
};

const getClient = () => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    logger.error("Chatbot: GROQ_API_KEY is not set.");
    return null;
  }
  if (client && clientKey === apiKey) return client;
  client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
  clientKey = apiKey;
  return client;
};

const getModel = () => process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

/**
 * @param {Array<{role: string, content: string}>} messages
 */
export const chatbotChat = async (messages) => {
  const groq = getClient();
  if (!groq) {
    throw new Error("Chatbot is not configured. Add GROQ_API_KEY to Backend/.env and restart the server.");
  }

  const completion = await groq.chat.completions.create({
    model: getModel(),
    messages,
    temperature: 0.3,
    max_tokens: 900,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Chatbot returned an empty response. Please try again.");
  return text;
};
