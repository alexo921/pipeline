import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { NavChatIcon, NavHomeIconPip, NavProfileIconPip } from '../components/NavIcons';
import { createChatCompletion, ChatMessage, fetchChatHistory } from '../api/chat';
import { PIP_SYSTEM_PROMPT } from '../prompts/pipSpec';
import UserAvatar from '../../assets/mobile-user.svg';
import SubmitIcon from '../../assets/Submit.svg';

interface ChatScreenProps {
  onGoBack: () => void;
  onNavigateToProfile: () => void;
  initialDraft?: string;
}

type ChatMode = 'chat' | 'listening';

type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

const EllipseGlow: React.FC<{
  width: number;
  height: number;
  style?: any;
  gradientId: string;
}> = ({ width, height, style, gradientId }) => (
  <Svg width={width} height={height} style={style} viewBox={`0 0 ${width} ${height}`}>
    <Defs>
      <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="rgba(149,169,255,0.32)" stopOpacity="0.9" />
        <Stop offset="35%" stopColor="rgba(149,169,255,0.24)" stopOpacity="0.7" />
        <Stop offset="60%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0.45" />
        <Stop offset="80%" stopColor="rgba(149,169,255,0.12)" stopOpacity="0.25" />
        <Stop offset="100%" stopColor="rgba(149,169,255,0.10)" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width={width} height={height} fill={`url(#${gradientId})`} />
  </Svg>
);

const thinkingIcon = require('../../assets/pip-thinking.gif');
const pipBubbleIcon = require('../../assets/mobile-pip.png');

type MessageRowProps = {
  message: ConversationMessage;
  formatTimestamp: (isoString?: string) => string;
};

