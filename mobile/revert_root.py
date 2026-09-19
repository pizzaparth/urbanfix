import re

with open('src/navigation/RootNavigator.jsx', 'r') as f:
    content = f.read()

# Remove import
content = re.sub(r'import \{ GlobalPeek \} from "\.\./components/GlobalPeek\.jsx";\n', '', content)

# Remove the flex container and GlobalPeek
old_return = r"""    <View style=\{\{ flex: 1 \}\}>
      <NavigationContainer ref=\{navigationRef\} theme=\{navTheme\} linking=\{linking\}>
      \{user\?\.role === 'admin' \? <AdminTabs /> : <CitizenTabs />\}
    </NavigationContainer>
      <GlobalPeek />
    </View>"""

new_return = """    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      {user?.role === 'admin' ? <AdminTabs /> : <CitizenTabs />}
    </NavigationContainer>"""

content = re.sub(old_return, new_return, content, flags=re.MULTILINE)

with open('src/navigation/RootNavigator.jsx', 'w') as f:
    f.write(content)
