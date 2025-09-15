import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import ActionCenterScreen from './src/screens/ActionCenterScreen';

export type RootStackParamList = {
  Analytics: undefined;
  ActionCenter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'YourPipeline Analytics' }} />
        <Stack.Screen name="ActionCenter" component={ActionCenterScreen} options={{ title: 'Action Center' }} />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
