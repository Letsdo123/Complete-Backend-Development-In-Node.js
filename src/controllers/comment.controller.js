import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// started the comments functionality

// get all the comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 2, limit = 5 } = req.query

    // fisrt of all checking that videoId is valid or not
    const isValid = mongoose.Types.ObjectId.isValid(videoId);
    if (!isValid) throw new ApiError(404, "Invalid Video Id");

    // If video Id is correct then make a query using the pagination concept
    // first of all creating the field
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // This is the formula for skipping the data while fectching from the database
    const skip = (pageNumber - 1) * limitNumber;

    const comments = await Comment.find({video:videoId})
    .skip(skip)
    .limit(limitNumber)
    .sort({createdAt:-1});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments retrived successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;
    // checking that videoId and Content is avaiable or not to add comment for a video
    if (!videoId || !content) throw new ApiError(400, "VideoId and Content is both required");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })
    if (!comment) throw new ApiError(500, "something went wrong!!!");

    // giving the response
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "You have commented to this video successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) throw new ApiError(404, "commentId is missing...");

    // Validate the playlistId
    // This is how we can check the validation using the isValid function from objectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }
    console.log("Updated comment:", content);
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content: content
        },
        { new: true }
    )
    if (!updatedComment) throw new ApiError(500, "something went wrong while updating the data")
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Your comment has been updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // If commentId is missig from the params
    if (!commentId) throw new ApiError(404, "commentId is missing...");

    // Validate the playlistId
    // This is how we can check the validation using the isValid function from objectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    // delete the comment
    const deletedComment = await Comment.deleteOne({
        _id: commentId
    });

    if (!deletedComment) throw new ApiError(500, "something went wrong from server");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedComment,
                "You have successfully deleted the comment from the video"
            )
        )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
};
