import axios from "axios";
import crypto from "crypto";
import ConnectedPage from "../models/ConnectedPage.model.js";
import { encrypt } from "../utils/encrypt.js";

// ======================================================
// 🔹 1. FACEBOOK AUTH START
// ======================================================
export const facebookAuthStart = (req, res) => {
  try {
    const redirectUri = `${process.env.API_URL}/api/auth/facebook/callback`;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    const stateData = encodeURIComponent(
      JSON.stringify({
        userId,
        nonce: crypto.randomUUID(),
      })
    );

    const fbUrl =
      "https://www.facebook.com/v19.0/dialog/oauth" +
      `?client_id=${process.env.FB_APP_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=` +
      [
        "pages_read_engagement",
        "pages_manage_engagement",
        "pages_manage_posts",
        "pages_show_list",
      ].join(",") +
      `&response_type=code` +
      `&state=${stateData}`;

    return res.redirect(fbUrl);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to start Facebook auth",
    });
  }
};

// ======================================================
// 🔹 2. FACEBOOK AUTH CALLBACK (PAGES ONLY)
// ======================================================
export const facebookAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "Missing code or state",
      });
    }

    // ======================================================
    // Decode state
    // ======================================================
    let userId;
    try {
      const parsed = JSON.parse(decodeURIComponent(state));
      userId = parsed.userId;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid state",
      });
    }

    const redirectUri = `${process.env.API_URL}/api/auth/facebook/callback`;

    // ======================================================
    // 1️⃣ SHORT TOKEN
    // ======================================================
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const shortToken = tokenRes.data.access_token;

    // ======================================================
    // 2️⃣ LONG TOKEN
    // ======================================================
    const longTokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.FB_APP_ID,
          client_secret: process.env.FB_APP_SECRET,
          fb_exchange_token: shortToken,
        },
      }
    );

    const longUserToken = longTokenRes.data.access_token;

    // ======================================================
    // 3️⃣ GET PAGES WITH PROFILE PICTURE
    // ======================================================
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v19.0/me/accounts",
      {
        params: {
          access_token: longUserToken,
          fields: "id,name,picture{url},access_token",
        },
      }
    );

    const pages = pagesRes.data.data || [];

    if (!pages.length) {
      console.warn("⚠️ No pages found");
    }

    // ======================================================
    // 4️⃣ SAVE / UPDATE PAGES
    // ======================================================
    for (const page of pages) {
      const tokenIssuedAt = new Date();

      const tokenExpiresAt = new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      );

      const existingPage = await ConnectedPage.findOne({
        userId,
        pageId: page.id,
      });

      const pageProfilePic = page.picture?.data?.url || null;

      if (existingPage) {
        // UPDATE
        existingPage.pageName = page.name;
        existingPage.pageAccessToken = encrypt(page.access_token);

        existingPage.profilePicture = pageProfilePic;

        existingPage.userAccessToken = encrypt(longUserToken);

        existingPage.tokenIssuedAt = tokenIssuedAt;
        existingPage.tokenExpiresAt = tokenExpiresAt;

        await existingPage.save();
      } else {
        // CREATE
        await ConnectedPage.create({
          userId,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: encrypt(page.access_token),

          profilePicture: pageProfilePic,

          userAccessToken: encrypt(longUserToken),

          tokenIssuedAt,
          tokenExpiresAt,
        });
      }
    }

    // ======================================================
    // SUCCESS
    // ======================================================
    return res.redirect(
      `${process.env.FRONTEND_URL}/Profile?fb=connected`
    );

  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.error?.message || error.message,
    });
  }
};