import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

import { AuthProvider } from './src/contexts/AuthContext.jsx';
import RootNavigator from './src/navigation/RootNavigator.jsx';
import { color } from './src/theme.js';

export default function App() {
  const [cacheBuster] = React.useState(Date.now());
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const ready = fontsLoaded || fontError;

  const onLayout = useCallback(() => {}, []);

  if (!ready) {
    return <View style={s.boot} />;
  }

  return (
    <GestureHandlerRootView style={s.fill}>
      <SafeAreaProvider onLayout={onLayout}>
        <StatusBar style="light" backgroundColor={color.bg} />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  boot: { flex: 1, backgroundColor: color.bg },
  fill: { flex: 1 },
});
// cache bust Sun Sep 20 00:27:14 IST 2026
// cache bust Sun Sep 20 00:29:55 IST 2026
// feature removed Sun Sep 20 00:33:16 IST 2026
