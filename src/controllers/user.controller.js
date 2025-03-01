import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiErrors(500, "Something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some(field => !field?.trim())) {
        throw new ApiErrors(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existedUser) {
        throw new ApiErrors(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
    let coverImageLocalPath = req.files?.coverImage?.[0]?.path || null;

    if (!avatarLocalPath) {
        throw new ApiErrors(400, "Avatar is required");
    }

    let avatar = null;
    let coverImage = null;

    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        throw new ApiErrors(500, "Error uploading images");
    }

    if (!avatar) {
        throw new ApiErrors(400, "Avatar upload failed");
    }

    const user = await User.create({
        fullName,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiErrors(500, "Something went wrong while creating user");
    }

    res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (![email, password].every(field => field?.trim())) {
        throw new ApiErrors(400, "Email and password are required");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiErrors(404, "User not found");
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
        throw new ApiErrors(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "User logged in successfully", { accessToken, loggedInUser }));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiErrors(401, "Unauthorized Access");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user || user.refreshToken !== incomingRefreshToken) {
            throw new ApiErrors(401, "Invalid Refresh Token");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token refreshed successfully"));
    } catch (error) {
        throw new ApiErrors(401, error?.message || "Invalid Refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (![oldPassword, newPassword, confirmPassword].every(field => field?.trim())) {
        throw new ApiErrors(400, "Current and new password are required");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiErrors(404, "User not found");
    }

    if(!newPassword===confirmPassword){
        throw new ApiErrors(400, "confirm password does not match");        
    }

    const isPasswordMatch = await user.matchPassword(oldPassword);

    if (!isPasswordMatch) {
        throw new ApiErrors(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
}
)

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully")

})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;

    if(!fullName || !email){
        throw new ApiErrors(400,"All fields are required")
    }

    const user=user.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiErrors(200,user,"Account details updated sucessfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){(400,"Avatar file missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiErrors(400,"Error while uploading on cloudinary")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    
    ).select("-password")

    return res
    .status(200)
    .json(new ApiErrors(200,user,"Avatar Image updated sucessfully"))

})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){(400,"Cover image file missing")
    }

    const avatar=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar.url){
        throw new ApiErrors(400,"Error while uploading  image on cloudinary")
    }

    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    
    ).select("-password")

    return res
    .status(200)
    .json(new ApiErrors(200,user,"Cover Image updated sucessfully"))

})

const getChannelUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiErrors(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1
            }
        }
    ]);

    if (!channel.length) {
        throw new ApiErrors(404, "Channel doesn't exist");
    }

    res.status(200).json(channel[0]); // Return the first matched channel
});

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar,
    updateUserCoverImage,
    getChannelUserProfile

};
