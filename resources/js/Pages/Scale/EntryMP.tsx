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
} from "lucide-react";
import { QrReader } from "react-qr-reader";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import axios from "axios";
import Swal from "sweetalert2";
import { useScale } from "@/Contexts/ScaleContext";
import ActiveScaleIndicator from "@/Components/ActiveScaleIndicator";

export default function EntryMP({
    auth,
    active_scale_id = 1,
}: {
    auth: any;
    active_scale_id?: number;
}) {
    const { weight, isConnected, connectScale, setManualWeight } = useScale();
    const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
    const [qrValue, setQrValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const isSearchingRef = useRef(false);

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
                // Existing Loading Order (Refactored from Shipment Order)
                setData((prev) => ({
                    ...prev,
                    shipment_order_id: res.id, // Maps to LoadingOrder ID
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
            },
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Báscula - Entrada MI / MP">
            <Head title="Entrada MI / MP" />

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
                                <p className="text-white text-center py-2 text-sm">
                                    Apunte al código QR...
                                </p>
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
                                        ? "Nueva Entrada (Barco detectado)"
                                        : "Orden Existente (Precargada)"
                                    : "Esperando lectura de QR..."}
                            </p>
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
            </div>
        </DashboardLayout>
    );
}
