import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Enable LayoutAnimation for Android (Legacy Architecture only)
// In New Architecture, this is a no-op and causes a warning.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !global.nativeFabricUIManager) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GREEN = "#191fc3ff";
const BG = "#e2ebf9ff";
const TEXT_DARK = "#1e293b";
const TEXT_MUTED = "#64748b";

// --- REUSABLE COMPONENTS ---

const DetailSection = ({ title, icon, color = GREEN, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsOpen(!isOpen);
    };

    return (
        <View style={[styles.sectionBlock, !isOpen && styles.sectionBlockClosed]}>
            <TouchableOpacity 
                style={styles.sectionHeaderRow} 
                onPress={toggleOpen} 
                activeOpacity={0.7}
            >
                <View style={styles.headerTitleContainer}>
                    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                        <MaterialCommunityIcons name={icon} size={20} color={color} />
                    </View>
                    <Text style={[styles.sectionHeader, { color: color }]}>{title}</Text>
                </View>
                <MaterialCommunityIcons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={TEXT_MUTED} 
                />
            </TouchableOpacity>
            
            {isOpen && (
                <View style={styles.sectionContent}>
                    {children}
                </View>
            )}
        </View>
    );
};

const GridItem = ({ label, value, icon }) => (
    <View style={styles.gridItem}>
        {icon && <MaterialCommunityIcons name={icon} size={16} color={GREEN} style={{marginBottom: 4}} />}
        <Text style={styles.gridLabel}>{label}</Text>
        <Text style={styles.gridValue}>{value || "N/A"}</Text>
    </View>
);

