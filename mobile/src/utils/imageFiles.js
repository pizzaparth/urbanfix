import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Same shape the Report wizard uploads: RN's FormData takes { uri, name, type }
// where the web took a File.
const mimeFromUri = (uri, provided) => {
  if (provided && /^image\/(jpeg|png|webp)$/.test(provided)) return provided;
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
};

export const assetToFile = (asset, idx = 0) => {
  const type = mimeFromUri(asset.uri, asset.mimeType);
  const ext = type.split('/')[1].replace('jpeg', 'jpg');
  return {
    uri: asset.uri,
    name: asset.fileName || `photo-${Date.now()}-${idx}.${ext}`,
    type,
  };
};

// Each returns { files } on success or { error } — never throws — so callers can
// route the message into their own ErrorNote.
export const takePhoto = async () => {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { error: 'Camera permission is required to take a photo.' };
  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  return { files: result.canceled ? [] : result.assets.map(assetToFile) };
};

export const pickPhotos = async (limit) => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { error: 'Photo library permission is required to attach images.' };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.7,
  });
  return { files: result.canceled ? [] : result.assets.slice(0, limit).map(assetToFile) };
};

// Adds a picked photo to a FormData. React Native's FormData understands a
// { uri, name, type } object; the browser's does not, and silently sends the
// string "[object Object]" — the server then sees no file at all. On web the
// picker's blob:/data: URI has to be fetched into a real Blob first.
export const appendImage = async (formData, field, file) => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    formData.append(field, blob, file.name);
  } else {
    formData.append(field, file);
  }
};
