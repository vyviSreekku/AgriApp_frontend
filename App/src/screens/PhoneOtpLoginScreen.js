import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth } from '../firebase';
import { backendLoginWithFirebase } from '../api';
import useAuth from '../auth/useAuth';

export default function PhoneOtpLoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [fullName, setFullName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');

  const { setUser } = useAuth();

  const sendOtp = async () => {
    setMessage(null);
    if (!phone || !phone.startsWith('+')) {
      setMessage('Phone must be in E.164 format, e.g. +919876543210');
      return;
    }
    setLoading(true);
    try {
      const conf = await auth().signInWithPhoneNumber(phone);
      setConfirmation(conf);
      setMessage('OTP sent. Check your messages.');
    } catch (err) {
      console.warn(err);
      if (err.code === 'auth/invalid-phone-number') setMessage('Invalid phone number format.');
      else if (err.code === 'auth/too-many-requests') setMessage('Too many requests. Try again later.');
      else setMessage(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMessage(null);
    if (!confirmation) {
      setMessage('No OTP request in progress. Please request OTP first.');
      return;
    }
    setLoading(true);
    try {
      await confirmation.confirm(code);
      // now currentUser should be set
      const idToken = await auth().currentUser.getIdToken(true);

      const profile = {};
      if (fullName) profile.full_name = fullName;
      if (locationName) profile.location_name = locationName;
      if (locationState) profile.location_state = locationState;
      if (locationDistrict) profile.location_district = locationDistrict;

      const userObj = await backendLoginWithFirebase(idToken, profile);
      setUser(userObj);
      setMessage('Logged in successfully');
      // navigate or close login
      if (navigation && navigation.replace) navigation.replace('FarmingDashboard');
    } catch (err) {
      console.warn(err);
      // backend errors
      if (err.status === 401) {
        setMessage('Authentication failed on server. Please re-verify OTP.');
        try {
          await auth().signOut();
        } catch (e) {}
        setConfirmation(null);
      } else if (err.code === 'auth/invalid-verification-code') {
        setMessage('Invalid verification code.');
      } else {
        setMessage(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phone OTP Login</Text>

      <TextInput
        style={styles.input}
        placeholder='+919876543210'
        keyboardType='phone-pad'
        value={phone}
        onChangeText={setPhone}
        autoComplete='tel'
      />
      <Button title='Send OTP' onPress={sendOtp} disabled={loading} />

      {confirmation ? (
        <>
          <TextInput
            style={styles.input}
            placeholder='Enter 6-digit code'
            keyboardType='number-pad'
            value={code}
            onChangeText={setCode}
            maxLength={6}
          />

          <Text style={styles.subTitle}>Optional profile (for signup)</Text>
          <TextInput style={styles.input} placeholder='Full name' value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder='Location name' value={locationName} onChangeText={setLocationName} />
          <TextInput style={styles.input} placeholder='State' value={locationState} onChangeText={setLocationState} />
          <TextInput style={styles.input} placeholder='District' value={locationDistrict} onChangeText={setLocationDistrict} />

          <Button title='Verify OTP' onPress={verifyOtp} disabled={loading} />
        </>
      ) : null}

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'flex-start' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  subTitle: { fontSize: 14, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 6, borderRadius: 4 },
  message: { marginTop: 12, color: 'red' },
});