const Chip = ({ text, color = GREEN }) => (
    <View style={[styles.chip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
        <Text style={[styles.chipText, { color: color }]}>{text}</Text>
    </View>
);

const KeyValueRow = ({ label, value, italic = false }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={[styles.value, italic && { fontStyle: 'italic' }]}>{value}</Text>
    </View>
);

// Helper to safely render weed management items
const renderWeedManagementItem = (m, i) => {
    if (typeof m === 'string') {
        return (
            <View key={i} style={styles.bulletRow}>
                <MaterialCommunityIcons name="circle-small" size={20} color={GREEN} />
                <Text style={styles.bulletPoint}>{m}</Text>
            </View>
        );
    }
    if (typeof m === 'object' && m !== null) {
        return (
            <View key={i} style={styles.chemicalCard}>
                <View style={styles.chemHeader}>
                    <MaterialCommunityIcons name="flask" size={16} color="#ef4444" />
                    <Text style={styles.chemName}>{m.herbicide || "Herbicide"}</Text>
                </View>
                {m.dose && <Text style={styles.chemDetails}>DOSAGE: {m.dose}</Text>}
                {m.time && <Text style={styles.chemDetails}>TIMING: {m.time}</Text>}
                {m.remarks && <Text style={[styles.chemDetails, {fontStyle:'italic', marginTop: 4}]}>Note: {m.remarks}</Text>}
            </View>
        );
    }
    return null;
};

// --- MAIN RENDERERS ---

const RenderPestDetails = ({ item }) => (
  <View style={styles.detailContainer}>
    
    <DetailSection title="Scientific Identity" icon="dna" defaultOpen={true}>
      <KeyValueRow label="Scientific Name" value={item.scientific_name || "N/A"} italic />
      {item.order && <KeyValueRow label="Order" value={item.order} />}
      {item.family && <KeyValueRow label="Family" value={item.family} />}
      <KeyValueRow label="Category" value={item.category || "General Pest"} />
    </DetailSection>

    <DetailSection title="Infestation & Env." icon="weather-cloudy" color="#0ea5e9">
      <View style={styles.gridContainer}>
        <GridItem label="Type" value={item.infestation_type} />
        <GridItem label="Cond." value={item.favorable_conditions} />
        <GridItem label="Region" value={item.affected_regions} />
      </View>
      
      <Text style={styles.subHeader}>Target Stages:</Text>
      <View style={styles.chipContainer}>
        {Array.isArray(item.target_stages)
            ? item.target_stages.map((stage, i) => <Chip key={i} text={stage} color="#0ea5e9" />)
            : <Chip text={item.target_stages || "All Stages"} color="#0ea5e9" />
        }
      </View>
    </DetailSection>

    <DetailSection title="Symptoms & Impact" icon="alert-circle-outline" color="#f59e0b">
      <Text style={styles.subHeader}>Symptoms:</Text>
      {Array.isArray(item.symptoms) ? (
        item.symptoms.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
                <MaterialCommunityIcons name="alert-octagon" size={14} color="#f59e0b" style={{marginTop: 3}} />
                <Text style={styles.bulletPoint}>{s}</Text>
            </View>
        ))
      ) : (
        <Text style={styles.paragraph}>{item.symptoms || "No data available."}</Text>
      )}

      <View style={styles.highlightBox}>
        <Text style={[styles.subHeader, {color: '#b45309'}]}>Crop Impact ⚠️</Text>
        <Text style={styles.paragraph}>
            {typeof item.impact_on_crop === "object"
            ? JSON.stringify(item.impact_on_crop).replace(/[{"}]/g, "").replace(/,/g, "\n")
            : item.impact_on_crop || "N/A"}
        </Text>
      </View>
    </DetailSection>

    {item.identification_bionomics && (
      <DetailSection title="Identification (Bionomics)" icon="microscope" color="#8b5cf6">
        {Object.entries(item.identification_bionomics).map(([stage, desc], i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <Text style={styles.timelineHeader}>{stage}</Text>
            <Text style={styles.timelineText}>
              {typeof desc === "object" ? JSON.stringify(desc) : desc}
            </Text>
          </View>
        ))}
      </DetailSection>
    )}

    <DetailSection title="Integrated Treatment" icon="shield-check" color="#10b981">
      
      {/* Chemical */}
      {item.treatment_after_attack?.chemical_control && (
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: "#ef4444" }]}>🧪 Chemical Control</Text>
          {item.treatment_after_attack.chemical_control.map((c, i) => (
            <View key={i} style={styles.chemicalCard}>
              <Text style={styles.chemName}>{c.pesticide_name}</Text>
              <View style={styles.rowSpaced}>
                 <Text style={styles.chemBadge}>Dose: {c.dosage}</Text>
                 <Text style={styles.chemMethod}>{c.application_method}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Biological */}
      {item.treatment_after_attack?.biological_control && (
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: "#22c55e" }]}>🐞 Biological Control</Text>
          {item.treatment_after_attack.biological_control.map((b, i) => (
            <View key={i} style={styles.simpleCard}>
               {typeof b === 'string' ? (
                   <Text style={styles.simpleText}>{b}</Text>
               ) : (
                   <>
                       <Text style={styles.simpleText}>{b.agent_name || b.method || "Bio Agent"}</Text>
                       {(b.release_rate || b.details) && (
                           <Text style={styles.simpleSubText}>
                               {b.release_rate ? `Release Rate: ${b.release_rate}` : b.details}
                           </Text>
                       )}
                   </>
               )}
            </View>
          ))}
        </View>
      )}

      {/* Organic Control */}
      {item.treatment_after_attack?.organic_control && (
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: "#16a34a" }]}>🌿 Organic Control</Text>
          {item.treatment_after_attack.organic_control.map((o, i) => (
            <View key={i} style={styles.simpleCard}>
               {typeof o === 'string' ? (
                   <Text style={styles.simpleText}>{o}</Text>
               ) : (
                   <>
                       <Text style={styles.simpleText}>{o.method || "Method"}</Text>
                       {o.details && <Text style={styles.simpleSubText}>{o.details}</Text>}
                   </>
               )}
            </View>
          ))}
        </View>
      )}
    </DetailSection>

    <DetailSection title="Prevention" icon="shield-plus" color="#6366f1">
      {item.preventive_measures?.cultural_practices && (
        <>
          <Text style={styles.subHeader}>Cultural Practices:</Text>
          {item.preventive_measures.cultural_practices.map((p, i) => (
             <View key={i} style={styles.bulletRow}>
                <MaterialCommunityIcons name="check" size={16} color="#6366f1" />
                <Text style={styles.bulletPoint}>{p}</Text>
             </View>
          ))}
        </>
      )}
      {item.preventive_measures?.monitoring_etl && (
        <View style={[styles.infoBox, {borderColor: '#6366f1', borderLeftColor: '#6366f1'}]}>
          <Text style={[styles.infoLabel, {color: '#6366f1'}]}>Monitoring (ETL)</Text>
          <Text style={styles.paragraph}>{item.preventive_measures.monitoring_etl}</Text>
        </View>
      )}
    </DetailSection>
  </View>
);

