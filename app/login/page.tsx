"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginAction } from "@/lib/actions/auth.actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const googleErrors: Record<string, string> = {
  cancelled: "Google sign-in was cancelled. You can try again.",
  account: "No active account matches this Google identity. Ask an administrator to create your account.",
  domain: "Use your verified work Google account.",
  failed: "Google sign-in could not be completed. Please try again.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const notice = params.get("reason") === "inactivity" ? "You were signed out after a period of inactivity." : null;
  const googleError = googleErrors[params.get("google_error") || ""];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginAction(email, password);
      if (result.error) setError(result.error);
      else router.push("/");
    } catch { setError("Sign-in is unavailable right now. Please try again."); }
    finally { setLoading(false); }
  }

  return <AuthShell mode="login" title="Sign in to your workspace" description="Pick up where you left off. Your stock, sales and customer ledger are ready.">
    {(error || googleError || notice) && <div className={`auth-message ${error || googleError ? "auth-error" : ""}`} role="alert">{error || googleError || notice}</div>}
    <form className="auth-form" onSubmit={submit}>
      <div className="form-group"><label htmlFor="login-email">Work email</label><input id="login-email" className="input-field" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></div>
      <div className="form-group"><label htmlFor="login-password">Password</label><div className="auth-password"><input id="login-password" className="input-field" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
      <button className="btn btn-primary auth-submit" type="submit" disabled={loading}><LockKeyhole size={17} aria-hidden="true" /> {loading ? "Signing in..." : "Sign in"}</button>
    </form>
    <div className="auth-divider"><span>or</span></div>
    <GoogleAuthButton intent="login" onError={setError} />
    <p className="auth-switch">Setting up your first account? <Link href="/signup">Create an account</Link></p>
  </AuthShell>;
}

export default function LoginPage() { return <Suspense fallback={<div className="work-loading">Loading sign-in...</div>}><LoginForm /></Suspense>; }
