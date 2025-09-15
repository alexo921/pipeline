import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import all screens
import JobsScreen from './src/screens/JobsScreen';
import ApplicantsScreen from './src/screens/ApplicantsScreen';
import YourPipelineScreen from './src/screens/YourPipelineScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ActionCenterScreen from './src/screens/ActionCenterScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Analytics: undefined;
  ActionCenter: undefined;
};

export type TabParamList = {
  Jobs: undefined;
  Applicants: undefined;
  YourPipeline: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Applicants') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'YourPipeline') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2466D0',
        tabBarInactiveTintColor: '#7691A4',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#F4F4F4',
        },
        headerTitleStyle: {
          color: '#01253F',
          fontSize: 18,
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: 'Jobs' }} />
      <Tab.Screen name="Applicants" component={ApplicantsScreen} options={{ title: 'Hiring Engine' }} />
      <Tab.Screen name="YourPipeline" component={YourPipelineScreen} options={{ title: 'YourPipeline' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="ActionCenter" component={ActionCenterScreen} options={{ title: 'Action Center' }} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
