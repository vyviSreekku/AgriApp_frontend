import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getLocationAsync, checkLocationPermission } from './src/utils/locationService';
import { fetchAllWeatherData, mapConditionToIcon, extractTemperature, extractPercentage } from './src/services/weatherServices';
import { mapWeatherIcon, getDayName, formatTemperature, calculateRainChance } from './src/utils/weatherUtils';
import { storeFullData, getFullData, isDataStale } from './src/services/dataStorageService';

const { width } = Dimensions.get('window');
const moduleCardWidth = (width - 60) / 2; // 2 cards per row with spacing

export default function FarmingDashboard() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  
  const today = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', options);
  
  useEffect(() => {
    const loadWeatherData = async () => {
      setLoading(true);
      
      try {
        // First try to get cached data
        const cachedData = await getFullData();
        
        // If we have cached data, use it immediately while fetching fresh data in the background
        if (cachedData) {
          console.log('Using cached weather data');
          setLocation(cachedData.location);
          setWeatherData(cachedData.weather);
        }
        
        // Get location using our enhanced location service with alert handling
        const locationData = await getLocationAsync(true);
        setLocation(locationData);
        
        // Get weather data from FastAPI backend with offline support
        const { latitude, longitude } = locationData.coords;
        
        // Get all weather data with offline support
        const allWeatherData = await fetchAllWeatherData(latitude, longitude);
        setWeatherData(allWeatherData);
        
        // Store the complete data for other modules to use
        await storeFullData({
          location: locationData,
          weather: allWeatherData,
          forecast: allWeatherData.forecast,
          timestamp: Date.now()
        });
        
      } catch (error) {
        console.error("Error:", error);
        // Only set error message if it's not a permission error being handled by the alert
        if (!error.permissionDenied) {
          setErrorMsg(error.message || 'Failed to get weather information');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadWeatherData();
  }, []);
  
  // Function to refresh weather data
  const refreshWeather = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      let currentLocation = location;
      
      // If location is null or there was a previous permission error, request location again
      if (!currentLocation || errorMsg?.includes('Permission to access location was denied')) {
        console.log('Requesting location permission again...');
        // Use our enhanced location service with permission alert handling
        const locationData = await getLocationAsync(true);
        currentLocation = locationData;
        setLocation(locationData);
      }
      
      // Get updated weather data
      const { latitude, longitude } = currentLocation.coords;
      const allWeatherData = await fetchAllWeatherData(latitude, longitude);
      setWeatherData(allWeatherData);
      
      // Store the complete data for other modules to use
      await storeFullData({
        location: currentLocation,
        weather: allWeatherData,
        forecast: allWeatherData.forecast,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error("Error refreshing weather:", error);
      // Only set error message if it's not a permission error being handled by the alert
      if (!error.permissionDenied) {
        setErrorMsg(error.message || 'Failed to refresh weather data');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, Farmer</Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Feather name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Weather Card */}
          <View style={styles.weatherCard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Getting weather for your location...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                style={styles.weatherGradientBackground}
              >
                <View style={styles.currentWeather}>
                  <View>
                    <Text style={styles.temperature}>
                      {weatherData?.main?.temp 
                        ? `${weatherData.main.temp}°C` 
                        : weatherData?.current?.temperature_value 
                          ? `${weatherData.current.temperature_value}°C`
                          : weatherData?.current?.temperature || 'N/A'}
                    </Text>
                    <Text style={styles.location}>
                      {weatherData?.location || 'Loading location...'}
                    </Text>
                    <View style={styles.rainPrediction}>
                      <Ionicons name="water" size={14} color="#3b82f6" />
                      <Text style={styles.rainText}>
                        {calculateRainChance(weatherData)} chance of rain today
                      </Text>
                    </View>
                  </View>
                  <View style={styles.weatherIconContainer}>
                    <MaterialCommunityIcons 
                      name={weatherData?.weather?.[0]?.icon
                        ? mapWeatherIcon(weatherData.weather[0].icon)
                        : weatherData?.current?.condition 
                          ? mapWeatherIcon(mapConditionToIcon(weatherData.current.condition)) 
                          : "weather-partly-cloudy"
                      } 
                      size={80} 
                      color="#3b82f6" 
                    />
                  </View>
                  <TouchableOpacity 
                    style={styles.refreshButton} 
                    onPress={refreshWeather}
                  >
                    <Ionicons name="refresh" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.weatherDivider} />
                
                <View style={styles.forecastContainer}>
                  {Array.isArray(weatherData?.forecast) ? weatherData.forecast.map((day, index) => (
                    <View key={index} style={styles.forecastColumn}>
                      <Text style={styles.forecastDayLabel}>
                        {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 
                         day.dt ? getDayName(day.dt) : `Day ${index + 1}`}
                      </Text>
                      <View style={styles.forecastDay}>
                        <MaterialCommunityIcons 
                          name={
                            day.weather?.[0]?.icon 
                              ? mapWeatherIcon(day.weather[0].icon) 
                              : day.day?.condition 
                                ? mapWeatherIcon(mapConditionToIcon(day.day.condition)) 
                                : "weather-sunny"
                          } 
                          size={24} 
                          color="#3b82f6" 
                        />
                        <Text style={styles.forecastTemp}>
                          {day.main?.temp_max 
                            ? Math.round(day.main.temp_max) 
                            : day.day?.temp_max 
                              ? Math.round(day.day.temp_max) 
                              : '?'}°
                        </Text>
                      </View>
                    </View>
                  )) : (
                    <View style={styles.forecastColumn}>
                      <Text>No forecast available</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            )}
          </View>

          {/* Camera Button */}
          <TouchableOpacity style={styles.cameraButton}>
            <LinearGradient
              colors={['#4f46e5', '#3b82f6']}
              style={styles.cameraGradient}
            >
              <View style={styles.cameraContent}>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.cameraText}>Capture Plant Image</Text>
                <Text style={styles.cameraSubtext}>Identify weeds or pests instantly</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Module Grid */}
          <Text style={styles.sectionTitle}>Farm Modules</Text>
          <View style={styles.moduleGrid}>
            {/* Row 1 */}
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#e0f2fe' }]}>
                <MaterialCommunityIcons name="sprout" size={24} color="#0ea5e9" />
              </View>
              <Text style={styles.moduleTitle}>Crop Recommendation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="flower" size={24} color="#22c55e" />
              </View>
              <Text style={styles.moduleTitle}>Weed Protection</Text>
            </TouchableOpacity>
            
            {/* Row 2 */}
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="book" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.moduleTitle}>Knowledge Hub</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#ffedd5' }]}>
                <FontAwesome5 name="flask" size={24} color="#f97316" />
              </View>
              <Text style={styles.moduleTitle}>Soil pH</Text>
            </TouchableOpacity>
            
            {/* Row 3 */}
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#fef9c3' }]}>
                <Feather name="droplet" size={24} color="#eab308" />
              </View>
              <Text style={styles.moduleTitle}>Fertilizer Recommendation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="layers" size={24} color="#64748b" />
              </View>
              <Text style={styles.moduleTitle}>Soil Type</Text>
            </TouchableOpacity>
            
            {/* Row 4 */}
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="bug" size={24} color="#ef4444" />
              </View>
              <Text style={styles.moduleTitle}>Pest Detection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.moduleCard}>
              <View style={[styles.moduleIcon, { backgroundColor: '#e0e7ff' }]}>
                <Feather name="cloud-rain" size={24} color="#4f46e5" />
              </View>
              <Text style={styles.moduleTitle}>Irrigation Assistant</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#4f46e5" />
            <Text style={[styles.navText, { color: "#4f46e5" }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Feather name="shopping-cart" size={24} color="#94a3b8" />
            <Text style={styles.navText}>Market</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Feather name="briefcase" size={24} color="#94a3b8" />
            <Text style={styles.navText}>Job</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="people-outline" size={24} color="#94a3b8" />
            <Text style={styles.navText}>Community</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Feather name="user" size={24} color="#94a3b8" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    paddingBottom: 90, // Space for bottom navigation
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  dateText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Weather Card
  weatherCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherGradientBackground: {
    padding: 20,
    borderRadius: 16,
  },
  currentWeather: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  temperature: {
    fontSize: 42,
    fontWeight: "700",
    color: "#1e293b",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  location: {
    fontSize: 16,
    color: "#334155",
    marginBottom: 8,
    fontWeight: "500",
  },
  rainPrediction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  rainText: {
    color: "#3b82f6",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  weatherIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  weatherDivider: {
    height: 1,
    backgroundColor: "rgba(226, 232, 240, 0.7)",
    marginVertical: 15,
  },
  forecastContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  forecastColumn: {
    alignItems: "center",
    width: '25%', // Set to 25% for 4 columns
  },
  forecastDayLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 5,
  },
  forecastDay: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 2,
  },
  
  // Camera Button
  cameraButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraGradient: {
    padding: 20,
    borderRadius: 20,
  },
  cameraContent: {
    alignItems: "center",
  },
  cameraText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  cameraSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  
  // Module Grid
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  moduleCard: {
    width: moduleCardWidth,
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 16,
    margin: 7.5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  
  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    position: "relative",
    paddingTop: 12,
  },
  navIndicator: {
    position: "absolute",
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4f46e5",
  },
  navText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    textAlign: 'center',
  },
});