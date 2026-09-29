import React, { useEffect, useState } from "react";
import { Head, usePage, router, Link } from "@inertiajs/react";
import InstructionTemplate from "@/Components/Print/InstructionTemplate";
import WeightVerificationTemplate from "@/Components/Print/WeightVerificationTemplate";
import StowageNoteTemplate from '@/Components/Print/StowageNoteTemplate';
import { ArrowLeft, Printer } from "lucide-react";
import QRCode from "qrcode";

interface Order {
    id: string;
    folio: string;
    sales_order?: {
        folio: string;
        sale_order?: string; // Pedido
    };
    date?: string;
    created_at: string;
    client: {
        business_name: string;
        rfc?: string;
        address?: string;
    };
    consigned_to?: string; // Corrected field name
    transport_company?: string; // Linea transportista
    carta_porte?: string;
    operator_name?: string;
    unit_number?: string; // Marca/Modelo
    license_number?: string;
    tractor_plate?: string;
    economic_number?: string;
    unit_type?: string;
    trailer_plate?: string;
    destination?: string;
    state?: string; // New State field
    product?: {
        code?: string;
        name: string;
    };
    presentation?: string;
    sacks_count?: string;
    programmed_tons?: string;
    origin_id?: number | string;
    origin_relation?: { id: number; name: string };
    origin?: string | { id: number; name: string };
    documenter_name?: string;
    scale_name?: string;
    scale_operator_id?: number | string;
    scale_operator?: { id: number; name: string };

    observations?: string;
    product_code?: string;
    product_text?: string;
}

interface Props {
    order: Order;
    qrCode?: string;
}

