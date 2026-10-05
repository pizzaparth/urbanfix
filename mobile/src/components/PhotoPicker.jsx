import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import { Tappable } from './uikit.jsx';
import Icon from './Icon.jsx';
import { takePhoto, pickPhotos } from '../utils/imageFiles.js';
import { colors, uf as font } from '../theme.js';

// The Report wizard's photo slots as a reusable control: filled slots show the
// photo with a remove button, and up to `max` can be attached. Styling matches
// ReportStep's upload step.
export default function PhotoPicker({ files, onChange, onError, max = 3 }) {
  const add = (result) => {
    if (result.error) return onError?.(result.error);
    onError?.('');
    onChange([...files, ...result.files].slice(0, max));
  };

  return (
    <View style={s.stack}>
      {files.map((f, i) => (
        <View key={f.uri + i} style={s.thumbWrap}>
          <Image source={{ uri: f.uri }} style={s.thumb} resizeMode="cover" />
          <Tappable
            onPress={() => onChange(files.filter((_, idx) => idx !== i))}
            scaleTo={0.9}
            style={s.remove}
          >
            <Icon name="close" size={16} color="#FFFFFF" strokeWidth={2.6} />
          </Tappable>
        </View>
      ))}

      {files.length < max ? (
        <View style={s.slotRow}>
          <Tappable onPress={async () => add(await takePhoto())} scaleTo={0.97} style={[s.slot, s.flex1]}>
            <Icon name="camera" size={24} color={colors.dim} />
            <Text style={s.slotText}>Take a photo</Text>
          </Tappable>
          <Tappable
            onPress={async () => add(await pickPhotos(max - files.length))}
            scaleTo={0.97}
            style={[s.slot, s.flex1]}
          >
            <Icon name="plusBare" size={24} color={colors.dim} />
            <Text style={s.slotText}>From library</Text>
          </Tappable>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  stack: { gap: 12 },
  slotRow: { flexDirection: 'row', gap: 12 },
  slot: {
    height: 150,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  slotText: { fontFamily: font.bodyBold, fontSize: 14, color: colors.dim },
  thumbWrap: { borderRadius: 24, overflow: 'hidden' },
  thumb: { width: '100%', height: 200, backgroundColor: colors.surfaceInput },
  remove: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
