import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a local file (saved by Multer in /media/uploads) to Cloudinary
 * and removes the local temp file afterwards.
 * @param {string} localFilePath
 * @param {string} folder Cloudinary folder, e.g. "zarshan/posts"
 */
const uploadToCloudinary = async (localFilePath, folder = "zarshan") => {
  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto",
    });
    fs.unlink(localFilePath, () => {});
    return response;
  } catch (error) {
    fs.unlink(localFilePath, () => {});
    logger.error(`Cloudinary upload failed: ${error.message}`);
    throw error;
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.error(`Cloudinary delete failed: ${error.message}`);
    throw error;
  }
};

export { cloudinary, uploadToCloudinary, deleteFromCloudinary };
