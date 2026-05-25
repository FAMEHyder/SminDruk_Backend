import axios from "axios";
import ConnectedPage from "../models/ConnectedPage.model.js";
import { decrypt, encrypt } from "../utils/encrypt.js";

export const rotateFacebookToken = async (req, res) => {
  try {
    const { pageId } = req.params;

    // 1️⃣ Get page from DB
    const page = await ConnectedPage.findOne({ pageId });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    // 2️⃣ Decrypt USER access token
    const userToken = decrypt(page.userAccessToken);

    if (!userToken) {
      return res.status(400).json({
        success: false,
        message: "User token missing or invalid",
      });
    }

    const APP_ID = process.env.FB_APP_ID;
    const APP_SECRET = process.env.FB_APP_SECRET;

    // 3️⃣ Exchange USER token → new long-lived token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: userToken,
        },
      }
    );

    const newLongUserToken = tokenRes.data.access_token;

    if (!newLongUserToken) {
      throw new Error("Failed to refresh user token");
    }

    // 4️⃣ Get updated pages (with fresh page tokens)
    const pagesRes = await axios.get(
      "https://graph.facebook.com/v19.0/me/accounts",
      {
        params: {
          access_token: newLongUserToken,
        },
      }
    );

    const pages = pagesRes.data.data || [];

    const updatedPage = pages.find((p) => p.id === pageId);

    if (!updatedPage) {
      return res.status(404).json({
        success: false,
        message: "Page not found in Facebook account",
      });
    }

    // 5️⃣ Fixed expiry (60 days from now)
    const addDays = (date, days) =>
      new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

    const tokenIssuedAt = new Date();
    const tokenExpiresAt = addDays(tokenIssuedAt, 60);

    // 6️⃣ Update DB
    page.userAccessToken = encrypt(newLongUserToken);
    page.pageAccessToken = encrypt(updatedPage.access_token);
    page.tokenIssuedAt = tokenIssuedAt;
    page.tokenExpiresAt = tokenExpiresAt;

    await page.save();

    // 7️⃣ Response
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        pageName: page.pageName,
        issuedAt: tokenIssuedAt,
        expiresAt: tokenExpiresAt,
      },
    });

  } catch (error) {
    console.error(
      "Token Rotation Error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Token rotation failed",
      error: error.response?.data || error.message,
    });
  }
};