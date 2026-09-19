import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen, PageTitle, Card, Tappable, GhostButton } from '../components/ui';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { formatDate } from '../data/mock';
import { colors, font, radius, statusColors } from '../theme';

export default function TrackScreen({ route }) {
  const { findByTrackingId } = useApp();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState(null);
  const [receiptMsg, setReceiptMsg] = useState('');

  const incoming = route.params && route.params.trackingId;

  useEffect(() => {
    if (!incoming) return;
    setValue(incoming);
    setResult(findByTrackingId(incoming));
    setSearched(true);
  }, [incoming]);

  const search = () => {
    setResult(findByTrackingId(value));
    setSearched(true);
  };

  const downloadReceipt = () => {
    setReceiptMsg('Receipt downloaded.');
    setTimeout(() => setReceiptMsg(''), 2500);
  };

  const color = result ? statusColors[result.status] : colors.text;

  return (
    <Screen contentStyle={{ paddingTop: insets.top }}>
      <PageTitle sub="Enter your tracking ID.">Track</PageTitle>

      <View style={s.searchBlock}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="UF-XXXXX-X"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="characters"
          style={s.bigInput}
        />
        <Tappable onPress={search} style={s.searchBtn}>
          <Icon name="search" size={22} color={colors.accentInk} strokeWidth={2.6} />
          <Text style={s.searchBtnText}>Find my complaint</Text>
        </Tappable>
      </View>

      <View style={s.resultWrap}>
        {result ? (
          <Animated.View entering={FadeInDown.duration(380)}>
            <Card>
              <View style={s.resultHead}>
                <View style={{ flex: 1 }}>
                  <Text style={s.resultTitle}>{result.title}</Text>
                  <Text style={s.resultId}>{result.trackingId}</Text>
                </View>
                <View style={s.statusRow}>
                  <View style={[s.dot, { backgroundColor: color }]} />
                  <Text style={[s.statusText, { color }]}>{result.status}</Text>
                </View>
              </View>

              <Label>Description</Label>
              <Text style={s.body}>{result.description}</Text>

              <View style={s.metaRow}>
                <View style={{ flex: 1 }}>
                  <Label>Category</Label>
                  <Text style={s.metaValue}>{result.category}</Text>
                </View>
                <View>
                  <Label>Filed</Label>
                  <Text style={s.metaValue}>{formatDate(result.date)}</Text>
                </View>
              </View>

              {result.status === 'Resolved' ? (
                <GhostButton label="Download receipt" onPress={downloadReceipt} style={{ marginTop: 18 }} />
              ) : null}
              {receiptMsg ? <Text style={s.receipt}>{receiptMsg}</Text> : null}
            </Card>
          </Animated.View>
        ) : null}

        {searched && !result ? (
          <Text style={s.empty}>No complaint found for that ID.</Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Label({ children }) {
  return <Text style={s.label}>{String(children).toUpperCase()}</Text>;
}

const s = StyleSheet.create({
  searchBlock: { paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  bigInput: {
    height: 104,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: colors.text,
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: 2,
    textAlign: 'center',
  },
  searchBtn: {
    height: 66,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  searchBtnText: { fontFamily: font.display, fontSize: 18, color: colors.accentInk },
  resultWrap: { paddingHorizontal: 20, paddingTop: 20 },
  resultHead: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resultTitle: { fontFamily: font.display, fontSize: 22, lineHeight: 26, color: colors.text },
  resultId: { fontFamily: font.display, fontSize: 14, color: colors.dim, marginTop: 5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: font.bodyBold, fontSize: 15 },
  label: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1, color: colors.dim, marginBottom: 6 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: colors.body, marginBottom: 18 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaValue: { fontFamily: font.bodyBold, fontSize: 15, color: colors.text },
  receipt: { fontFamily: font.bodyBold, fontSize: 15, color: '#4ADE9B', marginTop: 12, textAlign: 'center' },
  empty: { textAlign: 'center', paddingVertical: 40, fontFamily: font.body, fontSize: 16, color: colors.muted },
});
