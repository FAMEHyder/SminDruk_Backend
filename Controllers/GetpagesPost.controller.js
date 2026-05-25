import axios from "axios";
import Page from "../models/ConnectedPage.model.js";
import { decrypt } from "../utils/encrypt.js";

export const getUserAllPagesPosts = async (req, res) => {
  try {
    const { userId, pageName, pageId, after } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // 🔍 STEP 1: FIND PAGES
    let query = { userId };

    if (pageId) {
      query.pageId = pageId;
    }

    if (pageName) {
      query.pageName = {
        $regex: pageName,
        $options: "i",
      };
    }

    const pages = await Page.find(query);

    if (!pages.length) {
      return res.status(404).json({
        success: false,
        message: "No matching pages found",
      });
    }

    let allPosts = [];
    let pagingInfo = null;

    // 🔥 STEP 2: FETCH POSTS FROM EACH PAGE
    for (const page of pages) {
      let pageAccessToken;

      try {
        pageAccessToken = decrypt(page.pageAccessToken);
      } catch (err) {
        console.log(`Token decrypt failed for page ${page.pageId}`);
        continue;
      }

      try {
        const response = await axios.get(
          `https://graph.facebook.com/v23.0/${page.pageId}/feed`,
          {
            params: {
              fields:
                "id,message,created_time,permalink_url,full_picture,shares,comments.summary(true),likes.summary(true)",
              access_token: pageAccessToken,
              limit: 10,
              after: after || undefined, // pagination cursor
            },
          }
        );

        const posts = (response.data.data || []).map((post) => ({
          ...post,
          pageId: page.pageId,
          pageName: page.pageName,
        }));

        allPosts.push(...posts);

        // keep paging from last valid response
        if (response.data.paging) {
          pagingInfo = response.data.paging;
        }
      } catch (err) {
        console.log(
          `Page error ${page.pageId}:`,
          err.response?.data || err.message
        );
      }
    }

    // 🔥 STEP 3: SORT LATEST FIRST
    allPosts.sort(
      (a, b) =>
        new Date(b.created_time) - new Date(a.created_time)
    );

    return res.status(200).json({
      success: true,
      total: allPosts.length,
      pagesMatched: pages.length,
      posts: allPosts,
      paging: pagingInfo || null,
    });

  } catch (error) {
    console.log("Server Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};