import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const PRIMARY = "#1e40af";
const BG = "#f8fafc";

const cards = [
  { key: "crop", title: "Crops", icon: "sprout", color: "#059669", tint: "#ecfdf5", route: "CropInfo" },
  { key: "weed", title: "Weeds", icon: "leaf", color: "#d97706", tint: "#fffbeb", route: "WeedInfo" },
  { key: "pest", title: "Pests", icon: "bug", color: "#dc2626", tint: "#fef2f2", route: "PestInfo" },
  { key: "disease", title: "Plant Disease", icon: "virus", color: "#7c3aed", tint: "#f5f3ff", route: "DiseaseInfo" },
];

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; 

const KnowledgeHub = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Simple Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Knowledge Hub</Text>
            <Text style={styles.subtitle}>Select a category</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={22} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Grid Layout */}
        <View style={styles.grid}>
          {cards.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={styles.card}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconWrap, { backgroundColor: item.tint }]}>
                <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
              </View>
              
              <Text style={styles.cardTitle}>{item.title}</Text>
              
              <View style={styles.actionBadge}>
                <Text style={styles.actionText}>Explore</Text>
                <Ionicons name="chevron-forward" size={12} color={PRIMARY} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", fontWeight: "500" },
  searchBtn: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  grid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    // Premium Shadow
    shadowColor: "#1e293b",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center"
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionText: { 
    color: PRIMARY, 
    fontSize: 11, 
    fontWeight: "800", 
    marginRight: 4,
    textTransform: "uppercase" 
  },
});

export default KnowledgeHub;