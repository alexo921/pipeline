import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import type { ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NavChatIcon, NavHomeIcon, NavProfileIcon } from '../components/NavIcons';

type TwoStopGradient = readonly [string, string];

type MoodDescriptor = {
  id: string;
  gradient: TwoStopGradient;
  expression: 'smile' | 'soft-smile' | 'neutral' | 'soft-frown' | 'frown';
  label: string;
};

interface HomeScreenProps {
  onNavigateToChat: (draft?: string) => void;
  onNavigateToProfile: () => void;
}

const moodFaces: MoodDescriptor[] = [
  { id: 'frown', gradient: ['#FCD6E0', '#F7BFCB'] as TwoStopGradient, expression: 'frown', label: 'Burned Out' },
  { id: 'soft-frown', gradient: ['#FBDAD8', '#F6CECC'] as TwoStopGradient, expression: 'soft-frown', label: 'Stretched' },
  { id: 'neutral', gradient: ['#F8E3D4', '#F3D2C3'] as TwoStopGradient, expression: 'neutral', label: 'Balanced' },
  { id: 'soft-smile', gradient: ['#DDEEDB', '#C4E3CE'] as TwoStopGradient, expression: 'soft-smile', label: 'Good' },
  { id: 'smile', gradient: ['#BCE4F4', '#A6D6F1'] as TwoStopGradient, expression: 'smile', label: 'Great' },
];

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedUserIcon = Animated.createAnimatedComponent(Image);
const userIcon = require('../../assets/user-icon.png');
const mainTopBackground = require('../../assets/mobile-main-top.png');

