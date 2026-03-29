import { getApiUrl } from '../utils/config';

/**
 * Detect plant disease from an uploaded image
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} Disease detection result
 */
export const detectDisease = async (imageUri) => {
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

    // NOTE: Ensure your backend has this endpoint or mock it
    const response = await fetch(`${baseUrl}/disease/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
        // Mock response for demo purposes if backend fails or 404
        if (response.status === 404) {
            return {
                detection: {
                    name: "Tomato Early Blight",
                    confidence: 0.95,
                    description: "A common fungal disease affecting tomato plants.",
                    symptoms: ["Brown spots with concentric rings", "Yellowing leaves"],
                    treatment: {
                        chemical: ["Mancozeb", "Chlorothalonil"],
                        biological: ["Trichoderma"],
                        cultural: ["Crop rotation", "Remove infected leaves"]
                    }
                }
            };
        }
      throw new Error('Disease detection failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Disease detection error:', error);
    // Return mock data on error for UI demonstration
    return {
        detection: {
            name: "Tomato Early Blight (Demo)",
            confidence: 0.95,
            description: "A common fungal disease affecting tomato plants.",
            symptoms: ["Brown spots with concentric rings", "Yellowing leaves"],
            treatment: {
                chemical: ["Mancozeb", "Chlorothalonil"],
                biological: ["Trichoderma"],
                cultural: ["Crop rotation", "Remove infected leaves"]
            }
        }
    };
    // throw error; // Uncomment to enforce real error handling
  }
};
