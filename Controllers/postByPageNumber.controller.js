import axios from "axios";
import fs from "fs";
import FormData from "form-data";

import Page from "../models/ConnectedPage.model.js";
import PagePost from "../models/PagePost.model.js";
import { decrypt } from "../utils/encrypt.js";

const waitRandom = () =>
  new Promise((r) =>
    setTimeout(r, Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000)
  );

export const postByPageNumber = async (req, res) => {
  try {
    const { content, fromPage, toPage, secretKey, postType } = req.body;
    const media = req.file;

    if (!content || !fromPage || !toPage || !secretKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const pages = await Page.find({}).sort({ pageNumber: 1 });

    const selectedPages = pages.filter(
      (p) =>
        p.pageNumber >= Number(fromPage) &&
        p.pageNumber <= Number(toPage)
    );

    const total = selectedPages.length;

    for (let i = 0; i < total; i++) {
      const page = selectedPages[i];

      let token;

      try {
        token = decrypt(page.pageAccessToken);
      } catch (err) {
        res.write(JSON.stringify({
          progress: i + 1,
          total,
          data: {
            success: false,
            pageId: page.pageId,
            error: "Token decrypt failed",
          },
        }) + "\n");
        continue;
      }

      try {
        let fbResponse;

        // =========================
        // 📸 PHOTO POST
        // =========================
        if (postType === "photo" && media) {
          const form = new FormData();
          form.append("source", fs.createReadStream(media.path));
          form.append("caption", content);
          form.append("access_token", token);

          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/photos`,
            form,
            { headers: form.getHeaders() }
          );
        }

        // =========================
        // 🎬 REEL POST (FIXED)
        // =========================
        else if (postType === "reel" && media) {
          const form = new FormData();
          form.append("source", fs.createReadStream(media.path));
          form.append("access_token", token);

          // 🔥 FIX: correct endpoint stability
          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/videos`,
            form,
            { headers: form.getHeaders() }
          );
        }

        // =========================
        // 📖 STORY POST (FIXED APPROACH)
        // =========================
        else if (postType === "story" && media) {
          const form = new FormData();
          form.append("source", fs.createReadStream(media.path));
          form.append("access_token", token);

          // 🔥 FIX: use photos endpoint fallback (most stable method)
          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/photos`,
            form,
            { headers: form.getHeaders() }
          );
        }

        // =========================
        // 📝 TEXT POST
        // =========================
        else {
          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/feed`,
            {
              message: content,
              access_token: token,
            }
          );
        }

        const postId = fbResponse.data.id;
        const postLink = `https://www.facebook.com/${postId}`;

        await PagePost.create({
          pageName:page.pageName,
          pageId: page.pageId,
          postId,
          postLink,
          secretKey,  
        });

        res.write(
          JSON.stringify({
            progress: i + 1,
            total,
            data: {
              success: true,
              pageId: page.pageId,
              postId,
              postLink,
            },
          }) + "\n"
        );

      } catch (error) {
        res.write(
          JSON.stringify({
            progress: i + 1,
            total,
            data: {
              success: false,
              pageId: page.pageId,
              error:
                error.response?.data?.error?.message || error.message,
            },
          }) + "\n"
        );
      }

      await waitRandom();
    }

    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};