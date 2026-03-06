"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/components/PrivacyProvider";

export function PrivacyToggleButton() {
    const { isVisible, toggleVisibility } = usePrivacy();

    return (
        <button
            onClick={(e) => {
                e.stopPropagation(); // prevent triggering parent onClick if present
                toggleVisibility();
            }}
            title={isVisible ? "Hide Value" : "Show Value"}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
            {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
    );
}
