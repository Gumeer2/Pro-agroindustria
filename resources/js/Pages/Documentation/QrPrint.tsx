import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Search } from "lucide-react";
import axios from "axios";
import QRCode from "qrcode";

export default function QrPrint({ auth, operator: initialOperator }: { auth: any; operator?: any }) {
    // State to handle both direct mode (initialOperator) and manual search
    const [selectedOperator, setSelectedOperator] = useState<any>(initialOperator || null);

    // Search state (only used if no operator is selected)
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [qrDataUrl, setQrDataUrl] = useState("");

    // Effect for Manual Search
    useEffect(() => {
        const search = async () => {
            if (query.length > 0 && !selectedOperator) {
                try {
                    const response = await axios.get(
                        route("apt.operators.search") + `?q=${query}`,
                    );
                    setResults(response.data);
                } catch (error) {
                    console.error("Error searching operators:", error);
                }
            } else {
                setResults([]);
            }
        };

        if (!selectedOperator) {
            const timeoutId = setTimeout(() => search(), 300);
            return () => clearTimeout(timeoutId);
        }
    }, [query, selectedOperator]);

    // Effect for QR Generation
    useEffect(() => {
        if (selectedOperator) {
            // Generate QR Code with Operator ID or unique data
            const qrText = `OP ${selectedOperator.id}|${selectedOperator.operator_name}`;
            QRCode.toDataURL(qrText, { width: 300, margin: 1 }, (err, url) => {
                if (!err) setQrDataUrl(url);
            });
        }
    }, [selectedOperator]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout user={auth.user} header="Impresión de QR (Muelle)">
            <Head title="Imprimir QR - Muelle" />

            <div className="max-w-4xl mx-auto py-8 px-4 print:hidden">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={route("documentation.operators.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a Lista de Operadores
                    </Link>

                    {selectedOperator && (
                        <button
                            onClick={handlePrint}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            IMPRIMIR QR
                        </button>
                    )}
                </div>

                {!selectedOperator ? (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Buscar Operador
                        </h2>
                        <div className="relative max-w-lg mx-auto">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                                placeholder="Escriba el nombre del operador..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>

                        <div className="mt-6 space-y-2 max-w-lg mx-auto">
                            {results.map((op) => (
                                <button
                                    key={op.id}
                                    onClick={() => setSelectedOperator(op)}
                                    className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center border border-gray-100"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {op.operator_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {op.transporter_line} -{" "}
                                            {op.economic_number}
                                        </p>
                                    </div>
                                    <div className="text-indigo-600 text-sm font-medium">
                                        Seleccionar &rarr;
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
                        <div className="flex flex-col items-center">
                            <div className="w-full flex justify-between items-center mb-6">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">Vista Previa de Impresión</p>
                                {!initialOperator && (
                                    <button
                                        onClick={() => { setSelectedOperator(null); setQuery(""); }}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Buscar otro
                                    </button>
                                )}
                            </div>

                            {/* Preview Card */}
                            <div className="bg-white border-2 border-gray-200 w-full max-w-[21cm] p-12 shadow-inner rounded-lg">
                                <div className="flex justify-between items-start mb-10">
                                    <img src="/logo_pro_agro.png" alt="Logo" className="h-16 object-contain" />
                                    <div className="text-right">
                                        <h2 className="text-2xl font-black text-gray-900 leading-tight">FICHA DE<br />OPERADOR</h2>
                                        <p className="text-indigo-600 font-bold text-sm">INGRESO / MUELLE</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-12">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Nombre del Operador</p>
                                            <p className="text-xl font-black text-gray-900 uppercase leading-none">{selectedOperator.operator_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Línea Transportista</p>
                                            <p className="text-lg font-bold text-gray-800 uppercase">{selectedOperator.transporter_line}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Unidad</p>
                                            <p className="text-lg font-bold text-gray-800 uppercase">{selectedOperator.unit_type} - {selectedOperator.brand_model || 'S/M'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Número Económico</p>
                                            <p className="text-lg font-black text-indigo-600 uppercase">{selectedOperator.economic_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Placa Tracto</p>
                                            <p className="text-2xl font-black text-indigo-700 font-mono">{selectedOperator.tractor_plate}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Placa Remolque</p>
                                            <p className="text-2xl font-black text-gray-700 font-mono">{selectedOperator.trailer_plate || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    {qrDataUrl && (
                                        <div className="p-4 border-4 border-gray-900 rounded-2xl">
                                            <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 text-center">
                                    <p className="text-[10px] text-gray-300 font-mono">ID: {selectedOperator.id} | VERIFICACIÓN DE INGRESO VECODE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Printable View */}
            <div className="hidden print:block bg-white h-auto">
                {selectedOperator && (
                    <div className="max-w-[19cm] mx-auto p-4 flex flex-col items-center">
                        <div className="w-full border-2 border-gray-200 rounded-xl p-8 mb-4">
                            <div className="flex justify-between items-start mb-8">
                                <img src="/logo_pro_agro.png" alt="Logo" className="h-16 object-contain" />
                                <div className="text-right">
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">FICHA DE<br />OPERADOR</h2>
                                    <p className="text-indigo-600 font-bold text-sm">INGRESO / MUELLE</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Nombre del Operador</p>
                                        <p className="text-xl font-black text-gray-900 uppercase leading-none">{selectedOperator.operator_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Línea Transportista</p>
                                        <p className="text-lg font-bold text-gray-800 uppercase leading-tight">{selectedOperator.transporter_line}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Unidad</p>
                                        <p className="text-lg font-bold text-gray-800 uppercase leading-tight">{selectedOperator.unit_type} - {selectedOperator.brand_model || 'S/M'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Número Económico</p>
                                        <p className="text-lg font-black text-indigo-600 uppercase leading-tight">{selectedOperator.economic_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-right">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Placa Tracto</p>
                                        <p className="text-2xl font-black text-indigo-700 font-mono">{selectedOperator.tractor_plate}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Placa Remolque</p>
                                        <p className="text-2xl font-black text-gray-700 font-mono">{selectedOperator.trailer_plate || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center">
                                {qrDataUrl && (
                                    <div className="p-4 border-4 border-gray-900 rounded-2xl mb-4">
                                        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                                    </div>
                                )}
                                <p className="text-lg font-bold text-gray-900 tracking-[0.3em] uppercase">Escaneo Requerido</p>
                            </div>
                        </div>

                        <div className="w-full flex justify-between items-end border-t-2 border-dashed border-gray-300 pt-4 px-2">
                            <p className="text-[10px] font-mono text-gray-400 uppercase">Sistema VECODE | ID: {selectedOperator.id} | Ingreso</p>
                            <p className="text-[10px] font-mono text-gray-400 uppercase">{new Date().toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5cm; size: letter; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    /* Force no page breaks */
                    .max-w-\\[19cm\\] { break-inside: avoid; }
                }
            `}</style>
        </DashboardLayout>
    );
}
