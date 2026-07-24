import fs from "fs/promises";
import path from "path";
import { deflateSync } from "zlib";
import { v4 as uuidv4 } from "uuid";
import { InferenceClient } from "@huggingface/inference";
import ApiError from "./apiError.js";
import logger from "./logger.js";
import { getApiUrl, getEnv } from "./env.js";

export const HF_IMAGE_MODEL =
  getEnv("HF_IMAGE_MODEL") || "black-forest-labs/FLUX.2-klein-base-4B";

export const HF_IMAGE_PROVIDER = getEnv("HF_IMAGE_PROVIDER") || "auto";

/** Fallback when configured model has no usable Inference Provider mapping. */
const HF_IMAGE_FALLBACK_MODEL =
  getEnv("HF_IMAGE_FALLBACK_MODEL") || "black-forest-labs/FLUX.1-schnell";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const DEFAULT_TIMEOUT_MS = Number(process.env.HF_IMAGE_TIMEOUT_MS) || 120_000;

const crc32 = (buf) => {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
};

const pngChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
};

/** Solid 64×64 PNG (Fal.ai image-to-image minimum size). */
const buildStarterPng = (width = 64, height = 64) => {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = row + 1 + x * 4;
      raw[i] = 245;
      raw[i + 1] = 245;
      raw[i + 2] = 250;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};

const STARTER_PNG = buildStarterPng();

const getHfToken = () => getEnv("HF_TOKEN", "HUGGINGFACE_TOKEN", "HUGGING_FACE_TOKEN");

const ensureUploadsDir = async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
};

const withTimeout = (promise, ms, message) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(message), { code: "ETIMEDOUT" })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const toImageBuffer = async (image) => {
  if (!image) {
    throw ApiError.internal("Empty response from image generation provider.");
  }

  if (Buffer.isBuffer(image)) {
    if (image.length === 0) throw ApiError.internal("Empty image buffer received.");
    return image;
  }

  if (image instanceof ArrayBuffer) {
    const buf = Buffer.from(image);
    if (buf.length === 0) throw ApiError.internal("Empty image buffer received.");
    return buf;
  }

  if (ArrayBuffer.isView(image)) {
    const buf = Buffer.from(image.buffer, image.byteOffset, image.byteLength);
    if (buf.length === 0) throw ApiError.internal("Empty image buffer received.");
    return buf;
  }

  if (typeof image.arrayBuffer === "function") {
    const ab = await image.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length === 0) throw ApiError.internal("Empty image buffer received.");
    return buf;
  }

  throw ApiError.internal("Unsupported image response format from provider.");
};

const isImageToImageOnlyError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("image-to-image") && message.includes("not supported for task text-to-image");
};

const mapHuggingFaceError = (error) => {
  const status = error?.status ?? error?.statusCode ?? error?.response?.status;
  const message = error?.message || "Image generation failed.";
  const lower = String(message).toLowerCase();

  if (error?.code === "ETIMEDOUT" || lower.includes("timeout") || lower.includes("timed out")) {
    return new ApiError(504, "Image generation timed out. Please try again.");
  }

  if (
    status === 401 ||
    status === 403 ||
    lower.includes("unauthorized") ||
    lower.includes("invalid token") ||
    lower.includes("invalid api")
  ) {
    return new ApiError(401, "Invalid or unauthorized Hugging Face API token.");
  }

  if (
    status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("depleted your monthly included credits") ||
    lower.includes("purchase pre-paid credits")
  ) {
    return new ApiError(429, "Hugging Face rate limit / credits exhausted. Please try again later.");
  }

  if (
    status === 400 ||
    lower.includes("invalid prompt") ||
    lower.includes("validation") ||
    lower.includes("nsfw")
  ) {
    return ApiError.badRequest(message);
  }

  if (
    lower.includes("fetch failed") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    error?.code === "ECONNREFUSED" ||
    error?.code === "ENOTFOUND"
  ) {
    return new ApiError(502, "Network failure while contacting Hugging Face.");
  }

  return new ApiError(status && status >= 400 ? status : 500, message || "Internal server error");
};

const runTextToImage = (client, { provider, model, prompt }) =>
  client.textToImage({
    provider,
    model,
    inputs: prompt,
  });

const runImageToImage = (client, { provider, model, prompt }) => {
  const starter = new Blob([STARTER_PNG], { type: "image/png" });
  return client.imageToImage({
    provider,
    model,
    inputs: starter,
    parameters: { prompt },
  });
};

/**
 * Generate an image from a prompt via Hugging Face Inference API,
 * save it under /uploads as PNG, and return a public URL.
 */
export const generateAndSaveImage = async (prompt) => {
  const token = getHfToken();
  if (!token) {
    throw new ApiError(500, "HF_TOKEN is not configured on the server.");
  }

  const startedAt = Date.now();
  let model = HF_IMAGE_MODEL;
  const provider = HF_IMAGE_PROVIDER;

  logger.info(`HF image generation started | model=${model} | prompt="${prompt.slice(0, 200)}"`);

  try {
    const client = new InferenceClient(token);
    let rawImage;

    try {
      rawImage = await withTimeout(
        runTextToImage(client, { provider, model, prompt }),
        DEFAULT_TIMEOUT_MS,
        "Hugging Face image generation timed out"
      );
    } catch (primaryError) {
      if (isImageToImageOnlyError(primaryError)) {
        logger.warn(
          `HF text-to-image unavailable for ${model}; retrying via image-to-image with starter canvas.`
        );
        try {
          rawImage = await withTimeout(
            runImageToImage(client, { provider, model, prompt }),
            DEFAULT_TIMEOUT_MS,
            "Hugging Face image generation timed out"
          );
        } catch (i2iError) {
          logger.warn(
            `HF image-to-image failed for ${model}; falling back to ${HF_IMAGE_FALLBACK_MODEL}. ${i2iError.message}`
          );
          model = HF_IMAGE_FALLBACK_MODEL;
          rawImage = await withTimeout(
            runTextToImage(client, { provider, model, prompt }),
            DEFAULT_TIMEOUT_MS,
            "Hugging Face image generation timed out"
          );
        }
      } else {
        logger.warn(
          `HF primary model failed (${primaryError.message}); falling back to ${HF_IMAGE_FALLBACK_MODEL}.`
        );
        model = HF_IMAGE_FALLBACK_MODEL;
        rawImage = await withTimeout(
          runTextToImage(client, { provider, model, prompt }),
          DEFAULT_TIMEOUT_MS,
          "Hugging Face image generation timed out"
        );
      }
    }

    const buffer = await toImageBuffer(rawImage);
    await ensureUploadsDir();

    const filename = `${uuidv4()}.png`;
    const absolutePath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(absolutePath, buffer);

    const imageUrl = `${getApiUrl()}/uploads/${filename}`;
    const durationMs = Date.now() - startedAt;

    logger.info(
      `HF image generation succeeded | model=${model} | durationMs=${durationMs} | file=${filename}`
    );

    return {
      imageUrl,
      filename,
      absolutePath,
      model,
      provider: "huggingface",
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error(
      `HF image generation failed | model=${model} | durationMs=${durationMs} | error=${error.message}`
    );
    if (error.stack) logger.error(error.stack);

    if (error instanceof ApiError) throw error;
    throw mapHuggingFaceError(error);
  }
};

export const getUploadsDir = () => UPLOADS_DIR;
