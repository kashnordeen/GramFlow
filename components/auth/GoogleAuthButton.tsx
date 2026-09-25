"use client";

import { useState } from "react";

export function GoogleAuthButton({ intent, registrationCode, onError }: { intent: "login" | "signup"; registrationCode?: string; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function start() {
    if (intent === "signup" && !registrationCode) { onError("Enter the registration code before continuing with Google."); return; }
    setBusy(true);
    onError("");
    try {
      const response = await fetch("/api/auth/google/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent, registrationCode }) });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start Google sign-in.");
      window.location.assign(result.url);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  }
  return <button type="button" className="auth-google" onClick={start} disabled={busy}>
    <svg viewBox="0 0 48 48" width="19" height="19" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.68 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.46-.76-3.02-.76-4.59s.27-3.13.76-4.59l-7.98-6.2C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
    {busy ? "Connecting to Google..." : intent === "signup" ? "Create account with Google" : "Continue with Google"}
  </button>;
}
