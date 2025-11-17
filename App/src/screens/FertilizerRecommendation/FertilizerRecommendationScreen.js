import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../utils/config';

const AppHeader = ({ title, subtitle }) => (
  <View style={styles.header}> 
    <Ionicons name="water" size={32} color="#10b981" />
    <Text style={styles.headerTitle}>{title}</Text>
    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
  </View>
);

const GradientButton = ({ text, onPress, disabled }) => (
  <TouchableOpacity style={[styles.buttonContainer, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled}>
    <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
      <Text style={styles.buttonText}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const FertilizerCard = ({ emoji, name, formula, notes }) => (
  <View style={styles.resultCard}>
    <Text style={styles.resultEmoji}>{emoji}</Text>
    <Text style={styles.resultTitle}>{name}</Text>
    <Text style={styles.resultFormula}>{formula}</Text>
    {notes && <Text style={styles.resultNotes}>{notes}</Text>}
  </View>
);

export default function FertilizerRecommendationScreen() {
  const [n, setN] = useState('');
  const [p, setP] = useState('');
  const [k, setK] = useState('');
  const [crop, setCrop] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const allFilled = n !== '' && p !== '' && k !== '';

  const validateNumbers = () => {
    const numericFields = [n, p, k];
    if (!numericFields.every(v => /^\d*(\.\d+)?$/.test(v))) {
      Alert.alert('Invalid Input', 'Please enter only numeric values for N, P, K.');
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
      const payload = {
        nitrogen: parseFloat(n),
        phosphorus: parseFloat(p),
        potassium: parseFloat(k),
        crop: crop || undefined,
      };
      const response = await fetch(`${API_URL}/fertilizer/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      
      if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setResults(data.recommendations.map(r => ({
          name: r.name,
          formula: `N:${r.n}% P:${r.p}% K:${r.k}%`,
          notes: r.notes,
          emoji: getEmojiForFertilizer(r.name),
        })));
      } else {
        setResults(getFallbackRecommendations());
      }
    } catch (err) {
      console.warn('Fertilizer recommendation error:', err.message);
      setError(err.message);
      setResults(getFallbackRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForFertilizer = (name) => {
    const map = {
      'Urea': '💧',
      'DAP': '🌱',
      'MOP': '🍃',
      'NPK': '⚗️',
      'SSP': '🪨',
    };
    return map[name] || '🧪';
  };

  const getFallbackRecommendations = () => {
    return [
      { name: 'Urea', formula: 'N:46% P:0% K:0%', notes: 'High nitrogen source', emoji: '💧' },
      { name: 'DAP', formula: 'N:18% P:46% K:0%', notes: 'Nitrogen & phosphorus', emoji: '🌱' },
      { name: 'MOP', formula: 'N:0% P:0% K:60%', notes: 'Potassium source', emoji: '🍃' },
    ];
  };

  return (
    <LinearGradient colors={["#0f172a", "#111827"]} style={styles.bgGradient}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Fertilizer Recommendation" subtitle="Enter soil nutrient levels (N • P • K)" />

        <View style={styles.commonBox}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Nutrient Levels</Text>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Nitrogen (N) - ppm</Text>
              <TextInput value={n} onChangeText={setN} placeholder="e.g. 60" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
            </View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Phosphorus (P) - ppm</Text>
              <TextInput value={p} onChangeText={setP} placeholder="e.g. 30" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
            </View>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Potassium (K) - ppm</Text>
              <TextInput value={k} onChangeText={setK} placeholder="e.g. 50" keyboardType="numeric" style={styles.input} placeholderTextColor="#cbd5e1" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crop (Optional)</Text>
            <View style={styles.inputGroupFull}>
              <Text style={styles.inputLabel}>Crop Name</Text>
              <TextInput value={crop} onChangeText={setCrop} placeholder="e.g. wheat, rice" style={styles.input} placeholderTextColor="#cbd5e1" />
            </View>
          </View>
        </View>

        <GradientButton text={loading ? 'Analyzing...' : 'Get Recommendations'} onPress={fetchRecommendations} disabled={!allFilled || loading} />
        {!allFilled && <Text style={styles.hint}>Fill N, P, K fields to enable recommendations.</Text>}

        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Suggested Fertilizers</Text>
          {loading && (
            <View style={styles.loadingBlock}> 
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Computing optimal fertilizers...</Text>
            </View>
          )}
          {error && !loading && <Text style={styles.errorText}>Backend error: {error}. Showing fallback suggestions.</Text>}
          {!loading && results.length === 0 && <Text style={styles.emptyText}>No recommendations yet. Enter values and tap the button.</Text>}
          {!loading && results.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {results.map((r, idx) => (
                <FertilizerCard key={idx} emoji={r.emoji} name={r.name} formula={r.formula} notes={r.notes} />
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
    width:180,
    height:180,
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
  resultEmoji: { fontSize:42, marginBottom:8 },
  resultTitle: { fontSize:16, fontWeight:'700', color:'#e5e7eb' },
  resultFormula: { marginTop:4, fontSize:13, fontWeight:'600', color:'#10b981' },
  resultNotes: { marginTop:6, fontSize:11, color:'#cbd5e1', lineHeight:16 },
});
