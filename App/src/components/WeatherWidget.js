import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getFullData, isDataStale } from '../services/dataStorageService';
import { fetchAllWeatherData } from '../services/weatherServices';

/**
 * Example component showing how to use the stored weather data
 * This can be used in any part of your app
 */
const WeatherWidget = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Maximum age of data in milliseconds (30 minutes)
  const DATA_MAX_AGE = 30 * 60 * 1000;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get stored data
        const storedData = await getFullData();
        
        // Check if we have data and if it's not too old
        if (storedData && !isDataStale(storedData.timestamp, DATA_MAX_AGE)) {
          console.log('Using stored weather data');
          setData(storedData);
          setLoading(false);
          return;
        }
        
        // If data is stale or missing, we can use the location to fetch fresh data
        if (storedData?.location?.coords) {
          const { latitude, longitude } = storedData.location.coords;
          const freshData = await fetchAllWeatherData(latitude, longitude);
          setData({
            weather: freshData,
            forecast: freshData.forecast,
            location: storedData.location,
            timestamp: Date.now()
          });
        } else {
          // No stored location, show error
          setError('No weather data available. Please refresh from the main screen.');
        }
      } catch (err) {
        console.error('Error loading weather widget data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Extract the data needed for the widget
  const currentTemp = data?.weather?.main?.temp;
  const weatherCondition = data?.weather?.weather?.[0]?.main;
  
  // Get location name from the new location_data structure if available
  let locationName = 'Unknown Location';
  if (data?.weather?.location_data?.display_name) {
    locationName = data.weather.location_data.display_name;
  } else if (data?.weather?.location) {
    locationName = data.weather.location;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.locationText}>{locationName}</Text>
      <Text style={styles.temperatureText}>{currentTemp}°C</Text>
      <Text style={styles.conditionText}>{weatherCondition}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  temperatureText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  conditionText: {
    fontSize: 18,
    color: '#666',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  }
});

export default WeatherWidget;