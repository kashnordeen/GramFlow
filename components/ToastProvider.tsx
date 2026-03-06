"use client";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

export type Toast = { id: number; message: string; type: "success" | "error" };
let toastCount = 0;
let addToastFn: (toast: Omit<Toast, "id">) => void;

export const showToast = (message: string, type: "success" | "error" = "success") => {
    if (addToastFn) addToastFn({ message, type });
};

export function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        addToastFn = (toast) => {
            const id = ++toastCount;
            setToasts((prev) => [...prev, { ...toast, id }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3500);
        };
    }, []);

    return (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {toasts.map((toast) => (
                <div key={toast.id} className="glass-card animate-fade-in" style={{ padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 8px 30px rgba(0,0,0,0.5)", borderLeft: "4px solid var(--" + toast.type + ")" }}>
                    {toast.type === 'success' ? <CheckCircle className="text-success" size={20} /> : <AlertCircle className="text-error" size={20} />}
                    <span style={{ fontWeight: 500 }}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
