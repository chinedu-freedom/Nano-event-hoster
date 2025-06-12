const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads a file buffer to Cloudinary by first converting it to a Data URI.
 * This approach is robust when Multer's memoryStorage is used.
 * @param {Buffer} fileBuffer The Buffer containing the file data.
 * @param {string} mimeType The MIME type of the file (e.g., 'image/jpeg', 'image/png').
 * @param {string} folder Optional: The folder name within Cloudinary to store the image.
 * @returns {Promise<object>} A promise that resolves to the Cloudinary upload result object.
 */
const uploadToCloudinary = async (fileBuffer, mimeType, folder = 'events') => {
  try {
    // Check if fileBuffer is actually a Buffer
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error("Invalid file data: expected a Buffer.");
    }

    // Convert Buffer to Data URI string (e.g., "data:image/jpeg;base64,...")
    const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: folder,
      resource_type: 'auto' // Cloudinary will auto-detect resource type from data URI
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error in uploadToCloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary.');
  }
};

/**
 * Deletes an asset from Cloudinary by its public ID.
 * @param {string} publicId The public ID of the asset to delete.
 * @returns {Promise<object>} A promise that resolves to the Cloudinary deletion result.
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    // Log error, but don't necessarily re-throw if deletion failure is not critical to the main flow
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
