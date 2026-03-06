"use client";

import CountUp from 'react-countup';

interface AnimatedCounterProps {
    value: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
}

export function AnimatedCounter({ value, decimals = 2, prefix = "", suffix = "", duration = 1.5 }: AnimatedCounterProps) {
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
