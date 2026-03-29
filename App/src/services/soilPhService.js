import { getApiUrl } from '../utils/config';

/**
 * Analyze soil pH from an uploaded image (pH test strip or soil sample)
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} Soil pH analysis result with value, category, and recommendations
 */

export const analyzeSoilPH = async (imageUri) => {
  try {
    const baseUrl = await getApiUrl();
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });
    console.log('[DEBUG soilPhService] Uploading image:', { filename, type, uri: imageUri });
    const response = await fetch(`${baseUrl}/soil-ph/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR soilPhService] API error:', response.status, errorText);
      throw new Error(`Soil pH analysis failed: ${response.status}`);
    }
    const data = await response.json();
    console.log('[DEBUG soilPhService] Analysis result:', data);
    return data.ph_value;
  } catch (error) {
    console.error('[ERROR soilPhService] analyzeSoilPH exception:', error);
    throw error;
  }
};

export default { analyzeSoilPH };
