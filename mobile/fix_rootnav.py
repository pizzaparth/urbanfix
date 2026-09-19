import re

with open('src/navigation/RootNavigator.jsx', 'r') as f:
    content = f.read()

content = content.replace("</NavigationContainer>", "  <GlobalPeek />\n    </NavigationContainer>")

with open('src/navigation/RootNavigator.jsx', 'w') as f:
    f.write(content)
