import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { sendChatMessage, ChatMessage, getStoredShiftData, ShiftData } from '@/services/chat';
import { FlatList } from 'react-native';

export default function MyPipelineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: 'Hi! I\'m Pip, your healthcare shift assistant. I\'m here to help you document and discuss your shifts. Tell me about your recent shift - what department did you work in, how many hours, and how did it go?' },
  ]);
  const [storedShifts, setStoredShifts] = useState<ShiftData[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shiftInput, setShiftInput] = useState('');
  const [isChatMode, setIsChatMode] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<'happy' | 'mellow' | 'sad' | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<Array<{sentiment: 'happy' | 'mellow' | 'sad', timestamp: number}>>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Load stored shifts on component mount
  React.useEffect(() => {
    const shifts = getStoredShiftData();
    setStoredShifts(shifts);
  }, []);

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
      <View style={[
        styles.bubble,
        item.role === 'user'
          ? [styles.userBubble, { backgroundColor: colors.primary }]
          : [styles.assistantBubble, { backgroundColor: colors.card }]
      ]}>
        <ThemedText style={[
          styles.bubbleText,
          { color: item.role === 'user' ? colors.card : colors.text }
        ]}>
          {item.text}
        </ThemedText>
      </View>
    </View>
  );

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: trimmed,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await sendChatMessage(trimmed, messages);
      setMessages(prev => [...prev, response]);
      
      if (response.shiftData) {
        setStoredShifts(prev => [...prev, response.shiftData!]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        text: 'I\'m having trouble connecting right now. Please try again in a moment.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const handleShiftInputChange = (text: string) => {
    setShiftInput(text);
  };

  const handleSentimentSelect = (sentiment: 'happy' | 'mellow' | 'sad') => {
    setSelectedSentiment(sentiment);
  };

  const handleSubmitCheckIn = async () => {
    if (!selectedSentiment) return;
    
    // Log check-in to history
    const newCheckIn = { sentiment: selectedSentiment, timestamp: Date.now() };
    setCheckInHistory(prev => [...prev, newCheckIn]);
    
    // Check if 3+ sad/mellow check-ins in a row
    const recentCheckIns = [...checkInHistory, newCheckIn].slice(-3);
    const allSadOrMellow = recentCheckIns.length >= 3 && 
      recentCheckIns.every(checkIn => checkIn.sentiment === 'sad' || checkIn.sentiment === 'mellow');
    
    if (allSadOrMellow) {
      // Trigger Pip intervention
      setIsChatMode(true);
      const interventionMessage: ChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        text: `I've noticed you've been feeling ${selectedSentiment} lately. I'm here to help and support you. Would you like to talk about what's been challenging? I'm listening and want to help you through this.`,
      };
      setMessages(prev => [...prev, interventionMessage]);
      expandChat();
    }
    
    // Reset form
    setSelectedSentiment(null);
    setShiftInput('');
  };

  const handleSubmitShift = async () => {
    if (!shiftInput.trim()) return;
    
    setIsChatMode(true);
    setIsLoading(true);
    
    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: shiftInput,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await sendChatMessage(shiftInput, messages);
      setMessages(prev => [...prev, response]);
      
      if (response.shiftData) {
        setStoredShifts(prev => [...prev, response.shiftData!]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: String(Date.now()),
        role: 'assistant',
        text: 'I\'m having trouble connecting right now. Please try again in a moment.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShiftInput('');
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const expandChat = () => {
    setIsFullScreen(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startChatMode = () => {
    setIsChatMode(true);
    expandChat();
  };

  const collapseChat = () => {
    setIsFullScreen(false);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Swipe down to close (more sensitive)
      if (translationY > 50 || velocityY > 500) {
        collapseChat();
      } else {
        // Snap back to current state
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>
          My Pipeline
        </ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: colors.mutedText }]}>
          Healthcare Workforce Intelligence
        </ThemedText>
      </View>

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        {/* Shift Check-in Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>
            How was your shift today?
          </ThemedText>
          
          {/* Sentiment Buttons */}
          <View style={styles.sentimentContainer}>
            <TouchableOpacity 
              style={[
                styles.sentimentButton, 
                { 
                  backgroundColor: selectedSentiment === 'happy' ? colors.primary : colors.background,
                  borderColor: selectedSentiment === 'happy' ? colors.primary : '#E5E5E5'
                }
              ]}
              onPress={() => handleSentimentSelect('happy')}
            >
              <ThemedText style={styles.sentimentEmoji}>😊</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sentimentButton, 
                { 
                  backgroundColor: selectedSentiment === 'mellow' ? colors.primary : colors.background,
                  borderColor: selectedSentiment === 'mellow' ? colors.primary : '#E5E5E5'
                }
              ]}
              onPress={() => handleSentimentSelect('mellow')}
            >
              <ThemedText style={styles.sentimentEmoji}>😐</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.sentimentButton, 
                { 
                  backgroundColor: selectedSentiment === 'sad' ? colors.primary : colors.background,
                  borderColor: selectedSentiment === 'sad' ? colors.primary : '#E5E5E5'
                }
              ]}
              onPress={() => handleSentimentSelect('sad')}
            >
              <ThemedText style={styles.sentimentEmoji}>😔</ThemedText>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.shiftInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Write about your shift... (optional)"
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={3}
            value={shiftInput}
            onChangeText={handleShiftInputChange}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                { 
                  backgroundColor: selectedSentiment ? colors.primary : colors.mutedText,
                  flex: 1,
                  marginRight: 8
                }
              ]}
              onPress={handleSubmitCheckIn}
              disabled={!selectedSentiment}
            >
              <ThemedText style={styles.submitButtonText}>
                Submit Check-in
              </ThemedText>
            </TouchableOpacity>

            {shiftInput.trim() && (
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  { 
                    backgroundColor: colors.secondary,
                    flex: 1,
                    marginLeft: 8
                  }
                ]}
                onPress={startChatMode}
              >
                <ThemedText style={styles.submitButtonText}>
                  Open Chat with Pip
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

        </View>

        {/* Wellness Tip Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>
            Wellness Tip
          </ThemedText>
          <ThemedText style={[styles.cardText, { color: colors.mutedText }]}>
            Take a 60-second breathing break. Inhale slowly through your nose, hold, and exhale through your mouth.
          </ThemedText>
        </View>

        {/* Facility Updates Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.primary }]}>
            Facility Updates
          </ThemedText>
          <ThemedText style={[styles.cardText, { color: colors.mutedText }]}>
            Your feedback has been shared. Staffing adjustments are being made on Unit C this week.
          </ThemedText>
          <TouchableOpacity style={styles.viewMoreButton}>
            <ThemedText style={[styles.viewMoreText, { color: colors.primary }]}>
              View More Updates
            </ThemedText>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* Fullscreen Chat Overlay */}
      {isFullScreen && (
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.chatOverlay,
              {
                backgroundColor: colors.card,
                transform: [
                  { translateY },
                  { scale }
                ]
              }
            ]}
          >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderContent}>
                <ThemedText style={[styles.chatTitle, { color: colors.primary }]}>
                  Chat with Pip
                </ThemedText>
                {storedShifts.length > 0 && (
                  <ThemedText style={[styles.shiftCount, { color: colors.secondary }]}>
                    {storedShifts.length} shift{storedShifts.length !== 1 ? 's' : ''} documented
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity onPress={collapseChat}>
                <ThemedText style={[styles.closeIcon, { color: colors.mutedText }]}>
                  ✕
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <View style={styles.chatMessages}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                style={{ backgroundColor: colors.background }}
              />
            </View>

            {/* Chat Input */}
            <View style={[styles.chatInputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.chatInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Tell me about your shift..."
                placeholderTextColor={colors.mutedText}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={onSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: isLoading ? colors.mutedText : colors.secondary }
                ]}
                onPress={onSend}
              >
                <ThemedText style={styles.sendLabel}>
                  {isLoading ? '...' : 'Send'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sentimentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sentimentButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  sentimentEmoji: {
    fontSize: 24,
  },
  shiftInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  chatModeButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  chatModeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  viewMoreButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  chatOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shiftCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    maxHeight: 500,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
