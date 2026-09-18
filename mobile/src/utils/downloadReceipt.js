import { Platform } from 'react-native';
import { getUploadsBaseUrl } from '../services/api.js';
import { notify } from './notify.js';

// A phone "downloads" a file by pulling it to the cache directory and handing it
// to the OS share sheet — the user picks Files, Mail, WhatsApp, etc. A browser
// just navigates to the URL and lets the download manager take it.
//
// expo-file-system and expo-sharing are native-only, so they're required lazily
// inside the native branch and never reach the web bundle.
//
// The receipt endpoint is public (keyed only by tracking ID), so no auth header
// is needed; we hit it directly rather than through the axios instance because
// expo-file-system streams to disk instead of buffering in JS.
export const downloadReceipt = async (trackingId) => {
  const fileName = `Resolution_Receipt_${trackingId}.pdf`;
  const url = `${getUploadsBaseUrl()}/api/complaints/download-receipt/${trackingId}`;

  if (Platform.OS === 'web') {
    try {
      window.open(url, '_blank', 'noopener');
    } catch {
      notify('Download failed', 'Could not open the resolution receipt. Please try again.');
    }
    return;
  }

  const { File, Paths } = require('expo-file-system');
  const Sharing = require('expo-sharing');

  try {
    const destination = new File(Paths.cache, fileName);
    // Re-downloading over an existing cached copy would throw, so clear it first.
    if (destination.exists) {
      destination.delete();
    }

    const downloaded = await File.downloadFileAsync(url, destination);

    if (!(await Sharing.isAvailableAsync())) {
      notify('Receipt saved', `Saved as ${fileName}, but sharing isn't available on this device.`);
      return;
    }

    await Sharing.shareAsync(downloaded.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Resolution Receipt',
      UTI: 'com.adobe.pdf',
    });
  } catch {
    notify('Download failed', 'Could not download the resolution receipt. Please try again.');
  }
};
