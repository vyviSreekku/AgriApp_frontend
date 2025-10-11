import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/config';

const WEATHER_CACHE_PREFIX = 'weather_cache:';
const FORECAST_CACHE_PREFIX = 'forecast_cache:';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Check network connectivity
 * @returns {Promise<boolean>} Whether the device is online
 */
const isOnline = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected && state.isInternetReachable;
};

/**
 * Store data in AsyncStorage with timestamp
 */
const storeData = async (key, value) => {
  try {
    const payload = { ts: Date.now(), data: value };
    await AsyncStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to store cache', e);
  }
};

/**
 * Get data from AsyncStorage with TTL check
 */
const getStoredData = async (key, allowStale = false) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (allowStale) return data;
    if (Date.now() - ts < CACHE_TTL_MS) return data;
    return null;
  } catch (e) {
    console.warn('Failed to read cache', e);
    return null;
  }
};

/**
 * Fetch weather data from FastAPI backend using coordinates
 * Supports offline functionality with local caching
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @returns {Promise<Object>} Weather data object
 */
export const fetchWeatherData = async (latitude, longitude) => {
  const cacheKey = `${WEATHER_CACHE_PREFIX}${latitude}:${longitude}`;
  
  try {
    // Check network connectivity
    const online = await isOnline();
    
    if (!online) {
      console.log('Device is offline, fetching from cache...');
      const cached = await getStoredData(cacheKey, true);
      if (cached) return cached;
      throw new Error('You are offline and no cached weather data is available.');
    }
    
    // Online mode - fetch from API
    // Use the correct endpoint format for your FastAPI backend
    console.log(`Fetching weather data from: ${API_URL}/api/weather/current?lat=${latitude}&lon=${longitude}`);
    
    const response = await fetch(`${API_URL}/api/weather/current?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      console.warn(`API returned ${response.status}`);
      // Try stale cache if API fails
      const cached = await getStoredData(cacheKey, true);
      if (cached) return cached;
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    
    // Store in cache
    await storeData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    
    // Last resort - try to return expired cache
    const cached = await getStoredData(cacheKey, true);
    if (cached) {
      console.log('Returning stale cache data');
      return cached;
    }
    
    throw error;
  }
};

/**
 * Fetch weather forecast data from FastAPI backend
 * Supports offline functionality with local caching
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {number} days - Number of forecast days (default: 5)
 * @returns {Promise<Object>} Forecast data object
 */
export const fetchForecastData = async (latitude, longitude, days = 4) => {
  const cacheKey = `${FORECAST_CACHE_PREFIX}${latitude}:${longitude}:${days}`;
  
  try {
    // Check network connectivity
    const online = await isOnline();
    
    if (!online) {
      console.log('Device is offline, fetching forecast from cache...');
      const cached = await getStoredData(cacheKey, true);
      if (cached) return cached;
      throw new Error('You are offline and no cached forecast data is available.');
    }
    
    // Online mode - fetch from API
    console.log(`Fetching forecast from: ${API_URL}/api/weather/forecast?lat=${latitude}&lon=${longitude}&days=${days}`);
    
    const response = await fetch(`${API_URL}/api/weather/forecast?lat=${latitude}&lon=${longitude}&days=${days}`);
    
    if (!response.ok) {
      console.warn(`API returned ${response.status}`);
      // Try stale cache if API fails
      const cached = await getStoredData(cacheKey, true);
      if (cached) return cached;
      throw new Error(`Forecast API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Forecast data received:', data);
    
    // Make sure the data has the expected structure
    const processedData = {
      ...data,
      // Ensure days array exists
      days: data?.days || data?.forecast || []
    };
    
    // Store in cache
    await storeData(cacheKey, processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    
    // Last resort - try to return expired cache
    const cached = await getStoredData(cacheKey, true);
    if (cached) {
      console.log('Returning stale forecast cache data');
      return cached;
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
  // Map more conditions to cover Google Weather API format
  const conditionMap = {
    // Basic conditions
    'Clear': '01d',
    'Sunny': '01d',
    'Mostly clear': '01d',
    'Mostly sunny': '01d',
    'Partly cloudy': '02d',
    'Mostly cloudy': '03d',
    'Cloudy': '03d',
    'Overcast': '04d',
    
    // Precipitation conditions
    'Mist': '50d',
    'Fog': '50d',
    'Haze': '50d',
    'Rain': '10d',
    'Light rain': '09d',
    'Rain showers': '09d',
    'Moderate rain': '10d',
    'Heavy rain': '09d',
    'Showers': '09d',
    'Drizzle': '09d',
    'Thunderstorm': '11d',
    'Isolated thunderstorms': '11d',
    'Scattered thunderstorms': '11d',
    'Snow': '13d',
    'Light snow': '13d',
    'Flurries': '13d',
    'Heavy snow': '13d',
    'Sleet': '13d',
    'Freezing rain': '13d',
    'Wintry mix': '13d',
    
    // Time-specific conditions
    'Mostly clear night': '01n',
    'Partly cloudy night': '02n',
    'Mostly cloudy night': '03n',
    'Clear night': '01n'
  };
  
  return conditionMap[condition] || '01d'; // Default to clear/sunny
};

/**
 * Extract temperature value from string
 * @param {string} tempString - Temperature string like "25 °C"
 * @returns {number} Temperature value
 */
export const extractTemperature = (tempString) => {
  if (!tempString) return null; // Return null if no value
  // If tempString is already a number, return it
  if (typeof tempString === 'number') {
    return tempString;
  }
  
  const match = String(tempString).match(/(\d+)/);
  return match ? parseInt(match[0], 10) : null; // Return null if parsing fails
};

/**
 * Extract percentage value from string
 * @param {string} percentString - Percentage string like "75%"
 * @returns {number} Percentage value
 */
export const extractPercentage = (percentString) => {
  if (!percentString) return 0; // Default if no value
  const match = String(percentString).match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0; // Default to 0 if parsing fails
};

/**
 * Fetch both weather and forecast data, combine into one response
 * Great for offline first approach
 * @param {number} latitude - The latitude coordinate
 * @param {number} longitude - The longitude coordinate
 * @param {number} days - Number of forecast days (default: 4)
 * @returns {Promise<Object>} Combined weather data object
 */
export const fetchAllWeatherData = async (latitude, longitude, days = 4) => {
  try {
    const [weather, forecast] = await Promise.all([
      fetchWeatherData(latitude, longitude),
      fetchForecastData(latitude, longitude, days)
    ]);
    
    // Make sure forecast.days is properly structured
    const forecastArray = forecast?.days || [];
    console.log('Forecast days available:', forecastArray.length);
    
    // Structure the data to match what the app expects
    const result = {
      location: weather?.location || forecast?.location || 'Unknown Location',
      name: weather?.location || forecast?.location || 'Unknown Location',
      main: {
        temp: extractTemperature(weather?.temperature || '0'),
        humidity: weather?.humidity || 0
      },
      weather: [{
        main: weather?.condition || 'Unknown',
        description: weather?.condition || 'Unknown',
        icon: mapConditionToIcon(weather?.condition || 'Clear')
      }],
      current: weather || {},
      forecast: forecastArray || []
    };
    
    console.log(`Combined weather data with ${result.forecast.length} forecast days`);
    return result;
  } catch (error) {
    console.error('Error fetching all weather data:', error);
    throw error;
  }
};