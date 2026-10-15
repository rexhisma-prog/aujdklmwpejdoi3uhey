import { lovable } from "@/integrations/lovable";
import { isNativeApp, openExternal } from "@/lib/native";

/**
 * Google sign-in. Inside the Android app Google blocks embedded web views, so we
 * open the phone's browser; that browser returns the session through /native-callback.
 */
export async function startGoogleSignIn(): Promise<{ error?: Error }> {
  if (isNativeApp()) {
    await openExternal(`${window.location.origin}/login?native=1`);
    return {};
  }
  const fromApp = new URLSearchParams(window.location.search).get("native") === "1";
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: fromApp ? `${window.location.origin}/native-callback` : window.location.origin,
  });
  return { error: result.error ?? undefined };
}
