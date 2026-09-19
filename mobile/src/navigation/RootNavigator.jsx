import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GlassTabBar from '../components/GlassTabBar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { color } from '../theme.js';

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

const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: color.accent,
    background: color.bg,
    card: color.bg,
    text: color.textPrimary,
    border: 'transparent',
    notification: color.accent,
  },
};

// Tabs swap instantly — no cross-fade, no shift. The only motion when changing
// tabs is the pill travelling in the bar itself.
const tabScreenOptions = { 
  lazy: false,
  headerShown: false,
  animation: 'none',
  sceneStyle: { backgroundColor: color.bg },
};

// Pushing within a stack slides, as the reference's AdminStack did.
const stackScreenOptions = {
  lazy: false,
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: color.bg },
};

const CitizenTabs = () => (
  <Tab.Navigator tabBar={(props) => <GlassTabBar {...props} />} screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Home', tabBarIconName: 'home' }}
    />
    <Tab.Screen
      name="Registry"
      component={RegistryScreen}
      options={{ title: 'Registry', tabBarIconName: 'list' }}
    />
    <Tab.Screen
      name="File"
      component={FileComplaintScreen}
      options={{ title: 'Report', tabBarIconName: 'plus' }}
    />
    <Tab.Screen
      name="Track"
      component={TrackScreen}
      options={{ title: 'Track', tabBarIconName: 'search' }}
    />
    <Tab.Screen
      name="Account"
      component={AccountStack}
      options={{ title: 'Account', tabBarIconName: 'user' }}
    />
  </Tab.Navigator>
);

function AccountStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {user ? (
        <Stack.Screen name="CitizenDashboard" component={CitizenDashboardScreen} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

// Three tabs, matching the reference: an admin has no profile to manage, and
// the Account tab previously shown here rendered the citizen dashboard, whose
// /complaints/my-complaints call 403s for an admin account.
const AdminTabs = () => (
  <Tab.Navigator tabBar={(props) => <GlassTabBar {...props} />} screenOptions={tabScreenOptions}>
    <Tab.Screen
      name="Dashboard"
      component={AdminStack}
      options={{ title: 'Dashboard', tabBarIconName: 'grid' }}
    />
    <Tab.Screen
      name="Registry"
      component={RegistryScreen}
      options={{ title: 'Registry', tabBarIconName: 'list' }}
    />
    <Tab.Screen
      name="Track"
      component={TrackScreen}
      options={{ title: 'Track', tabBarIconName: 'search' }}
    />
  </Tab.Navigator>
);

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminAction" component={AdminActionScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
    </Stack.Navigator>
  );
}

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
  const wasSignedIn = useRef(false);

  // Signing in as a citizen doesn't swap navigators — only the Account tab's
  // stack changes Login -> CitizenDashboard — so the app stayed on the Account
  // tab and looked like it had dropped you into your profile. Admin only seemed
  // to behave because switching to AdminTabs mounts a fresh navigator at its
  // first tab.
  //
  // Remounting via a key doesn't fix it: on web the linking config restores the
  // tab from the URL, so it lands right back on Account. Navigating explicitly
  // works on both targets.
  useEffect(() => {
    const signedIn = Boolean(user);
    const justSignedIn = signedIn && !wasSignedIn.current;
    wasSignedIn.current = signedIn;

    if (!justSignedIn || !navigationRef.isReady()) return;

    // Admins hit the same thing on web: the URL restores /CitizenDashboard, so
    // they land on Account too. It only looks right on a device, where there is
    // no URL and swapping to AdminTabs mounts fresh at its first tab. Sending
    // both roles to their home tab explicitly makes the two targets agree.
    navigationRef.navigate(user.role === 'admin' ? 'Dashboard' : 'Home');
  }, [user]);

  if (loading) {
    return (
      <View style={s.boot}>
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      {user?.role === 'admin' ? <AdminTabs /> : <CitizenTabs />}
      <GlobalPeek />
    </NavigationContainer>
  );
};

const s = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
});

import { GlobalPeek } from "../components/GlobalPeek.jsx";

export default RootNavigator;
