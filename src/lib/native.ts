// Helpers for the Android (Capacitor) app. On the normal website every check
// returns false, so web behavior is unchanged.
export const NATIVE_SCHEME = "com.shtofollow.app";

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/** Open a URL in the system browser (Custom Tab) when inside the app; else navigate. */
export async function openExternal(url: string) {
  if (isNativeApp()) {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url });
    return;
  }
  window.location.href = url;
}
