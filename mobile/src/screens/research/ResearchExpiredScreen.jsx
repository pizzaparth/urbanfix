import React from 'react';
import { Text, StyleSheet } from 'react-native';

import AuthShell, { authStyles as a } from '../../components/AuthShell.jsx';
import { PrimaryButton, GhostButton, Card } from '../../components/uikit.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { colors, uf as font } from '../../theme.js';

// Shown instead of the researcher tabs once access has ended. Expiry is enforced
// by the server (`protect` refuses every research call with RESEARCH_ACCESS_EXPIRED);
// this is just the screen that explains it rather than a wall of failed requests.
const ResearchExpiredScreen = ({ navigation }) => {
  const { user, logoutUser } = useAuth();
  const ended = user?.researcher?.accessExpiresAt;
  const hasDate = ended && new Date(ended).getTime() > 0;

  return (
    <AuthShell animationKey="expired" title="Access ended" subtitle="Your research window has closed.">
      <Card>
        <Text style={s.text}>
          {hasDate ? `Your access ended on ${new Date(ended).toLocaleDateString()}. ` : ''}
          The dataset is no longer available to this account. You can apply again with a new
          request.
        </Text>
      </Card>
      <PrimaryButton label="Apply again" onPress={() => navigation.navigate('ResearchApply')} style={a.primary} />
      <GhostButton label="Sign out" onPress={logoutUser} color={colors.secondary} style={a.ghost} />
    </AuthShell>
  );
};

const s = StyleSheet.create({
  text: { fontFamily: font.body, fontSize: 16, lineHeight: 25, color: colors.muted },
});

export default ResearchExpiredScreen;
