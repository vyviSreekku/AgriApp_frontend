import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from '../styles';
import otpService from '../services/otpService';
import authService from '../services/authService';

export default function OtpScreen({ navigation, route }) {
  const { phone, name } = route.params;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    startResendCooldown(30);
  }, []);

  function startResendCooldown(sec) {
    setResendTimer(sec);
    const t = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function setDigit(i, val) {
    const d = [...digits];
    d[i] = val.replace(/[^0-9]/g, '').slice(-1);
    setDigits(d);
    if (d[i] && i < 5) inputs.current[i + 1].focus();
  }

  function backspace(i, key) {
    if (key === 'Backspace' && digits[i] === '' && i > 0) {
      inputs.current[i - 1].focus();
    }
  }

  async function handleVerify() {
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      const ok = await otpService.verifyOtp(phone, code);
      setLoading(false);
      if (ok) {
        await authService.setUser({ name, phone });
        // Auth state will be updated, parent navigator will auto-switch to MainApp
      } else {
        setError('Invalid OTP');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Verification failed. Try again.');
    }
  }

  async function handleResend() {
    setError('');
    try {
      await otpService.sendOtp(phone, name);
      startResendCooldown(30);
      Alert.alert('OTP Sent', 'A new OTP has been sent (simulated).');
    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify Phone</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to +91 {phone}</Text>

        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => (inputs.current[i] = el)}
              value={d}
              onChangeText={val => setDigit(i, val)}
              onKeyPress={({ nativeEvent }) => backspace(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
          <Text style={styles.smallText}>Didn't receive code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
            <Text style={[styles.resendText, resendTimer > 0 && { opacity: 0.6 }]}>  Resend{resendTimer > 0 ? ` (${resendTimer}s)` : ''}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.smallText, { marginTop: 20 }]}>This demo simulates SMS (see Metro/console for OTP).</Text>
      </View>
    </View>
  );
}
