import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import cropData from "../../../dataset/crop.json";
import { getCropImage } from "../../utils/LocalImages";
import KnowledgeHubDetailView from "./KnowledgeHubDetails";

const GREEN = "#2317c7ff";
const BG = "#e9eef6ff";

const ALL_CROPS = Array.isArray(cropData?.crops) ? cropData.crops : [];
const CROP_NAMES = ALL_CROPS.map((c) => c.crop_name);
const DATASET_META = cropData || {};
const DISEASE_BREAKDOWN = DATASET_META.disease_breakdown || {};

export default function CropInfo() {
  const [selectedCropName, setSelectedCropName] = useState(
    CROP_NAMES[0] || "Tomato"
  );
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CROP_NAMES.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const selectedCrop = useMemo(
    () => ALL_CROPS.find((c) => c.crop_name === selectedCropName),
    [selectedCropName]
  );

  const cropImage = useMemo(
    () => getCropImage(selectedCrop?.crop_name),
    [selectedCrop?.crop_name]
  );

  const pickCrop = (name) => {
    const match = CROP_NAMES.find((c) => c.toLowerCase() === name.toLowerCase());
    if (match) setSelectedCropName(match);
    setQuery("");
    setFocused(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: "#dcfce7" }]}> 
            <MaterialCommunityIcons name="sprout" size={28} color="#22c55e" />
          </View>
          <Text style={styles.title}>Crop Information</Text>
          <Text style={styles.subtitle}>
            From the PlantVillage dataset ({DATASET_META.total_crops} crops,{' '}
            {DATASET_META.total_classes} classes, {DATASET_META.total_images} images).
          </Text>
        </View>

        {/* Dataset snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dataset Overview</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="sprout" size={18} color={GREEN} />
              <Text style={styles.metricLabel}>Crops</Text>
              <Text style={styles.metricValue}>{DATASET_META.total_crops}</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="layers" size={18} color="#0ea5e9" />
              <Text style={styles.metricLabel}>Classes</Text>
              <Text style={styles.metricValue}>{DATASET_META.total_classes}</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons
                name="image-multiple"
                size={18}
                color="#f97316"
              />
              <Text style={styles.metricLabel}>Images</Text>
              <Text style={styles.metricValue}>{DATASET_META.total_images}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {Object.entries(DISEASE_BREAKDOWN).map(([key, val]) => (
              <View key={key} style={styles.badgeChip}>
                <Text style={styles.badgeText}>
                  {key.replace(/_/g, " ")}: {val}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Crop</Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search crop name (e.g., Millet)"
              returnKeyType="search"
              onFocus={() => setFocused(true)}
              onSubmitEditing={() => query && pickCrop(query)}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>
            )}
          </View>

          {focused && query.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.length === 0 ? (
                <Text style={styles.suggestionEmpty}>No matches</Text>
              ) : (
                suggestions.map((c) => (
                  <Pressable
                    key={c}
                    style={styles.suggestionRow}
                    onPress={() => pickCrop(c)}
                  >
                    <MaterialCommunityIcons
                      name={c === "Maize" ? "corn" : "sprout"}
                      size={16}
                      color={GREEN}
                    />
                    <Text style={styles.suggestionText}>{c}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          <Text style={styles.selectedText}>Showing: {selectedCropName}</Text>
        </View>

        {/* Crop overview from dataset using shared Knowledge Hub renderer */}
        <View style={styles.section}>
          <View style={styles.stageHeader}>
            <View style={styles.stageBadge}>
              <MaterialCommunityIcons name="sprout" size={16} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Crop Overview</Text>
          </View>

          {selectedCrop ? (
            <>
              {cropImage && (
                <Image
                  source={cropImage}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.infoTitle}>{selectedCrop.crop_name}</Text>
              <KnowledgeHubDetailView
                category="plants"
                item={{
                  ...selectedCrop,
                  name: selectedCrop.crop_name,
                  color: GREEN,
                }}
              />
            </>
          ) : (
            <Text style={styles.suggestionEmpty}>No data available for this crop.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  hero: { alignItems: "center" },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: GREEN, marginTop: 8 },
  subtitle: { color: "#475569", textAlign: "center", marginTop: 8, lineHeight: 20 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },

  // Search
  searchRow: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 0, color: "#0f172a" },
  suggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  suggestionText: { marginLeft: 8, color: "#0f172a" },
  suggestionEmpty: { padding: 12, color: "#64748b" },
  selectedText: { marginTop: 10, color: "#475569" },

  infoTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 8 },

  // Stage header
  stageHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stageBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
  },

  metricRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginTop: 12,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  metricLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },
  metricValue: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginTop: 2 },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  badgeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eff6ff",
  },
  badgeText: { fontSize: 11, color: "#1d4ed8" },
});
