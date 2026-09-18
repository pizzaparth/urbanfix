import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Imported by weight-specific subpath, not from the package root: the root index
// re-exports all 18 faces, and Metro would bundle every one of them (~1.6MB of
// fonts the app never renders).
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Geist_700Bold } from '@expo-google-fonts/geist/700Bold';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';

import { AuthProvider } from './src/contexts/AuthContext.jsx';
import RootNavigator from './src/navigation/RootNavigator.jsx';
import { color } from './src/theme.js';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  // Hold the splash on the app background rather than flashing unstyled text.
  // A font *error* shouldn't block the app — RN falls back to the system face.
  const ready = fontsLoaded || fontError;

  const onLayout = useCallback(() => {}, []);

  if (!ready) {
    return <View style={s.boot} />;
  }

  // GestureHandlerRootView has to sit above the navigators: React Navigation's
  // pressables route through react-native-gesture-handler, and without this
  // wrapper their touches are swallowed — on web that shows up as tab buttons
  // that highlight but never actually change screen.
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
