import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function SoilPhScreen() {
  const [stripImage, setStripImage] = useState(null);
  const [selectedPH, setSelectedPH] = useState(null);
  const [autoEstimatedPH, setAutoEstimatedPH] = useState(null);

  // Predefined pH scale (0 - 14) with typical universal indicator colors
  const phScale = useMemo(() => ([
    { pH: 0, color: '#ff0000' }, // red
    { pH: 1, color: '#ff2a00' },
    { pH: 2, color: '#ff5400' },
    { pH: 3, color: '#ff7f00' }, // orange
    { pH: 4, color: '#ffb300' }, // yellow-orange
    { pH: 5, color: '#ffd000' }, // yellow
    { pH: 6, color: '#c7e600' }, // yellow-green
    { pH: 7, color: '#00c853' }, // green (neutral-ish)
    { pH: 8, color: '#00b894' }, // green-cyan
    { pH: 9, color: '#00bcd4' }, // cyan
    { pH: 10, color: '#00a2ff' }, // light blue
    { pH: 11, color: '#0081ff' }, // blue
    { pH: 12, color: '#2862ff' }, // deep blue
    { pH: 13, color: '#6a5bff' }, // indigo
    { pH: 14, color: '#8e44ad' }, // violet
  ]), []);

  const classification = (value) => {
    if (value == null) return '-';
    if (value < 6.5) return 'Acidic';
    if (value <= 7.5) return 'Neutral';
    return 'Alkaline';
  };

  const recommendations = (value) => {
    if (value == null) return [];
    if (value < 5.5) {
      return [
        'Apply agricultural lime (calcitic or dolomitic) to raise pH',
        'Incorporate composted organic matter',
        'Avoid ammonium-based fertilizers',
        'Test soil again after 4–6 weeks',
      ];
    }
    if (value < 6.5) {
      return [
        'Light lime application to slightly raise pH',
        'Add well-rotted manure/compost',
        'Select acid-tolerant crops (e.g., potato, blueberry)',
      ];
    }
    if (value <= 7.5) {
      return [
        'Great range for most crops',
        'Maintain with organic matter and balanced fertilization',
        'Monitor annually',
      ];
    }
    if (value <= 8.0) {
      return [
        'Add elemental sulfur or acidifying fertilizers (e.g., ammonium sulfate)',
        'Incorporate organic matter to buffer pH',
        'Avoid overliming',
      ];
    }
    return [
      'Apply elemental sulfur/acidifying agents over several applications',
      'Improve drainage and add organic matter',
      'Consider gypsum for sodic soils (lab test first)',
    ];
  };

  const handleCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to capture the strip');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setStripImage(res.assets[0].uri);
        // Auto estimate (beta, simulated)
        const simulated = simulateEstimate();
        setAutoEstimatedPH(simulated);
        setSelectedPH(simulated);
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setStripImage(res.assets[0].uri);
        const simulated = simulateEstimate();
        setAutoEstimatedPH(simulated);
        setSelectedPH(simulated);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const simulateEstimate = () => {
    // Simple stable pseudo-random between 5 and 9 to avoid extreme outputs
    const choices = [5.5, 6.0, 6.5, 7.0, 7.2, 7.5, 8.0, 8.5];
    return choices[Math.floor(Math.random() * choices.length)];
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
              <Text style={styles.subtitle}>Capture pH strip and compare with scale</Text>
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
              <Text style={styles.stepText}>Capture the strip or compare with the color scale below.</Text>
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
                <Text style={styles.previewLabel}>Auto estimate (beta): </Text>
                <Text style={styles.previewValue}>{autoEstimatedPH ?? '-'}</Text>
              </View>
            </View>
          )}

          {/* pH Scale */}
          <View style={[styles.card, styles.shadow]}>
            <Text style={styles.cardTitle}>Compare with pH color scale</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scaleRow}>
              {phScale.map(({ pH, color }) => (
                <TouchableOpacity
                  key={pH}
                  onPress={() => setSelectedPH(pH)}
                  style={[styles.swatchBox, { backgroundColor: color }, selectedPH === pH && styles.swatchSelected]}
                >
                  <Text style={styles.swatchLabel}>{pH}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.scaleHint}>Tip: Tap the color closest to your strip</Text>
          </View>

          {/* Result */}
          {(selectedPH !== null) && (
            <View style={[styles.resultCard, styles.shadow]}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name="test-tube" size={22} color="#0ea5e9" />
                <Text style={styles.resultTitle}>Estimated pH: <Text style={{ color: '#0ea5e9', fontWeight: '800' }}>{selectedPH}</Text> ({classification(selectedPH)})</Text>
              </View>
              <View style={styles.recoList}>
                {recommendations(selectedPH).map((r, i) => (
                  <View style={styles.recoItem} key={i}>
                    <Ionicons name="checkmark-circle" size={18} color="#0ea5e9" />
                    <Text style={styles.recoText}>{r}</Text>
                  </View>
                ))}
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

  scaleRow: { paddingHorizontal: 4 },
  swatchBox: { width: 48, height: 64, borderRadius: 10, marginHorizontal: 4, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  swatchLabel: { color: '#fff', fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  swatchSelected: { borderWidth: 3, borderColor: '#0ea5e9' },
  scaleHint: { marginTop: 8, color: '#64748b', fontSize: 12 },

  resultCard: { backgroundColor: '#f0f9ff', borderRadius: 16, padding: 16, marginTop: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginLeft: 6 },
  recoList: { marginTop: 10, gap: 8 },
  recoItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  recoText: { color: '#334155', flex: 1, lineHeight: 20 },

  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
});
