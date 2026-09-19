import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GlassTabBar from '../components/GlassTabBar';
import { useApp } from '../context/AppContext';

import HomeScreen from '../screens/HomeScreen';
import RegistryScreen from '../screens/RegistryScreen';
import TrackScreen from '../screens/TrackScreen';
import ReportScreen from '../screens/ReportScreen';
import AccountScreen from '../screens/AccountScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminQueueScreen from '../screens/AdminQueueScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminQueue" component={AdminQueueScreen} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useApp();
  const isAdmin = user && user.role === 'admin';

  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000000' } }}
    >
      {isAdmin ? (
        <>
          <Tab.Screen name="Dashboard" component={AdminStack} options={{ title: 'Dashboard', tabBarIconName: 'grid' }} />
          <Tab.Screen name="Registry" component={RegistryScreen} options={{ title: 'Registry', tabBarIconName: 'list' }} />
          <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track', tabBarIconName: 'search' }} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIconName: 'home' }} />
          <Tab.Screen name="Registry" component={RegistryScreen} options={{ title: 'Registry', tabBarIconName: 'list' }} />
          <Tab.Screen name="Report" component={ReportScreen} options={{ title: 'Report', tabBarIconName: 'plus' }} />
          <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track', tabBarIconName: 'search' }} />
          <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account', tabBarIconName: 'user' }} />
        </>
      )}
    </Tab.Navigator>
  );
}
