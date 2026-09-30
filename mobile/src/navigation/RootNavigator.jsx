
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
import SetPasswordScreen from '../screens/citizen/SetPasswordScreen.jsx';
import ResearchApplyScreen from '../screens/citizen/ResearchApplyScreen.jsx';
import CitizenDashboardScreen from '../screens/citizen/DashboardScreen.jsx';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen.jsx';
import AdminActionScreen from '../screens/admin/AdminActionScreen.jsx';
import ComplaintDetailScreen from '../screens/admin/ComplaintDetailScreen.jsx';
import PeopleScreen from '../screens/admin/PeopleScreen.jsx';
import UserFormScreen from '../screens/admin/UserFormScreen.jsx';
import ResearchApplicationsScreen from '../screens/admin/ResearchApplicationsScreen.jsx';
import LeaveApprovalsScreen from '../screens/admin/LeaveApprovalsScreen.jsx';
import ResearchAuditScreen from '../screens/admin/ResearchAuditScreen.jsx';

import MyTasksScreen from '../screens/field/MyTasksScreen.jsx';
import CompletedTasksScreen from '../screens/field/CompletedTasksScreen.jsx';
import TaskDetailScreen from '../screens/field/TaskDetailScreen.jsx';
import FieldProfileScreen from '../screens/field/FieldProfileScreen.jsx';

import QueueScreen from '../screens/supervisor/QueueScreen.jsx';
import TriageDetailScreen from '../screens/supervisor/TriageDetailScreen.jsx';
import AssignScreen from '../screens/supervisor/AssignScreen.jsx';
import FieldStaffScreen from '../screens/supervisor/FieldStaffScreen.jsx';
import SupervisorProfileScreen from '../screens/supervisor/SupervisorProfileScreen.jsx';

import InsightsScreen from '../screens/research/InsightsScreen.jsx';
import ExportScreen from '../screens/research/ExportScreen.jsx';
import ResearchProfileScreen from '../screens/research/ResearchProfileScreen.jsx';
import ResearchExpiredScreen from '../screens/research/ResearchExpiredScreen.jsx';

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
//
// `lazy: false` mounts every tab up front, which is what removes the first-open
// jank. The cost is that a tab's screen exists before anyone opens it, so
// screens must fetch on *focus* (useAutoRefresh), never on mount — otherwise a
// role with four tabs fires four requests at launch.
const tabScreenOptions = {
  lazy: false,
  headerShown: false,
  animation: 'none',
  sceneStyle: { backgroundColor: color.bg },
};

// Pushing within a stack slides, as the reference's AdminStack did.
// (`lazy` is not a native-stack option — it was silently ignored here — so it is
// no longer set.)
const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: color.bg },
};

const glassBar = (props) => <GlassTabBar {...props} />;

// ─── Citizen (and logged-out) ────────────────────────────────────────────────

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
          <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
          <Stack.Screen name="ResearchApply" component={ResearchApplyScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const CitizenTabs = () => (
  <Tab.Navigator tabBar={glassBar} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', tabBarIconName: 'home' }} />
    <Tab.Screen name="Registry" component={RegistryScreen} options={{ title: 'Registry', tabBarIconName: 'list' }} />
    <Tab.Screen name="File" component={FileComplaintScreen} options={{ title: 'Report', tabBarIconName: 'plus' }} />
    <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track', tabBarIconName: 'search' }} />
    <Tab.Screen name="Account" component={AccountStack} options={{ title: 'Account', tabBarIconName: 'user' }} />
  </Tab.Navigator>
);

// ─── Researcher ──────────────────────────────────────────────────────────────

const InsightsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="InsightsHome" component={InsightsScreen} />
    <Stack.Screen name="Export" component={ExportScreen} />
  </Stack.Navigator>
);

const ResearchTabs = () => (
  <Tab.Navigator tabBar={glassBar} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Insights" component={InsightsStack} options={{ title: 'Insights', tabBarIconName: 'grid' }} />
    <Tab.Screen name="Registry" component={RegistryScreen} options={{ title: 'Registry', tabBarIconName: 'list' }} />
    <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track', tabBarIconName: 'search' }} />
    <Tab.Screen name="Profile" component={ResearchProfileScreen} options={{ title: 'Profile', tabBarIconName: 'user' }} />
  </Tab.Navigator>
);

// Once access has ended the tabs are replaced outright: every research call is
// refused server-side, so leaving them up would be a wall of failed requests.
const ResearchExpiredStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="ResearchExpired" component={ResearchExpiredScreen} />
    <Stack.Screen name="ResearchApply" component={ResearchApplyScreen} />
  </Stack.Navigator>
);

// ─── Field employee ──────────────────────────────────────────────────────────

const TasksStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="TasksList" component={MyTasksScreen} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
  </Stack.Navigator>
);

const CompletedStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="CompletedList" component={CompletedTasksScreen} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
  </Stack.Navigator>
);

