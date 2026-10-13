import React, { useState } from "react";
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
    ExternalLink,
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
    const [activeTab, setActiveTab] = useState<"all" | "fo003" | "fo002">("all");

    const safeOrder = order || {};

    const handlePrint = () => {
        window.print();
    };

    const handleOpenFullPrint = () => {
        if (safeOrder.id) {
            window.open(route("documentation.orders.print", safeOrder.id), "_blank");
        }
    };

    return (
        <>
            {/* Direct Body Portal for Clean Native Browser Printing (zero modal offsets, perfectly aligned to Letter margins) */}
            {typeof document !== "undefined" &&
                isOpen &&
                createPortal(
                    <div id="direct-body-print-portal">
                        {(activeTab === "all" || activeTab === "fo003") && (
                            <div className="page-weight-verification">
                                <WeightVerificationTemplate order={safeOrder} samples={samples} />
                            </div>
                        )}
                        {(activeTab === "all" || activeTab === "fo002") && (
                            <div className="stowage-page-wrapper">
                                <div className="rotate-landscape-v2">
                                    <StowageNoteTemplate order={safeOrder} samples={samples} />
                                </div>
                            </div>
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
                    .page-weight-verification {
                        width: 100% !important;
                        max-width: 198mm !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        background: #fff !important;
                    }
                    .stowage-page-wrapper {
                        position: relative !important;
                        width: 100% !important;
                        height: 260mm !important;
                        margin: 0 auto !important;
                        overflow: hidden !important;
                        box-sizing: border-box !important;
                        page-break-after: auto !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        background: #fff !important;
                    }
                    .rotate-landscape-v2 {
                        transform: rotate(90deg) translateY(-100%) !important;
                        transform-origin: top left !important;
                        width: 254mm !important;
                        height: 186mm !important;
                        position: absolute !important;
                        top: 4mm !important;
                        left: 4mm !important;
                        box-sizing: border-box !important;
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

                                        {/* Action Buttons & Tab Switcher */}
                                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                                            {/* Tabs */}
                                            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("all")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                        activeTab === "all"
                                                            ? "bg-white text-indigo-700 shadow-sm"
                                                            : "text-gray-600 hover:text-gray-900"
                                                    }`}
                                                >
                                                    Ambos
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("fo003")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                                        activeTab === "fo003"
                                                            ? "bg-white text-indigo-700 shadow-sm"
                                                            : "text-gray-600 hover:text-gray-900"
                                                    }`}
                                                    title="Verificación de Peso de Sacos (Vertical)"
                                                >
                                                    <Scale className="w-3.5 h-3.5" />
                                                    GLS-AP-FO-003 (Vertical)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("fo002")}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                                        activeTab === "fo002"
                                                            ? "bg-white text-indigo-700 shadow-sm"
                                                            : "text-gray-600 hover:text-gray-900"
                                                    }`}
                                                    title="Nota de Estiba a Camión (Horizontal)"
                                                >
                                                    <Layers className="w-3.5 h-3.5" />
                                                    GLS-AP-FO-002 (Horizontal)
                                                </button>
                                            </div>

                                            {/* Print Button */}
                                            <button
                                                type="button"
                                                onClick={handlePrint}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition transform active:scale-95"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span>Imprimir</span>
                                            </button>

                                            {safeOrder.id && (
                                                <button
                                                    type="button"
                                                    onClick={handleOpenFullPrint}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-bold transition shadow-sm"
                                                    title="Abrir página completa de impresión"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                                                    <span>Pestaña</span>
                                                </button>
                                            )}

                                            {/* Close Button */}
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Body: Document Preview on Screen */}
                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                                        <div className="space-y-6 max-w-[215mm] mx-auto">
                                            {/* PAGE 1: GLS-AP-FO-003 (VERIFICACION DE PESO DE SACOS - VERTICAL) */}
                                            {(activeTab === "all" || activeTab === "fo003") && (
                                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-3 sm:p-4">
                                                    <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                        <span className="flex items-center gap-1.5 text-indigo-700">
                                                            <Scale className="w-4 h-4" />
                                                            GLS-AP-FO-003 · VERIFICACIÓN DE PESO DE SACOS (VERTICAL)
                                                        </span>
                                                        <span>Hoja 1</span>
                                                    </div>
                                                    <WeightVerificationTemplate order={safeOrder} samples={samples} />
                                                </div>
                                            )}

                                            {/* PAGE 2: GLS-AP-FO-002 (NOTA DE ESTIBA A CAMIÓN - HORIZONTAL) */}
                                            {(activeTab === "all" || activeTab === "fo002") && (
                                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-3 sm:p-4">
                                                    <div className="mb-2 pb-2 border-b border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                        <span className="flex items-center gap-1.5 text-emerald-700">
                                                            <Layers className="w-4 h-4" />
                                                            GLS-AP-FO-002 · NOTA DE ESTIBA A CAMIÓN (HORIZONTAL)
                                                        </span>
                                                        <span>Hoja 2</span>
                                                    </div>
                                                    <div className="w-full">
                                                        <StowageNoteTemplate order={safeOrder} samples={samples} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-4 bg-white border-t border-gray-200 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                                        <div className="text-xs text-gray-500">
                                            Impresión directa optimizada en hoja Carta (Página 1: Vertical / Página 2: Horizontal).
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="w-full sm:w-auto px-5 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                                            >
                                                Cerrar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePrint}
                                                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                Imprimir Documentos
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
