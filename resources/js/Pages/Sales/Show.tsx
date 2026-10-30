import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer } from "lucide-react";
import SalesOrderTemplate from "@/Components/Print/SalesOrderTemplate";

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
    const isSalesFromDoc = context_module === "sales_from_documentation";
    const isSalesReport = context_module === "sales_report";

    const backLink = isSalesFromDoc
        ? route("sales.orders.index", { from: "documentation" })
        : isDocumentation
            ? route("documentation.orders.index")
            : isSalesReport
                ? route("sales.index", { view: "report" })
                : route("sales.orders.index");

    const backLabel = isSalesFromDoc
        ? "Volver a Órdenes de Venta"
        : isDocumentation
            ? "Volver al reporte de embarque"
            : isSalesReport
                ? "Volver al reporte de ventas"
                : "Volver al listado";

    return (
        <DashboardLayout user={auth.user} header={`Orden: ${order.folio}`}>
            <Head title={`Orden ${order.folio} - ${tenant?.name || 'VECODE'}`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none print:w-full">
                {/* Navigation Header */}
                <div className="mb-6 flex justify-between items-center print:hidden">
                    <Link
                        href={backLink}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {backLabel}
                    </Link>
                    <div className="flex items-center gap-4">
                        <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                order.status === "created"
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
                        <button
                            onClick={() => window.print()}
                            style={{ backgroundColor: tenant?.primary_color || '#15803d' }}
                            className="inline-flex items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white hover:opacity-90 transition-all font-sans uppercase tracking-widest cursor-pointer"
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir OV
                        </button>
                    </div>
                </div>

                {/* Document Print/Preview Template */}
                <SalesOrderTemplate order={order} />
            </div>

            <style>{`
                @media print {
                    @page { 
                        size: letter portrait;
                        margin: 8mm 10mm 8mm 10mm;
                    }
                    html, body { 
                        background: white !important; 
                        color: black !important;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    nav, header, footer, aside, .print\\:hidden, #sidebar, .sidebar { 
                        display: none !important; 
                    }
                    main, .min-h-screen, .flex-1 { 
                        display: block !important;
                        padding: 0 !important; 
                        margin: 0 !important; 
                        width: 100% !important;
                        min-height: auto !important;
                        max-width: none !important;
                        overflow: visible !important;
                    }
                    .sales-order-document {
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print-sheet-front { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        min-height: 252mm !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        page-break-after: always !important; 
                        break-after: page !important;
                        box-sizing: border-box !important;
                    }
                    .print-sheet-back { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        min-height: 252mm !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        page-break-before: always !important; 
                        break-before: page !important;
                        box-sizing: border-box !important;
                    }
                    .bg-\\[\\#e50019\\] { 
                        background-color: #e50019 !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    .bg-\\[\\#b3b3b3\\] { 
                        background-color: #b3b3b3 !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    .text-\\[\\#1b6e3b\\] { 
                        color: #1b6e3b !important; 
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </DashboardLayout>
    );
}
