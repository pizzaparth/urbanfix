import re

def fix_admin():
    with open('src/screens/admin/AdminDashboardScreen.jsx', 'r') as f:
        content = f.read()

    # Add imports
    content = content.replace("import { SkeletonBlock, SkeletonPanel } from '../../components/Skeleton.jsx';",
                              "import { SkeletonBlock, SkeletonPanel } from '../../components/Skeleton.jsx';\nimport PeekWrapper from '../../components/PeekWrapper.jsx';\nimport PeekGraph from '../../components/PeekGraph.jsx';")

    # Wrap the first <Card style={s.chartCard}>
    pattern = r'(<Card style=\{s\.chartCard\}>\s*<Text style=\{s\.cardTitle\}>By category</Text>.*?</Card>)'
    replacement = r'<PeekWrapper renderPeek={() => <PeekGraph title="By category" bars={categoryBars} />}>\n      \1\n      </PeekWrapper>'
    
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    with open('src/screens/admin/AdminDashboardScreen.jsx', 'w') as f:
        f.write(content)

def fix_home():
    with open('src/screens/public/HomeScreen.jsx', 'r') as f:
        content = f.read()

    content = content.replace("import { Screen, PageTitle, Card, DangerButton, Tappable } from '../../components/uikit.jsx';",
                              "import { Screen, PageTitle, Card, DangerButton, Tappable } from '../../components/uikit.jsx';\nimport PeekWrapper from '../../components/PeekWrapper.jsx';\nimport PeekGraph from '../../components/PeekGraph.jsx';")

    pattern = r'(<Card style=\{s\.chartCard\}>\s*<Text style=\{s\.cardTitle\}>Top issues this month</Text>.*?</Card>)'
    replacement = r'<PeekWrapper renderPeek={() => <PeekGraph title="Top issues this month" bars={bars} />}>\n        \1\n        </PeekWrapper>'

    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    with open('src/screens/public/HomeScreen.jsx', 'w') as f:
        f.write(content)

fix_admin()
fix_home()
