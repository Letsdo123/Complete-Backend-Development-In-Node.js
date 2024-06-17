import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// started the playlist functionality

// 1.create the playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // creating the playlist
    // first of all checking that this plsylist exsist or not
    const playlist = await Playlist.findOne({
        name
    });
    console.log("Getting the log just for testing..", playlist);
    if (playlist) throw new ApiError(404, "This playlist is already exists");
    // otherwise create the playlist

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const createdPlaylist = await Playlist.create({
        name,
        description,
        owner: userId
    })
    // If there are some problem occured creating the playlist
    if (!createdPlaylist) throw new ApiError(500, "something went wrong");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                createdPlaylist,
                "Your playlist has been created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    // get the user playlist
    const playlists = await Playlist.find({
        owner: userId
    })
    if (!playlists) throw new ApiError(500, "something went wrong with the database");

    // console.log("The paylists are:",playlists);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "Your playlist has been fecthed successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = new mongoose.Types.ObjectId(req.params.playlistId);
    if (!playlistId) throw new ApiError(404, "playlistId is missing!!!");
    // find the playList by Id
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(500, "something went wrong with the database");

    // console.log("The paylists are:",playlists);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Your playlist has been fecthed successfully"
            )
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const videoId = new mongoose.Types.ObjectId(req.params.videoId);
    // finding the video its id
    const playlist = await Playlist.findById(playlistId);

    playlist.videos.push(videoId);

    const updatedPlaylist = await playlist.save();
    if (!updatedPlaylist) throw new ApiError(500, "something went wrong while adding the videos into the playlist");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video added into playlist successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // throeing error if playId or videoId is missing
    if (!playlistId || !videoId) throw new ApiError(400, "PlaylistId or VideoId is missing");

    // find playList by it's id
    const playlist = await Playlist.findById(playlistId);
    if (playlist.videos.length == 0) throw new ApiError(400, "You don't have any video to delete")

    playlist.videos = playlist.videos.filter((video) => {
        return video != videoId
    })

    const updatedPlaylist = await playlist.save();
    // If something went worng while deleting the video from the playlist
    if (!updatedPlaylist) throw new ApiError(500, "something went wrong with the database");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video deleted from the playlist successfully"
            )
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) throw new ApiError(404, "playListId is missing...");

    // Validate the playlistId
    // This is how we can check the validation using the isValid function from objectId
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400,"Invalid playlistId");
    }
    const playlist = await Playlist.deleteOne({
        _id: playlistId
    });
    if (playlist.deletedCount === 0) {
        throw new ApiError(500, "Playlist deleted successfully.")
    } else {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "deleted playlist successfully"
                )
            )
    }
})

const  updatePlaylist = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params;
    const {name,description} = req.body;

    if (!playlistId) throw new ApiError(404, "playListId is missing...");

    // Validate the playlistId
    // This is how we can check the validation using the isValid function from objectId
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400,"Invalid playlistId");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
       playlistId,
       {
            name,
            description
       },
       {new:true}
    )
    if(!updatedPlaylist) throw new ApiError(500,"something went wrong while updating the data")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
