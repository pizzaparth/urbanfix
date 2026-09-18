import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// Web-only entry point. Metro picks this over index.js when bundling for web.
//
// Skia draws through CanvasKit, a WebAssembly build that has to be fetched and
// initialised before any Skia component mounts — otherwise the charts throw
// "CanvasKit is not defined" at render. On iOS and Android Skia is a native
// module that is simply there, so index.js needs none of this.
//
// public/canvaskit.wasm is written by `npx setup-skia-web`, which must be re-run
// after upgrading @shopify/react-native-skia or the binary will be out of step
// with the JS.
LoadSkiaWeb()
  .then(async () => {
    const { default: App } = await import('./App');
    registerRootComponent(App);
  })
  .catch((err) => {
    // Rendering nothing with a silent console error would look like a hung app,
    // so fail loudly enough to be diagnosable.
    console.error('Skia (CanvasKit) failed to load — charts cannot render:', err);
  });
