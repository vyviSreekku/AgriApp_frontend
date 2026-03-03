import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, Feather } from "@expo/vector-icons";
import authService from '../services/authService';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

// Import screens

import FarmingDashboard from '../screens/FarmingDashboard';
import MarketScreen from '../screens/Market/MarketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WeedProtectionScreen from '../screens/Weed/WeedProtectionScreen';
import KnowledgeHubScreen from '../screens/KnowledgeHub/Knowledgehub';
import CropInfo from '../screens/KnowledgeHub/Cropinfo';
import PestInfo from '../screens/KnowledgeHub/Pestinfo';
import WeedInfo from '../screens/KnowledgeHub/Weedinfo';
import SoilPhScreen from '../screens/PHDetection/PHDetectionScreen';
import FertilizerRecommendationScreen from '../screens/FertilizerRecommendation/FertilizerRecommendationScreen';
import CropRecommendationScreen from '../screens/CropRecommendation/CropRecommendationScreen';
import SoilTypeScreen from '../screens/Soil/SoilTypeScreen';
import PestDetectionScreen from '../screens/PestDetection/PestDetectionScreen';
import DiseaseDetectionScreen from '../screens/DiseaseDetection/DiseaseDetectionScreen';
// import PHDetectionScreen from '../screens/PHDetection/PHDetectionScreen';
import PlantImageCaptureScreen from '../screens/PlantImageCaptureScreen';
import Community from '../screens/Community/Community';
import AskCommunity from '../screens/Community/AskCommunity';
import PostDetail from '../screens/Community/PostDetail';
import NotificationScreen from '../screens/NotificationScreen';


const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const CommunityStack = createStackNavigator();
const AuthStack = createStackNavigator();
const RootStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: true }}>
      <HomeStack.Screen name="FarmingDashboard" component={FarmingDashboard} options={{ title: 'Dashboard', headerShown: false }} />
      <HomeStack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Notifications', headerShown: false }} />
      <HomeStack.Screen name="PlantImageCapture" component={PlantImageCaptureScreen} options={{ title: 'Capture Image', headerShown: false }} />
      <HomeStack.Screen name="WeedProtection" component={WeedProtectionScreen} options={{ title: '' }} />
      <HomeStack.Screen name="KnowledgeHub" component={KnowledgeHubScreen} options={{ title: '' }} />
      <HomeStack.Screen name="CropInfo" component={CropInfo} options={{ title: '' }} />
      <HomeStack.Screen name="PestInfo" component={PestInfo} options={{ title: '' }} />
      <HomeStack.Screen name="WeedInfo" component={WeedInfo} options={{ title: '' }} />
      <HomeStack.Screen name="SoilPh" component={SoilPhScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="FertilizerRecommendation" component={FertilizerRecommendationScreen} options={{ title: '' }} />
        <HomeStack.Screen name="CropRecommendation" component={CropRecommendationScreen} options={{ title: '' }} />
      <HomeStack.Screen name="SoilType" component={SoilTypeScreen} options={{ title: '' }} />
      <HomeStack.Screen name="PestDetection" component={PestDetectionScreen} options={{ title: '' }} />
      <HomeStack.Screen name="DiseaseDetection" component={DiseaseDetectionScreen} options={{ title: '' }} />
      {/* <HomeStack.Screen name="PHDetection" component={PHDetectionScreen} options={{ title: 'Soil pH Check' }} /> */}
    </HomeStack.Navigator>
  );
}

function CommunityStackScreen() {
  return (
    <CommunityStack.Navigator screenOptions={{ headerShown: false }}>
      <CommunityStack.Screen name="CommunityMain" component={Community} options={{ title: 'Community' }} />
      <CommunityStack.Screen name="AskCommunity" component={AskCommunity} options={{ title: 'Ask Community' }} />
      <CommunityStack.Screen name="PostDetail" component={PostDetail} options={{ title: 'Post Details' }} />
    </CommunityStack.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="OTP" component={OtpScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </AuthStack.Navigator>
  );
}

function MainAppTabs() {
  return (
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
        component={CommunityStackScreen} 
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
  );
}

const BottomTabNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkLoginStatus();
    
    // Listen for auth changes
    const interval = setInterval(async () => {
      const loggedIn = await authService.isLoggedIn();
      if (loggedIn !== isLoggedIn) {
        setIsLoggedIn(loggedIn);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  async function checkLoginStatus() {
    const loggedIn = await authService.isLoggedIn();
    setIsLoggedIn(loggedIn);
  }

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <RootStack.Screen name="MainApp" component={MainAppTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Placeholder for other screens
const EmptyScreen = () => null;

export default BottomTabNavigator;
