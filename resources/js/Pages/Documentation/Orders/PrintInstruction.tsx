import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Printer, Truck } from 'lucide-react';
import { ShipmentOrder } from '@/types';

interface Props {
    order: ShipmentOrder;
}

export default function PrintInstruction({ order }: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    useEffect(() => {
        // Auto-print on load if desired, or just let user click
        // window.print();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "__________________";
        // Asumimos formato YYYY-MM-DD
        const [year, month, day] = dateString.split("-");
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white text-black font-sans box-border">
            <Head title={`Instrucción de Carga - ${order.folio}`} />

            {/* Print Controls (Hidden on Print) */}
            <div className="max-w-[21.5cm] mx-auto mb-6 print:hidden flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center shadow hover:bg-indigo-700 transition-colors"
                >
                    <Printer className="w-5 h-5 mr-2" />
                    Imprimir Formato
                </button>
            </div>

            {/* Page Container (Letter Size roughly) */}
            <div className="max-w-[21.5cm] mx-auto bg-white p-[1cm] shadow-lg print:shadow-none print:w-full print:max-w-none print:mx-0 print:p-0">

                {/* HEADERS */}
                <div className="border border-green-800 relative">
                    {/* Top Row: Logos & Titles - Flexbox handled */}
                    <div className="flex w-full border-b border-green-800" style={{ borderColor: tenant?.primary_color || '#166534' }}>
                        {/* Left: Logo Area */}
                        <div className="w-[20%] p-2 flex items-center justify-center border-r border-green-800" style={{ borderColor: tenant?.primary_color || '#166534' }}>
                            <img src={tenant?.logo || "/images/logovecode.png"} alt={tenant?.name || "Logo"} className="h-12 object-contain" />
                        </div>

                        {/* Center: Title Area */}
                        <div className="w-[60%] flex flex-col items-center justify-center py-2">
                            <h1 className="text-sm font-bold tracking-wider">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                            <h2 className="text-xs font-bold mt-1 uppercase">{tenant?.slug === 'proagro' ? 'ALMACÉN DE PRODUCTO TERMINADO' : 'SISTEMA DE GESTIÓN LOGÍSTICA'}</h2>
                            <h2 className="text-lg font-black mt-1 uppercase">INSTRUCCIÓN DE CARGA</h2>
                            <p className="text-[10px] font-bold mt-1">{tenant?.slug === 'proagro' ? 'GLS-AP-FO-001' : 'VCD-LG-FO-001'}</p>
                        </div>

                        {/* Right: Truck Logo Area */}
                        <div className="w-[20%] p-2 flex items-center justify-center border-l border-green-800 overflow-hidden relative" style={{ borderColor: tenant?.primary_color || '#166534' }}>
                            {/* Placeholder Truck Icon if image missing */}
                            <Truck className="w-16 h-16 text-gray-800 stroke-1" />
                        </div>
                    </div>

                    {/* Sub-Header Row: Date, Shift, Lote */}
                    <div className="flex w-full text-xs font-bold py-2 px-1">
                        <div className="w-1/3 flex items-end">
                            <span className="mr-2">FECHA:</span>
                            <div className="border-b border-black flex-1 text-center font-normal px-2">
                                {formatDate(order.date)}
                            </div>
                        </div>
                        <div className="w-1/3 flex items-end px-2">
                            <span className="mr-2">TURNO:</span>
                            <div className="border-b border-black flex-1 text-center font-normal">
                                {/* Turno logic or manual fill */}
                                &nbsp;
                            </div>
                        </div>
                        <div className="w-1/3 flex items-end pl-2">
                            <span className="mr-2">LOTE:</span>
                            <div className="border-b border-black flex-1 text-center font-normal">
                                {order.id} {/* Using ID as pseudo-Batch or empty */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRODUCT TABLE SECTION */}
                <div className="mt-2 border border-black border-t-0">
                    {/* Note: I removed border-t-0 to match image style which has gaps usually? Lets stick to closed borders first */}
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-black py-1 px-2 w-[25%] font-bold text-center">PRODUCTO</th>
                                <th className="border border-black py-1 px-2 w-[20%] font-bold text-center">PRESENTACIÓN</th>
                                <th className="border border-black py-1 px-2 w-[15%] font-bold text-center">TM PROGRAMADAS</th>
                                <th className="border border-black py-1 px-2 w-[20%] font-bold text-center">TM CARGADAS</th>
                                <th className="border border-black py-1 px-2 w-[20%] font-bold text-center bg-green-50">ORDEN DE EMBARQUE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-center font-bold text-sm">
                                <td className="border border-black py-2 uppercase">{order.product?.name || order.product_id}</td>
                                <td className="border border-black py-2 uppercase">{order.presentation} {order.presentation?.toUpperCase().includes('ENVASADO') && order.sacks_count ? `- ${order.sacks_count}` : ''}</td>
                                <td className="border border-black py-2">{Number(order.programmed_tons).toFixed(3)}</td>
                                <td className="border border-black py-2">{/* Empty for manual fill */}</td>
                                <td className="border border-black py-2 text-red-600 font-black text-base">{order.folio}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* TRANSPORT DETAILS SECTION */}
                <div className="mt-4 flex w-full justify-between items-start">

                    {/* LEFT SIDE: PLATES */}
                    <div className="w-[50%] pr-4">

                        {/* TRACTOR ROW */}
                        <div className="flex items-center mb-4">
                            <div className="w-20 text-right pr-2 text-xs font-bold">PLACAS:</div>
                            <div className="relative border-2 border-black px-4 py-1 font-black text-xl text-center min-w-[140px] uppercase">
                                {order.tractor_plate || "N/A"}
                                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-1 text-[10px] font-bold">TRACTOR</span>
                            </div>
                        </div>

                        {/* ECONOMICO (Floating in middle/right of left side) */}
                        <div className="flex items-center justify-end pr-10 mb-4 -mt-8"> {/* Negative margin to overlap/align like image */}
                            <span className="text-xs font-bold mr-2">ECONÓMICO:</span>
                            <span className="border-b-2 border-black font-bold px-2">{order.economic_number || "_________"}</span>
                        </div>

                        {/* TRAILER ROW */}
                        <div className="flex items-center">
                            <div className="w-20 text-right pr-2 text-xs font-bold">PLACAS:</div>
                            <div className="relative border-2 border-black px-4 py-1 font-black text-xl text-center min-w-[140px] uppercase">
                                {order.trailer_plate || "N/A"}
                                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-1 text-[10px] font-bold">REMOLQUE</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: TIMES */}
                    <div className="w-[30%] flex flex-col items-end pt-2">
                        <div className="border border-black h-8 w-32 mb-6 relative">
                            <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-100 px-1 text-[10px] font-bold border border-black h-4 flex items-center leading-none">HORA DE INICIO:</span>
                        </div>
                        <div className="border border-black h-8 w-32 relative">
                            <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-100 px-1 text-[10px] font-bold border border-black h-4 flex items-center leading-none">HORA FINAL</span>
                        </div>
                    </div>
                </div>

                <div className="border-b-2 border-black my-4 w-1/3 ml-auto"></div>

                {/* INFO BOXES */}
                <div className="flex w-full mt-2 gap-4">
                    {/* LEFT BOX: CLIENT/TRANSPORT info */}
                    <div className="w-1/2 border border-black p-2 text-xs">
                        <div className="flex mb-1">
                            <span className="font-bold w-24">CLIENTE:</span>
                            <span className="font-bold uppercase flex-1">{order.client_name || order.client?.business_name}</span>
                        </div>
                        <div className="flex mb-1">
                            <span className="font-bold w-24">TRANSPORT:</span>
                            <span className="uppercase flex-1">{order.transport_company || order.transporter?.name}</span>
                        </div>
                        <div className="flex mb-1">
                            <span className="font-bold w-24">OPERADOR:</span>
                            <span className="uppercase flex-1">{order.operator_name}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold w-24">ORIGEN:</span>
                            <span className="uppercase flex-1">
                                {(typeof order.origin === 'object' ? order.origin?.name : order.origin) || "PLANTA"}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT BOX: WAREHOUSE & LINE */}
                    <div className="w-1/2 border border-black text-xs">
                        <div className="flex border-b border-black">
                            <div className="w-1/2 border-r border-black p-2 text-center bg-gray-50 font-bold flex items-center justify-center">
                                ALMACÉN #
                            </div>
                            <div className="w-1/2 p-2">
                                {/* Space for writing */}
                            </div>
                        </div>
                        <div className="p-2 pt-4">
                            <div className="flex items-end">
                                <span className="font-bold mr-2">LÍNEA DE ENVASADO # GLS-APT-</span>
                                <div className="border-b border-black flex-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIGNATURES SECTION */}
                <div className="mt-24 flex justify-between px-8 text-xs font-bold text-center uppercase">
                    <div className="w-5/12">
                        <div className="border-t border-black pt-1">
                            SUPERVISIÓN DE {tenant?.slug === 'proagro' ? 'PRO-AGROINDUSTRIA' : (tenant?.name || 'LA EMPRESA')}
                        </div>
                    </div>
                    <div className="w-5/12">
                        <div className="border-t border-black pt-1">
                            PRESTADOR DEL SERVICIO
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
