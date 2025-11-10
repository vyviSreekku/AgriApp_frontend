import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function KnowledgeHubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Knowledge Hub Module Coming Soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  text: { fontSize: 20, color: '#8b5cf6', fontWeight: 'bold' },
});
