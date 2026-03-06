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
    currentName
}: {
    isOpen: boolean;
    setIsOpen: (o: boolean) => void;
    currentEmail: string;
    currentName: string;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form fields
    const [name, setName] = useState(currentName);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            showToast("Current password is required to make changes.", "error");
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
        <div className="modal-overlay">
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative', textAlign: 'left' }}>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCircle className="text-accent" /> Edit Profile
                </h3>

                <form onSubmit={handleSave}>
                    <div className="form-group mb-2">
                        <label>Display Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group mb-2">
                        <label>New Password (Optional)</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                        />
                    </div>

                    <hr style={{ borderColor: 'var(--card-border)', margin: '1.5rem 0' }} />

                    <div className="form-group mb-2">
                        <label className="text-error">Current Password (Required)</label>
                        <input
                            type="password"
                            className="input-field"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Verify identity to apply changes"
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary" style={{ width: 'auto', marginBottom: 0 }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn" style={{ width: 'auto', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
