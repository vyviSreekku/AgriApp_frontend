import { getFullData, storeFullData, isDataStale } from './dataStorageService';
import { fetchAllWeatherData } from './weatherServices';
import { getLocationAsync } from '../utils/locationService';

// Maximum age of data in milliseconds before we consider it stale
const DEFAULT_MAX_AGE = 60 * 60 * 1000; // 60 minutes (1 hour)

/**
 * Get the latest weather data, either from storage or by fetching fresh data if needed
 * @param {boolean} forceFresh - Whether to force fetching fresh data
 * @param {number} maxAge - Maximum age of data in milliseconds before fetching new data
 * @returns {Promise<Object>} The weather data
 */
export const getLatestWeatherData = async (forceFresh = false, maxAge = DEFAULT_MAX_AGE) => {
  try {
    // First check if we have stored data
    const storedData = await getFullData();
    
    // If we have data and it's not stale and we're not forcing a refresh
    if (
      storedData && 
      storedData.timestamp && 
      !isDataStale(storedData.timestamp, maxAge) && 
      !forceFresh
    ) {
      console.log('Using cached weather data from storage');
      return storedData;
    }
    
    // We need fresh data - always get fresh location to ensure accuracy
    console.log('Fetching fresh location...');
    const locationData = await getLocationAsync();
    
    // Fetch fresh weather data
    const { latitude, longitude } = locationData.coords;
    console.log(`Fetching weather for coordinates: ${latitude}, ${longitude}`);
    const freshWeatherData = await fetchAllWeatherData(latitude, longitude);
    
    // Create the full data object
    const fullData = {
      location: locationData,
      weather: freshWeatherData,
      forecast: freshWeatherData.forecast,
      timestamp: Date.now()
    };
    
    // Store for future use
    await storeFullData(fullData);
    
    return fullData;
  } catch (error) {
    console.error('Error getting latest weather data:', error);
    throw error;
  }
};

/**
 * Get current temperature
 * @returns {Promise<number|null>} Current temperature or null if not available
 */
export const getCurrentTemperature = async () => {
  try {
    const data = await getLatestWeatherData();
    return data?.weather?.main?.temp || null;
  } catch (error) {
    console.error('Error getting current temperature:', error);
    return null;
  }
};

/**
 * Get current humidity
 * @returns {Promise<number|null>} Current humidity or null if not available
 */
export const getCurrentHumidity = async () => {
  try {
    const data = await getLatestWeatherData();
    return data?.weather?.main?.humidity || null;
  } catch (error) {
    console.error('Error getting current humidity:', error);
    return null;
  }
};

/**
 * Get current weather condition
 * @returns {Promise<string|null>} Weather condition or null if not available
 */
export const getCurrentWeatherCondition = async () => {
  try {
    const data = await getLatestWeatherData();
    return data?.weather?.weather?.[0]?.main || null;
  } catch (error) {
    console.error('Error getting current weather condition:', error);
    return null;
  }
};

/**
 * Get rain chance for today
 * @returns {Promise<string>} Formatted rain chance or "Unknown"
 */
export const getRainChanceToday = async () => {
  try {
    const data = await getLatestWeatherData();
    
    if (!data?.weather) return "Unknown";
    
    // Google Weather API nested structure
    if (data.weather.forecast?.days?.[0]?.day?.precipitation?.probability?.percent !== undefined) {
      return `${data.weather.forecast.days[0].day.precipitation.probability.percent}%`;
    }
    
    // Standard format
    if (data.weather.forecast?.days?.[0]?.day?.precipitation !== undefined) {
      return `${data.weather.forecast.days[0].day.precipitation}%`;
    }
    
    // Legacy format
    if (Array.isArray(data.weather.forecast) && data.weather.forecast[0]?.day?.precipitation !== undefined) {
      return `${data.weather.forecast[0].day.precipitation}%`;
    }
    
    return "Unknown";
  } catch (error) {
    console.error('Error getting rain chance:', error);
    return "Unknown";
  }
};

/**
 * Get forecasted data for a specific day
 * @param {number} dayIndex - Day index (0 = today, 1 = tomorrow, etc.)
 * @returns {Promise<Object|null>} Forecast data for the day or null if not available
 */
export const getForecastForDay = async (dayIndex = 0) => {
  try {
    const data = await getLatestWeatherData();
    
    // Handle different forecast data structures
    if (data?.weather?.forecast?.days?.[dayIndex]) {
      return data.weather.forecast.days[dayIndex];
    }
    
    if (Array.isArray(data?.weather?.forecast) && data.weather.forecast[dayIndex]) {
      return data.weather.forecast[dayIndex];
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting forecast for day ${dayIndex}:`, error);
    return null;
  }
};

/**
 * Get current location name
 * @returns {Promise<string>} Location name or "Unknown Location" if not available
 */
export const getCurrentLocationName = async () => {
  try {
    const data = await getLatestWeatherData();
    
    // Check if we have the new location_data structure
    if (data?.weather?.location_data) {
      // Use display_name from location_data
      return data.weather.location_data.display_name || "Unknown Location";
    }
    
    // Fallback to the legacy location field
    return data?.weather?.location || "Unknown Location";
  } catch (error) {
    console.error('Error getting location name:', error);
    return "Unknown Location";
  }
};

/**
 * Get detailed location data including district and state
 * This is useful for components that need more specific location information
 * like market prices that depend on district and state
 */
export const getCurrentLocationData = async () => {
  try {
    const data = await getLatestWeatherData();
    
    // Check if we have the new location_data structure
    if (data?.weather?.location_data) {
      return data.weather.location_data;
    }
    
    // Fallback to legacy format with only display name
    return {
      display_name: data?.weather?.location || "Unknown Location",
      locality: null,
      sublocality: null,
      district: null,
      state: null,
      full_address: data?.weather?.location || "Unknown Location"
    };
  } catch (error) {
    console.error('Error getting location data:', error);
    return {
      display_name: "Unknown Location",
      locality: null,
      sublocality: null,
      district: null,
      state: null,
      full_address: "Unknown Location"
    };
  }
};