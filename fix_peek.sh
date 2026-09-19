sed -i '' 's|import { SkeletonBlock, SkeletonPanel } from.*|import { SkeletonBlock, SkeletonPanel } from "../../components/Skeleton.jsx";\nimport PeekWrapper from "../../components/PeekWrapper.jsx";\nimport PeekGraph from "../../components/PeekGraph.jsx";|g' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/AdminDashboardScreen.jsx

awk '
  /<Card style={s.chartCard}>/ && !found {
    print "      <PeekWrapper renderPeek={() => <PeekGraph title=\"By category\" bars={categoryBars} />}>"
    print "      <Card style={s.chartCard}>"
    found=1
    next
  }
  /<\/Card>/ && found==1 {
    print "      </Card>"
    print "      </PeekWrapper>"
    found=2
    next
  }
  {print}
' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/AdminDashboardScreen.jsx > temp_admin.jsx
mv temp_admin.jsx /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/AdminDashboardScreen.jsx

# For HomeScreen
sed -i '' 's|import { Screen, PageTitle, Card, DangerButton, Tappable } from.*|import { Screen, PageTitle, Card, DangerButton, Tappable } from "../../components/uikit.jsx";\nimport PeekWrapper from "../../components/PeekWrapper.jsx";\nimport PeekGraph from "../../components/PeekGraph.jsx";|g' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/HomeScreen.jsx

awk '
  /<Card style={s.chartCard}>/ && !found {
    print "        <PeekWrapper renderPeek={() => <PeekGraph title=\"Top issues this month\" bars={bars} />}>"
    print "        <Card style={s.chartCard}>"
    found=1
    next
  }
  /<\/Card>/ && found==1 {
    print "        </Card>"
    print "        </PeekWrapper>"
    found=2
    next
  }
  {print}
' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/HomeScreen.jsx > temp_home.jsx
mv temp_home.jsx /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/HomeScreen.jsx
