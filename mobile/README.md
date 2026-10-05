# UrbanFix mobile app

This is the project's only client. It talks to `../backend` over REST.

**Stack:** Expo SDK 57, React Native 0.86, React 19.2, React Navigation 7, Reanimated 4 and Moti (motion), FlashList (lists), react-native-svg (charts and icons).

It runs on Android and iOS through **Expo Go**, with no development build needed. It also runs in the browser through react-native-web, for development only.

## Running it

1. **Start the backend** from `../backend` with `npm run dev`. It listens on port 5001, and MongoDB must be running.
2. **Start Metro:**

   ```bash
   npx expo start --go -c
   ```

   | Key | What it does |
   |---|---|
   | QR code | scan with **Expo Go** to run on your phone (same Wi-Fi) |
   | `w` | open the app in your browser, the fast way to iterate |
   | `a` / `i` | Android emulator / iOS simulator |
   | `s` | switch the QR between Expo Go and a development build. Keep it on **Expo Go**: a development-build QR won't open in Expo Go. |
   | `r` | reload; `j` debugger; `?` all commands |

### How the app finds the API

You don't need to set an IP. `src/services/api.js` builds the API URL at runtime:

| Running on | API host used |
|---|---|
| Browser | the page's own hostname, e.g. `localhost` |
| Phone (Expo Go) | the IP the phone loaded Metro from, i.e. your computer's current LAN IP |
| Android emulator | `10.0.2.2`, the emulator's alias for the host machine |

The port is always `5001`. Change `API_PORT` in `api.js` if the backend moves.

To use a different backend, set `EXPO_PUBLIC_API_URL` in `mobile/.env` (see `.env.example`). Examples are a deployed server or `expo start --tunnel`, whose `*.exp.direct` host can't reach a local backend. Restart with `-c` after editing `.env`, because the value is built into the bundle.

If the phone can't load the app, open `http://<computer-ip>:8081` in the phone's browser. If that page doesn't load, the network blocks devices from talking to each other. This is common on campus Wi-Fi. Use a phone hotspot instead.

## Browser vs. phone

The browser target is for fast iteration, not a shipping product. A few things resolve differently, each behind a `Platform.OS` check:

| | Phone (iOS/Android) | Browser |
|---|---|---|
| Auth token | `expo-secure-store` (keychain/keystore) | `localStorage`. See `services/tokenStore.js`. |
| `Alert.alert` | native dialog | `window.alert`. react-native-web ships `Alert` as a no-op, so `utils/notify.js` wraps it. |
| Receipt download | `expo-file-system` + OS share sheet | `window.open` to the browser's downloads |
| Camera | real camera | `expo-image-picker` falls back to a file picker |
| Photo upload | RN `{ uri, name, type }` file objects | real `Blob`s. Use `appendImage()` in `utils/imageFiles.js`. |

Anything that touches the camera, the share sheet, the keyboard or real touch gestures needs a pass on a phone.

## Keyboard handling

Android is edge-to-edge, so the keyboard no longer resizes the window. To stop it covering inputs:

- **Android:** a root `KeyboardAvoidingView` in `App.js` pads the whole app by the keyboard height. Android's ScrollView then keeps the focused input visible.
- **iOS:** `Screen` (`components/uikit.jsx`) sets `automaticallyAdjustKeyboardInsets` on its ScrollView. Any other ScrollView that holds inputs needs the same prop.
- **Modals** are separate windows, so each modal that contains an input needs its own `KeyboardAvoidingView` (see the OTP sheet in `FileComplaintScreen`).
- The floating tab bar hides while the keyboard is open (`hooks/useKeyboardVisible.js`).

`react-native-keyboard-controller` would be simpler, but Expo Go doesn't include it.

## Layout

```
App.js                    fonts, safe area, root keyboard handling, navigation
index.js / index.web.js   native / browser entry points
src/
  theme.js                colour, type, spacing and radius tokens (light theme)
  navigation/             RootNavigator: role-based tab bars, stacks, deep links
  screens/
    public/               Home, Registry, Track, FileComplaint (+ ReportStep wizard)
    citizen/              Login, Register, VerifyOtp, SetPassword, Dashboard, ResearchApply
    supervisor/           Queue, TriageDetail, Assign, FieldStaff, Profile
    field/                MyTasks, TaskDetail, CompletedTasks, Profile
    admin/                Dashboard, Action, ComplaintDetail, People, UserForm,
                          LeaveApprovals, ResearchApplications, ResearchAudit
    research/             Insights, Export, Profile, Expired
  components/             uikit.jsx (current primitives), ui.jsx (older primitives),
                          GlassTabBar, cards, charts (Radar, Ring, BarRows, ActivityHeatmap)
  services/               api.js (axios, runtime API host, token cache), tokenStore.js
  hooks/                  useAuth, useAutoRefresh (focus-scoped polling), useKeyboardVisible
  contexts/               AuthContext
  constants/              categories + questionnaires, stages, wards, icons
  config/chartTheme.js    chart colours, category palette, heatmap ramp
  utils/                  notify, haptics, imageFiles, downloadReceipt, saveTextFile, urgency
```

## Design notes

- **Data screens poll while focused** (`hooks/useAutoRefresh.js`, 15 s). Polling stops on blur and when the app goes to the background, then catches up in one fetch on return. `RefreshBar` shows how stale the numbers are, because pull-to-refresh doesn't exist in a browser.
- **Search inputs are debounced** (350 ms).
- **No hover on touch:** charts print their values instead of hiding them behind tooltips. A category is never identified by colour alone; every chart has a labelled legend.
- **Tabs are not lazy:** every tab screen mounts at once, and inactive ones are `aria-hidden` on web.

## Deep links

`dsn://track?id=COMP-XXXXX-X` opens the tracker with the ID prefilled.

```bash
npx uri-scheme open "dsn://track?id=COMP-XXXXX-X" --android
```
