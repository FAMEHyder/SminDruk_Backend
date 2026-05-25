
import express from "express";
import { getConnectedFacebookPages, getPagesbyuserId} from "../Controllers/facebookPages.controller.js";
// import { schedulePost } from "../Controllers/schedule.controller.js";
import upload from "../utils/multer.js"; 
import { directPost, } from "../Controllers/directPost.controller.js";
import { postByPageNumber } from "../Controllers/postByPageNumber.controller.js";
import { rotateFacebookToken } from "../Controllers/rotateTokens.controller.js";
import {getAllPosts} from "../Controllers/getlink.controller.js"
import {getUserAllPagesPosts} from "../Controllers/GetpagesPost.controller.js"
const router = express.Router();



router.get("/facebook", getConnectedFacebookPages);
router.get("/facebook/getPagesbyuserId", getPagesbyuserId);
router.post("/facebook/rotatenow/:pageId",rotateFacebookToken );
router.post("/directFacebook/post-photo", upload.single("media"), directPost);
router.post("/postByPageNumber/post-photo", upload.single("media"), postByPageNumber);
// router.post("/facebook/schedule", upload.array("media", 5), schedulePost);
router.post("/posts", getAllPosts);
router.get("/page-posts", getUserAllPagesPosts);


export default router;


