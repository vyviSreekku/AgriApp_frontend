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
import { getLocalImage } from "../../utils/LocalImages";
import pestData from "../../../dataset/pest.json";

const GREEN = "#2317c7ff";
const BG = "#e9eef6ff";

const ALL_PLANTS = Array.isArray(pestData?.plants) ? pestData.plants : [];
const ALL_PESTS = ALL_PLANTS.flatMap((plant) =>
  Array.isArray(plant.pests)
    ? plant.pests.map((p) => ({
        ...p,
        crop: plant.plant_name,
      }))
    : []
);

const PEST_OPTIONS = ALL_PESTS.map((p) => ({
  key: `${p.crop}: ${p.pest_name}`,
  label: `${p.pest_name} (${p.crop})`,
}));

const img = (seed) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;

export default function PestInfo() {
  const [selectedKey, setSelectedKey] = useState(PEST_OPTIONS[0]?.key || "");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const selectedPest = useMemo(
    () => ALL_PESTS.find((p) => `${p.crop}: ${p.pest_name}` === selectedKey),
    [selectedKey]
  );

  const pestLabel = selectedPest
    ? `${selectedPest.pest_name} (${selectedPest.crop})`
    : "";

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PEST_OPTIONS.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const localImage = useMemo(
    () =>
      selectedPest?.pest_name
        ? getLocalImage("pests", "", selectedPest.pest_name)
        : null,
    [selectedPest]
  );

  const pickPest = (name) => {
    const match = PEST_OPTIONS.find((p) => p.label === name || p.key === name);
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
            <MaterialCommunityIcons name="ladybug" size={28} color="#22c55e" />
          </View>
          <Text style={styles.title}>Pest Information</Text>
          <Text style={styles.subtitle}>Search a pest to view quick references.</Text>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Pest</Text>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search pest (e.g., Yellow stem borer)"
              returnKeyType="search"
              onFocus={() => setFocused(true)}
              onSubmitEditing={() => query && pickPest(query)}
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
                suggestions.map((p) => (
                  <Pressable
                    key={p.key}
                    style={styles.suggestionRow}
                    onPress={() => pickPest(p.label)}
                  >
                    <MaterialCommunityIcons
                      name={p.label.toLowerCase().includes("mite") ? "spider" : "bug-outline"}
                      size={16}
                      color={GREEN}
                    />
                    <Text style={styles.suggestionText}>{p.label}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          <Text style={styles.selectedText}>Showing: {pestLabel || "No pest selected"}</Text>
        </View>

        {/* Pest overview from dataset */}
        <View style={styles.section}>
          <View style={styles.stageHeader}>
            <View style={styles.stageBadge}>
              <MaterialCommunityIcons name="ladybug" size={16} color="#22c55e" />
            </View>
            <Text style={styles.sectionTitle}>Pest Overview</Text>
          </View>

          {selectedPest ? (
            <>
              <Text style={styles.infoTitle}>{selectedPest.pest_name}</Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Crop: </Text>
                {selectedPest.crop}
              </Text>
              {selectedPest.scientific_name && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Scientific name: </Text>
                  {selectedPest.scientific_name}
                </Text>
              )}
              {selectedPest.pest_type && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Type: </Text>
                  {selectedPest.pest_type}
                </Text>
              )}
              {Array.isArray(selectedPest.symptoms) && selectedPest.symptoms.length > 0 && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Key symptom: </Text>
                  {selectedPest.symptoms[0]}
                </Text>
              )}
              {selectedPest.impact_on_crop && (
                <Text style={styles.infoLine}>
                  <Text style={styles.infoLabel}>Impact: </Text>
                  {selectedPest.impact_on_crop}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.suggestionEmpty}>No data available for this pest.</Text>
          )}
        </View>

        {/* Control measures from dataset */}
        {selectedPest?.treatment_after_attack && (
          <View style={styles.section}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <MaterialCommunityIcons name="spray" size={16} color="#f97316" />
              </View>
              <Text style={styles.sectionTitle}>Key Control Measures</Text>
            </View>

            <FlatList
              data={buildControlItems(selectedPest.treatment_after_attack)}
              keyExtractor={(item, index) => `${selectedPest.pest_name}-${item.type}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Image
                    source={localImage || { uri: img(`${selectedPest.pest_name}-${item.title}`) }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardType}>{item.type}</Text>
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {item.title}
                    </Text>
                    {item.details ? (
                      <Text numberOfLines={3} style={styles.cardDescription}>
                        {item.details}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Preventive measures from dataset */}
        {selectedPest?.preventive_measures && (
          <View style={styles.section}>
            <View style={styles.stageHeader}>
              <View style={styles.stageBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#6366f1" />
              </View>
              <Text style={styles.sectionTitle}>Preventive Measures</Text>
            </View>

            {renderPreventiveMeasures(selectedPest.preventive_measures)}
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

function buildControlItems(treatment) {
  const items = [];

  if (Array.isArray(treatment.chemical_control)) {
    treatment.chemical_control.forEach((c) => {
      items.push({
        type: "Chemical",
        title: c.pesticide_name,
        details: [c.dosage, c.application_method].filter(Boolean).join(" · "),
      });
    });
  }

  if (Array.isArray(treatment.biological_control)) {
    treatment.biological_control.forEach((b) => {
      items.push({
        type: "Biological",
        title: b.method,
        details: b.details || "",
      });
    });
  }

  if (Array.isArray(treatment.organic_control)) {
    treatment.organic_control.forEach((o) => {
      items.push({
        type: "Organic",
        title: o.method,
        details: o.details || "",
      });
    });
  }

  return items.slice(0, 12);
}

function renderPreventiveMeasures(preventive) {
  const sections = [];

  const pushList = (list, title, icon, color) => {
    if (!Array.isArray(list) || list.length === 0) return;
    sections.push(
      <View key={title} style={{ marginBottom: 10 }}>
        <Text style={[styles.cardType, { color }]}>{title}</Text>
        {list.map((text, idx) => (
          <View key={idx} style={styles.suggestionRow}>
            <MaterialCommunityIcons name={icon} size={16} color={color} />
            <Text style={styles.suggestionText}>{text}</Text>
          </View>
        ))}
      </View>
    );
  };

  pushList(preventive.cultural_practices, "Cultural practices", "sprout", "#16a34a");
  pushList(preventive.physical_measures, "Physical measures", "cog", "#0ea5e9");
  pushList(preventive.mechanical_measures, "Mechanical measures", "hammer-wrench", "#f97316");
  pushList(preventive.preventive_sprays, "Preventive sprays", "spray", "#6366f1");

  if (preventive.resistant_varieties) {
    sections.push(
      <View key="resistant-varieties" style={{ marginTop: 8 }}>
        <Text style={[styles.cardType, { color: "#166534" }]}>Resistant varieties</Text>
        <Text style={styles.cardDescription}>{preventive.resistant_varieties}</Text>
      </View>
    );
  }

  return sections.length > 0 ? sections : (
    <Text style={styles.suggestionEmpty}>No detailed preventive measures available.</Text>
  );
}