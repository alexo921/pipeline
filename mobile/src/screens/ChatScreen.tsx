import React, { useCallback, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type ChatMode = 'initial' | 'reply' | 'listening';

interface ChatScreenProps {
  onGoBack: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ onGoBack }) => {
  const [mode, setMode] = useState<ChatMode>('initial');
  const [draft, setDraft] = useState('');
  const { markChatsAsRead } = useAuth();

  useFocusEffect(
    useCallback(() => {
      markChatsAsRead();
    }, [markChatsAsRead])
  );

  const renderConversation = () => {
    if (mode === 'listening') {
      return (
        <View style={styles.listeningContainer}>
          <LinearGradient colors={["#A7B6FF", "#DAA9FF"]} style={styles.voiceOrb}>
            <Ionicons name="mic" size={32} color="#ffffff" />
          </LinearGradient>
          <TouchableOpacity style={styles.closeButton} onPress={() => setMode('initial')}>
            <Ionicons name="close" size={24} color="#0B1F41" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.messageColumn}>
        <TouchableOpacity activeOpacity={0.85} style={styles.historyLink}>
          <Text style={styles.historyText}>view previous messages</Text>
        </TouchableOpacity>

        <View style={styles.messageBubbleLeft}>
          <LinearGradient colors={["#A7B6FF", "#DAA9FF"]} style={styles.avatarSmall}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
          </LinearGradient>
          <View style={styles.messageContentLeft}>
            <Text style={styles.messageTag}>PIP</Text>
            <Text style={styles.messageText}>How was work today?</Text>
          </View>
        </View>

        {mode === 'reply' && (
          <View style={styles.messageBubbleRight}>
            <View style={styles.messageContentRight}>
              <Text style={styles.messageTagUser}>You</Text>
              <Text style={styles.messageText}>It was okay...</Text>
            </View>
            <LinearGradient colors={["#EDEEFF", "#F4F6FF"]} style={styles.avatarSmall}>
              <Ionicons name="person" size={18} color="#0B1F41" />
            </LinearGradient>
          </View>
        )}

        <View style={styles.privacyCard}>
          <Ionicons name="information-circle-outline" size={18} color="#647196" />
          <Text style={styles.privacyText}>
            All messages are anonymous and confidential. View our Privacy Policy
          </Text>
        </View>
      </View>
    );
  };

  const handleSend = () => {
    if (draft.trim().length === 0) {
      return;
    }
    setMode('reply');
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#F5F3FF", "#EAE9FF", "#EEF4FF"]} style={styles.container}>
        {renderConversation()}

        {mode !== 'listening' && (
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Message PIP"
              placeholderTextColor="#A0A5B5"
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="arrow-up" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.micButton} onPress={() => setMode('listening')}>
              <Ionicons name="mic" size={20} color="#0B1F41" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomNavShadow}>
          <LinearGradient colors={["#F9F8FF", "#F3F3FF"]} style={styles.bottomNav}>
            <TouchableOpacity style={styles.bottomNavIcon} onPress={onGoBack}>
              <Ionicons name="home" size={22} color="#0B1F41" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingButton} activeOpacity={0.85}>
              <LinearGradient colors={["#A7B6FF", "#DAA9FF"]} style={styles.floatingGradient}>
                <Ionicons name="chatbubble" size={22} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavIcon}>
              <Ionicons name="person-outline" size={22} color="#0B1F41" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6E6F8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  messageColumn: {
    flex: 1,
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
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  messageContentRight: {
    marginRight: 12,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  messageTag: {
    fontSize: 12,
    color: '#4C5C7A',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  messageTagUser: {
    fontSize: 12,
    color: '#7A869F',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  messageText: {
    fontSize: 16,
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 18,
    color: '#414A63',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  listeningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    right: 4,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0B1F41',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  micButton: {
    marginLeft: 12,
  },
  bottomNavShadow: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 40,
    paddingHorizontal: 28,
    paddingVertical: 16,
    shadowColor: '#6573FF',
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 6,
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
  },
  floatingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
