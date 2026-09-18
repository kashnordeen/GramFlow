"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";

// Default timeout: 30 minutes in milliseconds (30 * 60 * 1000)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AutoLogout() {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async () => {
        try {
            await logoutAction();
            router.push("/login?reason=inactivity");
        } catch {
            router.push("/login");
        }
    }, [router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }, [handleLogout]);

    useEffect(() => {
        // Initial timer setup
        resetTimer();

        // User activity events to monitor
        const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

        const onUserActivity = () => {
            resetTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, onUserActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, onUserActivity);
            });
        };
    }, [resetTimer]);

    return null;
}
