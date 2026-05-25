import { Worker } from "bullmq";
import Redis from "ioredis";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// ============================================
// ✅ Redis Connection (LOCAL DOCKER REDIS)
// ============================================

const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

// ============================================
// ✅ Helper: Check File Exists
// ============================================

const fileExists = (path) => {
  try {
    return fs.existsSync(path);
  } catch {
    return false;
  }
};

// ============================================
// ✅ FACEBOOK PHOTO POST
// ============================================

const postPhoto = async (pageId, token, caption, mediaPath) => {
  if (!fileExists(mediaPath)) {
    throw new Error("Media file not found");
  }

  const form = new FormData();

  form.append("caption", caption || "");
  form.append("access_token", token);
  form.append("source", fs.createReadStream(mediaPath));

  const url = `https://graph.facebook.com/v19.0/${pageId}/photos`;

  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
  });

  console.log("📘 Facebook Photo Response:", res.data);

  if (!res.data?.id) {
    throw new Error("Facebook did not return post ID");
  }

  return res.data;
};

// ============================================
// ✅ FACEBOOK VIDEO POST
// ============================================

const postVideo = async (pageId, token, caption, mediaPath) => {
  if (!fileExists(mediaPath)) {
    throw new Error("Media file not found");
  }

  const form = new FormData();

  form.append("description", caption || "");
  form.append("access_token", token);
  form.append("source", fs.createReadStream(mediaPath));

  const url = `https://graph.facebook.com/v19.0/${pageId}/videos`;

  const res = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  console.log("🎬 Facebook Video Response:", res.data);

  if (!res.data?.id) {
    throw new Error("Facebook did not return video ID");
  }

  return res.data;
};

// ============================================
// ✅ MAIN WORKER
// ============================================

const worker = new Worker(
  "facebook-posts",
  async (job) => {
    const { caption, postType, pages, mediaPath } = job.data;

    console.log("\n🚀 Processing Facebook Job");
    console.log("📄 Pages Count:", pages.length);
    console.log("📝 Caption:", caption);

    for (const page of pages) {
      try {
        console.log(`\n📤 Posting to Page: ${page.pageName}`);

        let response;

        // ===== PHOTO =====
        if (postType === 0) {
          response = await postPhoto(
            page.pageId,
            page.pageAccessToken,
            caption,
            mediaPath
          );
        }

        // ===== VIDEO / REEL / STORY =====
        if (postType === 1 || postType === 2) {
          response = await postVideo(
            page.pageId,
            page.pageAccessToken,
            caption,
            mediaPath
          );
          console.log(`✅ Successfully Posted`);
        }


      } catch (err) {
        console.log(`❌ Failed Posting to ${page.pageName}`);

        if (err.response?.data) {
          console.log("FB ERROR:", err.response.data);
        } else {
          console.log("ERRORS:", err.message);
        }
      }
    }

    // ====================================
    // OPTIONAL: Delete Media After Posting
    // ====================================
    try {
      if (mediaPath && fileExists(mediaPath)) {
        fs.unlinkSync(mediaPath);
        console.log("🧹 Media file deleted");
      }
    } catch {
      console.log("⚠️ Could not delete media file");
    }
  },
  { connection }
);

// ============================================
// ✅ Worker Events
// ============================================

worker.on("completed", (job) => {
  console.log(`\n🎉 Job ${job.id} COMPLETED\n`);
});

worker.on("failed", (job, err) => {
  console.log(`\n💥 Job ${job.id} FAILED`);
  console.log(err.message);
});
