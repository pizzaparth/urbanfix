import re

with open('src/screens/admin/AdminDashboardScreen.jsx', 'r') as f:
    content = f.read()

# Remove imports
content = re.sub(r"import PeekWrapper from '../../components/PeekWrapper\.jsx';\n", "", content)
content = re.sub(r"import PeekGraph from '../../components/PeekGraph\.jsx';\n", "", content)

# Remove wrapper
old_chart = r"""      \{categoryBars\.length > 0 && \(
        <PeekWrapper renderPeek=\{\(\) => <PeekGraph title="By category" bars=\{categoryBars\} />\}>
          <Card style=\{s\.chartCard\} >
            <Text style=\{s\.cardTitle\}>By category</Text>
            <View style=\{s\.chartRow\}>
              \{categoryBars\.map\(\(bar, i\) => \(
                <View key=\{bar\.label\} style=\{s\.barCol\}>
                  <Text style=\{s\.barCount\}>\{bar\.count\}</Text>
                  <GrowBar height=\{24 \+ bar\.ratio \* 90\} color=\{chartPalette\[i % chartPalette\.length\]\} />
                  <Text numberOfLines=\{1\} style=\{s\.barLabel\}>\{bar\.shortLabel\}</Text>
                </View>
              \)\)\}
            </View>
          </Card>
        </PeekWrapper>
      \)}"""

new_chart = """      {categoryBars.length > 0 && (
        <Card style={s.chartCard}>
          <Text style={s.cardTitle}>By category</Text>
          <View style={s.chartRow}>
            {categoryBars.map((bar, i) => (
              <View key={bar.label} style={s.barCol}>
                <Text style={s.barCount}>{bar.count}</Text>
                <GrowBar height={24 + bar.ratio * 90} color={chartPalette[i % chartPalette.length]} />
                <Text numberOfLines={1} style={s.barLabel}>{bar.shortLabel}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}"""

content = re.sub(old_chart, new_chart, content, flags=re.MULTILINE)

with open('src/screens/admin/AdminDashboardScreen.jsx', 'w') as f:
    f.write(content)
