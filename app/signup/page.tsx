"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const googleErrors: Record<string, string> = {
  cancelled: "Google signup was cancelled. You can try again.",
  domain: "Use a verified Google account.",
  failed: "Business signup could not be completed. Please try again.",
};

function SignupForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const googleError = googleErrors[params.get("google_error") || ""];

  return <AuthShell mode="signup" title="Create your business" description="Use your Google account to create a private workspace for your stock, sales and team.">
    {(error || googleError) && <div className="auth-message auth-error" role="alert">{error || googleError}</div>}
    <GoogleAuthButton intent="signup" onError={setError} />
    <p className="auth-switch">Already have a workspace? <Link href="/login">Sign in</Link></p>
  </AuthShell>;
}

export default function SignupPage() { return <Suspense fallback={<div className="work-loading">Loading signup...</div>}><SignupForm /></Suspense>; }
