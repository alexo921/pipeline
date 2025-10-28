import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  onNavigateToChat: () => void;
}

type MoodDescriptor = {
  id: string;
  gradient: string[];
  expression: 'smile' | 'soft-smile' | 'neutral' | 'soft-frown' | 'frown';
};

const moodFaces: MoodDescriptor[] = [
  { id: 'frown', gradient: ['#FCD6E0', '#F7BFCB'], expression: 'frown' },
  { id: 'soft-frown', gradient: ['#FBDAD8', '#F6CECC'], expression: 'soft-frown' },
  { id: 'neutral', gradient: ['#F8E3D4', '#F3D2C3'], expression: 'neutral' },
  { id: 'soft-smile', gradient: ['#DDEEDB', '#C4E3CE'], expression: 'soft-smile' },
  { id: 'smile', gradient: ['#BCE4F4', '#A6D6F1'], expression: 'smile' },
];

const categories = [
  { title: 'Meditation', lessons: 12, gradient: ['#F7F5FF', '#D8D7FF'] },
  { title: 'Podcast', lessons: 12, gradient: ['#FFE6F4', '#F0C4EB'] },
  { title: 'Breathing', lessons: 12, gradient: ['#E5EEFF', '#8AB7FF'] },
];

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const MoodFace: React.FC<{ descriptor: MoodDescriptor }> = ({ descriptor }) => {
  const { gradient, expression } = descriptor;

  const mouthStyle = useMemo(() => {
    switch (expression) {
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
  }, [expression]);

  return (
    <LinearGradient colors={gradient} style={styles.moodCircle}>
      <View style={styles.eyeRow}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
      <View style={mouthStyle} />
    </LinearGradient>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChat }) => {
  const { user, pendingChats } = useAuth();
  const [chatDraft, setChatDraft] = useState('');

  const unreadCount = pendingChats.filter((chat) => chat.unread).length;
  const greetingName = user?.name ?? 'there';

  const surveyScale = useRef(new Animated.Value(1)).current;
  const notificationScale = useRef(new Animated.Value(1)).current;
  const categoryScales = useMemo(() => categories.map(() => new Animated.Value(1)), []);
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
      tension: 150,
    }).start();
  };

  const handleOpenChat = () => {
    setChatDraft('');
    onNavigateToChat();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F5F3FF', '#EAE9FF', '#EEF4FF']} style={styles.container}>
        <View style={styles.headerRow}>
          <LinearGradient colors={['#9ABEFF', '#D3A9FF']} style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color="#0B1F41" />
          </LinearGradient>
          <Text style={styles.greetingText}>{`Hi, ${greetingName}`}</Text>
          <View style={styles.headerSpacer} />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenChat}
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
            {unreadCount > 0 && (
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
            placeholder="Start a chat with PIP"
            placeholderTextColor="#A0A5B5"
            style={styles.chatInput}
            returnKeyType="send"
            onSubmitEditing={handleOpenChat}
          />
          <TouchableOpacity onPress={handleOpenChat}>
            <Ionicons name="send" size={18} color="#5F6B85" style={styles.chatMic} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>How was your day?</Text>
        <LinearGradient colors={['#F9F7FF', '#EEF0FF']} style={styles.moodCard}>
          <View style={styles.moodRow}>
            {moodFaces.map((mood) => (
              <TouchableOpacity key={mood.id} activeOpacity={0.9} style={styles.moodButton}>
                <MoodFace descriptor={mood} />
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Take your Survey</Text>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleOpenChat}
          onPressIn={() => animateScale(surveyScale, 0.96)}
          onPressOut={() => animateScale(surveyScale, 1)}
        >
          <AnimatedLinearGradient
            colors={['#E8E6FF', '#F3E0FF', '#F6E9FF']}
            style={[
              styles.surveyCard,
              {
                transform: [{ scale: surveyScale }],
              },
            ]}
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

        <Text style={styles.sectionTitle}>Popular category</Text>
        <View style={styles.categoriesRow}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.title}
              activeOpacity={0.95}
              onPressIn={() => animateScale(categoryScales[index], 0.96)}
              onPressOut={() => animateScale(categoryScales[index], 1)}
              style={styles.categoryTouchable}
            >
              <AnimatedLinearGradient
                colors={category.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.categoryCard,
                  {
                    transform: [{ scale: categoryScales[index] }],
                  },
                ]}
              >
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>{category.lessons} Lessons</Text>
              </AnimatedLinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottomNavShadow}>
          <LinearGradient colors={['#F9F8FF', '#F3F3FF']} style={styles.bottomNav}>
            <TouchableOpacity style={styles.bottomNavIcon} activeOpacity={0.8}>
              <Ionicons name="home" size={22} color="#0B1F41" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingButton} activeOpacity={0.85} onPress={handleOpenChat}>
              <LinearGradient colors={['#A7B6FF', '#DAA9FF']} style={styles.floatingGradient}>
                <Ionicons name="chatbubble" size={22} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavIcon} activeOpacity={0.8}>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 58,
    height: 58,
    borderRadius: 29,
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
    width: 24,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0B1F41',
  },
  mouthNeutral: {
    marginTop: 6,
    width: 22,
    height: 2,
    backgroundColor: '#0B1F41',
    borderRadius: 1,
  },
  mouthSoftSmile: {
    marginTop: 6,
    width: 26,
    height: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#0B1F41',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  mouthSmile: {
    marginTop: 6,
    width: 28,
    height: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#0B1F41',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  mouthSoftFrown: {
    marginTop: 6,
    width: 26,
    height: 10,
    borderTopWidth: 3,
    borderTopColor: '#0B1F41',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  mouthFrown: {
    marginTop: 6,
    width: 28,
    height: 12,
    borderTopWidth: 4,
    borderTopColor: '#0B1F41',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTouchable: {
    width: '30%',
  },
  categoryCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
    fontFamily: Platform.select({ ios: 'Avenir-Heavy', android: 'sans-serif-medium' }),
  },
  categorySubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#4D5360',
    fontFamily: Platform.select({ ios: 'Avenir', android: 'sans-serif' }),
  },
  spacer: {
    flex: 1,
  },
  bottomNavShadow: {
    paddingBottom: 32,
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

export default HomeScreen;
