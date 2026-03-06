"use client";

import { usePrivacy } from "@/components/PrivacyProvider";

export function PrivacyMask({ children }: { children: React.ReactNode }) {
    const { isVisible } = usePrivacy();

    if (!isVisible) {
        return <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>****</span>;
    }

    return <>{children}</>;
}
