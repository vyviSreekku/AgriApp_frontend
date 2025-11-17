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

const CATEGORIES = [
  { key: "Grasses", icon: "sprout", color: "#16a34a" },
  { key: "Sedges", icon: "leaf", color: "#06b6d4" },
  { key: "Broadleaf Weeds", icon: "leaf", color: "#f59e0b" },
  { key: "Aquatic/Marsh", icon: "water", color: "#6366f1" },
];

const WEEDS = [
  "Amaranthus (Pigweed)",
  "Parthenium (Congress grass)",
  "Cyperus rotundus (Nutgrass)",
  "Echinochloa crus-galli (Barnyard grass)",
  "Cynodon dactylon (Bermuda grass)",
  "Phalaris minor (Canary grass)",
  "Chenopodium album (Lambsquarters)",
  "Digitaria sanguinalis (Crabgrass)",
  "Convolvulus arvensis (Field Bindweed)",
  "Imperata cylindrica (Cogon grass)",
  "Eichhornia crassipes (Water Hyacinth)",
];

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

const categoryFor = (name) => {
  const n = name.toLowerCase();
  if (n.includes("eichhornia") || n.includes("water") || n.includes("hyacinth")) return "Aquatic/Marsh";
  if (n.includes("cyperus") || n.includes("sedge") || n.includes("nutgrass")) return "Sedges";
  if (
    n.includes("grass") ||
    n.includes("echinochloa") ||
    n.includes("cynodon") ||
    n.includes("phalaris") ||
    n.includes("imperata") ||
    n.includes("digitaria")
  ) return "Grasses";
  return "Broadleaf Weeds";
};

export default function WeedInfo() {
  const [selectedWeed, setSelectedWeed] = useState("Amaranthus (Pigweed)");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return WEEDS.filter((w) => w.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const pickWeed = (name) => {
    const match = WEEDS.find((w) => w.toLowerCase() === name.toLowerCase());
    if (match) setSelectedWeed(match);
    setQuery("");
    setFocused(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: "#dcfce7" }]}>
            <MaterialCommunityIcons name="leaf" size={28} color="#22c55e" />
          </View>
          <Text style={styles.title}>Weed Information</Text>
          <Text style={styles.subtitle}>Search a weed to view quick references.</Text>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Weed</Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search weed (e.g., Barnyard grass)"
              returnKeyType="search"
              onFocus={() => setFocused(true)}
              onSubmitEditing={() => query && pickWeed(query)}
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
                suggestions.map((w) => (
                  <Pressable key={w} style={styles.suggestionRow} onPress={() => pickWeed(w)}>
                    <MaterialCommunityIcons name="leaf" size={16} color={GREEN} />
                    <Text style={styles.suggestionText}>{w}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          <Text style={styles.selectedText}>Showing: {selectedWeed}</Text>
        </View>

        {/* Categories with horizontal cards (placeholder content) */}
        {CATEGORIES.map((cat) => {
          const items = [0, 1, 2].map((i) => ({
            id: `${selectedWeed}-${cat.key}-${i}`,
            type: categoryFor(selectedWeed),
            title: `${selectedWeed} - ${cat.key} ${i + 1}`,
            image: img(`${selectedWeed}-${cat.key}-${i}`),
          }));

          return (
            <View key={cat.key} style={styles.section}>
              <View style={styles.stageHeader}>
                <View style={styles.stageBadge}>
                  <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} />
                </View>
                <Text style={styles.sectionTitle}>{cat.key}</Text>
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

  // Category header
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