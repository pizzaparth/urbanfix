import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NotebookText, CirclePlus, Search, ArrowRight } from 'lucide-react-native';
import RadarChart from '../../components/RadarChart.jsx';
import { Panel } from '../../components/ui.jsx';
import api from '../../services/api.js';
import { ICON_STROKE } from '../../constants/icons.js';
import { CHART_CATEGORY_COLORS } from '../../config/chartTheme.js';
import { color, space, radius, font, text } from '../../theme.js';

const FEATURE_CARDS = [
  {
    icon: NotebookText,
    title: 'Public Registry',
    description:
      'View all publicly registered complaints, search by area location, and filter by category or status.',
    to: 'Registry',
    label: 'Browse Registry',
  },
  {
    icon: CirclePlus,
    title: 'File a Complaint',
    description:
      'Report local road, sanitation, water, or electricity issues through our interactive questionnaire flow.',
    to: 'File',
    label: 'File Issue Now',
  },
  {
    icon: Search,
    title: 'Track Progress',
    description:
      'Enter your unique Tracking ID to inspect the live audit log history, official remarks, and resolution status.',
    to: 'Track',
    label: 'Track Status',
  },
];

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/public/stats');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching portal statistics:', err?.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refresh whenever the tab regains focus — the native stand-in for the web
  // app's window 'focus' listener.
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const categories = stats?.categoryDistribution || [];
  const maxCategory = Math.max(...categories.map((c) => c.count || 0), 1);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchStats();
          }}
          tintColor={color.accent}
        />
      }
    >
      <View style={s.hero}>
        <Text style={s.display}>AI Powered Public Administration & Transparency Ecosystem.</Text>
        <Text style={s.lede}>
          Report public issues, verify identity securely via email OTP, monitor real-time ticket
          progress, and access transparent public records.
        </Text>
      </View>

      <Panel>
        <RadarChart statusBreakdown={stats?.statusBreakdown} />
      </Panel>

      {categories.length > 0 ? (
        <Panel style={s.gap3}>
          <Text style={s.sectionHeading}>Issues by Category</Text>
          {/* The web app showed this as a Chart.js doughnut. On a narrow screen a
              labelled bar list is more legible than a 10-slice donut, and it keeps
              the rule that a slice is never identified by color alone. */}
          {categories.map((c, i) => (
            <View key={c.category || c._id || i} style={s.barRow}>
              <Text style={s.barLabel} numberOfLines={1}>
                {c.category || c._id}
              </Text>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    {
                      width: `${((c.count || 0) / maxCategory) * 100}%`,
                      backgroundColor: CHART_CATEGORY_COLORS[i % CHART_CATEGORY_COLORS.length],
                    },
                  ]}
                />
              </View>
              <Text style={s.barValue}>{c.count || 0}</Text>
            </View>
          ))}
        </Panel>
      ) : null}

      <View style={s.gap3}>
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Pressable
              key={card.title}
              onPress={() => navigation.navigate(card.to)}
              style={({ pressed }) => [s.featureCard, pressed && { borderColor: color.accentBorder }]}
            >
              <View style={s.featureBadge}>
                <Icon size={20} strokeWidth={ICON_STROKE} color={color.accent} />
              </View>
              <Text style={s.featureTitle}>{card.title}</Text>
              <Text style={s.featureDesc}>{card.description}</Text>
              <View style={s.featureCta}>
                <Text style={s.featureCtaText}>{card.label}</Text>
                <ArrowRight size={14} strokeWidth={ICON_STROKE} color={color.accent} />
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
  content: { padding: space[4], paddingBottom: space[8], gap: space[4] },
  gap3: { gap: space[3] },

  hero: { alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  display: {
    fontFamily: font.sansBold,
    fontSize: text.display,
    lineHeight: 40,
    color: color.textPrimary,
    textAlign: 'center',
  },
  lede: {
    fontFamily: font.sans,
    fontSize: text.body,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  sectionHeading: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  barLabel: { width: 108, fontFamily: font.sans, fontSize: 11, color: color.textSecondary },
  barTrack: { flex: 1, height: 8, backgroundColor: color.surfaceRaised, borderRadius: radius.sm },
  barFill: { height: 8, borderRadius: radius.sm },
  barValue: {
    width: 26,
    textAlign: 'right',
    fontFamily: font.monoMedium,
    fontSize: 11,
    color: color.textPrimary,
  },

  featureCard: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[2],
  },
  featureBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    marginBottom: space[2],
  },
  featureTitle: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  featureDesc: { fontFamily: font.sans, fontSize: text.small, color: color.textSecondary, lineHeight: 20 },
  featureCta: { flexDirection: 'row', alignItems: 'center', gap: space[1], marginTop: space[2] },
  featureCtaText: { fontFamily: font.sansMedium, fontSize: text.small, color: color.accent },
});

export default HomeScreen;
