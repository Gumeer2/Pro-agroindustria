import React from "react";
import { Scale, Settings, CheckCircle2 } from "lucide-react";

interface ActiveScaleIndicatorProps {
    scaleId: number;
    onClick?: () => void;
    showLabel?: boolean;
    className?: string;
}

const ActiveScaleIndicator: React.FC<ActiveScaleIndicatorProps> = ({
    scaleId,
    onClick,
    showLabel = true,
    className = "",
}) => {
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`flex items-center gap-3 px-6 py-3 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 group relative overflow-hidden ${
                onClick ? "cursor-pointer active:scale-95" : "cursor-default border-indigo-200 bg-indigo-50/30"
            } ${className}`}
        >
            {/* Background animated pulse effect */}
            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className={`p-2 rounded-xl transition-all duration-300 relative z-10 bg-indigo-600 text-white animate-pulse shadow-lg shadow-indigo-200`}>
                <Scale className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
            </div>

            <div className="text-left relative z-10">
                {showLabel && (
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 group-hover:text-indigo-500 transition-colors">
                        Báscula Activa
                    </div>
                )}
                <div className="text-sm font-black text-gray-700 leading-none flex items-center gap-2">
                    <span className="text-indigo-600 text-xl font-black">#{scaleId}</span>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-3 relative z-10">
                {onClick && (
                    <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-gray-100">
                        <Settings className="w-4 h-4" />
                    </div>
                )}
                
                <div className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </div>
            </div>
        </button>
    );
};

export default ActiveScaleIndicator;
