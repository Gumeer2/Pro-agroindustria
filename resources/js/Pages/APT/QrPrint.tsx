import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Search, Printer } from "lucide-react";
import axios from "axios";
import QRCode from "qrcode";

export default function QrPrint({ auth }: { auth: any }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<any>(null);
    const [qrDataUrl, setQrDataUrl] = useState("");

    useEffect(() => {
        const search = async () => {
            if (query.length > 2) {
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

        const timeoutId = setTimeout(() => search(), 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        if (selectedOperator) {
            // Generate QR Code with Operator ID or unique data
            const qrText = `OP ${selectedOperator.id}|${selectedOperator.operator_name}`;
            QRCode.toDataURL(qrText, { width: 200, margin: 1 }, (err, url) => {
                if (!err) setQrDataUrl(url);
            });
        }
    }, [selectedOperator]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <DashboardLayout user={auth.user} header="Impresión de QR (APT)">
            <Head title="Imprimir QR - APT" />

            {/* Non-printable search area */}
            <div className="max-w-4xl mx-auto print:hidden">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href={new URLSearchParams(window.location.search).get("from") === "production" ? route("apt.production") : route("apt.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {new URLSearchParams(window.location.search).get("from") === "production" ? "Volver al menú de submódulos" : "Volver a APT"}
                    </Link>
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
                                    onClick={() =>
                                        op.is_active && setSelectedOperator(op)
                                    }
                                    disabled={!op.is_active}
                                    className={`w-full text-left p-4 rounded-lg bg-gray-50 transition-colors flex justify-between items-center border border-gray-100 ${
                                        !op.is_active
                                            ? "opacity-60 cursor-not-allowed"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-900 flex items-center">
                                            {op.operator_name}
                                            {!op.is_active && (
                                                <span className="ml-2 px-2 py-0.5 text-[10px] bg-gray-200 text-gray-600 rounded-full font-bold uppercase">
                                                    Zarpado / Archivado
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {op.transporter_line} -{" "}
                                            {op.economic_number}
                                        </p>
                                    </div>
                                    <div
                                        className={`text-sm font-medium ${!op.is_active ? "text-gray-400" : "text-indigo-600"}`}
                                    >
                                        {!op.is_active
                                            ? "No disponible"
                                            : "Seleccionar \u2192"}
                                    </div>
                                </button>
                            ))}
                            {query.length > 2 && results.length === 0 && (
                                <p className="text-center text-gray-500 py-4">
                                    No se encontraron operadores.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="mb-6 flex justify-between items-center">
                            <button
                                onClick={() => setSelectedOperator(null)}
                                className="text-gray-500 hover:text-gray-900 font-medium"
                            >
                                &larr; Buscar otro
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow-md transition-all"
                            >
                                <Printer className="w-5 h-5 mr-2" />
                                Imprimir
                            </button>
                        </div>

                        <div className="items-center justify-center flex flex-col bg-gray-100 p-8 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-4 text-sm font-medium uppercase tracking-wide">
                                Vista Previa
                            </p>
                            {/* Card Container for Preview */}
                            <div className="bg-white w-[8.5in] min-h-[500px] shadow-2xl p-16 relative">
                                {" "}
                                {/* Approx letter width scale */}
                                {/* Header Logo */}
                                <div className="mb-8">
                                    <img
                                        src="/logo_pro_agro.png"
                                        alt="Pro Agroindustria"
                                        className="h-20 object-contain"
                                    />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-8 font-sans">
                                    Datos de Unidad
                                </h1>
                                <div className="space-y-6 text-lg font-serif">
                                    <p className="tracking-wide">
                                        <span className="font-bold">
                                            ECONOMICO:
                                        </span>{" "}
                                        {selectedOperator.economic_number}
                                    </p>
                                    <p className="tracking-wide">
                                        <span className="font-bold">
                                            TIPO DE UNIDAD:
                                        </span>{" "}
                                        {selectedOperator.unit_type.toUpperCase()}
                                    </p>
                                    {/* Modelo mocked as not in DB yet */}
                                    {/* <p className="tracking-wide"><span className="font-bold">MODELO:</span> 2015</p> */}
                                    <p className="tracking-wide">
                                        <span className="font-bold">
                                            PLACA:
                                        </span>{" "}
                                        {selectedOperator.tractor_plate}
                                    </p>
                                    <p className="tracking-wide">
                                        <span className="font-bold">
                                            LINEA TRANSPORTISTA:
                                        </span>{" "}
                                        {selectedOperator.transporter_line}
                                    </p>
                                    <p className="tracking-wide">
                                        <span className="font-bold">
                                            NOMBRE DEL OPERADOR:
                                        </span>{" "}
                                        {selectedOperator.operator_name}
                                    </p>
                                </div>
                                <div className="mt-16 flex justify-center">
                                    {qrDataUrl && (
                                        <img
                                            src={qrDataUrl}
                                            alt="QR Code"
                                            className="w-64 h-64"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Printable Area - Only visible when printing */}
            <div className="hidden print:block fixed inset-0 bg-white z-50 p-12">
                {selectedOperator && (
                    <div className="max-w-[21cm] mx-auto">
                        <div className="mb-8">
                            <img
                                src="/logo_pro_agro.png"
                                alt="Pro Agroindustria"
                                className="h-24 object-contain"
                            />
                        </div>

                        <h1 className="text-4xl font-bold text-black mb-10 font-sans">
                            Datos de Unidad
                        </h1>

                        <div className="space-y-6 text-xl font-serif text-black">
                            <p>
                                <span className="font-bold">ECONOMICO:</span>{" "}
                                {selectedOperator.economic_number}
                            </p>
                            <p>
                                <span className="font-bold">
                                    TIPO DE UNIDAD:
                                </span>{" "}
                                {selectedOperator.unit_type.toUpperCase()}
                            </p>
                            <p>
                                <span className="font-bold">PLACA:</span>{" "}
                                {selectedOperator.tractor_plate}
                            </p>
                            <p>
                                <span className="font-bold">
                                    LINEA TRANSPORTISTA:
                                </span>{" "}
                                {selectedOperator.transporter_line}
                            </p>
                            <p>
                                <span className="font-bold">
                                    NOMBRE DEL OPERADOR:
                                </span>{" "}
                                {selectedOperator.operator_name}
                            </p>
                        </div>

                        <div className="mt-20 flex justify-center">
                            {qrDataUrl && (
                                <img
                                    src={qrDataUrl}
                                    alt="QR Code"
                                    className="w-80 h-80"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0.5cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </DashboardLayout>
    );
}
