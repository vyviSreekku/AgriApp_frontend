// Color space conversion and pH calculation utilities

// Convert RGB to LAB (OpenCV style scaling: L [0,255], a [0,255], b [0,255])
// This matches the provided reference table which has values like 119, 197, 174
export const rgbToLab = (r, g, b) => {
  // First convert to XYZ
  let rNormal = r / 255;
  let gNormal = g / 255;
  let bNormal = b / 255;

  rNormal = rNormal > 0.04045 ? Math.pow((rNormal + 0.055) / 1.055, 2.4) : rNormal / 12.92;
  gNormal = gNormal > 0.04045 ? Math.pow((gNormal + 0.055) / 1.055, 2.4) : gNormal / 12.92;
  bNormal = bNormal > 0.04045 ? Math.pow((bNormal + 0.055) / 1.055, 2.4) : bNormal / 12.92;

  let x = (rNormal * 0.4124 + gNormal * 0.3576 + bNormal * 0.1805) * 100;
  let y = (rNormal * 0.2126 + gNormal * 0.7152 + bNormal * 0.0722) * 100;
  let z = (rNormal * 0.0193 + gNormal * 0.1192 + bNormal * 0.9505) * 100;

  // Normalize for D65
  x = x / 95.047;
  y = y / 100.000;
  z = z / 108.883;

  // Convert to LAB
  x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + (16 / 116);

  let l = (116 * y) - 16;
  let a = 500 * (x - y);
  let bVal = 200 * (y - z);

  // SCALING TO MATCH REFERENCE TABLE (OpenCV 8-bit LAB format)
  // L is scaled to 0-255: L_new = L * 255/100
  // a and b are shifted+scaled: val_new = val + 128
  
  l = l * 2.55;
  a = a + 128;
  bVal = bVal + 128;

  return { l, a, b: bVal };
};

/**
 * Calculates Euclidean distance between two RGB colors
 * @param {object} rgb1 - { r, g, b }
 * @param {object} rgb2 - { r, g, b }
 * @returns {number} difference
 */
export const deltaE = (rgb1, rgb2) => {
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
};

// Reference table mapping pH to RGB values (Converted from OpenCV LAB)
export const REFERENCE_TABLE = [
  { ph: 0, r: 236.5, g: 25.0,  b: 36.0 },
  { ph: 1, r: 242.0, g: 84.5,  b: 36.0 },
  { ph: 2, r: 248.0, g: 164.5, b: 18.0 },
  { ph: 3, r: 246.0, g: 222.5, b: 1.0 },
  { ph: 4, r: 191.5, g: 212.0, b: 22.0 },
  { ph: 5, r: 132.0, g: 197.0, b: 38.0 },
  { ph: 6, r: 77.0,  g: 183.0, b: 58.5 },
  { ph: 7, r: 48.0,  g: 169.0, b: 61.0 },
  { ph: 8, r: 21.0,  g: 180.0, b: 102.5 },
  { ph: 9, r: 8.0,   g: 184.0, b: 182.0 },
  { ph: 10, r: 65.0, g: 143.0, b: 205.0 },
  { ph: 11, r: 54.5, g: 82.0,  b: 166.0 },
  { ph: 12, r: 86.0, g: 73.5,  b: 164.0 },
  { ph: 13, r: 83.0, g: 52.0,  b: 159.0 },
  { ph: 14, r: 70.0, g: 34.0,  b: 133.0 }
];

/**
 * Finds the closest pH value based on input RGB color
 * @param {object} inputRgb - { r, g, b }
 * @returns {object} { ph, difference }
 */
export const getPhFromRgb = (inputRgb) => {
  let minDiff = Infinity;
  let closestPh = null;

  for (const ref of REFERENCE_TABLE) {
    const diff = deltaE(inputRgb, ref);
    if (diff < minDiff) {
      minDiff = diff;
      closestPh = ref.ph;
    }
  }
  
  return { 
    ph: closestPh,
    difference: minDiff
  };
};

export const getPhColor = (ph) => {
    switch(ph) {
        case 0: return '#ef4444'; // strong acid
        case 1: return '#ea580c';
        case 2: return '#f97316';
        case 3: return '#fb923c';
        case 4: return '#facc15';
        case 5: return '#fde047';
        case 6: return '#bef264';
        case 7: return '#22c55e'; // neutral
        case 8: return '#16a34a'; // alkaline start
        case 9: return '#0891b2';
        case 10: return '#06b6d4';
        case 11: return '#3b82f6';
        case 12: return '#2563eb';
        case 13: return '#1d4ed8';
        case 14: return '#1e3a8a';
        default: return '#808080';
    }
}

export const getPhColorName = (ph) => {
    if (ph < 2) return 'Red (Strongly Acidic)';
    if (ph < 4) return 'Orange-Red (Acidic)';
    if (ph < 6) return 'Orange/Yellow (Weakly Acidic)';
    if (ph >= 6 && ph < 7.5) return 'Yellow-Green (Neutral)';
    if (ph >= 7.5 && ph < 9) return 'Green (Optimal)';
    if (ph >= 9 && ph < 11) return 'Blue-Green (Alkaline)';
    if (ph >= 11 && ph < 13) return 'Blue (Strongly Alkaline)';
    if (ph >= 13) return 'Purple (Very Strong Alkaline)';
    return 'Unknown';
}
