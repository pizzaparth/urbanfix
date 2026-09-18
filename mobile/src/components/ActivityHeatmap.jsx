import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HEATMAP_LEVEL_COLORS, getHeatmapLevel } from '../config/chartTheme.js';
import { color, space, radius, font, text } from '../theme.js';

// The web heatmap was a CSS Grid with gridTemplateRows/gridAutoColumns and a
// getBoundingClientRect-positioned hover tooltip. RN has neither CSS Grid nor
// hover, so this rebuilds it as explicit week columns inside a horizontal
// ScrollView, and the tooltip becomes tap-to-select shown in a fixed caption.
const CELL = 11;
const GAP = 2;

const ActivityHeatmap = ({ activity = [], maxCount = 0 }) => {
  const [selected, setSelected] = useState(null);

  // Bucket the flat day list into Sunday-first week columns, padding the first
  // week so the weekday rows line up the way GitHub's contribution graph does.
  const weeks = useMemo(() => {
    if (!activity.length) return [];
    const first = new Date(activity[0].date);
    const leadingPad = first.getUTCDay();
    const cells = [...Array(leadingPad).fill(null), ...activity];
    const out = [];
    for (let i = 0; i < cells.length; i += 7) {
      out.push(cells.slice(i, i + 7));
    }
    return out;
  }, [activity]);

  if (!activity.length) return null;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Text style={s.title}>Filing Activity</Text>
        <Text style={s.caption}>
          {selected
            ? `${selected.count} filed · ${new Date(selected.date).toLocaleDateString()}`
            : `${activity.length} days`}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Newest data sits on the right, so open scrolled to the end.
        ref={(r) => r?.scrollToEnd?.({ animated: false })}
      >
        <View style={s.grid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={s.week}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={[s.cell, s.cellEmpty]} />;
                const level = getHeatmapLevel(day.count, maxCount);
                const isSel = selected?.date === day.date;
                return (
                  <Pressable
                    key={di}
                    onPress={() => setSelected(isSel ? null : day)}
                    style={[
                      s.cell,
                      { backgroundColor: HEATMAP_LEVEL_COLORS[level] },
                      isSel && s.cellSelected,
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.legend}>
        <Text style={s.legendText}>Less</Text>
        {HEATMAP_LEVEL_COLORS.map((c) => (
          <View key={c} style={[s.cell, { backgroundColor: c }]} />
        ))}
        <Text style={s.legendText}>More</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[3],
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[2] },
  title: { fontFamily: font.sansSemibold, fontSize: text.h3, color: color.textPrimary },
  caption: { fontFamily: font.mono, fontSize: 11, color: color.textMuted },

  grid: { flexDirection: 'row', gap: GAP },
  week: { gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  cellEmpty: { backgroundColor: 'transparent' },
  cellSelected: { borderWidth: 1, borderColor: color.gray50 },

  legend: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  legendText: {
    fontFamily: font.mono,
    fontSize: 10,
    color: color.textMuted,
    marginHorizontal: space[1],
  },
});

export default ActivityHeatmap;
