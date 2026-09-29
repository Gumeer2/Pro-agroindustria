import React from 'react';
import { usePage } from '@inertiajs/react';

interface Props {
    order: any;
}

export default function WeightVerificationTemplate({ order }: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    const bgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? '' : 'bg-green-100');
    const headerBgColor = !tenant || tenant?.slug === 'proagro' ? 'bg-gray-200' : (tenant?.primary_color ? 'bg-gray-200' : 'bg-green-200');
    const accentColor = !tenant || tenant?.slug === 'proagro' ? 'bg-green-100' : (tenant?.primary_color ? 'bg-gray-100' : 'bg-green-100');

    // Generate 40 rows for the table
    const rows = Array.from({ length: 40 }, (_, i) => i + 1);

    return (
        <div className="w-full h-full bg-white px-4 py-2 font-sans text-xs">
            {/* HEADER - RESTORED BORDERS */}
            <div className="flex w-full h-20 mb-1 border border-black">
                {/* Left: Logo Area */}
                <div className="w-[20%] p-1 flex items-center justify-center border-r border-black">
                    <img src={tenant?.logo || "/images/logo_proagro.png"} alt="Logo" className="h-full object-contain" />
                </div>

                {/* Center: Title Area */}
                <div className="w-[60%] flex flex-col items-center justify-center py-1 border-r border-black">
                    <h1 className="text-xs font-bold tracking-wider uppercase">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                    <h2 className="text-[8px] font-bold mt-0.5">ALMACÉN DE PRODUCTO TERMINADO</h2>
                    <h2 className="text-base font-bold mt-0.5 uppercase">VERIFICACION DE PESO DE SACOS</h2>
                    <p className="text-[8px] font-bold mt-0.5">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-003' : 'VCD-AP-FO-003'}</p>
                </div>

                {/* Right: Secondary Logo Area */}
                <div className="w-[20%] p-1 flex items-center justify-center">
                    <img src={tenant?.logo || "/images/LOG.png"} alt="Logo" className="max-h-full max-w-full object-contain opacity-50" />
                </div>
            </div>

            {/* HEADER DETAILS - COMPACT */}
            <div className="flex flex-wrap w-full font-bold mb-1 text-[9px] uppercase">
                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="w-16">PRODUCTO:</span>
                    <span className="border-b border-black flex-1 leading-none">{order.product_text || order.product?.name || order.product || ""}</span>
                </div>
                <div className="w-[30%] flex mb-0.5 items-end justify-end pr-4">
                    <span className="mr-2">O.E.</span>
                    {/* UPDATED: Decreased font size for OE as requested */}
                    <span className="font-bold text-base leading-none">{order.folio}</span>
                </div>
                <div className="w-[20%] flex mb-0.5 items-end">
                    <span className="mr-2">TURNO</span>
                    <div className="border-b border-black flex-1 h-3"></div>
                </div>

                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="w-16">TRACTOR</span>
                    <span className="border-b border-black w-24 text-center leading-none">{order.tractor_plate || "N/A"}</span>
                    <span className="w-10 text-right pr-1">REM.</span>
                    <span className="border-b border-black w-24 text-center leading-none">{order.trailer_plate || "N/A"}</span>
                </div>
                <div className="w-1/2 flex mb-0.5 items-end">
                    <span className="mr-2">LINEA DE CARGA:</span>
                    <span className="font-normal">GLS-APT-</span>
                    <div className="border-b border-black w-16 h-3"></div>
                </div>
            </div>

            <div className="flex justify-end mb-1">
                <div className="border border-black p-0.5 w-24">
                    <div className={`${headerBgColor} text-center font-bold text-[8px] border-b border-black leading-none`}>FECHA</div>
                    <div className="text-center font-bold h-4 flex items-center justify-center">
                        {/* Blank for manual entry */}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-start">

                {/* LEFT COLUMN - TABLE (70% width) */}
                <div className="w-[70%]">
                    <table className="w-full border-collapse border border-black text-center text-[8px]">
                        <thead>
                            <tr className={`${headerBgColor} leading-3`}>
                                <th rowSpan={3} className="border border-black w-6">N°</th>
                                <th colSpan={6} className="border border-black">VERIFICACIÓN DE PESO DE SACOS</th>
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
                                <th colSpan={2} className="border border-black font-bold">24.900</th>
                                <th colSpan={2} className="border border-black font-bold">25.080</th>
                                <th colSpan={2} className="border border-black font-bold">25.250</th>
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
                            {rows.map((row) => (
                                <tr key={row} className="h-3"> {/* Hyper compact rows */}
                                    <td className="border border-black font-bold bg-gray-50 leading-none">{row}</td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                </tr>
                            ))}
                            {/* TOTALS ROW */}
                            <tr className={`h-4 ${bgColor} leading-none`}>
                                <td className="border border-black font-bold text-sm">∑=</td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                            </tr>
                            <tr className={`h-4 ${headerBgColor} leading-none`}>
                                <td className="border border-black font-bold text-[8px]">∑Total=</td>
                                <td className="border border-black" colSpan={2}></td>
                                <td className="border border-black" colSpan={2}></td>
                                <td className="border border-black" colSpan={2}></td>
                            </tr>
                            {/* UPDATED: X= Row with Right Alignment */}
                            <tr className="h-5 leading-none">
                                <td className={`border border-black font-bold text-sm ${bgColor.replace('100', '50')}`}>X =</td>
                                <td className="border border-black" colSpan={6}>
                                    <div className="flex justify-end items-center h-full pr-4">
                                        <span className="mr-2 uppercase text-[8px] font-bold">TON. PROGRAMADAS</span>
                                        <div className="border border-black px-2 bg-white w-24 text-[9px] font-bold h-full flex items-center justify-center">
                                            {Number(order.programmed_tons).toFixed(3)}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr className={`h-4 ${accentColor} leading-none`}>
                                <td className="border border-black font-bold text-[8px]">Peso=</td>
                                <td className="border border-black" colSpan={6}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* RIGHT COLUMN - SIGNATURES (25% width) */}
                <div className="w-[25%] flex flex-col items-center justify-center pt-8 space-y-16">

                    {/* SUPERVISOR */}
                    <div className="w-full text-center">
                        <div className={`${bgColor} border border-black font-bold text-[10px] py-1 uppercase mb-8`}>SUPERVISOR</div>
                        <div className="border-t border-black pt-1 w-full mx-auto text-[9px]">NOMBRE Y FIRMA</div>
                    </div>

                    {/* VERIFICADOR */}
                    <div className="w-full text-center">
                        <div className={`${bgColor} border border-black font-bold text-[10px] py-1 uppercase mb-8`}>VERIFICADOR</div>
                        <div className="border-t border-black pt-1 w-full mx-auto text-[9px]">NOMBRE Y FIRMA</div>
                    </div>

                </div>

            </div>
        </div>
    );
}