const RenderWeedDetails = ({ item }) => (
  <View style={styles.detailContainer}>
    
    <DetailSection title="Weed Ecology & ID" icon="leaf" color="#22c55e">
      <KeyValueRow label="Scientific Name" value={item.scientific_name || item.name} italic />
      <KeyValueRow label="Common Name" value={item.common_name || item.name} />
      <KeyValueRow label="Category" value={item.category || "General Weed"} />
      
      {item.identification?.special_feature && (
         <View style={styles.infoBoxGreen}>
            <MaterialCommunityIcons name="star" size={16} color="#166534" style={{marginRight: 6}} />
            <View style={{flex: 1}}>
                <Text style={styles.infoLabelGreen}>Distinguishing Feature</Text>
                <Text style={styles.infoText}>{item.identification.special_feature}</Text>
            </View>
         </View>
      )}
    </DetailSection>

    <DetailSection title="Identification Features" icon="eye-outline" color="#0ea5e9">
      {item.identification && Object.entries(item.identification).map(([key, val]) => {
          if (key === 'special_feature') return null;
          return (
            <View key={key} style={styles.row}>
                <Text style={[styles.label, {textTransform: 'capitalize'}]}>{key.replace(/_/g, ' ')}:</Text>
                <Text style={styles.value}>{val}</Text>
            </View>
          )
      })}
    </DetailSection>

    <DetailSection title="Management Practices" icon="tools" color="#f97316">
      {item.weed_management_practices && Object.entries(item.weed_management_practices).map(([key, value]) => (
        <View key={key} style={styles.subSection}>
           <View style={styles.subHeaderRow}>
               <MaterialCommunityIcons name="drag-horizontal-variant" size={20} color="#f97316" />
               <Text style={[styles.subHeader, {marginBottom: 0, textTransform: 'capitalize'}]}>
                   {key.replace(/_/g, ' ')}
               </Text>
           </View>
           
           <View style={styles.nestedContent}>
               {/* Case 1: Array of strings or objects */}
               {Array.isArray(value) ? (
                   value.map((m, i) => renderWeedManagementItem(m, i))
               ) 
               /* Case 2: Nested Object */
               : typeof value === 'object' && value !== null ? (
                   Object.entries(value).map(([subKey, subVal]) => (
                       <View key={subKey} style={{marginBottom: 12}}>
                           <Text style={[styles.subHeader, {fontSize: 12, color: '#f97316'}]}>{subKey}:</Text>
                           {Array.isArray(subVal) ? 
                               subVal.map((m, i) => renderWeedManagementItem(m, i))
                               : <Text style={styles.paragraph}>{String(subVal)}</Text>
                           }
                       </View>
                   ))
               )
               /* Case 3: Simple String */
               : (
                   <Text style={styles.paragraph}>{value}</Text>
               )}
           </View>
        </View>
      ))}
    </DetailSection>

    {(item.ecological_value || item.associated_pests) && (
        <DetailSection title="Secondary Value & Linkages" icon="link" color="#64748b">
            {item.associated_pests && (
                <View style={{marginBottom: 12}}>
                    <Text style={styles.label}>🐛 Associated Pests:</Text>
                    <View style={styles.chipContainer}>
                        {Array.isArray(item.associated_pests) 
                            ? item.associated_pests.map((p,i) => <Chip key={i} text={p} color="#64748b" />)
                            : <Chip text={item.associated_pests} color="#64748b" />
                        }
                    </View>
                </View>
            )}
            {item.ecological_value && (
                <View style={styles.highlightBox}>
                    <Text style={[styles.subHeader, {color: '#334155'}]}>Ecological Role:</Text>
                    <Text style={styles.paragraph}>{item.ecological_value}</Text>
                </View>
            )}
        </DetailSection>
    )}
  </View>
);

