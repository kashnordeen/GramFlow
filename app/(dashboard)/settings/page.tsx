"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/lib/actions/settings.actions";
import { showToast } from "@/components/ToastProvider";
import { Settings, SunMoon, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/components/AccessProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WorkspaceHeader, WorkspacePanel } from "@/components/ui/Workspace";

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

    if (loading) return <div className="work-loading" role="status">Loading settings...</div>;

    if (!hasPermission("settings.manage")) return <div className="card-light" style={{ padding: "2rem" }}>You do not have permission to manage settings.</div>;

    return (
        <div className="workspace-page">
            <WorkspaceHeader eyebrow="WORKSPACE / PREFERENCES" title="Settings" description="Manage standard rates and tailor how your workspace appears." />
            <div className="workspace-grid" data-layout="form">
            <WorkspacePanel icon={<Settings size={20} />} title="Pricing rules" description="Default rates used when recording a sale." footer="Changes here affect future sales. Existing ledger entries remain unchanged.">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="settings-rate">Standard rate per gram (₹)</label>
                        <input
                            id="settings-rate"
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={ratePerGram}
                            onChange={(e) => setRatePerGram(e.target.value)}
                            required
                        />
                        <p className="field-hint">Applied when a sale falls outside the special weight brackets.</p>
                    </div>

                    <div className="rate-tier-grid">
                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="settings-025">0.25g–0.30g rate (₹)</label>
                            <input
                                id="settings-025"
                                type="number"
                                step="0.01"
                                className="input-field"
                                value={special025}
                                onChange={(e) => setSpecial025(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label htmlFor="settings-050">0.50g–0.60g rate (₹)</label>
                            <input
                                id="settings-050"
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
            </WorkspacePanel>
            <div className="workspace-side-stack">
                <WorkspacePanel icon={<SunMoon size={20} />} title="Appearance" description="Choose the contrast that works for you." accent>
                    <p style={{ marginBottom: '1rem' }}>Switch between Obsidian dark and a softer daylight workspace. Your choice is saved on this device.</p>
                    <ThemeToggle />
                </WorkspacePanel>
                <WorkspacePanel icon={<ShieldCheck size={20} />} title="Data integrity" description="Pricing changes do not rewrite past sales.">
                    <ul className="info-list"><li><ShieldCheck size={17} aria-hidden="true" /> Rate overrides on the sale page stay local to your browser.</li><li><ShieldCheck size={17} aria-hidden="true" /> Posted transactions retain their original values.</li></ul>
                </WorkspacePanel>
            </div>
            </div>
        </div>
    );
}
