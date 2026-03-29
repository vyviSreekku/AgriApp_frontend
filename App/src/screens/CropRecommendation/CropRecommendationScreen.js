import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getApiUrl } from '../../utils/config';

// Simple reusable sub components (trimmed from provided example code)
const AppHeader = ({ title, subtitle }) => (
  <View style={styles.header}> 
    <Ionicons name="leaf" size={32} color="#4f46e5" />
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
  </View>
);

const GradientButton = ({ text, onPress, disabled }) => (
  <TouchableOpacity style={[styles.buttonContainer, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled}>
    <LinearGradient colors={['#4f46e5', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
      <Text style={styles.buttonText}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const HorizontalCard = ({ emoji, title, tag }) => (
  <View style={styles.resultCard}>
    <Text style={styles.resultEmoji}>{emoji}</Text>
    <Text style={styles.resultTitle}>{title}</Text>
    {tag && <Text style={styles.resultTag}>{tag}</Text>}
  </View>
);

export default function CropRecommendationScreen() {
  const [n, setN] = useState('');
  const [p, setP] = useState('');
  const [k, setK] = useState('');
  const [ph, setPh] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const allFilled = n !== '' && p !== '' && k !== '' && ph !== '';

  const validateNumbers = () => {
    const numericFields = [n, p, k, ph];
    if (!numericFields.every(v => /^\d*(\.\d+)?$/.test(v))) {
      Alert.alert('Invalid Input', 'Please enter only numeric values for N, P, K and pH.');
      return false;
    }
    // Basic plausible range checks (can be adjusted)
    const phValue = parseFloat(ph);
    if (phValue < 0 || phValue > 14) {
      Alert.alert('pH Out of Range', 'pH should be between 0 and 14.');
      return false;
    }
    return true;
  };

  const fetchRecommendations = async () => {
    if (!validateNumbers()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // Attempt backend call; fallback to static recommendations if it fails
      // Backend expects: nitrogen, phosphorus, potassium, soil_ph
      const payload = {
        nitrogen: parseFloat(n),
        phosphorus: parseFloat(p),
        potassium: parseFloat(k),
        soil_ph: parseFloat(ph),
      };
      const baseUrl = await getApiUrl();
      const response = await fetch(`${baseUrl}/crops/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      // Prefer array shape if provided; otherwise adapt single recommended_crop
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setResults(data.recommendations);
      } else if (typeof data.recommended_crop === 'string' && data.recommended_crop.length > 0) {
        setResults([{ name: data.recommended_crop, tag: 'Backend Suggestion', emoji: '🌾' }]);
      } else {
        setResults(getFallbackRecommendations({ n: parseFloat(n), p: parseFloat(p), k: parseFloat(k), ph: parseFloat(ph) }));
      }
    } catch (err) {
      console.warn('Crop recommendation error:', err.message);
      setError(err.message);
      setResults(getFallbackRecommendations({ n: parseFloat(n), p: parseFloat(p), k: parseFloat(k), ph: parseFloat(ph) }));
    } finally {
      setLoading(false);
    }
  };

  const getFallbackRecommendations = ({ n, p, k, ph }) => {
    // Naive logic for illustration; replace with real agronomic model later
    const recs = [];
    if (ph >= 6 && ph <= 7.5 && n > 50) recs.push({ name: 'Wheat', tag: 'Neutral Soil', emoji: '🌾' });
    if (ph >= 5.5 && ph <= 6.5 && k > 40) recs.push({ name: 'Potato', tag: 'High K Need', emoji: '🥔' });
    if (ph >= 6 && ph <= 7 && p > 30) recs.push({ name: 'Maize', tag: 'Balanced Nutrients', emoji: '🌽' });
    if (ph >= 6.2 && ph <= 7.8 && n > 60 && k > 50) recs.push({ name: 'Rice', tag: 'High Yield', emoji: '🍚' });
    if (recs.length === 0) recs.push({ name: 'Millet', tag: 'Resilient', emoji: '🍘' });
    return recs;
  };

  return (
    <LinearGradient colors={["#0f172a", "#111827"]} style={styles.bgGradient}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Crop Recommendation" subtitle="Enter soil nutrients & pH" />

      {/* Common Box for Inputs */}
      <View style={styles.commonBox}>
        {/* NPK Inputs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrient Levels (N • P • K)</Text>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>Nitrogen (N)</Text>
            <TextInput value={n} onChangeText={setN} placeholder="e.g. 60" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
          </View>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>Phosphorus (P)</Text>
            <TextInput value={p} onChangeText={setP} placeholder="e.g. 30" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
          </View>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>Potassium (K)</Text>
            <TextInput value={k} onChangeText={setK} placeholder="e.g. 50" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
          </View>
        </View>

        {/* pH Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soil Acidity (pH)</Text>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>pH Value</Text>
            <TextInput value={ph} onChangeText={setPh} placeholder="e.g. 6.5" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
          </View>
        </View>
      </View>

      {/* Button Outside */}
      <GradientButton text={loading ? 'Analyzing...' : 'Get Recommendations'} onPress={fetchRecommendations} disabled={!allFilled || loading} />
      {!allFilled && <Text style={styles.hint}>Fill all fields to enable recommendations.</Text>}

      <View style={styles.resultsSection}>
        <Text style={styles.resultsTitle}>Suggested Crops</Text>
        {loading && (
          <View style={styles.loadingBlock}> 
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Computing optimal crops...</Text>
          </View>
        )}
        {error && !loading && <Text style={styles.errorText}>Backend error: {error}. Showing fallback suggestions.</Text>}
        {!loading && results.length === 0 && <Text style={styles.emptyText}>No recommendations yet. Enter values and tap the button.</Text>}
        {!loading && results.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {results.map((r, idx) => (
              <HorizontalCard key={idx} emoji={r.emoji} title={r.name} tag={r.tag} />
            ))}
          </ScrollView>
        )}
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bgGradient: { flex: 1 },
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginTop: 8, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  commonBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 18,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width:0, height:6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0', marginBottom: 14 },
  inputGroupFull: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#cbd5e1', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  buttonContainer: { marginTop: 20, borderRadius: 14, overflow:'hidden', elevation:5 },
  gradientButton: { paddingVertical: 14, alignItems:'center' },
  buttonText: { fontSize:16, fontWeight:'700', color:'#fff', letterSpacing:0.5 },
  hint: { marginTop: 8, fontSize:12, color:'#cbd5e1', textAlign: 'center' },
  resultsSection: { marginTop: 30 },
  resultsTitle: { fontSize:18, fontWeight:'800', color:'#ffffff', marginBottom:8 },
  loadingBlock: {
    backgroundColor:'rgba(255,255,255,0.12)',
    borderRadius:20,
    padding:20,
    alignItems:'center',
    shadowColor:'#000',
    shadowOffset:{width:0,height:6},
    shadowOpacity:0.25,
    shadowRadius:12,
    elevation:4,
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)'
  },
  loadingText: { marginTop:10, fontSize:13, color:'#e2e8f0' },
  errorText: { marginTop:10, fontSize:12, color:'#fecaca' },
  emptyText: { fontSize:13, color:'#cbd5e1', marginTop:4 },
  resultCard: {
    width:160,
    height:160,
    backgroundColor:'rgba(255,255,255,0.12)',
    borderRadius:18,
    marginRight:16,
    padding:16,
    justifyContent:'flex-start',
    alignItems:'flex-start',
    shadowColor:'#000',
    shadowOffset:{width:0,height:6},
    shadowOpacity:0.25,
    shadowRadius:10,
    elevation:3,
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)'
  },
  resultEmoji: { fontSize:42, marginBottom:6 },
  resultTitle: { fontSize:16, fontWeight:'700', color:'#e5e7eb' },
  resultTag: { marginTop:4, fontSize:12, fontWeight:'600', color:'#93c5fd' },
});
