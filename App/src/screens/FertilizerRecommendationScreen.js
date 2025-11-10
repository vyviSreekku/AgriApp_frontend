import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FertilizerRecommendationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Fertilizer Recommendation Module Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  text: { fontSize: 20, color: '#eab308', fontWeight: 'bold' },
});
