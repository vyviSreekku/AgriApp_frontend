import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Switch, Alert, Modal, TextInput } from 'react-native';
import authService from '../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [marketUpdates, setMarketUpdates] = useState(false);
  const [crops, setCrops] = useState(['Wheat', 'Rice', 'Corn', 'Tomato']);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const userData = await authService.getUser();
    setUser(userData);
  }

  const handleAddCrop = () => {
    if (newCropName && newCropName.trim()) {
      setCrops([...crops, newCropName.trim()]);
      setNewCropName('');
      setShowAddCropModal(false);
    }
  };

  const handleRemoveCrop = (index) => {
    Alert.alert(
      'Remove Crop',
      `Remove ${crops[index]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newCrops = crops.filter((_, i) => i !== index);
            setCrops(newCrops);
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await authService.logout();
            navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, iconFamily = 'Feather', title, subtitle, onPress, showArrow = true, customRight }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.iconContainer}>
          {iconFamily === 'Feather' && <Feather name={icon} size={20} color="#4f46e5" />}
          {iconFamily === 'Ionicons' && <Ionicons name={icon} size={20} color="#4f46e5" />}
          {iconFamily === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={icon} size={20} color="#4f46e5" />}
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {customRight ? customRight : showArrow && <Feather name="chevron-right" size={20} color="#94a3b8" />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="user" size={40} color="#fff" />
                </View>
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Feather name="camera" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{user?.full_name || user?.name || 'Guest'}</Text>
              <Text style={styles.userEmail}>+91 {user?.phone || '—'}</Text>
            </LinearGradient>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.cropsTitle}>My Crops</Text>
                <TouchableOpacity onPress={() => setShowAddCropModal(true)} style={styles.addButton}>
                  <Ionicons name="add-circle" size={24} color="#22c55e" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropsList}>
                {crops.map((crop, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.cropTag}
                    onLongPress={() => handleRemoveCrop(index)}
                  >
                    <MaterialCommunityIcons name="sprout" size={16} color="#22c55e" />
                    <Text style={styles.cropTagText}>{crop}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.menuCard}>
              <MenuItem icon="user" title="Personal Information" subtitle="Name, email, phone" />
              <View style={styles.menuDivider} />
              <MenuItem icon="map-pin" title="Farm Location" subtitle="Set your farm location" />
              <View style={styles.menuDivider} />
              <MenuItem icon="lock" title="Security" subtitle="Password & authentication" />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.menuCard}>
              <MenuItem 
                icon="bell" 
                title="Push Notifications" 
                subtitle="Receive alerts and updates"
                showArrow={false}
                customRight={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
                    thumbColor={notificationsEnabled ? '#4f46e5' : '#f1f5f9'}
                  />
                }
              />
              <View style={styles.menuDivider} />
              <MenuItem 
                icon="cloud-rain" 
                iconFamily="Feather"
                title="Weather Alerts" 
                subtitle="Get notified about weather changes"
                showArrow={false}
                customRight={
                  <Switch
                    value={weatherAlerts}
                    onValueChange={setWeatherAlerts}
                    trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
                    thumbColor={weatherAlerts ? '#4f46e5' : '#f1f5f9'}
                  />
                }
              />
              <View style={styles.menuDivider} />
              <MenuItem 
                icon="trending-up" 
                iconFamily="Feather"
                title="Market Updates" 
                subtitle="Get price alerts and trends"
                showArrow={false}
                customRight={
                  <Switch
                    value={marketUpdates}
                    onValueChange={setMarketUpdates}
                    trackColor={{ false: '#e2e8f0', true: '#a5b4fc' }}
                    thumbColor={marketUpdates ? '#4f46e5' : '#f1f5f9'}
                  />
                }
              />
            </View>
          </View>

          {/* App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.menuCard}>
              <MenuItem icon="help-circle" title="Help & Support" subtitle="FAQs and contact us" />
              <View style={styles.menuDivider} />
              <MenuItem icon="info" title="About" subtitle="App version 1.0.0" />
              <View style={styles.menuDivider} />
              <MenuItem icon="file-text" title="Terms & Privacy" subtitle="Legal information" />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Add Crop Modal */}
        <Modal
          visible={showAddCropModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAddCropModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Crop</Text>
                <TouchableOpacity onPress={() => setShowAddCropModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter crop name"
                value={newCropName}
                onChangeText={setNewCropName}
                autoFocus
                onSubmitEditing={handleAddCrop}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setNewCropName('');
                    setShowAddCropModal(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalAddButton}
                  onPress={handleAddCrop}
                >
                  <Text style={styles.modalAddText}>Add Crop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  profileCard: { borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  editProfileButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6 },
  editProfileText: { color: '#4f46e5', fontWeight: '700', fontSize: 14 },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cropsTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  addButton: { padding: 4 },
  cropsList: { flexDirection: 'row' },
  cropTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, gap: 6 },
  cropTagText: { fontSize: 14, color: '#22c55e', fontWeight: '600' },
  
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: '#64748b' },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },
  
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  modalAddButton: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#22c55e', alignItems: 'center' },
  modalAddText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
