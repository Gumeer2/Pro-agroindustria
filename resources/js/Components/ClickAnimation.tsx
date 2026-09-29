import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ClickEffect {
    id: number;
    x: number;
    y: number;
}

export const ClickAnimation = () => {
    const [clicks, setClicks] = useState<ClickEffect[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const id = Date.now();
            setClicks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);

            // Cleanup after animation
            setTimeout(() => {
                setClicks((prev) => prev.filter((click) => click.id !== id));
            }, 600);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return createPortal(
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            {clicks.map((click) => (
                <div
                    key={click.id}
                    className="absolute"
                    style={{
                        left: click.x,
                        top: click.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="relative">
                        {/* Main Ripple */}
                        <div className="absolute w-8 h-8 rounded-full border-2 border-indigo-500 opacity-0 animate-ping-slow" />
                        <div className="absolute w-4 h-4 rounded-full bg-indigo-400/30 opacity-0 animate-scale-fade" />

                        {/* Particles */}
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-indigo-600 rounded-full animate-particle-fade"
                                style={{
                                    transform: `rotate(${i * 60}deg) translate(12px)`,
                                    animationDelay: `${i * 0.05}s`
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes ping-slow {
                    0% { transform: scale(0.2); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes scale-fade {
                    0% { transform: scale(0); opacity: 0.6; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes particle-fade {
                    0% { transform: rotate(var(--rot)) translate(0px); opacity: 1; }
                    100% { transform: rotate(var(--rot)) translate(20px); opacity: 0; }
                }
                .animate-ping-slow { animation: ping-slow 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
                .animate-scale-fade { animation: scale-fade 0.4s ease-out forwards; }
                .animate-particle-fade { animation: particle-fade 0.5s ease-out forwards; }
            `}</style>
        </div>,
        document.body
    );
};
