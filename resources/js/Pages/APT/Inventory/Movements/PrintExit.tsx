import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Printer, Boxes, CheckCircle2, Building2, Calendar, FileText, User, Warehouse } from "lucide-react";

interface MovementItem {
    id: number;
    movement_type: "entry" | "exit";
    item_id: number;
    item_code: string;
    item_name: string;
    type_name: string;
    group_number: number;
    group_name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    reference_document?: string;
    responsible_person?: string;
    destination_area?: string;
    location?: string;
    notes?: string;
    movement_date: string;
    entry_date?: string;
    exit_date?: string;
    created_at?: string;
    user?: {
        name: string;
    };
    item?: {
        description?: string;
        stock?: number;
    };
}

interface Props {
    movement?: MovementItem;
    movements?: MovementItem[];
}

export default function PrintExit({ movement, movements }: Props) {
    const handlePrint = () => {
        window.print();
    };

    const formatDate = (d?: string) => {
        if (!d) return "";
        try {
            const datePart = d.split("T")[0];
            const [y, m, day] = datePart.split("-");
            return `${day}/${m}/${y}`;
        } catch {
            return d;
        }
    };

    const itemsList: MovementItem[] = (movements && movements.length > 0)
        ? movements
        : (movement ? [movement] : []);

    const firstItem = itemsList[0] || ({} as Partial<MovementItem>);
    const isMultiple = itemsList.length > 1;
    const totalQuantitySum = itemsList.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);
    const totalCostSum = itemsList.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0);

    const folioDisplay = isMultiple
        ? `VALE-CONSOLIDADO (${itemsList.length} INSUMOS)`
        : (firstItem.reference_document || `VAL-${(firstItem.id || 0).toString().padStart(5, "0")}`);

    const firstLocation = (firstItem.location || firstItem.destination_area)?.trim();
    const uniqueLocations = Array.from(
        new Set(itemsList.map((i) => (i.location || i.destination_area)?.trim()).filter(Boolean))
    );

    let locationDisplay = "ÁREA OPERATIVA";
    if (itemsList.length === 1 && firstLocation) {
        locationDisplay = firstLocation.toUpperCase();
    } else if (uniqueLocations.length === 1) {
        locationDisplay = uniqueLocations[0].toUpperCase();
    } else if (uniqueLocations.length > 1) {
        const nonDefault = uniqueLocations.filter(
            (l) => l.toLowerCase() !== "área operativa" && l.toLowerCase() !== "area operativa"
        );
        if (nonDefault.length === 1) {
            locationDisplay = nonDefault[0].toUpperCase();
        } else if (nonDefault.length > 1) {
            locationDisplay = nonDefault.join(" / ").toUpperCase();
        } else {
            locationDisplay = uniqueLocations.join(" / ").toUpperCase();
        }
    } else if (firstLocation) {
        locationDisplay = firstLocation.toUpperCase();
    }

    return (
        <div className="min-h-screen bg-slate-100 p-0 sm:p-6 print:p-0 print:bg-white text-slate-900 font-sans">
            <Head title={`Vale de Salida - ${folioDisplay}`} />

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
            <div className="max-w-4xl mx-auto mb-6 no-print flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <Link
                    href={route("apt.inventory.exits.index")}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-bold text-xs sm:text-sm transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a Salidas de Inventario</span>
                </Link>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                        {itemsList.length} {itemsList.length === 1 ? "material en el vale" : "materiales consolidados"}
                    </span>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-amber-200 transition-all hover:scale-105 text-xs sm:text-sm cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir Vale de Salida</span>
                    </button>
                </div>
            </div>

            {/* Main Printable Document Sheet */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 print-sheet relative overflow-hidden">
                
                {/* 1. Official Header Box */}
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
                            <h2 className="text-[13px] font-black tracking-normal text-black leading-tight uppercase">
                                {locationDisplay}
                            </h2>
                        </div>

                        {/* Right Truck Illustration */}
                        <div className="flex items-center justify-end pr-1">
                            <svg
                                viewBox="0 0 120 70"
                                className="h-[52px] w-[95px]"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Truck Cab */}
                                <path
                                    d="M75 18H94C96.5 18 98.8 19.3 100 21.5L108 36.5C108.7 37.7 109 39.1 109 40.5V52C109 53.7 107.7 55 106 55H102C102 49.5 97.5 45 92 45C86.5 45 82 49.5 82 55H75V18Z"
                                    fill="#1e293b"
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                {/* Windshield */}
                                <path
                                    d="M78 22H92L99 35H78V22Z"
                                    fill="#93c5fd"
                                    stroke="#0f172a"
                                    strokeWidth="1"
                                />
                                {/* Trailer Body */}
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
                                {/* Trailer Lines & Decals */}
                                <line x1="10" y1="20" x2="74" y2="20" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="10" y1="28" x2="74" y2="28" stroke="#ef4444" strokeWidth="2.5" />
                                <line x1="10" y1="36" x2="74" y2="36" stroke="#94a3b8" strokeWidth="1" />
                                {/* Wheels Trailer */}
                                <circle cx="24" cy="55" r="7" fill="#0f172a" />
                                <circle cx="24" cy="55" r="3.5" fill="#cbd5e1" />
                                <circle cx="40" cy="55" r="7" fill="#0f172a" />
                                <circle cx="40" cy="55" r="3.5" fill="#cbd5e1" />
                                {/* Wheel Cab */}
                                <circle cx="92" cy="55" r="7" fill="#0f172a" />
                                <circle cx="92" cy="55" r="3.5" fill="#cbd5e1" />
                                {/* Headlight */}
                                <rect x="107" y="44" width="3" height="4" rx="1" fill="#facc15" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. Sub-Banner */}
                <div className="border border-black bg-[#fef3c7] mb-3 rounded-full py-1.5 px-4 text-center flex flex-col sm:flex-row items-center justify-between gap-1">
                    <span className="text-[13px] font-black uppercase tracking-wide text-gray-900">
                        VALE DE SALIDA Y DESPACHO DE MATERIALES
                    </span>
                    <span className="text-xs font-mono font-bold bg-white text-amber-900 px-3 py-0.5 rounded-full border border-amber-300 shadow-sm">
                        FOLIO: {folioDisplay}
                    </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs">
                    <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            Fecha de Despacho:
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                            {formatDate(firstItem.movement_date || firstItem.created_at)}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            {isMultiple ? "Total Insumos:" : "Submódulo / Tipo:"}
                        </span>
                        <span className="font-bold text-amber-800">
                            {isMultiple ? `${itemsList.length} Registros` : firstItem.type_name}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            {isMultiple ? "Clasificación:" : "Grupo de Insumo:"}
                        </span>
                        <span className="font-bold text-gray-800">
                            {isMultiple ? "Múltiples Grupos" : `G${firstItem.group_number}: ${firstItem.group_name}`}
                        </span>
                    </div>

                    <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">
                            Área / Destino:
                        </span>
                        <span className="font-bold text-gray-900">
                            {firstItem.location || "Área Operativa"}
                        </span>
                    </div>
                </div>

                {/* Material Details Table */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4 text-amber-600" />
                        Detalle de Materiales Suministrados ({itemsList.length})
                    </h3>
                    
                    <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#1e1b4b] text-white font-extrabold uppercase text-[10px] tracking-wider">
                                    <th className="py-3 px-3 text-center border-r border-slate-700">CLAVE / SKU</th>
                                    <th className="py-3 px-4 border-r border-slate-700">DESCRIPCIÓN DEL MATERIAL / ESPECIFICACIONES</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-700">UNIDAD</th>
                                    <th className="py-3 px-3 text-center border-r border-slate-700">CANT. DESPACHADA</th>
                                    <th className="py-3 px-3 text-right border-r border-slate-700">COSTO UNITARIO</th>
                                    <th className="py-3 px-4 text-right">TOTAL VALORIZADO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {itemsList.map((m, idx) => (
                                    <tr key={m.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-800 bg-gray-50 border-r border-gray-200">
                                            {m.item_code}
                                        </td>
                                        <td className="py-3 px-4 border-r border-gray-200">
                                            <div className="font-black text-gray-900 text-sm">
                                                {m.item_name}
                                            </div>
                                            {m.item?.description && (
                                                <div className="text-gray-500 text-[11px] mt-0.5">
                                                    {m.item.description}
                                                </div>
                                            )}
                                            <div className="text-gray-400 text-[10px] mt-0.5">
                                                {m.type_name} &gt; G{m.group_number}: {m.group_name} {m.reference_document ? `• Vale: ${m.reference_document}` : ""}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-center font-extrabold text-gray-700 uppercase bg-gray-50/50 border-r border-gray-200">
                                            {m.unit}
                                        </td>
                                        <td className="py-3 px-3 text-center font-black text-amber-700 text-sm border-r border-gray-200">
                                            -{Number(m.quantity).toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-3 text-right font-bold text-gray-700 border-r border-gray-200">
                                            ${Number(m.unit_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-right font-black text-gray-900 text-sm bg-amber-50/40">
                                            ${Number(m.total_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs">
                                    <td colSpan={3} className="py-2.5 px-4 text-right uppercase text-gray-600">
                                        Importe Total Consumido ({itemsList.length} Materiales):
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-black text-amber-800">
                                        {totalQuantitySum.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                    <td className="py-2.5 px-4 text-right font-black text-amber-900 text-sm">
                                        ${totalCostSum.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Additional Details & Observations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Datos del Vale y Entrega:
                        </span>
                        <div className="space-y-1 text-gray-700">
                            <div><strong>Solicitó / Retiró:</strong> {firstItem.responsible_person || firstItem.user?.name || "Personal Solicitante"}</div>
                            <div><strong>Despachador (Almacén):</strong> {firstItem.user?.name || "Admin"}</div>
                            <div><strong>Área / Frente de Trabajo:</strong> {firstItem.location || "Área Operativa"}</div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Motivo / Destino del Consumo:
                        </span>
                        <p className="text-gray-600 italic">
                            {firstItem.notes || "Material despachado conforme para actividades operativas y mantenimiento de planta."}
                        </p>
                    </div>
                </div>

                {/* Official Signatures Section */}
                <div className="pt-6 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-6">
                        FIRMAS DE CONFORMIDAD Y AUTORIZACIÓN
                    </span>

                    <div className="grid grid-cols-3 gap-6 text-center text-xs">
                        {/* 1. Solicitó */}
                        <div className="flex flex-col justify-end">
                            <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                <span className="text-gray-400 text-[10px] italic">Firma Solicitante</span>
                            </div>
                            <span className="font-bold text-gray-900 text-[11px] block">
                                {firstItem.responsible_person || "SOLICITÓ"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Personal Operativo / Cuadrilla
                            </span>
                        </div>

                        {/* 2. Despachó */}
                        <div className="flex flex-col justify-end">
                            <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                <span className="text-gray-400 text-[10px] italic">Firma Almacenista</span>
                            </div>
                            <span className="font-bold text-gray-900 text-[11px] block">
                                DESPACHÓ
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Control de Almacén
                            </span>
                        </div>

                        {/* 3. Autorizó */}
                        <div className="flex flex-col justify-end">
                            <div className="border-b border-gray-400 pb-1 mb-1 h-14 flex items-end justify-center">
                                <span className="text-gray-400 text-[10px] italic">Firma y Sello</span>
                            </div>
                            <span className="font-bold text-gray-900 text-[11px] block">
                                AUTORIZÓ
                            </span>
                            <span className="text-[10px] text-gray-500">
                                Jefatura / Residencia
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-8 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Proagroindustria - Gestión Integral de Inventarios y Almacenes</span>
                    <span>Documento emitido electrónicamente • {new Date().toLocaleString("es-MX")}</span>
                </div>
            </div>
        </div>
    );
}
