import { Router } from "express";
import {
  changeCurrentPassword,
  findUserSubscriber,
  getCurrentUserDetails,
  getWatchHistory,
  loginUser,
  logoutUser,
  reGenerateAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // This is the multer middleware
  // This help us to sotre files into local and gives and url
  // that we can use to upload cloudinary
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

// router for login the user
// it will also be a post method because we are taking information about a user
router.route("/login").post(loginUser);

// for logout a user here we will use middleware for verify that the user was logged in or not
// Basically we will check that the user was authorized or not
router.route("/logout").post(verifyJWT, logoutUser);

// router for regenerate access token
router.route("/refresh-token").post(reGenerateAccessToken);

// updating user details fields
router.route("/update-password").post(verifyJWT, changeCurrentPassword);

// get current user details
router.route("/current-user").post(verifyJWT, getCurrentUserDetails);

// update account details
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// route for getting the user subscriber
router.route("/c/:username").get(verifyJWT, findUserSubscriber);

// for getting the watch history
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
