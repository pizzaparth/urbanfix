import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { List, Plus, Search, ChevronRight } from 'lucide-react-native';
import { useAutoRefresh } from '../../hooks/useAutoRefresh.js';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { color, space, radius, font, text } from '../../theme.js';

const FEATURE_CARDS = [
  { icon: List, to: 'Registry', label: 'Browse registry' },
  { icon: Plus, to: 'File', label: 'Report an issue' },
  { icon: Search, to: 'Track', label: 'Track progress' },
];

const CHART_PALETTE = ['#C08BFF', '#7BE0D6', '#FFC77D', '#FF8FC7'];

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/public/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching portal statistics:', err?.message);
    }
  }, []);

  const { refreshing, refresh } = useAutoRefresh(fetchStats);

  const categories = stats?.categoryDistribution || [];
  const maxCategory = Math.max(...categories.map((c) => c.count || 0), 1);
  
  // Take top 4 categories for the bar chart
  const topCategories = [...categories].sort((a, b) => b.count - a.count).slice(0, 4);

  // Status breakdown calculations
  const breakdown = stats?.statusBreakdown || [];
  const total = breakdown.reduce((acc, curr) => acc + curr.count, 0) || 0;
  const resolved = breakdown.find(s => s.status === 'Resolved')?.count || 0;
  const pending = breakdown.find(s => s.status === 'Pending')?.count || 0;
  const inProgress = breakdown.find(s => s.status === 'In Progress')?.count || 0;
  const openCount = pending + inProgress;

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.accent} />}
    >
      <View style={s.hero}>
        <Text style={s.logo}>URBANFIX</Text>
        <Text style={s.display}>Fix your{'\n'}neighborhood.</Text>
      </View>

      <View style={s.statsRow}>
        <View style={[s.statBox, s.statBorderRight]}>
          <Text style={s.statNumber}>{total}</Text>
          <Text style={s.statLabel}>Filed</Text>
        </View>
        <View style={[s.statBox, s.statBorderRight]}>
          <Text style={s.statNumber}>{resolved}</Text>
          <Text style={s.statLabel}>Resolved</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNumber}>{openCount}</Text>
          <Text style={s.statLabel}>Open</Text>
        </View>
      </View>

      <View style={s.chartCard}>
        <Text style={s.chartTitle}>Top issues this month</Text>
        <View style={s.chartContainer}>
          {topCategories.map((c, i) => {
            const hPct = Math.max((c.count / maxCategory) * 100, 5); // min 5% height
            // Format label (e.g., "Pothole / Road Damage" -> "Pothole")
            const shortLabel = c._id.split('/')[0].trim().split(' ')[0];
            return (
              <View key={c._id} style={s.barCol}>
                <Text style={s.barCount}>{c.count}</Text>
                <View style={s.barTrack}>
                  <View 
                    style={[
                      s.barFill, 
                      { height: `${hPct}%`, backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }
                    ]} 
                  />
                </View>
                <Text style={s.barLabel} numberOfLines={1}>{shortLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.actionsContainer}>
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Pressable
              key={card.label}
              onPress={() => navigation.navigate(card.to)}
              style={({ pressed }) => [s.actionBtn, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={s.actionIconWrap}>
                <Icon size={24} strokeWidth={2.2} color={color.white} />
              </View>
              <Text style={s.actionText}>{card.label}</Text>
              <View style={s.actionArrowWrap}>
                <ChevronRight size={20} strokeWidth={2.8} color={color.bg} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingBottom: 104 },
  
  hero: { paddingHorizontal: 20, paddingTop: 26, paddingBottom: 4 },
  logo: {
    fontFamily: font.sansBold,
    fontSize: 22,
    letterSpacing: 2.5, // 0.12em
    color: color.accent,
    textTransform: 'uppercase',
  },
  display: {
    fontFamily: font.sansBold,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -0.5,
    color: color.white,
    marginTop: 8,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statBorderRight: {
    borderRightWidth: 1,
    borderRightColor: color.border,
  },
  statNumber: {
    fontFamily: font.sansBold,
    fontSize: 44,
    color: color.white,
    lineHeight: 44,
  },
  statLabel: {
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 6,
  },

  chartCard: {
    marginHorizontal: 20,
    marginBottom: 22,
    paddingVertical: 24,
    paddingHorizontal: 22,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: 30,
  },
  chartTitle: {
    fontFamily: font.sansBold,
    fontSize: 20,
    color: color.white,
    marginBottom: 22,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 180,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  barCount: {
    fontFamily: font.sansBold,
    fontSize: 26,
    color: color.white,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    maxWidth: 48,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 14,
  },
  barLabel: {
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    maxWidth: 72,
  },

  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 80,
    paddingHorizontal: 10,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.pill,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 14,
    fontFamily: font.sansBold,
    fontSize: 18,
    color: color.white,
  },
  actionArrowWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
});

export default HomeScreen;
