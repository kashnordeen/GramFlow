"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { completeBusinessSetup } from "@/lib/actions/business.actions";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rate, setRate] = useState("0");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <AuthShell mode="signup" title="Name your business" description="Set your starting gram rate. You can change rates and add custom weight ranges later in Settings.">
    {error && <div className="auth-message auth-error" role="alert">{error}</div>}
    <form className="auth-form" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const result = await completeBusinessSetup(name, rate);
        if (result.error) setError(result.error);
        else { router.push("/"); router.refresh(); }
      } catch { setError("Setup is unavailable right now. Please try again."); }
      finally { setBusy(false); }
    }}>
      <div className="form-group"><label htmlFor="business-name">Business name</label><input id="business-name" className="input-field" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="organization" placeholder="Your business name" required /></div>
      <div className="form-group"><label htmlFor="business-rate">Standard rate per gram (₹)</label><input id="business-rate" className="input-field" type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} required /><span className="field-hint">Starts at ₹0. Add custom ranges such as 0.25–0.30g after setup.</span></div>
      <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? "Saving..." : "Open business workspace"}</button>
    </form>
  </AuthShell>;
}
