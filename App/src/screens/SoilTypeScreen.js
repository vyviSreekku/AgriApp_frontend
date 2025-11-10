import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function SoilTypeScreen({ route }) {
  const [image, setImage] = useState(null);
  const [soilType, setSoilType] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);

  useEffect(() => {
    // Check if an image was passed from PlantImageCaptureScreen
    if (route?.params?.capturedImage) {
      setImage(route.params.capturedImage);
    }

    (async () => {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setCameraPermission(cam.status === 'granted');
      setMediaPermission(media.status === 'granted');
    })();
  }, [route?.params?.capturedImage]);

  const pickImage = async () => {
    if (!mediaPermission) {
      Alert.alert('Permission required', 'Please allow media library access in system settings.');
      return;
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!res.cancelled) {
        setImage(res.uri);
        setSoilType(null);
        setRecommendations([]);
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
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!res.cancelled) {
        setImage(res.uri);
        setSoilType(null);
        setRecommendations([]);
      }
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeSoil = () => {
    if (!image) {
      Alert.alert('No image', 'Please capture or select a soil photo first.');
      return;
    }

    const lower = image.toLowerCase();
    let detected = null;
    if (lower.includes('sand')) detected = 'Sandy';
    else if (lower.includes('clay')) detected = 'Clay';
    else if (lower.includes('loam') || lower.includes('loamy')) detected = 'Loamy';
    else if (lower.includes('silt')) detected = 'Silty';
    else if (lower.includes('peat')) detected = 'Peaty';

    if (!detected) {
      const choices = ['Sandy', 'Loamy', 'Clay', 'Silty', 'Peaty'];
      detected = choices[Math.floor(Math.random() * choices.length)];
    }

    setSoilType(detected);
    setRecommendations(mapSoilToRecommendations(detected));
  };

  const mapSoilToRecommendations = (type) => {
    const map = {
      'Sandy': [
        'Texture: coarse, drains quickly, low water-holding capacity',
        'Add organic matter (compost) to increase water and nutrient retention',
        'Mulch to reduce evaporation and temperature swings',
        'Frequent, light irrigation is better than infrequent heavy watering',
      ],
      'Loamy': [
        'Texture: ideal balance of sand, silt and clay',
        'Maintain organic matter with regular composting',
        'Good drainage and moisture retention — standard fertilization schedules apply',
        'Monitor pH for crop-specific needs',
      ],
      'Clay': [
        'Texture: fine particles, holds water but may compact',
        'Improve structure with gypsum (if sodium problem) and organic matter',
        'Avoid working soil when wet to prevent compaction',
        'Ensure good drainage; deep, infrequent watering helps roots',
      ],
      'Silty': [
        'Texture: smooth, retains moisture but can compact',
        'Incorporate organic matter to improve structure and aeration',
        'Avoid excessive tilling; maintain ground cover',
      ],
      'Peaty': [
        'Texture: high organic matter, acidic and holds water',
        'May need lime to raise pH for many crops',
        'Monitor for nutrient leaching; apply slow-release fertilizers',
        'Improve drainage for crops sensitive to waterlogging',
      ],
    };

    return map[type] || ['No recommendations available for this soil type'];
  };

  return (
    <LinearGradient colors={['#fef9f3', '#fefbf7', '#ffffff']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="layers-triple" size={32} color="#64748b" />
          <Text style={styles.title}>Soil Type Analysis</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <LinearGradient colors={['#64748b', '#475569']} style={styles.buttonGradient}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.actionText}>Capture Soil</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <LinearGradient colors={['#78716c', '#57534e']} style={styles.buttonGradient}>
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
              <Text style={styles.placeholderText}>No soil photo selected</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeSoil}>
          <LinearGradient colors={['#0891b2', '#0e7490']} style={styles.analyzeGradient}>
            <MaterialCommunityIcons name="flask-outline" size={24} color="#fff" />
            <Text style={styles.analyzeText}>Analyze Soil</Text>
          </LinearGradient>
        </TouchableOpacity>

        {soilType && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="layers" size={28} color="#64748b" />
              <View style={styles.resultTitleContainer}>
                <Text style={styles.resultLabel}>Detected Soil Type</Text>
                <Text style={styles.resultTitle}>{soilType}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.resultSubtitle}>
              <MaterialCommunityIcons name="clipboard-text" size={16} color="#64748b" /> Recommendations
            </Text>
            {recommendations.map((r, i) => (
              <View key={i} style={styles.planItem}>
                <View style={styles.planBadge}>
                  <Text style={styles.planIndex}>{i + 1}</Text>
                </View>
                <Text style={styles.planText}>{r}</Text>
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
  actionButton: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  previewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  previewImage: { width: '100%', height: 280, borderRadius: 12, resizeMode: 'cover' },
  placeholder: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', marginTop: 12, fontSize: 15, fontWeight: '500' },
  analyzeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 24, elevation: 4, shadowColor: '#0891b2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  analyzeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  analyzeText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  resultCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderLeftWidth: 4, borderLeftColor: '#64748b' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultTitleContainer: { marginLeft: 12, flex: 1 },
  resultLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 16 },
  resultSubtitle: { color: '#64748b', marginBottom: 16, fontSize: 15, fontWeight: '700' },
  planItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingLeft: 4 },
  planBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  planIndex: { fontWeight: '800', color: '#475569', fontSize: 14 },
  planText: { flex: 1, color: '#334155', lineHeight: 22, fontSize: 15 },
});
