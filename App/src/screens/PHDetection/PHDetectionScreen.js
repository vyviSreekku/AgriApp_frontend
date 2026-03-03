import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getPhFromRgb, getPhColor, getPhColorName, REFERENCE_TABLE } from '../../utils/phUtils';

// Optional dependencies for pixel extraction
let ImageManipulator;
let UPNG;
let Buffer;

try {
  ImageManipulator = require('expo-image-manipulator');
  UPNG = require('upng-js');
  Buffer = require('buffer').Buffer;
} catch (e) {
  console.log("Optional dependencies 'expo-image-manipulator', 'upng-js', 'buffer' missing. Using mock if needed.");
}

const PHDetectionScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [touchCoords, setTouchCoords] = useState(null);
  const [imageLayout, setImageLayout] = useState(null);

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required');
            return;
          }
      } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery permission is required');
            return;
          }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            allowsEditing: false, 
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setResult(null);
        setTouchCoords(null);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleImagePress = async (event) => {
    if (!imageUri || loading || !imageLayout) return;

    const { locationX, locationY } = event.nativeEvent;
    
    // UI Marker
    setTouchCoords({ x: locationX, y: locationY });

    if (!ImageManipulator || !UPNG || !Buffer) {
        Alert.alert(
            "Missing Dependencies", 
            "To unlock real color analysis, please install: expo-image-manipulator, upng-js, buffer.\n\nAnalyzing with demo data now..."
        );
        mockAnalysis();
        return;
    }

    setLoading(true);
    
    try {
        // 1. Get original image size
        const originalSize = await new Promise((resolve, reject) => {
            Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), reject);
        });

        // 2. Map View coordinates to Image coordinates (assuming resizeMode="contain")
        const viewRatio = imageLayout.width / imageLayout.height;
        const imageRatio = originalSize.width / originalSize.height;
        
        let scale, offsetX = 0, offsetY = 0;

        if (viewRatio > imageRatio) {
            // View is wider than image (image limited by height, centered horizontally)
            scale = originalSize.height / imageLayout.height;
            const displayedWidth = originalSize.width / scale;
            offsetX = (imageLayout.width - displayedWidth) / 2;
        } else {
            // View is taller (image limited by width, centered vertically)
            scale = originalSize.width / imageLayout.width; 
            const displayedHeight = originalSize.height / scale;
            offsetY = (imageLayout.height - displayedHeight) / 2;
        }

        // Adjust for offline padding
        const touchX_in_image = (locationX - offsetX);
        const touchY_in_image = (locationY - offsetY);

        // Check bounds
        if (touchX_in_image < 0 || touchX_in_image * scale > originalSize.width || 
            touchY_in_image < 0 || touchY_in_image * scale > originalSize.height) {
             Alert.alert("Out of bounds", "Please tap inside the image.");
             setLoading(false);
             return;
        }

        const pixelX = touchX_in_image * scale;
        const pixelY = touchY_in_image * scale;

        // 3. Crop 10x10 area around tap
        // Be careful not to go out of bounds
        const cropSize = 10;
        const originX = Math.max(0, Math.min(originalSize.width - cropSize, pixelX - cropSize/2));
        const originY = Math.max(0, Math.min(originalSize.height - cropSize, pixelY - cropSize/2));

        const manipResult = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ crop: { originX, originY, width: cropSize, height: cropSize } }],
            { base64: true, format: ImageManipulator.SaveFormat.PNG }
        );

        // 4. Decode PNG & Analyze
        const pixelRGB = await getAverageColor(manipResult.base64);
        
        if (pixelRGB) {
            // Updated to use RGB calculation directly
            const phData = getPhFromRgb(pixelRGB);
            
            setResult({
                rgb: pixelRGB,
                // lab: lab, // No longer used
                ph: phData.ph,
                diff: phData.difference
            });
        }

    } catch (error) {
        console.error("Analysis Error:", error);
        Alert.alert("Analysis Failed", "Coordinate mapping error. Try again.");
    } finally {
        setLoading(false);
    }
  };

  const getAverageColor = async (base64) => {
      try {
        const buffer = Buffer.from(base64, 'base64');
        // UPNG.decode expects an ArrayBuffer. 
        // In the browser/RN 'buffer' package, the underlying ArrayBuffer is accessible via .buffer
        // providing the offset and length is respected if it's a slice.
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        
        const img = UPNG.decode(arrayBuffer);
        const rgba = UPNG.toRGBA8(img)[0];
        const pixelData = new Uint8Array(rgba);
        
        let r = 0, g = 0, b = 0, count = 0;
        // pixelData is typically R G B A
        for (let i = 0; i < pixelData.length; i += 4) {
            r += pixelData[i];
            g += pixelData[i+1];
            b += pixelData[i+2];
            count++;
        }
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
      } catch (e) {
          console.error("PNG Decode failed:", e);
          return null;
      }
  };

  const mockAnalysis = () => {
      setLoading(true);
      setTimeout(() => {
          // Generate a random result for demo
          const phs = [4, 5, 6, 7, 8, 9, 10];
          const mockPh = phs[Math.floor(Math.random() * phs.length)];
          setResult({
              rgb: { r: 100, g: 150, b: 200 }, // Mock color
              ph: mockPh,
              diff: 0.5
          });
          setLoading(false);
      }, 1500);
  };

  const renderPHChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>pH Reference Scale</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
        {REFERENCE_TABLE.map((item) => {
          const isSelected = result && result.ph === item.ph;
          return (
            <View key={item.ph} style={styles.chartItem}>
              <View style={[
                styles.colorBlock, 
                { 
                  backgroundColor: `rgb(${item.r},${item.g},${item.b})`,
                  borderWidth: isSelected ? 3 : 1,
                  borderColor: isSelected ? '#000' : '#e2e8f0',
                  transform: [{ scale: isSelected ? 1.15 : 1 }]
                }
              ]} />
              <Text style={[styles.chartText, isSelected && styles.chartTextSelected]}>
                {item.ph}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const getAdvice = (ph) => {
      if (ph <= 4) return "Very Strong Acid. Most crops will die. Apply agricultural lime immediately.";
      if (ph <= 5.5) return "Acidic Soil. Good for potato, blueberry, sweet potato. Add lime to grow other crops.";
      if (ph >= 6 && ph <= 7.5) return "Neutral/Ideal Soil. Perfect for most crops (Rice, Wheat, Corn, Veggies).";
      if (ph > 7.5 && ph <= 8.5) return "Alkaline Soil. Add gypsum or organic matter. Good for asparagus, beets.";
      if (ph > 8.5) return "Very Strong Alkaline (Sodic). Requires immediate treatment with gypsum + leaching.";
      return "Soil pH is extreme. Consult a soil lab.";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Soil pH Analysis</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!imageUri ? (
            <View style={styles.introContainer}>
                <Ionicons name="scan-outline" size={80} color="#cbd5e1" />
                <Text style={styles.instruction}>
                    1. Place pH strip on white paper {'\n'}
                    2. Ensure natural lighting {'\n'}
                    3. Capture photo & tap color block
                </Text>
                
                <TouchableOpacity style={styles.btnPrimary} onPress={() => pickImage(true)}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.btnText}>Open Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(false)}>
                    <Ionicons name="images-outline" size={24} color="#4f46e5" />
                    <Text style={styles.btnTextSecondary}>Select from Gallery</Text>
                </TouchableOpacity>

                {renderPHChart()}
            </View>
        ) : (
            <View style={styles.analysisContainer}>
                <Text style={styles.hintText}>Step 2: Tap the specific color block on the strip</Text>
                
                <View style={styles.imageWrapper}>
                    <TouchableOpacity activeOpacity={1} onPress={handleImagePress}>
                        <Image 
                            source={{ uri: imageUri }} 
                            style={styles.mainImage} 
                            resizeMode="contain"
                            onLayout={(e) => setImageLayout(e.nativeEvent.layout)}
                        />
                    </TouchableOpacity>
                    {touchCoords && (
                        <View style={[styles.touchMarker, { 
                            left: touchCoords.x - 15, 
                            top: touchCoords.y - 15 
                        }]} />
                    )}
                </View>

                {loading && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={styles.loadingText}>Analyzing Pigments...</Text>
                    </View>
                )}

                {result && !loading && (
                    <View style={styles.resultBox}>
                        <View style={styles.resultRow}>
                            <View style={[styles.colorCircle, { backgroundColor: `rgb(${result.rgb.r},${result.rgb.g},${result.rgb.b})` }]} />
                            <View>
                                <Text style={styles.phLabel}>Detected pH</Text>
                                <Text style={[styles.phNumber, { color: getPhColor(result.ph) }]}>{result.ph}</Text>
                                <Text style={[styles.phColorName, { color: getPhColor(result.ph) }]}>{getPhColorName(result.ph)}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.adviceBox}>
                            <Text style={styles.adviceHeader}>Agricultural Advice</Text>
                            <Text style={styles.adviceText}>{getAdvice(result.ph)}</Text>
                        </View>

                        {renderPHChart()}

                        <TouchableOpacity style={styles.resetBtn} onPress={() => { setImageUri(null); setResult(null); }}>
                            <Text style={styles.resetText}>Analyze New Sample</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
      flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', 
      borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  backButton: { padding: 4, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { flexGrow: 1, padding: 20 },
  introContainer: { alignItems: 'center', marginTop: 40, gap: 20 },
  instruction: { textAlign: 'center', color: '#64748b', lineHeight: 24, fontSize: 16 },
  btnPrimary: { 
      flexDirection: 'row', backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, 
      alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' 
  },
  btnSecondary: { 
      flexDirection: 'row', backgroundColor: '#eef2ff', padding: 16, borderRadius: 12, 
      alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' 
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnTextSecondary: { color: '#4f46e5', fontWeight: '600', fontSize: 16 },
  
  analysisContainer: { gap: 20 },
  hintText: { textAlign: 'center', color: '#64748b', fontWeight: '500' },
  imageWrapper: { 
      height: 400, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative' 
  },
  mainImage: { width: '100%', height: '100%' },
  touchMarker: {
      position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#fff', 
      backgroundColor: 'rgba(255,0,0,0.4)', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.5
  },
  loadingBox: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#4f46e5' },
  
  resultBox: { 
      backgroundColor: '#fff', padding: 20, borderRadius: 16, 
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  colorCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#f1f5f9' },
  phLabel: { fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  phNumber: { fontSize: 36, fontWeight: '800' },
  phColorName: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  adviceBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12 },
  adviceHeader: { fontWeight: '700', color: '#334155', marginBottom: 8 },
  adviceText: { color: '#475569', lineHeight: 22 },
  resetBtn: { marginTop: 20, alignItems: 'center', padding: 12 },
  resetText: { color: '#4f46e5', fontWeight: '600' },

  // Chart Styles
  chartContainer: { marginTop: 30, width: '100%' },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginBottom: 12, marginLeft: 4 },
  chartScroll: { paddingVertical: 10, paddingHorizontal: 4 },
  chartItem: { alignItems: 'center', marginRight: 12, width: 40 },
  colorBlock: { width: 40, height: 40, borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  chartText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  chartTextSelected: { color: '#0f172a', fontWeight: '800', fontSize: 13 }
});

export default PHDetectionScreen;
