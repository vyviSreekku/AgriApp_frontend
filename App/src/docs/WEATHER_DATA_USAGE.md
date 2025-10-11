# Weather Data Storage and Usage Guide

This document explains how weather data is stored and can be accessed across different modules in the app.

## Overview

The app now stores complete weather, location, and forecast data in a centralized data storage service. This data is automatically cached and can be accessed from any component or module within the application.

## Available Services

### 1. Data Storage Service (`dataStorageService.js`)

This service provides low-level functions for storing and retrieving data:

```javascript
import { 
  storeFullData,
  getFullData,
  getLocationData,
  getWeatherData,
  getForecastData,
  isDataStale,
  clearAllData
} from './src/services/dataStorageService';
```

### 2. Weather Data Helper (`weatherDataHelper.js`)

This provides higher-level functions for easy access to weather data:

```javascript
import {
  getLatestWeatherData,
  getCurrentTemperature,
  getCurrentHumidity,
  getCurrentWeatherCondition,
  getRainChanceToday,
  getForecastForDay,
  getCurrentLocationName
} from './src/services/weatherDataHelper';
```

## How to Use Weather Data in Your Component

### Basic Usage

The simplest way to access weather data is using the helper functions:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { getCurrentTemperature, getCurrentWeatherCondition } from '../services/weatherDataHelper';

const MyWeatherComponent = () => {
  const [temperature, setTemperature] = useState(null);
  const [condition, setCondition] = useState(null);
  
  useEffect(() => {
    async function loadWeatherData() {
      const temp = await getCurrentTemperature();
      const cond = await getCurrentWeatherCondition();
      
      setTemperature(temp);
      setCondition(cond);
    }
    
    loadWeatherData();
  }, []);
  
  return (
    <View>
      <Text>Temperature: {temperature}°C</Text>
      <Text>Condition: {condition}</Text>
    </View>
  );
};
```

### Advanced Usage: Getting Complete Data

If you need access to the complete weather data object:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getLatestWeatherData } from '../services/weatherDataHelper';

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  
  useEffect(() => {
    async function loadData() {
      const data = await getLatestWeatherData();
      setWeatherData(data);
    }
    
    loadData();
  }, []);
  
  // Use the data however you need
  if (!weatherData) return <Text>Loading...</Text>;
  
  return (
    <View>
      <Text>Location: {weatherData.weather.location}</Text>
      <Text>Temperature: {weatherData.weather.main.temp}°C</Text>
      
      <Text>Forecast:</Text>
      <FlatList
        data={weatherData.forecast}
        keyExtractor={(item, index) => `forecast-${index}`}
        renderItem={({ item }) => (
          <Text>
            {item.date}: {item.day.temperature}°C, {item.day.condition}
          </Text>
        )}
      />
    </View>
  );
};
```

### Forcing a Data Refresh

If you need fresh data, you can pass `true` to the `forceFresh` parameter:

```javascript
const freshData = await getLatestWeatherData(true);
```

### Example Components

Two example components are provided to demonstrate usage:

1. `WeatherWidget.js` - A simple weather display that can be included in any screen
2. `CropRecommendations.js` - A component that generates crop suggestions based on weather data

## Data Structure

The stored data has the following structure:

```javascript
{
  location: {
    // Location object from expo-location
    coords: {
      latitude: Number,
      longitude: Number,
      altitude: Number,
      accuracy: Number,
      altitudeAccuracy: Number,
      heading: Number,
      speed: Number
    },
    timestamp: Number
  },
  weather: {
    // Weather data object
    location: String,
    name: String,
    main: {
      temp: Number,
      humidity: Number
    },
    weather: [{
      main: String,
      description: String,
      icon: String
    }],
    current: Object, // Current weather details
    forecast: Array   // Forecast data
  },
  forecast: Array,  // Same as weather.forecast
  timestamp: Number // When the data was last updated
}
```