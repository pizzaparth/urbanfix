import re

with open('src/components/GlobalPeek.jsx', 'r') as f:
    content = f.read()

if 'BlurView' not in content:
    content = content.replace("import { View,", "import { BlurView } from 'expo-blur';\nimport { View,")
    
    # Replace Animated.View backdrop with BlurView wrapped inside
    old_backdrop = "<Animated.View style={[s.backdrop, backdropStyle]} />"
    new_backdrop = """<Animated.View style={[s.backdrop, backdropStyle]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Animated.View>"""
    content = content.replace(old_backdrop, new_backdrop)
    
    # Update backgroundColor to be slightly lighter since BlurView will tint it
    content = content.replace("backgroundColor: 'rgba(0,0,0,0.85)',", "backgroundColor: 'rgba(0,0,0,0.4)',")

with open('src/components/GlobalPeek.jsx', 'w') as f:
    f.write(content)
