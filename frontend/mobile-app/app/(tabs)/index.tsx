import { useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { sendChatMessage, streamChatMessage, ChatMessage } from '@/services/chat';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', text: 'Hi! I can help with your healthcare shifts. What do you need today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: ChatMessage }) => (
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

  const keyExtractor = useMemo(() => (item: ChatMessage) => item.id, []);

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

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          style={styles.messagesList}
        />
        
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.mutedText}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={onSend}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <View style={[styles.sendButton, { backgroundColor: isLoading ? colors.mutedText : colors.primary }]}>
            <ThemedText style={styles.sendLabel} onPress={onSend}>
              {isLoading ? '...' : 'Send'}
            </ThemedText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
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
