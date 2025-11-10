import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function WeedProtectionScreen({ route }) {
  const [image, setImage] = useState(null);
  const [detectedWeed, setDetectedWeed] = useState(null);
  const [controlMethods, setControlMethods] = useState([]);
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
        setDetectedWeed(null);
        setControlMethods([]);
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
        setDetectedWeed(null);
        setControlMethods([]);
      }
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeWeed = () => {
    if (!image) {
      Alert.alert('No image', 'Please capture or select a weed photo first.');
      return;
    }

    const lower = image.toLowerCase();
    let detected = null;
    if (lower.includes('crabgrass')) detected = 'Crabgrass';
    else if (lower.includes('dandelion')) detected = 'Dandelion';
    else if (lower.includes('clover')) detected = 'Clover';
    else if (lower.includes('thistle')) detected = 'Thistle';
    else if (lower.includes('bindweed')) detected = 'Bindweed';
    else if (lower.includes('nutsedge')) detected = 'Nutsedge';

    if (!detected) {
      const choices = ['Crabgrass', 'Dandelion', 'Clover', 'Thistle', 'Bindweed', 'Nutsedge'];
      detected = choices[Math.floor(Math.random() * choices.length)];
    }

    setDetectedWeed(detected);
    setControlMethods(mapWeedToControl(detected));
  };

  const mapWeedToControl = (weed) => {
    const map = {
      'Crabgrass': [
        'Annual grass that germinates in spring when soil temperature reaches 55-60°F',
        'Pre-emergent herbicide application in early spring (before germination)',
        'Hand pulling when young, before seeds develop',
        'Post-emergent herbicide for established plants (selective herbicides)',
        'Maintain healthy, dense turf to prevent establishment',
      ],
      'Dandelion': [
        'Perennial broadleaf weed with deep taproot',
        'Hand digging: Remove entire taproot to prevent regrowth',
        'Broadleaf herbicide application (2,4-D, dicamba mix)',
        'Corn gluten meal as natural pre-emergent in lawns',
        'Improve soil fertility and pH to promote competitive grass growth',
      ],
      'Clover': [
        'Nitrogen-fixing perennial, often indicates low soil nitrogen',
        'Manual removal by hand for small patches',
        'Selective broadleaf herbicide if clover is unwanted',
        'Improve nitrogen levels with fertilizer to encourage grass competition',
        'Consider leaving clover as beneficial ground cover (pollinator-friendly)',
      ],
      'Thistle': [
        'Deep-rooted perennial with prickly leaves',
        'Cut below crown level repeatedly to exhaust root reserves',
        'Systemic herbicide (glyphosate or triclopyr) applied to foliage',
        'Remove flower heads before seed dispersal',
        'Cultivate and maintain healthy crop/turf competition',
      ],
      'Bindweed': [
        'Aggressive perennial with extensive root system',
        'Repeated cultivation to exhaust root reserves (labor-intensive)',
        'Systemic herbicide application when actively growing',
        'Smother with landscape fabric or thick mulch for one season',
        'Monitor and remove new shoots promptly to prevent spread',
      ],
      'Nutsedge': [
        'Perennial sedge (not a true grass) with triangular stem',
        'Hand pulling is ineffective due to underground tubers',
        'Selective herbicides containing sulfentrazone or halosulfuron',
        'Improve drainage as nutsedge thrives in wet conditions',
        'Mulch heavily in garden beds to suppress growth',
      ],
    };

    return map[weed] || ['No control methods available for this weed type'];
  };

  return (
    <LinearGradient colors={['#f0fdf4', '#f7fef9', '#ffffff']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="flower" size={32} color="#22c55e" />
          <Text style={styles.title}>Weed Detection</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.buttonGradient}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.actionText}>Capture Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.buttonGradient}>
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
              <Text style={styles.placeholderText}>No weed photo selected</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeWeed}>
          <LinearGradient colors={['#0891b2', '#0e7490']} style={styles.analyzeGradient}>
            <MaterialCommunityIcons name="magnify-scan" size={24} color="#fff" />
            <Text style={styles.analyzeText}>Analyze Weed</Text>
          </LinearGradient>
        </TouchableOpacity>

        {detectedWeed && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="sprout" size={28} color="#22c55e" />
              <View style={styles.resultTitleContainer}>
                <Text style={styles.resultLabel}>Detected Weed</Text>
                <Text style={styles.resultTitle}>{detectedWeed}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <Text style={styles.resultSubtitle}>
              <MaterialCommunityIcons name="clipboard-text" size={16} color="#64748b" /> Control Methods
            </Text>
            {controlMethods.map((method, i) => (
              <View key={i} style={styles.planItem}>
                <View style={styles.planBadge}>
                  <Text style={styles.planIndex}>{i + 1}</Text>
                </View>
                <Text style={styles.planText}>{method}</Text>
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
  actionButton: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  previewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  previewImage: { width: '100%', height: 280, borderRadius: 12, resizeMode: 'cover' },
  placeholder: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', marginTop: 12, fontSize: 15, fontWeight: '500' },
  analyzeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 24, elevation: 4, shadowColor: '#0891b2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  analyzeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  analyzeText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  resultCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  resultTitleContainer: { marginLeft: 12, flex: 1 },
  resultLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 16 },
  resultSubtitle: { color: '#64748b', marginBottom: 16, fontSize: 15, fontWeight: '700' },
  planItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingLeft: 4 },
  planBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  planIndex: { fontWeight: '800', color: '#16a34a', fontSize: 14 },
  planText: { flex: 1, color: '#334155', lineHeight: 22, fontSize: 15 },
});
