import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
    X,
    Printer,
    FileText,
    Layers,
    Scale,
    CheckCircle2,
} from "lucide-react";
import WeightVerificationTemplate from "@/Components/Print/WeightVerificationTemplate";
import StowageNoteTemplate from "@/Components/Print/StowageNoteTemplate";

interface SampleRecord {
    id: number;
    num: number;
    envasadora: 1 | 2;
    weight: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order?: any;
    samples?: SampleRecord[];
}

export default function ShipmentDocumentsPrintModal({
    isOpen,
    onClose,
    order = {},
    samples = [],
}: Props) {
    const safeOrder = order || {};

    const effectiveSamples = useMemo(() => {
        if (Array.isArray(samples) && samples.length >= 80) {
            return samples;
        }
        if (Array.isArray(safeOrder?.samples) && safeOrder.samples.length >= 80) {
            return safeOrder.samples;
        }
        if (Array.isArray(samples) && samples.length > 0) {
            return samples;
        }
        if (Array.isArray(safeOrder?.samples) && safeOrder.samples.length > 0) {
            return safeOrder.samples;
        }
        if (typeof window === "undefined" || !safeOrder) return [];

        const candidateKeys = [
            safeOrder.id ? `envasadora_sampling_order_${safeOrder.id}` : null,
            safeOrder.id ? `envasadora_sampling_${safeOrder.id}` : null,
            safeOrder.folio ? `envasadora_sampling_order_${safeOrder.folio}` : null,
            safeOrder.folio ? `envasadora_sampling_${safeOrder.folio}` : null,
            safeOrder.order_number ? `envasadora_sampling_order_${safeOrder.order_number}` : null,
            safeOrder.order_number ? `envasadora_sampling_${safeOrder.order_number}` : null,
        ].filter(Boolean) as string[];

        let bestSamples: any[] = [];
        for (const key of candidateKeys) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed.samples) && parsed.samples.length > bestSamples.length) {
                        const payloadId = String(parsed.orderId || "");
                        const currentId = String(safeOrder.id || "");
                        const currentFolio = String(safeOrder.folio || "");
                        if (payloadId && payloadId !== currentId && payloadId !== currentFolio) {
                            continue;
                        }
                        bestSamples = parsed.samples;
                    }
                }
            } catch {}
        }
        return bestSamples;
    }, [samples, safeOrder]);

    const [printMode, setPrintMode] = useState<"all" | "weight-all" | "weight-1" | "weight-2" | "stowage">("all");

    const handlePrintAll = () => {
        setPrintMode("all");
        setTimeout(() => window.print(), 100);
    };

    const handlePrintWeightAll = () => {
        setPrintMode("weight-all");
        setTimeout(() => window.print(), 100);
    };

    const handlePrintWeight1 = () => {
        setPrintMode("weight-1");
        setTimeout(() => window.print(), 100);
    };

    const handlePrintWeight2 = () => {
        setPrintMode("weight-2");
        setTimeout(() => window.print(), 100);
    };

    const handlePrintStowage = () => {
        setPrintMode("stowage");
        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            {/* Direct Body Portal for Clean Native Browser Printing (zero modal offsets, perfectly aligned to Letter margins) */}
            {typeof document !== "undefined" &&
                isOpen &&
                createPortal(
                    <div id="direct-body-print-portal" className={`print-mode-${printMode}`}>
                        {(printMode === "all" || printMode === "weight-all" || printMode === "weight-1") && (
                            <section className="print-sheet print-sheet-portrait print-sheet-weight print-sheet-weight-1">
                                <WeightVerificationTemplate order={safeOrder} samples={effectiveSamples} targetPage={1} />
                            </section>
                        )}
                        {(printMode === "all" || printMode === "weight-all" || printMode === "weight-2") && (
                            <section className="print-sheet print-sheet-portrait print-sheet-weight print-sheet-weight-2">
                                <WeightVerificationTemplate order={safeOrder} samples={effectiveSamples} targetPage={2} />
                            </section>
                        )}
                        {(printMode === "all" || printMode === "stowage") && (
                            <section className="print-sheet print-sheet-landscape print-sheet-stowage">
                                <StowageNoteTemplate order={safeOrder} samples={effectiveSamples} />
                            </section>
                        )}
                    </div>,
                    document.body
                )}

            {/* Print Styles */}
            <style>{`
                #direct-body-print-portal {
                    display: none;
                }
                @media print {
                    @page {
                        size: letter portrait;
                        margin: 4mm 5mm;
                    }
                    @page portrait-sheet {
                        size: letter portrait;
                        margin: 4mm 5mm;
                    }
                    @page landscape-sheet {
                        size: letter landscape;
                        margin: 4mm 5mm;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: inherit;
                    }
                    body > *:not(#direct-body-print-portal) {
                        display: none !important;
                    }
                    #direct-body-print-portal {
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .print-sheet {
                        display: block !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        background: #fff !important;
                    }

                    /* HOJAS 1 Y 2: VERIFICACIÓN DE PESO (VERTICAL / PORTRAIT) */
                    .print-sheet-portrait {
                        page: portrait-sheet !important;
                        width: 100% !important;
                        max-width: 205mm !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* HOJA 3: NOTA DE ESTIBA (HORIZONTAL / LANDSCAPE) */
                    .print-sheet-landscape {
                        page: landscape-sheet !important;
                        width: 100% !important;
                        max-width: 269mm !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    /* Saltos estrictos de página para hojas separadas */
                    .print-mode-all .print-sheet-weight-1,
                    .print-mode-weight-all .print-sheet-weight-1 {
                        page-break-after: always !important;
                        break-after: page !important;
                    }

                    .print-mode-all .print-sheet-weight-2 {
                        page-break-before: always !important;
                        break-before: page !important;
                        page-break-after: always !important;
                        break-after: page !important;
                    }

                    .print-mode-weight-all .print-sheet-weight-2 {
                        page-break-before: always !important;
                        break-before: page !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    .print-mode-all .print-sheet-stowage {
                        page-break-before: always !important;
                        break-before: page !important;
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }

                    .print-mode-weight-all,
                    .print-mode-weight-1,
                    .print-mode-weight-2 {
                        page: portrait-sheet !important;
                    }

                    .print-mode-stowage {
                        page: landscape-sheet !important;
                    }
                }
            `}</style>

            <Transition.Root show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform rounded-3xl bg-slate-100 text-left shadow-2xl transition-all w-full max-w-5xl border border-slate-300 flex flex-col max-h-[92vh]">
                                    {/* Modal Header */}
                                    <div className="p-4 sm:p-5 bg-white border-b border-gray-200 rounded-t-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Dialog.Title className="text-lg sm:text-xl font-black text-gray-900">
                                                        Documentos de Embarque (PDF)
                                                    </Dialog.Title>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        Listo para Imprimir
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Folio: <span className="font-bold text-gray-800">{safeOrder.folio || "OE"}</span> • {safeOrder.product_text || safeOrder.product?.name || safeOrder.product || "Producto"} • Operador: {safeOrder.operator_name || safeOrder.operator?.name || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                                            {/* Print Sheet 1 Button */}
                                            <button
                                                type="button"
                                                onClick={handlePrintWeight1}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-indigo-700 rounded-xl text-xs font-bold shadow-sm transition"
                                                title="Imprimir solo la Hoja 1: Verificación de Peso (Muestras 1 a 40)"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                <span>Hoja 1 (1-40)</span>
                                            </button>

                                            {/* Print Sheet 2 Button */}
                                            <button
                                                type="button"
                                                onClick={handlePrintWeight2}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-indigo-700 rounded-xl text-xs font-bold shadow-sm transition"
                                                title="Imprimir solo la Hoja 2: Verificación de Peso (Muestras 41 a 80)"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                <span>Hoja 2 (41-80)</span>
                                            </button>

                                            {/* Print Stowage Button */}
                                            <button
                                                type="button"
                                                onClick={handlePrintStowage}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-emerald-700 rounded-xl text-xs font-bold shadow-sm transition"
                                                title="Imprimir solo la Nota de Estiba a Camión (Horizontal)"
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>Hoja 3 (Estiba)</span>
                                            </button>

                                            {/* Print All Button */}
                                            <button
                                                type="button"
                                                onClick={handlePrintAll}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition transform active:scale-95"
                                                title="Imprimir las 3 hojas por separado en sus formatos oficiales"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                <span>Imprimir Todo (3 Hojas)</span>
                                            </button>

                                            {/* Close Button */}
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                                                title="Cerrar"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Body: Document Preview on Screen */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                                        <div className="space-y-6 max-w-5xl mx-auto w-full">
                                            {/* PAGE 1: GLS-AP-FO-003 (HOJA 1 DE 2: MUESTRAS 1 A 40 - VERTICAL) */}
                                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-3 sm:p-4">
                                                <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                    <span className="flex items-center gap-1.5 text-indigo-700">
                                                        <Scale className="w-4 h-4" />
                                                        GLS-AP-FO-003 · VERIFICACIÓN DE PESO (HOJA 1 DE 2: MUESTRAS 1 A 40)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-gray-400">Hoja 1 de 3</span>
                                                        <button
                                                            type="button"
                                                            onClick={handlePrintWeight1}
                                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg transition"
                                                        >
                                                            <Printer className="w-3 h-3" /> Imprimir Hoja 1
                                                        </button>
                                                    </div>
                                                </div>
                                                <WeightVerificationTemplate order={safeOrder} samples={effectiveSamples} targetPage={1} />
                                            </div>

                                            {/* PAGE 2: GLS-AP-FO-003 (HOJA 2 DE 2: MUESTRAS 41 A 80 - VERTICAL) */}
                                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-3 sm:p-4">
                                                <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                    <span className="flex items-center gap-1.5 text-indigo-700">
                                                        <Scale className="w-4 h-4" />
                                                        GLS-AP-FO-003 · VERIFICACIÓN DE PESO (HOJA 2 DE 2: MUESTRAS 41 A 80)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-gray-400">Hoja 2 de 3</span>
                                                        <button
                                                            type="button"
                                                            onClick={handlePrintWeight2}
                                                            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg transition"
                                                        >
                                                            <Printer className="w-3 h-3" /> Imprimir Hoja 2
                                                        </button>
                                                    </div>
                                                </div>
                                                <WeightVerificationTemplate order={safeOrder} samples={effectiveSamples} targetPage={2} />
                                            </div>

                                            {/* PAGE 3: GLS-AP-FO-002 (NOTA DE ESTIBA A CAMIÓN - HORIZONTAL) */}
                                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-3 sm:p-4">
                                                <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                    <span className="flex items-center gap-1.5 text-emerald-700">
                                                        <Layers className="w-4 h-4" />
                                                        GLS-AP-FO-002 · NOTA DE ESTIBA A CAMIÓN (HORIZONTAL)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] text-gray-400">Hoja 3 de 3</span>
                                                        <button
                                                            type="button"
                                                            onClick={handlePrintStowage}
                                                            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg transition"
                                                        >
                                                            <Printer className="w-3 h-3" /> Imprimir Nota de Estiba
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="w-full">
                                                    <StowageNoteTemplate order={safeOrder} samples={effectiveSamples} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-4 bg-white border-t border-gray-200 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                                        <div className="text-xs text-gray-500">
                                            Impresión en hojas tamaño Carta separadas: Hojas 1 y 2 en vertical (40 muestras c/u) y Hoja 3 en horizontal.
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                                            >
                                                Cerrar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintWeight1}
                                                className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                                title="Imprimir solo Hoja 1 (Muestras 1 a 40)"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                Hoja 1 (1-40)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintWeight2}
                                                className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                                title="Imprimir solo Hoja 2 (Muestras 41 a 80)"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                Hoja 2 (41-80)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintWeightAll}
                                                className="px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-100/60 hover:bg-indigo-200/70 text-indigo-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                                title="Imprimir ambas hojas de peso (80 muestras en 2 hojas)"
                                            >
                                                <Scale className="w-3.5 h-3.5" />
                                                Peso (Hojas 1 y 2)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintStowage}
                                                className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                                                title="Imprimir solo Nota de Estiba (Horizontal)"
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                Nota de Estiba
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrintAll}
                                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                                                title="Imprimir las 3 hojas completas en hojas separadas"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                Imprimir Todo (3 Hojas)
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
}
