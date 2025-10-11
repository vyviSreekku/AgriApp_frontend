import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform, Alert, Linking } from 'react-native';

/**
 * Check the current location permission status
 * @returns {Promise<string>} Permission status
 */
export const checkLocationPermission = async () => {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
};

/**
 * Open device location settings to allow user to enable location permissions
 */
export const openLocationSettings = async () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
    );
  }
};

/**
 * Show alert to request location permission again
 * @param {function} onRetry - Function to call when user wants to retry permission
 */
export const showLocationPermissionAlert = (onRetry) => {
  Alert.alert(
    "Location Permission Required",
    "This app needs location permissions to show accurate weather information for your area.",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      { 
        text: "Open Settings", 
        onPress: () => openLocationSettings() 
      },
      {
        text: "Try Again",
        onPress: onRetry
      }
    ],
    { cancelable: false }
  );
};

/**
 * Request location permission and get current position
 * @param {boolean} shouldShowAlert - Whether to show an alert if permission is denied
 * @returns {Promise<Object>} Location object with coordinates
 */
export const getLocationAsync = async (shouldShowAlert = false) => {
  // First check current permission status
  let status = await checkLocationPermission();
  
  // If not granted, request permission
  if (status !== 'granted') {
    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
    status = newStatus;
  }

  // If still not granted and should show alert, throw specific error
  if (status !== 'granted') {
    const error = new Error('Permission to access location was denied');
    error.permissionDenied = true;
    
    // If we should show an alert and handle it here
    if (shouldShowAlert) {
      showLocationPermissionAlert(() => getLocationAsync(true));
    }
    
    throw error;
  }
  
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};
