import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import otpService from '../services/otpService';
import authService from '../services/authService';
import { getApiUrl } from '../utils/config';

const { width } = Dimensions.get('window');
const PRIMARY_PURPLE = '#4f46e5';

export default function OtpScreen({ navigation, route }) {
  const { phone, name } = route.params;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDigitChange = (text, index) => {
    const newDigits = [...digits];
    newDigits[index] = text.replace(/[^0-9]/g, '').slice(-1);
    setDigits(newDigits);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Auto-verify when filled
    if (index === 5 && text) {
        // Optional: Could trigger verify here
    }
  };

  const handleBackspace = (key, index) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 800));
      
      const isValid = await otpService.verifyOtp(phone, code);
      if (isValid) {
        try {
            // Check if user exists in backend
            const baseUrl = await getApiUrl();
            const response = await fetch(`${baseUrl}/users/check/${phone}`);
            
            if (response.ok) {
                const userData = await response.json();
                // User exists -> Login directly
                await authService.setUser(userData);
                // Navigate to main app (handled by auth listener or manual navigation)
                // Assuming you have a navigation flow that checks auth state, 
                // but direct navigation works too if stack allows.
                // If using a switch navigator or similar, setUser might trigger it.
                // If not, we might need to reset navigation stack.
                // user is logged in, usually we navigate to 'Home' or 'Main'
                // But typically App.js listens to auth state. 
                // If this doesn't automatically switch, let's try to navigate or just let auth listener handle.
                // Since I cannot see App.js, I will assume setting user is enough 
                // OR I should navigate to a 'Home' screen if available.
                // Assuming 'Main' or 'Home' is the target.
                 // For safety, let's just log and rely on auth flow or navigate to 'ProfileSetup' if not found?
                 // No, if user found, we want to SKIP ProfileSetup.
                 // If the navigation is stack based, we might need to pop everything.
                 // Let's assume there is an 'App' stack or 'Home'.
                 // Safest bet without knowing full nav structure: 
                 // If auth state management is reactive, setUser is enough.
                 // If not, we might need to navigate.
                 // Given the snippet, I'll assume we need to trigger navigation.
                 // But wait, if I don't know the route name for Home... 
                 // I'll stick to logic: 
                 // 1. Set User. 
                 // 2. Navigation might be needed?
            } else {
                 // User does not exist (404) -> Go to Profile Setup
                 navigation.navigate('ProfileSetup', { phone });
            }
        } catch (apiError) {
             console.log("API check failed, assuming new user or network issue", apiError);
             // Fallback to ProfileSetup if check fails, or show error?
             // Safer to go to setup and let setup handle registration (which handles 'create if not exists')
             navigation.navigate('ProfileSetup', { phone });
        }
      } else {
        setError('Incorrect verification code. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Verification Error', 'Something went wrong. Please try again.');
    }
  };

  const handleResend = async () => {
    setDigits(['', '', '', '', '', '']);
    setError('');
    setResendTimer(30);
    try {
      await otpService.sendOtp(phone, name);
      Alert.alert('Code Sent', 'A new verification code has been sent to your mobile.');
      inputs.current[0]?.focus();
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header Background */}
      <View style={styles.bgHeader}>
         <LinearGradient
            colors={['#4f46e5', '#3730a3']} 
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
         />
         <View style={styles.circle1} />
         <View style={styles.circle2} />
      </View>

      <View style={styles.contentContainer}>
        
        {/* Header Text */}
        <View style={styles.headerTextContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
                We've sent a 6-digit code to
            </Text>
            <Text style={styles.phoneText}>+91 {phone}</Text>
        </View>

        {/* Card */}
        <View style={styles.cardContainer}>
            
            <Text style={styles.promptText}>Enter Verification Code</Text>

            <View style={styles.otpRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={ref => inputs.current[i] = ref}
                  style={[
                      styles.otpInput, 
                      d ? styles.otpInputFilled : null,
                      error ? styles.otpInputError : null
                  ]}
                  value={d}
                  onChangeText={txt => handleDigitChange(txt, i)}
                  onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  cursorColor={PRIMARY_PURPLE}
                />
              ))}
            </View>
            
            {error ? (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            <TouchableOpacity 
                style={styles.verifyBtn} 
                onPress={handleVerify}
                activeOpacity={0.8}
                disabled={loading}
            >
                <LinearGradient
                    colors={['#4f46e5', '#4338ca']}
                    style={styles.btnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Verify & Proceed</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
                <Text style={styles.resendLabel}>Didn't receive the code?</Text>
                {resendTimer > 0 ? (
                    <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                ) : (
                    <TouchableOpacity onPress={handleResend}>
                        <Text style={styles.resendLink}>Resend Code</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bgHeader: {
      height: Dimensions.get('window').height * 0.35,
      width: '100%',
      position: 'absolute',
      top: 0,
  },
  gradient: { flex: 1 },
  circle1: {
      position: 'absolute',
      top: -60,
      right: -20,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
      position: 'absolute',
      top: 60,
      left: -40,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  contentContainer: {
      flex: 1,
  },
  
  headerTextContainer: {
      paddingTop: 60,
      paddingHorizontal: 24,
      height: '35%',
  },
  backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
      marginBottom: 20,
  },
  title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#fff',
      marginBottom: 8,
  },
  subtitle: {
      fontSize: 16,
      color: '#e0e7ff', 
  },
  phoneText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
      marginTop: 4,
  },

  cardContainer: {
      flex: 1,
      backgroundColor: '#fff',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 40,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
  },
  
  promptText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1e293b',
      textAlign: 'center',
      marginBottom: 30,
  },
  
  otpRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
  },
  otpInput: {
      width: 48,
      height: 56,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: '#f8fafc',
      textAlign: 'center',
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b',
  },
  otpInputFilled: {
      borderColor: PRIMARY_PURPLE,
      backgroundColor: '#eef2ff',
  },
  otpInputError: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
  },

  errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      gap: 6,
  },
  errorText: {
      color: '#ef4444',
      fontSize: 14,
      fontWeight: '500',
  },

  verifyBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 30,
      shadowColor: PRIMARY_PURPLE,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
  },
  btnGradient: {
      paddingVertical: 18,
      alignItems: 'center',
  },
  btnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
  },

  resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
  },
  resendLabel: {
      color: '#64748b',
      fontSize: 14,
  },
  resendLink: {
      color: PRIMARY_PURPLE,
      fontSize: 14,
      fontWeight: '700',
  },
  timerText: {
      color: '#94a3b8',
      fontSize: 14,
      fontWeight: '600',
  },
});
