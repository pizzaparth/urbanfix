import re

with open('src/components/GlobalPeek.jsx', 'r') as f:
    content = f.read()

content = content.replace("...StyleSheet.absoluteFillObject,", "position: 'absolute',\n    top: 0,\n    left: 0,\n    width,\n    height,")

with open('src/components/GlobalPeek.jsx', 'w') as f:
    f.write(content)
