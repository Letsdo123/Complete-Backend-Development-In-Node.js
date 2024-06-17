import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

// These are the fields in video models
// videoFile,thumbnail,title,description,duration,views,isPublished,owner

// Function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
    const regex = /\/v\d+\/([^\.]+)\./;
    const match = url.match(regex);
    return match ? match[1] : null;
};

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    console.log("Requested file:",req.files);
    // console.log("Requested information", title, description);
    // getting the video file
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    console.log("Local video file usrl:",videoFileLocalPath);
    if (!videoFileLocalPath)
        throw new ApiError(404, "Video file is missing...");

    // getting the thumbnail for the video
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath)
        throw new ApiError(404, "Thumbnail file is missing...");

    // upload both the video to the clodinary
    const videoFileResponse = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFileResponse)
        throw new ApiError(
            500,
            "some problem occurs when uploading the video file into the server"
        );
    const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailResponse)
        throw new ApiError(
            500,
            "some problem occurs when uploading the thumbnail into the server"
        );

    // convert time that is into second we have to convert it into hour:minutes:second
    const videoLength = videoFileResponse.duration;
    console.log(videoLength);

    // now creating a video document and pushing the data into it
    const video = await Video.create({
        videoFile: videoFileResponse.url,
        thumbnail: thumbnailResponse.url,
        title,
        description,
        duration: videoLength,
        owner: req.user?._id,
    });
    console.log("The created video is", video);
    const createVideo = await Video.findById(video._id);
    if (!createVideo)
        throw new ApiError(
            500,
            "something went wrong while storing the data into db"
        );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                createVideo,
                "Video has been uploaded successfully"
            )
        );
    // console.log("User id", req.user?._id);
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    // console.log("Video details", video);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // make a query to retrive all the old data from the video id
    const video = await Video.findById(videoId);

    // These are the ilne for testing
    /* console.log("Video information", video);
    console.log("Video owner", video.owner);
    console.log("User Id", req.user._id); */

    if (video.owner.toString() !== req.user._id.toString())
        throw new ApiError(
            404,
            "Unauthorized access, you don't have this permission to update this data"
        );

    // updated fileds thats need to be update
    const { title, description } = req.body;

    // taking the thumbnail localPath
    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath)
        throw new ApiError(404, "Thumbnail image is not found");

    // upload the file into cloudinary
    const thumbnailUpdatedResponse =
        await uploadOnCloudinary(thumbnailLocalPath);
    let thumbnailUpdatedUrl = thumbnailUpdatedResponse.url;

    const thumbnailUpdatedPublicId = extractPublicId(thumbnailUpdatedUrl);
    console.log("Thumbnail updated public Id", thumbnailUpdatedPublicId);

    const thumbnailOldPublicId = extractPublicId(video.thumbnail);
    console.log("Thumbnail old public Id", thumbnailOldPublicId);

    // checking that both public id exist
    if (!thumbnailUpdatedPublicId || !thumbnailOldPublicId)
        throw new ApiError(404, "Invalid thumbnail url's");

    const oldImageResult = await cloudinary.api.resource(thumbnailOldPublicId, {
        phash: true,
    });
    const newImageResult = await cloudinary.api.resource(
        thumbnailUpdatedPublicId,
        { phash: true }
    );

    const oldPhash = oldImageResult.phash;
    const newPhash = newImageResult.phash;

    let isUpdated = false;
    // Compare phash values
    if (oldPhash === newPhash)
        throw new ApiError(404, "Previous and current thumbanil are same!!!");
    else {
        // update the thumbnail
        video.thumbnail = thumbnailUpdatedUrl;
        isUpdated = true;
    }
    // checking the rest of the fields
    if (title && title !== video.title) {
        video.title = title;
        isUpdated = true;
    }
    if (description && description !== video.description) {
        video.description = description;
        isUpdated = true;
    }

    if (isUpdated) {
        const updatedVideo = await video.save({ validateBeforeSave: false });
        // console.log("Updated video information", updatedVideo);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedVideo,
                    "Video details updated successfully!!!"
                )
            );
    } else {
        throw new ApiError(404, "No chnages detected");
    }
});

const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;

    // now let's toggle the publishStaus
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404,"Video with this id doesn't exist");
    // here this is the toggling the fields of isPublished
    video.isPublished = !video.isPublished;

    const updatedVideo = await video.save({ validateBeforeSave: false });
    if(!updatedVideo) throw new ApiError(500,"something went worng while saving the video data");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    // first of all find the video
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(400,"Video is not found");
    const deletedVideo = await Video.deleteOne({
        _id:videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deletedVideo,
            "Video deleted successfully"
        )
    )
})
export { publishAVideo, getVideoById, updateVideo ,togglePublishStatus,deleteVideo};
