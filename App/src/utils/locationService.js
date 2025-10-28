import * as Location from 'expo-location';

/**
 * Request location permission and get current position
 * @returns {Promise<Object>} Location object with coordinates
 */
export const getLocationAsync = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
  }
  
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};
