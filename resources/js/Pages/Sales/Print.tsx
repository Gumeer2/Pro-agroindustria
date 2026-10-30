import { Head, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import SalesOrderTemplate from "@/Components/Print/SalesOrderTemplate";

export default function Print({ order }: { order: any }) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    useEffect(() => {
        window.print();
    }, []);

    return (
        <div className="bg-white min-h-screen p-4 md:p-8 print:p-0 text-black font-sans">
            <Head title={`Orden de Venta - ${order.folio} - ${tenant?.name || 'VECODE'}`} />

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
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden { 
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
        </div>
    );
}
