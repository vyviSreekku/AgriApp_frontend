import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { analyzeSoilPH } from '../../services/soilPhService';

export default function SoilPhScreen() {
  const [stripImage, setStripImage] = useState(null);
  const [phValue, setPhValue] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to capture the strip');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setStripImage(res.assets[0].uri);
        await analyzePhFromImage(res.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handlePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery access is needed to pick the strip photo');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setStripImage(res.assets[0].uri);
        await analyzePhFromImage(res.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const analyzePhFromImage = async (imageUri) => {
    setIsAnalyzing(true);
    setPhValue(null);
    try {
      const value = await analyzeSoilPH(imageUri);
      setPhValue(value);
    } catch (error) {
      console.error('[ERROR SoilPhScreen] Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not analyze pH. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <LinearGradient colors={['#fff7ed', '#ffffff']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="flask" size={22} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Soil pH Tester</Text>
              <Text style={styles.subtitle}>Capture pH strip and get pH value</Text>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How to measure pH with paper</Text>
            <View style={styles.stepItem}>
              <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>
              <Text style={styles.stepText}>Collect soil from 5–10 spots in the field (top 10–15 cm), mix well.</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
              <Text style={styles.stepText}>Add distilled water until muddy, stir and let settle 10 minutes.</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
              <Text style={styles.stepText}>Dip pH paper into the clear solution for 1–2 seconds, wait 30–60 seconds.</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.badge}><Text style={styles.badgeText}>4</Text></View>
              <Text style={styles.stepText}>Capture the strip to get the pH value.</Text>
            </View>
          </View>

          {/* Capture / Preview */}
          <View style={styles.captureRow}>
            <TouchableOpacity style={[styles.captureBtn, styles.shadow]} onPress={handleCapture}>
              <LinearGradient colors={["#f97316", "#fb923c"]} style={styles.captureBtnBg}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={styles.captureText}>Open Camera</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickBtn, styles.shadow]} onPress={handlePick}>
              <Ionicons name="images" size={20} color="#f97316" />
              <Text style={styles.pickText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {stripImage && (
            <View style={[styles.previewCard, styles.shadow]}>
              <Image source={{ uri: stripImage }} style={styles.preview} />
              <View style={styles.previewFooter}>
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator size="small" color="#0ea5e9" />
                    <Text style={styles.previewLabel}>Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.previewLabel}>Detected pH: </Text>
                    <Text style={styles.previewValue}>{phValue !== null ? phValue : '-'}</Text>
                  </>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#1f2937' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fde68a', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  badgeText: { fontWeight: '800', color: '#78350f' },
  stepText: { color: '#334155', flex: 1, lineHeight: 20 },

  captureRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  captureBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  captureBtnBg: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  captureText: { color: '#fff', fontWeight: '700' },
  pickBtn: { flex: 1, borderRadius: 14, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  pickText: { color: '#f97316', fontWeight: '700', paddingVertical: 14 },

  previewCard: { backgroundColor: '#fff', borderRadius: 16, marginTop: 12, overflow: 'hidden' },
  preview: { width: '100%', height: 220 },
  previewFooter: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  previewLabel: { color: '#475569' },
  previewValue: { color: '#0ea5e9', fontWeight: '800', marginLeft: 6 },

  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
});
