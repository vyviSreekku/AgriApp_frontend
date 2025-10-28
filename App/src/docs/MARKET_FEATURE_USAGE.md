# Market Feature Usage Guide

This document explains how to use and extend the Market Price feature in the AgriApp.

## Overview

The Market Price feature allows farmers to:

1. View current crop prices from various local mandis/markets
2. Select different crops to check their prices
3. Compare prices across different markets
4. Get location-based market recommendations

## Using the Feature

The Market feature can be accessed by:

1. Clicking on the "Market" tab in the bottom navigation bar
2. The location is automatically detected from your stored location data
3. Select a crop from the horizontal list to view its market prices
4. Market prices are displayed with distance information

## Data Flow

The Market screen uses location data stored by the main app:

1. Location data is stored when the app loads weather information
2. The Market screen retrieves this stored location using `getCurrentLocationName()`
3. When a crop is selected, market prices for that crop in nearby mandis are fetched

## How to Extend

### Adding More Crops

Add new crops to the `CROPS` array in `MarketScreen.js`:

```javascript
const CROPS = [
  { id: '9', name: 'Your New Crop', image: require('../assets/crops/new_crop.png') },
  // ... existing crops
];
```

### Adding Real API Integration

Replace the mock data with real API calls:

1. Create a service function in `src/services/marketService.js`
2. Replace the `handleCropSelect` function with:

```javascript
const handleCropSelect = async (crop) => {
  setSelectedCrop(crop);
  setLoading(true);
  
  try {
    // Get current location coordinates
    const locationData = await getFullData();
    const { latitude, longitude } = locationData.location.coords;
    
    // Call your API
    const marketData = await fetchMarketPrices(crop.name, latitude, longitude);
    setMarketPrices(marketData);
  } catch (error) {
    console.error('Error fetching market prices:', error);
  } finally {
    setLoading(false);
  }
};
```

## Requirements for Backend Integration

To fully implement this feature, the backend needs to provide:

1. An API endpoint for fetching market prices:
   - `GET /api/market/prices?crop={cropName}&lat={latitude}&lon={longitude}`

2. The API should return data in this format:
   ```json
   [
     {
       "id": "1",
       "market": "Market Name",
       "price": "₹2,450/quintal",
       "distance": "12 km",
       "lastUpdated": "2025-10-12T10:30:00Z"
     }
   ]
   ```

## Future Improvements

1. Add price history graphs for each crop
2. Implement user favorites for quickly accessing frequently checked crops
3. Add price alerts/notifications when prices cross certain thresholds
4. Integrate with government mandi APIs for real-time data
