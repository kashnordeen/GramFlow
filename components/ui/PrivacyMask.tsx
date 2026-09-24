"use client";

import { usePrivacy } from "@/components/PrivacyProvider";

export function PrivacyMask({ children }: { children: React.ReactNode }) {
    const { isVisible } = usePrivacy();

    return (
        <span className="privacy-value" data-hidden={!isVisible}>
            <span aria-hidden={!isVisible}>{children}</span>
            {!isVisible && <span className="sr-only">Hidden value</span>}
        </span>
    );
}
