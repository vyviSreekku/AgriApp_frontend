import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import pestData from "../../../dataset/pest.json";
import diseaseData from "../../../dataset/village_plant_disease_dataset.json";
import weedData from "../../../dataset/weed.json";
import KnowledgeHubDetailView from "./KnowledgeHubDetails";
import { getPlantDiseaseImage } from "../../utils/plantDiseaseImages";

const GREEN = "#191fc3ff";
const BG = "#e2ebf9ff";
const { width } = Dimensions.get("window");

// Helper to normalize data
const getPests = () => {
    if (!pestData || !pestData.plants) return [];
  
    return pestData.plants.map((plant) => {
      const pests = (plant.pests || []).map((pest) => {
          const pestName = pest.pest_name || "Unknown Pest";
          let description = "No description available";
          
          if (typeof pest.impact_on_crop === 'string') {
              description = pest.impact_on_crop;
          } else if (pest.impact_on_crop && typeof pest.impact_on_crop === 'object') {
              description = pest.impact_on_crop.reason || JSON.stringify(pest.impact_on_crop);
          } else if (pest.symptoms && Array.isArray(pest.symptoms) && pest.symptoms.length > 0) {
              description = pest.symptoms[0];
          } else if (typeof pest.symptoms === 'string') {
              description = pest.symptoms;
          }
  
          return {
            id: `${pestName.replace(/\s+/g, '-')}-${Math.random()}`,
            name: pestName,
            description: description,
            category: plant.plant_name,
            image: pestName,
            color: "#ef4444",
            ...pest, // Keep all original data
          };
      });
  
      return {
        title: plant.plant_name,
        subtitle: plant.scientific_name,
        data: pests
      };
    }).filter(section => section.data.length > 0);
};

const getDiseases = () => {
    if (!diseaseData) return [];
    
    // Create a map of plant names to scientific names from pestData for subtitles
    const plantInfoMap = {};
    if (pestData && pestData.plants) {
        pestData.plants.forEach(p => {
            if (p.plant_name) {
                plantInfoMap[p.plant_name.toLowerCase()] = p.scientific_name;
            }
        });
    }

    // Helper to split comma-separated strings into arrays
    const toList = (str) => {
        if (typeof str !== 'string') return str;
        return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
    };
    
    // Group by plant_host
    const grouped = {};
    diseaseData.forEach((d) => {
      const plant = d.plant_host || "Other";
      if (!grouped[plant]) grouped[plant] = [];
      
      grouped[plant].push({
          id: `${d.disease_id}-${Math.random()}`,
          name: d.common_name || d.disease_name || "Unknown Disease",
          description: d.symptoms ? d.symptoms.split(',')[0] : "No symptoms description", // Short description for card
          category: d.plant_host,
          image: d.disease_name || d.common_name,
          color: "#f59e0b",
          ...d,
          // Normalize fields for detail view:
          symptoms: toList(d.symptoms),
          management_cultural: toList(d.management_cultural),
          management_chemical: toList(d.management_chemical),
          management_biological: toList(d.management_biological),
          prevention: toList(d.prevention)
      });
    });
  
    return Object.keys(grouped).map(plant => ({
        title: plant,
        subtitle: plantInfoMap[plant.toLowerCase()] || "Disease Information",
        data: grouped[plant]
    }));
};
  
