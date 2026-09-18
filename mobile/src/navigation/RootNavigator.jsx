import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, List, Search, PlusCircle, User, LayoutDashboard } from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth.js';
import { ICON_STROKE } from '../constants/icons.js';
import { color, font, text, space } from '../theme.js';

import HomeScreen from '../screens/public/HomeScreen.jsx';
import RegistryScreen from '../screens/public/RegistryScreen.jsx';
import TrackScreen from '../screens/public/TrackScreen.jsx';
import FileComplaintScreen from '../screens/public/FileComplaintScreen.jsx';
import LoginScreen from '../screens/citizen/LoginScreen.jsx';
import RegisterScreen from '../screens/citizen/RegisterScreen.jsx';
import VerifyOtpScreen from '../screens/citizen/VerifyOtpScreen.jsx';
import CitizenDashboardScreen from '../screens/citizen/DashboardScreen.jsx';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen.jsx';
import AdminActionScreen from '../screens/admin/AdminActionScreen.jsx';
import ComplaintDetailScreen from '../screens/admin/ComplaintDetailScreen.jsx';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// The web app's 14 flat routes map onto tabs + stacks. `ProtectedRoute` is gone:
// instead of mounting a screen that redirects, we render a different tab set per
// role, which is the idiomatic RN pattern and avoids a visible redirect flash.
const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: color.accent,
    background: color.bg,
    card: color.surface,
    text: color.textPrimary,
    border: color.border,
    notification: color.accent,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: color.surface },
  headerTitleStyle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  headerTintColor: color.textPrimary,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: color.bg },
};

const tabOptions = ({ icon: Icon, title }) => ({
  title,
  tabBarIcon: ({ color: c, size }) => <Icon size={size} strokeWidth={ICON_STROKE} color={c} />,
});

const CitizenTabs = () => (
  <Tab.Navigator
    screenOptions={{
      ...screenOptions,
      tabBarStyle: {
        backgroundColor: color.surface,
        borderTopColor: color.border,
        paddingTop: space[1],
      },
      tabBarActiveTintColor: color.accent,
      tabBarInactiveTintColor: color.textMuted,
      tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 11 },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={tabOptions({ icon: HomeIcon, title: 'Overview' })} />
    <Tab.Screen name="Registry" component={RegistryScreen} options={tabOptions({ icon: List, title: 'Registry' })} />
    <Tab.Screen name="File" component={FileComplaintScreen} options={tabOptions({ icon: PlusCircle, title: 'Report' })} />
    <Tab.Screen name="Track" component={TrackScreen} options={tabOptions({ icon: Search, title: 'Track' })} />
    <Tab.Screen name="Account" component={AccountStack} options={{ ...tabOptions({ icon: User, title: 'Account' }), headerShown: false }} />
  </Tab.Navigator>
);

// Logged-out users get Login/Register/VerifyOtp here; logged-in citizens get
// their dashboard in the same tab slot.
function AccountStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {user ? (
        <Stack.Screen name="CitizenDashboard" component={CitizenDashboardScreen} options={{ title: 'My Complaints' }} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ title: 'Verify Email' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      ...screenOptions,
      tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.border, paddingTop: space[1] },
      tabBarActiveTintColor: color.accent,
      tabBarInactiveTintColor: color.textMuted,
      tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 11 },
    }}
  >
    <Tab.Screen
      name="AdminHome"
      component={AdminStack}
      options={{ ...tabOptions({ icon: LayoutDashboard, title: 'Dashboard' }), headerShown: false }}
    />
    <Tab.Screen name="Registry" component={RegistryScreen} options={tabOptions({ icon: List, title: 'Registry' })} />
    <Tab.Screen name="Track" component={TrackScreen} options={tabOptions({ icon: Search, title: 'Track' })} />
    <Tab.Screen name="Account" component={AccountStack} options={{ ...tabOptions({ icon: User, title: 'Account' }), headerShown: false }} />
  </Tab.Navigator>
);

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="AdminAction" component={AdminActionScreen} options={{ title: 'Manage Complaints' }} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Complaint' }} />
    </Stack.Navigator>
  );
}

// dsn://track?id=COMP-XXXXX-X opens the Track tab with the ID prefilled — the
// native equivalent of the web app's /track?id= query-string links.
const linking = {
  prefixes: ['dsn://'],
  config: {
    screens: {
      Home: 'home',
      Registry: 'registry',
      File: 'file-complaint',
      Track: 'track',
      Account: { screens: { Login: 'login', Register: 'register' } },
    },
  },
};

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.boot}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {user?.role === 'admin' ? <AdminTabs /> : <CitizenTabs />}
    </NavigationContainer>
  );
};

const s = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
});

export default RootNavigator;
