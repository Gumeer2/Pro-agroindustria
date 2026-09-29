import React, { useState } from 'react';
import { QrCode, Anchor, Ship, Truck, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const DockScannerMockup = () => {
    const [selectedHold, setSelectedHold] = useState<number | null>(null);
    const [scanning, setScanning] = useState(false);
    const [lastScan, setLastScan] = useState<any>(null);

    // Mock data for holds
    const [holds, setHolds] = useState([
        { id: 1, name: 'Bodega 1', status: 'full', progress: 100, product: 'Maíz Amarillo' },
        { id: 2, name: 'Bodega 2', status: 'loading', progress: 45, product: 'Trigo' },
        { id: 3, name: 'Bodega 3', status: 'empty', progress: 0, product: '-' },
        { id: 4, name: 'Bodega 4', status: 'loading', progress: 12, product: 'Soya' },
        { id: 5, name: 'Bodega 5', status: 'empty', progress: 0, product: '-' },
    ]);

    const handleScan = () => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setLastScan({
                unit: 'UTC-124',
                operator: 'Carlos Mendoza',
                product: 'Trigo',
                weight: '32.50 Ton',
                type: 'Descarga'
            });
        }, 1500);
    };

    const assignToHold = (id: number) => {
        if (!lastScan) return;
        setHolds(prev => prev.map(h =>
            h.id === id ? { ...h, status: 'loading', progress: Math.min(h.progress + 5, 100), product: lastScan.product } : h
        ));
        setLastScan(null);
        setSelectedHold(null);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Anchor className="text-blue-400" />
                        Escáner de Bodegas <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded uppercase tracking-wider">Muelle - Ejemplo</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Control de Carga/Descarga en Tiempo Real</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase">Barco en Muelle</p>
                        <p className="font-semibold text-blue-300">YASA ROSE</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                        <Ship size={20} className="text-blue-400" />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Ship Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Ship size={200} />
                        </div>

                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <Info size={18} className="text-slate-500" />
                            Mapa de Estiba Interactivo
                        </h2>

                        {/* Ship Layout Mockup */}
                        <div className="relative py-12 flex justify-center">
                            {/* The Vessel Body */}
                            <div className="relative w-full max-w-2xl h-32 bg-slate-700 rounded-full flex items-center px-12 border-4 border-slate-600 shadow-2xl">

                                {/* Bow / Stern Details */}
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-600 transform rotate-45 rounded-sm shadow-lg"></div>
                                <div className="absolute -right-2 top-0 bottom-0 w-16 bg-slate-600 rounded-r-full border-l border-slate-500"></div>

                                {/* Holds Grid */}
                                <div className="flex-1 grid grid-cols-5 gap-3 h-20 z-10">
                                    {holds.map((hold) => (
                                        <button
                                            key={hold.id}
                                            onClick={() => setSelectedHold(hold.id)}
                                            className={`relative rounded-lg border-2 transition-all duration-300 overflow-hidden group
                                                ${selectedHold === hold.id ? 'border-blue-400 scale-105 shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'border-slate-500 hover:border-slate-400'}
                                                ${hold.status === 'full' ? 'bg-green-500/20' : hold.status === 'loading' ? 'bg-blue-500/20' : 'bg-slate-800/40'}
                                            `}
                                        >
                                            {/* Fill Level Animator */}
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 border-t 
                                                    ${hold.status === 'full' ? 'bg-green-500/40 border-green-400' : 'bg-blue-500/40 border-blue-400'}`}
                                                style={{ height: `${hold.progress}%` }}
                                            ></div>

                                            <span className="relative z-20 text-[10px] font-bold uppercase block text-center mt-6">
                                                B{hold.id}
                                            </span>

                                            {hold.status === 'loading' && (
                                                <div className="absolute top-1 right-1">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Hold Details Summary */}
                        <div className="grid grid-cols-5 gap-4 mt-8">
                            {holds.map((hold) => (
                                <div key={hold.id} className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">{hold.name}</p>
                                    <div className="h-1.5 w-full bg-slate-700 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${hold.status === 'full' ? 'bg-green-500' : 'bg-blue-500'}`}
                                            style={{ width: `${hold.progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs mt-1 font-mono">{hold.progress}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Feed */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Actividad Reciente</h3>
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                        <Truck size={16} className="text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Unidad UTC-087 completó descarga en <span className="text-blue-400">Bodega 2</span></p>
                                        <p className="text-[10px] text-slate-500">Hace 4 minutos</p>
                                    </div>
                                    <CheckCircle2 size={16} className="text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Interaction Controls */}
                <div className="space-y-6">

                    {/* QR Scanner Simulator */}
                    <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl">
                        <div className="p-4 bg-slate-700/50 border-b border-slate-600 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Módulo de Escaneo</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            {!lastScan ? (
                                <>
                                    <div className={`w-48 h-48 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-500
                                        ${scanning ? 'border-blue-400 bg-blue-500/5' : 'border-slate-600 bg-slate-900/50'}
                                    `}>
                                        {scanning ? (
                                            <div className="relative">
                                                <QrCode size={64} className="text-blue-400 opacity-20" />
                                                <div className="absolute inset-0 border-t-2 border-blue-400 animate-scan"></div>
                                            </div>
                                        ) : (
                                            <QrCode size={64} className="text-slate-600" />
                                        )}
                                        <p className="text-[10px] mt-4 text-slate-500 uppercase font-bold tracking-widest">Esperando QR...</p>
                                    </div>

                                    <button
                                        onClick={handleScan}
                                        disabled={scanning}
                                        className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40"
                                    >
                                        <QrCode size={20} />
                                        {scanning ? 'Escaneando...' : 'Simular Escaneo'}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] text-blue-400 uppercase font-bold">Unidad Identificada</p>
                                                <h4 className="text-xl font-bold">{lastScan.unit}</h4>
                                            </div>
                                            <span className="bg-blue-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{lastScan.type}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-slate-500 text-[10px]">OPERADOR</p>
                                                <p className="font-semibold">{lastScan.operator}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px]">PRODUCTO</p>
                                                <p className="font-semibold">{lastScan.product}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase">
                                            <AlertCircle size={14} className="text-amber-400" />
                                            Seleccionar Bodega de Destino
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {holds.map(h => (
                                                <button
                                                    key={h.id}
                                                    onClick={() => assignToHold(h.id)}
                                                    className={`py-3 rounded-lg border font-bold text-sm transition-all
                                                        ${h.status === 'full' ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800' : 'bg-slate-700 border-slate-600 hover:bg-blue-600 hover:border-blue-400'}
                                                    `}
                                                >
                                                    B{h.id}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setLastScan(null)}
                                        className="w-full py-2 text-xs text-slate-500 hover:text-white transition-colors"
                                    >
                                        Cancelar Operación
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <Anchor size={120} />
                        </div>
                        <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest mb-1">Carga Total Buque</p>
                        <h4 className="text-3xl font-bold text-white mb-4">1,420.30<span className="text-sm ml-1 font-normal opacity-70">TON</span></h4>
                        <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[64%] shadow-[0_0_10px_white]"></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-blue-100/60 uppercase">
                            <span>Descargado: 34k Ton</span>
                            <span>Total Barco: 52k Ton</span>
                        </div>
                    </div>

                </div>
            </div>

            <Dragon3D />

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0; }
                    50% { top: 100%; }
                }
                .animate-scan {
                    position: absolute;
                    width: 100%;
                    animation: scan 2s ease-in-out infinite;
                }

                /* Dragon 3D Animations */
                .dragon-container {
                    position: fixed;
                    top: -100px;
                    left: -100px;
                    width: 150px;
                    height: 150px;
                    z-index: 9999;
                    pointer-events: none;
                    perspective: 1000px;
                    animation: fly-path 25s linear infinite;
                    transform-style: preserve-3d;
                }

                .dragon-body {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transform-style: preserve-3d;
                    animation: bob 2s ease-in-out infinite;
                }

                .wing {
                    position: absolute;
                    top: 20%;
                    width: 80px;
                    height: 50px;
                    background: #e11d48;
                    clip-path: polygon(0% 0%, 100% 50%, 0% 100%, 20% 50%);
                    transform-origin: left center;
                }

                .wing-left {
                    left: 20%;
                    animation: flap-left 0.4s ease-in-out infinite;
                }

                .wing-right {
                    left: 20%;
                    animation: flap-right 0.4s ease-in-out infinite;
                    transform: scaleX(-1);
                }

                .dragon-head {
                    position: absolute;
                    top: 10%;
                    left: 60%;
                    width: 40px;
                    height: 40px;
                    background: #fbbf24;
                    border-radius: 50% 50% 20% 20%;
                    transform: rotateY(20deg);
                }

                .fire-breath {
                    position: absolute;
                    top: 50%;
                    left: 100%;
                    width: 0;
                    height: 20px;
                    background: linear-gradient(90deg, #f59e0b, #ef4444);
                    border-radius: 0 50% 50% 0;
                    opacity: 0;
                    filter: blur(4px);
                    animation: spit-fire 5s infinite;
                }

                @keyframes fly-path {
                    0% { transform: translate(0, 0) rotateY(0deg) scale(0.5); }
                    25% { transform: translate(80vw, 20vh) rotateY(180deg) scale(1.2); }
                    50% { transform: translate(20vw, 80vh) rotateY(0deg) scale(0.8); }
                    75% { transform: translate(90vw, 70vh) rotateY(180deg) scale(1.5); }
                    100% { transform: translate(0, 0) rotateY(0deg) scale(0.5); }
                }

                @keyframes flap-left {
                    0%, 100% { transform: rotateY(-40deg) rotateX(30deg); }
                    50% { transform: rotateY(-40deg) rotateX(-60deg); }
                }

                @keyframes flap-right {
                    0%, 100% { transform: scaleX(-1) rotateY(-40deg) rotateX(30deg); }
                    50% { transform: scaleX(-1) rotateY(-40deg) rotateX(-60deg); }
                }

                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }

                @keyframes spit-fire {
                    0%, 80%, 100% { width: 0; opacity: 0; }
                    85% { width: 100px; opacity: 1; }
                    95% { width: 120px; opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

const Dragon3D = () => (
    <div className="dragon-container">
        <div className="dragon-body">
            {/* Wings */}
            <div className="wing wing-left"></div>
            <div className="wing wing-right"></div>

            {/* Body Segments */}
            <div className="absolute top-1/2 left-0 w-20 h-12 bg-rose-600 rounded-full transform -translate-y-1/2"></div>

            {/* Head */}
            <div className="dragon-head">
                <div className="absolute top-2 left-6 w-2 h-2 bg-black rounded-full"></div>
                {/* Fire */}
                <div className="fire-breath"></div>
            </div>

            {/* Tail */}
            <div className="absolute top-1/2 -left-10 w-16 h-6 bg-rose-700 rounded-full origin-right animate-bounce"></div>
        </div>
    </div>
);

export default DockScannerMockup;
