import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from '../styles';
import otpService from '../services/otpService';

export default function LoginScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name || name.trim().length < 3) e.name = 'Name must be at least 3 characters';
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned || cleaned.length !== 10) e.phone = 'Enter a 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSendOtp() {
    if (!validate()) return;
    setLoading(true);
    try {
      await otpService.sendOtp(phone, name);
      setLoading(false);
      navigation.navigate('OTP', { phone, name });
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to send OTP. Try again later.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>PlantHub</Text>
        <Text style={styles.subtitle}>Enter name and phone to login</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Maria Fernandes"
          style={styles.input}
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={text => setPhone(text.replace(/[^0-9]/g, ''))}
          placeholder="10-digit phone number"
          keyboardType="phone-pad"
          style={styles.input}
          maxLength={10}
        />
        {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
        </TouchableOpacity>

        <Text style={styles.smallText}>This demo simulates SMS sending (check Metro/console for OTP).</Text>
      </View>
    </View>
  );
}
