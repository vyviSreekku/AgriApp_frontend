import React, { useState } from 'react';
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
  StatusBar,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import otpService from '../services/otpService';

const { width } = Dimensions.get('window');
const PRIMARY_PURPLE = '#4f46e5';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorPhone, setErrorPhone] = useState('');

  const validate = () => {
    let isValid = true;
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== 10) {
      setErrorPhone('Please enter a valid 10-digit number');
      isValid = false;
    } else {
      setErrorPhone('');
    }
    return isValid;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Simulate API call delay for better UX
      await otpService.sendOtp(phone, "Farmer"); // Default name
      // Wait a moment so user sees the loading state
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('OTP', { phone, name: "Farmer" });
      }, 800);
    } catch (err) {
      setLoading(false);
      Alert.alert('Connection Error', 'Could not send OTP. Please check your internet connection.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Decorative Background */}
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

      {/* Main Content Card */}
      <View style={styles.contentContainer}>
        
        {/* Logo Section */}
        <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
                <Image 
                    source={require('../../images/logo.png')} 
                    style={styles.logoImage} 
                    resizeMode="cover"
                />
            </View>
            <Text style={styles.appTitle}>PlantHub</Text>
            <Text style={styles.tagline}>Smart Farming Assistant</Text>
        </View>

        {/* Input Form */}
        <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome Farmer!</Text>
            <Text style={styles.instructionText}>Login with your mobile number.</Text>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={[styles.inputBox, errorPhone ? styles.inputError : null]}>
                    <MaterialCommunityIcons name="phone-outline" size={20} color="#64748b" />
                    <Text style={styles.prefixText}>+91</Text>
                    <View style={styles.verticalDivider} />
                    <TextInput 
                        style={styles.input}
                        placeholder="98765 43210"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, '')); setErrorPhone(''); }}
                    />
                </View>
                 {errorPhone ? <Text style={styles.errorText}>{errorPhone}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity 
                style={styles.loginBtn} 
                onPress={handleSendOtp}
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
                        <View style={styles.btnContent}>
                            <Text style={styles.btnText}>Get OTP</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
                By continuing, you agree to our Terms of Service & Privacy Policy.
            </Text>
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
      height: Dimensions.get('window').height * 0.4,
      width: '100%',
      position: 'absolute',
      top: 0,
  },
  gradient: {
      flex: 1,
  },
  circle1: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
      position: 'absolute',
      top: 100,
      left: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  contentContainer: {
      flex: 1,
      justifyContent: 'flex-end',
  },
  
  logoContainer: {
      position: 'absolute',
      top: '12%',
      width: '100%',
      alignItems: 'center',
  },
  logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      overflow: 'hidden', // Ensure circular crop
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: '#fff',
      letterSpacing: 1,
  },
  tagline: {
      fontSize: 14,
      color: '#dcfce7',
      marginTop: 4,
      fontWeight: '500',
  },

  formContainer: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 20,
      height: '65%', // Takes bottom part of screen
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 20,
  },
  welcomeText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: 8,
  },
  instructionText: {
      fontSize: 14,
      color: '#64748b',
      marginBottom: 32,
  },

  inputWrapper: {
      marginBottom: 20,
  },
  inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#475569',
      marginBottom: 8,
      marginLeft: 4,
  },
  inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
  },
  inputError: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
  },
  prefixText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#334155',
      marginLeft: 8,
  },
  verticalDivider: {
      width: 1,
      height: 24,
      backgroundColor: '#cbd5e1',
      marginHorizontal: 12,
  },
  input: {
      flex: 1,
      fontSize: 16,
      color: '#1e293b',
      fontWeight: '500',
  },
  errorText: {
      fontSize: 12,
      color: '#ef4444',
      marginTop: 4,
      marginLeft: 4,
  },

  loginBtn: {
      marginTop: 10,
      marginBottom: 20,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
  },
  btnGradient: {
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
  },
  btnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  btnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
  },

  footerNote: {
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: 12,
      marginTop: 'auto',
      marginBottom: 10,
  },
});
