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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'qwen/qwen3-32b';

const FARMING_SYSTEM_PROMPT = `You are PlantHub, an expert agricultural AI assistant for Indian farmers. Your role is to:
1. Provide practical farming advice about crop selection, planting, irrigation, pest management, and harvesting
2. Focus on crops commonly grown in India (rice, wheat, cotton, tomato, potato, sugarcane, etc.)
3. Consider local weather, soil, and water conditions
4. Give step-by-step, easy-to-understand guidance
5. Recommend sustainable and organic methods when possible
6. Always mention when local agricultural experts should be consulted
7. Be conversational and encouraging

Always keep responses concise (max 500 words), clear, and farmer-friendly.`;

const ChatbotModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! How can I assist you with your farming needs today?",
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const scrollViewRef = useRef();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const cleanThinkTags = (text) => {
    return text.replace(/<think>.*?<\/think>/gs, '').trim();
  };

  const sendMessage = async () => {
    const userMessage = input.trim();
    
    if (!userMessage) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    if (userMessage.length > 500) {
      Alert.alert('Error', 'Question is too long (max 500 characters)');
      return;
    }

    if (!GROQ_API_KEY || GROQ_API_KEY.includes('YOUR_GROQ')) {
      Alert.alert('Error', 'API key not configured. Please set up Groq API key.');
      return;
    }

    // Add user message to chat
    const userMsg = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add to conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];
    setConversationHistory(updatedHistory);

    try {
      // Prepare messages for API
      const messages_for_api = [
        {
          role: 'system',
          content: FARMING_SYSTEM_PROMPT,
        },
        ...updatedHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messages_for_api,
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          throw new Error('Rate limited. Please wait a moment and try again.');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('API key is invalid or expired.');
        } else {
          throw new Error(error.error?.message || 'Unknown error');
        }
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from API');
      }

      let botResponse = data.choices[0].message.content;
      // Remove <think> tags
      botResponse = cleanThinkTags(botResponse);

      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
      };

      setMessages(prev => [...prev, botMsg]);
      setConversationHistory(prev => [
        ...prev,
        { role: 'bot', content: botResponse },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to get response');
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const suggestQuestion = (question) => {
    setInput(question);
  };

  return (
    <View style={styles.container}>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.fabIcon}>💬</Text>
      </TouchableOpacity>

      {/* Chatbot Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.chatbotBox}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <Text style={styles.botIcon}>🌿</Text>
                <View>
                  <Text style={styles.headerH2}>PlantHub Assistant</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>


            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.sender === 'user'
                      ? styles.userMessage
                      : styles.botMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageContent,
                      msg.sender === 'user'
                        ? styles.userMessageContent
                        : styles.botMessageContent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === 'user'
                          ? styles.userMessageText
                          : styles.botMessageText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.typingContainer}>
                  <View style={[styles.typingDot, styles.dot1]} />
                  <View style={[styles.typingDot, styles.dot2]} />
                  <View style={[styles.typingDot, styles.dot3]} />
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputArea}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask about crops, pests, weather, soil..."
                  placeholderTextColor="#a5d6a7"
                  value={input}
                  onChangeText={setInput}
                  multiline
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                  onPress={sendMessage}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>➤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Suggestions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.suggestionsContainer}
            >
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => suggestQuestion('How to grow tomatoes in India?')}
              >
                <Text style={styles.suggestionBtnText}>🍅 Tomato Growing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => suggestQuestion('What are common wheat diseases?')}
              >
                <Text style={styles.suggestionBtnText}>🌾 Wheat Diseases</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => suggestQuestion('Best irrigation methods for cotton?')}
              >
                <Text style={styles.suggestionBtnText}>💧 Cotton Irrigation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => suggestQuestion('How to manage soil fertility?')}
              >
                <Text style={styles.suggestionBtnText}>🥕 Soil Care</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 999,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#66bb6a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatbotBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 10,
    marginVertical: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#66bb6a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  botIcon: {
    fontSize: 32,
  },
  headerH2: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerP: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: '#fff',
  },
  disclaimer: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 18,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  message: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  userMessageContent: {
    backgroundColor: '#66bb6a',
    borderBottomRightRadius: 4,
  },
  botMessageContent: {
    backgroundColor: '#e8f5e9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    lineHeight: 20,
    fontSize: 13,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1b5e20',
  },
  typingContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    width: '30%',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66bb6a',
  },
  dot1: {
    opacity: 0.5,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 0.9,
  },
  inputArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e8f5e9',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 13,
    backgroundColor: '#f1f8f6',
    color: '#333',
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#66bb6a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    fontSize: 16,
    color: '#fff',
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    maxHeight: 50,
  },
  suggestionBtn: {
    backgroundColor: '#f0f7f4',
    borderWidth: 1,
    borderColor: '#c8e6c9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionBtnText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
});

export default ChatbotModal;
