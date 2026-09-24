"use client";

import CountUp from 'react-countup';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}

export function AnimatedCounter({ value, decimals = 2, prefix = "", suffix = "", duration = 1.5 }: AnimatedCounterProps) {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => setReduceMotion(query.matches);
        updatePreference();
        query.addEventListener('change', updatePreference);
        return () => query.removeEventListener('change', updatePreference);
    }, []);

    if (reduceMotion) {
        return <>{prefix}{value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>;
    }

    return (
        <CountUp
            start={0}
            end={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            duration={duration}
            separator=","
            useEasing={true}
        />
    )
}
