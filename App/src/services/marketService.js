import { getApiUrl } from '../utils/config';
import { getFullData } from './dataStorageService';
import { getCurrentLocationData } from './weatherDataHelper';

/**
 * Fetch market prices from the backend API
 * 
 * @param {string} state - The state to filter prices by
 * @param {string} district - The district to filter prices by
 * @param {string} crop - The crop to filter prices by
 * @returns {Promise<Object>} Market price data
 */
export const fetchMarketPrices = async (state = null, district = null, crop = null) => {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (district) params.append('district', district);
    if (crop) params.append('crop', crop);
    
    const queryString = params.toString();
    const baseUrl = await getApiUrl();
    const url = `${baseUrl}/market/prices${queryString ? `?${queryString}` : ''}`;
    
    console.log(`Fetching market prices from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching market prices: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market prices:', error);
    throw error;
  }
};

/**
 * Fetch market price summary for a specific crop
 * 
 * @param {string} crop - The crop to get summary for
 * @param {string} state - The state to filter by (optional)
 * @returns {Promise<Object>} Market price summary data
 */
export const fetchMarketPriceSummary = async (crop, state = null) => {
  try {
    // Build the query parameters
    const params = new URLSearchParams({ crop });
    if (state) params.append('state', state);
    
    const queryString = params.toString();
    const baseUrl = await getApiUrl();
    const url = `${baseUrl}/market/prices/summary?${queryString}`;
    
    console.log(`Fetching market price summary from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching market price summary: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market price summary:', error);
    throw error;
  }
};

/**
 * Get current location details including state and district
 * 
 * @returns {Promise<Object>} Location data with state and district
 */
export const getLocationDetails = async () => {
  try {
    // Try to get the enhanced location data first
    const locationData = await getCurrentLocationData();
    
    // If we have the enhanced location data with state and district
    if (locationData && (locationData.state || locationData.district)) {
      return {
        state: locationData.state,
        district: locationData.district,
        fullLocation: locationData.display_name || locationData.full_address
      };
    }
    
    // Fallback to legacy method - get the stored location data
    const data = await getFullData();
    
    if (!data || !data.weather || !data.weather.location) {
      return { state: null, district: null };
    }
    
    // Extract state and district from location string
    // The location is usually in format "City, District, State"
    const locationString = data.weather.location;
    
    // Parse location parts - this is a simple approach and may need refinement
    const parts = locationString.split(',').map(part => part.trim());
    
    // If we have at least 2 parts, assume last part is state and second-to-last is district
    const state = parts.length > 1 ? parts[parts.length - 1] : null;
    const district = parts.length > 2 ? parts[parts.length - 2] : null;
    
    return {
      state,
      district,
      fullLocation: locationString,
    };
  } catch (error) {
    console.error('Error getting location details:', error);
    return { state: null, district: null };
  }
};

/**
 * Get market prices for specified location and crop
 *
 * @param {string} crop - The crop to fetch prices for
 * @param {string} selectedState - The user-selected state (optional)
 * @param {string} selectedDistrict - The user-selected district (optional)
 * @returns {Promise<Object>} Market data with location context
 */
export const getMarketPricesForCurrentLocation = async (crop, selectedState = null, selectedDistrict = null) => {
  try {
    let state, district;

    // Use user-selected location if provided, otherwise get current location
    if (selectedState && selectedDistrict) {
      state = selectedState;
      district = selectedDistrict;
    } else {
      // Get location details from current GPS location
      const locationDetails = await getLocationDetails();
      state = locationDetails.state;
      district = locationDetails.district;
    }

    // Fetch market prices
    const marketData = await fetchMarketPrices(state, district, crop);

    return {
      ...marketData,
      locationContext: {
        state,
        district
      }
    };
  } catch (error) {
    console.error('Error getting market prices for location:', error);
    throw error;
  }
};
