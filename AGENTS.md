
- Android app (Capacitor, android/) loads the live site via server.url; native-only code lives in src/lib/native.ts + src/components/NativeBridge.tsx and must stay a no-op on web. Why: the app needs SSR/server functions that cannot be bundled into an APK.
