import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, ChevronRight } from "lucide-react";

export default function Show({
    auth,
    order,
    context_module,
}: {
    auth: any;
    order: any;
    context_module?: string;
}) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    const isDocumentation = context_module === "documentation";
    const isSalesReport = context_module === "sales_report";

    const backLink = isDocumentation
        ? route("documentation.orders.index")
        : isSalesReport
            ? route("sales.index", { view: "report" })
            : route("sales.orders.index");

    const backLabel = isDocumentation
        ? "Volver al reporte de embarque"
        : isSalesReport
            ? "Volver al reporte de ventas"
            : "Volver al listado";

    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    return (
        <DashboardLayout user={auth.user} header={`Orden: ${order.folio}`}>
            <Head title={`Orden ${order.folio} - ${tenant?.name || 'VECODE'}`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Navigation Header */}
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <Link
                        href={backLink}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {backLabel}
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            style={{ backgroundColor: tenant?.primary_color || '#4f46e5' }}
                            className="inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white hover:opacity-90 transition-all font-sans uppercase tracking-widest"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir OV
                        </button>
                    </div>
                </div>

                {/* Print Preview Container */}
                <div className="bg-white shadow-2xl rounded-sm border border-gray-300 overflow-hidden max-w-[21.5cm] mx-auto overflow-x-auto mb-10 print:mb-0 print:border-none print:shadow-none">
                    <div className="p-8 md:p-10 print:p-4 text-black font-sans min-w-[19cm] print:w-full print:min-w-0">
                        {/* Header Section */}
                        <div className="flex justify-between items-start mb-8 print:mb-4">
                            <div className="flex flex-col">
                                <img
                                    src={tenant?.logo || "/images/logovecode.png"}
                                    alt={tenant?.name || "Logo"}
                                    className="h-16 w-auto object-contain mb-2 self-start"
                                    onError={(e) => {
                                        e.currentTarget.src = "/img/Proagro2.png";
                                    }}
                                />
                                <div className="text-[11px] leading-tight text-gray-700">
                                    <p className="font-bold text-black text-[13px]">
                                        {tenant?.name || 'Proagroindustria S.A. de C.V.'}
                                    </p>
                                    <p>
                                        {tenant?.slug === 'proagro' ? 'Carretera Coatzacoalcos-villahermosa Km 5' : 'SISTEMA DE GESTIÓN LOGÍSTICA'}
                                    </p>
                                    <p>
                                        {tenant?.slug === 'proagro' ? 'interior complejo petroquimico pajaritos' : (tenant?.domain || 'VECODE.COM')}
                                    </p>
                                    <p>{tenant?.slug === 'proagro' ? 'Coatzacoalcos, Veracruz' : ''}</p>
                                </div>
                            </div>

                            <div className="w-72">
                                <div style={{ backgroundColor: tenant?.primary_color || '#6b7280' }} className="text-white text-center py-1 font-bold text-sm uppercase tracking-wide">
                                    Orden de venta
                                </div>
                                <table className="w-full border-collapse border border-black text-xs">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black px-2 py-1 bg-gray-100 font-medium w-1/3">
                                                Folio:
                                            </td>
                                            <td className="border border-black px-2 py-1 font-bold text-[13px]">
                                                {order.folio}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 bg-gray-100 font-medium">
                                                Fecha:
                                            </td>
                                            <td className="border border-black px-2 py-1 text-gray-700">
                                                {new Date(
                                                    order.created_at,
                                                ).toLocaleDateString("es-MX")}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 bg-gray-100 font-medium">
                                                No. Cliente:
                                            </td>
                                            <td className="border border-black px-2 py-1 font-bold text-[13px]">
                                                {order.client?.id}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 bg-gray-100 font-medium">
                                                Orden de compra:
                                            </td>
                                            <td className="border border-black px-2 py-1 font-bold text-[13px] uppercase">
                                                {order.sale_order}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div className="mt-2 text-right">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${order.status === "created"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : order.status === "closed"
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : "bg-green-50 text-green-700 border-green-200"
                                            }`}
                                    >
                                        {order.status === "created"
                                            ? "ABIERTA"
                                            : order.status === "closed"
                                                ? "CERRADA"
                                                : order.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Datos del Cliente Section */}
                        <div className="mb-6 print:mb-4">
                            <div style={{ backgroundColor: tenant?.primary_color || '#6b7280' }} className="text-white text-center py-1 font-bold text-sm uppercase mb-0.5">
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
                                            {order.client?.contact_info ||
                                                "N/A"}
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
                                                {order.sale_conditions ||
                                                    "CONTADO"}
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
                                <thead style={{ backgroundColor: tenant?.primary_color || '#6b7280' }} className="text-white text-center">
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
                                        <td className="border border-black px-2 py-1 text-[13px] font-normal">
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

                        {/* Observations Section */}
                        <div className="mb-10 print:mb-4">
                            <div style={{ backgroundColor: tenant?.primary_color || '#6b7280' }} className="text-white text-center py-1 font-bold text-sm uppercase mb-0.5">
                                Observaciones
                            </div>
                            <div className="border border-black min-h-[6rem] p-3 text-[13px] font-normal whitespace-pre-line">
                                {order.destination || "..."}
                            </div>
                        </div>

                        {/* Signatures & Footer Section */}
                        <div className="mt-20 print:mt-8">
                            <div className="flex flex-col items-center mb-16 print:mb-8">
                                <div className="w-64 border-b border-black mb-1"></div>
                                <p className="text-sm font-medium">
                                    Oscar Méndez Torres
                                </p>
                                <p className="text-[12px] text-gray-500">
                                    Comercialización
                                </p>
                            </div>

                            <div className="text-center mb-8 print:mb-4">
                                <p className="font-bold text-[13px]" style={{ color: tenant?.primary_color || '#312e81' }}>
                                    {tenant?.slug === 'proagro' ? 'www.pro-agroindustria.com' : (tenant?.domain || 'VECODE.COM')}
                                </p>
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-100 pt-6 print:pt-4">
                                <div className="text-[10px] text-gray-500 space-y-0.5">
                                    <p>
                                        <span className="font-bold text-black">
                                            {tenant?.slug === 'proagro' ? 'Venta y cobranza:' : 'Contacto:'}
                                        </span>{" "}
                                        {tenant?.slug === 'proagro' ? 'oscar.mendez@pro-agroindustria.com' : `soporte@${tenant?.domain || 'vecode.com'}`}
                                    </p>
                                    {tenant?.slug === 'proagro' && (
                                        <>
                                            <p>
                                                <span className="font-bold text-black">
                                                    Asst. Adtvo.:
                                                </span>{" "}
                                                jorge.robles@pro-agroindustria.com
                                            </p>
                                            <p>
                                                <span className="font-bold text-black">
                                                    Comercialización:
                                                </span>{" "}
                                                ventas.comercializacion@pro-agroindustria.com
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <img
                                        src={tenant?.logo || "/images/logovecode.png"}
                                        alt="Logo"
                                        className="h-8 opacity-50 mb-1"
                                    />
                                    <p className="text-[10px] text-gray-400 font-mono italic">
                                        {tenant?.slug === 'proagro' ? 'DCM-FO-001' : 'VCD-SA-FO-001'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section removed as requested */}
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body { background: white !important; }
                    nav, header, footer, .print\\:hidden { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .max-w-[21.5cm] { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                    }
                    .bg-gray-500 { background-color: #6b7280 !important; -webkit-print-color-adjust: exact; }
                    .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </DashboardLayout>
    );
}
