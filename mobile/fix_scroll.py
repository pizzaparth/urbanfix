import re

with open('src/components/uikit.jsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform\.OS === "ios" \? "padding" : undefined}>\n\s*(<ScrollView.*?)\n\s*</ScrollView>\n\s*</KeyboardAvoidingView>',
    r'\1\n    </ScrollView>',
    content,
    flags=re.DOTALL
)

with open('src/components/uikit.jsx', 'w') as f:
    f.write(content)
