
import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { X, Camera, Scan } from 'lucide-react';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string | null) => void;
    title?: string;
}

export default function QrScannerModal({ isOpen, onClose, onScan, title = "Escanear Código QR" }: QrScannerModalProps) {
    const [scanError, setScanError] = useState<string | null>(null);

    // Using a ref or checking type to handle different QrReader versions/types safely if needed,
    // but standard usage for react-qr-reader v3 is straightforward.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    title="Cerrar escáner"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-4">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Scan className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Apunta la cámara hacia el código QR del operador.
                    </p>
                </div>

                <div className="relative bg-black rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                    <QrReader
                        onResult={(result: any, error) => {
                            if (!!result) {
                                const text = typeof result.getText === 'function' ? result.getText() : result.text;
                                onScan(text);
                            }
                            if (!!error) {
                                // console.info(error);
                                // Optional: handle specific errors
                            }
                        }}
                        constraints={{ facingMode: 'environment' }}
                        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        className="w-full h-full"
                    />

                    {/* Overlay Borders for targeting */}
                    <div className="absolute inset-0 border-2 border-white/30 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-indigo-500 rounded-lg pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>

                    <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs font-medium z-10 drop-shadow-md">
                        Escaneando...
                    </p>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
