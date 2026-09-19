import re

with open('src/components/PeekWrapper.jsx', 'r') as f:
    content = f.read()

content = content.replace("style={[style, { zIndex: isPeeking ? 999 : 1 }]}", "style={[style, { zIndex: 99 }]}")

with open('src/components/PeekWrapper.jsx', 'w') as f:
    f.write(content)
