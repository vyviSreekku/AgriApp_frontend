import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Image, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function PestDetectionScreen() {
  const [image, setImage] = useState(null);
  const [detectedPest, setDetectedPest] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setCameraPermission(cameraStatus.status === 'granted');
      setMediaPermission(mediaStatus.status === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    if (!mediaPermission) {
      Alert.alert('Permission required', 'Please allow media library access in system settings.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: false,
      });
      if (!result.cancelled) {
        setImage(result.uri);
        setDetectedPest(null);
        setTreatmentPlan([]);
      }
    } catch (err) {
      console.error('pickImage error', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert('Permission required', 'Please allow camera access in system settings.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.cancelled) {
        setImage(result.uri);
        setDetectedPest(null);
        setTreatmentPlan([]);
      }
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Simple simulated analyzer: tries to guess pest from filename, otherwise random sample
  const analyzeImage = () => {
    if (!image) {
      Alert.alert('No image', 'Please capture or select an image first.');
      return;
    }

    // Infer from filename if possible
    const lower = image.toLowerCase();
    let pest = null;
    if (lower.includes('aphid')) pest = 'Aphids';
    else if (lower.includes('boll') || lower.includes('worm')) pest = 'Bollworm';
    else if (lower.includes('mite')) pest = 'Mites';
    else if (lower.includes('blight')) pest = 'Blight';

    // fallback random if none detected in filename
    if (!pest) {
      const choices = ['Aphids', 'Bollworm', 'Mites', 'Leaf Miner'];
      pest = choices[Math.floor(Math.random() * choices.length)];
    }

    setDetectedPest(pest);
    setTreatmentPlan(mapPestToTreatment(pest));
  };

  const mapPestToTreatment = (pest) => {
    const plans = {
      'Aphids': [
        'Spray with a strong jet of water to remove aphids',
        'Apply insecticidal soap or neem oil (repeat every 7–10 days)',
        'Introduce beneficial insects (ladybugs) if possible',
      ],
      'Bollworm': [
        'Inspect bolls and remove infected ones manually',
        'Apply Bacillus thuringiensis (Bt) or a suitable pesticide following label instructions',
        'Rotate crops and remove crop residues to break pest cycle',
      ],
      'Mites': [
        'Spray miticide or horticultural oil early morning',
        'Increase humidity and remove heavily infested leaves',
        'Introduce predatory mites if available',
      ],
      'Leaf Miner': [
        'Remove and destroy affected leaves',
        'Use systemic insecticide only for heavy infestations',
        'Encourage parasitic wasps (biocontrol) where possible',
      ],
      'Blight': [
        'Remove infected plant material and destroy',
        'Avoid overhead irrigation; improve spacing for airflow',
        'Apply appropriate fungicide as per label',
      ],
    };

    return plans[pest] || ['No treatment plan available'];
  };

  return (
    <LinearGradient colors={['#fef3f2', '#fef8f7', '#ffffff']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="bug" size={32} color="#ef4444" />
          <Text style={styles.title}>Pest Detection</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.buttonGradient}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.actionText}>Capture Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.buttonGradient}>
              <Ionicons name="images" size={20} color="#fff" />
              <Text style={styles.actionText}>From Gallery</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons name="image-off-outline" size={64} color="#cbd5e1" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
          <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.analyzeGradient}>
            <MaterialCommunityIcons name="magnify-scan" size={24} color="#fff" />
            <Text style={styles.analyzeText}>Analyze Image</Text>
          </LinearGradient>
        </TouchableOpacity>

        {detectedPest && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="alert-circle" size={28} color="#ef4444" />
              <View style={styles.resultTitleContainer}>
                <Text style={styles.resultLabel}>Detected Pest</Text>
                <Text style={styles.resultTitle}>{detectedPest}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.resultSubtitle}>
              <MaterialCommunityIcons name="clipboard-text" size={16} color="#64748b" /> Treatment Plan
            </Text>
            {treatmentPlan.map((step, idx) => (
              <View key={idx} style={styles.planItem}>
                <View style={styles.planBadge}>
                  <Text style={styles.planIndex}>{idx + 1}</Text>
                </View>
                <Text style={styles.planText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  container: { padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#1e293b', marginLeft: 12, letterSpacing: -0.5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  actionButton: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  previewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  previewImage: { width: '100%', height: 280, borderRadius: 12, resizeMode: 'cover' },
  placeholder: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', marginTop: 12, fontSize: 15, fontWeight: '500' },
  analyzeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 24, elevation: 4, shadowColor: '#0ea5e9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  analyzeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  analyzeText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  resultCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultTitleContainer: { marginLeft: 12, flex: 1 },
  resultLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 16 },
  resultSubtitle: { color: '#64748b', marginBottom: 16, fontSize: 15, fontWeight: '700' },
  planItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingLeft: 4 },
  planBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  planIndex: { fontWeight: '800', color: '#dc2626', fontSize: 14 },
  planText: { flex: 1, color: '#334155', lineHeight: 22, fontSize: 15 },
});
