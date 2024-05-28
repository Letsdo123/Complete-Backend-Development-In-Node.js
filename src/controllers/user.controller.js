import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
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
    const {fullName,email,username,password} = req.body;
    console.log("email:",email);
    console.log("fullName: ",fullName);
 
    // checking the validation
    if([fullName,email,username,password].some((field)=>field?.trim()===""))
    {
        throw new ApiError(400,"All fields are required");
    }

    // checking user is exists or not using username and email
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or emailname already exist");
    }

    // handling the files using the middleware
    // that we have already introduced in user router
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    console.log("Avatarlocal File Path:",req.files);
    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    // checking the avatar is successfully uploaded on cloudinary or not
    if(!avatar)
    {
        throw new ApiError(400,"Some problem while uploading files in clodinary");
    }

    // Usercreation in db
    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    // checking that user is created or not in databse
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong when registering the user");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registred successfully")
    );
})

export {registerUser}