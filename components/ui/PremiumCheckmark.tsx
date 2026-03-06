import React from 'react';

export function PremiumCheckmark() {
    return (
        <div className="premium-checkmark-wrapper">
            <svg className="checkmark-svg" viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
            <div className="burst-ring"></div>
            <div className="burst-particles">
                <div className="p p1"></div>
                <div className="p p2"></div>
                <div className="p p3"></div>
                <div className="p p4"></div>
                <div className="p p5"></div>
                <div className="p p6"></div>
                <div className="p p7"></div>
                <div className="p p8"></div>
            </div>
        </div>
    );
}
