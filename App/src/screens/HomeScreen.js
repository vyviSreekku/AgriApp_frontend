import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles';

export default function HomeScreen({ route, navigation }) {
  const { name, phone } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome, {name || 'User'} 🌿</Text>
        <Text style={styles.subtitle}>Phone: +91 {phone || '—'}</Text>

        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={() => Alert.alert('Home', 'This is a demo home screen.')}
        >
          <Text style={styles.buttonText}>Open Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
