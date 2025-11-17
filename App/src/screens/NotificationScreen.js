import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'weather',
      title: 'Weather Alert',
      message: 'Heavy rainfall expected in your area tomorrow',
      time: '2 hours ago',
      read: false,
      icon: 'rainy',
      color: '#3b82f6',
    },
    {
      id: 2,
      type: 'pest',
      title: 'Pest Detection',
      message: 'Aphids detected in your captured image. Check control methods.',
      time: '5 hours ago',
      read: false,
      icon: 'bug',
      color: '#ef4444',
    },
    {
      id: 3,
      type: 'crop',
      title: 'Crop Recommendation',
      message: 'Best time to plant wheat based on current soil conditions',
      time: '1 day ago',
      read: true,
      icon: 'sprout',
      color: '#22c55e',
    },
    {
      id: 4,
      type: 'market',
      title: 'Market Price Update',
      message: 'Tomato prices increased by 15% in nearby markets',
      time: '1 day ago',
      read: true,
      icon: 'cart',
      color: '#f97316',
    },
    {
      id: 5,
      type: 'fertilizer',
      title: 'Fertilizer Reminder',
      message: 'Time to apply NPK fertilizer for optimal crop growth',
      time: '2 days ago',
      read: true,
      icon: 'flask',
      color: '#eab308',
    },
    {
      id: 6,
      type: 'soil',
      title: 'Soil Analysis Complete',
      message: 'Your soil pH level is 6.5 - Ideal for most crops',
      time: '3 days ago',
      read: true,
      icon: 'layers',
      color: '#8b5cf6',
    },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIconComponent = (iconName) => {
    const iconMap = {
      'rainy': Ionicons,
      'bug': MaterialCommunityIcons,
      'sprout': MaterialCommunityIcons,
      'cart': Ionicons,
      'flask': Ionicons,
      'layers': Ionicons,
    };
    return iconMap[iconName] || Ionicons;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={{ width: 40 }} />
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        <ScrollView 
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsContent}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const IconComponent = getIconComponent(notification.icon);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.unreadCard
                  ]}
                  onPress={() => markAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.notificationContent}>
                    <View style={[styles.notificationIcon, { backgroundColor: `${notification.color}15` }]}>
                      <IconComponent 
                        name={notification.icon === 'bug' ? 'bug' : notification.icon === 'sprout' ? 'sprout' : notification.icon} 
                        size={24} 
                        color={notification.color} 
                      />
                    </View>
                    
                    <View style={styles.notificationTextContainer}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {!notification.read && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>{notification.time}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Ionicons name="close" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 12,
  },
  markAllText: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bfdbfe',
  },
  notificationContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
});

export default NotificationScreen;
