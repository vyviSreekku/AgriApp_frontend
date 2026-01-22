import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { analyzeSoil as analyzeSoilAPI } from '../../services/soilService';

const { width } = Dimensions.get('window');

// Color Palette - Earth & Soil Tones
const DARK_BROWN = "#452c1e"; 
const ACCENT_BROWN = "#8b5e3c";
const LIGHT_BROWN_BG = "#fcf9f5";

export default function SoilTypeScreen() {
  const [image, setImage] = useState(null);
  const [soilData, setSoilData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('Identification');

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const handleCapture = async (type) => {
    const options = { mediaTypes: ['images'], quality: 0.7 };
    const res = type === 'camera' 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setSoilData(null);
    }
  };

  const analyzeSoil = async () => {
    if (!image) return Alert.alert('No image', 'Please select a soil photo.');
    setIsAnalyzing(true);
    try {
      const result = await analyzeSoilAPI(image);
      if (result.success) {
        setSoilData(result.analysis);
      }
    } catch (error) {
      Alert.alert('Error', 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Earthy Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>Soil Analysis</Text>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="layers-triple" size={20} color="#fff" />
            </View>
          </View>

          {/* Image Preview Area */}
          <View style={styles.imageCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.mainImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons name="texture-box" size={50} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            
            <View style={styles.imageActionRow}>
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('camera')}>
                <Ionicons name="camera-outline" size={20} color={DARK_BROWN} />
                <Text style={styles.subActionText}>Capture</Text>
              </TouchableOpacity>
              <View style={styles.dividerPipe} />
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('gallery')}>
                <Ionicons name="images-outline" size={20} color={DARK_BROWN} />
                <Text style={styles.subActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity 
            style={styles.analyzeBtn} 
            onPress={analyzeSoil} 
            disabled={isAnalyzing || !image}
          >
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? "Analyzing Texture..." : "Analyze Specimen"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results & Details Area */}
        <View style={styles.detailsArea}>
          {soilData ? (
            <>
              {/* Result Header Card */}
              <View style={styles.resultHeaderCard}>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultLabel}>DETECTED SOIL TYPE</Text>
                  <Text style={styles.resultMainName}>{soilData.type}</Text>
                  <Text style={styles.subLabel}>pH Level: {soilData.ph_range}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{(soilData.confidence * 100).toFixed(0)}% Match</Text>
                </View>
              </View>

              {/* Segmented Control */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'Identification' && styles.activeTab]}
                  onPress={() => setActiveTab('Identification')}
                >
                  <Text style={[styles.tabText, activeTab === 'Identification' && styles.activeTabText]}>Properties</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'Management' && styles.activeTab]}
                  onPress={() => setActiveTab('Management')}
                >
                  <Text style={[styles.tabText, activeTab === 'Management' && styles.activeTabText]}>Crops & Care</Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <View style={styles.contentPadding}>
                {activeTab === 'Identification' ? (
                  <>
                    <View style={styles.sectionHeadingRow}>
                      <Ionicons name="information-circle-outline" size={22} color={DARK_BROWN} />
                      <Text style={styles.sectionTitle}>Physical Characteristics</Text>
                    </View>
                    <View style={styles.infoCard}>
                      {Object.entries(soilData.characteristics).map(([key, value], idx) => (
                        <View key={idx} style={styles.checkListItem}>
                          <Ionicons name="radio-button-on" size={18} color={ACCENT_BROWN} />
                          <Text style={styles.checkListText}>
                            <Text style={{fontWeight: 'bold', textTransform: 'capitalize'}}>{key.replace('_', ' ')}: </Text>
                            {value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.sectionHeadingRow}>
                      <MaterialCommunityIcons name="leaf" size={22} color={DARK_BROWN} />
                      <Text style={styles.sectionTitle}>Ideal Crops</Text>
                    </View>
                    <View style={styles.habitatsRow}>
                      {(soilData.suitable_crops || []).map((crop, idx) => (
                        <View key={idx} style={styles.habitatChip}>
                          <Text style={styles.habitatChipText}>{crop}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.sectionHeadingRow, {marginTop: 25}]}>
                      <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={DARK_BROWN} />
                      <Text style={styles.sectionTitle}>Management Plan</Text>
                    </View>
                    {(soilData.recommendations || []).map((rec, idx) => (
                      <View key={idx} style={styles.planItem}>
                        <View style={styles.planBadge}>
                          <Text style={styles.planIndex}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.planText}>{rec}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Perform a scan to see soil characteristics and recommendations</Text>
            </View>
          )}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: LIGHT_BROWN_BG },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerSection: {
    backgroundColor: DARK_BROWN,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  iconBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    height: 320,
    overflow: 'hidden',
  },
  mainImage: { width: '100%', height: '80%', borderRadius: 15, resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '80%', borderRadius: 15, backgroundColor: '#2d1e16', justifyContent: 'center', alignItems: 'center' },
  imageActionRow: { flexDirection: 'row', height: '20%', alignItems: 'center' },
  subActionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  subActionText: { color: DARK_BROWN, fontWeight: '700', fontSize: 16 },
  dividerPipe: { width: 1, height: '60%', backgroundColor: '#e2e8f0' },
  analyzeBtn: {
    backgroundColor: ACCENT_BROWN,
    marginTop: 15,
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
  },
  analyzeBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  
  detailsArea: { marginTop: -20, paddingHorizontal: 20 },
  resultHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 3,
  },
  resultLabel: { color: '#8b5e3c', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  resultMainName: { color: DARK_BROWN, fontSize: 24, fontWeight: '900', marginTop: 4 },
  subLabel: { color: '#64748b', fontSize: 14, marginTop: 2 },
  confidenceBadge: { backgroundColor: '#fdf4ec', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  confidenceText: { color: '#8b5e3c', fontSize: 12, fontWeight: '700' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 15, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: DARK_BROWN },
  tabText: { color: '#64748b', fontWeight: '700' },
  activeTabText: { color: '#fff' },

  contentPadding: { paddingTop: 20 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { color: DARK_BROWN, fontSize: 18, fontWeight: '800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15 },
  checkListItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkListText: { color: '#334155', fontSize: 14, flex: 1 },
  
  habitatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habitatChip: { backgroundColor: DARK_BROWN, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  habitatChipText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  planItem: { flexDirection: 'row', gap: 12, marginBottom: 15, backgroundColor: '#fff', padding: 15, borderRadius: 15 },
  planBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fdf4ec', justifyContent: 'center', alignItems: 'center' },
  planIndex: { color: '#8b5e3c', fontWeight: '800' },
  planText: { flex: 1, color: '#334155', lineHeight: 20, fontWeight: '500' },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
});