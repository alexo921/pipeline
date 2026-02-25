import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import IntroScreen from './src/screens/IntroScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { getOnboardingComplete, setOnboardingComplete } from './src/storage/onboarding';

export type RootStackParamList = {
  Intro: undefined;
  Home: { animation?: 'slide_from_left' | 'slide_from_right' | 'default' } | undefined;
  Chat: { initialDraft?: string; animation?: 'slide_from_left' | 'slide_from_right' | 'default' } | undefined;
  Profile: { animation?: 'slide_from_left' | 'slide_from_right' | 'default' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeScreenWrapper: React.FC<{ navigation: any }> = ({ navigation }) => (
  <HomeScreen
    onNavigateToChat={(draft) =>
      navigation.navigate('Chat', { initialDraft: draft, animation: 'slide_from_right' })
    }
    onNavigateToProfile={() => navigation.navigate('Profile', { animation: 'slide_from_right' })}
  />
);

const ChatScreenWrapper: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => (
  <ChatScreen
    initialDraft={route?.params?.initialDraft ?? ''}
    onGoBack={() => navigation.navigate('Home', { animation: 'slide_from_left' })}
    onNavigateToProfile={() => navigation.navigate('Profile', { animation: 'slide_from_right' })}
  />
);

const AppNavigator: React.FC = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const { hydrated, user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const stored = await getOnboardingComplete();
      if (mounted) {
        setIsOnboarded(stored);
      }
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCompleteIntro = useCallback(async () => {
    await setOnboardingComplete(true);
    setIsOnboarded(true);
  }, []);

  const handleSkipIntro = useCallback(async () => {
    await setOnboardingComplete(true);
    setIsOnboarded(true);
  }, []);

  if (!hydrated || isOnboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0B1F41" />
      </View>
    );
  }

  const needsIntro = !isOnboarded;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {needsIntro ? (
        <Stack.Screen name="Intro">
          {() => <IntroScreen onComplete={handleCompleteIntro} onSkip={handleSkipIntro} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreenWrapper}
            options={({ route }) => ({
              headerShown: false,
              animation: (route.params as any)?.animation ?? 'slide_from_left',
            })}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreenWrapper}
            options={({ route }) => ({
              headerShown: false,
              animation: (route.params as any)?.animation ?? 'slide_from_right',
            })}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={({ route }) => ({
              headerShown: false,
              animation: (route.params as any)?.animation ?? 'slide_from_right',
            })}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0B1F41" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
