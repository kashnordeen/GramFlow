"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/actions/auth.actions";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isInactiveLogout = searchParams.get("reason") === "inactivity";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [particles] = useState(() =>
        Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 12 + Math.random() * 18,
            scale: 0.3 + Math.random() * 0.7
        }))
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)', position: 'relative', overflow: 'hidden', padding: '1.5rem' }}>
            {mounted && (
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                    {particles.map((p) => (
                        <img
                            key={p.id}
                            src="/logo.png"
                            alt=""
                            style={{
                                position: 'absolute',
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                animationDelay: `${p.delay}s`,
                                animationDuration: `${p.duration}s`,
                                opacity: 0.12,
                                width: `${20 * p.scale}px`,
                                height: `${20 * p.scale}px`,
                                pointerEvents: 'none'
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="card-light" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem', position: 'relative', zIndex: 1, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                        <img src="/logo.png" alt="GramFlow" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '0.35rem', color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700 }}>Welcome Back</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.925rem' }}>
                    Don&apos;t have an account yet? <Link href="/signup" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}>Sign up</Link>
                </p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isInactiveLogout && !error && (
                        <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(180, 83, 9, 0.2)' }}>
                            You were signed out due to inactivity.
                        </div>
                    )}

                    {error && (
                        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <Mail size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            className="input-field"
                            style={{ paddingLeft: '2.8rem' }}
                            placeholder="Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type={showPassword ? "text" : "password"}
                            className="input-field"
                            style={{ paddingLeft: '2.8rem', paddingRight: '2.8rem' }}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.85rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }} disabled={loading}>
                        {loading ? "Authenticating..." : "Sign In to Terminal"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
