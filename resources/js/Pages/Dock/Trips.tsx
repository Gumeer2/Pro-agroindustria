import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
    QrCode,
    ArrowLeft,
    Save,
    Search,
    Scan,
    Camera,
    X,
    AlertTriangle,
    CheckCircle,
    Anchor,
    Trash2,
    Calendar,
    Ship,
    Navigation,
    Truck
} from "lucide-react";
import axios from "axios";
import { pickBy } from "lodash";
import { QrReader } from "react-qr-reader";
import Swal from "sweetalert2";
import Pagination from "@/Components/Pagination";

export default function Trips({
    auth,
    recentTrips,
    vessels = [],
    filters = { date: "", vessel_id: "" },
}: {
    auth: any;
    recentTrips: {
        data: any[];
        links: any[];
        from: number;
        to: number;
        total: number;
    };
    vessels?: any[];
    filters?: { date?: string; vessel_id?: string };
}) {
    const [scanInput, setScanInput] = useState("");
    const [isScanning, setIsScanning] = useState(true);
    const [scanResult, setScanResult] = useState<any>(null);
    const [showCamera, setShowCamera] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter State
    const [dateFilter, setDateFilter] = useState(filters.date || "");
    const [vesselFilter, setVesselFilter] = useState(filters.vessel_id || "");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const handleFilterChange = (newFilters: any) => {
        const mergedFilters = pickBy({
            ...filters,
            ...newFilters,
        });
        router.get(route("dock.trips.index"), mergedFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const { data, setData, post, processing, reset, errors, clearErrors } =
        useForm({
            vessel_id: "",
            vessel_operator_id: "",
            hold_number: "",
            operation_type: "Descarga", // Default to Descarga
            notes: "",
        });

    // Keep focus on input
    useEffect(() => {
        if (
            isScanning &&
            !showCamera &&
            !deletingId &&
            inputRef.current
        ) {
            inputRef.current.focus();
        }
    }, [isScanning, scanResult, showCamera, deletingId]);

    const handleCodeFound = async (code: string) => {
        if (!code) return;
        const cleanCode = code.trim();
        try {
            const response = await axios.get(route("dock.trips.search"), {
                params: { qr: cleanCode },
            });
            if (response.data) {

                setScanResult(response.data);
                setData((d: any) => ({
                    ...d,
                    vessel_id: response.data.vessel.id,
                    vessel_operator_id: response.data.id,
                    operation_type: response.data.vessel.operation_type === 'Carga' ? 'Carga' : 'Descarga'
                }));

                setIsScanning(false);
                setShowCamera(false);
                setScanInput("");
                clearErrors();
            }
        } catch (error: any) {
            console.error("Search Error:", error);
            const errorMessage =
                error.response?.data?.error ||
                "Código no encontrado o formato inválido.";

            Swal.fire({
                icon: "warning",
                title: "Operación Restringida",
                text: errorMessage,
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "Entendido",
            });

            if (!showCamera) setScanInput("");
        }
    };

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        handleCodeFound(scanInput);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("dock.trips.store"), {
            onSuccess: () => {
                reset();
                setScanResult(null);
                setIsScanning(true);
                Swal.fire({
                    icon: 'success',
                    title: '¡Viaje Registrado!',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            },
        });
    };

    const confirmDelete = (id: number) => {
        Swal.fire({
            title: '¿Eliminar Registro?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result: any) => {
            if (result.isConfirmed) {
                router.delete(route("dock.trips.destroy", id));
            }
        });
    };

    const cancelScan = () => {
        setScanResult(null);
        setScanInput("");
        setIsScanning(true);
        setShowCamera(false);
        reset();
    };

    return (
        <DashboardLayout user={auth.user} header="Muelle - Carga y Descarga">
            <Head title="Carga/Descarga Barco" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <Link
                    href={route("dock.index")}
                    className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Volver al menú
                </Link>
            </div>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Errors Display */}
                {Object.keys(errors).length > 0 && (
                    <div
                        className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300"
                        role="alert"
                    >
                        <div className="flex items-center mb-1">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            <p className="font-black uppercase text-xs tracking-widest">Error en el Registro</p>
                        </div>
                        <ul className="list-disc pl-5 text-sm font-medium">
                            {Object.values(errors).map((err: any, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Scanner Input Area */}
                {!scanResult ? (
                    <div className="bg-white rounded-2xl shadow-xl p-10 mb-8 text-center border-b-4 border-indigo-600 transition-all duration-300">
                        <div className="mb-6">
                            <div className="bg-indigo-50 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-0 transition-transform shadow-inner">
                                <Scan className="w-14 h-14 text-indigo-600" />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                Escanear Operador de Barco
                            </h2>
                            <p className="text-gray-500 mt-2 font-medium max-w-sm mx-auto">
                                Escanee el código QR de la ficha del operador para registrar una vuelta de carga o descarga.
                            </p>
                        </div>

                        {showCamera ? (
                            <div className="max-w-sm mx-auto mb-8 relative bg-black rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                                <button
                                    onClick={() => setShowCamera(false)}
                                    className="absolute top-4 right-4 z-10 bg-white shadow-lg p-2 rounded-full text-gray-800 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <QrReader
                                    onResult={(result: any, error: any) => {
                                        if (!!result) {
                                            const text = typeof result.getText === "function" ? result.getText() : result.text;
                                            handleCodeFound(text);
                                        }
                                    }}
                                    constraints={{ facingMode: "environment" }}
                                    videoStyle={{ width: "100%" }}
                                    className="w-full"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 backdrop-blur-sm py-2">
                                    <p className="text-white text-center text-xs font-bold uppercase tracking-widest">
                                        Detectado Código...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center mb-8">
                                <button
                                    onClick={() => setShowCamera(true)}
                                    className="group flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
                                >
                                    <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-lg">Activar Cámara</span>
                                </button>
                            </div>
                        )}

                        {!showCamera && (
                            <form
                                onSubmit={handleScan}
                                className="max-w-md mx-auto"
                            >
                                <div className="relative group">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={scanInput}
                                        onChange={(e) => setScanInput(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 text-xl font-bold transition-all placeholder:text-gray-300"
                                        placeholder="Escanee o escriba código..."
                                        autoComplete="off"
                                    />
                                    <QrCode className="w-6 h-6 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-600 transition-colors" />
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    /* Trip Registration Form */
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-8 py-6 flex justify-between items-center text-white">
                            <div className="flex items-center space-x-4">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                    <Truck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl tracking-tight leading-none uppercase">Registro de Viaje</h3>
                                    <p className="text-indigo-200 text-xs font-bold mt-1 tracking-widest">VALIDACIÓN DE OPERADOR</p>
                                </div>
                            </div>
                            <button
                                onClick={cancelScan}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors font-bold flex items-center gap-2 border border-white/20"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Left: Operator Details */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Detalles del Operador</h4>

                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                                            <span className="block text-[8px] font-black text-indigo-400 uppercase mb-1">Nombre Completo</span>
                                            <div className="text-xl font-black text-indigo-900 leading-tight">
                                                {scanResult.name}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">No. Económico</span>
                                                <div className="font-bold text-gray-800">{scanResult.economic_number}</div>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Placas Tracto</span>
                                                <div className="font-bold text-gray-800 font-mono tracking-tighter">{scanResult.tractor_plate}</div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Línea Transportista</span>
                                            <div className="font-bold text-gray-800">{scanResult.transporter_line}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center">
                                        <Anchor className="w-3 h-3 mr-1" /> Barco Vinculado
                                    </h4>
                                    <div className="text-lg font-black text-indigo-900 mb-1">{scanResult.vessel.name}</div>
                                    <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">
                                        Operación: {scanResult.vessel.operation_type}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Registration Form */}
                            <div className="lg:col-span-2">
                                <form onSubmit={submitForm} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Operation Type Display */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Tipo de Movimiento</label>
                                            <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 ${data.operation_type === 'Carga'
                                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                {data.operation_type === 'Carga' ? <Ship className="w-6 h-6" /> : <Navigation className="w-6 h-6" />}
                                                <div>
                                                    <span className="block text-xl font-black uppercase tracking-tight">{data.operation_type}</span>
                                                    <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Definido por registro de barco</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hold Selection */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Bodega Seleccionada</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {scanResult.vessel.holds && scanResult.vessel.holds.length > 0 ? (
                                                    scanResult.vessel.holds.map((h: any) => (
                                                        <button
                                                            key={h.hold_number}
                                                            type="button"
                                                            onClick={() => setData('hold_number', h.hold_number)}
                                                            className={`py-3 rounded-xl text-lg font-black transition-all border-2 ${data.hold_number === h.hold_number
                                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                                                                : 'border-gray-100 bg-white text-gray-400 hover:border-indigo-200 hover:text-indigo-400'}`}
                                                        >
                                                            {h.hold_number}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="col-span-3 text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        No hay bodegas definidas para este barco.
                                                    </div>
                                                )}
                                            </div>
                                            {errors.hold_number && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.hold_number}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">Notas u Observaciones (Opcional)</label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded-2xl border-2 border-gray-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all p-4 font-medium"
                                            placeholder="Detalles adicionales del viaje..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            disabled={processing || !data.hold_number}
                                            className="w-full group relative overflow-hidden bg-indigo-600 disabled:bg-gray-300 py-5 rounded-3xl text-white font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 disabled:hover:bg-gray-300"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-3">
                                                <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                                <span>{processing ? 'PROCESANDO...' : 'REGISTRAR VUELTA'}</span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                        </button>
                                        {!data.hold_number && (
                                            <p className="text-center text-amber-500 text-[10px] font-black mt-4 uppercase tracking-[0.2em]">
                                                Debe seleccionar una bodega antes de continuar
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Trips History */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-12">
                    <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-xl">
                                <Calendar className="w-6 h-6 text-gray-600" />
                            </div>
                            <h3 className="font-black text-xl text-gray-900 tracking-tight leading-none uppercase">Historial de Operación</h3>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    handleFilterChange({ date: e.target.value });
                                }}
                                className="rounded-xl border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-bold px-4"
                            />
                            <select
                                value={vesselFilter}
                                onChange={(e) => {
                                    setVesselFilter(e.target.value);
                                    handleFilterChange({ vessel_id: e.target.value });
                                }}
                                className="rounded-xl border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-bold px-4"
                            >
                                <option value="">Todos los Barcos</option>
                                {vessels.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Hora</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Operador</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Barco / Bodega</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Movimiento</th>
                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Peso (Prom.)</th>
                                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {recentTrips.data.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-900">
                                                {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400">{new Date(trip.start_time).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                                                    <Truck className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-black text-gray-900">{trip.operator?.operator_name || "Operador Desconocido"}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Eco: {trip.operator?.economic_number || "N/A"} | {trip.operator?.tractor_plate || "N/A"}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-800">{trip.vessel?.name || "Sin Barco"}</div>
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 uppercase">
                                                Bodega {trip.hold_number || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest ${trip.operation_type === 'Carga'
                                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                {trip.operation_type === 'Carga' ? <Ship className="w-3 h-3 mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
                                                {trip.operation_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right">
                                            {trip.weight ? (
                                                <div className="text-sm font-black text-indigo-900">{Math.round(parseFloat(trip.weight))} <span className="text-[10px] text-indigo-400">TM</span></div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => confirmDelete(trip.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {recentTrips.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-gray-100 p-4 rounded-3xl mb-4 text-gray-300">
                                                    <Navigation className="w-12 h-12" />
                                                </div>
                                                <p className="text-gray-500 font-black text-lg uppercase tracking-widest">No hay registros hoy</p>
                                                <p className="text-gray-400 text-sm mt-1">Escanee un operador para comenzar la operación.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {recentTrips.total > 50 && (
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Pagination links={recentTrips.links} />
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
