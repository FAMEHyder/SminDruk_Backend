export const directPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const media = req.file;

    console.log("MEDIA:", media);

    const pageIds = JSON.parse(req.body.pages);

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({ message: "Pages required" });
    }

    const pagesFromDB = await Page.find({
      pageId: { $in: pageIds }
    }).select("pageId pageAccessToken pageName");

    const results = [];

    for (const page of pagesFromDB) {
      const token = decrypt(page.pageAccessToken);

      try {
        let fbResponse;

        // ======================
        // PHOTO/VIDEO POST
        // ======================
        if (media?.path) {

          const form = new FormData();

          form.append(
            "source",
            fs.createReadStream(media.path),
            {
              filename: media.filename
            }
          );

          form.append("caption", caption || "");
          form.append("access_token", token);

          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/photos`,
            form,
            {
              headers: {
                ...form.getHeaders()
              },
              maxBodyLength: Infinity,
              maxContentLength: Infinity
            }
          );

        } 
        // ======================
        // TEXT POST
        // ======================
        else {
          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/feed`,
            { message: caption },
            {
              params: { access_token: token }
            }
          );
        }

        results.push({
          pageId: page.pageId,
          success: true,
          postId: fbResponse.data.id
        });

      } catch (error) {
        console.log("FB ERROR:", error.response?.data || error.message);

        results.push({
          pageId: page.pageId,
          success: false,
          error: error.response?.data || error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (err) {
    console.error("Direct Post Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};