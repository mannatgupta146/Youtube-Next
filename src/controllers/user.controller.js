import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";  
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};


    }
    catch{
        throw new ApiErrors(500, "Something went wrong while creating user");

    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some(field => !field?.trim())) {
        throw new ApiErrors(400, "All fields are required");
    }

    // Check if user exists
    const existedUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existedUser) {
        throw new ApiErrors(409, "User already exists");
    }

    // Check for avatar image
    const avatarLocalPath = req.files?.avatar?.[0]?.path || null;
    let coverImageLocalPath = null;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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

    // Create user entry
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
    // req.body 
    const { email, username, password } = req.body;

    if (![email, password].every(field => field?.trim())) {
        throw new ApiErrors(400, "Username or password is required");
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

    const loggedInUser= await User.findById(user._id).select("-password -refreshToken");
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .json
    (new ApiResponse(
        200, "User logged in successfully", {
            accessToken,loggedInUser
        }
    ));
})

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        { 
            $set:{refreshToken: undefined}
        },
        {
            new:true,
        }   
       
    )
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200,{}, "User logged out successfully"));

})

export { 
    registerUser,loginUser,logoutUser 
};