const FieldTabs = () => (
  <Tab.Navigator tabBar={glassBar} screenOptions={tabScreenOptions}>
    <Tab.Screen name="MyTasks" component={TasksStack} options={{ title: 'My Tasks', tabBarIconName: 'list' }} />
    <Tab.Screen name="Completed" component={CompletedStack} options={{ title: 'Completed', tabBarIconName: 'check' }} />
    <Tab.Screen name="Profile" component={FieldProfileScreen} options={{ title: 'Profile', tabBarIconName: 'user' }} />
  </Tab.Navigator>
);

// ─── Supervisor ──────────────────────────────────────────────────────────────

const QueueStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="QueueList" component={QueueScreen} />
    <Stack.Screen name="TriageDetail" component={TriageDetailScreen} />
    <Stack.Screen name="Assign" component={AssignScreen} />
  </Stack.Navigator>
);

const SupervisorTabs = () => (
  <Tab.Navigator tabBar={glassBar} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Queue" component={QueueStack} options={{ title: 'Queue', tabBarIconName: 'list' }} />
    <Tab.Screen name="FieldStaff" component={FieldStaffScreen} options={{ title: 'Field Staff', tabBarIconName: 'grid' }} />
    <Tab.Screen name="Track" component={TrackScreen} options={{ title: 'Track', tabBarIconName: 'search' }} />
    <Tab.Screen name="Profile" component={SupervisorProfileScreen} options={{ title: 'Profile', tabBarIconName: 'user' }} />
  </Tab.Navigator>
);

// ─── Admin ───────────────────────────────────────────────────────────────────
//
// No Profile tab: the admin console has no profile to manage (an earlier build
// added one and it was rightly rejected). Sign-out lives in the Stats header.
// Landing stays on Stats, the dashboard admins already knew.

const StatsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
  </Stack.Navigator>
);

// Opening a complaint keeps the admin's status override (ComplaintDetail) and adds
// the same workflow actions supervisors have (TriageDetail / Assign).
const ComplaintsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="AdminAction" component={AdminActionScreen} />
    <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} />
    <Stack.Screen name="TriageDetail" component={TriageDetailScreen} />
    <Stack.Screen name="Assign" component={AssignScreen} />
  </Stack.Navigator>
);

const PeopleStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen name="PeopleList" component={PeopleScreen} />
    <Stack.Screen name="UserForm" component={UserFormScreen} />
    <Stack.Screen name="ResearchApplications" component={ResearchApplicationsScreen} />
    <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
    <Stack.Screen name="ResearchAudit" component={ResearchAuditScreen} />
  </Stack.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator tabBar={glassBar} screenOptions={tabScreenOptions}>
    <Tab.Screen name="Dashboard" component={StatsStack} options={{ title: 'Stats', tabBarIconName: 'grid' }} />
    <Tab.Screen name="Complaints" component={ComplaintsStack} options={{ title: 'Complaints', tabBarIconName: 'list' }} />
    <Tab.Screen name="People" component={PeopleStack} options={{ title: 'People', tabBarIconName: 'user' }} />
  </Tab.Navigator>
);

// ─── Routing by role ─────────────────────────────────────────────────────────

const linking = {
  prefixes: ['dsn://'],
  config: {
    screens: {
      Home: 'home',
      Registry: 'registry',
      File: 'file-complaint',
      Track: 'track',
      Account: {
        screens: {
          Login: 'login',
          Register: 'register',
          SetPassword: 'set-password',
          ResearchApply: 'research-apply',
        },
      },
    },
  },
};

const isResearchExpired = (user) => {
  if (user?.role !== 'researcher') return false;
  const ends = user.researcher?.accessExpiresAt;
  return !ends || new Date(ends).getTime() <= Date.now();
};

// The SERVER's role decides the tab set — the login pill only picks which form to
// show. Each role's first tab is where they land after signing in.
const LANDING = {
  citizen: 'Home',
  researcher: 'Insights',
  field: 'MyTasks',
  supervisor: 'Queue',
  admin: 'Dashboard',
};

const tabsFor = (user) => {
  switch (user?.role) {
    case 'researcher':
      return isResearchExpired(user) ? <ResearchExpiredStack /> : <ResearchTabs />;
    case 'field':
      return <FieldTabs />;
    case 'supervisor':
      return <SupervisorTabs />;
    case 'admin':
      return <AdminTabs />;
    default:
      return <CitizenTabs />;
  }
};

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const wasSignedIn = useRef(false);

  // Signing in as a citizen doesn't swap navigators — only the Account tab's
  // stack changes Login -> CitizenDashboard — so the app stayed on the Account
  // tab and looked like it had dropped you into your profile. Every other role
  // swaps to a fresh navigator, but on web the linking config restores the tab
  // from the URL, so they could land on the wrong one too.
  //
  // Remounting via a key doesn't fix it (the URL wins). Navigating explicitly to
  // each role's first tab works on both targets.
  useEffect(() => {
    const signedIn = Boolean(user);
    const justSignedIn = signedIn && !wasSignedIn.current;
    wasSignedIn.current = signedIn;

    if (!justSignedIn || !navigationRef.isReady()) return;
    // An expired researcher has no tabs to land on — the expiry screen is the root.
    if (isResearchExpired(user)) return;

    navigationRef.navigate(LANDING[user.role] || 'Home');
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
      {tabsFor(user)}
    </NavigationContainer>
  );
};

const s = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
});


export default RootNavigator;
