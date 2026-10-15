import type { CapacitorConfig } from "@capacitor/cli";

// Android app shell. The app loads the live site over HTTPS because the web app
// relies on server rendering + server functions (payments, webhooks, auth checks)
// that cannot run from a static bundle inside the APK.
const config: CapacitorConfig = {
  appId: "com.shtofollow.app",
  appName: "ShtoFollow",
  webDir: "capacitor-www",
  server: {
    url: "https://shtofollow.com",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["shtofollow.com", "www.shtofollow.com"],
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Keyboard: { resize: "native" },
    StatusBar: { overlaysWebView: false, style: "DARK" },
  },
};

export default config;
