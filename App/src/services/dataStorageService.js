import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing different data types
const STORAGE_KEYS = {
  LOCATION: 'agri_app:location',
  WEATHER: 'agri_app:weather',
  FORECAST: 'agri_app:forecast',
  FULL_DATA: 'agri_app:full_data',
  LAST_UPDATED: 'agri_app:last_updated'
};

/**
 * Store location data
 * @param {Object} locationData - Location object with coordinates
 * @returns {Promise<void>}
 */
export const storeLocationData = async (locationData) => {
  if (!locationData) return;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(locationData));
    // Update last updated timestamp
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, JSON.stringify({
      location: Date.now()
    }));
    console.log('Location data stored successfully');
  } catch (error) {
    console.error('Error storing location data:', error);
  }
};

/**
 * Store weather data
 * @param {Object} weatherData - Current weather data
 * @returns {Promise<void>}
 */
export const storeWeatherData = async (weatherData) => {
  if (!weatherData) return;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WEATHER, JSON.stringify(weatherData));
    // Update last updated timestamp
    const lastUpdated = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    const updatedData = lastUpdated ? JSON.parse(lastUpdated) : {};
    updatedData.weather = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, JSON.stringify(updatedData));
    console.log('Weather data stored successfully');
  } catch (error) {
    console.error('Error storing weather data:', error);
  }
};

/**
 * Store forecast data
 * @param {Object} forecastData - Weather forecast data
 * @returns {Promise<void>}
 */
export const storeForecastData = async (forecastData) => {
  if (!forecastData) return;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FORECAST, JSON.stringify(forecastData));
    // Update last updated timestamp
    const lastUpdated = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    const updatedData = lastUpdated ? JSON.parse(lastUpdated) : {};
    updatedData.forecast = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATED, JSON.stringify(updatedData));
    console.log('Forecast data stored successfully');
  } catch (error) {
    console.error('Error storing forecast data:', error);
  }
};

/**
 * Store complete weather and location data
 * @param {Object} fullData - Object containing location, weather, and forecast data
 * @returns {Promise<void>}
 */
export const storeFullData = async (fullData) => {
  if (!fullData) return;
  
  try {
    // Store individual components
    if (fullData.location) {
      await storeLocationData(fullData.location);
    }
    if (fullData.weather) {
      await storeWeatherData(fullData.weather);
    }
    if (fullData.forecast) {
      await storeForecastData(fullData.forecast);
    }
    
    // Also store the complete data object for convenience
    await AsyncStorage.setItem(STORAGE_KEYS.FULL_DATA, JSON.stringify({
      data: fullData,
      lastUpdated: Date.now()
    }));
    console.log('Full data stored successfully');
  } catch (error) {
    console.error('Error storing full data:', error);
  }
};

/**
 * Retrieve location data
 * @returns {Promise<Object|null>} Location data or null if not found
 */
export const getLocationData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving location data:', error);
    return null;
  }
};

/**
 * Retrieve weather data
 * @returns {Promise<Object|null>} Weather data or null if not found
 */
export const getWeatherData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving weather data:', error);
    return null;
  }
};

/**
 * Retrieve forecast data
 * @returns {Promise<Object|null>} Forecast data or null if not found
 */
export const getForecastData = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FORECAST);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving forecast data:', error);
    return null;
  }
};

/**
 * Retrieve full weather and location data
 * @returns {Promise<Object|null>} Full data object or null if not found
 */
export const getFullData = async () => {
  try {
    // Try to get the complete data object first
    const fullData = await AsyncStorage.getItem(STORAGE_KEYS.FULL_DATA);
    if (fullData) {
      return JSON.parse(fullData).data;
    }
    
    // If not available, try to reconstruct from individual components
    const [location, weather, forecast] = await Promise.all([
      getLocationData(),
      getWeatherData(),
      getForecastData()
    ]);
    
    if (!location && !weather && !forecast) {
      return null;
    }
    
    return {
      location,
      weather,
      forecast
    };
  } catch (error) {
    console.error('Error retrieving full data:', error);
    return null;
  }
};

/**
 * Check when data was last updated
 * @returns {Promise<Object>} Object with timestamps for each data type
 */
export const getLastUpdated = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error retrieving last updated timestamps:', error);
    return {};
  }
};

/**
 * Clear all stored data
 * @returns {Promise<void>}
 */
export const clearAllData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

/**
 * Check if data is stale (older than specified time)
 * @param {number} timestamp - Timestamp to check
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {boolean} Whether the data is stale
 */
export const isDataStale = (timestamp, maxAge = 1000 * 60 * 30) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > maxAge;
};