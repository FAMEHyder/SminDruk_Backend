import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const KNOWLEDGE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "knowledge",
  "smindruk-prd.md"
);

let chunks = [];
let loaded = false;

const tokenize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s#/_-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

/**
 * Split the Smindruk PRD markdown into overlapping search chunks for RAG.
 */
const buildChunks = (raw) => {
  const parts = raw.split(/\n(?=##\s)/g);
  const out = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.length <= 1800) {
      out.push(trimmed);
      continue;
    }

    // Large chapters: split by ### headings, then by paragraph packs.
    const sections = trimmed.split(/\n(?=###\s)/g);
    for (const section of sections) {
      const s = section.trim();
      if (!s) continue;
      if (s.length <= 1800) {
        out.push(s);
        continue;
      }
      let buf = "";
      for (const para of s.split(/\n\n+/)) {
        if ((buf + "\n\n" + para).length > 1600 && buf) {
          out.push(buf.trim());
          buf = para;
        } else {
          buf = buf ? `${buf}\n\n${para}` : para;
        }
      }
      if (buf.trim()) out.push(buf.trim());
    }
  }

  return out.map((content, index) => ({
    id: index,
    content,
    tokens: new Set(tokenize(content)),
  }));
};

export const loadKnowledgeBase = () => {
  if (loaded && chunks.length) return chunks;

  if (!fs.existsSync(KNOWLEDGE_PATH)) {
    logger.error(`Chatbot knowledge file missing: ${KNOWLEDGE_PATH}`);
    chunks = [];
    loaded = true;
    return chunks;
  }

  const raw = fs.readFileSync(KNOWLEDGE_PATH, "utf8");
  chunks = buildChunks(raw);
  loaded = true;
  logger.info(`Chatbot RAG loaded ${chunks.length} chunks from smindruk-prd.md`);
  return chunks;
};

/**
 * Rank chunks by keyword overlap with the user question.
 */
export const retrieveRelevantChunks = (question, limit = 6) => {
  const all = loadKnowledgeBase();
  if (!all.length) return [];

  const qTokens = tokenize(question);
  if (!qTokens.length) return all.slice(0, limit).map((c) => c.content);

  const scored = all
    .map((chunk) => {
      let score = 0;
      for (const t of qTokens) {
        if (chunk.tokens.has(t)) score += 1;
      }
      // Light boost for title-ish matches
      const head = chunk.content.slice(0, 120).toLowerCase();
      for (const t of qTokens) {
        if (head.includes(t)) score += 0.5;
      }
      return { score, content: chunk.content };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = (scored.length ? scored : all.map((c) => ({ content: c.content, score: 0 }))).slice(
    0,
    limit
  );

  return picked.map((p) => p.content);
};

export const getKnowledgeStats = () => {
  loadKnowledgeBase();
  return {
    loaded: chunks.length > 0,
    chunkCount: chunks.length,
    path: KNOWLEDGE_PATH,
  };
};
