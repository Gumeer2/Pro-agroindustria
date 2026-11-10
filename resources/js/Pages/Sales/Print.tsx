import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import SalesOrderTemplate from "@/Components/Print/SalesOrderTemplate";
import { ArrowLeft, Printer } from "lucide-react";
import Swal from "sweetalert2";

export default function Print({ order }: { order: any }) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    useEffect(() => {
        // Close any active SweetAlert modal and clean up body classes immediately
        try {
            Swal.close();
            document.body.classList.remove("swal2-shown", "swal2-height-auto");
            document.querySelectorAll(".swal2-container").forEach((el) => el.remove());
        } catch (e) {
            // Ignore if Swal is not present
        }

        // Delay print slightly to ensure DOM, base64 images and Tailwind styles are fully rendered
        const printTimer = setTimeout(() => {
            window.print();
        }, 600);

        return () => clearTimeout(printTimer);
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8 print:p-0 print:bg-white text-black font-sans">
            <Head title={`Orden de Venta - ${order.folio} - ${tenant?.name || 'VECODE'}`} />

            {/* Screen-only floating toolbar */}
            <div className="no-print print:hidden max-w-5xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <Link
                    href={route("sales.orders.index")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Órdenes de Venta
                </Link>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.folio}
                    </span>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        style={{ backgroundColor: tenant?.primary_color || "#15803d" }}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg hover:opacity-90 transition shadow-sm cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Formato
                    </button>
                </div>
            </div>

            {/* Document Template */}
            <div className="max-w-5xl mx-auto print:max-w-none print:m-0 print:p-0 print:w-full">
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
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    body.swal2-shown {
                        overflow: visible !important;
                    }
                    .swal2-container,
                    .swal2-backdrop-show,
                    .swal2-popup,
                    .no-print,
                    .print\\:hidden,
                    nav,
                    header,
                    footer,
                    aside { 
                        display: none !important; 
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
                        display: block !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        page-break-after: always !important; 
                        break-after: page !important;
                        box-sizing: border-box !important;
                    }
                    .print-sheet-back { 
                        width: 100% !important; 
                        max-width: 100% !important; 
                        min-width: 0 !important;
                        display: block !important;
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
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
        </div>
    );
}
