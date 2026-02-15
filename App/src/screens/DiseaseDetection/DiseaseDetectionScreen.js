import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, Dimensions, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { detectDisease } from '../../services/diseaseService';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Theme Colors - Matching provided request (#16a34a)
const BRAND_GREEN = "#16a34a"; 
const DARK_TXT = "#0f172a";
const LIGHT_BG = "#f0fdf4";
const WHITE = "#ffffff";

export default function DiseaseDetectionScreen() {
  const [image, setImage] = useState(null);
  const [diseaseData, setDiseaseData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

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
      setDiseaseData(null);
      setActiveTab('Overview');
    }
  };

  const analyzeDisease = async () => {
    if (!image) return Alert.alert('No image', 'Please select a photo.');
    setIsAnalyzing(true);
    try {
      const result = await detectDisease(image);
      setDiseaseData(result?.detection || null);
    } catch (error) {
      Alert.alert('Error', 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderContent = () => {
    if (!diseaseData) return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Upload a clear leaf photo to detect diseases and get treatment advice.</Text>
      </View>
    );

    return (
      <View style={styles.resultsContainer}>
        {/* Identified Specimen Card */}
        <View style={styles.resultHeaderCard}>
          <View style={styles.resultTextCol}>
            <Text style={styles.resultLabel}>DIAGNOSIS RESULT</Text>
            <Text style={styles.resultMainName}>{diseaseData.name}</Text>
            <View style={styles.confidenceRow}>
                 <Text style={styles.confidenceText}>{Math.round(diseaseData.confidence * 100)}% Match Confidence</Text>
            </View>
          </View>
          <View style={styles.categoryBadge}>
             <MaterialCommunityIcons name="alert-decagram" size={20} color="#ef4444" />
          </View>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabContainer}>
            {['Overview', 'Treatment'].map(tab => (
                <TouchableOpacity 
                    key={tab} 
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setActiveTab(tab);
                    }}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Tab Content */}
        <View style={styles.contentPadding}>
            {activeTab === 'Overview' ? (
                <>
                    <View style={styles.sectionHeadingRow}>
                        <Ionicons name="scan-circle-outline" size={22} color={BRAND_GREEN} />
                        <Text style={styles.sectionTitle}>Symptoms & Signs</Text>
                    </View>
                    
                    <View style={styles.infoCard}>
                        {diseaseData.symptoms?.map((symptom, idx) => (
                            <View key={idx} style={styles.checkListItem}>
                                <Ionicons name="warning-outline" size={18} color="#f59e0b" />
                                <Text style={styles.checkListText}>{symptom}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <Text style={styles.descriptionText}>{diseaseData.description}</Text>
                    </View>
                </>
            ) : (
                <>
                     {/* Chemical Control */}
                    {diseaseData.treatment?.chemical && (
                        <View style={styles.treatmentSection}>
                            <View style={styles.sectionHeadingRow}>
                                <MaterialCommunityIcons name="flask-outline" size={22} color="#ef4444" />
                                <Text style={[styles.sectionTitle, {color: '#ef4444'}]}>Chemical Control</Text>
                            </View>
                            <View style={[styles.infoCard, {borderLeftWidth: 4, borderLeftColor: '#ef4444'}]}>
                                {diseaseData.treatment.chemical.map((item, i) => (
                                    <View key={i} style={styles.checkListItem}>
                                        <MaterialCommunityIcons name="circle-small" size={20} color="#ef4444" />
                                        <Text style={styles.checkListText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Biological & Cultural */}
                    <View style={styles.treatmentSection}>
                        <View style={styles.sectionHeadingRow}>
                            <MaterialCommunityIcons name="sprout-outline" size={22} color={BRAND_GREEN} />
                            <Text style={styles.sectionTitle}>Organic & Cultural</Text>
                        </View>
                        <View style={[styles.infoCard, {borderLeftWidth: 4, borderLeftColor: BRAND_GREEN}]}>
                             {diseaseData.treatment?.biological && diseaseData.treatment.biological.map((item, i) => (
                                <View key={'bio'+i} style={styles.checkListItem}>
                                    <MaterialCommunityIcons name="ladybug" size={16} color={BRAND_GREEN} />
                                    <Text style={styles.checkListText}>{item}</Text>
                                </View>
                            ))}
                            {diseaseData.treatment?.cultural && diseaseData.treatment.cultural.map((item, i) => (
                                <View key={'cult'+i} style={styles.checkListItem}>
                                    <MaterialCommunityIcons name="shovel" size={16} color="#d97706" />
                                    <Text style={styles.checkListText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </>
            )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_GREEN} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>Plant Disease Detection</Text>
          </View>

          {/* Image Card */}
          <View style={styles.imageCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.mainImage} />
            ) : (
              <View style={styles.placeholderImage}>
                 <MaterialCommunityIcons name="scan-helper" size={50} color="rgba(255,255,255,0.4)" />
                 <Text style={styles.placeholderSub}>Tap buttons below to scan</Text>
              </View>
            )}
            
            <View style={styles.imageActionRow}>
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('camera')}>
                <Ionicons name="camera-outline" size={22} color={BRAND_GREEN} />
                <Text style={styles.subActionText}>Camera</Text>
              </TouchableOpacity>
              <View style={styles.dividerPipe} />
              <TouchableOpacity style={styles.subActionBtn} onPress={() => handleCapture('gallery')}>
                <Ionicons name="images-outline" size={22} color={BRAND_GREEN} />
                <Text style={styles.subActionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analyze Button */}
          {image && !diseaseData && (
             <TouchableOpacity 
                style={styles.analyzeBtn} 
                onPress={analyzeDisease} 
                disabled={isAnalyzing}
            >
                {isAnalyzing ? (
                   <Text style={styles.analyzeBtnText}>Processing Scan...</Text>
                ) : (
                   <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                       <MaterialCommunityIcons name="magnify-scan" size={20} color="#fff" />
                       <Text style={styles.analyzeBtnText}>Diagnose Issue</Text>
                   </View>
                )}
            </TouchableOpacity>
          )}
        </View>

        {/* Results Area */}
        <View style={styles.detailsArea}>
           {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: LIGHT_BG },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  
  // Header
  headerSection: {
    backgroundColor: BRAND_GREEN,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1
  },
  heroRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 24 
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  leafIconBadge: { backgroundColor: '#fff', padding: 10, borderRadius: 14 },
  
  // Image Card
  imageCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    height: 340,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  mainImage: { width: '100%', height: '82%', borderRadius: 20, resizeMode: 'cover' },
  placeholderImage: { 
      width: '100%', 
      height: '82%', 
      borderRadius: 20, 
      backgroundColor: '#dcfce7', 
      justifyContent: 'center', 
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#bbf7d0',
      borderStyle: 'dashed'
  },
  placeholderSub: { marginTop: 12, color: '#166534', fontWeight: '600' },
  
  imageActionRow: { flexDirection: 'row', height: '18%', alignItems: 'center' },
  subActionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  subActionText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 16 },
  dividerPipe: { width: 1, height: '50%', backgroundColor: '#e2e8f0' },
  
  // Main Action Button
  analyzeBtn: {
    backgroundColor: '#0f172a', // Dark contrast button
    marginTop: 20,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  // Content Area
  detailsArea: { marginTop: -30, paddingHorizontal: 20, zIndex: 2 },
  resultsContainer: { paddingBottom: 20 },
  emptyState: { 
      padding: 40, 
      alignItems: 'center', 
      backgroundColor: '#fff', 
      borderRadius: 24, 
      marginTop: 20, 
      shadowOpacity: 0.05, 
      elevation: 2 
  },
  emptyText: { color: '#94a3b8', textAlign: 'center', fontSize: 15, lineHeight: 22 },

  // Result Header
  resultHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    marginBottom: 20
  },
  resultLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  resultMainName: { color: DARK_TXT, fontSize: 22, fontWeight: '900', marginBottom: 4, lineHeight: 28 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },
  categoryBadge: { 
      backgroundColor: '#fee2e2', 
      padding: 10, 
      borderRadius: 12,
  },

  // Tabs
  tabContainer: { 
      flexDirection: 'row', 
      backgroundColor: '#e2e8f0', 
      borderRadius: 16, 
      padding: 4, 
      marginBottom: 20 
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  tabText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
  activeTabText: { color: BRAND_GREEN },

  // Details
  contentPadding: { gap: 20 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionTitle: { color: DARK_TXT, fontSize: 18, fontWeight: '800' },
  
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
  checkListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  checkListText: { color: '#334155', fontSize: 15, fontWeight: '500', flex: 1, lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  
  treatmentSection: { marginBottom: 10 }
});
