import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectWeed } from '../../services/weedService';

const { width } = Dimensions.get('window');

export default function WeedProtectionScreen({ route }) {
  const [image, setImage] = useState(null);
  const [weedData, setWeedData] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        setImage(uri);
        setWeedData(null);
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
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        setImage(uri);
        setWeedData(null);
      }
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeWeed = async () => {
    if (!image) {
      Alert.alert('No image', 'Please capture or select a weed photo first.');
      return;
    }

    setIsAnalyzing(true);
    setWeedData(null);
    
    try {
      const result = await detectWeed(image);
      console.log('[DEBUG WeedProtectionScreen] Backend result:', result);
      setWeedData(result?.detection || null);
    } catch (error) {
      console.error('[ERROR WeedProtectionScreen] Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message || 'Could not analyze weed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <LinearGradient colors={['#ecfdf5', '#f0fdf4', '#ffffff']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="flower" size={28} color="#10b981" />
            </View>
            <View>
              <Text style={styles.title}>Weed Protection</Text>
              <Text style={styles.subtitle}>AI-Powered Detection</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={takePhoto}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.buttonGradient}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="camera" size={22} color="#fff" />
              </View>
              <Text style={styles.actionText}>Capture Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <View style={styles.buttonWhite}>
              <View style={styles.buttonIconContainerWhite}>
                <Ionicons name="images" size={22} color="#10b981" />
              </View>
              <Text style={styles.actionTextDark}>From Gallery</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Image Preview Card */}
        <View style={styles.previewCardContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
            style={styles.previewCard}
          >
            <View style={styles.previewInner}>
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <View style={styles.sparklesBadge}>
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <View style={styles.uploadIconContainer}>
                    <View style={styles.uploadIconPulse} />
                    <View style={styles.uploadIconCircle}>
                      <Feather name="upload-cloud" size={32} color="#10b981" />
                    </View>
                  </View>
                  <Text style={styles.placeholderTitle}>No weed photo selected</Text>
                  <Text style={styles.placeholderSubtitle}>Upload an image to begin analysis</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity 
          style={[styles.analyzeButton, !image && styles.analyzeButtonDisabled]} 
          onPress={analyzeWeed}
          disabled={!image || isAnalyzing}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={image ? ['#10b981', '#059669'] : ['#d1d5db', '#9ca3af']} 
            style={styles.analyzeGradient}
          >
            {isAnalyzing ? (
              <>
                <MaterialCommunityIcons name="loading" size={24} color="#fff" />
                <Text style={styles.analyzeText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color="#fff" />
                <Text style={styles.analyzeText}>Analyze Weed</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Results Card */}
        {weedData && (
          <View style={styles.resultCardContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.resultCard}
            >
              {/* Result Header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIconBadge}>
                  <MaterialCommunityIcons name="sprout" size={32} color="#10b981" />
                </View>
                <View style={styles.resultTitleContainer}>
                  <Text style={styles.resultLabel}>DETECTED WEED</Text>
                  <Text style={styles.resultTitle}>{weedData.name}</Text>
                  <Text style={styles.scientificName}>{weedData.scientific_name}</Text>
                </View>
              </View>

              {/* Category & Growth Pattern */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>CATEGORY</Text>
                  <Text style={styles.statValue}>{weedData.category}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>GROWTH</Text>
                  <Text style={styles.statValue}>{weedData.growth_pattern}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Common Locations */}
              {weedData.common_locations && weedData.common_locations.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Common Locations</Text>
                  </View>
                  <View style={styles.cropsContainer}>
                    {weedData.common_locations.map((loc, idx) => (
                      <View key={idx} style={styles.cropChip}>
                        <Text style={styles.cropChipText}>{loc}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Characteristics */}
              {weedData.characteristics && weedData.characteristics.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Characteristics</Text>
                  </View>
                  {weedData.characteristics.map((char, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <View style={styles.listBullet} />
                      <Text style={styles.listText}>{char}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.divider} />

              {/* Control Methods */}
              {weedData.control_methods && weedData.control_methods.length > 0 && (
                <>
                  <View style={styles.controlMethodsHeader}>
                    <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#10b981" />
                    <Text style={styles.resultSubtitle}>Control Methods</Text>
                  </View>
                  {weedData.control_methods.map((method, idx) => (
                    <View key={idx} style={styles.planItem}>
                      <View style={styles.planBadge}>
                        <Text style={styles.planIndex}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.planText}>{method}</Text>
                    </View>
                  ))}
                </>
              )}

              {/* Prevention */}
              {weedData.prevention && weedData.prevention.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="shield-check" size={20} color="#f59e0b" />
                    <Text style={styles.sectionTitle}>Prevention Tips</Text>
                  </View>
                  {weedData.prevention.map((tip, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <View style={[styles.listBullet, { backgroundColor: '#f59e0b' }]} />
                      <Text style={styles.listText}>{tip}</Text>
                    </View>
                  ))}
                </>
              )}
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: { 
    flex: 1 
  },
  container: { 
    padding: 20, 
    flexGrow: 1 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 24, 
    marginTop: 8 
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1e293b', 
    letterSpacing: -0.5 
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24, 
    gap: 12 
  },
  actionButton: { 
    flex: 1, 
    borderRadius: 20, 
    overflow: 'hidden', 
    elevation: 8, 
    shadowColor: '#10b981', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 12 
  },
  buttonGradient: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 20, 
    paddingHorizontal: 16, 
    gap: 8 
  },
  buttonWhite: {
    backgroundColor: '#fff',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 20,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIconContainerWhite: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 14 
  },
  actionTextDark: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 14,
  },
  previewCardContainer: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  previewCard: { 
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  previewInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  previewImage: { 
    width: '100%', 
    height: 280, 
    borderRadius: 16, 
    resizeMode: 'cover' 
  },
  sparklesBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  placeholder: { 
    width: '100%', 
    height: 280, 
    borderRadius: 16, 
    backgroundColor: '#f9fafb', 
    borderWidth: 2, 
    borderColor: '#d1fae5', 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 24,
  },
  uploadIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  uploadIconPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    opacity: 0.6,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: { 
    color: '#64748b', 
    fontSize: 15, 
    fontWeight: '600',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  analyzeButton: { 
    borderRadius: 20, 
    overflow: 'hidden', 
    marginBottom: 24, 
    elevation: 10, 
    shadowColor: '#10b981', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 12 
  },
  analyzeButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  analyzeGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    gap: 10 
  },
  analyzeText: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 17 
  },
  resultCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    marginBottom: 16,
  },
  resultCard: { 
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderLeftWidth: 4, 
    borderLeftColor: '#10b981',
  },
  resultHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  resultIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  resultTitleContainer: { 
    marginLeft: 16, 
    flex: 1 
  },
  resultLabel: { 
    fontSize: 11, 
    color: '#10b981', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statLabel: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cropChip: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  cropChipText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 7,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  divider: { 
    height: 1, 
    backgroundColor: 'rgba(16, 185, 129, 0.2)', 
    marginBottom: 20 
  },
  controlMethodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  resultSubtitle: { 
    color: '#1e293b', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  planItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 16, 
    paddingLeft: 4 
  },
  planBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#d1fae5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12, 
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  planIndex: { 
    fontWeight: '800', 
    color: '#059669', 
    fontSize: 14 
  },
  planText: { 
    flex: 1, 
    color: '#334155', 
    lineHeight: 22, 
    fontSize: 15,
    fontWeight: '500',
  },
});
