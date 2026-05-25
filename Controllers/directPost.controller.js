// import axios from "axios";
// import fs from "fs";
// import FormData from "form-data";
// import Page from "../models/ConnectedPage.model.js";
// import { decrypt } from "../utils/encrypt.js";

// export const directPost = async (req, res) => {
//   try {
//     const { caption, postType } = req.body;
//     const media = req.file;

//     const pageIds = JSON.parse(req.body.pages);

//     if (!Array.isArray(pageIds) || pageIds.length === 0) {
//       return res.status(400).json({ message: "Pages required" });
//     }

//     const pagesFromDB = await Page.find({
//       pageId: { $in: pageIds }
//     }).select("pageId pageAccessToken pageName");

//     if (!pagesFromDB.length) {
//       return res.status(404).json({ message: "Pages not found in DB" });
//     }

//     const results = [];

//     for (const page of pagesFromDB) {
//       const token = decrypt(page.pageAccessToken);

//       try {
//         let fbResponse;

//         // 🔹 TEXT POST
//         if (!media) {
//           fbResponse = await axios.post(
//             `https://graph.facebook.com/v19.0/${page.pageId}/feed`,
//             { message: caption },
//             { params: { access_token: token } }
//           );
//         }

//         // 🔹 IMAGE POST
//         else if (postType === "image") {
//           const form = new FormData();
//           form.append("source", fs.createReadStream(media.path));
//           form.append("caption", caption);
//           form.append("access_token", token);

//           fbResponse = await axios.post(
//             `https://graph.facebook.com/v19.0/${page.pageId}/photos`,
//             form,
//             { headers: form.getHeaders() }
//           );
//         }

//         // 🔹 VIDEO POST
//         else if (postType === "video") {
//           const form = new FormData();
//           form.append("source", fs.createReadStream(media.path));
//           form.append("description", caption);
//           form.append("access_token", token);

//           fbResponse = await axios.post(
//             `https://graph.facebook.com/v19.0/${page.pageId}/videos`,
//             form,
//             { headers: form.getHeaders() }
//           );
//         }

//         results.push({
//           pageId: page.pageId,
//           pageName: page.pageName,
//           success: true,
//           postId: fbResponse?.data?.id
//         });

//       } catch (error) {
//         results.push({
//           pageId: page.pageId,
//           pageName: page.pageName,
//           success: false,
//           error: error.response?.data || error.message
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Post process completed",
//       results
//     });

//   } catch (err) {
//     console.error("Direct Post Error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };











import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import Page from "../models/ConnectedPage.model.js";
import { decrypt } from "../utils/encrypt.js";

export const directPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const media = req.file;

    console.log("Incoming media:", media);
    console.log("Incoming postType:", req.body.postType);

    const pageIds = JSON.parse(req.body.pages);

    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      return res.status(400).json({ message: "Pages required" });
    }

    const pagesFromDB = await Page.find({
      pageId: { $in: pageIds }
    }).select("pageId pageAccessToken pageName");

    if (!pagesFromDB.length) {
      return res.status(404).json({ message: "Pages not found" });
    }

    const results = [];

    for (const page of pagesFromDB) {
      const token = decrypt(page.pageAccessToken);

      try {
        let fbResponse;

        // ✅ If file exists → PHOTO POST
        if (media) {
          const form = new FormData();
          form.append("source", fs.createReadStream(media.path));
          form.append("caption", caption);
          form.append("access_token", token);

          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/photos`,
            form,
            { headers: form.getHeaders() }
          );
        } 
        // ✅ Otherwise → TEXT POST
        else {
          fbResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${page.pageId}/feed`,
            { message: caption },
            { params: { access_token: token } }
          );
        }

        results.push({
          pageId: page.pageId,
          success: true,
          postId: fbResponse.data.id
        });

      } catch (error) {
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








