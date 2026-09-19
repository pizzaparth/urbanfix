import re

with open('App.js', 'r') as f:
    content = f.read()

if 'cacheBuster' not in content:
    content = content.replace("export default function App() {", "export default function App() {\n  const [cacheBuster] = React.useState(Date.now());")

with open('App.js', 'w') as f:
    f.write(content)