const MoodFace: React.FC<{ descriptor: MoodDescriptor }> = ({ descriptor }) => {
  const mouthStyle = useMemo(() => {
    switch (descriptor.expression) {
      case 'smile':
        return styles.mouthSmile;
      case 'soft-smile':
        return styles.mouthSoftSmile;
      case 'soft-frown':
        return styles.mouthSoftFrown;
      case 'frown':
        return styles.mouthFrown;
      default:
        return styles.mouthNeutral;
    }
  }, [descriptor.expression]);

  return (
    <LinearGradient colors={descriptor.gradient} style={styles.moodCircle}>
      <View style={styles.eyeRow}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={mouthStyle} />
    </LinearGradient>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChat, onNavigateToProfile }) => {
  const { user, pendingChats } = useAuth();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const defaultMoodId = 'neutral';
  const defaultMoodLabel = moodFaces.find((m) => m.id === defaultMoodId)?.label ?? 'Balanced';

  const [chatDraft, setChatDraft] = useState('');
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>(defaultMoodId);
  const [surveyMood, setSurveyMood] = useState(defaultMoodLabel);
  const [surveyWentWell, setSurveyWentWell] = useState('');
  const [surveyWentWrong, setSurveyWentWrong] = useState('');
  const [surveySupport, setSurveySupport] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsCleared, setNotificationsCleared] = useState(false);

  const unreadCount = pendingChats.filter((chat) => chat.unread).length;
  const greetingName =
    user?.firstName || user?.lastName
      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      : user?.name ?? 'there';

  const surveyScale = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const notificationScale = useRef(new Animated.Value(1)).current;
  const bellSwing = useRef(new Animated.Value(0)).current;
  const bellAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (unreadCount > 0) {
      if (!bellAnimation.current) {
        bellAnimation.current = Animated.loop(
          Animated.sequence([
            Animated.timing(bellSwing, {
              toValue: 1,
              duration: 120,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(bellSwing, {
              toValue: -1,
              duration: 120,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(bellSwing, {
              toValue: 0,
              duration: 120,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.delay(600),
          ])
        );
      }
      bellAnimation.current?.start();
    } else {
      bellAnimation.current?.stop();
      bellSwing.setValue(0);
    }

    return () => {
      bellAnimation.current?.stop();
    };
  }, [unreadCount, bellSwing]);

  const animateScale = (value: Animated.Value, toValue: number) => {
    Animated.spring(value, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  };

  const currentMoodLabel = useMemo(
    () => moodFaces.find((m) => m.id === selectedMood)?.label ?? defaultMoodLabel,
    [selectedMood, defaultMoodLabel]
  );

  const notificationFeed = useMemo(() => {
    const pending = pendingChats.map((chat) => ({
      id: chat.id,
      title: chat.preview ?? 'New message from Pip',
      subtitle: chat.unread ? 'Tap to jump into the chat' : 'Opened',
      type: 'chat' as const,
    }));
    const seeded = [
      {
        id: 'shift-alert',
        title: 'Shift update posted',
        subtitle: 'Supervisor Alexis shared new staffing notes.',
        type: 'update' as const,
      },
      {
        id: 'wellness-reminder',
        title: 'Wellness tip',
        subtitle: 'Remember to log how you felt after your shift today.',
        type: 'reminder' as const,
      },
    ];
    return [...pending, ...seeded];
  }, [pendingChats]);

  const resetSurvey = () => {
    setSurveyMood(currentMoodLabel);
    setSurveyWentWell('');
    setSurveyWentWrong('');
    setSurveySupport('');
  };

  const handleStartChat = (draft?: string) => {
    const value = draft ?? chatDraft;
    setChatDraft('');
    setIsNotificationsOpen(false);
    onNavigateToChat(value);
  };

  const closeSurvey = () => {
    setIsSurveyOpen(false);
    resetSurvey();
  };

  const horizontalPadding = screenWidth < 360 ? 16 : 24;
  const ellipseWidth = screenWidth * 1.6;
  const ellipseHeight = ellipseWidth * (550 / 393);
  const ellipseStyle = useMemo<ImageStyle>(
    () => ({
      position: 'absolute',
      width: ellipseWidth,
      height: ellipseHeight,
      top: -ellipseHeight * 0.28,
      left: (screenWidth - ellipseWidth) / 2,
    }),
    [ellipseWidth, ellipseHeight, screenWidth]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screenWrapper}>
          <View style={[styles.topEllipseWrapper, ellipseStyle]} pointerEvents="none">
            <Image source={mainTopBackground} style={styles.topEllipseImage} resizeMode="cover" />
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + 44,
                paddingHorizontal: horizontalPadding,
                paddingBottom: insets.bottom + 16,
              },
            ]}
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.avatarTouchable}
                onPress={onNavigateToProfile}
                onPressIn={() => animateScale(avatarScale, 0.92)}
                onPressOut={() => animateScale(avatarScale, 1)}
              >
                <AnimatedUserIcon
                  source={userIcon}
                  style={[styles.userIconImage, { transform: [{ scale: avatarScale }] }]}
                />
              </TouchableOpacity>
              <Text style={styles.greetingText}>{`Hi, ${greetingName}`}</Text>
              <View style={styles.headerSpacer} />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setIsNotificationsOpen((prev) => !prev);
                  setNotificationsCleared(true);
                }}
                style={styles.notificationWrapper}
                onPressIn={() => animateScale(notificationScale, 0.92)}
                onPressOut={() => animateScale(notificationScale, 1)}
              >
                <AnimatedLinearGradient
                  colors={['#E9F0FF', '#ECF4FF']}
                  style={[
                    styles.bellCircle,
                    {
                      transform: [
                        { scale: notificationScale },
                        {
                          rotate: bellSwing.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: ['-12deg', '0deg', '12deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="notifications" size={20} color="#0B1F41" />
                </AnimatedLinearGradient>
                {unreadCount > 0 && !notificationsCleared && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
    
            <View style={styles.chatInputWrapper}>
              <TextInput
                value={chatDraft}
                onChangeText={setChatDraft}
                placeholder="Start a chat with Pip"
                placeholderTextColor="#A0A5B5"
                style={styles.chatInput}
                returnKeyType="send"
                onSubmitEditing={() => handleStartChat()}
              />
              <TouchableOpacity onPress={() => handleStartChat()}>
                <Ionicons name="send" size={18} color="#5F6B85" style={styles.chatMic} />
              </TouchableOpacity>
            </View>
    
            <Text style={styles.sectionTitle}>How was your day?</Text>
            <View style={styles.moodCard}>
              <View style={styles.moodRow}>
                {moodFaces.map((mood) => {
                  const isActive = selectedMood === mood.id;
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      activeOpacity={0.9}
                      style={styles.moodButton}
                      onPress={() => {
                        setSelectedMood(mood.id);
                        setSurveyMood(mood.label);
                      }}
                    >
                      <MoodFace descriptor={mood} />
                      {isActive && <View style={styles.moodIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
    
            {isNotificationsOpen && (
              <View
                pointerEvents="box-none"
                style={[
                  styles.notificationOverlay,
                  { paddingHorizontal: horizontalPadding, paddingTop: insets.top + 68 },
                ]}
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    setIsNotificationsOpen(false);
                    setNotificationsCleared(true);
                  }}
                >
                  <View style={styles.notificationBackdrop} />
                </TouchableWithoutFeedback>
                <View
                  style={[
                    styles.notificationPanel,
                    { width: Math.min(320, screenWidth - horizontalPadding * 2) },
                  ]}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>Notifications</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setIsNotificationsOpen(false);
                        setNotificationsCleared(true);
                      }}
                    >
                      <Ionicons name="close" size={18} color="#0B1F41" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                    {notificationFeed.length === 0 ? (
                      <View style={styles.notificationEmpty}>
                        <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                        <Text style={styles.notificationEmptyText}>You&apos;re all caught up!</Text>
                      </View>
                    ) : (
                      notificationFeed.map((item) => (
                        <View key={item.id} style={styles.notificationItem}>
                          <View style={styles.notificationIconWrapper}>
                            <Ionicons
                              name={
                                item.type === 'chat'
                                  ? 'chatbubble-ellipses'
                                  : item.type === 'update'
                                  ? 'briefcase'
                                  : 'sparkles'
                              }
                              size={18}
                              color="#0B1F41"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.notificationItemTitle}>{item.title}</Text>
                            <Text style={styles.notificationItemSubtitle}>{item.subtitle}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Take your Survey</Text>
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setIsSurveyOpen(true)}
              onPressIn={() => animateScale(surveyScale, 0.96)}
              onPressOut={() => animateScale(surveyScale, 1)}
            >
              <AnimatedLinearGradient
                colors={['#E8E6FF', '#F3E0FF', '#F6E9FF']}
                style={[styles.surveyCard, { transform: [{ scale: surveyScale }] }]}
              >
                <View>
                  <Text style={styles.surveyTitle}>{`Weekly\nPulse Survey`}</Text>
                  <View style={styles.surveyFooter}>
                    <LinearGradient colors={['#F2F3FF', '#FFFFFF']} style={styles.clockPill}>
                      <Ionicons name="time-outline" size={14} color="#0B1F41" />
                      <Text style={styles.clockText}>4 mins</Text>
                    </LinearGradient>
                  </View>
                </View>
                <LinearGradient colors={['#F8F6FF', '#FFFFFF']} style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={20} color="#0B1F41" />
                </LinearGradient>
              </AnimatedLinearGradient>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.bottomNavOuter,
                {
                  marginHorizontal: -horizontalPadding,
                  marginTop: -2,
                },
              ]}
            >
              <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNavWrapper}>
                  <View style={styles.bottomNavShadow} pointerEvents="none" />
                  <LinearGradient colors={['#FFFFFF', '#F6F7FF']} style={styles.bottomNav}>
                    <View style={styles.bottomNavHighlight} pointerEvents="none" />
                    <TouchableOpacity style={styles.bottomNavIcon} activeOpacity={0.8}>
                      <NavHomeIcon size={51} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.floatingButton}
                      activeOpacity={0.85}
                      onPress={() => handleStartChat()}
                    >
                      <View style={styles.chatIconWrapper}>
                        <NavChatIcon size={51} />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bottomNavIcon}
                      activeOpacity={0.8}
                      onPress={() => onNavigateToProfile()}
                    >
                      <NavProfileIcon size={51} />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={isSurveyOpen} transparent animationType="slide" onRequestClose={closeSurvey}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            style={styles.modalWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <LinearGradient colors={['#FFFFFF', '#F3F4FF']} style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Weekly Pulse Survey</Text>
                <TouchableOpacity onPress={closeSurvey}>
                  <Ionicons name="close" size={24} color="#0B1F41" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalLabel}>How are you feeling today?</Text>
                <View style={styles.moodSelectorRow}>
                  {moodFaces.map((mood) => {
                    const option = mood.label;
                    const isActive = surveyMood === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.moodPill, isActive && styles.moodPillActive]}
                        onPress={() => {
                          setSurveyMood(option);
                          setSelectedMood(mood.id);
                        }}
                      >
                        <Text style={[styles.moodPillText, isActive && styles.moodPillTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.modalLabel}>What went well this week?</Text>
                <TextInput
                  value={surveyWentWell}
                  onChangeText={setSurveyWentWell}
                  placeholder="Share a highlight from your shift"
                  placeholderTextColor="#9AA2B4"
                  multiline
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>What felt challenging?</Text>
                <TextInput
                  value={surveyWentWrong}
                  onChangeText={setSurveyWentWrong}
                  placeholder="Any blockers or concerns?"
                  placeholderTextColor="#9AA2B4"
                  multiline
                  style={styles.modalInput}
                />

                <Text style={styles.modalLabel}>How can leadership support you?</Text>
                <TextInput
                  value={surveySupport}
                  onChangeText={setSurveySupport}
                  placeholder="Let us know how we can help"
                  placeholderTextColor="#9AA2B4"
                  multiline
                  style={styles.modalInput}
                />
              </ScrollView>

              <TouchableOpacity style={styles.modalSubmit} onPress={closeSurvey}>
                <Text style={styles.modalSubmitText}>Submit Survey</Text>
              </TouchableOpacity>
            </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarTouchable: {
    padding: 4,
  },
  greetingText: {
    fontSize: 26,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
    color: '#1A1F36',
    marginLeft: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  notificationWrapper: {
    position: 'relative',
  },
  bellCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4D6D',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  notificationBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,16,32,0.2)',
  },
  notificationPanel: {
    width: 320,
    maxWidth: '100%',
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B1F41',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    zIndex: 21,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B1F41',
  },
  notificationEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  notificationEmptyText: {
    fontSize: 14,
    color: '#55607A',
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F8',
  },
  notificationIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF2FF',
  },
  notificationItemTitle: {
    fontSize: 14,
    color: '#0B1F41',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  notificationItemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chatInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1F174A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
  },
  chatInput: {
    flex: 1,
    color: '#1A1F36',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  chatMic: {
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    color: '#1A1F36',
    marginBottom: 16,
    fontWeight: '600',
    fontFamily: 'Baloo2-SemiBold',
    letterSpacing: 0,
  },
  moodCard: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 14,
    marginBottom: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
  },
  moodCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  eyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 16,
  },
  eye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0B1F41',
  },
  mouthNeutral: {
    marginTop: 6,
    width: 15,
    height: 2,
    backgroundColor: '#0B1F41',
    borderRadius: 1,
  },
  mouthSoftSmile: {
    marginTop: 6,
    width: 18,
    height: 7,
    borderBottomWidth: 2,
    borderBottomColor: '#0B1F41',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  mouthSmile: {
    marginTop: 6,
    width: 20,
    height: 8,
    borderBottomWidth: 3,
    borderBottomColor: '#0B1F41',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  mouthSoftFrown: {
    marginTop: 6,
    width: 18,
    height: 7,
    borderTopWidth: 2,
    borderTopColor: '#0B1F41',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mouthFrown: {
    marginTop: 6,
    width: 20,
    height: 8,
    borderTopWidth: 3,
    borderTopColor: '#0B1F41',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  moodIndicator: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B1F41',
  },
  surveyCard: {
    borderRadius: 26,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  surveyFooter: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clockText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1F41',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  arrowCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 3,
  },
  bottomNavContainer: {
    width: '84%',
    maxWidth: 320,
    borderRadius: 44,
    zIndex: 40,
    overflow: 'visible',
    alignSelf: 'center',
  },
  bottomNavOuter: {
    width: '85%',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 32,
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
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topEllipseWrapper: {
    position: 'absolute',
    zIndex: 0,
  },
  topEllipseImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
  userIconImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  bottomNavIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  chatIconWrapper: {
    width: '100%',
    height: '100%',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,16,32,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: '100%',
  },
  modalCard: {
    borderRadius: 28,
    padding: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
    color: '#0B1F41',
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalLabel: {
    fontSize: 15,
    color: '#1A1F36',
    marginBottom: 10,
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  moodSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  moodPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#E6E8F5',
  },
  moodPillActive: {
    backgroundColor: '#C4D8FF',
  },
  moodPillText: {
    fontSize: 14,
    color: '#41516A',
  },
  moodPillTextActive: {
    color: '#0B1F41',
    fontWeight: '600',
  },
  modalInput: {
    minHeight: 80,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E6F0',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
    fontSize: 14,
    color: '#1A1F36',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalSubmit: {
    marginTop: 4,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0B1F41',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
