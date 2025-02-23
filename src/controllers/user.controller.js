import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiErrors} from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    const{fullName,email,username,password}=req.body
    console.log("email:",email)

    // validation- not empty 
    if(
        [fullName,email,username,password].some((field)=>
            field?.trim()==="")
    )
    {
        throw new ApiErrors(400,"All fields are required")
    }
   
    // check if user already exists: username, email
    const existedUser= User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiErrors(409,"User already exists")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPaths = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiErrors(400,"Avatar is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiErrors(400,"Avatar is required")
    }

    // create user object- create entry in db
    const user= await User.create({
        fullName,
        email,
        username:username.tolowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check for user creation 
    if(!createdUser){
        throw new ApiErrors(500,"Something went wrong while creating user")
    }

    // return response
    res.status(201).json(
        new ApiResponse(200,"User registered successfully",createdUser)
    )
});

export { registerUser };
