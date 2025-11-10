import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from "@expo/vector-icons";

// Import screens

import FarmingDashboard from '../screens/FarmingDashboard';
import MarketScreen from '../screens/MarketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeedProtectionScreen from '../screens/WeedProtectionScreen';
import KnowledgeHubScreen from '../screens/KnowledgeHubScreen';
import SoilPhScreen from '../screens/SoilPhScreen';
import FertilizerRecommendationScreen from '../screens/FertilizerRecommendationScreen';
import SoilTypeScreen from '../screens/SoilTypeScreen';
import PestDetectionScreen from '../screens/PestDetectionScreen';
import IrrigationAssistantScreen from '../screens/IrrigationAssistantScreen';
import PlantImageCaptureScreen from '../screens/PlantImageCaptureScreen';
import { createStackNavigator } from '@react-navigation/stack';


const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: true }}>
      <HomeStack.Screen name="FarmingDashboard" component={FarmingDashboard} options={{ title: 'Dashboard', headerShown: false }} />
      <HomeStack.Screen name="PlantImageCapture" component={PlantImageCaptureScreen} options={{ title: 'Capture Image', headerShown: false }} />
      <HomeStack.Screen name="WeedProtection" component={WeedProtectionScreen} options={{ title: 'Weed Protection' }} />
      <HomeStack.Screen name="KnowledgeHub" component={KnowledgeHubScreen} options={{ title: 'Knowledge Hub' }} />
      <HomeStack.Screen name="SoilPh" component={SoilPhScreen} options={{ title: 'Soil pH' }} />
      <HomeStack.Screen name="FertilizerRecommendation" component={FertilizerRecommendationScreen} options={{ title: 'Fertilizer Recommendation' }} />
      <HomeStack.Screen name="SoilType" component={SoilTypeScreen} options={{ title: 'Soil Type' }} />
      <HomeStack.Screen name="PestDetection" component={PestDetectionScreen} options={{ title: 'Pest Detection' }} />
      <HomeStack.Screen name="IrrigationAssistant" component={IrrigationAssistantScreen} options={{ title: 'Irrigation Assistant' }} />
    </HomeStack.Navigator>
  );
}

const BottomTabNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Market" 
        component={MarketScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-cart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Capture" 
        component={EmptyScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#4f46e5',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: -10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 6,
              }}
            >
              <Ionicons name="camera" size={26} color="#fff" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Navigate into Home stack to open the camera capture flow
            navigation.navigate('Home', { screen: 'PlantImageCapture' });
          },
        })}
      />
      <Tab.Screen 
        name="Community" 
        component={EmptyScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    </NavigationContainer>
  );
};

// Placeholder for other screens
const EmptyScreen = () => null;

export default BottomTabNavigator;
