import React from 'react';
import { usePage } from '@inertiajs/react';

interface Props {
    order?: any;
    samples?: Array<{ id: number; num: number; envasadora: 1 | 2; weight: number }>;
}

export default function StowageNoteTemplate({ order = {} }: Props) {
    const page = usePage<any>();
    const tenant = page?.props?.tenant;

    const safeOrder = order || {};

    const gridCols = Array.from({ length: 24 }, (_, i) => i + 1);

    const borderClass = `border ${!tenant || tenant?.slug === 'proagro' ? 'border-green-800' : (tenant?.primary_color ? 'border-gray-800' : 'border-green-800')}`;
    const bgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-200' : (tenant?.primary_color ? 'bg-gray-200' : 'bg-green-200');
    const accentColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? 'bg-gray-100' : 'bg-green-100');

    // Helper function to calculate sacks exactly like Print.tsx
    const calculateSacks = () => {
        if (!safeOrder.programmed_tons) return "0";
        const tons = parseFloat(safeOrder.programmed_tons);
        if (isNaN(tons)) return "0";

        // If sacks_count has "KG", it is a size, so we calculate count
        if (safeOrder.sacks_count && typeof safeOrder.sacks_count === 'string' && safeOrder.sacks_count.includes("KG")) {
            const size = parseInt(safeOrder.sacks_count.replace("KG", "").trim());
            if (!isNaN(size) && size > 0) {
                return ((tons * 1000) / size).toFixed(0);
            }
        }

        // Fallbacks based on presentation string
        const pres = String(safeOrder.presentation || "");
        if (pres.includes("25")) return (tons * 40).toFixed(0);
        if (pres.includes("50")) return (tons * 20).toFixed(0);
        if (pres.includes("200")) return (tons * 5).toFixed(0);
        if (pres.includes("500")) return (tons * 2).toFixed(0);
        if (pres.includes("1000")) return (tons * 1).toFixed(0);

        // If it is just a number
        if (safeOrder.sacks_count) return String(safeOrder.sacks_count);

        return "N/A";
    };

    return (
        <div className="w-full bg-white font-sans text-[9px] text-black leading-tight p-2 box-border flex flex-col justify-between overflow-hidden">
            {/* --- HEADER --- */}
            <div className="flex w-full mb-1 h-11">
                {/* Logo Section */}
                <div className="w-[20%] p-0.5 flex flex-col items-center justify-center">
                    <img src={tenant?.logo || "/images/logo_proagro.png"} alt="Logo" className="h-full object-contain scale-105 origin-center" />
                </div>

                {/* Title Section */}
                <div className="w-[60%] flex flex-col items-center justify-center py-0.5 text-center">
                    <h1 className="text-xs font-bold uppercase tracking-tight leading-none">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                    <h2 className="text-[8px] font-bold uppercase leading-none mt-0.5">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-002' : 'VCD-AP-FO-002'}</h2>
                    <h2 className="text-sm font-bold uppercase leading-none mt-0.5">NOTA DE ESTIBA A CAMIÓN</h2>
                </div>

                {/* Meta Data Section */}
                <div className="w-[20%] flex flex-col text-[7px]">
                    <div className={`flex-1 flex ${borderClass} border-b`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>FECHA</div>
                        <div className="w-[60%] flex items-center justify-center font-bold px-1">
                            {safeOrder.created_at ? new Date(safeOrder.created_at).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX")}
                        </div>
                    </div>
                    <div className={`flex-1 flex ${borderClass} border-b`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>TURNO</div>
                        <div className="w-[60%] flex items-center justify-center px-1 font-bold">
                            {safeOrder.shift || ""}
                        </div>
                    </div>
                    <div className={`flex-1 flex ${borderClass}`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>HORA</div>
                        <div className="w-[60%] flex items-center justify-center px-1 font-bold">
                            {safeOrder.created_at ? new Date(safeOrder.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DATOS DEL TRANSPORTISTA --- */}
            <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[7px] py-0.5 border-b-0`}>DATOS DEL TRANSPORTISTA</div>
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-9`}>
                {/* Col 1: Operator */}
                <div className={`w-[25%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5`}>NOMBRE Y FIRMA DEL OPERADOR</div>
                    <div className="flex-1 flex items-end justify-center font-bold uppercase text-[8px] pb-0.5 text-center leading-none truncate px-1">
                        {safeOrder.operator_name || safeOrder.operator?.name || "SIN ASIGNAR"}
                    </div>
                </div>
                {/* Col 2: Carrier */}
                <div className={`w-[35%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5`}>NOMBRE DE LA FLETERA</div>
                    <div className="flex-1 flex items-center justify-center font-bold uppercase text-[8.5px] text-center leading-none px-1 truncate">
                        {safeOrder.transport_company || safeOrder.carrier?.name || "N/A"}
                    </div>
                </div>
                {/* Col 3: Unit Type */}
                <div className={`w-[20%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5`}>TIPO DE UNIDAD</div>
                    <div className="flex-1 flex items-center justify-center font-bold uppercase text-[8px] text-center leading-none truncate px-1">
                        {safeOrder.is_full ? 'FULL' : (safeOrder.unit_type || 'SENCILLO')}
                    </div>
                </div>
                {/* Col 4: Plates */}
                <div className="w-[20%] flex flex-col">
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5`}>PLACAS</div>
                    <div className="flex-1 flex flex-col justify-center items-center font-bold text-[7px] leading-tight">
                        <div>T: {safeOrder.tractor_plate || "N/A"}</div>
                        <div>R: {safeOrder.trailer_plate || "N/A"}</div>
                        {safeOrder.is_full && <div>R2: {safeOrder.trailer2_plate}</div>}
                    </div>
                </div>
            </div>

            {/* --- DATOS GENERALES --- */}
            <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[7px] py-0.5 border-b-0`}>DATOS GENERALES</div>
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-9`}>
                {/* OV */}
                <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[7px] text-center font-bold ${borderClass} border-b p-0.5`}>ORDEN DE VENTA</div>
                    <div className="flex-1 flex items-center justify-center font-bold text-[8.5px]">
                        {safeOrder.sales_order?.folio || safeOrder.sales_order?.sale_order || "N/A"}
                    </div>
                </div>
                {/* OE */}
                <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[7px] text-center font-bold ${borderClass} border-b p-0.5`}>ORDEN DE EMBARQUE</div>
                    <div className="flex-1 flex items-center justify-center font-bold text-[9.5px]">
                        {safeOrder.folio || "N/A"}
                    </div>
                </div>
                {/* Destinatario (Split) */}
                <div className={`w-[50%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[7px] text-center font-bold ${borderClass} border-b p-0.5`}>DESTINATARIO</div>
                    <div className="flex-1 flex w-full">
                        {/* Name */}
                        <div className={`w-[60%] ${borderClass} border-r flex flex-col justify-center`}>
                            <div className="text-[5.5px] text-gray-500 text-center leading-none">NOMBRE</div>
                            <div className="font-bold uppercase text-[8.5px] text-center leading-none px-1 truncate">
                                {safeOrder.client?.business_name || safeOrder.client?.name || "N/A"}
                            </div>
                        </div>
                        {/* Destination */}
                        <div className="w-[40%] flex flex-col justify-center">
                            <div className="text-[5.5px] text-gray-500 text-center leading-none">DESTINO</div>
                            <div className="font-bold uppercase text-[8px] text-center leading-none px-1 truncate">
                                {safeOrder.destination || safeOrder.state || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Supervisor (Cargando el nombre del auxiliar del formulario) */}
                <div className="w-[20%] flex flex-col">
                    <div className={`${bgColor} text-[7px] text-center font-bold ${borderClass} border-b p-0.5`}>SUPERVISOR</div>
                    <div className="flex-1 flex items-center justify-center font-bold text-[7.5px] uppercase px-1 text-center truncate">
                        {safeOrder.loading_assistant || safeOrder.assistant || safeOrder.loading_administrator || ""}
                    </div>
                </div>
            </div>

            {/* --- GRID E- (1 Fila: 24 Columnas + TM Programada a la derecha) --- */}
            <div className="w-full mb-1 flex items-end">
                {/* Table Container */}
                <div className="w-[90%] flex flex-col">
                    <div className="text-center font-bold text-xs leading-none mb-0.5">E-</div>
                    <table className="w-full border-collapse border border-green-800 text-center text-[7.5px]">
                        <thead>
                            <tr className="bg-gray-100">
                                {gridCols.map(col => (
                                    <th key={col} className="border border-green-800 h-3.5 font-bold text-[7.5px]">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-10 bg-white">
                                {gridCols.map(col => (
                                    <td key={`cell-${col}`} className="border border-green-800"></td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Box Container on Right with TM Programada */}
                <div className="w-[10%] flex flex-col items-center pl-1">
                    <span className="text-[6px] font-bold text-center leading-none mb-0.5 text-gray-900 whitespace-nowrap">
                        TM Programada
                    </span>
                    <div className="w-full h-10 border-2 border-black bg-white rounded-xl flex items-center justify-center font-bold text-[8.5px]">
                        {safeOrder.programmed_tons ? Number(safeOrder.programmed_tons).toFixed(1) : ""}
                    </div>
                </div>
            </div>

            {/* --- PRODUCT TABLE / BOXES --- */}
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-9`}>
                {[
                    { label: 'CÓDIGO', width: '15%', value: safeOrder.product?.code || safeOrder.product_code || "" },
                    { label: 'DESCRIPCIÓN DEL PRODUCTO', width: '40%', value: safeOrder.product_text || safeOrder.product?.name || safeOrder.product || "" },
                    { label: 'NO. DE ALMACEN', width: '15%', value: safeOrder.warehouse ? safeOrder.warehouse.replace("Almacen ", "") : "" },
                    { label: 'TOTAL DE SACOS', width: '10%', value: calculateSacks() },
                    { label: 'AJUSTE', width: '10%', value: "" },
                    { label: 'JUSTIFICAR', width: '10%', value: "" }
                ].map((col, idx) => (
                    <div key={idx} className={`flex flex-col ${idx < 5 ? borderClass + ' border-r' : ''}`} style={{ width: col.width }}>
                        <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                            {col.label}
                        </div>
                        <div className="flex-1 flex items-center justify-center font-bold text-[8.5px] text-center p-0.5 leading-none uppercase truncate">
                            {col.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lot / Verificador / Line Row (VERIFICADOR en blanco) */}
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-8`}>
                {[
                    { label: 'NO. DE LOTE', width: '15%', value: safeOrder.lot_folio || "" },
                    { label: 'VERIFICADOR', width: '20%', value: "" },
                    { label: 'LINEA 1', width: '16.25%', value: "" },
                    { label: 'LINEA 2', width: '16.25%', value: "" },
                    { label: 'LINEA 3', width: '16.25%', value: "" },
                    { label: 'LINEA 4', width: '16.25%', value: "" }
                ].map((col, idx) => (
                    <div key={idx} className={`flex flex-col ${idx < 5 ? borderClass + ' border-r' : ''}`} style={{ width: col.width }}>
                        <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[6.5px] p-0.5 uppercase h-3 flex items-center justify-center`}>
                            {col.label}
                        </div>
                        <div className="flex-1 flex items-center justify-center font-bold text-[8px] uppercase">
                            {col.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- FOOTER SECTION (Calidad y Comentarios) --- */}
            <div className={`flex w-full ${borderClass} border-2 h-18`}>
                {/* Quality & Driver Signature (45%) */}
                <div className={`w-[45%] ${borderClass} border-r-2 flex flex-col p-1`}>
                    <div className={`${accentColor} ${borderClass} text-[7px] font-bold text-center mb-0.5`}>CALIDAD DE PRODUCTO Y CANTIDAD DE SACOS</div>
                    <p className="text-[7px] text-justify mb-0.5 px-1 leading-tight">
                        Confirmo que el número de sacos cargados corresponden a la cantidad establecida.
                    </p>

                    <div className="text-center mt-auto mb-0.5">
                        <div className="border-b border-black w-3/4 mx-auto mb-0.5 font-bold text-[8px] uppercase truncate">
                            {safeOrder.operator_name || safeOrder.operator?.name || "SIN ASIGNAR"}
                        </div>
                        <div className="text-[6px]">Nombre y firma del chofer</div>
                    </div>
                </div>

                {/* Comments Section (55%) */}
                <div className="w-[55%] flex flex-col p-1">
                    <div className={`${accentColor} ${borderClass} text-[7px] font-bold text-center mb-0.5`}>COMENTARIOS</div>
                    <div className={`flex-1 ${borderClass} bg-white p-1`}>
                        {safeOrder.observations ? (
                            <span className="text-[7.5px] text-gray-700 uppercase">{safeOrder.observations}</span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
