import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import logger from "./logger.js";

const ENV_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");

/** Always prefer Backend/.env (covers late key adds without relying only on process start). */
const reloadEnv = () => {
  dotenv.config({ path: ENV_PATH, override: true });
};

reloadEnv();

let client;
let clientKey;

const readKeyFromEnvFile = () => {
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
        process.env[key] = value;
        return value;
      }
    }
  } catch (error) {
    logger.error(`Failed reading Backend/.env for AI key: ${error.message}`);
  }
  return "";
};

/**
 * Resolve Groq API key from env (GROQ / GROK typo / OpenAI fallback) or Backend/.env file.
 */
const resolveApiKey = () => {
  reloadEnv();

  const fromEnv =
    process.env.GROQ_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();

  if (fromEnv) return fromEnv;
  return readKeyFromEnvFile();
};

/**
 * Groq exposes an OpenAI-compatible chat API.
 * Uses GROQ_API_KEY from Backend/.env (OPENAI_API_KEY kept as fallback).
 */
const getClient = () => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    logger.error("GROQ_API_KEY is not set. Real AI generation requires a valid Groq key.");
    client = null;
    clientKey = undefined;
    return null;
  }

  if (client && clientKey === apiKey) return client;

  client = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
  clientKey = apiKey;
  return client;
};

const getModel = () => process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

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
      model: getModel(),
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
    // Don't leak our own "not configured" message twice through nested catch.
    const message = error?.error?.message || error?.message || "AI request failed.";
    logger.error(`Groq AI error: ${message}`);
    throw new Error(message);
  }
};

export { generateCompletion };
