import PagePost from "../models/PagePost.model.js";
import ConnectedPage from "../models/ConnectedPage.model.js";

export const getAllPosts = async (req, res) => {
  try {

    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({
        success: false,
        message: "Secret key required",
      });
    }

    const posts = await PagePost.find({ secretKey })
      .sort({ createdAt: -1 });

    const pageIds = posts.map(p => p.pageId);

    const pages = await ConnectedPage.find({
      pageId: { $in: pageIds }
    });

    // DEBUG (remove later)
    console.log("POST PAGE IDS:", pageIds);
    console.log("PAGES FOUND:", pages.length);

    const pageMap = new Map();

    pages.forEach(page => {
      pageMap.set(page.pageId.toString(), page);
    });

    const finalPosts = posts.map(post => {

      const page = pageMap.get(post.pageId?.toString());

      return {
        ...post._doc,

        pageName: page?.pageName || "Unknown Page",

        // 🔥 THIS IS YOUR REAL DP FIELD
        pageDp: page?.profilePicture || "https://via.placeholder.com/50",
      };
    });

    res.status(200).json({
      success: true,
      posts: finalPosts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};