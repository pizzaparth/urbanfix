# CivicTrack — React Native app

The Smart Digital Complaint Management app. This is the project's only client —
it talks to `../backend` over REST.

Stack: Expo SDK 57 · React Native 0.86 · React 19.2 · React Navigation v7 ·
Victory Native XL + Skia (charts) · Reanimated/Moti (motion) · FlashList (lists).
Runs on iOS, Android and — for development only — the browser via react-native-web.

## Running it

1. **Start the backend** (from `../backend`): `npm run dev` — listens on port 5001.
   Mongo must be running too.

2. **Point the app at your machine's LAN IP.** This is the single most common
   reason the app shows no data:

   ```bash
   ipconfig getifaddr en0        # e.g. 172.25.209.67
   ```

   Put that in `mobile/.env` (copy `.env.example`):

   ```
   EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5001/api
   ```

   A LAN IP works for **both** targets, so one `.env` covers browser and phone.
   `localhost` would work in the browser but **not** on a phone, where it
   resolves to the phone itself. The IP changes when you switch networks, so
   re-check it before a demo. Restart `expo start` after editing `.env`; the
   value is inlined at bundle time.

3. **Start the dev server** — one server drives both targets:

   ```bash
   npx expo start
   ```

   | Key | What it does |
   |---|---|
   | `w` | opens the app in your **browser** — the fast way to iterate |
   | QR code | scan with **Expo Go** to run on your phone (same Wi-Fi) |
   | `i` / `a` | iOS simulator / Android emulator |
   | `s` | switches the QR between **Expo Go** and a development build |
   | `r` | reload · `j` debugger · `?` all commands |

   Both targets hot-reload from the same server, so you can keep the browser
   open for quick checks and scan the QR only when you need to verify something
   touch- or camera-specific.

   To go straight to the browser: `npx expo start --web`.

Verify the API link before demoing: `curl http://<lan-ip>:5001/health`.

## Browser vs. phone — what differs

The browser target exists for fast iteration, not as a shipping product. Four
things resolve differently there, each behind a `Platform.OS` check:

| | Phone (iOS/Android) | Browser |
|---|---|---|
| Auth token | `expo-secure-store` (keychain/keystore) | `localStorage` — see `services/tokenStore.js` |
| `Alert.alert` | native dialog | `window.alert` — react-native-web ships `Alert` as a **no-op stub**, so alerts would otherwise vanish silently (`utils/notify.js`) |
| Receipt download | `expo-file-system` + OS share sheet | `window.open` → browser download manager |
| Camera | real camera | `expo-image-picker` falls back to a file picker |

The token fallback is for local testing only — `localStorage` is readable by any
script on the origin, which is not where a real credential belongs. On a device
the keychain path is the one that runs.

Anything touching the camera, the share sheet or real touch gestures still needs
a pass on the phone before you trust it.

## Design decisions (history)

This app began as a port of an earlier React/Vite web client, which has since been
deleted. Kept here because it explains why several things are shaped the way they
are. The backend and API contract were unchanged by the port.

What had to be rebuilt, and why:

| Web | Native |
|---|---|
| `localStorage` | `expo-secure-store` (token) + `AsyncStorage` (user) |
| sync token read in the axios interceptor | module-level token cache hydrated at boot, so the interceptor stays synchronous |
| `<input type="file">` | `expo-image-picker` — camera or library |
| Blob + `<a download>` | `expo-file-system` + `expo-sharing` |
| `components/Modal.jsx` (portal + focus trap) | RN's built-in `<Modal>` — deleted, not ported |
| react-router-dom, `ProtectedRoute` | React Navigation; role gating is conditional navigator rendering |
| 1,094 lines of global CSS | `src/theme.js` + per-component `StyleSheet` |
| Chart.js doughnut + line | Victory Native XL on Skia (`components/charts/`) |
| Chart.js radar | hand-rolled in `react-native-svg` (`components/RadarChart.jsx`) — no RN library ships a radar |
| CSS-Grid activity heatmap | flex week-columns in a horizontal `ScrollView`, hover → tap |
| `<table>` in the admin list | `FlashList` of cards |

Deliberate divergences, all noted in-file:

- **The line chart's crosshair is gone.** It was a hand-written Canvas 2D plugin
  (`ctx.moveTo/lineTo`) with no RN analogue.
- **Hover tooltips became always-visible values.** There's no hover on touch, so the
  radar and donut legends print their counts rather than hiding them behind an interaction.
- **Data screens poll while focused** (`hooks/useAutoRefresh.js`, 15s). Polling stops
  on blur and when the app backgrounds, so a phone in a pocket isn't hitting the API;
  it catches up in one fetch on return. Every such screen also carries a `RefreshBar`
  showing how stale the numbers are, because pull-to-refresh does not exist in a
  browser (react-native-web renders `RefreshControl` as an empty `View`).
- **Search inputs are debounced (350ms).** The web app refetched on every keystroke.
- **The citizen dashboard's inline "new complaint" form was dropped.** It POSTed to
  `/complaints` without an OTP, which that endpoint requires — it could never have
  succeeded. The button routes to the real OTP-backed wizard instead.
- **Category donut → labelled bar list on the public home screen.** Ten slices don't
  read on a phone; the rule that a category is never identified by color alone is kept.

## Layout

```
src/
  theme.js              all 56 design tokens from the web tokens.css
  services/api.js       axios instance + token cache + getUploadsBaseUrl()
  services/tokenStore.js  keychain on device, localStorage in the browser
  utils/notify.js       Alert on device, window.alert in the browser
  utils/haptics.js      tap/success/error feedback; no-op on web
  hooks/useAutoRefresh.js  focus-scoped polling + manual refresh
  contexts/             AuthContext
  navigation/           RootNavigator — tabs, stacks, role gating, deep links
  components/           ui.jsx primitives, cards, heatmap, timeline, Skeleton
  components/charts/    DonutChart, TrendChart (Victory Native XL)
  components/RadarChart.jsx  hand-rolled SVG — Victory has no radar
  screens/public/       Home, Registry, Track, FileComplaint (+ ReportStep)
  screens/citizen/      Login, Register, VerifyOtp, Dashboard
  screens/admin/        AdminDashboard, AdminAction, ComplaintDetail
```

## Charts and the web entry point

Charts are Victory Native XL, which draws through Skia. On iOS and Android Skia is
a native module. In a browser it is a WebAssembly build (CanvasKit) that must be
fetched and initialised *before* any chart mounts — so web has its own entry point,
`index.web.js`, which awaits `LoadSkiaWeb()` and only then registers the app.

Two things follow from that, both easy to trip over:

- `public/canvaskit.wasm` is generated by `npx setup-skia-web`. It is not committed.
  **Re-run that command after upgrading `@shopify/react-native-skia`**, or the wasm
  and the JS drift apart.
- Don't delete `index.web.js` or move Skia imports above it. Without it the browser
  throws `CanvasKit is not defined` and renders nothing.

The status radar stays hand-rolled in `react-native-svg` — Victory ships no radar
chart, and SVG is lighter than Skia for a static four-axis polygon.

## Deep links

`dsn://track?id=COMP-XXXXX-X` opens the tracker with the ID prefilled — the native
equivalent of the web `/track?id=` links.

```bash
npx uri-scheme open "dsn://track?id=COMP-XXXXX-X" --ios
```
