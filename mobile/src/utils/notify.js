import { Alert, Platform } from 'react-native';

// react-native-web ships Alert as a no-op stub (`static alert() {}`), so every
// Alert.alert on web would fail silently — an invisible error is worse than an
// ugly one. On web we fall back to the browser's own dialog; on native, Alert
// behaves as it always has.
export const notify = (title, message) => {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};
