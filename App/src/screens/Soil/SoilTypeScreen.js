import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeSoil as analyzeSoilAPI } from '../../services/soilService';

const { width } = Dimensions.get('window');

export default function SoilTypeScreen({ route }) {
  const [image, setImage] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [soilType, setSoilType] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [characteristics, setCharacteristics] = useState(null);
  const [suitableCrops, setSuitableCrops] = useState([]);
  const [phRange, setPhRange] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [mediaPermission, setMediaPermission] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadSavedImage();

    if (route?.params?.capturedImage) {
      setImage(route.params.capturedImage);
      saveImageTemporarily(route.params.capturedImage);
    }

    (async () => {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setCameraPermission(cam.status === 'granted');
      setMediaPermission(media.status === 'granted');
    })();
  }, [route?.params?.capturedImage]);

  const loadSavedImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('soil_temp_image');
      if (savedImage) {
        setImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading saved image:', error);
    }
  };

  const saveImageTemporarily = async (imageUri) => {
    try {
      await AsyncStorage.setItem('soil_temp_image', imageUri);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

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
        saveImageTemporarily(uri);
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
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        setImage(uri);
        saveImageTemporarily(uri);
        setSoilType(null);
        setRecommendations([]);
      }
    } catch (err) {
      console.error('takePhoto error', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const analyzeSoil = async () => {
    if (!image) {
      Alert.alert('No image', 'Please capture or select a soil photo first.');
      return;
    }

    setIsAnalyzing(true);
    setSoilData(null);
    setSoilType(null);
    setRecommendations([]);
    setCharacteristics(null);
    setSuitableCrops([]);
    setPhRange(null);

    try {
      const result = await analyzeSoilAPI(image);
      
      if (result.success && result.analysis) {
        const analysis = result.analysis;
        setSoilData(result);
        setSoilType(analysis.type);
        setRecommendations(analysis.recommendations || []);
        setCharacteristics(analysis.characteristics || null);
        setSuitableCrops(analysis.suitable_crops || []);
        setPhRange(analysis.ph_range || null);
        
        Alert.alert('Analysis Complete', `Detected: ${analysis.type}`, [{ text: 'OK' }]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Soil analysis error:', error);
      Alert.alert(
        'Analysis Failed',
        'Could not analyze the soil. Using fallback data.',
        [{ text: 'OK' }]
      );
      
      // Fallback to random selection
      const choices = ['Sandy Soil', 'Loamy Soil', 'Clay Soil', 'Silty Soil', 'Peaty Soil'];
      const detected = choices[Math.floor(Math.random() * choices.length)];
      setSoilType(detected);
      setRecommendations(mapSoilToRecommendations(detected));
    } finally {
      setIsAnalyzing(false);
    }
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
    <LinearGradient colors={['#fefaf5', '#fef9f3', '#ffffff']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="layers-triple" size={28} color="#78716c" />
            </View>
            <View>
              <Text style={styles.title}>Soil Type Analysis</Text>
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
            <LinearGradient colors={['#78716c', '#57534e']} style={styles.buttonGradient}>
              <View style={styles.buttonIconContainer}>
                <Ionicons name="camera" size={22} color="#fff" />
              </View>
              <Text style={styles.actionText}>Capture Soil</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <View style={styles.buttonWhite}>
              <View style={styles.buttonIconContainerWhite}>
                <Ionicons name="images" size={22} color="#78716c" />
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
                      <Feather name="upload-cloud" size={32} color="#78716c" />
                    </View>
                  </View>
                  <Text style={styles.placeholderTitle}>No soil photo selected</Text>
                  <Text style={styles.placeholderSubtitle}>Upload an image to begin analysis</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity 
          style={[styles.analyzeButton, !image && styles.analyzeButtonDisabled]} 
          onPress={analyzeSoil}
          disabled={!image || isAnalyzing}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={image ? ['#78716c', '#57534e'] : ['#d1d5db', '#9ca3af']} 
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
                <Text style={styles.analyzeText}>Analyze Soil</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Results Card */}
        {soilType && (
          <View style={styles.resultCardContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
              style={styles.resultCard}
            >
              {/* Result Header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIconBadge}>
                  <MaterialCommunityIcons name="layers" size={32} color="#78716c" />
                </View>
                <View style={styles.resultTitleContainer}>
                  <Text style={styles.resultLabel}>DETECTED SOIL TYPE</Text>
                  <Text style={styles.resultTitle}>{soilType}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Confidence */}
              {soilData?.analysis?.confidence && (
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${soilData.analysis.confidence * 100}%` }]} />
                  </View>
                  <Text style={styles.confidenceText}>{(soilData.analysis.confidence * 100).toFixed(0)}%</Text>
                </View>
              )}

              {/* Characteristics */}
              {characteristics && (
                <>
                  <View style={styles.controlMethodsHeader}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#78716c" />
                    <Text style={styles.resultSubtitle}>Characteristics</Text>
                  </View>
                  <View style={styles.charGrid}>
                    <View style={styles.charItem}>
                      <Text style={styles.charLabel}>Texture</Text>
                      <Text style={styles.charValue}>{characteristics.texture}</Text>
                    </View>
                    <View style={styles.charItem}>
                      <Text style={styles.charLabel}>Drainage</Text>
                      <Text style={styles.charValue}>{characteristics.drainage}</Text>
                    </View>
                    <View style={styles.charItem}>
                      <Text style={styles.charLabel}>Nutrients</Text>
                      <Text style={styles.charValue}>{characteristics.nutrient_retention}</Text>
                    </View>
                    <View style={styles.charItem}>
                      <Text style={styles.charLabel}>Water Capacity</Text>
                      <Text style={styles.charValue}>{characteristics.water_holding_capacity}</Text>
                    </View>
                  </View>
                </>
              )}

              {/* pH Range */}
              {phRange && (
                <View style={styles.phContainer}>
                  <MaterialCommunityIcons name="ph" size={20} color="#78716c" />
                  <Text style={styles.phLabel}>pH Range: </Text>
                  <Text style={styles.phValue}>{phRange}</Text>
                </View>
              )}

              {/* Suitable Crops */}
              {suitableCrops.length > 0 && (
                <>
                  <View style={styles.controlMethodsHeader}>
                    <MaterialCommunityIcons name="leaf" size={20} color="#78716c" />
                    <Text style={styles.resultSubtitle}>Suitable Crops</Text>
                  </View>
                  <View style={styles.cropsContainer}>
                    {suitableCrops.map((crop, i) => (
                      <View key={i} style={styles.cropChip}>
                        <Text style={styles.cropText}>{crop}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Recommendations */}
              <View style={styles.controlMethodsHeader}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#78716c" />
                <Text style={styles.resultSubtitle}>Recommendations</Text>
              </View>

              {recommendations.map((r, i) => (
                <View key={i} style={styles.planItem}>
                  <View style={styles.planBadge}>
                    <Text style={styles.planIndex}>{i + 1}</Text>
                  </View>
                  <Text style={styles.planText}>{r}</Text>
                </View>
              ))}
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
    backgroundColor: 'rgba(120, 113, 108, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(120, 113, 108, 0.2)',
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
    shadowColor: '#78716c', 
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
    backgroundColor: '#fafaf9',
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
    shadowColor: '#78716c',
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
    backgroundColor: '#78716c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#78716c',
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
    borderColor: '#e7e5e4', 
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
    backgroundColor: '#e7e5e4',
    opacity: 0.6,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fafaf9',
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
    shadowColor: '#78716c', 
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
    shadowColor: '#78716c',
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
    borderLeftColor: '#78716c',
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
    backgroundColor: 'rgba(120, 113, 108, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(120, 113, 108, 0.2)',
  },
  resultTitleContainer: { 
    marginLeft: 16, 
    flex: 1 
  },
  resultLabel: { 
    fontSize: 11, 
    color: '#78716c', 
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
  divider: { 
    height: 1, 
    backgroundColor: 'rgba(120, 113, 108, 0.2)', 
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
    backgroundColor: '#f5f5f4', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12, 
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  planIndex: { 
    fontWeight: '800', 
    color: '#57534e', 
    fontSize: 14 
  },
  planText: { 
    flex: 1, 
    color: '#334155', 
    lineHeight: 22, 
    fontSize: 15,
    fontWeight: '500',
  },
  confidenceContainer: {
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716c',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceBar: {
    height: 12,
    backgroundColor: '#f5f5f4',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#78716c',
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534e',
    textAlign: 'right',
  },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  charItem: {
    width: '47%',
    backgroundColor: '#fafaf9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  charLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716c',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  charValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  phContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  phLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  phValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  cropChip: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  cropText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
});
