import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getFullData } from '../services/dataStorageService';

/**
 * Sample crop recommendation component that uses stored weather data
 * This demonstrates how to use the centralized data storage in other modules
 */
const CropRecommendations = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cropSuggestions, setCropSuggestions] = useState([]);

  useEffect(() => {
    // Load the stored weather data
    const loadData = async () => {
      try {
        const storedData = await getFullData();
        if (storedData?.weather) {
          setWeatherData(storedData.weather);
          
          // Generate crop suggestions based on weather data
          const suggestions = generateCropSuggestions(storedData.weather);
          setCropSuggestions(suggestions);
        }
      } catch (error) {
        console.error("Error loading crop recommendation data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Simple function to generate crop suggestions based on weather
  // This is just a sample implementation - replace with your actual logic
  const generateCropSuggestions = (weather) => {
    const temperature = weather?.main?.temp || 0;
    const humidity = weather?.main?.humidity || 0;
    const condition = weather?.weather?.[0]?.main || '';
    const rainfall = weather?.forecast?.[0]?.day?.precipitation?.probability?.percent || 0;
    
    // Simple logic for demonstration - replace with your own crop recommendation algorithm
    let suggestions = [];
    
    // Temperature-based recommendations
    if (temperature > 30) {
      suggestions.push({
        id: '1',
        crop: 'Rice',
        suitability: 'High',
        reason: 'Thrives in hot weather conditions'
      });
      suggestions.push({
        id: '2',
        crop: 'Cotton',
        suitability: 'High',
        reason: 'Suitable for warm temperatures'
      });
    } else if (temperature >= 20 && temperature <= 30) {
      suggestions.push({
        id: '3',
        crop: 'Wheat',
        suitability: 'High',
        reason: 'Optimal growing temperature'
      });
      suggestions.push({
        id: '4',
        crop: 'Maize',
        suitability: 'High',
        reason: 'Good for moderate temperatures'
      });
    } else {
      suggestions.push({
        id: '5',
        crop: 'Potatoes',
        suitability: 'Medium',
        reason: 'Can tolerate cooler weather'
      });
      suggestions.push({
        id: '6',
        crop: 'Peas',
        suitability: 'High',
        reason: 'Prefers cooler temperatures'
      });
    }
    
    // Humidity-based additions
    if (humidity > 70) {
      suggestions.push({
        id: '7',
        crop: 'Taro',
        suitability: 'High',
        reason: 'Thrives in humid conditions'
      });
    }
    
    // Rainfall probability based recommendations
    if (rainfall > 50) {
      suggestions.push({
        id: '8',
        crop: 'Water Chestnut',
        suitability: 'Medium',
        reason: 'Suitable for wet conditions'
      });
    } else if (rainfall < 20) {
      suggestions.push({
        id: '9',
        crop: 'Millet',
        suitability: 'High',
        reason: 'Drought-resistant crop'
      });
    }
    
    return suggestions;
  };

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading crop recommendations...</Text>
      </View>
    );
  }

  // Render crop suggestions
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crop Recommendations</Text>
      <Text style={styles.subtitle}>Based on current weather conditions</Text>
      
      <FlatList
        data={cropSuggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cropItem}>
            <View style={styles.cropHeader}>
              <Text style={styles.cropName}>{item.crop}</Text>
              <Text style={[
                styles.suitabilityBadge,
                item.suitability === 'High' ? styles.highSuitability :
                item.suitability === 'Medium' ? styles.mediumSuitability :
                styles.lowSuitability
              ]}>
                {item.suitability}
              </Text>
            </View>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No crop recommendations available</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2E7D32',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  cropItem: {
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#33691E',
  },
  suitabilityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  highSuitability: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  mediumSuitability: {
    backgroundColor: '#FFE0B2',
    color: '#EF6C00',
  },
  lowSuitability: {
    backgroundColor: '#FFCDD2',
    color: '#C62828',
  },
  reasonText: {
    fontSize: 14,
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export default CropRecommendations;