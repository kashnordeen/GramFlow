"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PrivacyContextType {
    isVisible: boolean;
    toggleVisibility: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
    isVisible: true,
    toggleVisibility: () => { },
});

export const usePrivacy = () => useContext(PrivacyContext);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Load preference from local storage on mount
        const stored = localStorage.getItem("gramflow_privacy_mode");
        if (stored) {
            setIsVisible(stored === "true");
        }
        setIsMounted(true);
    }, []);

    const toggleVisibility = () => {
        setIsVisible((prev) => {
            const newVal = !prev;
            localStorage.setItem("gramflow_privacy_mode", String(newVal));
            return newVal;
        });
    };

    // Prevent hydration flashes
    if (!isMounted) {
        return <>{children}</>;
    }

    return (
        <PrivacyContext.Provider value={{ isVisible, toggleVisibility }}>
            {children}
        </PrivacyContext.Provider>
    );
}
