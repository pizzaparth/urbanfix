import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import App from './App';

// Web entry point. It previously had to await LoadSkiaWeb() before rendering,
// because the Victory Native charts drew through Skia's CanvasKit WASM build.
// Those charts are gone — the dashboard uses the reference's SVG ring and plain
// views — so the app registers directly, and the browser no longer downloads an
// 8MB wasm binary on first paint.
registerRootComponent(App);
