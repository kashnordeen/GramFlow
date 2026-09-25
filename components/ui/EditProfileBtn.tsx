"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, UserCircle, Save } from "lucide-react";
import { updateProfileData } from "@/lib/actions/auth.actions";
import { showToast } from "@/components/ToastProvider";
import { useRouter } from "next/navigation";

export function EditProfileBtn({
    isOpen,
    setIsOpen,
    currentEmail,
    currentName,
    hasPassword,
}: {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    currentEmail: string;
    currentName: string;
    hasPassword: boolean;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form fields
    const [name, setName] = useState(currentName);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (hasPassword && !currentPassword) {
            showToast("Current password is required to make changes.", "error");
            return;
        }
        if (!hasPassword && name.trim() === currentName) {
            showToast("No profile changes to save.", "error");
            return;
        }

        setLoading(true);
        const res = await updateProfileData(
            currentEmail,
            currentPassword,
            newPassword || undefined,
            name !== currentName ? name : undefined
        );

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Profile updated successfully!", "success");
            setIsOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            router.refresh();
        }
        setLoading(false);
    };

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
            <div className="modal-card animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" style={{ maxWidth: '440px' }} onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }} onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    aria-label="Close profile editor"
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    <X size={18} />
                </button>

                <h3 id="edit-profile-title" style={{ marginTop: 0, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                    <UserCircle size={20} /> Edit Profile
                </h3>

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label htmlFor="profile-name">Display name</label>
                        <input
                            id="profile-name"
                            autoFocus
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    {hasPassword && <div className="form-group">
                        <label htmlFor="profile-new-password">New password (optional)</label>
                        <input
                            id="profile-new-password"
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                        />
                    </div>}

                    {hasPassword ? <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.25rem 0', paddingTop: '1.25rem' }}>
                        <div className="form-group">
                            <label htmlFor="profile-current-password">Current password (required)</label>
                            <input
                                id="profile-current-password"
                                type="password"
                                className="input-field"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter current password to verify"
                            />
                        </div>
                    </div> : <p className="field-hint">Signed in with Google. Your display name can be edited here; password changes are not available for this account.</p>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
