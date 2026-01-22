import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { detectPest } from '../../services/pestService';

const { width } = Dimensions.get('window');

// Maintaining your original color palette
const PRIMARY_RED = "#a536368e"; 
const DARK_RED = "#dc2626";
const LIGHT_RED_BG = "#fef2f2";

export default function PestDetectionScreen() {
  const [image, setImage] = useState(null);
  const [pestData, setPestData] = useState(null);
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
      setPestData(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return Alert.alert('No image', 'Please select a photo.');
    setIsAnalyzing(true);
    try {
      const result = await detectPest(image);
      setPestData(result?.detection || null);
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
        {/* Red Header Section - Now inside ScrollView */}
        <View style={styles.headerSection}>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>Pest Recognition</Text>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="bug" size={20} color="#fff" />
            </View>
          </View>

          {/* Image Preview Area */}
          <View style={styles.imageCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.mainImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons name="magnify-scan" size={50} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            
            <View style={styles.imageActionRow}>
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('camera')}>
                <Ionicons name="camera-outline" size={20} color={PRIMARY_RED} />
                <Text style={styles.subActionText}>Capture</Text>
              </TouchableOpacity>
              <View style={styles.dividerPipe} />
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('gallery')}>
                <Ionicons name="images-outline" size={20} color={PRIMARY_RED} />
                <Text style={styles.subActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity 
            style={styles.analyzeBtn} 
            onPress={analyzeImage} 
            disabled={isAnalyzing || !image}
          >
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? "Analyzing Specimen..." : "Analyze Specimen"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results & Details Area */}
        <View style={styles.detailsArea}>
          {pestData ? (
            <>
              {/* Result Header Card */}
              <View style={styles.resultHeaderCard}>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultLabel}>DETECTED PEST</Text>
                  <Text style={styles.resultMainName}>{pestData.name}</Text>
                  <Text style={styles.resultSciName}>{pestData.scientific_name}</Text>
                </View>
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>{pestData.severity}</Text>
                </View>
              </View>

              {/* Segmented Control */}
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'Identification' && styles.activeTab]}
                  onPress={() => setActiveTab('Identification')}
                >
                  <Text style={[styles.tabText, activeTab === 'Identification' && styles.activeTabText]}>Identification</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'Management' && styles.activeTab]}
                  onPress={() => setActiveTab('Management')}
                >
                  <Text style={[styles.tabText, activeTab === 'Management' && styles.activeTabText]}>Management</Text>
                </TouchableOpacity>
              </View>

              {/* Content Based on Tab */}
              <View style={styles.contentPadding}>
                {activeTab === 'Identification' ? (
                  <>
                    <View style={styles.sectionHeadingRow}>
                      <Ionicons name="search-outline" size={22} color={PRIMARY_RED} />
                      <Text style={styles.sectionTitle}>Visible Symptoms</Text>
                    </View>
                    <View style={styles.infoCard}>
                      {(pestData.symptoms || []).map((item, idx) => (
                        <View key={idx} style={styles.checkListItem}>
                          <Ionicons name="alert-circle-outline" size={18} color={PRIMARY_RED} />
                          <Text style={styles.checkListText}>{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
                      <MaterialCommunityIcons name="leaf" size={22} color={PRIMARY_RED} />
                      <Text style={styles.sectionTitle}>Common Targets</Text>
                    </View>
                    <View style={styles.habitatsRow}>
                      {(pestData.affected_crops || []).map((crop, idx) => (
                        <View key={idx} style={styles.habitatChip}>
                          <Text style={styles.habitatChipText}>{crop}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.sectionHeadingRow}>
                      <MaterialCommunityIcons name="shield-bug-outline" size={22} color={PRIMARY_RED} />
                      <Text style={styles.sectionTitle}>Control Methods</Text>
                    </View>
                    {(pestData.control_methods || []).map((method, idx) => (
                      <View key={idx} style={styles.recItem}>
                        <View style={styles.recNumber}><Text style={styles.recNumberText}>{idx + 1}</Text></View>
                        <Text style={styles.recText}>{method}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Upload a photo to see pest identification and management advice</Text>
            </View>
          )}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: LIGHT_RED_BG },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerSection: {
    backgroundColor: PRIMARY_RED,
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
  placeholderImage: { width: '100%', height: '80%', borderRadius: 15, backgroundColor: '#450a0a', justifyContent: 'center', alignItems: 'center' },
  imageActionRow: { flexDirection: 'row', height: '20%', alignItems: 'center' },
  subActionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  subActionText: { color: PRIMARY_RED, fontWeight: '700', fontSize: 16 },
  dividerPipe: { width: 1, height: '60%', backgroundColor: '#e2e8f0' },
  analyzeBtn: {
    backgroundColor: DARK_RED,
    marginTop: 15,
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
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
  resultLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  resultMainName: { color: PRIMARY_RED, fontSize: 24, fontWeight: '900', marginTop: 4 },
  resultSciName: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
  severityBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  severityText: { color: PRIMARY_RED, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 15, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: PRIMARY_RED },
  tabText: { color: '#64748b', fontWeight: '700' },
  activeTabText: { color: '#fff' },

  contentPadding: { paddingTop: 20 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { color: PRIMARY_RED, fontSize: 18, fontWeight: '800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15 },
  checkListItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkListText: { color: '#334155', fontSize: 14, flex: 1 },
  
  habitatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habitatChip: { backgroundColor: PRIMARY_RED, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  habitatChipText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  recItem: { flexDirection: 'row', gap: 12, marginBottom: 15, backgroundColor: '#fff', padding: 15, borderRadius: 15 },
  recNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
  recNumberText: { color: PRIMARY_RED, fontWeight: '800' },
  recText: { flex: 1, color: '#334155', lineHeight: 20, fontWeight: '500' },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
});