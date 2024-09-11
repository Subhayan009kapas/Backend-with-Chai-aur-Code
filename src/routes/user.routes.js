import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewarses/multer.middleware.js";
import { verifyJWT } from "../middlewarses/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes (Logout)
router.route("/logout").post(verifyJWT, logoutUser);

// Generate refresh Token
router.route("/refresh-token").post(refreshAccessToken);

// route for change password
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// route for current -user
router.route("/current-user").get(verifyJWT, getCurrentUser);

// update account details
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// update avater

router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// update cover image

router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);

//update userprofile

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

// user watch histoy
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
