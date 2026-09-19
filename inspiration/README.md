# UrbanFix — React Native (Expo)

Frontend only. No backend, no API layer, no persistence — all state is local React state
seeded from `src/data/mock.js`.

## Run

    npm install
    npx expo start

Press `a` for Android, `i` for iOS, or scan the QR with Expo Go.

## Design rules baked in

- **AMOLED black** ground (`#000000`), surfaces at `#120E13`.
- **No gradients anywhere.** Solid fills, or transparent + a coloured border.
- **No tinted pills.** Status is communicated with a solid dot, coloured text, a
  coloured border, or a solid rail — never a low-alpha tinted chip.
- **Two palettes.** UI chrome uses rose `#FF5FA2` / lilac `#C08BFF`; charts use a
  separate set (`chartPalette` in `src/theme.js`) so data never reads as chrome.
- Big, bold type throughout — 38px page titles, 44px stat figures.

## Structure

    App.js                          font loading, providers, navigation container
    src/theme.js                    colours, type, radii — the single source of truth
    src/navigation/RootNavigator    tab navigator; swaps tab set for citizen vs admin
    src/context/AppContext          auth + complaint state (local only)
    src/data/mock.js                sample complaints and chart helpers
    src/components/
      GlassTabBar                   floating blurred tab bar, sliding pill (Reanimated)
      SwipeQuestionCard             dating-app swipe card (Gesture Handler + Reanimated)
      ComplaintCard                 status-colour-coded registry card
      RingChart                     animated SVG progress ring
      Icon                          stroke icon set (react-native-svg)
      ui.jsx                        Screen / Card / Field / buttons / pills
    src/screens/
      HomeScreen                    hero, stats, category bar chart, entry rows
      RegistryScreen                search + status filters + colour-coded cards
      TrackScreen                   large tracking-ID lookup
      ReportScreen                  6-step wizard incl. swipe questionnaire + OTP sheet
      AccountScreen                 login / register / verify / citizen dashboard
      AdminDashboardScreen          resolution ring, KPIs, category + urgency charts
      AdminQueueScreen              filterable complaint queue
      ComplaintDetailScreen         detail + status setter

## Key libraries

- `react-native-reanimated` — every animation (tab pill spring, swipe card, bar/ring growth, screen entrances)
- `react-native-gesture-handler` — pan gesture for the swipe questionnaire
- `expo-blur` — liquid-glass tab bar and question card
- `react-native-svg` — icons and the ring chart
- `@react-navigation/*` — tab + stack navigation

## Sign-in shortcuts

Any email + password signs you in as a citizen. **Peek admin view** switches to the
admin tab set (Dashboard / Registry / Track).
