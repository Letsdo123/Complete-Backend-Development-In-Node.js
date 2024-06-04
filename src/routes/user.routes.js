import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logoutUser,
  reGenerateAccessToken,
  registerUser,
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

export default router;
