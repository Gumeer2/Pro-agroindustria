import React from 'react';
import { usePage } from '@inertiajs/react';

interface Props {
    order: any;
}

export default function StowageNoteTemplate({ order }: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    const gridCols = Array.from({ length: 24 }, (_, i) => i + 1);
    const gridRows = ['H-1', 'H-2', 'H-3', 'H-4', 'H-5', 'H-6'];

    const weightRegistrationRows = [
        { labels: ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9', 'X10'] },
        { labels: ['X11', 'X12', 'X13', 'X14', 'X15', 'X16', 'X17', 'X18', 'X19', 'X20'] },
    ];

    const borderClass = `border ${!tenant || tenant?.slug === 'proagro' ? 'border-green-800' : (tenant?.primary_color ? 'border-gray-800' : 'border-green-800')}`;
    const headerClass = `bg-gray-100 font-bold text-center ${borderClass} text-[9px] uppercase`;
    const bgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-200' : (tenant?.primary_color ? 'bg-gray-200' : 'bg-green-200');
    const accentColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? 'bg-gray-100' : 'bg-green-100');

    // Helper function to calculate sacks exactly like Print.tsx
    const calculateSacks = () => {
        if (!order.programmed_tons) return "0";
        const tons = parseFloat(order.programmed_tons);
        if (isNaN(tons)) return "0";

        // If sacks_count has "KG", it is a size, so we calculate count
        if (order.sacks_count && order.sacks_count.includes("KG")) {
            const size = parseInt(order.sacks_count.replace("KG", "").trim());
            if (!isNaN(size) && size > 0) {
                return ((tons * 1000) / size).toFixed(0);
            }
        }

        // Fallbacks based on presentation string
        if (order.presentation?.includes("25")) return (tons * 40).toFixed(0);
        if (order.presentation?.includes("50")) return (tons * 20).toFixed(0);
        if (order.presentation?.includes("200")) return (tons * 5).toFixed(0);
        if (order.presentation?.includes("500")) return (tons * 2).toFixed(0);
        if (order.presentation?.includes("1000")) return (tons * 1).toFixed(0);

        // If it is just a number
        if (order.sacks_count) return order.sacks_count;

        return "N/A";
    };

    return (
        <div className="w-full h-[88%] bg-white font-sans text-[10px] text-black leading-tight p-2 box-border flex flex-col overflow-hidden">
            <div className={`flex w-full mb-1 h-[6%]`}>
                {/* Logo Section */}
                <div className={`w-[20%] p-0.5 flex flex-col items-center justify-center`}>
                    <img src={tenant?.logo || "/images/logo_proagro.png"} alt="Logo" className="h-full object-contain scale-125 origin-center" />
                </div>

                {/* Title Section */}
                <div className={`w-[60%] flex flex-col items-center justify-center py-0.5`}>
                    <h1 className="text-base font-bold uppercase tracking-tight leading-none">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                    <h2 className="text-[10px] font-bold uppercase leading-none mt-0.5">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-002' : 'VCD-AP-FO-002'}</h2>
                    <h2 className="text-base font-bold uppercase leading-none mt-0.5">NOTA DE ESTIBA A CAMIÓN</h2>
                </div>

                {/* Meta Data Section - Kept Borders */}
                <div className="w-[20%] flex flex-col text-[8px]">
                    <div className={`flex-1 flex ${borderClass} border-b`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>FECHA</div>
                        <div className="w-[60%] flex items-center justify-center font-bold px-1"></div>
                    </div>
                    <div className={`flex-1 flex ${borderClass} border-b`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>TURNO</div>
                        <div className="w-[60%] flex items-center justify-center px-1"></div>
                    </div>
                    <div className={`flex-1 flex ${borderClass}`}>
                        <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r`}>HORA</div>
                        <div className="w-[60%] flex items-center justify-center px-1"></div>
                    </div>
                </div>
            </div>

            {/* --- DATOS DEL TRANSPORTISTA --- */}
            <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[8px] p-0.5 border-b-0`}>DATOS DEL TRANSPORTISTA</div>
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-[8%]`}>
                {/* Col 1: Operator */}
                <div className={`w-[25%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>NOMBRE Y FIRMA DEL OPERADOR</div>
                    <div className="flex-1 flex items-end justify-center font-bold uppercase text-[9px] pb-1 text-center leading-none">
                        {order.operator_name || order.operator?.name || "SIN ASIGNAR"}
                    </div>
                </div>
                {/* Col 2: Carrier */}
                <div className={`w-[35%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>NOMBRE DE LA FLETERA</div>
                    <div className="flex-1 flex items-center justify-center font-bold uppercase text-[10px] text-center leading-none px-1">
                        {order.transport_company || order.carrier?.name || "N/A"}
                    </div>
                </div>
                {/* Col 3: Unit Type */}
                <div className={`w-[20%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>TIPO DE UNIDAD</div>
                    <div className="flex-1 flex items-center justify-center font-bold uppercase text-[9px] text-center leading-none">
                        {order.is_full ? 'FULL' : (order.unit_type || 'SENCILLO')}
                    </div>
                </div>
                {/* Col 4: Plates */}
                <div className={`w-[20%] flex flex-col`}>
                    <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>PLACAS</div>
                    <div className="flex-1 flex flex-col justify-center items-center font-bold text-[8px] leading-tight">
                        <div>T: {order.tractor_plate}</div>
                        <div>R: {order.trailer_plate}</div>
                        {order.is_full && <div>R2: {order.trailer2_plate}</div>}
                    </div>
                </div>
            </div>

            {/* --- DATOS GENERALES --- */}
            <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[8px] p-0.5 border-b-0`}>DATOS GENERALES</div>
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-[8%]`}>
                {/* OV */}
                <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[8px] text-center font-bold ${borderClass} border-b p-0.5`}>ORDEN DE VENTA</div>
                    <div className="flex-1 flex items-center justify-center font-bold text-[10px]">
                        {order.sales_order?.folio || order.sales_order?.sale_order || "N/A"}
                    </div>
                </div>
                {/* OE */}
                <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[8px] text-center font-bold ${borderClass} border-b p-0.5`}>ORDEN DE EMBARQUE</div>
                    <div className="flex-1 flex items-center justify-center font-bold text-[12px]">
                        {order.folio}
                    </div>
                </div>
                {/* Destinatario (Split) */}
                <div className={`w-[50%] ${borderClass} border-r flex flex-col`}>
                    <div className={`${bgColor} text-[8px] text-center font-bold ${borderClass} border-b p-0.5`}>DESTINATARIO</div>
                    <div className="flex-1 flex w-full">
                        {/* Name */}
                        <div className={`w-[60%] ${borderClass} border-r flex flex-col justify-center`}>
                            <div className="text-[6px] text-gray-500 text-center leading-none">NOMBRE</div>
                            <div className="font-bold uppercase text-[10px] text-center leading-none px-1">
                                {order.client?.business_name || order.client?.name}
                            </div>
                        </div>
                        {/* Destination */}
                        <div className={`w-[40%] flex flex-col justify-center`}>
                            <div className="text-[6px] text-gray-500 text-center leading-none">DESTINO</div>
                            <div className="font-bold uppercase text-[9px] text-center leading-none px-1">
                                {order.destination || order.state}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Supervisor */}
                <div className={`w-[20%] flex flex-col`}>
                    <div className={`${bgColor} text-[8px] text-center font-bold ${borderClass} border-b p-0.5`}>SUPERVISOR</div>
                    <div className="flex-1"></div>
                </div>
            </div>

            {/* --- GRID E- --- */}
            <div className="w-full mb-1 flex flex-1 min-h-0">
                {/* Table Container - Takes up most space */}
                <div className="w-[92%] h-full flex flex-col">
                    <div className="text-center font-bold text-base leading-none">E-</div>
                    <table className="w-full flex-1 border-collapse border border-green-800 text-center text-[7px]">
                        <thead>
                            <tr>
                                <th className="border border-green-800 w-5 bg-gray-100"></th>
                                {gridCols.map(col => (
                                    <th key={col} className="border border-green-800 bg-gray-100 h-2">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {gridRows.map(rowLabel => (
                                <tr key={rowLabel} className="h-4">
                                    <td className="border border-green-800 bg-gray-100 font-bold">{rowLabel}</td>
                                    {gridCols.map(col => (
                                        <td key={`${rowLabel}-${col}`} className="border border-green-800"></td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Box Container - Reserved space to right prevents overlap */}
                <div className="w-[8%] flex justify-center pt-5">
                    {/* The floating box - vertical position adjusted via pt-5 to be 'where marked' (not too high, not too low) */}
                    <div className="w-[90%] h-8 border-2 border-black bg-white rounded-2xl"></div>
                </div>
            </div>

            {/* --- PRODUCT TABLE / BOXES --- */}
            {/* Replaced table with flex boxes to match LINEA 1 style as requested */}
            {/* --- PRODUCT TABLE / BOXES --- */}
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-[8%]`}>
                {[
                    { label: 'CÓDIGO', width: '15%', value: order.product?.code || order.product_code || "" },
                    { label: 'DESCRIPCIÓN DEL PRODUCTO', width: '40%', value: order.product_text || order.product?.name || order.product || "" },
                    { label: 'NO. DE ALMACEN', width: '15%', value: "" },
                    { label: 'TOTAL DE SACOS', width: '10%', value: calculateSacks() },
                    { label: 'AJUSTE', width: '10%', value: "" },
                    { label: 'JUSTIFICAR', width: '10%', value: "" }
                ].map((col, idx) => (
                    <div key={idx} className={`flex flex-col ${idx < 5 ? borderClass + ' border-r' : ''}`} style={{ width: col.width }}>
                        <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-4 flex items-center justify-center`}>
                            {col.label}
                        </div>
                        <div className="flex-1 flex items-center justify-center font-bold text-[9px] text-center p-1 leading-none uppercase">
                            {col.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lot / Verificador / Line Row: Horizontal Boxes */}
            <div className={`w-full ${borderClass} border-2 mb-1 flex h-[8%]`}>
                {[
                    { label: 'NO. DE LOTE', width: '15%' },
                    { label: 'VERIFICADOR', width: '20%' },
                    { label: 'LINEA 1', width: '16.25%' },
                    { label: 'LINEA 2', width: '16.25%' },
                    { label: 'LINEA 3', width: '16.25%' },
                    { label: 'LINEA 4', width: '16.25%' }
                ].map((col, idx) => (
                    <div key={idx} className={`flex flex-col ${idx < 5 ? borderClass + ' border-r' : ''}`} style={{ width: col.width }}>
                        <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-4 flex items-center justify-center`}>
                            {col.label}
                        </div>
                        <div className="flex-1"></div>
                    </div>
                ))}
            </div>

            {/* --- FOOTER SECTION (Compact) --- */}
            <div className={`flex w-full ${borderClass} border-2 h-[18%]`}>
                {/* Quality / Comments */}
                <div className={`w-[35%] ${borderClass} border-r-2 flex flex-col p-1`}>
                    <div className={`${accentColor} ${borderClass} text-[7px] font-bold text-center mb-0.5`}>CALIDAD DE PRODUCTO Y CANTIDAD DE SACOS</div>
                    <p className="text-[7px] text-justify mb-2 px-1 leading-none">
                        Confirmo que el número de sacos cargados corresponden a la cantidad establecida.
                    </p>

                    <div className="text-center mt-auto mb-1">
                        <div className="border-b border-black w-3/4 mx-auto mb-0.5 font-bold text-[8px] uppercase">
                            {order.operator_name || order.operator?.name || "SIN ASIGNAR"}
                        </div>
                        <div className="text-[6px]">Nombre y firma del chofer</div>
                    </div>

                    <div className={`${accentColor} ${borderClass} text-[7px] font-bold text-center mb-0.5`}>COMENTARIOS</div>
                    <div className={`flex-1 ${borderClass}`}></div>
                </div>

                {/* Weights & Validation */}
                <div className="w-[65%] flex">
                    <div className={`w-[70%] ${borderClass} border-r flex flex-col`}>
                        <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>
                            Registro de pesos en caso de revision de peso de sacos (Muestreo del embarque) kg
                        </div>
                        <div className="flex-1">
                            <table className={`w-full h-full border-collapse ${borderClass} text-center text-[8px]`}>
                                <tbody>
                                    {weightRegistrationRows.map((row, idx) => (
                                        <React.Fragment key={idx}>
                                            <tr className={`${accentColor} font-bold h-3`}>
                                                {row.labels.map(label => (
                                                    <td key={label} className={`${borderClass} w-[10%]`}>{label}</td>
                                                ))}
                                            </tr>
                                            <tr className="flex-1">
                                                {row.labels.map(label => (
                                                    <td key={`val-${label}`} className={borderClass}></td>
                                                ))}
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={`${bgColor} text-[5px] font-bold text-center p-0.5 flex items-center justify-center leading-none`}>
                            NOTA: CUALQUIER FALTANTE DEBERÁ ACOMPAÑARSE DE ESTA NOTA INDICANDO LUGAR EXACTO.
                        </div>
                    </div>

                    <div className="w-[30%] flex flex-col text-[7px]">
                        <div className={`${accentColor} ${borderClass} border-b text-center font-bold p-0.5`}>VALIDACIÓN</div>

                        <div className={`flex h-5 ${borderClass} border-b`}>
                            <div className={`w-1/2 bg-gray-50 ${borderClass} border-r flex items-center justify-center font-bold`}>SUMA</div>
                            <div className="w-1/2"></div>
                        </div>
                        <div className={`flex h-5 ${borderClass} border-b`}>
                            <div className={`w-1/2 bg-gray-50 ${borderClass} border-r flex items-center justify-center font-bold`}>PROMEDIO</div>
                            <div className="w-1/2"></div>
                        </div>
                        <div className={`flex flex-1 ${borderClass} border-b`}>
                            <div className={`w-1/2 bg-gray-50 ${borderClass} border-r flex items-center justify-center font-bold text-center`}>LIMITES</div>
                            <div className="w-1/2 flex items-center justify-center font-bold text-xs">0-0</div>
                        </div>
                        <div className={`flex h-6 border-t ${borderClass}`}>
                            <div className={`${bgColor} w-2/3 flex items-center justify-center text-[6px] font-bold leading-none px-1 border-r ${borderClass} text-center`}>
                                TM EMBARQUE ESTIMADO
                            </div>
                            <div className="w-1/3 bg-white"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
