import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { askChatbot } from '../services/chatbotService';

const ChatbotModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Namaste! 👋 I'm PlantHub Assistant. How can I help you with your crops today?",
      sender: 'bot',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  // Keep scroll at the bottom
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading, isVisible]);

  const sendMessage = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;
    
    // Add user message to chat
    const userMsg = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await askChatbot(userMessage);
      const botResponse = data?.answer || 'I could not find an exact answer in your indexed data, but here is general guidance.';

        const botMsg = {
            id: (Date.now() + 1).toString(),
            text: botResponse,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, botMsg]);

    } catch (error) {
        Alert.alert('Error', error.message || 'Failed to get response');
        
        // Add error message to chat
        const errorMsg = {
            id: (Date.now() + 1).toString(),
            text: "Sorry, I'm having trouble connecting to the network right now. Please try again.",
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* IMPROVED FAB BUTTON - Icon Only */}
      <TouchableOpacity 
        style={styles.fabTouch} 
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#2E7D32', '#66BB6A']} // Deep Green to Lighter Green
          style={styles.fab}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="robot-happy-outline" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      <Modal 
        visible={isVisible} 
        animationType="slide" 
        transparent={false}
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
          >
            {/* Elegant Header */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View>
                  <Text style={styles.headerTitle}>PlantHub AI</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.headerSubtitle}>Online | Agri-Expert</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.closeCircle} onPress={() => setIsVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Space */}
            <ScrollView 
              ref={scrollViewRef} 
              style={styles.chatArea}
              contentContainerStyle={{ padding: 20 }}
            >
              {messages.map((msg) => (
                <View key={msg.id} style={[
                  styles.msgWrapper, 
                  msg.sender === 'user' ? styles.userWrapper : styles.botWrapper
                ]}>
                  <View style={[
                    styles.bubble, 
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                  ]}>
                    <Text style={[
                      styles.msgText, 
                      msg.sender === 'user' ? styles.userText : styles.botText
                    ]}>
                      {msg.text}
                    </Text>
                    <Text style={[
                        styles.timeText,
                        msg.sender === 'user' ? {color: 'rgba(255,255,255,0.7)'} : {color: '#999'}
                    ]}>{msg.time}</Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.botWrapper}>
                  <View style={styles.loadingBubble}>
                    <ActivityIndicator size="small" color="#2E7D32" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask a question about your farm..."
                  value={input}
                  onChangeText={setInput}
                  placeholderTextColor="#9EB39E"
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendButton, !input.trim() && styles.sendDisabled]} 
                  onPress={sendMessage}
                  disabled={!input.trim() || loading}
                >
                  <Text style={styles.sendArrow}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 9999, // Ensure it floats on top
  },
  fabTouch: {
    position: 'absolute',
    bottom: 30, // Adjusted to sit nicely above tab bar
    right: 20,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderRadius: 30,
    zIndex: 9999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: { flex: 1, backgroundColor: '#F9FBF9' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 5 },
  headerSubtitle: { fontSize: 12, color: '#777' },
  closeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 14, color: '#999', fontWeight: 'bold' },

  chatArea: { flex: 1 },
  msgWrapper: { marginVertical: 6, flexDirection: 'row', width: '100%' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 1
  },
  userBubble: { backgroundColor: '#2E7D32', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8E8E8' },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFF' },
  botText: { color: '#333' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', opacity: 0.8 },

  loadingBubble: { padding: 12, backgroundColor: '#FFF', borderRadius: 20, width: 50, marginLeft: 10 },

  bottomBar: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 8 : 2,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  textInput: { flex: 1, color: '#333', fontSize: 15, maxHeight: 100 },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendDisabled: { backgroundColor: '#C8D8C8' },
  sendArrow: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});

export default ChatbotModal;
