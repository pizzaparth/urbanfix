import { Platform } from 'react-native';
import { notify } from './notify.js';

// Saves text the app already holds (a CSV/JSON export) and hands it to the user.
// Native: write to the cache directory and open the share sheet, like the
// receipt download. Web: a Blob + anchor click. expo-file-system / expo-sharing
// are native-only, so they're required lazily and never reach the web bundle.
export const saveTextFile = async (fileName, text, mimeType) => {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  const { File, Paths } = require('expo-file-system');
  const Sharing = require('expo-sharing');

  try {
    const file = new File(Paths.cache, fileName);
    // overwrite: re-exporting the same day reuses the file name.
    file.create({ overwrite: true });
    file.write(text);

    if (!(await Sharing.isAvailableAsync())) {
      notify('Export saved', `Saved as ${fileName}, but sharing isn't available on this device.`);
      return true;
    }
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName });
    return true;
  } catch {
    notify('Export failed', 'Could not save the file. Please try again.');
    return false;
  }
};
