import ConnectedPage from "../models/ConnectedPage.model.js";

export const getConnectedFacebookPages = async (req, res) => {

  console.log("apna naam" ,req)
  try {
    const pages = await ConnectedPage.find({
      platform: "facebook",
    }).select("pageId pageName");

    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: "Failed to load pages" });
  }
};



export const getPagesbyuserId = async (req, res, next) => {
  try {
    const { userId } = req.query;

    // 🔍 Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // 🔎 Fetch pages for this user
    const pages = await ConnectedPage.find({ userId });

    return res.status(200).json({
      success: true,
      count: pages.length,
      pages,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
