"use client";

import { Eye, EyeOff } from "lucide-react";
import { usePrivacy } from "@/components/PrivacyProvider";

export function PrivacyToggleButton() {
    const { isVisible, toggleVisibility } = usePrivacy();

    return (
        <button
            aria-label={isVisible ? "Hide financial values" : "Show financial values"}
            aria-pressed={!isVisible}
            className="privacy-toggle"
            onClick={(e) => {
                e.stopPropagation();
                toggleVisibility();
            }}
            title={isVisible ? "Hide financial values" : "Show financial values"}
            type="button"
        >
            {isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
    );
}
