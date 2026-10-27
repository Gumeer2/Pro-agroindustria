import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect } from "react";

interface Order {
    id: string;
    folio: string;
    sale_order?: string;
    client?: {
        id: string;
        business_name: string;
        rfc?: string;
        address?: string;
        contact_info?: string;
    };
    created_at: string;
    sale_conditions?: string;
    delivery_conditions?: string;
    vigencia?: string;
    validity?: string;
    total_quantity: number | string;
    product?: {
        code?: string;
        name: string;
    };
    destination?: string;
    observations?: string;
}

export default function Print({ order }: { order: Order }) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    useEffect(() => {
        // window.print();
    }, []);

    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    return (
        <div className="bg-white min-h-screen p-4 md:p-8 text-black font-sans">
            <Head title={`Orden de Venta - ${order.folio} - ${tenant?.name || 'VECODE'}`} />

            <div className="max-w-[21.5cm] mx-auto bg-white p-6 border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6 print:mb-4">
                    <div className="flex flex-col">
                        <img
                            src={tenant?.logo || "/images/Proagro2.png"}
                            alt={tenant?.name || "Logo"}
                            className="h-16 w-auto object-contain mb-2 self-start"
                            onError={(e) => {
                                e.currentTarget.src = "/img/Proagro2.png";
                            }}
                        />
                        <div className="text-[11px] leading-tight text-gray-800 uppercase font-medium">
                            <p className="font-bold text-gray-900 text-[12px] mb-0.5">
                                {!tenant || tenant?.slug === 'proagro' ? 'PROAGROINDUSTRIA, SA DE CV' : tenant?.name}
                            </p>
                            <p>
                                {!tenant || tenant?.slug === 'proagro' ? 'CARR. COATZACOALCOS-VILLAHERMOSA KM 5 INTERIOR' : 'SISTEMA DE GESTIÓN LOGÍSTICA'}
                            </p>
                            <p>
                                {!tenant || tenant?.slug === 'proagro' ? 'COMPLEJO PETROQUIMICO PAJARITOS' : (tenant?.domain || 'VECODE.COM')}
                            </p>
                            <p>{!tenant || tenant?.slug === 'proagro' ? 'COATZACOALCOS, VERACRUZ' : ''}</p>
                        </div>
                    </div>

                    <div className="w-72">
                        <div className="bg-[#284d25] text-white text-center py-1 font-bold text-xs uppercase tracking-wider">
                            ORDEN DE VENTA
                        </div>
                        <table className="w-full border-collapse border border-black text-xs">
                            <tbody>
                                <tr>
                                    <td className="border border-black px-2 py-1 font-bold w-2/5">
                                        FOLIO:
                                    </td>
                                    <td className="border border-black px-2 py-1 font-bold text-xs text-center">
                                        {order.folio}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-1 font-bold">
                                        FECHA:
                                    </td>
                                    <td className="border border-black px-2 py-1 text-xs text-center text-gray-800 font-medium">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString("es-MX")}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-1 font-bold">
                                        No. DE CLIENTE:
                                    </td>
                                    <td className="border border-black px-2 py-1 font-bold text-xs text-center">
                                        {order.client?.id}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-2 py-1 font-bold">
                                        ORDEN DE COMPRA:
                                    </td>
                                    <td className="border border-black px-2 py-1 font-bold text-xs text-center uppercase">
                                        {order.sale_order || ""}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Datos del Cliente Section */}
                <div className="mb-3 print:mb-2">
                    <div className="bg-[#284d25] text-white text-center py-1 font-bold text-xs uppercase tracking-wider mb-0.5">
                        DATOS DEL CLIENTE
                    </div>
                    <table className="w-full border-collapse border border-black text-xs">
                        <tbody>
                            <tr>
                                <td className="w-1/4 px-3 py-1.5 border border-black font-bold uppercase text-[11px]">
                                    NOMBRE:
                                </td>
                                <td className="w-3/4 px-3 py-1.5 border border-black text-xs font-semibold uppercase">
                                    {order.client?.business_name || ""}
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1 border border-black font-bold uppercase text-[11px]">
                                    RFC:
                                </td>
                                <td className="px-3 py-1 border border-black text-xs font-medium uppercase">
                                    {order.client?.rfc || ""}
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1 border border-black font-bold uppercase text-[11px]">
                                    DIRECCION:
                                </td>
                                <td className="px-3 py-1 border border-black text-[11px] font-medium uppercase leading-tight">
                                    {order.client?.address || ""}
                                </td>
                            </tr>
                            <tr>
                                <td className="px-3 py-1 border border-black font-bold uppercase text-[11px]">
                                    CONTACTO:
                                </td>
                                <td className="px-3 py-1 border border-black text-xs font-medium uppercase">
                                    {order.client?.contact_info || ""}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-2">
                        <table className="w-full border-collapse border border-black text-xs">
                            <tbody>
                                <tr>
                                    <td className="w-[55%] px-3 py-1.5 border border-black font-bold uppercase text-[11px]">
                                        CONDICIONES DE ENTREGA:
                                    </td>
                                    <td className="w-[45%] px-3 py-1.5 border border-black text-xs font-semibold uppercase">
                                        {order.delivery_conditions || "GRANEL/ENVASADO"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-1.5 border border-black font-bold uppercase text-[11px]">
                                        VIGENCIA:
                                    </td>
                                    <td className="px-3 py-1.5 border border-black text-xs font-medium uppercase">
                                        {order.vigencia || order.validity || ""}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Product Table */}
                <div className="mb-3 print:mb-2">
                    <table className="w-full border-collapse border border-black text-xs">
                        <thead className="bg-[#284d25] text-white text-center">
                            <tr>
                                <th className="border border-black py-1 w-[55%] font-bold uppercase text-xs tracking-wider">
                                    DESCRIPCION
                                </th>
                                <th className="border border-black py-1 w-[20%] font-bold uppercase text-xs tracking-wider">
                                    UNIDAD
                                </th>
                                <th className="border border-black py-1 w-[25%] font-bold uppercase text-xs tracking-wider">
                                    CANTIDAD
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-10 text-center">
                                <td className="border border-black px-3 py-1 text-xs font-medium text-left uppercase">
                                    {order.product?.code
                                        ? `${order.product.code} - ${order.product.name}`
                                        : order.product?.name || ""}
                                </td>
                                <td className="border border-black py-1 font-medium text-xs uppercase">
                                    TONELADAS
                                </td>
                                <td className="border border-black px-3 py-1 font-bold text-xs text-center">
                                    {formatter.format(
                                        Number(order.total_quantity || 0),
                                    )}
                                </td>
                            </tr>
                            <tr className="h-8">
                                <td className="border border-black"></td>
                                <td className="border border-black text-center font-bold text-xs uppercase">
                                    TOTAL
                                </td>
                                <td className="border border-black text-center font-bold text-xs">
                                    {formatter.format(
                                        Number(order.total_quantity || 0),
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Políticas de entrega */}
                <div className="my-3 print:my-2 text-center">
                    <p className="text-[11px] text-gray-800 font-normal mb-1">
                        Políticas de entrega :
                    </p>
                    <div className="text-[9.5px] leading-tight text-gray-700 text-left space-y-1 px-1">
                        <p>
                            * El cliente es responsable de notificar en tiempo y forma de las unidades autorizadas para el retiro al departamento de logística y suministros, asi mismo de notificar cualquier cambio en las mismas.
                        </p>
                        <p>
                            * Los operadores y unidades autorizadas para el retiro deberan cumplir con todos los requisitos de seguridad e higiene que marca el reglamento., asi tambien con todos los requisitos documentales necesarios para la carga.
                        </p>
                        <p>
                            * Ante el no ingreso a carga de alguna unidad por inclumplimiento de algun requisito de seguridad o documental no es responsabilidad de Pro-agroindustria.
                        </p>
                    </div>
                </div>

                {/* Observations Section */}
                <div className="mb-6 print:mb-4">
                    <div className="bg-[#284d25] text-white text-center py-1 font-bold text-xs uppercase tracking-wider mb-0.5">
                        OBSERVACIONES
                    </div>
                    <div className="border border-black min-h-[4.5rem] p-2 text-xs font-normal whitespace-pre-line text-left">
                        {order.destination || order.observations || ""}
                    </div>
                </div>

                {/* Signatures & Footer Section */}
                <div className="mt-8 print:mt-4">
                    <div className="flex flex-col items-center mb-6 print:mb-4">
                        <div className="w-72 border-b-2 border-black mb-1"></div>
                        <p className="text-xs font-semibold text-black">
                            Oscar Méndez Torres
                        </p>
                        <p className="text-[11px] font-bold text-gray-800 tracking-wider uppercase">
                            COMERCIALIZACIÓN
                        </p>
                    </div>

                    <div className="w-full border-t-2 border-[#284d25] mb-2"></div>

                    <div className="text-center mb-2">
                        <a
                            href="https://www.proagroindustria.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-gray-900 hover:text-black underline tracking-wide"
                        >
                            www.proagroindustria.com
                        </a>
                    </div>

                    <div className="flex justify-between items-end text-[11px] text-gray-800 pt-1">
                        <div className="space-y-0.5 text-left">
                            <div>
                                <span className="font-semibold text-black">
                                    Venta y Cobranza:
                                </span>{" "}
                                <a
                                    href="mailto:oscar.mendez@proagroindustria.com"
                                    className="text-blue-700 underline ml-1"
                                >
                                    oscar.mendez@proagroindustria.com
                                </a>
                            </div>
                            <div>
                                <span className="font-semibold text-black">
                                    Administrativo:
                                </span>{" "}
                                <a
                                    href="mailto:jorge.robles@proagroindustria.com"
                                    className="text-blue-700 underline ml-1"
                                >
                                    jorge.robles@proagroindustria.com
                                </a>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 mb-1">
                                <img
                                    src={tenant?.logo || "/images/Proagro2.png"}
                                    alt="Logo"
                                    className="h-7 object-contain"
                                    onError={(e) => {
                                        e.currentTarget.src = "/img/Proagro2.png";
                                    }}
                                />
                            </div>
                            <p className="text-xs font-bold text-gray-800 tracking-wider">
                                DCM-FO-003
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions (Hidden on Print) */}
                <div className="mt-8 flex justify-center gap-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-[#284d25] text-white px-6 py-2 rounded shadow hover:bg-[#1e3f20] font-medium transition-colors"
                    >
                        Imprimir
                    </button>

                    <Link
                        href={route("sales.orders.index")}
                        className="bg-gray-500 text-white px-6 py-2 rounded shadow hover:bg-gray-600 font-medium transition-colors"
                    >
                        Volver
                    </Link>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { 
                        margin: 0.6cm; 
                        size: portrait;
                    }
                    body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                    }
                    .print\\:hidden { display: none !important; }
                    .max-w-\\[21\\.5cm\\] { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .bg-\\[\\#284d25\\] { 
                        background-color: #284d25 !important; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
