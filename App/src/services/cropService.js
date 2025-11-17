import { API_URL } from '../utils/config';

/**
 * Request a crop recommendation from the backend
 * @param {Object} inputs - structured inputs
  * @param {number} [inputs.nitrogen]
 * @param {number} [inputs.phosphorus]
 * @param {number} [inputs.potassium]
 * @param {number} [inputs.rainfall]
 * @param {number} [inputs.temperature]
 * @param {number} [inputs.soil_ph]


 * @returns {Promise<{recommended_crop: string, inputs: Object}>}
 */
export const recommendCrop = async (inputs = {}) => {
  const url = `${API_URL}/crops/recommend`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(inputs),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Recommend API failed: ${resp.status} ${text}`);
  }

  return resp.json();
};

export default { recommendCrop };
