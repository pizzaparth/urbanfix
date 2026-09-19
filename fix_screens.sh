# For TrackScreen.jsx
sed -i '' 's/import { Screen, PageTitle, Card, GhostButton, Tappable }/import { Screen, PageTitle, Card, GhostButton, Tappable }\nimport FormattedDescription from "..\/..\/components\/FormattedDescription.jsx";/' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/TrackScreen.jsx

sed -i '' 's/<Text style={s.body}>{complaint.description}<\/Text>/<FormattedDescription description={complaint.description} \/>/' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/TrackScreen.jsx
sed -i '' 's/<Label>Description<\/Label>//' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/public/TrackScreen.jsx

# For ComplaintDetailScreen.jsx
sed -i '' 's/import { Screen, Field, PrimaryButton, Tappable }/import { Screen, Field, PrimaryButton, Tappable }\nimport FormattedDescription from "..\/..\/components\/FormattedDescription.jsx";/' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/ComplaintDetailScreen.jsx

sed -i '' 's/<Text style={s.body}>{complaint.description}<\/Text>/<FormattedDescription description={complaint.description} \/>/' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/ComplaintDetailScreen.jsx
sed -i '' 's/<Label>Description<\/Label>//' /Users/parth/University/Classes/3rd\ semester/DSN/mobile/src/screens/admin/ComplaintDetailScreen.jsx
