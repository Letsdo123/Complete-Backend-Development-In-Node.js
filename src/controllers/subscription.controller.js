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

// This is a method to show that how many channel I have subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // getting the subscriber id from the params
    const subscriberId = new mongoose.Types.ObjectId(req.params.subscriberId);
    console.log("SubscriberID:", subscriberId);
    if (!subscriberId) throw new ApiError(404, "Subscriber Id is required to see the subscribed channeld details");
    const subscribedChannel = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "SubscribedChannelsDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                channel: 1,
                SubscribedChannelsDetails: 1
            }
        }
    ])

    if (!subscribedChannel) throw new ApiError(500, "something went wrong while fetching the data...")
    console.log("Subscribed channel details:", JSON.stringify(subscribedChannel, null, 2));

    const modifiesChannelDetails = subscribedChannel.map((channel) => {
        return channel.SubscribedChannelsDetails[0];
    })

    // This is only the subscribed channel details
    // console.log("This is only the channel details:", modifiesChannelDetails);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                modifiesChannelDetails,
                "Successfully fetched subscribed channel!!!"
            )
        )
})

// This is the method to retrive how many subscriber I have
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // getting the channelId from the params
    const channelId = new mongoose.Types.ObjectId(req.params.channelId);

    if (!channelId) throw new ApiError(404, "ChannelId is missing...");

    // find the subscriber
    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                subscriberDetails: 1
            }
        }
    ])
    if(!subscriber) throw new ApiError(500,"something went wrong while fecthing data...");
    console.log("Subscribed channel details:", JSON.stringify(subscriber, null, 2));

    const modifiesSubscribersDetails = subscriber.map((subscriber) => {
        return subscriber.subscriberDetails[0];
    })
    
    // This is only the subscribed channel details
    // console.log("This is only the channel details:", modifiesSubscribersDetails);
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                modifiesSubscribersDetails,
                "Successfully fetched subscribed channel!!!"
            )
        )
})


export { addSubscription, getSubscribedChannels, getUserChannelSubscribers };
