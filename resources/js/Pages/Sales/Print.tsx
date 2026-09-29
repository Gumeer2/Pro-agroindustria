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
    total_quantity: number | string;
    product?: {
        code?: string;
        name: string;
    };
    destination?: string;
}

export default function Print({ order }: { order: Order }) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    useEffect(() => {
        // Auto print on load if desired, but maybe user wants to see it first.
        // window.print();
    }, []);

    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    return (
        <div className="bg-white min-h-screen p-8 text-black font-sans">
            <Head title={`Orden de Venta - ${order.folio} - ${tenant?.name || 'VECODE'}`} />

            <div className="max-w-[21cm] mx-auto bg-white p-4">
                {" "}
                {/* A4 width approx */}
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="w-1/2">
                        <div className="mb-4">
                            <img
                                src={tenant?.logo || "/img/Proagro2.png"}
                                alt={tenant?.name || "Proagroindustria"}
                                className="h-16 object-contain"
                                onError={(e) => {
                                    e.currentTarget.src = "/img/Proagro2.png";
                                }}
                            />
                        </div>
                        <div className="text-sm text-gray-800">
                            <p className="font-bold">
                                {tenant?.name || 'Proagroindustria S.A. de C.V.'}
                            </p>
                            <p>{!tenant || tenant?.slug === 'proagro' ? 'Carretera Coatzacoalcos-villahermosa Km 5' : 'SISTEMA DE GESTIÓN LOGÍSTICA'}</p>
                            <p>{!tenant || tenant?.slug === 'proagro' ? 'interior complejo petroquimico pajaritos' : (tenant?.domain || 'VECODE.COM')}</p>
                            <p>{!tenant || tenant?.slug === 'proagro' ? 'Coatzacoalcos, Veracruz' : ''}</p>
                        </div>
                    </div>

                    <div className="w-1/2 flex flex-col items-end">
                        <div className="w-64 border border-black">
                            <div style={{ backgroundColor: tenant?.primary_color || '#15803d' }} className="text-white text-center font-bold py-1">
                                Orden de venta
                            </div>
                            <table className="w-full text-sm border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="border-r border-b border-black p-1 bg-gray-100 w-1/3">
                                            Folio:
                                        </td>
                                        <td className="border-b border-black p-1 text-center font-medium">
                                            {order.folio}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border-r border-b border-black p-1 bg-gray-100">
                                            Fecha:
                                        </td>
                                        <td className="border-b border-black p-1 text-center">
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString("es-ES")}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border-r border-b border-black p-1 bg-gray-100">
                                            No. Cliente
                                        </td>
                                        <td className="border-b border-black p-1 text-center">
                                            {order.client?.id}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border-r border-black p-1 bg-gray-100">
                                            Orden de compra:
                                        </td>
                                        <td className="p-1 text-center">
                                            {order.sale_order}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* Datos del Cliente Section */}
                <div className="mb-6">
                    <div style={{ backgroundColor: tenant?.primary_color || '#15803d' }} className="text-white text-center py-1 font-bold text-sm uppercase mb-0.5">
                        Datos del cliente
                    </div>
                    <table className="w-full border-collapse border border-black text-xs">
                        <tbody>
                            <tr>
                                <td className="w-1/4 bg-gray-100 px-3 py-2 border border-black font-normal">
                                    Nombre:
                                </td>
                                <td className="w-3/4 px-3 py-2 border border-black text-sm font-normal uppercase">
                                    {order.client?.business_name}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 px-3 py-1 border border-black font-normal">
                                    RFC:
                                </td>
                                <td className="px-3 py-1 border border-black text-xs font-normal uppercase">
                                    {order.client?.rfc || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 px-3 py-1 border border-black font-normal">
                                    Dirección:
                                </td>
                                <td className="px-3 py-1 border border-black text-[11px] font-normal uppercase leading-tight">
                                    {order.client?.address || "N/A"}
                                </td>
                            </tr>
                            <tr>
                                <td className="bg-gray-100 px-3 py-1 border border-black font-normal">
                                    Contacto:
                                </td>
                                <td className="px-3 py-1 border border-black text-xs font-normal uppercase">
                                    {order.client?.contact_info || "N/A"}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="mt-2">
                        <table className="w-full border-collapse border border-black text-xs">
                            <tbody>
                                <tr>
                                    <td className="w-1/4 bg-gray-100 px-3 py-2 border border-black font-normal">
                                        Condiciones de venta:
                                    </td>
                                    <td className="w-3/4 px-3 py-2 border border-black text-sm font-normal uppercase">
                                        {order.sale_conditions || "CONTADO"}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-gray-100 px-3 py-2 border border-black font-normal">
                                        Condiciones de entrega:
                                    </td>
                                    <td className="w-3/4 px-3 py-2 border border-black text-sm font-normal uppercase">
                                        {order.delivery_conditions ||
                                            "LAB PLANTA"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Product Table */}
                <div className="mb-6 print:mb-4">
                    <table className="w-full border-collapse border border-black text-xs uppercase font-bold">
                        <thead style={{ backgroundColor: tenant?.primary_color || '#15803d' }} className="text-white text-center">
                            <tr>
                                <th className="border border-black py-1 w-[60%]">
                                    Descripción
                                </th>
                                <th className="border border-black py-1 w-[20%]">
                                    Unidad
                                </th>
                                <th className="border border-black py-1 w-[20%]">
                                    Cantidad
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-10 text-center">
                                <td className="border border-black px-2 py-1 text-[13px] font-normal leading-tight">
                                    {order.product?.code
                                        ? `${order.product.code} - ${order.product.name}`
                                        : order.product?.name}
                                </td>
                                <td className="border border-black py-1 h-10 font-normal">
                                    TONELADAS
                                </td>
                                <td className="border border-black px-2 py-1 font-normal text-[15px]">
                                    {formatter.format(
                                        Number(order.total_quantity),
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Observations */}
                <div className="mb-10">
                    <div style={{ backgroundColor: tenant?.primary_color || '#15803d' }} className="text-white text-center py-1 font-bold text-sm uppercase mb-0.5">
                        Observaciones
                    </div>
                    <div className="border border-black min-h-[6rem] p-3 text-[13px] font-normal whitespace-pre-line">
                        {order.destination}
                    </div>
                </div>
                {/* Footer / Signatures */}
                <div className="mt-12 text-center text-sm">
                    <div className="mb-8">
                        <div className="inline-block border-t border-black px-12 pt-1 font-medium">
                            Oscar Méndez Torres
                            <div className="text-gray-600 font-normal">
                                Comercialización
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 font-bold" style={{ color: tenant?.primary_color || '#15803d' }}>
                        {!tenant || tenant?.slug === 'proagro' ? 'www.pro-agroindustria.com' : (tenant?.domain || 'VECODE.COM')}
                    </div>

                    <div className="text-xs text-gray-700 flex justify-between items-end">
                        <div className="text-left space-y-1">
                            <div>
                                {!tenant || tenant?.slug === 'proagro' ? 'Venta y cobranza:' : 'Contacto:'}
                                <span className="ml-2">
                                    {!tenant || tenant?.slug === 'proagro' ? 'oscar.mendez@pro-agroindustria.com' : `soporte@${tenant?.domain || 'vecode.com'}`}
                                </span>
                            </div>
                            {(!tenant || tenant?.slug === 'proagro') && (
                                <>
                                    <div>
                                        Asst. Adtvo.:{" "}
                                        <span className="ml-2">
                                            jorge.robles@pro-agroindustria.com
                                        </span>
                                    </div>
                                    <div>
                                        Comercialización:{" "}
                                        <span className="ml-2">
                                            ventas.comercializacion@pro-agroindustria.com
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-end">
                            {/* Small Logo Repeat */}
                            <div className="mb-2">
                                <img
                                    src={tenant?.logo || "/img/Proagro2.png"}
                                    alt="Logo"
                                    className="h-8 object-contain"
                                />
                            </div>
                            <div className="mt-2 text-right">{!tenant || tenant?.slug === 'proagro' ? 'DCM-FO-001' : 'VCD-SA-FO-001'}</div>
                        </div>
                    </div>
                </div>
                {/* Actions (Hidden on Print) */}
                <div className="mt-8 flex justify-center gap-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 font-medium"
                    >
                        Imprimir
                    </button>

                    <Link
                        href={route("sales.index")}
                        className="bg-gray-500 text-white px-6 py-2 rounded shadow hover:bg-gray-600 font-medium"
                    >
                        Volver
                    </Link>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
