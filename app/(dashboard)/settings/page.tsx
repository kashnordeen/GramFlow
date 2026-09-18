"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/lib/actions/settings.actions";
import { showToast } from "@/components/ToastProvider";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/components/AccessProvider";

export default function SettingsPage() {
    const { hasPermission } = useAccess();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [ratePerGram, setRatePerGram] = useState("");
    const [special025, setSpecial025] = useState("");
    const [special050, setSpecial050] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const data = await getSettings();
                setRatePerGram(data.rate_per_gram.toString());
                setSpecial025(data.special_025_030.toString());
                setSpecial050(data.special_050_060.toString());
            } catch {
                showToast("Failed to load settings", "error");
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append("rate_per_gram", ratePerGram);
        formData.append("special_025_030", special025);
        formData.append("special_050_060", special050);

        const res = await updateSettings(formData);
        setSubmitting(false);

        if (res?.error) {
            showToast(res.error, "error");
        } else {
            showToast("Global pricing configuration updated successfully", "success");
            router.refresh();
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4rem' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading settings...</div>
        </div>
    );

    if (!hasPermission("settings.manage")) return <div className="card-light" style={{ padding: "2rem" }}>You do not have permission to manage settings.</div>;

    return (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ marginBottom: "2rem", display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <Settings size={22} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Global Settings</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Configure standard inventory rates & special price tiers</p>
                </div>
            </div>

            <div className="card-light" style={{ padding: '2.25rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Standard Rate Per Gram (₹)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={ratePerGram}
                            onChange={(e) => setRatePerGram(e.target.value)}
                            required
                        />
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Default rate applied when sales fall outside special brackets.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Special: 0.25g - 0.30g (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={special025}
                                onChange={(e) => setSpecial025(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Special: 0.50g - 0.60g (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={special050}
                                onChange={(e) => setSpecial050(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '2rem', padding: '0.9rem' }}
                        disabled={submitting}
                    >
                        {submitting ? 'Saving Configuration...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}