export default function Print({ order }: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;
    const [qrDataUrl, setQrDataUrl] = useState("");

    useEffect(() => {
        if (order.folio) {
            QRCode.toDataURL(order.folio, { width: 120, margin: 1 }, (err, url) => {
                if (!err) setQrDataUrl(url);
            });
        }

        const handleAfterPrint = () => {
            router.visit(route("documentation.orders.index"));
        };

        window.addEventListener("afterprint", handleAfterPrint);

        const printTimeout = setTimeout(() => {
            window.print();
        }, 1000);

        return () => {
            clearTimeout(printTimeout);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
    }, [order.folio]);

    const calculateSacks = () => {
        if (!order.programmed_tons || Number(order.programmed_tons) <= 0) return "0 SACOS";

        const tons = parseFloat(order.programmed_tons);

        // 1. Try to find the bag size (e.g., 25, 50)
        // Check sacks_count first if it has "KG"
        let bagSize = 0;
        const sizeFromSacks = order.sacks_count?.match(/(\d+)\s*KG/i);
        if (sizeFromSacks) {
            bagSize = parseInt(sizeFromSacks[1]);
        } else {
            // Check product name for "- XX KG"
            const pName = typeof order.product === 'string' ? order.product : (order.product?.name || '');
            const sizeFromProduct = order.product_text || pName;
            const matchProduct = sizeFromProduct.match(/(\d+)\s*KG/i);
            if (matchProduct) {
                bagSize = parseInt(matchProduct[1]);
            }
        }

        // 2. If we have a bag size, calculate total sacks
        if (bagSize > 0) {
            const count = (tons * 1000) / bagSize;
            return Math.ceil(count) + " SACOS";
        }

        // 3. Fallback: if sacks_count already looks like a count (e.g., "1080 SACOS")
        if (order.sacks_count && order.sacks_count.toUpperCase().includes("SACO")) {
            return order.sacks_count;
        }

        return "N/A";
    };

    const policies = [
        "1. Presentarse con su equipo de protección personal (Casco, chaleco, lentes y zapatos de seguridad).",
        "2. Entregar su documentación en vigilancia.",
        "3. Ingresar a báscula para su pesaje inicial.",
        "4. Pasar al área de carga asignada.",
        "5. Una vez cargado, pasar a báscula para su pesaje final.",
        "6. Recoger su documentación en vigilancia."
    ];

    // Check if Consignee is SADER (case insensitive)
    const isSader = order.consigned_to?.toUpperCase().includes('SADER');

    // Check if Sales Order is OV-AMO
    const isOvAmo = order.sales_order?.folio?.toUpperCase().startsWith('OV-AMO');

    return (
        <div className="bg-gray-100 min-h-screen p-4 print:p-0 print:bg-white text-sans">
            <Head title={`Impresión Orden ${order.folio} `} />

            <style>{`
*, *::before, *::after {
    box-sizing: border-box !important;
}
@media print {
    @page { 
        size: letter portrait; 
        margin: 5mm 6mm; 
    }
    html, body { 
        margin: 0 !important; 
        padding: 0 !important; 
        background: #fff !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
    }
    .no-print { display: none !important; }
    .print-content-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-sizing: border-box !important;
    }
    .page-shipment-order {
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
    }
    .policies-section {
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
    }
    .page-instruction {
        box-sizing: border-box !important;
    }
    .page-weight-verification {
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
    }
}
table { 
    width: 100%; 
    border-collapse: collapse; 
    font-family: Arial, sans-serif; 
    font-size: 9px; 
}
th, td { 
    border: 1px solid #9ca3af; 
    padding: 2px 4px; 
}
.no-border { border: none !important; }

/* Wrapper to force a new page for the Stowage Note */
.stowage-page-wrapper {
    page-break-before: always;
    break-before: page;
    position: relative;
    width: 100%;
    height: 264mm;
    overflow: hidden; 
}

/* Rotated content container */
.rotate-landscape-v2 {
    transform: rotate(90deg) translateY(-100%);
    transform-origin: top left;
    width: 264mm;
    height: 206mm;
    position: absolute;
    top: 0;
    left: 0;
}

.bg-header { background-color: ${tenant?.primary_color ? tenant.primary_color + '33' : '#15803d33'}!important; font-weight: bold; text-align: center; font-size: 11px; letter-spacing: 1px; }
.bg-title { background-color: ${tenant?.primary_color || '#15803d'}!important; color: white!important; font-weight: bold; text-align: center; font-size: 11px; letter-spacing: 1px; }
.text-center { text-align: center; }
.text-bold { font-weight: bold; }
.no-border { border: none!important; }
.uppercase { text-transform: uppercase; }
.text-xs { font-size: 7px; }

/* Policies Section Styles */
.policies-section table { font-size: 11px; }
.policies-section .policy-header { font-size: 14px; padding: 4px; }
.policies-section .policy-title { font-size: 16px; padding: 8px; }
.policies-section .policy-text { font-size: 11px; padding: 4px; line-height: 1.4; }
`}</style>

            {/* Screen-only action bar */}
            <div className="no-print fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-gray-200">
                <Link
                    href={route("documentation.orders.index")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Órdenes
                </Link>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
                >
                    <Printer className="w-4 h-4" />
                    Imprimir
                </button>
            </div>

            <div className="max-w-[215mm] mx-auto bg-white p-2 print:p-0 print:m-0 print:max-w-none print:w-full print-content-wrapper">

                {/* --- PAGE 1 & 2 LOOP: SHIPMENT ORDER + POLICIES (3 COPIES) --- */}
                {/* 
                    Logic: The user needs 3 physical copies of the Order/Policy set. 
                    We render the [Order Page, Policy Page] pair 3 times sequentially.
                */}
                {[1, 2, 3].map((copyIndex) => (
                    <React.Fragment key={`copy - ${copyIndex} `}>

                        {/* PAGE 1: SHIPMENT ORDER (Copy {copyIndex}) */}
                        <div className="page-shipment-order relative w-full box-border overflow-hidden" style={{ pageBreakAfter: 'always', breakAfter: 'page' }}>
                            {/* Optional Watermark for copies if needed, currently clean */}
                            <div className="page-1 w-full box-border">
                                {/* Header Details */}
                                <div className="border border-gray-400 mb-1 p-0.5 text-center w-full box-border">
                                    <div className="font-bold text-sm">{tenant?.name || 'PROAGROINDUSTRIA S.A. DE C.V.'}</div>
                                    <div className="text-[10px] text-green-700 font-semibold" style={{ color: tenant?.primary_color || '#15803d' }}>
                                        {!tenant || tenant?.slug === 'proagro'
                                            ? 'Carretera Coatzacoalcos-villahermosa Km 5 centro, Coatzacoalcos, Ver. CP. 96400 RFC: PRO140101'
                                            : `RFC: ${tenant?.slug === 'proagro' ? 'PRO140101' : 'VCD140101'} | ${tenant?.domain || 'VECODE.COM'}`}
                                    </div>
                                    <div className="text-[10px] text-green-700 font-semibold mb-0.5" style={{ color: tenant?.primary_color || '#15803d' }}>
                                        {!tenant || tenant?.slug === 'proagro' ? 'Tel. (921) 689 0382' : ''}
                                    </div>
                                    <div className="text-[9px] font-bold italic">{!tenant || tenant?.slug === 'proagro' ? 'GLS-DD-FO-001' : 'VCD-DD-FO-001'}</div>
                                </div>

                                {/* MAIN TITLE BAR */}
                                <div className="bg-title border border-gray-400 py-0.5 mb-1 w-full box-border">
                                    ORDEN DE EMBARQUE
                                </div>

                                {/* FOLIO ROW */}
                                <table className="mb-1 w-full">
                                    <tr>
                                        <td className="bg-header w-[14%]">FOLIO O.E.</td>
                                        <td className="text-center font-bold text-sm w-[18%]">{order.folio}</td>
                                        <td className="no-border w-[1%]"></td>
                                        <td className="bg-header w-[20%]">ORDEN DE VENTA</td>
                                        <td className="text-center font-bold w-[20%]">{order.sales_order?.folio || "N/A"}</td>
                                        <td className="no-border w-[1%]"></td>
                                        <td className="bg-header w-[12%]">FECHA</td>
                                        <td className="text-center font-bold w-[14%]">{order.date || order.created_at.split('T')[0]}</td>
                                    </tr>
                                </table>

                                {/* CLIENT SECTION */}
                                <table className="mb-1 w-full">
                                    <tr>
                                        <td className="bg-header w-[18%] text-left pl-2">CLIENTE :</td>
                                        <td className="font-bold pl-2 uppercase w-[64%]">{order.client.business_name}</td>
                                        <td rowSpan={4} className="w-[18%] text-center no-border p-1">
                                            {/* Logo */}
                                            <img src={tenant?.logo || "/images/logo_proagro.png"} alt="LOGO" className="h-16 mx-auto object-contain" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="bg-header text-left pl-2">R.F.C.:</td>
                                        <td className="font-bold pl-2 uppercase">{order.client.rfc || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td className="bg-header text-left pl-2">DIRECCIÓN:</td>
                                        <td className="font-bold pl-2 text-[8px] uppercase">{order.client.address || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td className="bg-header text-left pl-2">CONSIGNADO:</td>
                                        <td className="p-0 border">
                                            <table className="w-full h-full border-none">
                                                <tr className="border-none">
                                                    <td className="font-bold pl-2 uppercase border-none text-[9px] w-[65%]">{order.consigned_to || "N/A"}</td>
                                                    <td className="bg-header w-[15%] border-l border-r border-[#9ca3af] font-bold px-1 text-[9px] text-right whitespace-nowrap">PEDIDO:</td>
                                                    <td className="font-bold px-1 text-[9px] w-[20%] text-center border-none">{order.sales_order?.sale_order || "N/A"}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                {/* TRANSPORTER SECTION */}
                                <div className="bg-header border border-[#9ca3af] border-b-0 text-[9.5px] py-0.5 w-full box-border">DEL TRANSPORTISTA</div>
                                <table className="mb-1 w-full">
                                    <tr>
                                        <td className="bg-header w-[18%] text-left pl-2">TRANSPORTE:</td>
                                        <td className="font-bold uppercase text-[9px] w-[45%]">{order.transport_company || "N/A"}</td>
                                        <td className="bg-header w-[17%] text-center">CARTA PORTE:</td>
                                        <td className="text-center font-bold text-sm w-[20%]">{order.carta_porte || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td className="bg-header text-left pl-2">OPERADOR:</td>
                                        <td colSpan={3} className="font-bold uppercase">{order.operator_name || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td className="bg-header text-left pl-2">UNIDAD:</td>
                                        <td className="font-bold uppercase">{order.unit_number || "N/A"}</td>
                                        <td className="bg-header text-center">LICENCIA:</td>
                                        <td className="text-center font-bold uppercase">{order.license_number || "N/A"}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} className="p-0 border">
                                            <table className="w-full border-none">
                                                <tr className="border-none">
                                                    <td className="bg-header w-[15%] text-left pl-2 border-l-0 border-t-0">TRACTOR:</td>
                                                    <td className="text-center font-bold border-t-0 w-[18%]">{order.tractor_plate || "N/A"}</td>

                                                    <td className="bg-header w-[16%] text-center border-t-0">ECONÓMICO:</td>
                                                    <td className="text-center font-bold border-t-0 w-[18%]">{order.economic_number || "N/A"}</td>

                                                    <td className="bg-header w-[18%] text-center border-t-0">TIPO DE UNIDAD:</td>
                                                    <td className="text-center font-bold border-r-0 border-t-0 w-[15%]">{order.unit_type || "VOLTEO"}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} className="p-0 border">
                                            <table className="w-full border-none">
                                                <tr className="border-none">
                                                    <td className="bg-header w-[15%] text-left pl-2 border-l-0 border-b-0">REMOLQUE:</td>
                                                    <td className="text-center font-bold border-b-0 w-[18%]">{order.trailer_plate || "N/A"}</td>

                                                    <td className="bg-header w-[16%] text-center border-b-0">DESTINO:</td>
                                                    <td className="text-center font-bold uppercase border-b-0 w-[33%]">{order.destination || "N/A"}</td>

                                                    <td className="bg-header w-[12%] text-center border-b-0">ESTADO:</td>
                                                    <td className="text-center font-bold uppercase border-r-0 border-b-0 w-[6%]">{order.state || "MX"}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                {/* SHIPMENT SECTION */}
                                <div className="bg-header border border-[#9ca3af] border-b-0 text-[9.5px] py-0.5 font-bold w-full box-border">DEL EMBARQUE</div>
                                <table className="mb-1 w-full">
                                    <tr>
                                        <td className="bg-header text-center w-[18%]">CÓDIGO</td>
                                        <td className="bg-header text-center w-[57%]">DESCRIPCIÓN DEL PRODUCTO</td>
                                        <td className="bg-header text-center w-[25%]">TONS. PROGRAMADAS</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center font-bold">{order.product_code || order.product?.code || "N/A"}</td>
                                        <td className="text-center font-bold uppercase">{order.product_text || order.product?.name || "N/A"}</td>
                                        <td className="text-center font-bold">{order.programmed_tons || "0.000"}</td>
                                    </tr>
                                </table>

                                <table className="mb-1">
                                    <tr>
                                        <td className="bg-header text-center w-1/4">PRESENTACIÓN</td>
                                        <td className="bg-header text-center w-1/4">NÚMERO DE SACOS</td>
                                        <td className="bg-header text-center w-1/4">ORIGEN</td>
                                        <td className="bg-header text-center w-1/4">TONS. CARGADAS</td>
                                    </tr>
                                    <tr>
                                        <td className="text-center font-bold uppercase">
                                            {(() => {
                                                if (order.presentation !== 'ENVASADO') return 'GRANEL';
                                                const sackSize = (() => {
                                                    if (order.sacks_count?.toUpperCase().includes('KG')) return order.sacks_count;
                                                    const pName = typeof order.product === 'string' ? order.product : (order.product?.name || '');
                                                    return pName.match(/\d+\s*KG/i)?.[0] || order.sacks_count || '';
                                                })();
                                                return `ENVASADO - ${sackSize}`;
                                            })()}
                                        </td>
                                        <td className="text-center font-bold">{calculateSacks()}</td>
                                        <td className="text-center font-bold uppercase">
                                            {(typeof order.origin === 'object' ? order.origin?.name : order.origin) || (!tenant || tenant?.slug === 'proagro' ? 'PROAGROINDUSTRIA' : tenant?.name)}
                                        </td>
                                        <td className="text-center font-bold"></td>
                                    </tr>
                                </table>

                                {/* ALMACEN / ORIGEN / TIPO SACOS (Conditional) */}
                                <table className="mb-1">
                                    <tr>
                                        <td className="bg-header text-center font-bold text-[9px] w-1/3 no-border">ALMACEN</td>
                                        <td className="bg-header text-center font-bold text-[9px] w-1/3 no-border">ORIGEN DE PRODUCTO</td>

                                        {order.presentation?.toUpperCase().includes('ENVASADO') ? (
                                            <td className="bg-header text-center font-bold text-[9px] w-1/3 no-border">TIPO DE SACOS</td>
                                        ) : (
                                            <td className="no-border w-1/3"></td>
                                        )}
                                    </tr>
                                    <tr>
                                        <td className="text-center align-middle py-1 border-t-0 no-border">
                                            <span className="inline-block border border-black w-3 h-3 align-middle mr-1"></span> 1
                                            <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span> 2
                                            <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span> 3
                                            <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span> 4
                                            <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span> 5
                                        </td>
                                        <td className="text-center align-middle py-1 border-t-0 no-border">
                                            UREA I <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span>
                                            UREA II <span className="inline-block border border-black w-3 h-3 align-middle mx-1"></span>
                                        </td>

                                        {order.presentation?.toUpperCase().includes('ENVASADO') ? (
                                            <td className="text-left align-middle py-1 border-t-0 pl-2 no-border">
                                                <div className="flex items-center mb-0.5">
                                                    <span className="inline-block border border-gray-400 w-3 h-3 mr-1"></span>
                                                    <span className="text-[8px] font-bold mr-1">PROPIO COD</span>
                                                    <span className="border-b border-gray-400 w-8"></span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="inline-block border border-gray-400 w-3 h-3 mr-1"></span>
                                                    <span className="text-[8px] font-bold">CLIENTE</span>
                                                </div>
                                            </td>
                                        ) : (
                                            <td className="no-border">
                                            </td>
                                        )}
                                    </tr>
                                </table>

                                {/* SIGNATURES */}
                                <table className="mb-2 mt-8 w-full">
                                    <tr>
                                        {/* DOCUMENTADOR */}
                                        <td className="w-1/2 p-0 align-top no-border">
                                            <div className="bg-header w-full py-1 text-center font-bold">DOCUMENTADOR</div>
                                            <div className="h-14 flex flex-col justify-end text-center pb-1">
                                                <div className="uppercase text-[9px] font-bold mb-1">{order.documenter_name}</div>
                                                <div className="border-t border-black w-3/4 mx-auto text-[8px]">Firma</div>
                                            </div>
                                        </td>
                                        <td className="no-border w-5"></td>
                                        {/* SUPERVISOR */}
                                        <td className="w-1/2 p-0 align-top no-border">
                                            <div className="bg-header w-full py-1 text-center font-bold">SUPERVISOR DE EMBARQUE</div>
                                            <div className="h-14 flex flex-col justify-end text-center pb-1">
                                                <div className="border-t border-black w-3/4 mx-auto text-[8px]">Firma</div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <table className="mb-2 mt-2 w-full">
                                    <tr>
                                        {/* BASCULA */}
                                        <td className="w-1/2 p-0 align-top no-border">
                                            <div className="bg-header w-full py-1 text-center font-bold">OPERADOR DE BASCULA</div>
                                            <div className="h-14 flex flex-col justify-end text-center pb-1">
                                                <div className="uppercase text-[9px] font-bold mb-1">
                                                    {order.scale_name || (order as any).scale_operator?.name || ""}
                                                </div>
                                                <div className="border-t border-black w-3/4 mx-auto text-[8px]">Firma</div>
                                            </div>
                                        </td>
                                        <td className="no-border w-5"></td>
                                        {/* OPERADOR UNIDAD */}
                                        <td className="w-1/2 p-0 align-top no-border">
                                            <div className="bg-header w-full py-1 text-center font-bold">OPERADOR DE UNIDAD</div>
                                            <div className="h-14 flex flex-col justify-end text-center pb-1">
                                                <div className="uppercase text-[9px] font-bold mb-1">{order.operator_name}</div>
                                                <div className="border-t border-black w-3/4 mx-auto text-[8px]">Firma</div>
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                {/* SECURITY & AUTH - Single Box Style */}
                                <div className="flex justify-center my-2 w-full">
                                    <div className="w-1/3 p-0 no-border">
                                        <div className="bg-header border-b border-black text-center text-[9px] font-bold py-0.5">Seguridad Física</div>
                                        <div className="h-8"></div>
                                        <div className="text-center font-bold text-[8px] border-t border-black pt-0.5 mb-0.5">
                                            Nombre y firma de quien autoriza la salida
                                        </div>
                                    </div>
                                </div>

                                {/* TIMES */}
                                <div className="flex justify-between w-full px-4 text-[9px] font-bold my-2 box-border">
                                    <div className="flex items-end">
                                        <span>Hora inicial de carga:</span>
                                        <div className="border-b border-gray-400 w-28 mx-2"></div>
                                    </div>
                                    <div className="flex items-end">
                                        <span>Hora final de carga:</span>
                                        <div className="border-b border-gray-400 w-28 mx-2"></div>
                                    </div>
                                </div>

                                {/* OBSERVATIONS & QR */}
                                <div className="flex gap-1.5 w-full box-border mt-1">
                                    <div className="flex-1 min-w-0">
                                        <table className="w-full h-full">
                                            <thead>
                                                <tr>
                                                    <th className="bg-header text-left pl-2 py-0.5 no-border uppercase">OBSERVACIONES:</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="h-16">
                                                    <td className="align-top text-[8px] uppercase p-1.5 no-border border border-gray-400">
                                                        {order.observations}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="w-20 h-20 border border-gray-400 flex flex-col items-center justify-center p-0.5 bg-white flex-shrink-0">
                                        {qrDataUrl ? (
                                            <>
                                                <img src={qrDataUrl} alt="QR Folio" className="w-16 h-16 object-contain" />
                                                <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter">SCAN OE</span>
                                            </>
                                        ) : (
                                            <div className="text-[6px] text-gray-300">...</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PAGE 2: POLICIES (Copy {copyIndex}) */}
                        <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} className="policies-section pt-1">
                            {/* POLICIES HEADER */}
                            <table className="mb-2">
                                <tr>
                                    <th className="text-center font-bold no-border border-b-2! border-black! pb-1 text-base! policy-title">POLÍTICA PARA EL PROCESO DE EMBARQUES</th>
                                </tr>
                                <tr>
                                    <td className="no-border p-0 pt-2">
                                        <table className="w-full">
                                            <tr>
                                                <td className="w-3/4 border-0 border-b border-r bg-white font-bold pl-4 py-1 text-xs!">
                                                    <div className="text-sm">{tenant?.name || 'PROAGROINDUSTRIA, S.A. DE C.V.'}</div>
                                                    <div className="font-normal mt-0.5 text-[8.5px]">
                                                        {!tenant || tenant?.slug === 'proagro' ? 'Carretera Coatzacoalcos-Villahermosa km 5, Centro.' : (tenant?.domain || 'VECODE.COM')}
                                                    </div>
                                                    <div className="font-normal text-[8.5px]">{!tenant || tenant?.slug === 'proagro' ? 'Coatzacoalcos, Ver., CP 96400' : ''}</div>
                                                    <div className="font-normal text-[8.5px]">RFC: {!tenant || tenant?.slug === 'proagro' ? 'PRO140101QY9' : 'VCD140101'}</div>
                                                </td>
                                                <td className="w-1/4 border-0 border-b text-center align-middle" rowSpan={4}>
                                                    <img src={tenant?.logo || "/images/logo_proagro.png"} alt="LOGO" className="h-12 mx-auto object-contain" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <th className="text-center font-bold border border-black bg-white text-xs py-0.5">GLS-TR-FO-013</th>
                                </tr>
                            </table>

                            {/* POLICY DETAILS */}
                            <table className="mb-2">
                                <tr className="h-6">
                                    <td className="font-bold border pl-2 w-1/3 bg-gray-50 text-[9px]">NOMBRE DEL DEPARTAMENTO</td>
                                    <td className="border text-center font-bold w-1/3 text-[9px]">LOGÍSTICA Y SUMINISTRO</td>
                                    <td className="font-bold border w-1/6 pl-2 bg-gray-50 text-[9px]">POLÍTICA N°</td>
                                    <td className="border text-center font-bold w-1/6 text-[9px]">1</td>
                                </tr>
                                <tr className="h-6">
                                    <td className="font-bold border pl-2 bg-gray-50 text-[9px]">FECHA DE ENTRADA EN VIGOR:</td>
                                    <td className="border text-center text-[9px]">13 DE JUNIO DEL 2023</td>
                                    <td className="font-bold border pl-2 bg-gray-50 text-[9px]">VERSIÓN N°</td>
                                    <td className="border text-center text-[9px]">1</td>
                                </tr>
                                <tr><td colSpan={4} className="text-center font-bold text-blue-800 tracking-widest py-0.5 no-border text-xs policy-header">ALCANCE</td></tr>
                                <tr><td colSpan={4} className="p-1.5 text-justify border text-black policy-text">La Presente política es aplicable a los diferentes grupos de interés que forman parte del proceso de los embarques de producto terminado dentro de las instalaciones de {!tenant || tenant?.slug === 'proagro' ? 'Proagroindustria, S.A. de C.V.' : (tenant?.name || 'la empresa')}, con especial énfasis en el operador de las líneas transportistas que ingresan a las instalaciones.</td></tr>
                                <tr><td colSpan={4} className="text-center font-bold text-blue-800 tracking-widest py-0.5 no-border text-xs policy-header">DECLARACIÓN DE LA POLÍTICA</td></tr>
                                <tr><td colSpan={4} className="p-1.5 text-justify border text-black policy-text">La presente política se realiza como medida para salvaguardar y cumplir con las buenas prácticas de comportamiento, seguridad del personal, protección a instalaciones e infraestructura.</td></tr>
                            </table>

                            <div className="text-center font-bold border-none text-blue-800 text-xs mb-1 tracking-widest mt-2">SECCIÓN DE LAS POLÍTICAS</div>
                            <table className="mb-2 text-xs">
                                <tr>
                                    <th className="w-1/2 text-center font-bold py-1 no-border text-xs">ASPECTOS GENERALES</th>
                                    <th className="w-1/2 text-center font-bold py-1 no-border text-xs">POLÍTICA DEL ÁREA DE ALMACENES DE PRODUCTO TERMINADO</th>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">1. Portar correctamente el equipo de protección personal.</td>
                                    <td className="align-top p-1 border-none policy-text" rowSpan={2}>10. Para el caso de las unidades tipo plataforma es requisito indispensable salir del almacén con <b>por lo menos el 50% de las estibas amarradas</b>, y con la carga tapada.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">2. No ingresar bebidas alcohólicas o bajo la influencia de estas mismas.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">3. La velocidad permitida en las instalaciones es de <b>20km/h.</b></td>
                                    <td className="align-top p-1 border-none policy-text">11. Las unidades deberán estar en condiciones adecuadas para la carga.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">4. La velocidad máxima permitida en los patios de maniobras, y dentro de los almacenes de es <b>10 km/h.</b></td>
                                    <td className="align-top p-1 border-none policy-text">12. Los supervisores de carga no son responsables por la pérdida del turno de carga.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">5. Para el caso de las unidades tipo “caja seca” el operador deberá corroborar cuando finalice su carga que este correctamente cerrada, para que el operador de bascula proceda a colocar el o los sellos correspondientes.</td>
                                    <td className="align-top p-1 border-none policy-text">13. Por razones de preservación del producto, queda estrictamente prohibido mantener funcionando el aire acondicionado de la unidad durante su estancia en los almacenes.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">6. Para el caso de las unidades tipo “Jaula” el operador deberá corroborar que todas las escotillas se encuentren correctamente cerradas, y las lonas se encuentren en optimas condiciones para su uso.</td>
                                    <td className="align-top p-1 border-none policy-text">14. Es responsabilidad del operador estar pendiente durante el proceso de carga. El operador debe comunicar al supervisor en turno cualquier observación referente a su carga, cualquier observación de inconformidad con la carga que se manifieste.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">7. Finalizado el proceso de carga, es responsabilidad del operador el aseguramiento de la carga. (amarre, enlonada, etc.)</td>
                                    <td className="align-top p-1 border-none policy-text">15. Queda estrictamente prohibido que operadores graben videos o tomen fotografías de las instalaciones o del proceso de operación de carga.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">8. El retiro de lona de la unidad, o enlonada de las unidades son responsabilidad únicamente del operador de la unidad y/o línea transportista.</td>
                                    <td className="align-top p-1 border-none policy-text">16. Finalizado el proceso de carga la unidad deberá permanecer en el patio de maniobras debidamente estacionada hasta que le sea indicado su salida.</td>
                                </tr>
                                <tr>
                                    <td className="align-top p-1 border-none policy-text">9. Queda estrictamente prohibido el acceso a las instalaciones a cualquier persona (polizon) ajena a la carga, dentro de las unidades.</td>
                                    <td className="text-center align-middle font-bold h-16 border-none pt-2">
                                        <div className="mb-4">OPERADOR DE UNIDAD</div>
                                        <div className="border-b border-black w-2/3 mx-auto mb-1"></div>
                                        <div className="uppercase text-[9px]">{order.operator_name}</div>
                                        <div className="text-[8px]">FIRMA DE ENTERADO</div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </React.Fragment>
                ))}


                {/* --- PAGE 3: INSTRUCTION (Always Printed Once) --- */}
                {/* 
                    If presentation is "ENVASADO", this printed on front of last sheet, and we force page break.
                    If presentation is "GRANEL", this is the last page.
                */}
                {!isOvAmo && (
                    <div className="page-instruction pt-8" style={{ pageBreakAfter: (order.presentation?.toUpperCase().includes('ENVASADO') ? 'always' : 'auto') }}>
                        <InstructionTemplate order={order} />
                    </div>
                )}

                {/* --- PAGE 4: WEIGHT VERIFICATION (Conditional: Envasado Only) --- */}
                {order.presentation?.toUpperCase().includes('ENVASADO') && !isOvAmo && (
                    <div className="page-weight-verification pt-8" style={{ pageBreakAfter: 'always' }}>
                        <WeightVerificationTemplate order={order} />
                    </div>
                )}

                {/* --- PAGE 5: STOWAGE NOTE (Conditional: Envasado Only AND NOT SADER) --- */}
                {order.presentation?.toUpperCase().includes('ENVASADO') && !isSader && !isOvAmo && (
                    <div className="stowage-page-wrapper">
                        {/* We use a specific inner container for the rotation */}
                        <div className="rotate-landscape-v2">
                            <StowageNoteTemplate order={order} />
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
}


