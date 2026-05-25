// import { postQueue } from "../queues/postQueue.js";
// import ScheduledPost from "../models/ScheduledPost.model.js";

// export const schedulePost = async (req, res) => {
//   try {
//     const {
//       text,
//       type,
//       pages,
//       scheduledAt,
//       hashtags,
//       firstComment,
//     } = req.body;

//     // ✅ FIX pages type
//     const parsedPages =
//       typeof pages === "string" ? JSON.parse(pages) : pages;

//     // ✅ FIX media
//     let mediaData = [];
//     if (req.files?.length) {
//       mediaData = req.files.map(file => ({
//         url: file.path.replace(/\\/g, "/"),
//         type: file.mimetype.startsWith("image") ? "image" : "video",
//       }));
//     }

//     const post = await ScheduledPost.create({
//       text,
//       type,
//       pages: parsedPages,
//       scheduledAt,
//       hashtags,
//       firstComment,
//       media: mediaData,
//     });

//     const delay = new Date(scheduledAt).getTime() - Date.now();

//     await postQueue.add(
//       "publish-post",
//       { postId: post._id.toString() },
//       {
//         delay: Math.max(delay, 0),
//         attempts: 3,
//         backoff: {
//           type: "exponential",
//           delay: 60_000,
//         },
//       }
//     );

//     console.log("✅ Job added to queue:", post._id);

//     res.json({ success: true, postId: post._id });
//   } catch (err) {
//     console.error("❌ Schedule error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
