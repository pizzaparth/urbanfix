import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, BackHeader } from '../../components/uikit.jsx';
import LeaveRequests from '../../components/LeaveRequests.jsx';

// The admin's view of pending leave — everyone's, but in practice a
// supervisor's own (their field staff's is decided by them).
const LeaveApprovalsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <BackHeader title="Leave requests" onBack={() => navigation.goBack()} />
      <View style={s.body}>
        <LeaveRequests base="/admin" />
      </View>
    </Screen>
  );
};

const s = StyleSheet.create({ body: { paddingHorizontal: 20, paddingTop: 8 } });

export default LeaveApprovalsScreen;
