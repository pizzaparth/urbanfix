import re

def fix_track():
    with open('src/screens/public/TrackScreen.jsx', 'r') as f:
        content = f.read()
    
    if 'import FormattedDescription' not in content:
        content = content.replace("import { Screen, PageTitle, Card, Tappable, GhostButton } from '../../components/uikit.jsx';",
                                  "import { Screen, PageTitle, Card, Tappable, GhostButton } from '../../components/uikit.jsx';\nimport FormattedDescription from '../../components/FormattedDescription.jsx';")
    
    # Ensure it's not hidden behind tab bar
    content = content.replace("contentStyle={{ paddingTop: insets.top }}", "contentStyle={{ paddingTop: insets.top, paddingBottom: 130 }}")

    with open('src/screens/public/TrackScreen.jsx', 'w') as f:
        f.write(content)

def fix_admin():
    with open('src/screens/admin/ComplaintDetailScreen.jsx', 'r') as f:
        content = f.read()

    if 'import FormattedDescription' not in content:
        content = content.replace("import { Screen, Field, PrimaryButton, GhostButton, Tappable } from '../../components/uikit.jsx';",
                                  "import { Screen, Field, PrimaryButton, GhostButton, Tappable } from '../../components/uikit.jsx';\nimport FormattedDescription from '../../components/FormattedDescription.jsx';")
        content = content.replace("import { Screen, Field, PrimaryButton, Tappable } from '../../components/uikit.jsx';",
                                  "import { Screen, Field, PrimaryButton, Tappable } from '../../components/uikit.jsx';\nimport FormattedDescription from '../../components/FormattedDescription.jsx';")
                                  
    content = re.sub(r'<Text style=\{s\.description\}>\{complaint\.description\}</Text>', r'<FormattedDescription description={complaint.description} />', content)
    content = re.sub(r'<Label>Description</Label>\s*', '', content)

    # Admin screens don't have tab bar, so no extra paddingBottom needed.
    
    with open('src/screens/admin/ComplaintDetailScreen.jsx', 'w') as f:
        f.write(content)

fix_track()
fix_admin()
