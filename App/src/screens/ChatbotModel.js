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
import NetInfo from '@react-native-community/netinfo';
import ModelManager from '../services/ModelManager';
import OfflineRagService from '../services/offlineRagService';

const STREAM_FLUSH_INTERVAL_MS = 80;

const ChatbotModal = () => {
  const initialMessages = [
    {
      id: '1',
      text: "Namaste! 👋 I'm PlantHub Assistant. How can I help you with your crops today?",
      sender: 'bot',
      time: 'Just now',
    },
  ];
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Offline & Model States
  const [isOffline, setIsOffline] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasLocalModel, setHasLocalModel] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [ragCacheInfo, setRagCacheInfo] = useState({ exists: false, sizeLabel: '0 B' });
  const [isSyncingRag, setIsSyncingRag] = useState(false);

  const scrollViewRef = useRef();
  const streamedTokenBufferRef = useRef('');
  const streamedTokenTimerRef = useRef(null);

  const refreshRagCacheInfo = async () => {
    const [available, bundleInfo] = await Promise.all([
      OfflineRagService.isRetrievalAvailable(),
      OfflineRagService.getCachedBundleInfo(),
    ]);

    setRagReady(available);
    setRagCacheInfo(bundleInfo);
    return { available, bundleInfo };
  };

  // Monitor Network State
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  // Initialize Model when Offline and Visible
  useEffect(() => {
    if (isVisible && !modelReady && !isDownloading) {
      initializeModel();
    }
  }, [isVisible, modelReady, isDownloading]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let isMounted = true;

    ModelManager.hasModel()
      .then((exists) => {
        if (isMounted) {
          setHasLocalModel(exists);
        }
      })
      .catch((error) => {
        console.error('Failed to check local model availability:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    let isMounted = true;

    refreshRagCacheInfo()
      .then(({ available, bundleInfo }) => {
        if (isMounted) {
          setRagReady(available);
          setRagCacheInfo(bundleInfo);
        }
      })
      .catch((error) => {
        console.error('Failed to check offline RAG bundle:', error);
      });

    if (!isOffline) {
      setIsSyncingRag(true);
      OfflineRagService.prepareResources({ allowNetworkSync: true })
        .then(() => {
          if (isMounted) {
            return refreshRagCacheInfo().then(({ available, bundleInfo }) => {
              if (isMounted) {
                setRagReady(available);
                setRagCacheInfo(bundleInfo);
              }
            });
          }
        })
        .catch((error) => {
          console.error('Failed to prepare offline RAG resources:', error);
        })
        .finally(() => {
          if (isMounted) {
            setIsSyncingRag(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isVisible, isOffline]);

  useEffect(() => {
    return () => {
      if (streamedTokenTimerRef.current) {
        clearTimeout(streamedTokenTimerRef.current);
      }
    };
  }, []);

  const flushStreamedTokens = (botMsgId) => {
    const bufferedText = streamedTokenBufferRef.current;
    streamedTokenBufferRef.current = '';

    if (!bufferedText) {
      return;
    }

    setMessages(prev => {
      const newMessages = [...prev];
      const lastMsgIndex = newMessages.findIndex(m => m.id === botMsgId);
      if (lastMsgIndex !== -1) {
        newMessages[lastMsgIndex] = {
          ...newMessages[lastMsgIndex],
          text: newMessages[lastMsgIndex].text + bufferedText,
        };
      }
      return newMessages;
    });
  };

  const queueStreamedToken = (botMsgId, token) => {
    streamedTokenBufferRef.current += token;

    if (streamedTokenTimerRef.current) {
      return;
    }

    streamedTokenTimerRef.current = setTimeout(() => {
      streamedTokenTimerRef.current = null;
      flushStreamedTokens(botMsgId);
    }, STREAM_FLUSH_INTERVAL_MS);
  };

  const closeModal = async () => {
    setIsVisible(false);
    setInput('');
    setLoading(false);
    setMessages(initialMessages);
    streamedTokenBufferRef.current = '';

    if (streamedTokenTimerRef.current) {
      clearTimeout(streamedTokenTimerRef.current);
      streamedTokenTimerRef.current = null;
    }

    try {
      await ModelManager.resetConversation();
    } catch (error) {
      console.error('Failed to reset offline conversation state:', error);
    }
  };

  const initializeModel = async () => {
    const hasModel = await ModelManager.hasModel();
    setHasLocalModel(hasModel);

    if (isOffline && !hasModel) {
      Alert.alert("Offline model unavailable", "Connect to the internet once to download the offline model for this device.");
      return;
    }

    setIsDownloading(true);
    try {
      const success = await ModelManager.setupModel((progress) => {
        setDownloadProgress(progress);
      });
      if (success) {
        setHasLocalModel(true);
        setModelReady(true);
      } else {
        Alert.alert("Error", "Failed to load offline model.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const headerStatus = (() => {
    if (!isOffline) {
      return {
        badge: 'ONLINE',
        subtitle: hasLocalModel ? 'Using online service. Local model cached on device.' : 'Using online service.',
        dotColor: '#2E7D32',
        badgeBackground: '#E7F6EA',
        badgeText: '#1B5E20',
      };
    }

    if (modelReady) {
      return {
        badge: 'OFFLINE',
        subtitle: ragReady ? 'Using local model with cached offline RAG.' : 'Using local model on device.',
        dotColor: '#2E7D32',
        badgeBackground: '#E8F5E9',
        badgeText: '#1B5E20',
      };
    }

    if (isDownloading) {
      return {
        badge: 'LOCAL MODEL',
        subtitle: 'Preparing local model for offline use.',
        dotColor: '#F9A825',
        badgeBackground: '#FFF6D9',
        badgeText: '#8A5A00',
      };
    }

    if (hasLocalModel) {
      return {
        badge: 'LOCAL MODEL',
        subtitle: 'Local model found. Loading for offline mode.',
        dotColor: '#FB8C00',
        badgeBackground: '#FFF1E0',
        badgeText: '#9C4A00',
      };
    }

    return {
      badge: 'OFFLINE',
      subtitle: 'Local model unavailable on this device.',
      dotColor: '#D32F2F',
      badgeBackground: '#FDECEC',
      badgeText: '#8B1E1E',
    };
  })();

  const ragCacheBadge = (() => {
    if (isSyncingRag) {
      return {
        label: 'RAG SYNCING',
        backgroundColor: '#FFF6D9',
        textColor: '#8A5A00',
      };
    }

    if (ragCacheInfo.exists) {
      return {
        label: `RAG CACHED ${ragCacheInfo.sizeLabel}`,
        backgroundColor: '#E8F5E9',
        textColor: '#1B5E20',
      };
    }

    return {
      label: 'RAG NOT CACHED',
      backgroundColor: '#FDECEC',
      textColor: '#8B1E1E',
    };
  })();

  // Keep scroll at the bottom
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading, isVisible, downloadProgress]);

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
      if (isOffline) {
        if (!modelReady) {
           Alert.alert("Please Wait", "Offline model is still preparing...");
           setLoading(false);
           return;
        }

        console.log('Offline chat request started');

        // Add placeholder bot message for streaming
        const botMsgId = (Date.now() + 1).toString();
        const botMsgPlaceholder = {
            id: botMsgId,
            text: "", // Start empty
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMsgPlaceholder]);

        const prompt = await OfflineRagService.buildAugmentedPrompt(userMessage, {
          allowNetworkSync: false,
          topK: 1,
        }).catch((error) => {
          console.error('Offline RAG prompt build failed:', error);
          return userMessage;
        });

        console.log(`Offline prompt prepared (${prompt.length} chars)`);

        // Stream response
        console.log('Starting local model generation');
        await ModelManager.generate(prompt, (token) => {
          queueStreamedToken(botMsgId, token);
        });
        console.log('Local model generation finished');

        if (streamedTokenTimerRef.current) {
          clearTimeout(streamedTokenTimerRef.current);
          streamedTokenTimerRef.current = null;
        }
        flushStreamedTokens(botMsgId);

      } else {
        // Online Mode
        const data = await askChatbot(userMessage);
        const botResponse = data?.answer || 'I could not find an exact answer in your indexed data, but here is general guidance.';

        const botMsg = {
            id: (Date.now() + 1).toString(),
            text: botResponse,
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMsg]);
      }

    } catch (error) {
        // Alert.alert('Error', error.message || 'Failed to get response');
        console.error("Chat Error:", error);
        
        // Add error message to chat
        const errorMsg = {
            id: (Date.now() + 1).toString(),
            text: isOffline 
                  ? "Sorry, I'm having trouble with the offline model." 
                  : "Sorry, I'm having trouble connecting to the network right now. Please try again.",
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
        onRequestClose={closeModal}
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
                    <View style={[styles.onlineDot, { backgroundColor: headerStatus.dotColor }]} />
                    <Text style={styles.headerSubtitle}>{headerStatus.subtitle}</Text>
                  </View>
                  <View style={styles.cacheStatusRow}>
                    <View style={[styles.cacheBadge, { backgroundColor: ragCacheBadge.backgroundColor }]}>
                      <Text style={[styles.cacheBadgeText, { color: ragCacheBadge.textColor }]}>{ragCacheBadge.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: headerStatus.badgeBackground }]}>
                  <Text style={[styles.statusBadgeText, { color: headerStatus.badgeText }]}>{headerStatus.badge}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeCircle} onPress={closeModal}>
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
          
          {/* Download Progress Indicator */}
          {isVisible && isOffline && !modelReady && isDownloading && (
            <View style={{ padding: 10, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderColor: '#ddd', alignItems: 'center' }}>
              <Text style={{ textAlign: 'center', marginBottom: 5, color: '#555' }}>
                Downloading Offline Model... {Math.round(downloadProgress * 100)}%
              </Text>
              <View style={styles.downloadProgressTrack}>
                <View
                  style={[
                    styles.downloadProgressFill,
                    { width: `${Math.max(0, Math.min(downloadProgress, 1)) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

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
  headerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, marginRight: 12 },
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
  cacheStatusRow: { flexDirection: 'row', marginTop: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 5 },
  headerSubtitle: { fontSize: 12, color: '#777' },
  cacheBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  cacheBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginLeft: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  closeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 14, color: '#999', fontWeight: 'bold' },

  chatArea: { flex: 1 },
  downloadProgressTrack: {
    width: 200,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D6E6D7',
    overflow: 'hidden',
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 999,
  },
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
