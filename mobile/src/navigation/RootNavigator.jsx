import React from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, List, Search, PlusCircle, User, LayoutDashboard } from 'lucide-react-native';

import { useAuth } from '../hooks/useAuth.js';
import { color, font } from '../theme.js';

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

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: color.accent,
    background: color.bg,
    card: color.bg, // removed surface header for seamless look
    text: color.textPrimary,
    border: 'transparent',
    notification: color.accent,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: color.bg },
  headerTitleStyle: { fontFamily: font.sansBold, fontSize: 18, color: color.white },
  headerTintColor: color.white,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: color.bg },
  headerShown: false,
};

const tabOptions = ({ icon: Icon, title }) => ({
  title,
  tabBarIcon: ({ color: c, size }) => <Icon size={size} strokeWidth={2.4} color={c} />,
});

const tabBarStyle = {
  position: 'absolute',
  left: 14,
  right: 14,
  bottom: 14,
  height: 72,
  paddingBottom: 0,
  paddingHorizontal: 7,
  backgroundColor: 'rgba(30,22,28,0.85)', // simulated blur
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 38,
  elevation: 5,
};

const CitizenTabs = () => (
  <Tab.Navigator
    screenOptions={{
      ...screenOptions,
      tabBarStyle,
      tabBarActiveTintColor: color.accent,
      tabBarInactiveTintColor: '#8E8290',
      tabBarItemStyle: {
        borderRadius: 100,
        marginVertical: 4,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontFamily: font.sansBold, fontSize: 11, marginBottom: 4 },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={tabOptions({ icon: HomeIcon, title: 'Overview' })} />
    <Tab.Screen name="Registry" component={RegistryScreen} options={tabOptions({ icon: List, title: 'Registry' })} />
    <Tab.Screen name="File" component={FileComplaintScreen} options={tabOptions({ icon: PlusCircle, title: 'Report' })} />
    <Tab.Screen name="Track" component={TrackScreen} options={tabOptions({ icon: Search, title: 'Track' })} />
    <Tab.Screen name="Account" component={AccountStack} options={{ ...tabOptions({ icon: User, title: 'Account' }) }} />
  </Tab.Navigator>
);

function AccountStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
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

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      ...screenOptions,
      tabBarStyle,
      tabBarActiveTintColor: color.accent,
      tabBarInactiveTintColor: '#8E8290',
      tabBarItemStyle: {
        borderRadius: 100,
        marginVertical: 4,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontFamily: font.sansBold, fontSize: 11, marginBottom: 4 },
    }}
  >
    <Tab.Screen name="AdminHome" component={AdminStack} options={{ ...tabOptions({ icon: LayoutDashboard, title: 'Dashboard' }) }} />
    <Tab.Screen name="Registry" component={RegistryScreen} options={tabOptions({ icon: List, title: 'Registry' })} />
    <Tab.Screen name="Track" component={TrackScreen} options={tabOptions({ icon: Search, title: 'Track' })} />
    <Tab.Screen name="Account" component={AccountStack} options={{ ...tabOptions({ icon: User, title: 'Account' }) }} />
  </Tab.Navigator>
);

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
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