const getWeeds = () => {
    if (!weedData || !weedData.plant) return [];
    
    return weedData.plant.map((crop, plantIndex) => {
      const weeds = [];
  
      // Extract from weed_categories
      if (crop.weed_categories) {
        Object.entries(crop.weed_categories).forEach(([type, weedList]) => {
          if (Array.isArray(weedList)) {
            weedList.forEach((weed, weedIndex) => {
               const weedName = weed.common_name || weed.scientific_name || "Unknown Weed";
               weeds.push({
                id: `weed-${plantIndex}-${type}-${weedIndex}-${Math.random()}`,
                name: weedName,
                description: weed.identification?.special_feature || "Weed affecting " + crop.crop,
                category: type.replace(/_/g, ' '), // Sub-category like 'grasses'
                image: weedName,
                color: "#22c55e",
                ...weed,
              });
            });
          }
        });
      }
      // Extract from major_weeds
      if (crop.major_weeds && Array.isArray(crop.major_weeds)) {
         crop.major_weeds.forEach((weed, weedIndex) => {
             const weedName = weed.common_name || weed.weed_name || weed.scientific_name || "Unknown Weed";
             weeds.push({
                id: `major-weed-${plantIndex}-${weedIndex}-${Math.random()}`,
                name: weedName,
                description: "Weed affecting " + crop.crop,
                category: "Major Weeds",
                image: weedName,
                color: "#22c55e",
                ...weed
             });
         });
      }
  
      return {
          title: crop.crop,
          subtitle: crop.ecosystem,
          data: weeds
      };
    }).filter(section => section.data.length > 0);
};

const getPlants = () => {
    if (!pestData || !pestData.plants) return [];
    
    // Group by category (Cereal crop, Fruit crop, etc.)
    const grouped = {};
    
    pestData.plants.forEach((plant) => {
        const category = plant.category || "Other Crops";
        if (!grouped[category]) grouped[category] = [];
        
        grouped[category].push({
            id: `plant-${plant.plant_name}-${Math.random()}`,
            name: plant.plant_name,
            description: plant.scientific_name || "No scientific name",
            category: category,
            image: plant.plant_name,
            color: "#3b82f6",
            // specific fields
            soil_requirement: plant.soil_requirement,
            climatic_requirement: plant.climatic_requirement,
            major_growing_regions: plant.major_growing_regions,
            ...plant
        });
    });

    return Object.keys(grouped).map(category => ({
        title: category,
        data: grouped[category]
    }));
};

// Data structure for all categories
const KNOWLEDGE_DATA = {
  pests: getPests(),
  diseases: getDiseases(),
  weeds: getWeeds(),
  plants: getPlants(),
};

import { getLocalImage } from "../../utils/LocalImages";

const getImageSource = (item, tab) => {
  if (tab === "diseases") {
    const diseaseImage = getPlantDiseaseImage(item?.disease_name || item?.image || item?.name);
    if (diseaseImage) return diseaseImage;
  }

  if (tab === "pests") {
    const pestImage = getLocalImage("pests", item?.category || "", item?.image || item?.name || "");
    if (pestImage) return pestImage;
  }

  if (tab === "weeds") {
    const weedImage = getLocalImage("weeds", item?.title || item?.category || "", item?.image || item?.name || "");
    if (weedImage) return weedImage;
  }

  const seed = item?.image || item?.name || "plant";
  return { uri: `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/300` };
};

