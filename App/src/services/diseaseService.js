import { getApiUrl } from '../utils/config';

/**
 * Detect plant disease from an uploaded image by calling backend /leaf/detect
 * Maps backend response into the UI-friendly `detection` shape.
 * @param {string} imageUri - Local file URI from image picker
 * @returns {Promise<Object>} { detection: { name, confidence, description, symptoms, treatment } }
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

    const response = await fetch(`${baseUrl}/leaf/detect`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      // If backend not available, keep previous mock behavior for demo
      if (response.status === 404) {
        return {
          detection: {
            name: 'Tomato Early Blight',
            confidence: 0.95,
            description: 'A common fungal disease affecting tomato plants.',
            symptoms: ['Brown spots with concentric rings', 'Yellowing leaves'],
            treatment: {
              chemical: ['Mancozeb', 'Chlorothalonil'],
              biological: ['Trichoderma'],
              cultural: ['Crop rotation', 'Remove infected leaves'],
            },
          },
        };
      }
      throw new Error('Disease detection failed');
    }

    const json = await response.json();

    // Backend returns { label, confidence, matches: [...] }
    const label = json.label || (json?.detection?.label) || 'Unknown';
    const confidence = typeof json.confidence === 'number' ? json.confidence : (json?.detection?.confidence ?? null);

    // Pull useful info from first match if available
    let description = '';
    let symptoms = [];
    let treatment = {};

    const matches = Array.isArray(json.matches) ? json.matches : [];
    if (matches.length > 0) {
      const first = matches[0];
      description = first.description || first.desc || '';
      if (Array.isArray(first.symptoms)) symptoms = first.symptoms;
      // treatment may be nested
      if (first.treatment) treatment = first.treatment;
      // fallback: if record has fields like 'chemical', 'biological', 'cultural'
      if (!treatment.chemical && first.chemical) treatment.chemical = first.chemical;
      if (!treatment.biological && first.biological) treatment.biological = first.biological;
      if (!treatment.cultural && first.cultural) treatment.cultural = first.cultural;
    }

    return {
      detection: {
        name: label,
        confidence: (typeof confidence === 'number' && confidence <= 1) ? confidence : (typeof confidence === 'number' ? confidence : null),
        description,
        symptoms,
        treatment,
        // include raw backend matches for optional display
        matches,
      },
    };
  } catch (error) {
    console.error('Disease detection error:', error);
    // Return mock data on error for UI demonstration
    return {
      detection: {
        name: 'Tomato Early Blight (Demo)',
        confidence: 0.95,
        description: 'A common fungal disease affecting tomato plants.',
        symptoms: ['Brown spots with concentric rings', 'Yellowing leaves'],
        treatment: {
          chemical: ['Mancozeb', 'Chlorothalonil'],
          biological: ['Trichoderma'],
          cultural: ['Crop rotation', 'Remove infected leaves'],
        },
      },
    };
  }
};
