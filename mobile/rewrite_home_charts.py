import re

with open('src/screens/public/HomeScreen.jsx', 'r') as f:
    content = f.read()

# Make sure imports are present
if 'import { Screen, Card, GrowBar }' not in content:
    content = content.replace("import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, Dimensions } from 'react-native';",
                              "import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet, Dimensions } from 'react-native';\nimport { Screen, Card, GrowBar } from '../../components/uikit.jsx';\nimport PeekWrapper from '../../components/PeekWrapper.jsx';\nimport PeekGraph from '../../components/PeekGraph.jsx';")

data_prep = """
  const categoryBars = (stats?.categoryDistribution || []).map(c => ({
    label: c._id,
    shortLabel: c._id.split(' ')[0],
    count: c.count
  })).sort((a,b) => b.count - a.count).slice(0, 4);
  const maxCatCount = Math.max(...categoryBars.map(c => c.count), 1);
  categoryBars.forEach(c => c.ratio = c.count / maxCatCount);
"""

if 'categoryBars' not in content:
    content = content.replace("const openCount = pending + inProgress;", f"const openCount = pending + inProgress;\n{data_prep}")

chart_ui = """
      {categoryBars.length > 0 && (
        <PeekWrapper renderPeek={() => <PeekGraph title="Top issues this month" bars={categoryBars} />}>
          <Card style={s.chartCard} pointerEvents="box-none">
            <Text style={s.cardTitle}>Top issues this month</Text>
            <View style={s.chartRow}>
              {categoryBars.map((bar, i) => (
                <View key={bar.label} style={s.barCol}>
                  <Text style={s.barCount}>{bar.count}</Text>
                  <GrowBar height={24 + bar.ratio * 106} color={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  <Text numberOfLines={1} style={s.barLabel}>{bar.shortLabel}</Text>
                </View>
              ))}
            </View>
          </Card>
        </PeekWrapper>
      )}
"""

if 'Top issues this month' not in content:
    content = content.replace("</ScrollView>", f"{chart_ui}\n    </ScrollView>")

styles = """
  chartCard: { marginHorizontal: 20, marginBottom: 12, padding: 20 },
  cardTitle: { fontFamily: font.sansBold, fontSize: 16, color: color.white, marginBottom: 16 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barCol: { alignItems: 'center', width: 48 },
  barCount: { fontFamily: font.sansBold, fontSize: 14, color: color.white, marginBottom: 8 },
  barLabel: { fontFamily: font.sans, fontSize: 11, color: '#8E8290', marginTop: 8 },
});
"""

if 'chartCard:' not in content:
    content = content.replace("});", styles)

with open('src/screens/public/HomeScreen.jsx', 'w') as f:
    f.write(content)
