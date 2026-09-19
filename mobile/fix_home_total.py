import re

with open('src/screens/public/HomeScreen.jsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const total = Object.values(breakdownObj).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) || 0;",
    "const total = breakdownObj.total || 0;"
)

with open('src/screens/public/HomeScreen.jsx', 'w') as f:
    f.write(content)
