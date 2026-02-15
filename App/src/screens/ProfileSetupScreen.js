import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import authService from '../services/authService';

export default function ProfileSetupScreen({ navigation, route }) {
  const { phone } = route.params || {};
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompleteSetup = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing Information', 'Please enter your full name.');
      return;
    }
    if (!district.trim()) {
      Alert.alert('Missing Information', 'Please enter your district.');
      return;
    }

    setLoading(true);
    try {
        // Here we would typically save the profile to the backend
        // For now, we update the local auth service with the new details
        await authService.setUser({ 
            name: fullName, 
            phone: phone, 
            email: email, 
            district: district, 
            state: stateRegion 
        });
        
        // Navigation will be handled by the auth state listener in the main navigator
        // or we can manually navigate if needed, but usually setUser triggers the switch
    } catch (error) {
        Alert.alert('Error', 'Could not save profile. Please try again.');
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      {/* Background with Gradient and Circles */}
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header Text */}
        <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Profile Setup</Text>
            <Text style={styles.subtitle}>
                Complete your profile to get started
            </Text>
        </View>

        {/* Form Card */}
        <View style={styles.cardContainer}>
            
            {/* Full Name (Required) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor="#9ca3af"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                    />
                </View>
            </View>

            {/* Email (Optional) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email <Text style={styles.optional}>(Optional)</Text></Text>
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email address"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* Farm Location - District (Required) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Nashik"
                        placeholderTextColor="#9ca3af"
                        value={district}
                        onChangeText={setDistrict}
                    />
                </View>
            </View>

            {/* Farm Location - State (Optional) */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>State <Text style={styles.optional}>(Optional)</Text></Text>
                <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="city-variant-outline" size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Maharashtra"
                        placeholderTextColor="#9ca3af"
                        value={stateRegion}
                        onChangeText={setStateRegion}
                    />
                </View>
            </View>

            <TouchableOpacity 
                style={styles.submitButton}
                activeOpacity={0.8}
                onPress={handleCompleteSetup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnContent}>
                        <Text style={styles.submitButtonText}>Complete Setup</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </View>
                )}
            </TouchableOpacity>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bgHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  circle1: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    top: 50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerTextContainer: {
    marginTop: 80,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    opacity: 0.9,
  },
  cardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#9ca3af',
    fontWeight: 'normal',
    fontSize: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
