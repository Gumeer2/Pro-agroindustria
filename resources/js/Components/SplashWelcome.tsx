import React, { useState, useEffect } from 'react';

export const SplashWelcome = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [phase, setPhase] = useState(0); // 0: Init, 1: Logo, 2: Text, 3: Shimmer

    useEffect(() => {
        const hasSeenSplash = sessionStorage.getItem('ve_splash_seen');
        if (!hasSeenSplash) {
            setShouldRender(true);
            setIsVisible(true);
            sessionStorage.setItem('ve_splash_seen', 'true');
            
            // Animation sequence
            setTimeout(() => setPhase(1), 100);
            setTimeout(() => setPhase(2), 1200);
            setTimeout(() => setPhase(3), 2000);
            
            // Start fade out after 4 seconds
            const fadeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 4000);
            
            // Unmount after animation finishes (4.8s)
            const unmountTimer = setTimeout(() => {
                setShouldRender(false);
            }, 4800);
            
            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(unmountTimer);
            };
        }
    }, []);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617] overflow-hidden transition-all duration-1000 ease-in-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
            
            {/* Ambient Background Particles */}
            <div className="absolute inset-0 z-0">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute rounded-full bg-blue-500/20 blur-[1px] animate-float"
                        style={{
                            width: `${Math.random() * 4 + 2}px`,
                            height: `${Math.random() * 4 + 2}px`,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 10 + 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Gradient Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                
                {/* Logo Container */}
                <div className={`relative transition-all duration-1000 transform ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-ping duration-[3000ms] opacity-20" />
                    <div className="relative p-1 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 shadow-2xl">
                        <img 
                            src="/images/logovecode.png" 
                            alt="VECODE Logo" 
                            className="h-28 md:h-40 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-[4000ms] ease-out scale-100"
                            style={{ transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)' }}
                        />
                    </div>
                </div>

                {/* Welcome Text */}
                <div className="mt-12 text-center overflow-hidden">
                    <div className={`transition-all duration-1000 delay-300 transform ${phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        <h2 className="text-white text-lg md:text-xl font-medium tracking-[0.5em] uppercase opacity-60 mb-2">
                            Bienvenido a
                        </h2>
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-blue-300/50 tracking-tighter italic">
                            VECODE
                        </h1>
                    </div>
                    
                    {/* Animated Line */}
                    <div className="mt-8 relative h-px w-[300px] mx-auto overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent transition-all duration-[1500ms] ${phase >= 2 ? 'translate-x-0' : '-translate-x-full'}`} />
                    </div>

                    {/* Slogan */}
                    <div className={`mt-6 transition-all duration-1000 delay-1000 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-blue-200/50 text-xs font-bold uppercase tracking-[0.3em]">
                            Sistema Integral de Operaciones Portuarias
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes float {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    20% { opacity: 0.5; }
                    80% { opacity: 0.5; }
                    100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
                }
                .animate-float {
                    animation: float linear infinite;
                }
            `}} />
        </div>
    );
};
