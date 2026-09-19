import re

with open('src/screens/admin/ComplaintDetailScreen.jsx', 'r') as f:
    content = f.read()

if 'import FormattedDescription' not in content:
    content = re.sub(
        r"(import \{.*?\} from '../../components/uikit\.jsx';)",
        r"\1\nimport FormattedDescription from '../../components/FormattedDescription.jsx';",
        content
    )

with open('src/screens/admin/ComplaintDetailScreen.jsx', 'w') as f:
    f.write(content)
