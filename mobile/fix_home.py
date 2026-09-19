import re

with open('src/screens/public/HomeScreen.jsx', 'r') as f:
    content = f.read()

replacement = """  // Status breakdown calculations
  const breakdownObj = stats?.statusBreakdown || {};
  const resolved = breakdownObj['Resolved'] || 0;
  const pending = breakdownObj['Pending'] || 0;
  const inProgress = breakdownObj['In Progress'] || 0;
  const total = Object.values(breakdownObj).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) || 0;
  const openCount = pending + inProgress;"""

content = re.sub(
    r'  // Status breakdown calculations\n  const breakdown = stats\?\.statusBreakdown \|\| \[\];\n  const total = breakdown\.reduce\(.*?\n  const resolved = .*?\n  const pending = .*?\n  const inProgress = .*?\n  const openCount = pending \+ inProgress;',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/screens/public/HomeScreen.jsx', 'w') as f:
    f.write(content)
