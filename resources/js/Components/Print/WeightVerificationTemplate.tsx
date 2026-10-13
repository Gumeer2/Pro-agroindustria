import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';

interface SampleRecord {
    id: number;
    num: number;
    envasadora: 1 | 2;
    weight: number;
}

interface Props {
    order?: any;
    samples?: SampleRecord[];
}

export default function WeightVerificationTemplate({ order = {}, samples = [] }: Props) {
    const page = usePage<any>();
    const tenant = page?.props?.tenant;

    const safeOrder = order || {};

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

    // Map each sample into row 1..40 and col 0..5
    const sampleGrid = useMemo(() => {
        const grid: { [rowNum: number]: { [colIdx: number]: number } } = {};
        
        samples.forEach((s) => {
            const row = s.num;
            const env = s.envasadora; // 1 or 2
            const w = Number(s.weight) || 0;

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
    }, [samples, limits]);

    // Calculate Column Sums
    const colSums = useMemo(() => {
        const sums = [0, 0, 0, 0, 0, 0];
        const counts = [0, 0, 0, 0, 0, 0];

        Object.values(sampleGrid).forEach((rowObj) => {
            for (let c = 0; c < 6; c++) {
                if (rowObj[c] !== undefined) {
                    sums[c] += rowObj[c];
                    counts[c]++;
                }
            }
        });

        return sums.map((sum, idx) => ({ sum, count: counts[idx] }));
    }, [sampleGrid]);

    // Total sums per bracket: LIC (0+1), LC (2+3), LSC (4+5)
    const bracketSums = useMemo(() => {
        return [
            colSums[0].sum + colSums[1].sum,
            colSums[2].sum + colSums[3].sum,
            colSums[4].sum + colSums[5].sum,
        ];
    }, [colSums]);

    // Overall average
    const overallStats = useMemo(() => {
        if (samples.length === 0) return { avg: null, totalSum: 0 };
        const total = samples.reduce((acc, s) => acc + (Number(s.weight) || 0), 0);
        return {
            avg: total / samples.length,
            totalSum: total,
        };
    }, [samples]);

    // Generate 40 rows for the table
    const rows = Array.from({ length: 40 }, (_, i) => i + 1);

    return (
        <div className="w-full bg-white px-2 py-1 font-sans text-xs box-border overflow-hidden">
            {/* HEADER */}
            <div className="flex w-full h-14 mb-1 border border-black">
                {/* Left: Logo Area */}
                <div className="w-[20%] p-0.5 flex items-center justify-center border-r border-black">
                    <img src={tenant?.logo || "/images/logo_proagro.png"} alt="Logo" className="h-full object-contain" />
                </div>

                {/* Center: Title Area */}
                <div className="w-[60%] flex flex-col items-center justify-center py-0.5 border-r border-black text-center">
                    <h1 className="text-[11px] font-bold tracking-wider uppercase leading-tight">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                    <h2 className="text-[7px] font-bold mt-0.5 leading-none">ALMACÉN DE PRODUCTO TERMINADO</h2>
                    <h2 className="text-xs font-bold mt-0.5 uppercase leading-none">VERIFICACION DE PESO DE SACOS</h2>
                    <p className="text-[7px] font-bold mt-0.5 leading-none">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-003' : 'VCD-AP-FO-003'}</p>
                </div>

                {/* Right: Secondary Logo Area */}
                <div className="w-[20%] p-0.5 flex items-center justify-center">
                    <img src={tenant?.logo || "/images/LOG.png"} alt="Logo" className="max-h-full max-w-full object-contain opacity-50" />
                </div>
            </div>

            {/* HEADER DETAILS - COMPACT */}
            <div className="flex flex-wrap w-full font-bold mb-1 text-[8px] uppercase">
                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="w-16">PRODUCTO:</span>
                    <span className="border-b border-black flex-1 leading-none truncate">{safeOrder.product_text || safeOrder.product?.name || safeOrder.product || ""}</span>
                </div>
                <div className="w-[30%] flex mb-0.5 items-end justify-end pr-3">
                    <span className="mr-1.5">O.E.</span>
                    <span className="font-bold text-xs leading-none">{safeOrder.folio || ""}</span>
                </div>
                <div className="w-[20%] flex mb-0.5 items-end">
                    <span className="mr-1.5">TURNO</span>
                    <div className="border-b border-black flex-1 h-3 flex items-end px-1 text-[7.5px]">
                        {safeOrder.shift || ""}
                    </div>
                </div>

                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="w-16">TRACTOR</span>
                    <span className="border-b border-black w-20 text-center leading-none">{safeOrder.tractor_plate || "N/A"}</span>
                    <span className="w-8 text-right pr-1">REM.</span>
                    <span className="border-b border-black w-20 text-center leading-none">{safeOrder.trailer_plate || "N/A"}</span>
                </div>
                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="mr-1.5">LINEA DE CARGA:</span>
                    <span className="font-normal">GLS-APT-</span>
                    <div className="border-b border-black w-14 h-3 flex items-end px-1 text-[7.5px]">
                        {safeOrder.warehouse ? safeOrder.warehouse.replace("Almacen ", "") : ""}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mb-0.5">
                <div className="border border-black p-0.5 w-20">
                    <div className={`${headerBgColor} text-center font-bold text-[7px] border-b border-black leading-none`}>FECHA</div>
                    <div className="text-center font-bold h-3 flex items-center justify-center text-[7.5px]">
                        {safeOrder.created_at ? new Date(safeOrder.created_at).toLocaleDateString("es-MX") : new Date().toLocaleDateString("es-MX")}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-start gap-1.5">

                {/* LEFT COLUMN - TABLE (72% width) */}
                <div className="w-[72%]">
                    <table className="w-full border-collapse border border-black text-center text-[7px]">
                        <thead>
                            <tr className={`${headerBgColor} leading-3`}>
                                <th rowSpan={3} className="border border-black w-4">N°</th>
                                <th colSpan={6} className="border border-black text-[7.5px]">VERIFICACIÓN DE PESO DE SACOS</th>
                            </tr>
                            <tr className={`${bgColor} leading-3`}>
                                <th colSpan={2} className="border border-black">LIMITE INFERIOR</th>
                                <th colSpan={2} className="border border-black">LIMITE DE CONTROL</th>
                                <th colSpan={2} className="border border-black">LIMITE SUPERIOR</th>
                            </tr>
                            <tr className={`${headerBgColor} leading-3`}>
                                <th colSpan={2} className="border border-black">LIC</th>
                                <th colSpan={2} className="border border-black">LC</th>
                                <th colSpan={2} className="border border-black">LSC</th>
                            </tr>
                            <tr className="leading-3">
                                <th className="border border-black bg-white"></th>
                                <th colSpan={2} className="border border-black font-bold">{limits.licText}</th>
                                <th colSpan={2} className="border border-black font-bold">{limits.lcText}</th>
                                <th colSpan={2} className="border border-black font-bold">{limits.lscText}</th>
                            </tr>
                            <tr className={`font-bold ${accentColor} leading-3`}>
                                <th className="border border-black"></th>
                                <th className="border border-black w-[15%]">ENSC.01</th>
                                <th className="border border-black w-[15%]">ENSC.02</th>
                                <th className="border border-black w-[15%]">ENSC.01</th>
                                <th className="border border-black w-[15%]">ENSC.02</th>
                                <th className="border border-black w-[15%]">ENSC.01</th>
                                <th className="border border-black w-[15%]">ENSC.02</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const rowData = sampleGrid[row] || {};
                                return (
                                    <tr key={row} className="h-2 leading-none">
                                        <td className="border border-black font-bold bg-gray-50 leading-none">{row}</td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[0] !== undefined ? rowData[0].toFixed(3) : ""}
                                        </td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[1] !== undefined ? rowData[1].toFixed(3) : ""}
                                        </td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[2] !== undefined ? rowData[2].toFixed(3) : ""}
                                        </td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[3] !== undefined ? rowData[3].toFixed(3) : ""}
                                        </td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[4] !== undefined ? rowData[4].toFixed(3) : ""}
                                        </td>
                                        <td className="border border-black font-mono font-bold leading-none">
                                            {rowData[5] !== undefined ? rowData[5].toFixed(3) : ""}
                                        </td>
                                    </tr>
                                );
                            })}
                            {/* TOTALS ROW */}
                            <tr className={`h-3 ${bgColor} leading-none`}>
                                <td className="border border-black font-bold text-[10px]">∑=</td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[0].count > 0 ? colSums[0].sum.toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[1].count > 0 ? colSums[1].sum.toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[2].count > 0 ? colSums[2].sum.toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[3].count > 0 ? colSums[3].sum.toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[4].count > 0 ? colSums[4].sum.toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold">
                                    {colSums[5].count > 0 ? colSums[5].sum.toFixed(3) : ""}
                                </td>
                            </tr>
                            <tr className={`h-3 ${headerBgColor} leading-none`}>
                                <td className="border border-black font-bold text-[6.5px]">∑Total=</td>
                                <td className="border border-black font-mono font-bold" colSpan={2}>
                                    {bracketSums[0] > 0 ? bracketSums[0].toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold" colSpan={2}>
                                    {bracketSums[1] > 0 ? bracketSums[1].toFixed(3) : ""}
                                </td>
                                <td className="border border-black font-mono font-bold" colSpan={2}>
                                    {bracketSums[2] > 0 ? bracketSums[2].toFixed(3) : ""}
                                </td>
                            </tr>
                            {/* X= Row with Right Alignment */}
                            <tr className="h-3.5 leading-none">
                                <td className={`border border-black font-bold text-[10px] ${bgColor.replace('100', '50')}`}>X =</td>
                                <td className="border border-black font-mono font-bold" colSpan={3}>
                                    {overallStats.avg !== null ? `${overallStats.avg.toFixed(3)} KG` : ""}
                                </td>
                                <td className="border border-black" colSpan={3}>
                                    <div className="flex justify-end items-center h-full pr-1">
                                        <span className="mr-1 uppercase text-[6px] font-bold">TON. PROG.</span>
                                        <div className="border border-black px-1 bg-white w-14 text-[7px] font-bold h-full flex items-center justify-center">
                                            {safeOrder.programmed_tons ? Number(safeOrder.programmed_tons).toFixed(3) : "22.000"}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className={`h-3 ${accentColor} leading-none`}>
                                <td className="border border-black font-bold text-[6.5px]">Peso=</td>
                                <td className="border border-black font-mono font-bold" colSpan={6}>
                                    {overallStats.avg !== null ? `${overallStats.avg.toFixed(3)} KG (${samples.length} MUESTRAS)` : ""}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* RIGHT COLUMN - SIGNATURES (26% width) */}
                <div className="w-[26%] flex flex-col items-center justify-center pt-4 space-y-10">

                    {/* SUPERVISOR */}
                    <div className="w-full text-center">
                        <div className={`${bgColor} border border-black font-bold text-[8.5px] py-0.5 uppercase mb-5`}>SUPERVISOR</div>
                        <div className="text-[7px] font-bold uppercase mb-0.5 truncate">
                            {safeOrder.loading_administrator || "ADMINISTRADOR"}
                        </div>
                        <div className="border-t border-black pt-0.5 w-full mx-auto text-[7.5px]">NOMBRE Y FIRMA</div>
                    </div>

                    {/* VERIFICADOR */}
                    <div className="w-full text-center">
                        <div className={`${bgColor} border border-black font-bold text-[8.5px] py-0.5 uppercase mb-5`}>VERIFICADOR</div>
                        <div className="text-[7px] font-bold uppercase mb-0.5 truncate">
                            {safeOrder.loading_assistant || safeOrder.loading_squad_leader || "VERIFICADOR"}
                        </div>
                        <div className="border-t border-black pt-0.5 w-full mx-auto text-[7.5px]">NOMBRE Y FIRMA</div>
                    </div>

                </div>

            </div>
        </div>
    );
}
