import re

with open('src/components/uikit.jsx', 'r') as f:
    content = f.read()

if 'KeyboardAvoidingView' not in content:
    content = content.replace("import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';", 
                              "import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';")

content = re.sub(
    r'(export function Screen.*?return \(\n\s*)(<ScrollView)',
    r'\1<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>\n    \2',
    content,
    flags=re.DOTALL
)

content = re.sub(
    r'(</ScrollView>\n\s*)(?=\);\n})',
    r'\1</KeyboardAvoidingView>\n  ',
    content,
    flags=re.DOTALL
)

with open('src/components/uikit.jsx', 'w') as f:
    f.write(content)
