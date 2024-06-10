import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// These are the fields in subscription models
// subscriber,channel
const addSubscription = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const channelId = new mongoose.Types.ObjectId(req.params.channelId);

    // now both channelId & userId are available
    console.log("Channel Id", channelId);
    console.log("User Id", userId);

    if (!channelId) throw new ApiError(400, "channel Id is missing");

    const checkExistingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });
    // checking for already subscribed channel
    if (checkExistingSubscription)
        throw new ApiError(400, "You have already subscribed to this channel");

    const subscription = await Subscription.create({
        subscriber: userId,
        channel: channelId,
    });

    if (!subscription)
        throw new ApiError(
            500,
            "something went wrong while storing subscription data to db"
        );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscription,
                "You have subscribed the channel successfully"
            )
        );
});

export { addSubscription };
