import React from "react";
import { Scale, X, CheckCircle2 } from "lucide-react";

interface ScaleModalProps {
    currentScale: number;
    onSelect: (id: number) => void;
    onClose: () => void;
}

const ScaleModal: React.FC<ScaleModalProps> = ({
    currentScale,
    onSelect,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Scale className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">Seleccionar Báscula</h3>
                            <p className="text-indigo-100 text-sm font-medium">Báscula de trabajo activa</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map((id) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onSelect(id)}
                                className={`w-full group relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 ${
                                    currentScale === id
                                        ? "border-indigo-600 bg-indigo-50"
                                        : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`p-4 rounded-xl transition-colors ${
                                            currentScale === id
                                                ? "bg-indigo-600 text-white"
                                                : "bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                        }`}
                                    >
                                        <span className="text-xl font-black">{id}</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 text-lg">BASCULA 0{id}</div>
                                    </div>
                                </div>
                                {currentScale === id && (
                                    <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScaleModal;