const MessageRow: React.FC<MessageRowProps> = React.memo(({ message, formatTimestamp }) => {
  if (message.role === 'assistant') {
    return (
      <View style={styles.messageBubbleLeft}>
        <Image source={pipBubbleIcon} style={styles.avatarImagePip} resizeMode="cover" />
        <View style={styles.messageContentLeft}>
          <Text style={styles.messageText}>{message.content}</Text>
          {!!formatTimestamp(message.createdAt) && (
            <Text style={styles.timestamp}>{formatTimestamp(message.createdAt)}</Text>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.messageBubbleRight}>
      <View style={styles.messageContentRight}>
        <Text style={styles.messageText}>{message.content}</Text>
        {!!formatTimestamp(message.createdAt) && (
          <Text style={[styles.timestamp, styles.timestampUser]}>{formatTimestamp(message.createdAt)}</Text>
        )}
      </View>
      <UserAvatar width={36} height={36} style={styles.avatarImageUser} />
    </View>
  );
});

const ChatScreen: React.FC<ChatScreenProps> = ({ onGoBack, onNavigateToProfile, initialDraft = '' }) => {
  const [mode, setMode] = useState<ChatMode>('chat');
  const [draft, setDraft] = useState(initialDraft);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'pip-welcome',
      role: 'assistant',
      content: 'How was work today?',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyCache, setHistoryCache] = useState<ConversationMessage[]>([]);
  const [historyDisplayCount, setHistoryDisplayCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { markChatsAsRead, user, hydrated } = useAuth();
  // Use logged-in userId when available, otherwise fall back to an anonymous session ID
  const userId = user?.id ?? 'anon-pip-demo';
  const micGlow = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<FlatList<ConversationMessage> | null>(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const infoOpacity = useRef(new Animated.Value(1)).current;
  const isAtBottomRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      markChatsAsRead();
      // Reset info banner whenever the screen is revisited
      setShowInfoBanner(true);
      infoOpacity.setValue(1);
    }, [markChatsAsRead])
  );

  useEffect(() => {
    // Preload thinking animation to avoid first-use delay
    Asset.fromModule(thinkingIcon).downloadAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micGlow, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(micGlow, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micGlow.stopAnimation();
      micGlow.setValue(0);
    }
  }, [mode, micGlow]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const hideInfoBanner = useCallback(() => {
    if (!showInfoBanner) return;
    Animated.timing(infoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowInfoBanner(false);
    });
  }, [infoOpacity, showInfoBanner]);

  const formatTimestamp = useCallback((isoString?: string) => {
    if (!isoString) {
      return '';
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }, []);

  const updateIsAtBottom = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 40;
    const atBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isAtBottomRef.current = atBottom;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || isSending || !hydrated) {
      return;
    }

    if (mode === 'listening') {
      setMode('chat');
    }

    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedDraft,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setDraft('');
    setErrorMessage(null);
    setIsSending(true);

    try {
      console.log('[Chat] sending message for user', userId);
      // Pull recent history to give Pip extra context (most recent first).
      let systemPrompt = PIP_SYSTEM_PROMPT;
      try {
        const history = await fetchChatHistory(userId, 100);
        if (history && history.length > 0) {
          const contextLines = history.map((item, index) => `${index + 1}. ${item.message ?? ''}`).join('\n');
          systemPrompt = `${PIP_SYSTEM_PROMPT}\n\nContext from last chats (newest first):\n${contextLines}`;
        }
      } catch {
        // If history fetch fails, continue with base prompt
      }

      const payload: ChatMessage[] = nextHistory.map(({ role, content }) => ({
        role,
        content,
      }));

      const completion = await createChatCompletion(payload, systemPrompt, undefined, userId);
      const pipContent = completion.message?.content?.trim();
      if (pipContent) {
        const assistantCreatedAt = completion.created
          ? new Date(completion.created * 1000).toISOString()
          : new Date().toISOString();
        setMessages((prev) => [
          ...prev,
          {
            id: completion.id ?? `pip-${Date.now()}`,
            role: 'assistant',
            content: pipContent,
            createdAt: assistantCreatedAt,
          },
        ]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Pip is taking a moment. Please try again.';
      setErrorMessage(msg);
      // eslint-disable-next-line no-console
      console.warn('[Chat] send failed', msg, error);
    } finally {
      setIsSending(false);
    }
  }, [draft, hydrated, isSending, messages, mode, userId]);

  useEffect(() => {
    if (mode === 'chat' && isAtBottomRef.current) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, mode]);

  const renderMessage = useCallback(
    ({ item }: { item: ConversationMessage }) => (
      <MessageRow message={item} formatTimestamp={formatTimestamp} />
    ),
    [formatTimestamp]
  );

  const keyExtractor = useCallback((item: ConversationMessage) => item.id, []);

  const handleLoadHistory = useCallback(async () => {
    if (!hydrated || isLoadingHistory) {
      return;
    }
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      // If we haven't fetched history yet, grab a batch (up to 40)
      if (historyCache.length === 0) {
        console.log('[Chat] fetching history for user', userId);
        const history = await fetchChatHistory(userId, 40);
        console.log('[Chat] history result count', history?.length ?? 0);
        const historyMessages: ConversationMessage[] = (history ?? [])
          .slice()
          .reverse()
          .map((item) => ({
            id: item.id,
            role: item.role === 'user' ? 'user' : 'assistant',
            content: item.message ?? '',
            createdAt: item.createdAt,
          }));
        setHistoryCache(historyMessages);
        const initialCount = Math.min(historyMessages.length, 5);
        if (initialCount > 0) {
          setMessages((prev) => [...historyMessages.slice(0, initialCount), ...prev]);
          setHistoryDisplayCount(initialCount);
          setHistoryLoaded(historyMessages.length <= initialCount);
        } else {
          setErrorMessage('No previous messages found.');
          setHistoryLoaded(true);
        }
      } else {
        if (historyDisplayCount >= historyCache.length) {
          setHistoryLoaded(true);
          setErrorMessage('No more previous messages.');
          return;
        }
        const nextCount = Math.min(historyDisplayCount + 1, historyCache.length);
        const toAdd = historyCache.slice(historyDisplayCount, nextCount);
        if (toAdd.length > 0) {
          setMessages((prev) => [...toAdd, ...prev]);
          setHistoryDisplayCount(nextCount);
          setHistoryLoaded(nextCount >= historyCache.length);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load previous messages.';
      setErrorMessage(message);
      console.warn('[Chat] history fetch failed', message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyCache, historyDisplayCount, hydrated, isLoadingHistory, userId]);

  return (
    <View style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundLayer}>
        <EllipseGlow width={500} height={620} gradientId="pipGlowTop" style={styles.topEllipse} />
        <EllipseGlow width={300} height={320} gradientId="pipGlowBottom" style={styles.bottomEllipse} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.contentLayer}>
          {/** Floating title, no container box */}
          <Text style={[styles.headerTitle, { position: 'absolute', top: insets.top + 8, alignSelf: 'center' }]}>
            Pip
          </Text>

          <View style={styles.container}>
            <View style={[styles.conversationArea, { paddingTop: insets.top + 44 }]}>
              {mode === 'listening' ? (
                <View style={styles.listeningContainer}>
                  <Animated.View
                    style={[
                      styles.listeningPulse,
                      {
                        opacity: micGlow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                        transform: [
                          {
                            scale: micGlow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }),
                          },
                        ],
                      },
                    ]}
                  />
                  <LinearGradient colors={['#A7B6FF', '#DAA9FF']} style={styles.voiceOrb}>
                    <Ionicons name="mic" size={32} color="#ffffff" />
                  </LinearGradient>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setMode('chat')}>
                    <Ionicons name="close" size={24} color="#0B1F41" />
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  ref={scrollViewRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={keyExtractor}
                  style={styles.messageScroll}
                  contentContainerStyle={[
                    styles.messageColumn,
                    { paddingBottom: isKeyboardVisible ? 32 : 180 },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator
                  scrollIndicatorInsets={{ right: 1 }}
                  contentInsetAdjustmentBehavior="never"
                  onScrollEndDrag={updateIsAtBottom}
                  onMomentumScrollEnd={updateIsAtBottom}
                  onContentSizeChange={() => {
                    if (mode === 'chat' && isAtBottomRef.current) {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }
                  }}
                  removeClippedSubviews
                  initialNumToRender={12}
                  maxToRenderPerBatch={8}
                  windowSize={7}
                  ListHeaderComponent={
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.historyLink}
                      onPress={handleLoadHistory}
                      disabled={isLoadingHistory || historyLoaded}
                    >
                      <Text style={styles.historyText}>
                        {historyLoaded ? 'Previous messages loaded' : isLoadingHistory ? 'Loading...' : 'view previous messages'}
                      </Text>
                    </TouchableOpacity>
                  }
                  ListFooterComponent={
                    <>
                      {isSending && (
                        <View style={styles.messageBubbleLeft}>
                          <View style={styles.thinkingAvatar}>
                            <Image source={thinkingIcon} style={styles.thinkingGif} resizeMode="cover" />
                          </View>
                          <View style={styles.messageContentLeft}>
                            <Text style={styles.messageTag}>Pip</Text>
                            <Text style={styles.typingText}>thinking...</Text>
                          </View>
                        </View>
                      )}
                      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
                    </>
                  }
                />
              )}
            </View>

              <View
                style={[
                  styles.bottomStack,
                  {
                    paddingBottom: isKeyboardVisible ? Math.max(insets.bottom - 8, 0) : insets.bottom + 12,
                    paddingTop: isKeyboardVisible ? 0 : 8,
                    gap: isKeyboardVisible ? 4 : 16,
                    marginBottom: 0,
                  },
                ]}
              >
                {mode !== 'listening' && (
                  <>
                    {showInfoBanner && (
                      <Animated.View style={[styles.infoBanner, { opacity: infoOpacity }]}>
                        <Ionicons name="information-circle-outline" size={18} color="#8F97AA" />
                        <Text style={styles.infoText}>
                          All messages are anonymous and confidential. View our{' '}
                          <Text style={styles.infoLink}>Privacy Policy</Text>
                        </Text>
                      </Animated.View>
                    )}
                    <View style={styles.inputRow}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          placeholder="Message Pip"
                          placeholderTextColor="#A0A5B5"
                          style={styles.input}
                          value={draft}
                          onChangeText={setDraft}
                          multiline
                          scrollEnabled
                          returnKeyType="default"
                          onSubmitEditing={handleSend}
                          onFocus={hideInfoBanner}
                        />
                        <View style={styles.inlineControls}>
                          <TouchableOpacity
                            style={styles.micButton}
                            onPress={() => {
                              hideInfoBanner();
                              setMode('listening');
                            }}
                          >
                            <Ionicons name="mic-outline" size={20} color="#0B1F41" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.rightControls}>
                        <TouchableOpacity
                          style={styles.sendButton}
                          onPress={() => {
                            hideInfoBanner();
                            handleSend();
                          }}
                        >
                          <SubmitIcon width={38} height={38} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                {!isKeyboardVisible && (
                  <View style={styles.bottomNavOuter} pointerEvents="box-none">
                    <Animated.View style={styles.bottomNavContainer} pointerEvents="box-none">
                      <View style={styles.bottomNavWrapper} pointerEvents="box-none">
                        <View style={styles.bottomNavShadow} pointerEvents="none" />
                        <LinearGradient colors={['#FFFFFF', '#F6F7FF']} style={styles.bottomNav}>
                          <View style={styles.bottomNavHighlight} pointerEvents="none" />
                          <TouchableOpacity style={styles.bottomNavIcon} onPress={onGoBack}>
                            <NavHomeIconPip size={51} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.floatingButton} activeOpacity={0.85}>
                            <View style={styles.chatIconWrapper}>
                              <NavChatIcon size={51} />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.bottomNavIcon} onPress={onNavigateToProfile}>
                            <NavProfileIconPip size={51} />
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>
                    </Animated.View>
                  </View>
                )}
              </View>
            </View>
          </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoider: {
    flex: 1,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
    overflow: 'visible',
    minHeight: 0,
  },
  ellipseLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -2,
  },
  topEllipse: {
    position: 'absolute',
    top: -150,
    left: -180,
    opacity: 0.5,
    width: 600,
    height: 420,
    borderRadius: 260,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: 50,
    right: -150,
    opacity: 0.5,
    width: 320,
    height: 320,
    borderRadius: 260,
  },
  conversationArea: {
    flex: 1,
    minHeight: 0,
    paddingTop: 0,
  },
  messageScroll: {
    flex: 1,
    minHeight: 0,
  },
  headerTitle: {
    fontSize: 23.18,
    fontWeight: '800',
    color: '#0B1F41',
    fontFamily: 'Baloo',
  },
  messageColumn: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  historyLink: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  historyText: {
    fontSize: 14,
    color: '#94A0C4',
    letterSpacing: 0.4,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#D25565',
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  messageBubbleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  messageBubbleRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  thinkingAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  thinkingGif: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarImagePip: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarImageUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageContentLeft: {
    marginLeft: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    maxWidth: '78%',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  messageContentRight: {
    marginRight: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#EEF1FA',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    maxWidth: '78%',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  messageTag: {
    fontSize: 12,
    color: '#4C5C7A',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Baloo',
  },
  messageTagUser: {
    fontSize: 12,
    color: '#7A869F',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Baloo',
  },
  messageText: {
    fontSize: 16,
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
    flexShrink: 1,
    flexWrap: 'wrap',
    width: '100%',
    overflow: 'hidden',
    // RN Web support
    wordBreak: 'break-word' as any,
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: '#7A869F',
    alignSelf: 'flex-start',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  timestampUser: {
    alignSelf: 'flex-end',
    color: '#6A74A0',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6A74A0',
    fontFamily: 'Baloo',
  },
  listeningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningPulse: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#C6CEF9',
  },
  voiceOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#AFB7FF',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  inlineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  bottomStack: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    alignSelf: 'stretch',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5D667A',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  infoLink: {
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
    color: '#4F587A',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
  },
  micButton: {
    marginLeft: 10,
  },
  bottomNavOuter: {
    width: '85%',
    alignItems: 'center',
    marginHorizontal: -24,
  },
  bottomNavContainer: {
    width: '84%',
    maxWidth: 320,
    borderRadius: 44,
    overflow: 'visible',
    alignSelf: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 44,
    paddingHorizontal: 26,
    paddingVertical: 6,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  bottomNavHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'transparent',
  },
  bottomNavIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6573FF',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  chatIconWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  bottomNavShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    shadowColor: '#7B84D6',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 21,
    elevation: 12,
  },
});

export default ChatScreen;
