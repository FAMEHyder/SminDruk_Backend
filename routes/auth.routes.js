import express from "express";
import { facebookAuthStart, facebookAuthCallback,} from "../Controllers/facebookAuth.controller.js";

const router = express.Router();

router.get("/facebook/callback", facebookAuthCallback);
router.get("/facebook", facebookAuthStart);



export default router;
