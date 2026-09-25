import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, Boxes, Fingerprint, ScanLine } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AuthShell({ mode, title, description, children }: { mode: "login" | "signup"; title: string; description: string; children: ReactNode }) {
  return <main className="auth-layout">
    <section className="auth-story" aria-label="About GramFlow">
      <div className="auth-brand"><Image src="/brand-mark.svg" width={38} height={38} alt="" priority /><span>GramFlow</span></div>
      <div className="auth-story-main"><span className="workspace-kicker">THE INVENTORY CONTROL ROOM</span><p className="auth-display">Every gram.<br /><em>Accounted for.</em></p><p>Move from stock receipt to sale and settlement with clarity, confidence and a complete audit trail.</p></div>
      <div className="auth-orb" aria-hidden="true"><span className="orb-ring orb-ring-one" /><span className="orb-ring orb-ring-two" /><span className="orb-core"><span>GF</span></span></div>
      <div className="auth-story-foot"><span><Boxes size={16} aria-hidden="true" /> FIFO stock</span><span><ScanLine size={16} aria-hidden="true" /> Live ledger</span><span><Fingerprint size={16} aria-hidden="true" /> Access control</span></div>
    </section>
    <section className="auth-workspace" aria-label={mode === "login" ? "Sign in" : "Create first account"}>
      <div className="auth-top"><span className="auth-top-label">SECURE WORKSPACE <ArrowUpRight size={14} aria-hidden="true" /></span><ThemeToggle compact /></div>
      <div className="auth-form-wrap"><div className="auth-mobile-brand"><Image src="/brand-mark.svg" width={34} height={34} alt="" /><strong>GramFlow</strong></div><span className="workspace-kicker">{mode === "login" ? "WELCOME BACK" : "INITIAL SETUP"}</span><h1>{title}</h1><p className="auth-description">{description}</p>{children}</div>
      <div className="auth-bottom">Protected access · GramFlow inventory and receivables</div>
    </section>
  </main>;
}
