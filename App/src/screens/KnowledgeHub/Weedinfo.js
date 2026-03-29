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
import weedData from "../../../dataset/weed.json";

const GREEN = "#2317c7ff";
const BG = "#e9eef6ff";

const ALL_PLANTS = Array.isArray(weedData?.plant) ? weedData.plant : [];

const ALL_WEEDS = ALL_PLANTS.flatMap((plant) => {
  const list = [];

  const containers = [];
  if (plant.weed_categories) containers.push(plant.weed_categories);
  if (plant.major_weeds) containers.push(plant.major_weeds);

  containers.forEach((groupObj) => {
    Object.keys(groupObj || {}).forEach((groupKey) => {
      const arr = groupObj[groupKey];
      if (!Array.isArray(arr)) return;
      arr.forEach((w) => {
        list.push({
          ...w,
          crop: plant.crop,
          groupKey,
          management: plant.weed_management_practices || null,
        });
      });
    });
  });

  return list;
});

const WEED_OPTIONS = ALL_WEEDS.map((w) => ({
  key: `${w.crop}: ${w.common_name || w.scientific_name}`,
  label: `${w.common_name || w.scientific_name} (${w.crop})`,
}));

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

const typeFromGroup = (groupKey) => {
  const g = (groupKey || "").toLowerCase();
  if (g.includes("grass")) return "Grasses";
  if (g.includes("broad")) return "Broadleaf Weeds";
  if (g.includes("sedge")) return "Sedges";
  return "Weed";
};

export default function WeedInfo() {
  const [selectedKey, setSelectedKey] = useState(WEED_OPTIONS[0]?.key || "");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const selectedWeed = useMemo(
    () => ALL_WEEDS.find((w) => `${w.crop}: ${w.common_name || w.scientific_name}` === selectedKey),
    [selectedKey]
  );

  const weedLabel = selectedWeed
    ? `${selectedWeed.common_name || selectedWeed.scientific_name} (${selectedWeed.crop})`
    : "";

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return WEED_OPTIONS.filter((w) => w.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const pickWeed = (name) => {
    const match = WEED_OPTIONS.find((w) => w.label === name || w.key === name);
    if (match) setSelectedKey(match.key);
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
                  <Pressable
                    key={w.key}
                    style={styles.suggestionRow}
                    onPress={() => pickWeed(w.label)}
                  >
                    <MaterialCommunityIcons name="leaf" size={16} color={GREEN} />
                    <Text style={styles.suggestionText}>{w.label}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          <Text style={styles.selectedText}>Showing: {weedLabel || "No weed selected"}</Text>
        </View>

        {/* Weed overview from dataset */}
        <View style={styles.section}>
          <View style={styles.stageHeader}>
            <View style={styles.stageBadge}>
              <MaterialCommunityIcons name="leaf" size={16} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Weed Overview</Text>
          </View>

          {selectedWeed ? (
            <>
              <Text style={styles.infoTitle}>{selectedWeed.common_name || selectedWeed.scientific_name}</Text>
              {selectedWeed.scientific_name && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Scientific name: </Text>
                  {selectedWeed.scientific_name}
                </Text>
              )}
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Crop: </Text>
                {selectedWeed.crop}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Type: </Text>
                {typeFromGroup(selectedWeed.groupKey)}
              </Text>
              {selectedWeed.family && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Family: </Text>
                  {selectedWeed.family}
                </Text>
              )}
              {selectedWeed.impact && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Impact: </Text>
                  {selectedWeed.impact}
                </Text>
              )}

              {selectedWeed.identification && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.infoLabel}>Identification</Text>
                  {Object.entries(selectedWeed.identification).map(([k, v]) => (
                    <Text key={k} style={styles.infoLine}>
                      <Text style={styles.infoLabel}>{formatIdKey(k)}: </Text>
                      {v}
                    </Text>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.suggestionEmpty}>No data available for this weed.</Text>
          )}
        </View>

        {/* Weed management practices (crop-level) */}
        {selectedWeed?.management && (
          <View style={styles.section}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <MaterialCommunityIcons name="sprout" size={16} color="#f59e0b" />
              </View>
              <Text style={styles.sectionTitle}>Weed Management</Text>
            </View>

            <FlatList
              data={buildWeedManagementItems(selectedWeed.management)}
              keyExtractor={(item, index) => `${selectedWeed.crop}-${item.type}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Image
                    source={{ uri: img(`${selectedWeed.crop}-${item.type}`) }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardType}>{item.type}</Text>
                    <Text numberOfLines={3} style={styles.cardDescription}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}
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
  infoLine: { color: "#1f2933", marginTop: 4 },
  infoLabel: { fontWeight: "700", color: "#111827" },

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
  cardDescription: { fontSize: 12, color: "#475569", marginTop: 4 },
});

function formatIdKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildWeedManagementItems(management) {
  const items = [];

  const pushList = (list, typeLabel) => {
    if (!Array.isArray(list)) return;
    list.forEach((text) => {
      items.push({ type: typeLabel, text });
    });
  };

  // Rice structure
  pushList(management.pre_emergence, "Pre-emergence");
  pushList(management.post_emergence, "Post-emergence");
  pushList(management.mechanical_and_manual, "Mechanical/Manual");

  // Wheat/Maize structure
  if (management.cultural_methods || management.mechanical_methods || management.chemical_methods) {
    pushList(management.cultural_methods, "Cultural");
    pushList(management.mechanical_methods, "Mechanical");
    if (management.chemical_methods) {
      pushList(management.chemical_methods.pre_emergence, "Pre-emergence");
      pushList(management.chemical_methods.post_emergence, "Post-emergence");
      pushList(management.chemical_methods.efficiency_booster, "Additive");
    }
  }

  return items.slice(0, 12);
}