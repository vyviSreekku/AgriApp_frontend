import React from 'react';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

/**
 * Main App Entry Point
 * 
 * This file exports the bottom tab navigator which handles all app navigation.
 * The actual FarmingDashboard component is located in src/screens/FarmingDashboard.js
 */
export default function App() {
  return <BottomTabNavigator/>;
}