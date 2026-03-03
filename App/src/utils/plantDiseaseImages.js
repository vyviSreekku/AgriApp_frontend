const PLANT_DISEASE_IMAGES = {
  apple_cedar_rust: require('../../images/plant_diseases/Apple_Cedar_Rust.jpg'),
  apple_fire_blight: require('../../images/plant_diseases/Apple_Fire_Blight.jpg'),
  apple_powdery_mildew: require('../../images/plant_diseases/Apple_Powdery_Mildew.jpg'),
  apple_scab: require('../../images/plant_diseases/Apple_Scab.jpg'),
  carrot_leaf_blight: require('../../images/plant_diseases/Carrot_Leaf_Blight.jpg'),
  corn_gray_leaf_spot: require('../../images/plant_diseases/Corn_Gray_Leaf_Spot.jpg'),
  cotton_bacterial_blight: require('../../images/plant_diseases/Cotton_Bacterial_Blight.jpg'),
  cucumber_downy_mildew: require('../../images/plant_diseases/Cucumber_Downy_Mildew.jpg'),
  cucumber_powdery_mildew: require('../../images/plant_diseases/Cucumber_Powdery_Mildew.jpg'),
  grape_black_rot: require('../../images/plant_diseases/Grape_Black_Rot.jpg'),
  peach_brown_rot: require('../../images/plant_diseases/Peach_Brown_Rot.jpg'),
  peanut_early_leaf_spot: require('../../images/plant_diseases/Peanut_Early_Leaf_Spot.jpg'),
  potato_late_blight: require('../../images/plant_diseases/Potato_Late_Blight.jpg'),
  rice_bacterial_leaf_blight: require('../../images/plant_diseases/Rice_Bacterial_Leaf_Blight.jpg'),
  strawberry_gray_mold: require('../../images/plant_diseases/Strawberry_Gray_Mold.jpg'),
  tomato_early_blight: require('../../images/plant_diseases/Tomato_Early_Blight.jpg'),
  tomato_late_blight: require('../../images/plant_diseases/Tomato_Late_Blight.jpg'),
  tomato_septoria_leaf_spot: require('../../images/plant_diseases/Tomato_Septoria_Leaf_Spot.jpg'),
  watermelon_fusarium_wilt: require('../../images/plant_diseases/Watermelon_Fusarium_Wilt.jpg'),
  wheat_leaf_rust: require('../../images/plant_diseases/Wheat_Leaf_Rust.jpg'),
};

const normalizeDiseaseKey = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const getPlantDiseaseImage = (name) => {
  const key = normalizeDiseaseKey(name);
  return PLANT_DISEASE_IMAGES[key] || null;
};
