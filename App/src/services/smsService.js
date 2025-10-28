import { Platform, PermissionsAndroid, Alert, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { File } from 'expo-file-system';
import { getInfoAsync, readAsStringAsync, deleteAsync } from 'expo-file-system/legacy';

// SMS Service for offline weather requests
class SMSService {
  static SERVER_NUMBER = '+918547719131';

  /**
   * Check if SMS permissions are granted
   */
  static async checkSMSPermissions() {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );
      return granted;
    } catch (err) {
      console.error('Error checking SMS permissions:', err);
      return false;
    }
  }

  /**
   * Request SMS permissions
   */
  static async requestSMSPermissions() {
    if (Platform.OS !== 'android') {
      Alert.alert('SMS Not Supported', 'SMS functionality is only available on Android devices.');
      return false;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);

      const sendGranted = granted[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;
      const receiveGranted = granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;

      if (!sendGranted || !receiveGranted) {
        Alert.alert(
          'SMS Permissions Required',
          'SMS permissions are needed to get weather updates when offline. Please grant permissions in settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error requesting SMS permissions:', err);
      return false;
    }
  }

  /**
   * Send weather request via native SMS module (direct sending)
   */
  static async sendWeatherRequest(latitude, longitude) {
    try {
      // Check permissions first
      const hasPermissions = await this.checkSMSPermissions();
      if (!hasPermissions) {
        const granted = await this.requestSMSPermissions();
        if (!granted) {
          return false;
        }
      }

      // Create SMS message with weather request tag
      const message = `[WEATHER_REQUEST] ${latitude.toFixed(6)},${longitude.toFixed(6)}`;

      // Use native SMS module for direct sending
      if (Platform.OS === 'android' && NativeModules.SMSModule) {
        try {
          await new Promise((resolve, reject) => {
            NativeModules.SMSModule.sendWeatherRequest(latitude, longitude,
              (result) => resolve(result),
              (error) => reject(new Error(error))
            );
          });

          Alert.alert(
            'SMS Sent Successfully',
            'Weather request SMS has been sent directly. Waiting for response...',
            [{ text: 'OK' }]
          );

          return true;
        } catch (nativeError) {
          console.error('Native SMS sending failed:', nativeError);
          // Fall back to opening SMS app
        }
      }

      // Fallback: Open SMS app using Linking
      const smsUrl = `sms:${this.SERVER_NUMBER}?body=${encodeURIComponent(message)}`;
      const supported = await Linking.canOpenURL(smsUrl);
      if (supported) {
        await Linking.openURL(smsUrl);

        Alert.alert(
          'SMS App Opened',
          'The SMS app has been opened with your weather request. Please send the message to get weather data.',
          [{ text: 'OK' }]
        );

        return true;
      } else {
        Alert.alert('Error', 'SMS is not supported on this device.');
        return false;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert('Error', 'Failed to send SMS. Please try again.');
      return false;
    }
  }

  /**
   * Store SMS request for Android client to send
   */
  static async storeSMSRequest(message) {
    try {
      const requestData = {
        message,
        timestamp: Date.now(),
        type: 'weather_request'
      };

      await AsyncStorage.setItem('pendingSMSRequest', JSON.stringify(requestData));
    } catch (error) {
      console.error('Error storing SMS request:', error);
      throw error;
    }
  }

  /**
   * Get stored weather data from SMS response
   * This checks both AsyncStorage and file system for SMS weather data
   */
  static async getStoredWeatherData() {
    try {
      // First check AsyncStorage (for manual storage)
      const storedData = await AsyncStorage.getItem('smsWeatherData');
      if (storedData) {
        const data = JSON.parse(storedData);
        // Check if data is recent (within last hour)
        if (Date.now() - data.timestamp < 3600000) {
          return data.weatherData;
        } else {
          // Data is old, remove it
          await AsyncStorage.removeItem('smsWeatherData');
        }
      }

      // Check file system for data written by Android SMS receiver
      if (Platform.OS === 'android') {
        try {
          // Read from external files directory where SMS receiver writes
          const packageName = 'com.anonymous.App';
          const fileUri = `file:///storage/emulated/0/Android/data/${packageName}/files/sms_weather_data.json`;

          // Use legacy API for external file access (new File API has issues with URI)
          const fileInfo = await getInfoAsync(fileUri, { size: false });

          if (fileInfo.exists) {
            const fileContent = await readAsStringAsync(fileUri);
            const data = JSON.parse(fileContent);

            // Check if data is recent (within last hour)
            if (Date.now() - data.timestamp < 3600000) {
              console.log('Found valid SMS weather data from external file');
              return data.weatherData;
            } else {
              console.log('SMS weather data is stale, deleting file');
              // Data is old, delete the file
              await deleteAsync(fileUri);
            }
          } else {
            console.log('No SMS weather file found');
          }
        } catch (fileError) {
          console.log('No SMS weather file found or error reading it:', fileError.message);
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting stored weather data:', error);
      return null;
    }
  }

  /**
   * Poll for SMS weather data (call this periodically when waiting for SMS response)
   */
  static async pollForWeatherData(maxAttempts = 30, intervalMs = 2000) {
    return new Promise(async (resolve) => {
      let attempts = 0;

      const poll = async () => {
        attempts++;
        const data = await this.getStoredWeatherData();

        if (data || attempts >= maxAttempts) {
          resolve(data);
        } else {
          setTimeout(poll, intervalMs);
        }
      };

      poll();
    });
  }

  /**
   * Check if device is offline and offer SMS weather option
   */
  static async handleOfflineWeatherRequest(latitude, longitude) {
    return new Promise(async (resolve) => {
      const smsAvailable = Platform.OS === 'android';

      if (!smsAvailable) {
        Alert.alert(
          'Offline Mode',
          'You are currently offline. Weather data is not available.',
          [{ text: 'OK', onPress: () => resolve(null) }]
        );
        return;
      }

      Alert.alert(
        'Get Weather Offline',
        'You are offline. Would you like to send a weather request via SMS? This will send SMS directly and may incur charges.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null)
          },
          {
            text: 'Send SMS',
            onPress: async () => {
              const success = await this.sendWeatherRequest(latitude, longitude);
              if (success) {
                // Start polling for response
                Alert.alert(
                  'Waiting for Response',
                  'SMS sent! We\'ll check for weather data response. This may take a few moments.',
                  [{ text: 'OK' }]
                );

                // Poll for weather data
                const weatherData = await this.pollForWeatherData();
                if (weatherData) {
                  Alert.alert(
                    'Weather Data Received!',
                    'Weather information has been received via SMS.',
                    [{ text: 'OK' }]
                  );
                  resolve(this.parseWeatherFromSMS(weatherData));
                } else {
                  Alert.alert(
                    'No Response',
                    'No weather data received via SMS within the expected time. Please try again later.',
                    [{ text: 'OK' }]
                  );
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            }
          }
        ]
      );
    });
  }

  /**
   * Parse weather data from SMS format
   */
  static parseWeatherFromSMS(smsData) {
    try {
      // Expected format: "Temperature: 28°C, Condition: Sunny, Humidity: 65%, Wind: 5 km/h"
      const parts = smsData.split(', ');
      const weather = {};

      parts.forEach(part => {
        const [key, value] = part.split(': ');
        switch (key.toLowerCase()) {
          case 'temperature':
            weather.temperature = parseFloat(value.replace('°C', ''));
            break;
          case 'condition':
            weather.condition = value;
            break;
          case 'humidity':
            weather.humidity = parseFloat(value.replace('%', ''));
            break;
          case 'wind':
            weather.windSpeed = parseFloat(value.replace(' km/h', ''));
            break;
        }
      });

      return weather;
    } catch (error) {
      console.error('Error parsing weather SMS data:', error);
      return null;
    }
  }
}

export default SMSService;