const RenderDiseaseDetails = ({ item }) => (
  <View style={styles.detailContainer}>
    
    <DetailSection title="Disease Diagnostic Card" icon="hospital-box" color="#ef4444">
      <KeyValueRow label="ID" value={item.disease_id || "N/A"} />
      <KeyValueRow label="Pathogen" value={item.causal_agent || "Unknown"} italic />
      <KeyValueRow label="Host" value={item.plant_host || "N/A"} />
    </DetailSection>

    <DetailSection title="Diagnostic Analysis" icon="magnify" color="#f59e0b">
      <Text style={styles.subHeader}>Symptoms:</Text>
      <View style={styles.chipContainer}>
        {Array.isArray(item.symptoms) ? 
            item.symptoms.map((s, i) => <Chip key={i} text={s} color="#f59e0b" />)
            : <Text style={styles.paragraph}>{item.symptoms}</Text>
        }
      </View>
      
      <View style={[styles.infoBox, {marginTop: 12, borderColor: '#f59e0b', borderLeftColor: '#f59e0b'}]}>
        <Text style={[styles.infoLabel, {color: '#f59e0b'}]}>Favorable Conditions</Text>
        <Text style={styles.paragraph}>{item.favorable_conditions || "No data."}</Text>
      </View>
    </DetailSection>

    <DetailSection title="Management Protocols" icon="doctor" color="#10b981">
      
      {item.management_cultural && (
        <View style={styles.controlGroup}>
          <Text style={styles.subHeader}>🌱 Cultural:</Text>
          {Array.isArray(item.management_cultural) ? 
            item.management_cultural.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                    <MaterialCommunityIcons name="check-circle-outline" size={16} color="#10b981" />
                    <Text style={styles.bulletPoint}>{s}</Text>
                </View>
            )) 
            : <Text style={styles.paragraph}>{item.management_cultural}</Text>
          }
        </View>
      )}

      {item.management_chemical && (
        <View style={styles.controlGroup}>
          <Text style={[styles.subHeader, {color: '#ef4444'}]}>🧪 Chemical:</Text>
          {Array.isArray(item.management_chemical) ? 
            item.management_chemical.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                    <MaterialCommunityIcons name="flask-outline" size={16} color="#ef4444" />
                    <Text style={styles.bulletPoint}>{s}</Text>
                </View>
            )) 
            : <Text style={styles.paragraph}>{item.management_chemical}</Text>
          }
        </View>
      )}

      {item.resistance_varieties && (
        <View style={[styles.highlightBox, {backgroundColor: '#dcfce7'}]}>
           <Text style={[styles.subHeader, {color: '#166534'}]}>🛡️ Resistance:</Text>
           <Text style={styles.paragraph}>Varieties: {item.resistance_varieties}</Text>
        </View>
      )}
    </DetailSection>
  </View>
);

