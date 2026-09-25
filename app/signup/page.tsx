"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { signupAction } from "@/lib/actions/auth.actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const googleErrors: Record<string, string> = {
  cancelled: "Google signup was cancelled. You can try again.",
  closed: "Initial registration is closed. Ask an administrator to create your account.",
  domain: "Use a verified Google Workspace account in the allowed email domain.",
  failed: "Google signup could not be completed. Please try again.",
};

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleError = googleErrors[params.get("google_error") || ""];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signupAction(email, password, name, registrationCode);
      if (result.error) setError(result.error);
      else router.push("/");
    } catch { setError("Account setup is unavailable right now. Please try again."); }
    finally { setLoading(false); }
  }

  return <AuthShell mode="signup" title="Create your workspace" description="Set up the first administrator account. Additional teammates are invited from inside GramFlow.">
    {(error || googleError) && <div className="auth-message auth-error" role="alert">{error || googleError}</div>}
    <form className="auth-form" onSubmit={submit}>
      <div className="form-group"><label htmlFor="signup-name">Full name</label><input id="signup-name" className="input-field" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></div>
      <div className="form-group"><label htmlFor="signup-email">Work email</label><input id="signup-email" className="input-field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></div>
      <div className="form-group"><label htmlFor="signup-password">Password</label><div className="auth-password"><input id="signup-password" className="input-field" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><span className="field-hint">10+ characters with uppercase, lowercase and a number.</span></div>
      <div className="form-group"><label htmlFor="signup-code">Registration code</label><input id="signup-code" className="input-field" type="password" autoComplete="off" value={registrationCode} onChange={(event) => setRegistrationCode(event.target.value)} placeholder="Private setup code" required /><span className="field-hint">Required for both password and Google signup.</span></div>
      <button className="btn btn-primary auth-submit" type="submit" disabled={loading}><ShieldCheck size={17} aria-hidden="true" /> {loading ? "Creating account..." : "Create account"}</button>
    </form>
    <div className="auth-divider"><span>or</span></div>
    <GoogleAuthButton intent="signup" registrationCode={registrationCode} onError={setError} />
    <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
  </AuthShell>;
}

export default function SignupPage() { return <Suspense fallback={<div className="work-loading">Loading account setup...</div>}><SignupForm /></Suspense>; }
