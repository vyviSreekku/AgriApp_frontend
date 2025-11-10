const API_URL = 'http://192.168.1.11:8082'; // FastAPI default port is 8000
import { getStoredWeatherData, storeWeatherData } from '../utils/weatherUtils';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SMSService from './smsService';

/**
 * Check network connectivity
 * @returns {Promise<boolean>} Whether the device is online
 */
const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable;
};

/**
 * Fetch weather data from FastAPI backend using coordinates
 * Supports offline functionality with local caching and SMS fallback
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} Weather data object
 */
export const fetchWeatherData = async (latitude, longitude) => {
  try {
    // Check network connectivity
    const online = await isOnline();

    if (!online) {
      console.log('Device is offline, checking for cached data and SMS options');

      // First try to get SMS weather data
      const smsWeatherData = await SMSService.getStoredWeatherData();
      if (smsWeatherData) {
        console.log('Using weather data from SMS');
        return SMSService.parseWeatherFromSMS(smsWeatherData);
      }

      // Then try cached data
      const cachedData = await getStoredWeatherData();
      if (cachedData) {
        console.log('Using cached weather data');
        return cachedData;
      }

      // No cached data, offer SMS option
      throw new Error('OFFLINE_MODE');
    }

    // Online mode - fetch from API
    const response = await fetch(`${API_URL}/weather/current/?lat=${latitude}&lon=${longitude}`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Weather data fetch failed: ${errorData}`);
    }

    const weatherData = await response.json();

    // Store data for offline use
    await storeWeatherData(weatherData);

    return weatherData;
  } catch (error) {
    if (error.message === 'OFFLINE_MODE') {
      // Handle offline mode with SMS option
      return await SMSService.handleOfflineWeatherRequest(latitude, longitude);
    }

    console.error('Error fetching weather:', error);

    // Last resort - try to return cached data even if it's expired
    try {
      const cachedData = await getStoredWeatherData(true); // Force return even if expired
      if (cachedData) {
        return cachedData;
      }
    } catch (e) {
      // If all fails, throw the original error
    }

    throw error;
  }
};

/**
 * Fetch weather forecast data from FastAPI backend
 * Supports offline functionality with local caching and SMS fallback
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {number} days - Number of forecast days (default: 5)
 * @returns {Promise<Object>} Forecast data object
 */
export const fetchForecastData = async (latitude, longitude, days = 4) => {
  try {
    // Check network connectivity
    const online = await isOnline();

    if (!online) {
      console.log('Device is offline, checking for cached forecast data');

      // Return cached forecast if offline
      const cachedData = await AsyncStorage.getItem('forecastData');
      if (cachedData) {
        const forecastData = JSON.parse(cachedData);
        if (Date.now() - forecastData.timestamp < 3600000) { // Less than 1 hour old
          return forecastData.data;
        }
      }

      // For forecast, we don't have SMS fallback since it's complex data
      // Just return null or throw error
      throw new Error('No internet connection and no cached forecast available');
    }

    // Online mode - fetch from API
    const response = await fetch(`${API_URL}/weather/forecast?lat=${latitude}&lon=${longitude}&days=${days}`);
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Forecast data fetch failed: ${errorData}`);
    }

    const forecastData = await response.json();

    // Process the forecast data to match our app's format
    const processedForecast = {
      location: forecastData.location_data?.formatted_address || 'Unknown Location',
      forecast: forecastData.days?.map(day => ({
        dt: new Date(day.date).getTime() / 1000, // Convert to unix timestamp
        weather: [{
          main: day.day?.condition || 'Clear',
          icon: mapConditionToIcon(day.day?.condition || 'Clear')
        }],
        main: {
          temp: day.day?.temp_max || 25,
          temp_min: day.day?.temp_min || 20,
          temp_max: day.day?.temp_max || 25,
          humidity: day.day?.humidity || 50
        },
        precipitation: day.day?.precipitation || 0
      })) || []
    };

    // Store processed data for offline use
    try {
      await AsyncStorage.setItem('forecastData', JSON.stringify({
        data: processedForecast,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error storing forecast data', e);
    }

    return processedForecast;
  } catch (error) {
    console.error('Error fetching forecast:', error);

    // Last resort - try to return cached data even if it's expired
    try {
      const cachedData = await AsyncStorage.getItem('forecastData');
      if (cachedData) {
        return JSON.parse(cachedData).data;
      }
    } catch (e) {
      // If all fails, throw the original error
    }

    throw error;
  }
};

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
 * Extract temperature value from string
 * @param {string} tempString - Temperature string like "25 °C"
 * @returns {number} Temperature value
 */
export const extractTemperature = (tempString) => {
  const match = tempString.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 25; // Default to 25 if parsing fails
};

/**
 * Extract percentage value from string
 * @param {string} percentString - Percentage string like "75%"
 * @returns {number} Percentage value
 */
export const extractPercentage = (percentString) => {
  const match = percentString.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0; // Default to 0 if parsing fails
};

/**
 * Fetch both weather and forecast data, combine into one response
 * Great for offline first approach
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} Combined weather data object
 */
export const fetchAllWeatherData = async (latitude, longitude) => {
  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherData(latitude, longitude),
      fetchForecastData(latitude, longitude)
    ]);
    
    return {
      ...weatherData,
      forecast: forecastData.forecast || []
    };
  } catch (error) {
    console.error('Error fetching all weather data:', error);
    throw error;
  }
};