import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { colors } from '../utils/constants';
import HomeScreen from '../screens/HomeScreen';
import WatchMatchScreen from '../screens/WatchMatchScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import SelectPlayersScreen from '../screens/SelectPlayersScreen';
import ScoringScreen from '../screens/ScoringScreen';
import InningsBreakScreen from '../screens/InningsBreakScreen';
import MatchSummaryScreen from '../screens/MatchSummaryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary },
      }}
    >
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin' }} />
      <AdminStack.Screen name="CreateMatch" component={CreateMatchScreen} options={{ title: 'New Match' }} />
      <AdminStack.Screen name="SelectPlayers" component={SelectPlayersScreen} options={{ title: 'Select Players' }} />
      <AdminStack.Screen name="Scoring" component={ScoringScreen} options={{ headerShown: false }} />
      <AdminStack.Screen name="InningsBreak" component={InningsBreakScreen} options={{ title: 'Innings Break', headerLeft: () => null }} />
      <AdminStack.Screen name="MatchSummary" component={MatchSummaryScreen} options={{ title: 'Match Summary', headerLeft: () => null }} />
      <AdminStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </AdminStack.Navigator>
  );
}

const HomeStack = createStackNavigator();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { color: colors.textPrimary },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Frontyard Cricket' }} />
      <HomeStack.Screen name="WatchMatch" component={WatchMatchScreen} options={{ title: 'Live Match' }} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏏</Text>,
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminStackNavigator}
        options={{
          tabBarLabel: 'Admin',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
