import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router();

// Define the POST route correctly
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "images", maxCount: 5 },
    ]),
    registerUser
);

export default router;
