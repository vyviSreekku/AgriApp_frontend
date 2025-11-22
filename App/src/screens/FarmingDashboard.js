import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { getLatestWeatherData } from '../services/weatherDataHelper';
import { fetchAllWeatherData, mapConditionToIcon, extractTemperature, extractPercentage } from '../services/weatherServices';
import { mapWeatherIcon, getDayName, formatTemperature, calculateRainChance, getShortLocation } from '../utils/weatherUtils';
import { storeFullData, getFullData, isDataStale } from '../services/dataStorageService';
import ChatbotModal from './ChatbotModel';

const { width } = Dimensions.get('window');
const moduleCardWidth = (width - 60) / 2; // 2 cards per row with spacing

const FarmingDashboard = ({ navigation }) => {
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
      setErrorMsg(null);
      
      try {
        // Use the centralized weather data helper that handles caching
        const cachedData = await getLatestWeatherData();
        
        setLocation(cachedData.location);
        setWeatherData(cachedData.weather);
        
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
      // Force fresh data by passing true to getLatestWeatherData
      const freshData = await getLatestWeatherData(true);
      
      setLocation(freshData.location);
      setWeatherData(freshData.weather);
      
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

  // Safely extract wind speed (km/h) from various possible shapes
  const getWindSpeed = (data) => {
    if (!data || typeof data !== 'object') return null;
    // Preferred top-level structured wind object
    if (data.wind) {
      if (data.wind.speed && typeof data.wind.speed === 'object' && typeof data.wind.speed.value === 'number') {
        return data.wind.speed.value;
      }
      if (typeof data.wind.speed === 'number') {
        return data.wind.speed;
      }
    }
    // Google Weather raw nested debug data
    const rawWind = data.debug_raw_data?.wind?.speed?.value;
    if (typeof rawWind === 'number') return rawWind;
    // Any alternative direct fields (future proofing)
    if (typeof data.wind_speed === 'number') return data.wind_speed;
    return null;
  };

  const navigateToMarket = () => {
    navigation.navigate('Market');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
      <ChatbotModal />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Farmer</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={22} color="#4f46e5" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          {loading ? (
            <LinearGradient
              colors={['#38bdf8', '#3b82f6', '#4f46e5']}
              style={styles.weatherGradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={[styles.loadingText, { color: '#ffffff' }]}>Getting weather for your location...</Text>
              </View>
            </LinearGradient>
          ) : errorMsg ? (
            <LinearGradient
              colors={['#38bdf8', '#3b82f6', '#4f46e5']}
              style={styles.weatherGradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#ffffff" />
                <Text style={[styles.errorText, { color: '#ffffff' }]}>{errorMsg}</Text>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#38bdf8', '#3b82f6', '#4f46e5']}
              style={styles.weatherGradientBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.currentWeather}>
                <View style={styles.leftWeatherSection}>
                  <TouchableOpacity 
                    onPress={refreshWeather} 
                    style={styles.locationContainer}
                  >
                    <View style={styles.locationBadge}>
                      <Ionicons name="location" size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.location}>
                      {getShortLocation(weatherData)}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.temperatureRow}>
                    <Text style={styles.temperature}>
                      {weatherData?.main?.temp 
                        ? Math.round(weatherData.main.temp)
                        : weatherData?.temperature_value 
                          ? Math.round(weatherData.temperature_value)
                          : '--'}
                    </Text>
                    <Text style={styles.temperatureUnit}>°C</Text>
                  </View>
                  
                  <View style={styles.conditionsRow}>
                    <View style={styles.conditionBadge}>
                      <MaterialCommunityIcons 
                        name={weatherData?.weather?.[0]?.main === 'Clear' ? 'white-balance-sunny' : 
                              weatherData?.weather?.[0]?.main === 'Rain' ? 'weather-rainy' :
                              weatherData?.condition === 'Clear' ? 'white-balance-sunny' :
                              weatherData?.condition === 'Rain' ? 'weather-rainy' : 
                              'weather-cloudy'} 
                        size={14} 
                        color="#fde68a" 
                      />
                      <Text style={styles.conditionText}>
                        {weatherData?.weather?.[0]?.main || weatherData?.condition || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.conditionBadge}>
                      <Ionicons name="speedometer-outline" size={14} color="#e0f2fe" />
                      <Text style={styles.conditionText}>
                        {(() => {
                          const ws = getWindSpeed(weatherData);
                          return ws !== null ? Math.round(ws) : '—';
                        })()} km/h
                      </Text>
                    </View>
                    <View style={styles.conditionBadge}>
                      <Ionicons name="rainy" size={14} color="#e0f2fe" />
                      <Text style={styles.conditionText}>{calculateRainChance(weatherData)}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.rightWeatherSection}>
                  <View style={styles.weatherIconContainer}>
                    <MaterialCommunityIcons 
                      name={weatherData?.weather?.[0]?.icon
                        ? mapWeatherIcon(weatherData.weather[0].icon)
                        : weatherData?.condition 
                          ? mapWeatherIcon(mapConditionToIcon(weatherData.condition)) 
                          : "weather-partly-cloudy"
                      } 
                      size={64} 
                      color="rgba(255, 255, 255, 0.9)" 
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={refreshWeather}
                >
                  <Ionicons name="refresh" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.weatherDivider} />
              
              <View style={styles.forecastSection}>
                <Text style={styles.forecastTitle}>Weekly Forecast</Text>
                <View style={styles.forecastContainer}>
                  {Array.isArray(weatherData?.forecast) && weatherData.forecast.slice(0, 4).map((day, index) => (
                    <View key={index} style={styles.forecastCard}>
                      <Text style={styles.forecastDayLabel}>
                        {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 
                         day.dt ? getDayName(day.dt) : `Day ${index + 1}`}
                      </Text>
                      <Text style={styles.forecastTemp}>
                        {day.main?.temp_max 
                          ? Math.round(day.main.temp_max) 
                          : day.day?.temp_max 
                            ? Math.round(day.day.temp_max) 
                            : '?'}°
                      </Text>
                      <MaterialCommunityIcons 
                        name={
                          day.weather?.[0]?.icon 
                            ? mapWeatherIcon(day.weather[0].icon) 
                            : day.day?.condition 
                              ? mapWeatherIcon(mapConditionToIcon(day.day.condition)) 
                              : "weather-sunny"
                        } 
                        size={16} 
                        color="#fde68a" 
                      />
                    </View>
                  ))}
                  {(!Array.isArray(weatherData?.forecast) || weatherData.forecast.length === 0) && (
                    <View style={styles.forecastColumn}>
                      <Text style={{ color: '#e0f2fe' }}>No forecast available</Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Camera Button */}
        <TouchableOpacity 
          style={styles.cameraButton}
          onPress={() => navigation.navigate('PlantImageCapture')}
        >
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
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('CropRecommendation')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="sprout" size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.moduleTitle}>Crop Recommendation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('WeedProtection')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#dcfce7' }]}> 
              <MaterialCommunityIcons name="flower" size={24} color="#22c55e" />
            </View>
            <Text style={styles.moduleTitle}>Weed Protection</Text>
          </TouchableOpacity>
          
          {/* Row 2 */}
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('KnowledgeHub')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#f3e8ff' }]}> 
              <Ionicons name="book" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.moduleTitle}>Knowledge Hub</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('SoilPh')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#ffedd5' }]}> 
              <FontAwesome5 name="flask" size={24} color="#f97316" />
            </View>
            <Text style={styles.moduleTitle}>Soil pH</Text>
          </TouchableOpacity>
          
          {/* Row 3 */}
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('FertilizerRecommendation')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#fef9c3' }]}> 
              <Feather name="droplet" size={24} color="#eab308" />
            </View>
            <Text style={styles.moduleTitle}>Fertilizer Recommendation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('SoilType')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#f1f5f9' }]}> 
              <Feather name="layers" size={24} color="#64748b" />
            </View>
            <Text style={styles.moduleTitle}>Soil Type</Text>
          </TouchableOpacity>
          
          {/* Row 4 */}
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('PestDetection')}>
            <View style={[styles.moduleIcon, { backgroundColor: '#fee2e2' }]}> 
              <MaterialCommunityIcons name="bug" size={24} color="#ef4444" />
            </View>
            <Text style={styles.moduleTitle}>Pest Detection</Text>
          </TouchableOpacity>
          
          {/* Irrigation Assistant removed */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingBottom: 20,
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 6,
    fontWeight: "500",
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  
  // Weather Card
  weatherCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  weatherGradientBackground: {
    padding: 20,
    borderRadius: 24,
    position: 'relative',
  },
  currentWeather: {
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
  },
  leftWeatherSection: {
    flex: 1,
  },
  rightWeatherSection: {
    alignItems: 'center',
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  temperature: {
    fontSize: 60,
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: -2,
  },
  temperatureUnit: {
    fontSize: 30,
    color: "#e0f2fe",
    marginLeft: 4,
  },
  location: {
    fontSize: 14,
    color: "#e0f2fe",
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  conditionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  conditionText: {
    fontSize: 12,
    color: '#ffffff',
  },
  rainPrediction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  rainText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  weatherIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  refreshHint: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshHintText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  weatherDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 20,
    zIndex: 1,
  },
  forecastSection: {
    zIndex: 1,
  },
  forecastTitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginBottom: 16,
  },
  forecastContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  forecastCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  forecastColumn: {
    flex: 1,
    alignItems: "center",
  },
  forecastDayLabel: {
    fontSize: 12,
    color: "#e0f2fe",
    marginBottom: 8,
  },
  forecastDay: {
    alignItems: "center",
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    marginTop: 4,
  },
  
  // Camera Button
  cameraButton: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cameraGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraContent: {
    alignItems: "center",
  },
  cameraText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    letterSpacing: 0.5,
  },
  cameraSubtext: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 6,
    fontWeight: "400",
  },
  
  // Module Grid
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 18,
    letterSpacing: 0.5,
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
    borderRadius: 20,
    padding: 16,
    margin: 7.5,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.8)",
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "left",
    letterSpacing: 0.1,
    lineHeight: 18,
    flexWrap: "wrap",
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

export default FarmingDashboard;
