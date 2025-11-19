const FormData = require('form-data');
const axios = require('axios');

const IMGBB_API_KEY = 'cac62d80631438255ca886d434fc6fff';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Upload image to ImgBB
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} imageName - Original image name (optional)
 * @returns {Promise<string>} - Returns the display_url from ImgBB
 */
async function uploadToImgBB(imageBuffer, imageName = 'product-image') {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', imageBuffer.toString('base64'));
    formData.append('name', imageName);

    // Upload to ImgBB
    const response = await axios.post(IMGBB_API_URL, formData, {
      headers: formData.getHeaders(),
      timeout: 10000, // 10 second timeout
    });

    if (response.data.success) {
      return response.data.data.display_url;
    } else {
      throw new Error('ImgBB upload failed: ' + (response.data.error?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('ImgBB upload error:', error.message);
    if (error.response) {
      console.error('ImgBB API response:', error.response.data);
      throw new Error('ImgBB API error: ' + (error.response.data.error?.message || error.response.statusText));
    } else if (error.request) {
      throw new Error('Failed to connect to ImgBB API');
    } else {
      throw new Error('Image upload failed: ' + error.message);
    }
  }
}

module.exports = { uploadToImgBB };