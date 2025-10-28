import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import { AuthProvider } from './src/context/AuthContext';

export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeScreenWrapper: React.FC<{ navigation: any }> = ({ navigation }) => (
  <HomeScreen onNavigateToChat={() => navigation.navigate('Chat')} />
);

const ChatScreenWrapper: React.FC<{ navigation: any }> = ({ navigation }) => (
  <ChatScreen onGoBack={() => navigation.replace('Home')} />
);

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreenWrapper} />
          <Stack.Screen name="Chat" component={ChatScreenWrapper} />
        </Stack.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </AuthProvider>
  );
}
