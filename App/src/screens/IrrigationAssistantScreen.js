import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function IrrigationAssistantScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Irrigation Assistant Module Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  text: { fontSize: 20, color: '#4f46e5', fontWeight: 'bold' },
});
