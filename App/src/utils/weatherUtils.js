import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Maps OpenWeatherMap icon codes to MaterialCommunityIcons names
 * @param {string} iconCode - The OpenWeatherMap icon code
 * @returns {string} MaterialCommunityIcons name
 */
export const mapWeatherIcon = (iconCode) => {
  const iconMapping = {
    "01d": "weather-sunny",
    "01n": "weather-night",
    "02d": "weather-partly-cloudy",
    "02n": "weather-night-partly-cloudy",
    "03d": "weather-cloudy",
    "03n": "weather-cloudy",
    "04d": "weather-cloudy",
    "04n": "weather-cloudy",
    "09d": "weather-pouring",
    "09n": "weather-pouring",
    "10d": "weather-rainy",
    "10n": "weather-rainy",
    "11d": "weather-lightning",
    "11n": "weather-lightning",
    "13d": "weather-snowy",
    "13n": "weather-snowy",
    "50d": "weather-fog",
    "50n": "weather-fog",
  };
  
  return iconMapping[iconCode] || "weather-cloudy";
};

/**
 * Get day name from forecast timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Abbreviated day name (Mon, Tue, etc.)
 */
export const getDayName = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

/**
 * Calculate rain chance percentage from weather data
 * @param {Object} weatherData - Weather data object
 * @returns {number} Rain chance percentage
 */
export const calculateRainChance = (weatherData) => {
  if (weatherData?.clouds?.all) {
    return Math.min(weatherData.clouds.all, 100);
  }
  return 0;
};

/**
 * Store weather data for offline use
 * @param {Object} weatherData - Weather data object
 */
export const storeWeatherData = async (weatherData) => {
  try {
    const jsonValue = JSON.stringify({
      data: weatherData,
      timestamp: Date.now()
    });
    await AsyncStorage.setItem('weatherData', jsonValue);
  } catch (e) {
    console.error("Error storing weather data", e);
  }
};

/**
 * Get stored weather data
 * @returns {Object|null} Weather data object or null if not found
 */
export const getStoredWeatherData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('weatherData');
    if (jsonValue !== null) {
      const storedData = JSON.parse(jsonValue);
      
      // Check if data is fresh (less than 1 hour old)
      const isDataFresh = (Date.now() - storedData.timestamp) < 3600000;
      return isDataFresh ? storedData.data : null;
    }
    return null;
  } catch (e) {
    console.error("Error retrieving weather data", e);
    return null;
  }
};

/**
 * Format the temperature
 * @param {number} temp - Temperature in Celsius
 * @returns {string} Formatted temperature string
 */
export const formatTemperature = (temp) => {
  return `${Math.round(temp)}°C`;
};