"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMounting, setIsMounting] = useState(true);

    // Re-trigger animation cleanly when pathname changes
    useEffect(() => {
        setIsMounting(true);
        const timer = setTimeout(() => setIsMounting(false), 50); // slight delay to ensure DOM parses old vs new
        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <div
            className={`page-transition ${isMounting ? 'page-entering' : 'page-entered'}`}
        >
            {children}
        </div>
    );
}
