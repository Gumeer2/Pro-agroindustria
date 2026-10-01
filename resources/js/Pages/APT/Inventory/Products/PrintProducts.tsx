import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";

interface InventoryItem {
    id: number;
    code: string;
    name: string;
    description?: string;
    type_id: number;
    type_name: string;
    type_slug: string;
    group_number: number;
    group_name: string;
    unit: string;
    unit_cost: number;
    stock: number;
    min_stock: number;
    location?: string;
    is_inventoried: boolean;
    created_at?: string;
    user?: {
        name: string;
    };
}

interface Props {
    items: InventoryItem[];
    mode?: "catalog" | "inventory";
}

export default function PrintProducts({ items = [], mode }: Props) {
    const handlePrint = () => {
        window.print();
    };

    // Determine mode: catalog (default when clicking 'Imprimir Catálogo') or inventory (when clicking 'Imprimir Seleccionados')
    const hasIdsParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ids");
    const isCatalog = mode === "catalog" || (!mode && !hasIdsParam);

    const totalStockSum = items.reduce((acc, curr) => acc + Number(curr.stock || 0), 0);
    const totalValueSum = items.reduce((acc, curr) => acc + (Number(curr.stock || 0) * Number(curr.unit_cost || 0)), 0);

    const firstLocation = items[0]?.location?.trim();
    const uniqueLocations = Array.from(new Set(items.map((i) => i.location?.trim()).filter(Boolean)));

    let locationDisplay = "ALMACÉN GENERAL";
    if (uniqueLocations.length > 0) {
        locationDisplay = uniqueLocations.join(" / ").toUpperCase();
    } else if (firstLocation) {
        locationDisplay = firstLocation.toUpperCase();
    }

    return (
        <div className="min-h-screen bg-slate-100 p-0 sm:p-6 print:p-0 print:bg-white text-slate-900 font-sans">
            <Head title={isCatalog ? `Catálogo de Insumos (${items.length} Productos)` : `Control Físico de Existencias (${items.length} Productos)`} />

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body, html {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-sheet {
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 24px !important;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Sticky Action Toolbar */}
            <div className="max-w-5xl mx-auto mb-6 no-print flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <Link
                    href={route("apt.inventory.products.index")}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold text-xs sm:text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al Catálogo de Productos</span>
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                        {items.length} {items.length === 1 ? (isCatalog ? "producto listado" : "producto seleccionado") : (isCatalog ? "productos listados" : "productos seleccionados")}
                    </span>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-105 text-xs sm:text-sm cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{isCatalog ? "Imprimir Catálogo de Productos" : "Imprimir Control de Inventario / Existencias"}</span>
                    </button>
                </div>
            </div>

            {/* Main Printable Document Sheet */}
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 print-sheet relative overflow-hidden">
                
                {/* 1. Official Header Box (Format GLS-AP-FO-005 Style) */}
                <div className="border border-black mb-3 p-2.5 bg-white">
                    <div className="grid grid-cols-[110px_1fr_110px] items-center gap-2">
                        {/* Left Logo */}
                        <div className="flex items-center justify-start">
                            <img
                                src="/Proagro.png"
                                alt="Pro-Agroindustria Logo"
                                className="h-[62px] w-[80px] object-contain"
                            />
                        </div>

                        {/* Center Title */}
                        <div className="text-center">
                            <h1 className="text-[17px] font-black tracking-tight text-black leading-tight">
                                PRO-AGROINDUSTRIA S.A. DE C.V.
                            </h1>
                            <div className="mx-auto my-1 h-[2.5px] w-48 bg-red-600"></div>
                        </div>

                        {/* Right Truck Illustration */}
                        <div className="flex items-center justify-end pr-1">
                            <svg
                                viewBox="0 0 120 70"
                                className="h-[52px] w-[95px]"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M75 18H94C96.5 18 98.8 19.3 100 21.5L108 36.5C108.7 37.7 109 39.1 109 40.5V52C109 53.7 107.7 55 106 55H102C102 49.5 97.5 45 92 45C86.5 45 82 49.5 82 55H75V18Z"
                                    fill="#1e293b"
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                <path
                                    d="M78 22H92L99 35H78V22Z"
                                    fill="#93c5fd"
                                    stroke="#0f172a"
                                    strokeWidth="1"
                                />
                                <rect
                                    x="10"
                                    y="12"
                                    width="64"
                                    height="43"
                                    rx="2"
                                    fill="#e2e8f0"
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                <line x1="10" y1="20" x2="74" y2="20" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="10" y1="28" x2="74" y2="28" stroke="#ef4444" strokeWidth="2.5" />
                                <line x1="10" y1="36" x2="74" y2="36" stroke="#94a3b8" strokeWidth="1" />
                                <circle cx="24" cy="55" r="7" fill="#0f172a" />
                                <circle cx="24" cy="55" r="3.5" fill="#cbd5e1" />
                                <circle cx="40" cy="55" r="7" fill="#0f172a" />
                                <circle cx="40" cy="55" r="3.5" fill="#cbd5e1" />
                                <circle cx="92" cy="55" r="7" fill="#0f172a" />
                                <circle cx="92" cy="55" r="3.5" fill="#cbd5e1" />
                                <rect x="107" y="44" width="3" height="4" rx="1" fill="#facc15" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. Sub-Banner */}
                <div className="border border-black bg-[#e0e7ff] mb-3 rounded-full py-1.5 px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-1">
                    <span className="text-[13px] font-black uppercase tracking-wide text-gray-900">
                        {isCatalog ? "CATÁLOGO DE PRODUCTOS E INSUMOS" : "CATÁLOGO Y CONTROL FÍSICO DE EXISTENCIAS DE INSUMOS"}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-indigo-900 px-3 py-0.5 rounded-full border border-indigo-300 shadow-sm">
                        TOTAL PRODUCTOS: {items.length}
                    </span>
                </div>

                {/* Info Grid */}
                {isCatalog ? (
                    /* Clean 3-column Catalog Info Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Fecha de Emisión:
                            </span>
                            <span className="font-bold text-gray-900 text-sm">
                                {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Total de Insumos Registrados:
                            </span>
                            <span className="font-bold text-indigo-700 text-sm">
                                {items.length} {items.length === 1 ? "Registro" : "Registros"}
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Clasificación / Ubicación:
                            </span>
                            <span className="font-bold text-gray-800 text-sm truncate block">
                                {locationDisplay}
                            </span>
                        </div>
                    </div>
                ) : (
                    /* 4-column Full Inventory Summary Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Fecha de Emisión:
                            </span>
                            <span className="font-bold text-gray-900 text-sm">
                                {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Total de Insumos:
                            </span>
                            <span className="font-bold text-indigo-700">
                                {items.length} Registros
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Existencia Total:
                            </span>
                            <span className="font-bold text-emerald-700">
                                {totalStockSum.toLocaleString("es-MX", { maximumFractionDigits: 2 })} Unidades
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                                Valuación Global:
                            </span>
                            <span className="font-bold text-gray-900">
                                ${totalValueSum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Material Details Table */}
                <div className="mb-6">
                    <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#1e1b4b] text-white font-extrabold uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-3 text-center border-r border-slate-700 w-12">#</th>
                                    <th className="py-3 px-4 text-center border-r border-slate-700 w-36">CLAVE / SKU</th>
                                    <th className="py-3 px-5 border-r border-slate-700">DESCRIPCIÓN DEL INSUMO / ESPECIFICACIONES</th>
                                    <th className={`py-3 px-4 ${!isCatalog ? "border-r border-slate-700 w-52" : "w-60"}`}>SUBMÓDULO & GRUPO</th>
                                    {!isCatalog && (
                                        <>
                                            <th className="py-3 px-3 text-center border-r border-slate-700 w-20">UNIDAD</th>
                                            <th className="py-3 px-3 text-center border-r border-slate-700 w-24">STOCK ACTUAL</th>
                                            <th className="py-3 px-3 text-right border-r border-slate-700 w-28">COSTO UNIT.</th>
                                            <th className="py-3 px-4 text-right w-32">VALOR TOTAL</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.map((item, idx) => (
                                    <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                        <td className="py-3 px-3 text-center font-bold text-gray-500 border-r border-gray-200 text-[11px]">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-800 bg-gray-50 border-r border-gray-200">
                                            {item.code}
                                        </td>
                                        <td className="py-3 px-5 border-r border-gray-200">
                                            <div className="font-black text-gray-900 text-xs">
                                                {item.name}
                                            </div>
                                            {item.description && (
                                                <div className="text-gray-500 text-[10px] mt-0.5">
                                                    {item.description}
                                                </div>
                                            )}
                                            {item.location && (
                                                <div className="text-gray-400 text-[10px]">
                                                    Ubicación: {item.location}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`py-3 px-4 ${!isCatalog ? "border-r border-gray-200" : ""}`}>
                                            <div className="text-[11px] font-semibold text-gray-800">{item.type_name}</div>
                                            <div className="text-[10px] text-gray-500">G{item.group_number}: {item.group_name}</div>
                                        </td>
                                        {!isCatalog && (
                                            <>
                                                <td className="py-3 px-3 text-center font-extrabold text-gray-700 uppercase bg-gray-50/50 border-r border-gray-200">
                                                    {item.unit}
                                                </td>
                                                <td className="py-3 px-3 text-center font-black text-gray-900 border-r border-gray-200">
                                                    {Number(item.stock).toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-gray-700 border-r border-gray-200">
                                                    ${Number(item.unit_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right font-black text-indigo-900 bg-indigo-50/30">
                                                    ${(Number(item.stock || 0) * Number(item.unit_cost || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                            {!isCatalog && (
                                <tfoot>
                                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                                        <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-gray-600">
                                            TOTALES GENERALES ({items.length} INSUMOS):
                                        </td>
                                        <td></td>
                                        <td className="py-2.5 px-3 text-center font-black text-emerald-800">
                                            {totalStockSum.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                        <td className="py-2.5 px-4 text-right font-black text-indigo-950 text-sm">
                                            ${totalValueSum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Signatures Section (Only for Physical Inventory / Selection Control) */}
                {!isCatalog && (
                    <div className="pt-6 border-t border-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-6">
                            FIRMAS DE CONTROL Y VERIFICACIÓN DE INVENTARIO FÍSICO
                        </span>

                        <div className="grid grid-cols-3 gap-6 text-center text-xs">
                            {/* 1. Levantó */}
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                    <span className="text-gray-400 text-[10px] italic">Firma Auditor / Inventario</span>
                                </div>
                                <span className="font-bold text-gray-900 text-[11px] block">
                                    LEVANTÓ INVENTARIO
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    Personal de Almacén / Auditor
                                </span>
                            </div>

                            {/* 2. Verificó */}
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                    <span className="text-gray-400 text-[10px] italic">Firma Almacenista</span>
                                </div>
                                <span className="font-bold text-gray-900 text-[11px] block">
                                    VERIFICÓ Y VALIDÓ
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    Responsable de Almacén
                                </span>
                            </div>

                            {/* 3. Autorizó */}
                            <div className="flex flex-col justify-end">
                                <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                    <span className="text-gray-400 text-[10px] italic">Firma y Sello</span>
                                </div>
                                <span className="font-bold text-gray-900 text-[11px] block">
                                    AUTORIZÓ V.B.
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    Control de Inventarios
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Notes */}
                <div className="mt-8 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Proagroindustria - Gestión Integral de Inventarios y Almacenes</span>
                    <span>Documento emitido electrónicamente • {new Date().toLocaleString("es-MX")}</span>
                </div>
            </div>
        </div>
    );
}
