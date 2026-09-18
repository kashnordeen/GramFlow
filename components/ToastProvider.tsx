"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

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
        <div
            style={{
                position: "fixed",
                top: "1.5rem",
                right: "1.5rem",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                maxWidth: "380px",
                width: "calc(100% - 3rem)",
                pointerEvents: "none"
            }}
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="card-dark animate-fade-in"
                    style={{
                        padding: "0.85rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        boxShadow: "var(--shadow-dark)",
                        borderLeft: toast.type === 'success' ? "4px solid var(--accent)" : "4px solid var(--danger)",
                        pointerEvents: "auto"
                    }}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    ) : (
                        <AlertCircle size={20} style={{ color: "var(--danger)", flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 500, fontSize: "0.875rem", color: "#FFFFFF" }}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
