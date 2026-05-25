import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import LandingScreen from '../screens/LandingScreen';
import HomeScreen from '../screens/HomeScreen';
import WatchMatchScreen from '../screens/WatchMatchScreen';
import AdminHomeScreen from '../screens/AdminHomeScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import SelectPlayersScreen from '../screens/SelectPlayersScreen';
import ScoringScreen from '../screens/ScoringScreen';
import InningsBreakScreen from '../screens/InningsBreakScreen';
import MatchSummaryScreen from '../screens/MatchSummaryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();
const NewMatchStack = createStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    shadowOpacity: 0, elevation: 0,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  headerBackTitleVisible: false,
};

function TabIcon({ label, active }) {
  return (
    <View style={tabIconStyles.wrapper}>
      <Text numberOfLines={1} style={[tabIconStyles.label, active && tabIconStyles.labelActive]}>{label}</Text>
      {active && <View style={tabIconStyles.indicator} />}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', paddingTop: 2, width: 72 },
  label: { fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 },
  labelActive: { color: colors.primary, fontWeight: '800' },
  indicator: { width: 28, height: 3, borderRadius: 2, backgroundColor: colors.primary, marginTop: 4 },
});

function NewMatchStackNavigator() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <LoginScreen isEmbedded />;
  return (
    <NewMatchStack.Navigator screenOptions={screenOptions}>
      <NewMatchStack.Screen name="CreateMatch" component={CreateMatchScreen} options={{ title: 'New Match' }} />
      <NewMatchStack.Screen name="SelectPlayers" component={SelectPlayersScreen} options={{ title: 'Select Players' }} />
      <NewMatchStack.Screen name="Scoring" component={ScoringScreen} options={{ headerShown: false }} />
      <NewMatchStack.Screen name="InningsBreak" component={InningsBreakScreen} options={{ title: 'Innings Break', headerLeft: () => null }} />
      <NewMatchStack.Screen name="MatchSummary" component={MatchSummaryScreen} options={{ title: 'Match Summary', headerLeft: () => null }} />
    </NewMatchStack.Navigator>
  );
}

function AdminStackNavigator() {
  return (
    <AdminStack.Navigator screenOptions={screenOptions}>
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin' }} />
      <AdminStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </AdminStack.Navigator>
  );
}

const HomeStack = createStackNavigator();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

const MatchesStack = createStackNavigator();
function MatchesStackNavigator() {
  return (
    <MatchesStack.Navigator screenOptions={screenOptions}>
      <MatchesStack.Screen name="MatchesList" component={HomeScreen} options={{ title: 'Matches' }} />
      <MatchesStack.Screen name="WatchMatch" component={WatchMatchScreen} options={{ title: 'Live Match' }} />
    </MatchesStack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + insets.bottom;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="HOME" active={focused} />,
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MatchesStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="MATCHES" active={focused} />,
        }}
      />
      <Tab.Screen
        name="NewMatch"
        component={NewMatchStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="+ MATCH" active={focused} />,
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="ADMIN" active={focused} />,
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

