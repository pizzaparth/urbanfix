import React from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { ICON_STROKE } from '../constants/icons.js';
import { color, space, radius, font, text } from '../theme.js';

// Replaces the web app's <select className="input">. A native picker wheel reads
// poorly against this dark, sharp-cornered design and hides the option list until
// tapped, so long option sets (the 10-category taxonomy) use a bottom sheet
// instead — the list stays scannable and matches the panel styling.
const SelectSheet = ({ label, value, options, onChange, placeholder = 'All', style }) => {
  const [open, setOpen] = React.useState(false);

  const choose = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <View style={style}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [s.trigger, pressed && { borderColor: color.accent }]}
      >
        <Text style={[s.triggerText, !value && s.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} strokeWidth={ICON_STROKE} color={color.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>{label || 'Select'}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <X size={20} strokeWidth={ICON_STROKE} color={color.textSecondary} />
            </Pressable>
          </View>

          <FlatList
            data={[{ label: placeholder, value: '' }, ...options]}
            keyExtractor={(item) => item.value || '__all__'}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => choose(item.value)}
                  style={({ pressed }) => [s.row, pressed && { backgroundColor: color.surfaceRaised }]}
                >
                  <Text style={[s.rowText, active && s.rowTextActive]}>{item.label}</Text>
                  {active ? <Check size={16} strokeWidth={ICON_STROKE} color={color.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  label: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, marginBottom: space[1] },
  trigger: {
    height: 36,
    paddingHorizontal: space[3],
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
  },
  triggerText: { flex: 1, fontFamily: font.sans, fontSize: text.body, color: color.textPrimary },
  placeholder: { color: color.textMuted },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.borderStrong,
    paddingBottom: space[6],
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space[4],
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  sheetTitle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  sep: { height: 1, backgroundColor: color.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    gap: space[3],
  },
  rowText: { flex: 1, fontFamily: font.sans, fontSize: text.body, color: color.textSecondary },
  rowTextActive: { color: color.accent, fontFamily: font.sansMedium },
});

export default SelectSheet;
