import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Scale,
    Truck,
    Search,
    Save,
    Link as LinkIcon,
    Box,
    User,
    MapPin,
    Anchor,
    AlertCircle,
    FileText,
    Settings,
    Camera,
    X,
    ArrowLeft,
    Ship,
    RefreshCw,
    CheckCircle2,
    Calculator,
    Layers,
    TrendingUp,
    ChevronDown,
} from "lucide-react";
import { QrReader } from "react-qr-reader";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import axios from "axios";
import Swal from "sweetalert2";
import { useScale } from "@/Contexts/ScaleContext";
import ActiveScaleIndicator from "@/Components/ActiveScaleIndicator";

interface BurreoUnitType {
    unit_type: string;
    weighed_count: number;
    total_weight_kg: number;
    total_weight_tm: number;
    average_weight_kg: number;
    average_weight_tm: number;
    total_trips: number;
    applied_weight_tm: number | null;
    is_applied: boolean;
}

interface BurreoVesselStats {
    vessel_id: string;
    vessel_name: string;
    client_name: string;
    product_name: string;
    apt_operation_type: string;
    is_burreo: boolean;
    total_weighed: number;
    total_weight_tm: number;
    total_trips: number;
    unit_types: BurreoUnitType[];
}

export default function EntryMP({
    auth,
    active_scale_id = 1,
    burreo_vessels = [],
}: {
    auth: any;
    active_scale_id?: number;
    burreo_vessels?: BurreoVesselStats[];
}) {
    const { weight, isConnected, connectScale, setManualWeight } = useScale();
    const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
    const [qrValue, setQrValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const isSearchingRef = useRef(false);

    // Burreo Averages State
    const [burreoVesselsData, setBurreoVesselsData] = useState<BurreoVesselStats[]>(burreo_vessels || []);
    const [selectedBurreoVesselId, setSelectedBurreoVesselId] = useState<string>(
        burreo_vessels?.[0]?.vessel_id || ""
    );
    const [isRefreshingStats, setIsRefreshingStats] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        shipment_order_id: "",
        vessel_id: "",
        scale_id: active_scale_id,

        // Manual / Derived
        client_id: "",
        product_id: "",
        provider: "",
        product: "",

        withdrawal_letter: "",
        reference: "",
        consignee: "",
        destination: "",
        origin: "",
        bill_of_lading: "",

        // Transport (Snapshot)
        driver: "",
        vehicle_plate: "",
        trailer_plate: "",
        vehicle_type: "",
        transport_line: "",
        economic_number: "",

        // Scale
        tare_weight: "",
        observations: "",
        vessel_operator_id: "",
    });

    useEffect(() => {
        setData("scale_id", active_scale_id);
    }, [active_scale_id]);

    // Sync Weight to Form
    useEffect(() => {
        if (capturedWeight !== null) {
            setData("tare_weight", capturedWeight.toString());
        } else {
            setData("tare_weight", weight.toString());
        }
    }, [weight, capturedWeight]);

    // Handle folio/qr from URL for auto-search
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const folio = params.get('folio') || params.get('qr');
        if (folio) {
            searchOrder(folio);
        }
    }, []);

    // Handle Errors & Flash Messages
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

    // Cleanup logic handled globally by ScaleProvider

    const reloadBurreoStats = async (targetVesselId?: string) => {
        setIsRefreshingStats(true);
        try {
            const res = await axios.get(route("scale.burreo.averages"), {
                params: targetVesselId ? { vessel_id: targetVesselId } : {}
            });
            if (Array.isArray(res.data)) {
                setBurreoVesselsData(res.data);
                if (!selectedBurreoVesselId && res.data.length > 0) {
                    setSelectedBurreoVesselId(res.data[0].vessel_id);
                }
            } else if (res.data?.vessel_id) {
                setBurreoVesselsData(prev =>
                    prev.map(v => (v.vessel_id === res.data.vessel_id ? res.data : v))
                );
            }
        } catch (err) {
            console.error("Error refreshing burreo averages:", err);
        } finally {
            setIsRefreshingStats(false);
        }
    };

    const handleApplyAverage = async (vesselId: string, unitType?: string) => {
        if (!vesselId) return;
        setIsApplying(true);
        try {
            const res = await axios.post(route("scale.burreo.apply"), {
                vessel_id: vesselId,
                unit_type: unitType || null,
            });
            if (res.data?.success) {
                Swal.fire({
                    icon: "success",
                    title: "¡Promedio Aplicado con Éxito!",
                    text: unitType
                        ? `Se aplicó el promedio de ${res.data.average_tm} TM (${res.data.average_kg} kg) a todos los viajes de ${unitType}.`
                        : "Se calcularon y aplicaron los promedios por tipo de unidad a los viajes de este barco.",
                    confirmButtonColor: "#4f46e5",
                });
                await reloadBurreoStats(vesselId);
            } else {
                Swal.fire({
                    icon: "info",
                    title: "Información",
                    text: res.data?.message || "No se encontraron pesajes suficientes para aplicar promedio.",
                    confirmButtonColor: "#4f46e5",
                });
            }
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Error al aplicar promedio de burreo.",
                confirmButtonColor: "#d33",
            });
        } finally {
            setIsApplying(false);
        }
    };

    const handleCapture = () => {
        setCapturedWeight(weight);
    };

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

    const normalizeFolio = (text: string) => {
        if (!text) return "";
        return text.replace(/['\/?_.]/g, "-").toUpperCase().trim();
    };

    const searchOrder = async (codeOverride?: string) => {
        const query = normalizeFolio(codeOverride || qrValue);
        if (!query || isSearchingRef.current) return;

        isSearchingRef.current = true;
        setIsLoading(true);
        if (codeOverride) setQrValue(normalizeFolio(codeOverride));

        try {
            const response = await axios.get(route("scale.search-qr"), {
                params: { qr: query },
            });
            const res = response.data;
            setOrderDetails(res);

            if (res.vessel_id) {
                setSelectedBurreoVesselId(res.vessel_id);
            }

            if (res.type === "vessel_operator") {
                // New Entry from Vessel Scan
                setData((prev) => ({
                    ...prev,
                    shipment_order_id: "",
                    vessel_id: res.vessel_id,
                    client_id: res.client_id || "",
                    product_id: res.product_id || "",
                    provider: res.provider,
                    product: res.product,
                    vessel_operator_id: res.vessel_operator_id_val || "",

                    origin: res.origin || res.reference || "",
                    reference: "N/A",
                    transport_line: res.transport_line,
                    driver: res.driver,
                    vehicle_type: res.vehicle_type,
                    vehicle_plate: res.vehicle_plate,
                    trailer_plate: res.trailer_plate,
                    economic_number: res.economic_number,

                    withdrawal_letter: "",
                    consignee: "",
                    destination: "",
                    bill_of_lading: "",
                }));
            } else {
                // Existing Loading Order
                setData((prev) => ({
                    ...prev,
                    shipment_order_id: res.id,
                    provider: res.provider || "",
                    driver: res.driver || "",
                    product: res.product,
                    origin: res.origin,
                    transport_line: res.transporter,
                    vehicle_plate: res.vehicle_plate,
                    trailer_plate: res.trailer_plate,
                    vehicle_type: res.vehicle_type,

                    withdrawal_letter: res.withdrawal_letter || "",
                    reference: res.reference || "",
                    consignee: res.consignee || "",
                    destination: res.destination || "",
                    bill_of_lading: res.carta_porte || "",
                }));
            }
        } catch (error: any) {
            console.error("Search error:", error);
            const errorMessage =
                error.response?.data?.error || "No encontrado.";

            Swal.fire({
                icon: "warning",
                title: "Operación Restringida",
                text: errorMessage,
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "Entendido",
            });

            setOrderDetails(null);
            setQrValue("");
            reset();
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                isSearchingRef.current = false;
            }, 600);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((capturedWeight || 0) <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El peso capturado no puede ser 0. Por favor, capture el peso correctamente.',
            });
            return;
        }

        if (!data.bill_of_lading) {
            Swal.fire({
                icon: "warning",
                title: "Campo Requerido",
                text: "Por favor, ingrese la Carta Porte.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }
        if (!data.driver) {
            alert("Faltan datos de conductor.");
            return;
        }
        post(route("scale.entry.store"), {
            onSuccess: () => {
                reset();
                setOrderDetails(null);
                setQrValue("");
                reloadBurreoStats(data.vessel_id);
            },
        });
    };

    const activeVesselStat =
        burreoVesselsData.find((v) => v.vessel_id === selectedBurreoVesselId) ||
        burreoVesselsData[0];

    return (
        <DashboardLayout user={auth.user} header="Báscula - Carga y descarga de barco">
            <Head title="Carga y descarga de barco" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("scale.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al Panel
                    </Link>
                </div>

                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="p-3 bg-indigo-700/50 rounded-xl mr-4 shadow-inner backdrop-blur-sm">
                                <Scale className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-2xl">
                                    Nueva Entrada de Báscula
                                </h2>
                                <p className="text-indigo-200 text-sm">
                                    Registre el pesaje inicial del vehículo
                                </p>
                            </div>
                        </div>

                        {/* Scale Indicator */}
                        <ActiveScaleIndicator 
                            scaleId={active_scale_id} 
                            className="bg-indigo-900/50 border-indigo-700/50"
                        />
                    </div>

                    {/* Search Section */}
                    <div className="p-6 bg-white border-b border-gray-100">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Búsqueda Rápida
                                </label>
                                <div className="flex gap-2">
                                    {/* Camera Toggle */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCamera(!showCamera)
                                        }
                                        className={`p-2.5 rounded-lg border transition-colors ${showCamera ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                                        title={
                                            showCamera
                                                ? "Cerrar Cámara"
                                                : "Abrir Cámara"
                                        }
                                    >
                                        {showCamera ? (
                                            <X className="w-5 h-5" />
                                        ) : (
                                            <Camera className="w-5 h-5" />
                                        )}
                                    </button>

                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={qrValue}
                                            onChange={(e) =>
                                                setQrValue(normalizeFolio(e.target.value))
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    searchOrder();
                                                }
                                            }}
                                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="Escanee QR o ingrese Folio..."
                                            autoFocus={!showCamera}
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Search
                                                className="h-5 w-5 text-gray-400"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    </div>
                                    <PrimaryButton
                                        onClick={() => searchOrder()}
                                        disabled={isLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 h-full"
                                    >
                                        {isLoading ? "..." : "Buscar"}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>

                        {/* Camera View */}
                        {showCamera && (
                            <div className="w-full max-w-sm mx-auto mt-4 bg-black rounded-lg overflow-hidden relative shadow-2xl animate-fade-in-down">
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
                            </div>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                >
                    {/* LEFT COLUMN: Weight & Connection (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Weight Display Card */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gray-900 p-8 text-center relative">
                                <h2 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">
                                    Peso Bruto (Entrada)
                                </h2>
                                <div className="text-6xl font-mono font-bold text-[#39ff33] tracking-tighter drop-shadow-[0_0_10px_rgba(57,255,51,0.5)]">
                                    {weight > 0 ? weight : "0.00"}{" "}
                                    <span className="text-2xl text-gray-500">
                                        kg
                                    </span>
                                </div>
                                {auth.user?.roles?.some((r: string) =>
                                    r.toLowerCase().includes("admin"),
                                ) && (
                                        <div className="mt-4 flex justify-center">
                                            <input
                                                type="number"
                                                className="w-32 bg-gray-800 text-white border-gray-700 text-center rounded-lg text-sm focus:ring-green-500 focus:border-green-500 disabled:opacity-50"
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
                                <span className="text-gray-400 text-xs uppercase font-semibold">
                                    Peso Capturado:
                                </span>
                                <span
                                    className={`text-xl font-bold font-mono ${capturedWeight ? "text-yellow-400" : "text-gray-600"}`}
                                >
                                    {capturedWeight
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
                                    className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${isConnected ? "bg-green-100 text-green-700 border border-green-200" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"}`}
                                >
                                    <LinkIcon className="w-5 h-5 mr-2" />
                                    {isConnected ? "Conectado" : "Conectar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCapture}
                                    disabled={false}
                                    className={`flex items-center justify-center px-4 py-3 border rounded-xl font-bold hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 ${capturedWeight ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-white text-gray-700 border-gray-200"}`}
                                >
                                    <Scale className="w-5 h-5 mr-2" />
                                    {capturedWeight ? "Recapturar" : "Capturar"}
                                </button>
                            </div>
                        </div>

                        {/* Status Card */}
                        <div
                            className={`rounded-2xl p-6 border shadow-sm ${orderDetails ? (orderDetails.type === "vessel_operator" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200") : "bg-gray-50 border-gray-200"}`}
                        >
                            <h3 className="font-bold text-gray-800 flex items-center mb-2">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Estado del Registro
                            </h3>
                            <p className="text-sm text-gray-600">
                                {orderDetails
                                    ? orderDetails.type === "vessel_operator"
                                        ? orderDetails.is_burreo
                                            ? `Muestreo de Burreo: ${orderDetails.reference || "Barco"} (${orderDetails.vehicle_type || "Unidad"}). Su pesaje actualizará el promedio de ${orderDetails.vehicle_type}.`
                                            : "Nueva Entrada (Barco detectado)"
                                        : "Orden Existente (Precargada)"
                                    : "Esperando lectura de QR..."}
                            </p>
                            {orderDetails?.burreo_avg_weight_tm && (
                                <div className="mt-3 pt-2 border-t border-blue-200 flex items-center justify-between text-xs">
                                    <span className="text-blue-800 font-semibold">Promedio actual {orderDetails.vehicle_type}:</span>
                                    <span className="font-mono font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                                        {orderDetails.burreo_avg_weight_tm} TM
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <PrimaryButton
                                disabled={
                                    processing ||
                                    (!data.shipment_order_id && !data.vessel_id)
                                }
                                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-xl transform transition hover:scale-[1.01] flex justify-center items-center rounded-xl"
                            >
                                <Save className="w-6 h-6 mr-2" />
                                GUARDAR ENTRADA
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Form Fields (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* 1. Origen y Documentación */}
                        <div className="p-8 border-b border-gray-100">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Anchor className="w-5 h-5 mr-3" />
                                Origen y Documentación
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Proveedor / Cliente{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.provider || ""}
                                        onChange={(e) =>
                                            setData("provider", e.target.value)
                                        }
                                        readOnly={!!data.client_id}
                                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 ${data.client_id ? "bg-gray-50 text-gray-500" : ""}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Producto{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.product || ""}
                                        onChange={(e) =>
                                            setData("product", e.target.value)
                                        }
                                        readOnly={!!data.product_id}
                                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 ${data.product_id ? "bg-gray-50 text-gray-500" : ""}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Origen
                                    </label>
                                    <input
                                        type="text"
                                        value={data.origin}
                                        onChange={(e) =>
                                            setData("origin", e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Carta Porte{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.bill_of_lading}
                                        onChange={(e) =>
                                            setData(
                                                "bill_of_lading",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                        placeholder=""
                                    />
                                </div>
                                {/* Conditionally hide reference for Special Vessels (Chief Foreman + External Warehouse) */}
                                {!(orderDetails?.has_chief_foreman && orderDetails?.is_external_warehouse) && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Referencia
                                        </label>
                                        <input
                                            type="text"
                                            value={data.reference}
                                            onChange={(e) =>
                                                setData("reference", e.target.value)
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Transporte (Read Only mostly) */}
                        <div className="p-8 border-b border-gray-100">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Truck className="w-5 h-5 mr-3" />
                                Transporte (QR)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner mb-6">
                                {/* Top Row: Line and Full Operator */}
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">
                                        Línea
                                    </span>
                                    <span className="font-black text-gray-900 text-lg block leading-tight text-center md:text-left" title={data.transport_line}>
                                        {data.transport_line || "-"}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">
                                        Operador
                                    </span>
                                    <span className="font-black text-gray-900 text-lg block leading-tight text-center md:text-left break-words" title={data.driver}>
                                        {data.driver || "-"}
                                    </span>
                                </div>

                                {/* Bottom Row: Plates and Economic */}
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-amber-200/50">
                                    <div className="space-y-1">
                                        <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">
                                            P. TRACTO
                                        </span>
                                        <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">
                                            {data.vehicle_plate || "-"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">
                                            P. REMOLQUE
                                        </span>
                                        <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">
                                            {data.trailer_plate || "-"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">
                                            No. Económico
                                        </span>
                                        <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">
                                            {data.economic_number || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Báscula (Simplified) */}
                        <div className="p-8">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Scale className="w-5 h-5 mr-3" />
                                Datos de Pesaje
                            </h4>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Observaciones
                                    </label>
                                    <input
                                        type="text"
                                        value={data.observations}
                                        onChange={(e) =>
                                            setData(
                                                "observations",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                        placeholder="Comentarios adicionales..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Separador Visual Amplio */}
                <div className="pt-16 pb-8">
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                        <div className="flex-shrink mx-6 flex items-center gap-2.5 bg-indigo-50 text-indigo-900 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest border border-indigo-200 shadow-sm">
                            <Ship className="w-4 h-4 text-indigo-600" />
                            <span>Promedios por Tipo de Unidad • Solo Burreo</span>
                        </div>
                        <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                    </div>
                </div>

                {/* DEDICATED PANEL: Promedios por Tipo de Unidad (Solo Burreo) */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-16">
                    <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                <Calculator className="w-8 h-8 text-emerald-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl md:text-2xl font-black tracking-tight">
                                        Promedios por Tipo de Unidad
                                    </h3>
                                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                                        Solo Burreo
                                    </span>
                                </div>
                                <p className="text-emerald-100/80 text-sm mt-0.5">
                                    Pesaje de unidades por barco, cálculo del promedio por tipo de unidad y aplicación a todos los viajes del mismo tipo
                                </p>
                            </div>
                        </div>

                        {/* Controls & Vessel Selector */}
                        <div className="flex flex-wrap items-center gap-3">
                            {burreoVesselsData.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedBurreoVesselId}
                                        onChange={(e) => setSelectedBurreoVesselId(e.target.value)}
                                        className="bg-white/10 border border-white/30 text-white text-sm font-bold rounded-xl px-4 py-2.5 pr-8 focus:ring-emerald-400 focus:border-emerald-400 backdrop-blur-md"
                                    >
                                        {burreoVesselsData.map((bv) => (
                                            <option key={bv.vessel_id} value={bv.vessel_id} className="text-gray-900">
                                                🚢 {bv.vessel_name} ({bv.product_name})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => reloadBurreoStats(selectedBurreoVesselId)}
                                disabled={isRefreshingStats}
                                className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white transition disabled:opacity-50 flex items-center gap-1 text-sm font-semibold"
                                title="Actualizar estadísticas"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshingStats ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Actualizar</span>
                            </button>

                            {activeVesselStat && (
                                <button
                                    type="button"
                                    onClick={() => handleApplyAverage(activeVesselStat.vessel_id)}
                                    disabled={isApplying || activeVesselStat.total_weighed === 0}
                                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Recalcular y Aplicar Todo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 md:p-8">
                        {!activeVesselStat ? (
                            <div className="text-center py-12 text-gray-500">
                                <Ship className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-lg font-bold">No hay barcos activos en modalidad Burreo</p>
                                <p className="text-sm text-gray-400">Cuando un buque se configure en operación de Burreo, sus estadísticas y tipos de unidad aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Vessel Summary Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                                            <Ship className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Barco Activo</span>
                                            <span className="font-extrabold text-gray-900 text-base">{activeVesselStat.vessel_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                            <Scale className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Muestreo en Báscula</span>
                                            <span className="font-extrabold text-gray-900 text-base">
                                                {activeVesselStat.total_weighed} unidades ({activeVesselStat.total_weight_tm.toFixed(2)} TM)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Viajes de Burreo</span>
                                            <span className="font-extrabold text-gray-900 text-base">
                                                {activeVesselStat.total_trips} vueltas registradas
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Unit Types Table */}
                                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-black uppercase tracking-wider">
                                                <th className="px-6 py-4">Tipo de Unidad</th>
                                                <th className="px-6 py-4 text-center">Pesajes en Báscula</th>
                                                <th className="px-6 py-4 text-center">Total Pesado (TM)</th>
                                                <th className="px-6 py-4 text-center">Promedio Calculado</th>
                                                <th className="px-6 py-4 text-center">Viajes Burreo</th>
                                                <th className="px-6 py-4 text-center">Estado de Aplicación</th>
                                                <th className="px-6 py-4 text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {activeVesselStat.unit_types.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-400 italic">
                                                        No hay tipos de unidad registrados para este barco.
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeVesselStat.unit_types.map((ut) => {
                                                    const hasWeighed = ut.weighed_count > 0;
                                                    return (
                                                        <tr key={ut.unit_type} className="hover:bg-indigo-50/50 transition">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold">
                                                                        <Truck className="w-4 h-4" />
                                                                    </div>
                                                                    <span className="font-black text-gray-900 text-base">
                                                                        {ut.unit_type}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${hasWeighed ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                                                                    {ut.weighed_count} {ut.weighed_count === 1 ? "pesaje" : "pesajes"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center font-mono font-bold text-gray-700">
                                                                {hasWeighed ? `${ut.total_weight_tm.toFixed(2)} TM` : "---"}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {hasWeighed ? (
                                                                    <div className="inline-flex flex-col items-center">
                                                                        <span className="font-mono font-black text-lg text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                                                                            {ut.average_weight_tm.toFixed(3)} TM
                                                                        </span>
                                                                        <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                                            ({ut.average_weight_kg.toLocaleString("es-MX")} kg)
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 italic text-sm">
                                                                        Pendiente de pesaje
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="font-mono font-bold text-gray-800">
                                                                    {ut.total_trips} vueltas
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                {ut.is_applied ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                        Aplicado ({ut.applied_weight_tm?.toFixed(3)} TM)
                                                                    </span>
                                                                ) : hasWeighed ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                                                        Actualización disponible
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        Sin datos
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApplyAverage(activeVesselStat.vessel_id, ut.unit_type)}
                                                                    disabled={!hasWeighed || isApplying}
                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                                                    title={`Aplicar ${ut.average_weight_tm} TM a todos los viajes de ${ut.unit_type}`}
                                                                >
                                                                    Aplicar a {ut.unit_type}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
