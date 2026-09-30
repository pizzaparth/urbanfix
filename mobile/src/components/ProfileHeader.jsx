import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { DangerButton } from './uikit.jsx';
import { colors, uf as font } from '../theme.js';

// Name / email / sign-out row that tops every role's Profile tab. Same layout as
// the citizen dashboard's header.
export default function ProfileHeader({ user, meta, onSignOut }) {
  return (
    <View style={s.head}>
      <View style={s.flex1}>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        {meta ? <Text style={s.meta}>{meta}</Text> : null}
      </View>
      <DangerButton label="Sign out" onPress={onSignOut} />
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  name: { fontFamily: font.display, fontSize: 26, color: colors.text },
  email: { fontFamily: font.body, fontSize: 14, color: colors.dim, marginTop: 4 },
  meta: { fontFamily: font.bodyBold, fontSize: 13, color: colors.accent, marginTop: 6 },
});
