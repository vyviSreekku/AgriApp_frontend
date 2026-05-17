import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { AuthProvider } from './src/auth/AuthProvider';
import OfflineRagService from './src/services/offlineRagService';

/**
 * Main App Entry Point
 * 
 * This file exports the bottom tab navigator which handles all app navigation.
 * The actual FarmingDashboard component is located in src/screens/FarmingDashboard.js
 */
export default function App() {
  useEffect(() => {
    let cancelled = false;

    const prefetchOfflineRagBundle = async () => {
      try {
        const networkState = await NetInfo.fetch();
        if (cancelled || !networkState.isConnected) {
          console.log('Skipping offline RAG prefetch because the device is offline');
          return;
        }

        const bundleInfo = await OfflineRagService.prefetchBundle();
        if (!cancelled) {
          console.log(`App startup RAG prefetch complete (${bundleInfo.sizeLabel})`);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('App startup RAG prefetch failed:', error);
        }
      }
    };

    prefetchOfflineRagBundle();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthProvider>
      <BottomTabNavigator />
    </AuthProvider>
  );
}