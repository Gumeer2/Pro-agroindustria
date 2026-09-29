import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import { Printer } from "lucide-react";

export default function Ticket({ order }: { order: any }) {
    useEffect(() => {
        // Auto-print when loaded
        window.print();
    }, []);

    return (
        <div className="bg-white min-h-screen p-8 flex justify-center text-gray-900 font-mono text-sm leading-tight">
            <Head title={`Ticket ${order.weight_ticket?.ticket_number}`} />

            {/* Ticket Container */}
            <div className="w-[80mm] print:w-full">
                <div className="text-center mb-4 border-b pb-4 border-dashed border-gray-400">
                    <h1 className="text-xl font-bold uppercase mb-1">
                        VECODE PLANT
                    </h1>
                    <p className="text-xs">Carretera Federal 45 Km 10</p>
                    <p className="text-xs">Celaya, Guanajuato</p>
                    <p className="text-xs mt-2 font-bold">TICKET DE BÁSCULA</p>
                </div>

                <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                        <span>FOLIO TICKET:</span>
                        <span className="font-bold">
                            {order.weight_ticket?.ticket_number}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>FOLIO ORDEN:</span>
                        <span className="font-bold">{order.folio}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>FECHA:</span>
                        <span>
                            {new Date(
                                order.weight_ticket?.created_at,
                            ).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="mb-4 border-t border-b py-2 border-dashed border-gray-400 space-y-2">
                    <div>
                        <span className="block text-xs text-gray-500">
                            CLIENTE
                        </span>
                        <span className="font-bold block uppercase">
                            {order.client?.business_name}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">
                            PRODUCTO
                        </span>
                        <span className="font-bold block uppercase">
                            {order.product?.name ||
                                order.items?.[0]?.product?.name}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">
                            TRANSPORTISTA / CHOFER
                        </span>
                        <span className="block uppercase">
                            {order.transporter?.name}
                        </span>
                        <span className="block uppercase text-xs">
                            {order.driver?.name}
                        </span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">
                            UNIDAD / PLACAS
                        </span>
                        <span className="block uppercase">
                            {order.vehicle?.plate_number}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 mb-6 font-bold text-lg">
                    <div className="flex justify-between">
                        <span>TARA:</span>
                        <span>{order.weight_ticket?.tare_weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                        <span>BRUTO:</span>
                        <span>
                            {order.weight_ticket?.gross_weight || "---"} kg
                        </span>
                    </div>
                    <div className="border-t border-gray-900 pt-2 flex justify-between text-xl">
                        <span>NETO:</span>
                        <span>
                            {order.weight_ticket?.net_weight || "---"} kg
                        </span>
                    </div>
                </div>

                <div className="text-center text-xs space-y-8 mt-8">
                    <div className="border-t border-gray-400 pt-2 w-3/4 mx-auto">
                        FIRMA PESADOR
                    </div>
                    <div className="border-t border-gray-400 pt-2 w-3/4 mx-auto">
                        FIRMA OPERADOR
                    </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-gray-500">
                    <p>Este boleto ampara el peso de la carga.</p>
                    <p>VECODE v2.0 Enterprise System</p>
                </div>

                {/* No-Print UI */}
                <div className="fixed bottom-4 right-4 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all"
                    >
                        <Printer className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 1cm; }
                }
            `}</style>
        </div>
    );
}
