import { Router } from "express";

import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getChannelUserProfile,
    getWatchHistory
} 
    from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Ensure verifyJWT is imported if used

const router = Router();

// Register route
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

// Login route
router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("change-password").post(verifyJWT, changePassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);

router.route("/update-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
);

router.route("/:username").get(verifyJWT, getChannelUserProfile);

router.route("/watch-history").get(verifyJWT, getWatchHistory);



export default router;