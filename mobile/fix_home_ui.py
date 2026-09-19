import re

with open('src/screens/public/HomeScreen.jsx', 'r') as f:
    content = f.read()

# Replace the original chartCard entirely with the new PeekWrapper version
chart_pattern = r'<View style=\{s\.chartCard\}>.*?Top issues this month.*?</View>\n      </View>'
new_chart = """
      {categoryBars.length > 0 && (
        <PeekWrapper renderPeek={() => <PeekGraph title="Top issues this month" bars={categoryBars} />}>
          <Card style={s.chartCard}>
            <Text style={s.chartTitle}>Top issues this month</Text>
            <View style={s.chartContainer}>
              {categoryBars.map((bar, i) => (
                <View key={bar.label} style={s.barCol}>
                  <Text style={s.barCount}>{bar.count}</Text>
                  <GrowBar height={24 + bar.ratio * 90} color={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  <Text numberOfLines={1} style={s.barLabel}>{bar.shortLabel}</Text>
                </View>
              ))}
            </View>
          </Card>
        </PeekWrapper>
      )}
"""

content = re.sub(r'<View style=\{s\.chartCard\}>.*?</View>\s*</View>', new_chart, content, flags=re.DOTALL)

with open('src/screens/public/HomeScreen.jsx', 'w') as f:
    f.write(content)
