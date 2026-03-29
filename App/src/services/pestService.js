import { getApiUrl } from '../utils/config';

/**
 * Detect pest from an uploaded image
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} Pest detection result with name, symptoms, and control methods
 */
export const detectPest = async (imageUri) => {
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

    console.log('[DEBUG pestService] Uploading image:', { filename, type, uri: imageUri });

    const response = await fetch(`${baseUrl}/pest/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ERROR pestService] API error:', response.status, errorText);
      throw new Error(`Pest detection failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[DEBUG pestService] Detection result:', data);
    
    return data;
  } catch (error) {
    console.error('[ERROR pestService] detectPest exception:', error);
    throw error;
  }
};

export default { detectPest };
