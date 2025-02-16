import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully", response.url);

    // Return the response
    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);

    // Clean up the local file if an error occurs
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    throw error; // Rethrow the error for further handling
  }
};

export { uploadOnCloudinary };
