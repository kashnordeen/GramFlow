"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth.actions";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [particles, setParticles] = useState<{ id: number, x: number, y: number, delay: number, duration: number, scale: number }[]>([]);

    useEffect(() => {
        // Generate stable particles on client-side to prevent hydration mismatch
        const newParticles = Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 10 + Math.random() * 20,
            scale: 0.2 + Math.random() * 0.8
        }));
        setParticles(newParticles);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.toLowerCase().endsWith("@hemp.com")) {
            setError("Unauthorized domain. Please use your @hemp.com admin address.");
            return;
        }

        setLoading(true);
        const res = await loginAction(email, password);

        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="login-wrapper relative min-h-screen flex-center overflow-hidden">
            <div className="particles-container absolute inset-0 overflow-hidden pointer-events-none z-0">
                {particles.map((p) => (
                    <img
                        key={p.id}
                        src="/logo.png"
                        alt=""
                        className="particle z-0 absolute"
                        style={{
                            left: p.x + "%",
                            top: p.y + "%",
                            animationDelay: p.delay + "s",
                            animationDuration: p.duration + "s",
                            opacity: 0.15 + (p.scale * 0.3),
                            width: (15 + (p.scale * 25)) + "px",
                        }}
                    />
                ))}
            </div>

            <div className="login-card glass-panel relative z-10 w-full max-w-md p-8 animate-fade-in mx-4">
                <div className="login-logo-container flex-center">
                    <img src="/logo.png" alt="GramFlow" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '2.2rem' }}>Welcome Back</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.15rem' }}>
                    Don't have an account yet? <Link href="/signup" style={{ color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
                </p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {error && (
                        <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '0.875rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail size={24} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            className="login-input"
                            placeholder="email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={24} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            className="login-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Authenticating..." : "Roll"}
                    </button>
                </form>
            </div>
        </div>
    );
}
