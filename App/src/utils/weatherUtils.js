import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Maps weather condition text to icon code
 * @param {string} condition - Weather condition text
 * @returns {string} Icon code for the condition
 */
export const mapConditionToIcon = (condition) => {
  const conditionMap = {
    'Clear': '01d',
    'Sunny': '01d',
    'Partly cloudy': '02d',
    'Cloudy': '03d',
    'Overcast': '04d',
    'Mist': '50d',
    'Fog': '50d',
    'Rain': '10d',
    'Light rain': '09d',
    'Moderate rain': '10d',
    'Heavy rain': '09d',
    'Showers': '09d',
    'Thunderstorm': '11d',
    'Snow': '13d',
    'Light snow': '13d',
    'Heavy snow': '13d',
    'Sleet': '13d'
  };
  
  return conditionMap[condition] || '01d'; // Default to clear/sunny
};

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
 * Calculate chance of rain from various forecast data structures
 * @param {Object} weatherData - The complete weather data object
 * @returns {string} Formatted rain chance percentage or "Unknown"
 */
export const calculateRainChance = (weatherData) => {
  if (!weatherData) return "Unknown";

  // Google Weather API nested structure
  if (weatherData.forecast?.days?.[0]?.day?.precipitation?.probability?.percent !== undefined) {
    return `${weatherData.forecast.days[0].day.precipitation.probability.percent}%`;
  }

  // Google Weather API daytimeForecast format
  if (weatherData.forecast?.forecastDays?.[0]?.daytimeForecast?.precipitation?.probability?.percent !== undefined) {
    return `${weatherData.forecast.forecastDays[0].daytimeForecast.precipitation.probability.percent}%`;
  }

  // Standard format from backend
  if (weatherData.forecast?.days?.[0]?.day?.precipitation?.probability !== undefined) {
    return `${weatherData.forecast.days[0].day.precipitation.probability}%`;
  }

  // Simple precipitation field
  if (Array.isArray(weatherData.forecast) && weatherData.forecast[0]?.day?.precipitation !== undefined) {
    return `${weatherData.forecast[0].day.precipitation}%`;
  }

  // Fallback for OpenWeatherMap format
  if (weatherData.forecast?.list?.[0]?.pop !== undefined) {
    return `${Math.round(weatherData.forecast.list[0].pop * 100)}%`;
  }

  return "Unknown";
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