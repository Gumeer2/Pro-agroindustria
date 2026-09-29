import { Head } from "@inertiajs/react";
import { useEffect } from "react";
import { Printer, Truck, MapPin, Box } from "lucide-react";

export default function BillOfLading({ order }: { order: any }) {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <div className="bg-white min-h-screen p-8 text-gray-900 font-sans text-sm">
            <Head title={`Carta Porte ${order.folio}`} />

            {/* Document Container (Letter Size Approx) */}
            <div className="max-w-[216mm] mx-auto border border-gray-300 p-8 print:border-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider">
                            Carta Porte
                        </h1>
                        <p className="text-gray-500 text-xs mt-1">
                            Autotransporte Federal de Carga
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="bg-gray-100 p-2 rounded border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase">
                                Folio
                            </p>
                            <p className="text-xl font-mono font-bold text-red-600">
                                {order.folio}
                            </p>
                        </div>
                        <p className="text-xs mt-2">
                            Fecha: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Origin / Shipper */}
                    <div className="border p-4 rounded-lg">
                        <h3 className="font-bold text-gray-700 border-b pb-2 mb-2 flex items-center uppercase text-xs tracking-wide">
                            <MapPin className="w-3 h-3 mr-1" /> Origen /
                            Remitente
                        </h3>
                        <p className="font-bold text-lg">VECODE PLANT</p>
                        <p>Carretera Federal 45 Km 10</p>
                        <p>Celaya, Guanajuato, CP 38000</p>
                        <p className="text-xs text-gray-500 mt-2">
                            RFC: VEC-900101-000
                        </p>
                    </div>

                    {/* Destination / Consignee */}
                    <div className="border p-4 rounded-lg">
                        <h3 className="font-bold text-gray-700 border-b pb-2 mb-2 flex items-center uppercase text-xs tracking-wide">
                            <MapPin className="w-3 h-3 mr-1" /> Destino /
                            Destinatario
                        </h3>
                        <p className="font-bold text-lg">
                            {order.client?.business_name}
                        </p>
                        <p>{order.client?.address || "Domicilio Conocido"}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            RFC: {order.client?.rfc}
                        </p>
                    </div>
                </div>

                {/* Transport Info */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-700 border-b border-gray-300 pb-2 mb-4 flex items-center uppercase text-xs tracking-wide">
                        <Truck className="w-3 h-3 mr-1" /> Figura de Transporte
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">
                                Transportista
                            </p>
                            <p className="font-bold">
                                {order.transporter?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">
                                Operador
                            </p>
                            <p className="font-bold">{order.driver?.name}</p>
                            <p className="text-xs">
                                {order.driver?.license_number}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">
                                Vehículo
                            </p>
                            <p className="font-bold">
                                {order.vehicle?.plate_number}
                            </p>
                            <p className="text-xs">{order.vehicle?.type}</p>
                        </div>
                    </div>
                </div>

                {/* Merchandise */}
                <div className="mb-8">
                    <h3 className="font-bold text-gray-700 border-b-2 border-gray-800 pb-2 mb-4 flex items-center uppercase text-xs tracking-wide">
                        <Box className="w-3 h-3 mr-1" /> Mercancías
                    </h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-xs uppercase text-gray-600 border-b border-gray-300">
                                <th className="p-2">Código</th>
                                <th className="p-2">Descripción</th>
                                <th className="p-2">Embalaje</th>
                                <th className="p-2 text-right">Peso Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item: any, idx: number) => (
                                <tr
                                    key={idx}
                                    className="border-b border-gray-100"
                                >
                                    <td className="p-2 font-mono text-xs">
                                        {item.product?.code}
                                    </td>
                                    <td className="p-2 font-bold">
                                        {item.product?.name}
                                    </td>
                                    <td className="p-2">
                                        {item.packaging_type}
                                    </td>
                                    <td className="p-2 text-right font-mono text-lg">
                                        {/* Show weighed net if available, else requested */}
                                        {order.weight_ticket?.net_weight
                                            ? `${order.weight_ticket.net_weight} kg`
                                            : `${item.requested_quantity * 1000} kg (Est.)`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 mt-16">
                    <div className="border-t border-gray-400 pt-2 text-center text-xs text-gray-500">
                        <p className="font-bold mb-1">AUTORIZA SALIDA</p>
                        <p>Nombre y Firma</p>
                    </div>
                    <div className="border-t border-gray-400 pt-2 text-center text-xs text-gray-500">
                        <p className="font-bold mb-1">RECIBE DE CONFORMIDAD</p>
                        <p>Nombre y Firma</p>
                    </div>
                </div>

                <div className="mt-12 text-center text-[10px] text-gray-400">
                    <p>
                        Este documento es una representación impresa de un CFDI
                        de Traslado (Demo VECODE).
                    </p>
                    <p>
                        La reproducción no autorizada de este comprobante
                        constituye un delito en los términos de las
                        disposiciones fiscales.
                    </p>
                </div>
            </div>

            {/* Print Button (Hidden on Print) */}
            <div className="fixed bottom-4 right-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all"
                >
                    <Printer className="w-6 h-6" />
                </button>
            </div>

            <style>{`
                @media print {
                    @page { margin: 1cm; size: letter; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
}
