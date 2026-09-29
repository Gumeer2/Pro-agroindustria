import { usePage } from '@inertiajs/react';
import { ShipmentOrder } from '@/types';

interface Props {
    order: ShipmentOrder | any; // Allow loose typing for compatibility between views
}

export default function InstructionTemplate({ order }: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    return (
        <div className="w-full h-full bg-white text-black font-sans box-border text-[11px]" style={{ pageBreakAfter: 'always' }}>
            {/* HEADERS */}
            <div className="border border-green-800 relative" style={{ borderColor: tenant?.primary_color || '#15803d' }}>
                {/* Top Row: Logos & Titles */}
                <div className="flex w-full border-b h-24" style={{ borderColor: tenant?.primary_color || '#15803d' }}>
                    {/* Left: Logo Area */}
                    <div className="w-[20%] p-2 flex items-center justify-center border-r" style={{ borderColor: tenant?.primary_color || '#15803d' }}>
                        <img src={tenant?.logo || "/images/logo_proagro.png"} alt={tenant?.slug === 'proagro' ? "ProAgro" : "Logo"} className="h-full object-contain" />
                    </div>

                    {/* Center: Title Area */}
                    <div className="w-[60%] flex flex-col items-center justify-center py-2">
                        <h1 className="text-xs font-medium tracking-wider">{tenant?.name || 'PRO-AGROINDUSTRIA, S.A. DE C.V.'}</h1>
                        <h2 className="text-[9px] font-normal mt-1">{!tenant || tenant?.slug === 'proagro' ? 'ALMACÉN DE PRODUCTO TERMINADO' : 'SISTEMA DE GESTIÓN LOGÍSTICA'}</h2>
                        <h2 className="text-lg font-bold mt-1 uppercase">INSTRUCCIÓN DE CARGA</h2>
                        <p className="text-[9px] font-normal mt-1">{!tenant || tenant?.slug === 'proagro' ? 'GLS-AP-FO-001' : 'VCD-LG-FO-001'}</p>
                    </div>

                    {/* Right: Truck Logo Area (LOG.png) */}
                    <div className="w-[20%] p-2 flex items-center justify-center border-l border-green-800 relative">
                        {/* Try strict path and simplified styling */}
                        <img src="/images/LOG.png" alt="Transport" className="max-h-full max-w-full object-contain" />
                    </div>
                </div>

                {/* Sub-Header Row: Date, Shift, Lote (Blanks as requested) */}
                <div className="flex w-full text-[10px] font-normal py-1 px-1">
                    <div className="w-1/3 flex items-end">
                        <span className="mr-2">FECHA:</span>
                        <div className="border-b border-black flex-1 text-center font-normal px-2 h-4">
                            {/* BLANK */}
                        </div>
                    </div>
                    <div className="w-1/3 flex items-end px-2">
                        <span className="mr-2">TURNO:</span>
                        <div className="border-b border-black flex-1 text-center font-normal h-4">
                            {/* BLANK */}
                        </div>
                    </div>
                    <div className="w-1/3 flex items-end pl-2">
                        <span className="mr-2">LOTE:</span>
                        <div className="border-b border-black flex-1 text-center font-normal h-4">
                            {/* BLANK */}
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT TABLE SECTION */}
            <div className="mt-2 border border-black border-t-0">
                <table className="w-full text-[10px] border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black py-1 px-2 w-[30%] font-medium text-center">PRODUCTO</th>
                            <th className="border border-black py-1 px-2 w-[20%] font-medium text-center">PRESENTACIÓN</th>
                            <th className="border border-black py-1 px-2 w-[15%] font-medium text-center">TM PROGRAMADAS</th>
                            <th className="border border-black py-1 px-2 w-[15%] font-medium text-center">TM CARGADAS</th>
                            <th className="border border-black py-1 px-2 w-[20%] font-medium text-center bg-green-50">ORDEN DE EMBARQUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="text-center font-normal text-sm h-14">
                            <td className="border border-black py-2 px-1 uppercase leading-tight">
                                {order.product_text || order.product?.name || order.product || ""}
                            </td>
                            <td className="border border-black py-2 uppercase">
                                {order.presentation || "ENVSADO"}
                                {order.sack_type ? ` - ${order.sack_type}` : ''}
                            </td>
                            <td className="border border-black py-2">{Number(order.programmed_tons).toFixed(3)}</td>
                            <td className="border border-black py-2">{/* Manual fill */}</td>
                            {/* Changed to BLACK text as requested */}
                            <td className="border border-black py-2 text-black font-bold text-base">{order.folio}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* TRANSPORT DETAILS SECTION */}
            <div className="mt-6 flex w-full justify-between items-start">

                {/* LEFT SIDE: PLATES & ECONOMIC */}
                <div className="w-[60%] pr-4 pt-4">

                    <div className="flex w-full justify-between items-end mb-4">
                        {/* TRACTOR (Left) */}
                        <div className="flex items-center">
                            <div className="w-16 text-right pr-2 text-[10px] pt-4">PLACAS:</div>
                            <div className="flex flex-col items-center">
                                <div className="text-[10px] mb-1 uppercase">TRACTOR</div>
                                <div className="border border-black px-4 py-1 font-normal text-sm text-center min-w-[120px] uppercase bg-white">
                                    {order.tractor_plate || "N/A"}
                                </div>
                            </div>
                        </div>

                        {/* ECONOMICO (Center/Right) */}
                        <div className="flex flex-col items-center px-4 pb-1">
                            <span className="text-[9px] uppercase mb-1">ECONÓMICO</span>
                            <span className="border-b border-black font-normal text-sm px-4">{order.economic_number || "00"}</span>
                        </div>
                    </div>

                    {/* TRAILER ROW (Below) */}
                    <div className="flex items-center">
                        <div className="w-16 text-right pr-2 text-[10px] pt-4">PLACAS:</div>
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] mb-1 uppercase">REMOLQUE</div>
                            <div className="border border-black px-4 py-1 font-normal text-sm text-center min-w-[120px] uppercase bg-white">
                                {order.trailer_plate || "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: TIMES */}
                <div className="w-[40%] flex flex-col items-end pt-2 pr-4">
                    <div className="border border-black h-10 w-40 mb-6 relative">
                        <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-green-100 px-2 text-[9px] font-medium border border-black h-4 flex items-center leading-none whitespace-nowrap">
                            HORA DE INICIO:
                        </span>
                    </div>

                    <div className="border border-black h-10 w-40 relative">
                        <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-green-100 px-2 text-[9px] font-medium border border-black h-4 flex items-center leading-none whitespace-nowrap">
                            HORA FINAL
                        </span>
                    </div>
                </div>
            </div>

            <div className="border-b-4 border-black my-8 w-full opacity-0"></div>

            {/* INFO BOXES - RESTRUCTURED */}
            <div className="flex w-full mt-6 gap-4 items-stretch">
                {/* LEFT BOX: CLIENT/TRANSPORT info */}
                <div className="w-1/2 border border-black p-2 text-[10px] flex flex-col justify-center">
                    <div className="flex mb-2 items-baseline">
                        <span className="font-medium w-20">CLIENTE:</span>
                        <span className="uppercase flex-1 border-b border-gray-300">
                            {order.client_name || order.client?.business_name}
                        </span>
                    </div>
                    <div className="flex mb-2 items-baseline">
                        <span className="font-medium w-20">TRANSPORT:</span>
                        <span className="uppercase flex-1 border-b border-gray-300">
                            {order.transport_company || order.transporter?.name}
                        </span>
                    </div>
                    <div className="flex mb-2 items-baseline">
                        <span className="font-medium w-20">OPERADOR:</span>
                        <span className="uppercase flex-1 border-b border-gray-300">
                            {order.operator_name}
                        </span>
                    </div>
                    <div className="flex items-baseline">
                        <span className="font-medium w-20">ORIGEN:</span>
                        <span className="uppercase flex-1 border-b border-gray-300">
                            {(typeof order.origin === 'object' ? order.origin?.name : order.origin) || "PLANTA"}
                        </span>
                    </div>
                </div>

                {/* RIGHT BOX: WAREHOUSE (Thicker borders) */}
                <div className="w-1/2 border border-black text-[10px] flex flex-col">
                    <div className="flex border-b border-black h-10">
                        <div className="w-1/2 bg-gray-200 font-medium flex items-center justify-center border-r border-black p-1 text-center">
                            ALMACÉN #
                        </div>
                        <div className="w-1/2 p-1 relative">
                            {/* Blank */}
                        </div>
                    </div>
                    <div className="flex-1 p-2 flex items-center pt-2">
                        <span className="font-medium mr-2 whitespace-nowrap">LÍNEA DE ENVASADO # GLS-APT-</span>
                        <div className="border-b border-black flex-1"></div>
                    </div>
                </div>
            </div>

            {/* SIGNATURES SECTION */}
            <div className="mt-20 flex justify-between px-16 text-[9px] font-medium text-center uppercase">
                <div className="w-5/12">
                    <div className="border-t border-black pt-1">
                        SUPERVISIÓN DE {!tenant || tenant?.slug === 'proagro' ? 'PRO-AGROINDUSTRIA' : (tenant?.name || 'LA EMPRESA')}
                    </div>
                </div>
                <div className="w-5/12">
                    <div className="border-t border-black pt-1">
                        PRESTADOR DEL SERVICIO
                    </div>
                </div>
            </div>
        </div>
    );
}
