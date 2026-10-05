import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, router } from "@inertiajs/react";
import {
    Scale,
    Truck,
    Save,
    Link as LinkIcon,
    AlertCircle,
    Warehouse,
    Box,
    ArrowRight,
    Search,
    Camera,
    X,
    Printer,
    Activity,
    LayoutGrid,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { QrReader } from "react-qr-reader";
import axios from "axios";
import Swal from "sweetalert2";
import { useScale } from "@/Contexts/ScaleContext";
import ReferenceDropdown from "@/Components/ReferenceDropdown";

export default function ExitMP({
    auth,
    order,
    active_scale_id = 1,
    active_lots = [],
    documenters = [],
}: {
    auth: any;
    order?: any;
    active_scale_id?: number;
    active_lots?: any[];
    documenters?: any[];
}) {
    // State for Search
    const [qrValue, setQrValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [selectedOriginId, setSelectedOriginId] = useState<number | string>("");
    const isSearchingRef = useRef(false);

    // State for Weighing
    const { weight, isConnected, connectScale, setManualWeight } = useScale();
    const [capturedWeight, setCapturedWeight] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        shipment_order_id: order?.id || "",
        weight: "", // Second Weight
        scale_id: active_scale_id, // Exit Scale
        lot_id: order?.lot_id ? order.lot_id.toString() : "",
        packaging_type: "N/A",
        warehouse: order?.is_external_warehouse 
            ? (order?.warehouse && order.warehouse !== "N/A" ? order.warehouse : "ALMACÉN CLIENTE")
            : (order?.warehouse && order.warehouse !== "N/A" ? order.warehouse : ""),
        observations: (order?.type === 'sale' ? (order?.observations || "") : ""),
        reference: order?.reference || "",
        documenter_id: "",
    });

    useEffect(() => {
        if (capturedWeight !== null) {
            setData("weight", capturedWeight.toString());
        } else {
            setData("weight", weight.toString());
        }
    }, [weight, capturedWeight]);

    // Force sync order values to form if order changes
    useEffect(() => {
        if (order) {
            setData(prev => ({
                ...prev,
                lot_id: order.lot_id ? order.lot_id.toString() : "",
                warehouse: order.is_external_warehouse 
                    ? (order.warehouse && order.warehouse !== "N/A" ? order.warehouse : "ALMACÉN CLIENTE")
                    : (order.warehouse && order.warehouse !== "N/A" ? order.warehouse : "")
            }));
        }
    }, [order?.id]);

    // --- Dynamic Envase Logic ---
    useEffect(() => {
        if (order?.presentation === 'GRANEL') {
            setData("packaging_type", "N/A");
        }
    }, [order?.presentation]);

    // Handle Errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            Swal.fire({
                icon: "error",
                title: "Atención",
                html: Object.values(errors)
                    .map((e) => `<div class="mb-1">${e}</div>`)
                    .join(""),
                confirmButtonColor: "#d33",
                confirmButtonText: "Entendido",
            });
        }
    }, [errors]);

    const handleCapture = () => {
        setCapturedWeight(weight);
    };

    // Cleanup logic handled globally by ScaleContext

    const handleSerialConnect = async () => {
        try {
            await connectScale();
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error de Conexión",
                text: error.message,
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if ((capturedWeight || 0) <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El peso de salida no puede ser 0.',
            });
            return;
        }

        // --- VALIDATION: Packaging Type for Envasado ---
        if (order?.presentation === 'ENVASADO' && data.packaging_type === 'N/A') {
            Swal.fire({
                icon: 'error',
                title: 'Envase Obligatorio',
                text: 'Para productos ENVASADOS, debe seleccionar un tipo de envase diferente a N/A.',
                confirmButtonColor: '#3085d6',
            });
            return;
        }

        post(route("scale.exit.store"));
    };

    const searchOrder = async (codeOverride?: string) => {
        const query = codeOverride || qrValue;
        if (!query || isSearchingRef.current) return;

        isSearchingRef.current = true;
        setIsLoading(true);
        if (codeOverride) setQrValue(codeOverride);

        try {
            // Use same generic search
            const response = await axios.get(route("scale.search-qr"), {
                params: { qr: query },
            });
            const res = response.data;

            if (res && res.type === "loading_order") {
                // Navigate to Exit with ID
                // We could just set state, but full page reload is safer for state reset
                router.visit(
                    route("scale.exit", res.id) +
                    `?scale_id=${active_scale_id}`,
                );
            } else {
                alert(
                    "Código no válido para Salida (debe ser una Orden activa).",
                );
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Orden no encontrada.");
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                isSearchingRef.current = false;
            }, 600);
        }
    };

    // If no order, show Search Screen
    if (!order) {
        return (
            <DashboardLayout
                user={auth.user}
                header="Báscula - Salida / Destare"
            >
                <Head title="Buscar Salida" />
                <div className="max-w-xl mx-auto py-12 px-4">
                    <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Escanear para Salida
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Escanee el QR del chofer o ingrese el folio de la
                            orden para registrar el peso de salida.
                        </p>

                        {showCamera && (
                            <div className="w-full max-w-sm mx-auto mb-6 bg-black rounded-lg overflow-hidden relative shadow-2xl animate-fade-in-down">
                                <QrReader
                                    onResult={(result: any, error) => {
                                        if (!!result) {
                                            const text =
                                                typeof result.getText ===
                                                    "function"
                                                    ? result.getText()
                                                    : result.text;
                                            if (text && !isSearchingRef.current) {
                                                setQrValue(text);
                                                setShowCamera(false);
                                                searchOrder(text);
                                            }
                                        }
                                    }}
                                    constraints={{ facingMode: "environment" }}
                                    videoStyle={{ width: "100%" }}
                                    className="w-full"
                                />
                                <p className="text-white text-center py-2 text-sm">
                                    Apunte al código QR...
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCamera(!showCamera)}
                                className={`p-3 rounded-lg border transition-colors ${showCamera ? "bg-red-100 border-red-200 text-red-600" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"}`}
                            >
                                {showCamera ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Camera className="w-6 h-6" />
                                )}
                            </button>
                            <TextInput
                                value={qrValue}
                                onChange={(e) => setQrValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        searchOrder();
                                    }
                                }}
                                className="w-full text-lg border-indigo-200 focus:border-indigo-500"
                                placeholder="QR / Folio..."
                                autoFocus={!showCamera}
                            />
                            <PrimaryButton
                                onClick={() => searchOrder()}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {isLoading ? "..." : "Buscar"}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Net Weight Calculation (Preview)
    // Always Positive logic: abs(Current - Entry)
    // FIX: Use capturedWeight if available to stabilize calculation
    const currentWeight = capturedWeight !== null ? capturedWeight : (weight > 0 ? weight : 0);
    const entryWeight = parseFloat(order.entry_weight) || 0;
    const netWeight = Math.abs(currentWeight - entryWeight);

    const isDynamicReference = order?.is_external_warehouse && order?.has_chief_foreman;

    return (
        <DashboardLayout
            user={auth.user}
            header={`Salida / Destare - ${order.folio}`}
        >
            <Head title="Salida Báscula" />

            <div className="py-8 max-w-7xl mx-auto px-4 space-y-8">
                {/* Step Indicator / Process Flow */}
                <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold shadow-lg shadow-green-200">
                            1
                        </div>
                        <span className="text-sm font-bold text-gray-500">
                            Entrada
                        </span>
                    </div>
                    <div className="h-0.5 w-12 bg-green-200"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xl shadow-indigo-200 animate-pulse">
                            2
                        </div>
                        <span className="text-base font-black text-indigo-900">
                            Salida / Destare
                        </span>
                    </div>
                    <div className="h-0.5 w-12 bg-gray-200 border-dashed border-t-2"></div>
                    <div className="flex items-center gap-2 grayscale">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center font-bold">
                            3
                        </div>
                        <span className="text-sm font-bold text-gray-400">
                            Generación de Ticket
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60"></div>

                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 rotate-3 transition-transform hover:rotate-0 duration-500">
                                <Truck className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">
                                    {order.transport_line}
                                </h1>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <span className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-900 rounded-xl text-sm font-black border border-indigo-200 shadow-sm transition-all hover:bg-indigo-100">
                                        <span className="text-[10px] text-indigo-500 mr-2 uppercase tracking-widest font-black">Chofer</span> {order.driver}
                                    </span>
                                    <span className="inline-flex items-center px-4 py-2 bg-white text-gray-900 rounded-xl text-sm font-black border border-gray-200 shadow-sm transition-all hover:border-indigo-300">
                                        <span className="text-[10px] text-gray-400 mr-2 uppercase tracking-widest font-black">P. TRACTO</span> {order.vehicle_plate}
                                    </span>
                                    <span className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-900 rounded-xl text-sm font-black border border-amber-200 shadow-sm transition-all hover:bg-amber-100">
                                        <span className="text-[10px] text-amber-500 mr-2 uppercase tracking-widest font-black">P. REMOLQUE</span> {order.trailer_plate || 'N/A'}
                                    </span>
                                    {order.economic_number && order.economic_number !== 'N/A' && (
                                        <span className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-900 rounded-xl text-sm font-black border border-blue-200 shadow-sm transition-all hover:bg-blue-100">
                                            <span className="text-[10px] text-blue-500 mr-2 uppercase tracking-widest font-black">Econo</span> {order.economic_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner min-w-[200px] justify-between items-center group">
                            <div className="text-left">
                                <span className="block text-[10px] uppercase text-gray-400 font-black tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">
                                    Folio de Orden
                                </span>
                                <span className="font-mono font-black text-2xl text-gray-800 tracking-tighter">
                                    {order.folio}
                                </span>
                            </div>
                            <div className="h-10 w-px bg-gray-200 mx-4"></div>
                            <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                    {/* LEFT: Scale */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-900 p-6 text-center relative">
                                <h2 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">
                                    Peso Bruto (Salida)
                                </h2>
                                <div className="text-6xl font-mono font-bold text-[#39ff33] tracking-tighter">
                                    {capturedWeight !== null ? capturedWeight.toFixed(2) : (weight > 0 ? weight : "0.00")}{" "}
                                    <span className="text-2xl text-gray-500">
                                        kg
                                    </span>
                                </div>
                                {auth.user?.roles?.some((r: string) =>
                                    r.toLowerCase().includes("admin"),
                                ) && (
                                        <div className="mt-2 flex justify-center">
                                            <input
                                                type="number"
                                                className="w-32 bg-gray-800 text-white border-gray-700 text-center rounded-lg text-sm disabled:opacity-50"
                                                placeholder="Manual Admin"
                                                value={weight}
                                                disabled={false}
                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                onChange={(e) =>
                                                    setManualWeight(
                                                        parseFloat(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                            <div className="bg-gray-800 p-3 text-center border-t border-gray-700 flex justify-between px-6 items-center">
                                <span className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
                                    Peso Capturado:
                                </span>
                                <span
                                    className={`text-xl font-bold font-mono ${capturedWeight !== null ? "text-yellow-400" : "text-gray-600"}`}
                                >
                                    {capturedWeight !== null
                                        ? capturedWeight.toFixed(2)
                                        : "---"}{" "}
                                    kg
                                </span>
                            </div>
                            <div className="p-4 bg-gray-50 grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleSerialConnect}
                                    type="button"
                                    disabled={capturedWeight !== null}
                                    className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${isConnected ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                                >
                                    <LinkIcon className="w-5 h-5 mr-2" />
                                    {isConnected ? "Conectado" : "Conectar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCapture}
                                    disabled={false}
                                    className={`flex items-center justify-center px-4 py-3 border rounded-xl font-bold transition-all disabled:opacity-50 ${capturedWeight !== null ? "bg-amber-100 border-amber-300 text-amber-700 font-black" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                                >
                                    <Scale className="w-5 h-5 mr-2" />{" "}
                                    {capturedWeight !== null
                                        ? "Recapturar"
                                        : "Capturar"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Box className="w-5 h-5 text-gray-400" />
                                <h3 className="font-bold text-gray-700">
                                    Cálculo de Peso
                                </h3>
                            </div>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Peso Entrada (Tara):
                                    </span>
                                    <span className="font-bold">
                                        {entryWeight} kg
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">
                                        Peso Salida (Bruto):
                                    </span>
                                    <span className="font-bold">
                                        {currentWeight} kg
                                    </span>
                                </div>
                                <div className="border-t border-gray-100 pt-2 flex justify-between text-lg text-indigo-600 font-bold">
                                    <span>Peso Neto:</span>
                                    <span>{netWeight} kg</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Details */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Warehouse Assignment Info (Read Only) - Hide for Sales */}
                        {order.type !== 'sale' && (
                            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                                <h3 className="text-lg font-bold text-blue-800 flex items-center mb-4">
                                    <Warehouse className="w-5 h-5 mr-2" />
                                    Asignación de Almacén (APT)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <span className="block text-xs uppercase text-blue-400 font-bold">
                                            Almacén
                                        </span>
                                        <div className="text-xl font-bold text-blue-900">
                                            {order.warehouse}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase text-blue-400 font-bold">
                                            Cubículo / Posición
                                        </span>
                                        <div className="text-xl font-bold text-blue-900">
                                            {order.cubicle}
                                        </div>
                                    </div>
                                </div>
                                {order.warehouse === "N/A" && !order.is_external_warehouse && (
                                    <div className="mt-4 flex items-center text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Advertencia: No se ha asignado almacén en
                                        APT. Verifique antes de dar salida.
                                    </div>
                                )}
                                {order.is_external_warehouse && (
                                    <div className="mt-4 flex items-center text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-sm">
                                        <LayoutGrid className="w-4 h-4 mr-2" />
                                        Modo Almacén Externo: Se permite destare directo sin escaneo APT.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Info */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                Detalles de la Carga
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* OE Folio — solo para Tipo Venta (PRIMERO) */}
                                {order.type === 'sale' && order.oe_folio && (
                                    <div className="md:col-span-2">
                                        <InputLabel value="No. Orden de Embarque (OE)" className="text-green-700 font-black" />
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-300 font-black text-green-900 text-lg tracking-wide">
                                            {order.oe_folio}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <InputLabel value="Cliente / Proveedor" />
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-bold text-gray-700">
                                        {order.provider}
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Producto" />
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-bold text-gray-700">
                                        {order.product}
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Peso Programado" />
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 font-bold text-blue-800">
                                        {order.programmed_weight ? `${Number(order.programmed_weight).toLocaleString()} ${order.type === 'sale' ? 'TM' : 'kg'}` : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <InputLabel value="Consignado a" />
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                                        {order.consignee || "N/A"}
                                    </div>
                                </div>

                                {/* Observaciones — solo para Tipo Venta */}
                                {order.type === 'sale' && (
                                    <div className="md:col-span-2">
                                        <InputLabel value="Observaciones" className="text-amber-700 font-black" />
                                        <textarea
                                            rows={3}
                                            value={data.observations}
                                            onChange={e => setData("observations", e.target.value)}
                                            placeholder="Agregar observaciones para el ticket..."
                                            className="w-full border-amber-300 rounded-xl shadow-sm focus:border-amber-500 focus:ring-amber-500 text-gray-700 resize-none"
                                        />
                                        {order.observations && (
                                            <p className="text-xs text-amber-600 mt-1 font-semibold">
                                                ⚠ Pre-cargado desde módulo de Salida
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* New Dropdowns */}
                                <div className="space-y-4 pt-4 border-t border-gray-100 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <InputLabel value="LOTE" className="text-indigo-600 font-black" />
                                            <select
                                                value={data.lot_id}
                                                onChange={e => {
                                                    const selectedLotId = e.target.value;
                                                    const matchingLot = active_lots.find((l: any) => l.id?.toString() === selectedLotId?.toString());
                                                    setData(prev => ({
                                                        ...prev,
                                                        lot_id: selectedLotId,
                                                        warehouse: matchingLot?.warehouse || prev.warehouse
                                                    }));
                                                }}
                                                disabled={!!order?.lot_id || order?.is_external_warehouse}
                                                className={`w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold ${(!!order?.lot_id || order?.is_external_warehouse) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'}`}
                                            >
                                                <option value="">{order?.is_external_warehouse ? 'N/A (EXTERNO)' : 'N/A'}</option>
                                                {active_lots.map((lot: any) => (
                                                    <option key={lot.id} value={lot.id?.toString()}>{lot.folio}</option>
                                                ))}
                                            </select>
                                            {(() => {
                                                const currentLot = active_lots.find((l: any) => l.id?.toString() === data.lot_id?.toString()) || (order?.lot_observations ? { observations: order.lot_observations } : null);
                                                return currentLot?.observations ? (
                                                    <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-1 mt-1">
                                                        <span className="font-bold">Obs. del Lote:</span> {currentLot.observations}
                                                    </p>
                                                ) : null;
                                            })()}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <InputLabel value="ALMACÉN" className="text-indigo-600 font-black" />
                                                {data.lot_id && (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Auto por Lote</span>
                                                )}
                                            </div>
                                            <select
                                                value={data.lot_id ? (active_lots.find((l: any) => l.id?.toString() === data.lot_id?.toString())?.warehouse || data.warehouse || "") : data.warehouse}
                                                onChange={e => setData("warehouse", e.target.value)}
                                                disabled={!!data.lot_id || order?.is_external_warehouse}
                                                className={`w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold ${(!!data.lot_id || order?.is_external_warehouse) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'}`}
                                            >
                                                <option value="">{order?.is_external_warehouse ? 'ALMACÉN CLIENTE' : 'Seleccionar Almacén...'}</option>
                                                <option value="Almacen 1">Almacen 1</option>
                                                <option value="Almacen 2">Almacen 2</option>
                                                <option value="Almacen 3">Almacen 3</option>
                                                <option value="Almacen 4">Almacen 4</option>
                                                <option value="Almacen 5">Almacen 5</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <InputLabel value="ENVASE" className="text-indigo-600 font-black" />
                                            <select
                                                value={data.packaging_type}
                                                onChange={e => setData("packaging_type", e.target.value)}
                                                disabled={order?.presentation === 'GRANEL'}
                                                className={`w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold ${order?.presentation === 'GRANEL' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                            >
                                                <option value="N/A">N/A</option>
                                                <option value="PRO-AGRO">PRO-AGRO</option>
                                                <option value="FERTINAL">FERTINAL</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <InputLabel value="DOCUMENTADOR (FIRMA)" className="text-green-600 font-black" />
                                            <select
                                                value={data.documenter_id}
                                                onChange={e => setData("documenter_id", e.target.value)}
                                                required
                                                className="w-full border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold"
                                            >
                                                <option value="">Seleccionar Documentador...</option>
                                                {documenters.map((doc: any) => (
                                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                                                * El elegido aparecerá en el ticket para firma
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                disabled={processing || weight <= 0}
                                className="group relative w-full h-20 bg-indigo-600 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
                                        <Printer className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-xl font-black text-white leading-tight">
                                            REGISTRAR Y GENERAR TICKET
                                        </span>
                                        <span className="block text-xs font-bold text-indigo-200 uppercase tracking-widest leading-none mt-0.5">
                                            Finalizar proceso de báscula
                                        </span>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform" />
                                </div>

                                {/* Button Hover Background Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>

                            <p className="text-center mt-4 text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                                Al confirmar se imprimirá el ticket
                                automáticamente
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