const KnowledgeHubDetailView = ({ category, item }) => {
    switch (category) {
        case 'pests':
            return <RenderPestDetails item={item} />;
        case 'weeds':
            return <RenderWeedDetails item={item} />;
        case 'diseases':
            return <RenderDiseaseDetails item={item} />;
        default:
            return (
                <View>
                    <Text style={styles.modalDescription}>
                        {item.description}
                    </Text>
                    {item.category && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Category</Text>
                            <Text style={styles.infoValue}>{item.category}</Text>
                        </View>
                    )}
                </View>
            );
    }
};

const styles = StyleSheet.create({
  // Global Layout
  detailContainer: { gap: 16, paddingBottom: 24 },
  
  // Section Styles
  sectionBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  sectionBlockClosed: {
      marginBottom: 0
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
  },
  iconBox: {
      padding: 6,
      borderRadius: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  sectionContent: {
      padding: 16,
      paddingTop: 0,
  },

  // Grid Styles
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { 
      width: '48%', 
      backgroundColor: '#f8fafc', 
      padding: 10, 
      borderRadius: 8, 
      borderColor: '#e2e8f0', 
      borderWidth: 1,
  },
  gridLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  gridValue: { fontSize: 13, color: '#334155', fontWeight: '600', marginTop: 2 },

  // Typography
  subHeader: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8, marginTop: 4 },
  paragraph: { fontSize: 14, color: '#475569', lineHeight: 22 },
  
  // List Items
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 4, paddingRight: 10 },
  bulletPoint: { fontSize: 13, color: '#475569', lineHeight: 20, flex: 1 },

  // Key Value Rows
  row: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  label: { width: 110, fontWeight: '700', fontSize: 13, color: '#64748b' },
  value: { flex: 1, fontSize: 13, color: '#1e293b' },

  // Chips
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },

  // Cards
  controlGroup: { marginBottom: 16 },
  controlLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8, paddingLeft: 4 },
  
  chemicalCard: { 
      backgroundColor: '#fff', 
      padding: 12, 
      borderRadius: 8, 
      marginBottom: 8, 
      borderWidth: 1, 
      borderColor: '#e2e8f0',
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1
  },
  chemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  chemName: { fontWeight: "700", fontSize: 14, color: '#1e293b' },
  chemBadge: { fontSize: 12, color: '#fff', backgroundColor: '#64748b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  chemMethod: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  chemDetails: { fontSize: 12, color: '#475569', marginBottom: 2 },
  rowSpaced: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },

  simpleCard: { 
      backgroundColor: '#f8fafc', 
      padding: 10, 
      borderRadius: 8, 
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#e2e8f0'
  },
  simpleText: { fontSize: 13, fontWeight: '600', color: '#334155'},
  simpleSubText: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Special Boxes
  infoBoxGreen: { 
      flexDirection: 'row', 
      backgroundColor: '#f0fdf4', 
      padding: 12, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: '#bbf7d0' 
  },
  infoLabelGreen: { color: '#166534', fontWeight: '800', fontSize: 12, marginBottom: 2 },
  infoText: { fontSize: 13, color: "#166534", lineHeight: 18 },

  highlightBox: {
      backgroundColor: '#fff7ed', 
      padding: 12, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: '#fed7aa',
      marginTop: 8
  },

  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GREEN,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: GREEN,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  
  // Timeline
  timelineItem: {
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderColor: '#e2e8f0',
      paddingBottom: 20,
      position: 'relative'
  },
  timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#8b5cf6',
      position: 'absolute',
      left: -6,
      top: 0
  },
  timelineHeader: {
      fontSize: 13,
      fontWeight: '700',
      color: '#475569',
      marginBottom: 4,
      marginTop: -4
  },
  timelineText: {
      fontSize: 13,
      color: '#334155'
  },

  // Fallback
  modalDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  nestedContent: {
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderColor: '#e2e8f0'
  },
  subSection: {
      marginBottom: 16
  },
  subHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
  }
});

export default KnowledgeHubDetailView;