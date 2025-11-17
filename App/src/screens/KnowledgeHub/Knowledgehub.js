import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const GREEN = "#191fc3ff";
const BG = "#e2ebf9ff";

const cards = [
  { key: "crop", title: "Crop Inforrmation", desc: "Learn about different crops, growing techniques, and best practices", icon: { name: "sprout", color: "#22c55e", tint: "#dcfce7" }, route: "CropInfo" },
  { key: "weed", title: "Weed Information", desc: "Identify and manage weeds effectively in your fields", icon: { name: "leaf", color: "#f59e0b", tint: "#fef3c7" }, route: "WeedInfo" },
  { key: "pest", title: "Pest Infornation", desc: "Recognize pests and learn control methods to protect your crops", icon: { name: "ladybug", color: "#ef4444", tint: "#fee2e2" }, route: "PestInfo" },
];

const { width } = Dimensions.get("window");
const H_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2; // 2 columns on phones

const toRows = (arr, size = 2) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const KnowledgeHub = ({ navigation }) => {
  const rows = toRows(cards, 2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>KNOWLEDGE HUB</Text>
          <Text style={styles.subtitle}>
            Your comprehensive resource for agricultural information. Explore our library of crop, weed, and pest information.
          </Text>
        </View>

        <View style={styles.grid}>
          {rows.map((row, idx) => (
            <View
              key={idx}
              style={[styles.row, row.length === 1 && styles.rowCenter]}
            >
              {row.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  activeOpacity={0.9}
                  style={styles.card}
                  onPress={() => {
                    if (c.route) navigation.navigate(c.route);
                    else navigation.navigate("KnowledgeCategory", { type: c.key });
                  }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: c.icon.tint }]}>
                    <MaterialCommunityIcons name={c.icon.name} size={28} color={c.icon.color} />
                  </View>

                  <Text style={styles.cardTitle}>{c.title}</Text>
                  <Text style={styles.cardDesc}>{c.desc}</Text>

                  <View style={{ flex: 1 }} />
                  <View style={styles.ctaRow}>
                    <Text style={styles.ctaText}>Learn More</Text>
                    <Ionicons name="chevron-forward" size={16} color={GREEN} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  hero: { paddingHorizontal: H_PADDING, paddingTop: 12, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800", color: GREEN, marginTop: 8 },
  subtitle: { color: "#475569", textAlign: "center", marginTop: 8, lineHeight: 20 },

  // grid now just wraps rows
  grid: {
    paddingHorizontal: H_PADDING,
    marginTop: 40,
  },

  // each row holds up to 2 cards; last row centered if only 1 card
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  rowCenter: {
    justifyContent: "center",
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardDesc: { fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 18 },
  ctaRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  ctaText: { color: GREEN, fontWeight: "700", marginRight: 4 },
});

export default KnowledgeHub;