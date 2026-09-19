import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const PlantImageCaptureScreen = ({ navigation }) => {
  const [image, setImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  // Automatically open camera when component mounts
  useEffect(() => {
    captureImage();
  }, []);

  // Request camera permissions and capture image
  const captureImage = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to capture images.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Remove cropping
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        setShowCategorySelection(true);
        setSelectedCategory(null);
      } else {
        // User cancelled, go back to dashboard
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Gallery permission is needed to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Remove cropping
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImage(result.assets[0].uri);
        setShowCategorySelection(true);
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Navigate to appropriate screen based on category
  const handleProceed = () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select what you want to analyze.');
      return;
    }

    // Navigate to the appropriate screen with the image
    switch (selectedCategory) {
      case 'disease':
        navigation.navigate('DiseaseDetection', { capturedImage: image });
        break;
      case 'pest':
        navigation.navigate('PestDetection', { capturedImage: image });
        break;
      case 'weed':
        navigation.navigate('WeedProtection', { capturedImage: image });
        break;
      case 'soil':
        navigation.navigate('SoilType', { capturedImage: image });
        break;
      default:
        break;
    }
  };

  // Reset and capture new image
  const resetCapture = () => {
    setImage(null);
    setShowCategorySelection(false);
    setSelectedCategory(null);
  };

  const categories = [
    {
      id: 'pest',
      name: 'Pest Detection',
      description: 'Identify pests and get control methods',
      icon: 'ladybug',
      color: '#f59e42',
      bgColor: '#fef3c7',
    },
    {
      id: 'disease',
      name: 'Disease Detection',
      description: 'Identify plant diseases and treatment',
      icon: 'biohazard',
      color: '#ef4444',
      bgColor: '#fee2e2',
    },
    {
      id: 'weed',
      name: 'Weed Detection',
      description: 'Identify weeds and get control methods',
      icon: 'flower',
      color: '#22c55e',
      bgColor: '#dcfce7',
    },
    {
      id: 'soil',
      name: 'Soil Analysis',
      description: 'Analyze soil type and properties',
      icon: 'layers',
      color: '#78716c',
      bgColor: '#f5f5f4',
    },
  ];

  return (
    <LinearGradient colors={['#faf5ff', '#fff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Plant Image Analysis</Text>
              <Text style={styles.headerSubtitle}>
                {!image ? 'Opening camera...' : 'Select analysis type'}
              </Text>
            </View>
          </View>

          {/* Image Preview or Loading */}
          {!image ? (
            <View style={styles.captureSection}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="camera-iris" size={80} color="#8b5cf6" />
              </View>
              <Text style={styles.captureTitle}>Opening Camera...</Text>
              <Text style={styles.captureDescription}>
                Please allow camera permissions if prompted
              </Text>
            </View>
          ) : (
            <View style={styles.previewSection}>
              {/* Image Preview */}
              <View style={styles.imagePreviewCard}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={resetCapture}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Category Selection */}
              {showCategorySelection && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>What do you want to analyze?</Text>
                  <Text style={styles.categoryDescription}>
                    Select the type of analysis you need
                  </Text>

                  <View style={styles.categoryGrid}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryCard,
                          selectedCategory === category.id && styles.categoryCardSelected,
                        ]}
                        onPress={() => handleCategorySelect(category.id)}
                      >
                        <View 
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: category.bgColor },
                            selectedCategory === category.id && { 
                              backgroundColor: category.color,
                            }
                          ]}
                        >
                          <MaterialCommunityIcons 
                            name={category.icon} 
                            size={32} 
                            color={selectedCategory === category.id ? '#fff' : category.color} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.categoryName, { textAlign: 'left' }]}>{category.name}</Text>
                          <Text style={[styles.categoryDesc, { textAlign: 'left', marginLeft: 0, left: 0, position: 'relative', top: 0 }]}>{category.description}</Text>
                        </View>
                        
                        {selectedCategory === category.id && (
                          <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark-circle" size={24} color={category.color} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Proceed Button */}
                  <TouchableOpacity 
                    style={[
                      styles.proceedButton,
                      !selectedCategory && styles.proceedButtonDisabled
                    ]}
                    onPress={handleProceed}
                    disabled={!selectedCategory}
                  >
                    <LinearGradient
                      colors={selectedCategory ? ['#8b5cf6', '#7c3aed'] : ['#cbd5e1', '#94a3b8']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.proceedButtonText}>Proceed to Analysis</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  captureSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
  },
  captureDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    gap: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    gap: 10,
  },
  secondaryButtonText: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: '600',
  },
  previewSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  imagePreviewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categorySection: {
    marginTop: 30,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  categoryGrid: {
    gap: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  categoryCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    flex: 1,
  },
  categoryDesc: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    position: 'absolute',
    left: 99,
    top: 45,
  },
  selectedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  proceedButton: {
    marginTop: 25,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  proceedButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsSection: {
    marginHorizontal: 30,
    marginTop: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 15,
    color: '#475569',
    marginLeft: 12,
    flex: 1,
  },
});

export default PlantImageCaptureScreen;