const EnhancedKnowledgeHub = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("pests");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search filtering logic
  const filteredItems = useMemo(() => {
    const sections = KNOWLEDGE_DATA[activeTab];
    const query = searchQuery.toLowerCase().trim();
    
    if (!sections) return [];
    if (!query) return sections;

    return sections.map(section => {
        // If section title matches, return all data in it
        if (section.title && typeof section.title === 'string' && section.title.toLowerCase().includes(query)) {
            return section;
        }

        // Otherwise filter specific items
        const matchingItems = section.data.filter(item => 
          (item.name && typeof item.name === 'string' && item.name.toLowerCase().includes(query)) ||
          (item.description && typeof item.description === 'string' && item.description.toLowerCase().includes(query))
        );
        
        return {
            ...section,
            data: matchingItems
        };
    }).filter(section => section.data.length > 0);
  }, [activeTab, searchQuery]);

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const getTabs = () => [
    { key: "pests", label: "Pests", icon: "ladybug", color: "#ef4444" },
    { key: "diseases", label: "Diseases", icon: "hospital-box", color: "#f59e0b" },
    { key: "weeds", label: "Weeds", icon: "leaf", color: "#22c55e" },
    { key: "plants", label: "Plants", icon: "sprout", color: "#3b82f6" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 40 }]}>
        <Text style={styles.headerTitle}>Knowledge Hub</Text>
        <Text style={styles.headerSubtitle}>Explore agricultural resources</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {getTabs().map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => {
              setActiveTab(tab.key);
              setSearchQuery("");
            }}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? GREEN : "#64748b"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content Sections */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((section, index) => (
            <View key={section.title + index} style={styles.sectionContainer}>
                <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
                    {section.subtitle && <Text style={styles.sectionHeaderSubtitle}>{section.subtitle}</Text>}
                </View>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.horizontalList}
                >
                    {section.data.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.horizontalCard}
                            activeOpacity={0.8}
                            onPress={() => handleItemPress(item)}
                        >
                             <Image
                                source={getImageSource(item, activeTab)}
                                style={styles.horizontalCardImage}
                             />
                             <View style={styles.cardOverlay} />
                             <View style={styles.horizontalCardContent}>
                                <View
                                  style={[
                                    styles.colorBadge,
                                    { backgroundColor: item.color },
                                  ]}
                                />
                                <Text style={styles.horizontalCardTitle} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.horizontalCardDesc} numberOfLines={2}>{item.description}</Text>
                             </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try searching with different keywords</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={GREEN} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedItem && (
              <>
                <Image
                  source={getImageSource(selectedItem, activeTab)}
                  style={styles.modalImage}
                />
                <View style={styles.modalInfo}>
                  <View style={styles.titleRow}>
                    <View
                      style={[
                        styles.colorBadge,
                        { backgroundColor: selectedItem.color, width: 12, height: 12 },
                      ]}
                    />
                    <Text style={styles.modalItemTitle}>{selectedItem.name}</Text>
                  </View>

                  {/* Render distinct format based on active tab/category */}
                  <KnowledgeHubDetailView category={activeTab} item={selectedItem} />
                  
                  {/* Fallback for 'plants' or unknown types using old generic view */}
                  {!['pests', 'weeds', 'diseases'].includes(activeTab) && (
                    <View>
                        <Text style={styles.modalDescription}>
                            {selectedItem.description}
                        </Text>
                        {/* Generic fallback fields if needed */}
                         {selectedItem.category && (
                            <View style={styles.infoBox}>
                              <Text style={styles.infoLabel}>Category</Text>
                              <Text style={styles.infoValue}>{selectedItem.category}</Text>
                            </View>
                          )}
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: GREEN,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#1e293b",
  },

  // Tabs
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexGrow: 0,
    minHeight: 50,
  },
  tabContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  activeTab: {
    borderBottomColor: GREEN,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabLabel: {
    color: GREEN,
    fontWeight: "700",
  },

  // List
  listContainer: {
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontStyle: 'italic'
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 200,
    height: 240,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginRight: 12,
  },
  horizontalCardImage: {
    width: "100%",
    height: "100%",
  },
  horizontalCardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 16,
    // Gradient overlay is handled by cardOverlay view
  },
  horizontalCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  horizontalCardDesc: {
    fontSize: 12,
    color: "#f1f5f9",
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  horizontalCardCategory: {
    fontSize: 11,
    color: "#cbd5e1",
    marginTop: 4,
    fontWeight: "600",
  },

  activeTabLabel: {
    color: GREEN,
    fontWeight: "700",
  },

  // Deleted legacy grid styles...
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  colorBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    display: 'none' // Hide little dots on cards for cleaner look
  },

  // Empty State
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: BG,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: GREEN,
  },
  modalContent: {
    paddingBottom: 24,
  },
  modalImage: {
    width: "100%",
    height: 280,
    backgroundColor: "#e2e8f0",
  },
  modalInfo: {
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  modalItemTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: GREEN,
  },
  modalDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
});

export default EnhancedKnowledgeHub;