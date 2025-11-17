import { API_URL } from '../utils/config';

/**
 * Analyze soil type from an uploaded image
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} Soil analysis result with type, characteristics, and recommendations
 */
export const analyzeSoil = async (imageUri) => {
  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // Append image file
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    console.log('[DEBUG soilService] Uploading image:', { filename, type, uri: imageUri });

    const response = await fetch(`${API_URL}/soil/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type - let fetch set it with boundary for multipart
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR soilService] API error:', response.status, errorText);
      throw new Error(`Soil analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG soilService] Analysis result:', data);
    
    return data;
  } catch (error) {
    console.error('[ERROR soilService] analyzeSoil exception:', error);
    throw error;
  }
};

export default { analyzeSoil };
