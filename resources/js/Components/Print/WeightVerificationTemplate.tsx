import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';

interface SampleRecord {
    id: number;
    num: number;
    ensacadora?: 1 | 2;
    envasadora?: 1 | 2;
    weight: number;
}

interface Props {
    order?: any;
    samples?: SampleRecord[];
    targetPage?: 1 | 2 | 'all';
}

export default function WeightVerificationTemplate({ order = {}, samples = [], targetPage = 'all' }: Props) {
    const page = usePage<any>();
    const tenant = page?.props?.tenant;

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
            safeOrder.id ? `ensacadora_sampling_order_${safeOrder.id}` : null,
            safeOrder.id ? `ensacadora_sampling_${safeOrder.id}` : null,
            safeOrder.id ? `envasadora_sampling_order_${safeOrder.id}` : null,
            safeOrder.id ? `envasadora_sampling_${safeOrder.id}` : null,
            safeOrder.folio ? `ensacadora_sampling_order_${safeOrder.folio}` : null,
            safeOrder.folio ? `ensacadora_sampling_${safeOrder.folio}` : null,
            safeOrder.folio ? `envasadora_sampling_order_${safeOrder.folio}` : null,
            safeOrder.folio ? `envasadora_sampling_${safeOrder.folio}` : null,
            safeOrder.order_number ? `ensacadora_sampling_order_${safeOrder.order_number}` : null,
            safeOrder.order_number ? `ensacadora_sampling_${safeOrder.order_number}` : null,
            safeOrder.order_number ? `envasadora_sampling_order_${safeOrder.order_number}` : null,
            safeOrder.order_number ? `envasadora_sampling_${safeOrder.order_number}` : null,
        ].filter(Boolean) as string[];

        let bestSamples: any[] = [];
        for (const key of candidateKeys) {
            try {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && Array.isArray(parsed.samples) && parsed.samples.length > bestSamples.length) {
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

    const bgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? '' : 'bg-green-100');
    const headerBgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-gray-200' : (tenant?.primary_color ? 'bg-gray-200' : 'bg-green-200');
    const accentColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? 'bg-gray-100' : 'bg-green-100');

    // Determine target base weight
    const is50kg = useMemo(() => {
        const text = `${safeOrder.product_text || safeOrder.product?.name || safeOrder.product || ""} ${safeOrder.presentation || ""} ${safeOrder.sacks_count || ""}`.toUpperCase();
        return text.includes("50KG") || text.includes("50 KG") || text.includes("50");
    }, [safeOrder]);

    const limits = useMemo(() => {
        if (is50kg) {
            return {
                inferior: 50.00,
                ideal: 50.10,
                superior: 50.10,
                licText: "50.000",
                lcText: "50.100",
                lscText: "50.100",
            };
        }
        return {
            inferior: 24.90,
            ideal: 25.08,
            superior: 25.25,
            licText: "24.900",
            lcText: "25.080",
            lscText: "25.250",
        };
    }, [is50kg]);

    // Map each sample into row 1..80 and col 0..5
    const sampleGrid = useMemo(() => {
        const grid: { [rowNum: number]: { [colIdx: number]: number } } = {};
        
        effectiveSamples.forEach((s, idx) => {
            const env = s.ensacadora || s.envasadora || 1; // 1 or 2
            const w = Number(s.weight) || 0;

            // Determinar fila (1 a 80):
            // Si viene con num 1..40 y es Ensacadora 2, se coloca en las filas 41 a 80
            let row = Number(s.num) || (idx + 1);
            if (env === 2 && row <= 40 && effectiveSamples.some(o => (o.ensacadora === 1 || o.envasadora === 1))) {
                row = row + 40;
            } else if (row > 80) {
                row = ((row - 1) % 80) + 1;
            }

            let bracket = 1; // 0 = LIC, 1 = LC, 2 = LSC
            const thresholdLow = (limits.inferior + limits.ideal) / 2;
            const thresholdHigh = (limits.ideal + limits.superior) / 2;

            if (w < thresholdLow) {
                bracket = 0; // LIC
            } else if (w > thresholdHigh) {
                bracket = 2; // LSC
            } else {
                bracket = 1; // LC
            }

            const colIdx = bracket * 2 + (env === 2 ? 1 : 0);

            if (!grid[row]) grid[row] = {};
            grid[row][colIdx] = w;
        });

        return grid;
    }, [effectiveSamples, limits]);

    // Calculate Column Sums for all 80 samples (used on Sheet 2 totals)
    const totalColSums = useMemo(() => {
        const sums = [0, 0, 0, 0, 0, 0];
        const counts = [0, 0, 0, 0, 0, 0];

        Object.values(sampleGrid).forEach((rowObj) => {
            for (let c = 0; c < 6; c++) {
                if (rowObj[c] !== undefined && rowObj[c] > 0) {
                    sums[c] += rowObj[c];
                    counts[c]++;
                }
            }
        });

        return sums.map((sum, idx) => ({ sum, count: counts[idx] }));
    }, [sampleGrid]);

    const totalBracketSums = useMemo(() => {
        return [
            totalColSums[0].sum + totalColSums[1].sum,
            totalColSums[2].sum + totalColSums[3].sum,
            totalColSums[4].sum + totalColSums[5].sum,
        ];
    }, [totalColSums]);

    // Overall average
    const overallStats = useMemo(() => {
        if (effectiveSamples.length === 0) return { avg: null, totalSum: 0, count: 0 };
        const valid = effectiveSamples.filter(s => (Number(s.weight) || 0) > 0);
        const total = valid.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);
        return {
            avg: valid.length > 0 ? total / valid.length : null,
            totalSum: total,
            count: valid.length,
        };
    }, [effectiveSamples]);

    // Render a single sheet
    // Sheet 1: CON encabezado, filas 1 a 40, SIN filas de pie de tabla (∑=, ∑Total=, X=, Peso=)
    // Sheet 2: SIN encabezado, filas 41 a 80, CON filas de pie de tabla (∑=, ∑Total=, X=, Peso=) y firmas
    const renderSheet = (sheetIndex: 1 | 2) => {
        const isSheet1 = sheetIndex === 1;
        const rowStart = isSheet1 ? 1 : 41;
        const sheetRows = Array.from({ length: 40 }, (_, i) => rowStart + i);

        return (
            <div
                key={`weight-sheet-${sheetIndex}`}
                className={`weight-sheet weight-sheet-${sheetIndex} w-full bg-white px-3 py-2 font-sans text-xs box-border overflow-hidden`}
                style={{
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    ...(isSheet1 && targetPage === 'all' ? { pageBreakAfter: 'always', breakAfter: 'page' } : {}),
                }}
            >
                {/* --- HOJA 1: TIENE ENCABEZADO COMPLETO --- */}
                {isSheet1 && (
                    <>
                        {/* HEADER BANNER */}
                        <div className="flex w-full h-14 mb-1.5 border border-black">
                            {/* Left: Logo Area */}
                            <div className="w-[20%] p-1 flex items-center justify-center border-r border-black">
                                <img src={tenant?.logo || "/images/logo_proagro.png"} alt="Logo" className="h-full object-contain" />
                            </div>

                            {/* Center: Title Area */}
                            <div className="w-[60%] flex flex-col items-center justify-center py-0.5 border-r border-black text-center">
                                <h1 className="text-[11px] font-bold tracking-wider uppercase leading-tight">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                                <h2 className="text-[7.5px] font-bold mt-0.5 leading-none">ALMACÉN DE PRODUCTO TERMINADO</h2>
                                <h2 className="text-xs font-bold mt-0.5 uppercase leading-none">
                                    VERIFICACIÓN DE PESO DE SACOS
                                </h2>
                                <p className="text-[7.5px] font-bold mt-0.5 leading-none">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-003' : 'VCD-AP-FO-003'}</p>
                            </div>

                            {/* Right: Secondary Logo Area */}
                            <div className="w-[20%] p-1 flex items-center justify-center">
                                <img src={tenant?.logo || "/images/LOG.png"} alt="Logo" className="max-h-full max-w-full object-contain opacity-50" />
                            </div>
                        </div>

                        {/* HEADER DETAILS */}
                        <div className="flex flex-wrap w-full font-bold mb-1.5 text-[8.5px] uppercase">
                            <div className="w-1/2 flex mb-0.5 items-end">
                                <span className="w-16">PRODUCTO:</span>
                                <span className="border-b border-black flex-1 leading-none truncate font-bold text-[9px]">
                                    {safeOrder.product_text || safeOrder.product?.name || safeOrder.product || ""}
                                </span>
                            </div>
                            <div className="w-[30%] flex mb-0.5 items-end justify-end pr-3">
                                <span className="mr-1.5">O.E.</span>
                                <span className="font-black text-xs leading-none text-indigo-950">{safeOrder.folio || ""}</span>
                            </div>
                            <div className="w-[20%] flex mb-0.5 items-end">
                                <span className="mr-1.5">TURNO</span>
                                <div className="border-b border-black flex-1 h-3 flex items-end px-1 text-[8px] font-bold">
                                    {safeOrder.shift || "1"}
                                </div>
                            </div>

                            <div className="w-1/2 flex mb-0.5 items-end">
                                <span className="w-16">TRACTOR</span>
                                <span className="border-b border-black w-24 text-center leading-none font-mono font-bold">{safeOrder.tractor_plate || "N/A"}</span>
                                <span className="w-8 text-right pr-1">REM.</span>
                                <span className="border-b border-black w-24 text-center leading-none font-mono font-bold">{safeOrder.trailer_plate || "N/A"}</span>
                            </div>
                            <div className="w-1/2 flex mb-0.5 items-end">
                                <span className="mr-1.5">LÍNEA DE CARGA:</span>
                                <span className="font-normal">GLS-APT-</span>
                                <div className="border-b border-black w-16 h-3 flex items-end px-1 text-[8px] font-bold">
                                    {safeOrder.warehouse ? safeOrder.warehouse.replace("Almacen ", "") : "2"}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mb-1">
                            <div className="border border-black p-0.5 w-24">
                                <div className={`${headerBgColor} text-center font-bold text-[7.5px] border-b border-black leading-none`}>FECHA</div>
                                <div className="text-center font-bold h-3 flex items-center justify-center text-[8px]">
                                    {safeOrder.created_at ? new Date(safeOrder.created_at).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX")}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- HOJA 2: SIN ENCABEZADO (INICIA DIRECTO EN LA TABLA) --- */}

                <div className="flex justify-between items-stretch gap-2 w-full">

                    {/* LEFT COLUMN - TABLE (75% width) */}
                    <div className="w-[75%]">
                        <table className="w-full border-collapse border border-black text-center text-[8px]">
                            <thead>
                                <tr className={`${headerBgColor} leading-tight`}>
                                    <th rowSpan={3} className="border border-black w-6 py-0.5">N°</th>
                                    <th colSpan={6} className="border border-black text-[8.5px] py-0.5">VERIFICACIÓN DE PESO DE SACOS</th>
                                </tr>
                                <tr className={`${bgColor} leading-tight`}>
                                    <th colSpan={2} className="border border-black py-0.5">LÍMITE INFERIOR</th>
                                    <th colSpan={2} className="border border-black py-0.5">LÍMITE DE CONTROL</th>
                                    <th colSpan={2} className="border border-black py-0.5">LÍMITE SUPERIOR</th>
                                </tr>
                                <tr className={`${headerBgColor} leading-tight`}>
                                    <th colSpan={2} className="border border-black py-0.5">LIC</th>
                                    <th colSpan={2} className="border border-black py-0.5">LC</th>
                                    <th colSpan={2} className="border border-black py-0.5">LSC</th>
                                </tr>
                                <tr className="leading-tight">
                                    <th className="border border-black bg-white"></th>
                                    <th colSpan={2} className="border border-black font-bold py-0.5">{limits.licText}</th>
                                    <th colSpan={2} className="border border-black font-bold py-0.5">{limits.lcText}</th>
                                    <th colSpan={2} className="border border-black font-bold py-0.5">{limits.lscText}</th>
                                </tr>
                                <tr className={`font-bold ${accentColor} leading-tight`}>
                                    <th className="border border-black py-0.5"></th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.01</th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.02</th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.01</th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.02</th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.01</th>
                                    <th className="border border-black w-[15%] py-0.5">ENSC.02</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sheetRows.map((row) => {
                                    const rowData = sampleGrid[row] || {};
                                    return (
                                        <tr key={row} className="h-[4.9mm] max-h-[4.9mm] leading-none">
                                            <td className="border border-black font-bold bg-gray-50 leading-none py-0 text-[7.5px]">{row}</td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[0] !== undefined ? rowData[0].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[1] !== undefined ? rowData[1].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[2] !== undefined ? rowData[2].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[3] !== undefined ? rowData[3].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[4] !== undefined ? rowData[4].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold leading-none py-0 text-[7.5px]">
                                                {rowData[5] !== undefined ? rowData[5].toFixed(3) : ""}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* --- HOJA 2 SOLAMENTE: TIENE LAS FILAS DE TOTALES (∑=, ∑Total=, X=, Peso=) --- */}
                                {!isSheet1 && (
                                    <>
                                        {/* TOTALS ROW */}
                                        <tr className={`h-[5.2mm] ${bgColor} leading-none`}>
                                            <td className="border border-black font-bold text-[10px]">∑=</td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[0].count > 0 ? totalColSums[0].sum.toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[1].count > 0 ? totalColSums[1].sum.toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[2].count > 0 ? totalColSums[2].sum.toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[3].count > 0 ? totalColSums[3].sum.toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[4].count > 0 ? totalColSums[4].sum.toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[7.5px]">
                                                {totalColSums[5].count > 0 ? totalColSums[5].sum.toFixed(3) : ""}
                                            </td>
                                        </tr>
                                        <tr className={`h-[5.2mm] ${headerBgColor} leading-none`}>
                                            <td className="border border-black font-bold text-[7px]">∑Total=</td>
                                            <td className="border border-black font-mono font-bold text-[8px]" colSpan={2}>
                                                {totalBracketSums[0] > 0 ? totalBracketSums[0].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[8px]" colSpan={2}>
                                                {totalBracketSums[1] > 0 ? totalBracketSums[1].toFixed(3) : ""}
                                            </td>
                                            <td className="border border-black font-mono font-bold text-[8px]" colSpan={2}>
                                                {totalBracketSums[2] > 0 ? totalBracketSums[2].toFixed(3) : ""}
                                            </td>
                                        </tr>
                                        {/* X= Row with Right Alignment */}
                                        <tr className="h-[5.4mm] leading-none">
                                            <td className={`border border-black font-bold text-[10px] ${bgColor.replace('100', '50')}`}>X =</td>
                                            <td className="border border-black font-mono font-bold text-[9px]" colSpan={3}>
                                                {overallStats.avg !== null ? `${overallStats.avg.toFixed(3)} KG` : ""}
                                            </td>
                                            <td className="border border-black" colSpan={3}>
                                                <div className="flex justify-end items-center h-full pr-1">
                                                    <span className="mr-1 uppercase text-[7px] font-bold">TON. PROG.</span>
                                                    <div className="border border-black px-1 bg-white w-18 text-[8px] font-bold h-full flex items-center justify-center font-mono">
                                                        {safeOrder.programmed_tons ? Number(safeOrder.programmed_tons).toFixed(3) : "36.000"}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className={`h-[5.2mm] ${accentColor} leading-none`}>
                                            <td className="border border-black font-bold text-[7px]">Peso=</td>
                                            <td className="border border-black font-mono font-bold text-[8.5px]" colSpan={6}>
                                                {overallStats.avg !== null 
                                                    ? `${overallStats.avg.toFixed(3)} KG (${overallStats.count} MUESTRAS)` 
                                                    : ""}
                                            </td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT COLUMN - SIGNATURES */}
                    <div className="w-[24%] flex flex-col justify-end gap-10 pb-2">
                        {/* SUPERVISOR */}
                        <div className="w-full text-center">
                            <div className={`${bgColor} border border-black font-bold text-[8.5px] py-1.5 uppercase mb-12`}>SUPERVISOR</div>
                            <div className="text-[8px] font-bold uppercase mb-0.5 truncate text-gray-900">
                                {safeOrder.loading_administrator || "ADMINISTRADOR"}
                            </div>
                            <div className="border-t border-black pt-0.5 w-full mx-auto text-[7.5px] text-gray-700 font-bold">NOMBRE Y FIRMA</div>
                        </div>

                        {/* VERIFICADOR */}
                        <div className="w-full text-center">
                            <div className={`${bgColor} border border-black font-bold text-[8.5px] py-1.5 uppercase mb-12`}>VERIFICADOR</div>
                            <div className="text-[8px] font-bold uppercase mb-0.5 truncate text-gray-900">
                                {safeOrder.loading_assistant || safeOrder.loading_squad_leader || "VERIFICADOR"}
                            </div>
                            <div className="border-t border-black pt-0.5 w-full mx-auto text-[7.5px] text-gray-700 font-bold">NOMBRE Y FIRMA</div>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    if (targetPage === 1) {
        return <div className="w-full">{renderSheet(1)}</div>;
    }
    if (targetPage === 2) {
        return <div className="w-full">{renderSheet(2)}</div>;
    }

    return (
        <div className="w-full space-y-6 print:space-y-0">
            {renderSheet(1)}
            {renderSheet(2)}
        </div>
    );
}
