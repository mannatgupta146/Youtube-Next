import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";  
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
        email: email.toLowerCase(), // ✅ Ensure email is always stored in lowercase
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

export { registerUser };
