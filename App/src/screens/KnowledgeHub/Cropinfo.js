import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const GREEN = "#2317c7ff";
const BG = "#e9eef6ff";

const STAGES = [
  { key: "Seedling", icon: "sprout", color: "#15bc5dff" },
  { key: "Vegetative", icon: "leaf", color: "#10b981" },
  { key: "Flowering", icon: "flower-outline", color: "#f59e0b" },
  { key: "Maturity", icon: "corn", color: "#f97316" },
];

const CROPS = ["Millet", "Maize", "Wheat", "Rice", "Cotton", "Sorghum", "Soybean"];

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

export default function CropInfo() {
  const [selectedCrop, setSelectedCrop] = useState("Millet");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CROPS.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const pickCrop = (name) => {
    const match = CROPS.find((c) => c.toLowerCase() === name.toLowerCase());
    if (match) setSelectedCrop(match);
    setQuery("");
    setFocused(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: "#dcfce7" }]}>
            <MaterialCommunityIcons name="sprout" size={28} color="#22c55e" />
          </View>
          <Text style={styles.title}>Crop Information</Text>
          <Text style={styles.subtitle}>Search a crop to view its stages.</Text>
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
                <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          {focused && query.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.length === 0 ? (
                <Text style={styles.suggestionEmpty}>No matches</Text>
              ) : (
                suggestions.map((c) => (
                  <Pressable key={c} style={styles.suggestionRow} onPress={() => pickCrop(c)}>
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

          <Text style={styles.selectedText}>Showing: {selectedCrop}</Text>
        </View>

        {/* Stages with horizontal cards (placeholder content) */}
        {STAGES.map((stage) => {
          const items = [0, 1, 2].map((i) => ({
            id: `${selectedCrop}-${stage.key}-${i}`,
            type: "Type",
            title: `${selectedCrop} - ${stage.key} Issue ${i + 1}`,
            image: img(`${selectedCrop}-${stage.key}-${i}`),
          }));

          return (
            <View key={stage.key} style={styles.section}>
              <View style={styles.stageHeader}>
                <View style={styles.stageBadge}>
                  <MaterialCommunityIcons name={stage.icon} size={16} color={stage.color} />
                </View>
                <Text style={styles.sectionTitle}>{stage.key} Stage</Text>
              </View>

              <FlatList
                data={items}
                keyExtractor={(it) => it.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Image source={{ uri: item.image }} style={styles.cardImage} />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardType}>{item.type}</Text>
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </View>
          );
        })}
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

  // Cards
  card: {
    width: 180,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 110 },
  cardBody: { padding: 10 },
  cardType: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
});