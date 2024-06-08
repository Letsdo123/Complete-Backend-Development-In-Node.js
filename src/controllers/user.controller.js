import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// creating a method that will generate access and refresh token when required
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefershToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    // remove the validation just for savig the particular area
    // or updating something
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //     message:"I have successfully send a post request"
  // })

  // Steps to register a new user
  // get the user detsils from the frontend
  // vslidation - not empty
  // check if user already exists : username,email
  // check for images,check for avatar
  // upload them to coludinary, avatar
  // create user object - create entry in db
  // remove password and refresh token filed from response
  // check for user creation
  // return res

  // data can come in different into server from the frontend
  // in the form of json,url,form
  const { fullName, email, username, password } = req.body;
  console.log("email:", email);
  console.log("fullName: ", fullName);

  // checking the validation
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // checking user is exists or not using username and email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or emailname already exist");
  }

  // handling the files using the middleware
  // that we have already introduced in user router
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  console.log("Avatarlocal File Path:", req.files);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // checking the avatar is successfully uploaded on cloudinary or not
  if (!avatar) {
    throw new ApiError(400, "Some problem while uploading files in clodinary");
  }

  // Usercreation in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // checking that user is created or not in databse
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong when registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registred successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Algorithm to make login a user

  // req body -> data
  // username or email
  // find the user
  // if user password check
  // generate access and refresh token
  // send them inside the secure cookies
  const { email, username, password } = req.body;

  if (!email && !username)
    throw new ApiError(404, "email or username is required");
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // if no user find from the databse
  if (!user) throw new ApiError(404, "User doesn't exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(404, "Password is incorrect");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // now refreshtoken and accesstoken is already generated and saved in mongodb
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const loggedOutUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // Unset the refreshToken field
      },
    },
    {
      new: true,
    }
  );
  console.log("loggedout user details", loggedOutUser);
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout successfully"));
});

// generate refresh token
const reGenerateAccessToken = asyncHandler(async (req, res) => {
  // This is the encrypted refresh-token
  console.log(req);
  const incomingRefershToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log("Incoming refreshtoken:", incomingRefershToken);
  if (!incomingRefershToken) throw new ApiError(404, "Refreshtoken not found");

  try {
    // decrypting the refresh-token
    const decodedToken = await jwt.verify(
      incomingRefershToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken)
      throw new ApiError(401, "Refresh token is experied or used");
    const user = await User.findById(decodedToken._id);
    if (incomingRefershToken !== user?.refreshToken)
      throw new ApiError(401, "Unautorized access");

    // everything is done properly
    // let's generate refresh-token and access-token
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // options
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(505, error?.message || "Invalid refresh token");
  }
});

// update user details
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // taking the details
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswrodCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswrodCorrect) throw new ApiError(404, "Password is Incorrect");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changes successfully"));
});

// get current user details if user is active
const getCurrentUserDetails = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Retrived user details successfully"));
});

// update current user (text data   )
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  // checkiing that if anyone is not there throw error
  if (!email || !fullName) {
    throw new ApiError(404, "Email and FullName both are required");
  }

  // find the user and update the details
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  // return the response
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updayed successfully"));
});

// update avatar (files)
// Basically this is an example of how to updates files to db
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath)
    throw new ApiError(404, "Files is not updated properly");
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) throw new ApiError(400, "Error while uploading on avatar");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image sucessfully updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log("The cover image local path:", coverImageLocalPath);
  if (!coverImageLocalPath)
    throw new ApiError(404, "Coverimage files is missing");
  const coverImage = await uploadOnCloudinary(coverImage);

  if (!coverImage.url)
    throw new ApiError(400, "Error while uploading on cover image");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      // This is the mongodb operator
      // This is how we can do multiple operation like set delete or etc using the mongodb operator
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage image sucessfully updated"));
});

// learning aggregation pipeline of mongodb
const findUserSubscriber = asyncHandler(async (req, res) => {
  // const {username} = req.params;
  const username = "teset1122";
  console.log("Params in request", req);
  if (!username) throw new ApiError(404, "Username is missing");
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // lookup is basically searching from another document in mongodb atlas
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannelCount",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribersCount",
      },
    },
    {
      $addFields: {
        subscribedChannelCount: {
          $size: "$subscribedChannelCount",
        },
        subscribersCount: {
          $size: "$subscribersCount",
        },
        isSubscribed: {
          $cond: {
            // in can search from both object and array
            if: { $in: [req.user?._id, "$subscribersCount.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        subscribedChannelCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  console.log("Filtered channel", channel);
  if (!channel?.length) throw new ApiError(404, "channel does not exist");

  // returning the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  console.log(user);

  console.log("User details", user);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Fected watch history successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  reGenerateAccessToken,
  changeCurrentPassword,
  getCurrentUserDetails,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  findUserSubscriber,
  getWatchHistory,
};
