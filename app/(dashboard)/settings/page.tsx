"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/lib/actions/settings.actions";
import { showToast } from "@/components/ToastProvider";
import { Settings, SunMoon, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/components/AccessProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { WorkspaceHeader, WorkspacePanel } from "@/components/ui/Workspace";
import type { RateRange } from "@/types";

export default function SettingsPage() {
    const { hasPermission } = useAccess();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [ratePerGram, setRatePerGram] = useState("");
    const [ranges, setRanges] = useState<RateRange[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const data = await getSettings();
                setRatePerGram(data.rate_per_gram.toString());
                setRanges(data.ranges);
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
        formData.append("ranges", JSON.stringify(ranges));

        const res = await updateSettings(formData);
        setSubmitting(false);

        if (res?.error) {
            showToast(res.error, "error");
        } else {
            showToast("Business rates saved", "success");
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
                        <p className="field-hint">Applied when a sale falls outside your custom weight ranges.</p>
                    </div>

                    <div className="form-group">
                        <div className="flex-between"><strong>Custom weight ranges</strong><button type="button" className="btn btn-secondary" disabled={ranges.length >= 20} onClick={() => setRanges([...ranges, { min_grams: 0.25, max_grams: 0.30, amount: 0 }])}>Add range</button></div>
                        <p className="field-hint">Example: 0.25–0.30g has a fixed price of ₹250. Ranges must not overlap.</p>
                    </div>
                    {ranges.map((range, index) => <div className="rate-tier-grid" key={index} style={{ marginBottom: "1rem" }}>
                        <div className="form-group"><label htmlFor={`range-min-${index}`}>From (g)</label><input id={`range-min-${index}`} className="input-field" type="number" min="0.001" step="0.001" value={range.min_grams} onChange={(event) => setRanges(ranges.map((item, i) => i === index ? { ...item, min_grams: Number(event.target.value) } : item))} required /></div>
                        <div className="form-group"><label htmlFor={`range-max-${index}`}>To (g)</label><input id={`range-max-${index}`} className="input-field" type="number" min="0.001" step="0.001" value={range.max_grams} onChange={(event) => setRanges(ranges.map((item, i) => i === index ? { ...item, max_grams: Number(event.target.value) } : item))} required /></div>
                        <div className="form-group"><label htmlFor={`range-amount-${index}`}>Fixed price (₹)</label><input id={`range-amount-${index}`} className="input-field" type="number" min="0" step="0.01" value={range.amount} onChange={(event) => setRanges(ranges.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item))} required /></div>
                        <button type="button" className="btn btn-secondary" onClick={() => setRanges(ranges.filter((_, i) => i !== index))} aria-label={`Remove range ${index + 1}`}>Remove</button>
                    </div>)}

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
                    <ul className="info-list"><li><ShieldCheck size={17} aria-hidden="true" /> Rates belong only to this business.</li><li><ShieldCheck size={17} aria-hidden="true" /> Posted transactions retain their original values.</li></ul>
                </WorkspacePanel>
            </div>
            </div>
        </div>
    );
}
