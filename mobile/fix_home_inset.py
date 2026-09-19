import re

with open('src/screens/public/HomeScreen.jsx', 'r') as f:
    content = f.read()

if 'useSafeAreaInsets' not in content:
    content = content.replace("import { View,", "import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport { View,")

content = content.replace("const HomeScreen = ({ navigation }) => {", "const HomeScreen = ({ navigation }) => {\n  const insets = useSafeAreaInsets();")

content = content.replace("contentContainerStyle={s.content}", "contentContainerStyle={[s.content, { paddingTop: insets.top }]}")

with open('src/screens/public/HomeScreen.jsx', 'w') as f:
    f.write(content)
