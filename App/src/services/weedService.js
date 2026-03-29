import { getApiUrl } from '../utils/config';

/**
 * Detect weed from an uploaded image
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} Weed detection result with name, characteristics, and control methods
 */
export const detectWeed = async (imageUri) => {
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

    console.log('[DEBUG weedService] Uploading image:', { filename, type, uri: imageUri });

    const response = await fetch(`${baseUrl}/weed/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR weedService] API error:', response.status, errorText);
      throw new Error(`Weed detection failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG weedService] Detection result:', data);
    
    return data;
  } catch (error) {
    console.error('[ERROR weedService] detectWeed exception:', error);
    throw error;
  }
};

export default { detectWeed };
