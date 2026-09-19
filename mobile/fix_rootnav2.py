import re

with open('src/navigation/RootNavigator.jsx', 'r') as f:
    content = f.read()

content = content.replace("      <GlobalPeek />\n    </NavigationContainer>", "    </NavigationContainer>\n      <GlobalPeek />")
content = content.replace("<NavigationContainer", "<View style={{ flex: 1 }}>\n      <NavigationContainer")
content = content.replace("    </NavigationContainer>\n      <GlobalPeek />", "    </NavigationContainer>\n      <GlobalPeek />\n    </View>")

with open('src/navigation/RootNavigator.jsx', 'w') as f:
    f.write(content)
