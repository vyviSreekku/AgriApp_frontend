import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { detectWeed } from '../../services/weedService';

const { width } = Dimensions.get('window');

const DARK_GREEN = "#014421"; 
const ACCENT_GREEN = "#10b981";
const LIGHT_BG = "#f0fdf4";

export default function WeedProtectionScreen() {
  const [image, setImage] = useState(null);
  const [weedData, setWeedData] = useState(null);
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
      setWeedData(null);
    }
  };

  const analyzeWeed = async () => {
    if (!image) return Alert.alert('No image', 'Please select a photo.');
    setIsAnalyzing(true);
    try {
      const result = await detectWeed(image);
      setWeedData(result?.detection || null);
    } catch (error) {
      Alert.alert('Error', 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      
      {/* Single ScrollView wrapping everything ensures the green 
        header and the recognition title scroll away with the content.
      */}
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Header Section - Now inside ScrollView */}
        <View style={styles.headerSection}>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>Weed Recognition</Text>
            <View style={styles.leafIconBadge}>
              <MaterialCommunityIcons name="leaf" size={20} color="#fff" />
            </View>
          </View>

          {/* Image Preview Area */}
          <View style={styles.imageCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.mainImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons name="image-search" size={50} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            
            <View style={styles.imageActionRow}>
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('camera')}>
                <Ionicons name="camera-outline" size={20} color={DARK_GREEN} />
                <Text style={styles.subActionText}>Capture</Text>
              </TouchableOpacity>
              <View style={styles.dividerPipe} />
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('gallery')}>
                <Ionicons name="images-outline" size={20} color={DARK_GREEN} />
                <Text style={styles.subActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analyze Button */}
          <TouchableOpacity 
            style={styles.analyzeBtn} 
            onPress={analyzeWeed} 
            disabled={isAnalyzing}
          >
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? "Analyzing..." : "Analyze Specimen"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results & Details Area */}
        <View style={styles.detailsArea}>
          {weedData ? (
            <>
              <View style={styles.resultHeaderCard}>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultLabel}>IDENTIFIED SPECIMEN</Text>
                  <Text style={styles.resultMainName}>{weedData.name}</Text>
                  <Text style={styles.resultSciName}>{weedData.scientific_name}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{weedData.category || "Broadleaf Weed"}</Text>
                </View>
              </View>

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

              <View style={styles.contentPadding}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="scan-circle-outline" size={22} color={DARK_GREEN} />
                  <Text style={styles.sectionTitle}>Visual Identifiers</Text>
                </View>
                
                <View style={styles.infoCard}>
                  {(weedData.characteristics || []).map((item, idx) => (
                    <View key={idx} style={styles.checkListItem}>
                      <Ionicons name="checkmark" size={18} color={ACCENT_GREEN} />
                      <Text style={styles.checkListText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
                  <MaterialCommunityIcons name="map-marker-outline" size={22} color={DARK_GREEN} />
                  <Text style={styles.sectionTitle}>Common Habitats</Text>
                </View>
                <View style={styles.habitatsRow}>
                  {(weedData.common_locations || []).map((loc, idx) => (
                    <View key={idx} style={styles.habitatChip}>
                      <Text style={styles.habitatChipText}>{loc}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Upload a photo to see identification details</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: LIGHT_BG },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  headerSection: {
    backgroundColor: DARK_GREEN,
    paddingTop: 20, // Reduced as we use navigation header
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  leafIconBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    height: 320,
    overflow: 'hidden',
  },
  mainImage: { width: '100%', height: '80%', borderRadius: 15, resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '80%', borderRadius: 15, backgroundColor: '#023018', justifyContent: 'center', alignItems: 'center' },
  imageActionRow: { flexDirection: 'row', height: '20%', alignItems: 'center' },
  subActionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  subActionText: { color: DARK_GREEN, fontWeight: '700', fontSize: 16 },
  dividerPipe: { width: 1, height: '60%', backgroundColor: '#e2e8f0' },
  analyzeBtn: {
    backgroundColor: '#059669',
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  resultLabel: { color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  resultMainName: { color: DARK_GREEN, fontSize: 26, fontWeight: '900', marginTop: 4 },
  resultSciName: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
  categoryBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#d1fae5' },
  categoryBadgeText: { color: '#059669', fontSize: 12, fontWeight: '700' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 15, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: DARK_GREEN },
  tabText: { color: '#64748b', fontWeight: '700' },
  activeTabText: { color: '#fff' },

  contentPadding: { paddingTop: 20 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionTitle: { color: DARK_GREEN, fontSize: 18, fontWeight: '800' },
  infoCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15 },
  checkListItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  checkListText: { color: '#334155', fontSize: 15, fontWeight: '500', flex: 1 },
  
  habitatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habitatChip: { backgroundColor: DARK_GREEN, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  habitatChipText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 15 },
});