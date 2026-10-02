import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Scale,
    Search,
    Save,
    Link as LinkIcon,
    AlertCircle,
    Settings,
    ArrowLeft,
    FileText,
    Truck,
    Anchor,
    Camera,
    X,
    MapPin
} from "lucide-react";
import { QrReader } from "react-qr-reader";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import axios from "axios";
import Swal from "sweetalert2";
import { useScale } from "@/Contexts/ScaleContext";
import ActiveScaleIndicator from "@/Components/ActiveScaleIndicator";

export default function EntrySale({
    auth,
    active_scale_id = 1,
    pending_shipment_orders = [],
}: {
    auth: any;
    active_scale_id?: number;
    pending_shipment_orders?: { id: string; folio: string; operator_name?: string }[];
}) {
    const { weight, isConnected, connectScale, setManualWeight } = useScale();
    const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
    const [folioQuery, setFolioQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [showCamera, setShowCamera] = useState(false);
    const isSearchingRef = useRef(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        shipment_order_id: "", // Maps to LoadingOrder ID
        scale_id: active_scale_id,

        // Snapshot / Display Fields (Read Only)
        provider: "",
        product: "",
        driver: "",
        vehicle_plate: "",
        trailer_plate: "",
        transport_line: "",
        economic_number: "",
        origin: "",
        reference: "",
        consignee: "",
        destination: "",
        bill_of_lading: "", // Carta Porte

        // Scale
        tare_weight: "", // Represents the "First Weight" (Empty/Vacío) for Sales
        observations: "",
        programmed_weight: "",
        product_id: "",
        exit_operator_id: "",
        // Full Support
        unit_type: "",
        companion_shipment_order_id: "",
        full_part: "", // 'primera' | 'segunda'
    });
 
    const [isFull, setIsFull] = useState(false);
    const [lockedFull, setLockedFull] = useState(false);

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

    // Handle folio from URL for auto-search
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const folio = params.get('folio');
        if (folio) {
            searchOrder(folio);
        }
    }, []);

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
            });
        }
    }, [errors]);

    // Cleanup logic removed - handled by ScaleContext

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
        // Replace common scanner-misinterpreted keys with hyphens
        // ' / ? _ . etc based on common layout shifts
        return text.replace(/['\/?_.]/g, "-").toUpperCase().trim();
    };

    const searchOrder = async (folioOverride?: string) => {
        const query = normalizeFolio(folioOverride || folioQuery);
        if (!query || isSearchingRef.current) return;

        isSearchingRef.current = true;
        setIsLoading(true);
        if (folioOverride) setFolioQuery(folioOverride);

        try {
            const response = await axios.get(route("scale.search-folio"), {
                params: { folio: query },
            });
            const res = response.data;
            setOrderDetails(res);

            // Populate Form
            setData((prev) => ({
                ...prev,
                shipment_order_id: res.id,
                provider: res.provider || "N/A",
                product: res.product || "N/A",
                driver: res.driver || "N/A",
                vehicle_plate: res.vehicle_plate || "N/A",
                trailer_plate: res.trailer_plate || "N/A",
                transport_line: res.transport_line || "N/A",
                origin: res.origin || "N/A",
                reference: res.reference || "",
                consignee: res.consignee || "",
                destination: res.destination || "",
                bill_of_lading: res.bill_of_lading || "",
                programmed_weight: res.programmed_weight,
                economic_number: res.economic_number,
                product_id: res.product_id || "",
                exit_operator_id: res.exit_operator_id || "",
                unit_type: res.unit_type || "",
                // Reset/Set Full info if found in backend
                full_part: res.linked_full_info ? (res.linked_full_info.full_part === 'primera' ? 'segunda' : 'primera') : "",
                companion_shipment_order_id: res.linked_full_info ? res.linked_full_info.shipment_order_id : "",
            }));

            // Check if it is a Full unit
            const unitType = (res.unit_type || "").toUpperCase();
            const startsWithFull = unitType.includes("FULL");
            setIsFull(startsWithFull);
            setLockedFull(!!res.linked_full_info);

            Swal.fire({
                icon: "success",
                title: "Orden Encontrada",
                text: `Folio: ${res.folio} - ${res.driver}`,
                timer: 1500,
                showConfirmButton: false,
            });

        } catch (error: any) {
            console.error("Search error:", error);
            const errorMessage =
                error.response?.data?.error || "Orden no encontrada.";

            Swal.fire({
                icon: "warning",
                title: "Búsqueda Fallida",
                text: errorMessage,
                confirmButtonColor: "#4f46e5",
            });

            setOrderDetails(null);
            reset("shipment_order_id", "provider", "product", "driver", "vehicle_plate");
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                isSearchingRef.current = false;
            }, 600);
        }
    };

    // Automatic Observations for Full Units
    useEffect(() => {
        if (isFull && data.full_part && orderDetails) {
            const partText = data.full_part.toUpperCase();
            const unitType = (data.unit_type || "FULL").toUpperCase();
            
            // Find companion folio for better observation (kept for label logic if needed elsewhere, 
            // but removed from observations as requested)
            const newFullText = `${unitType} ${partText} PARTE`;
            const currentObs = data.observations;

            // Regex to match existing Full info: "FULL (PRIMERA|SEGUNDA) PARTE( (OE DE (PRIMERA|SEGUNDA) PARTE|COMPAÑERA): ...))?"
            const fullPattern = new RegExp(`${unitType} (PRIMERA|SEGUNDA) PARTE( \\((OE DE (PRIMERA|SEGUNDA) PARTE|COMPAÑERA): [^)]*\\))?(\\s*-\\s*)?`, "i");
            
            // If it already contains EXACTLY what we want, don't trigger update
            if (currentObs.includes(newFullText)) return;

            // Otherwise, replace existing pattern or prepend
            if (fullPattern.test(currentObs)) {
                // Remove existing pattern and leading/trailing spaces or dash
                const cleanObs = currentObs.replace(fullPattern, "").trim();
                setData("observations", cleanObs ? `${newFullText} - ${cleanObs}` : newFullText);
            } else {
                // Prepend to current observations
                setData("observations", currentObs ? `${newFullText} - ${currentObs}` : newFullText);
            }
        }
    }, [isFull, data.full_part, data.companion_shipment_order_id, data.unit_type, orderDetails]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.shipment_order_id) {
            Swal.fire({
                icon: "warning",
                title: "Orden Requerida",
                text: "Por favor busque y seleccione una orden por Folio.",
            });
            return;
        }

        if ((capturedWeight || 0) <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El peso capturado no puede ser 0.',
            });
            return;
        }

        post(route("scale.entry.store"), {
            onSuccess: () => {
                reset();
                setOrderDetails(null);
                setFolioQuery("");
                setCapturedWeight(null);
            },
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Báscula - Entrada Carga (Vacío)">
            <Head title="Entrada Carga" />

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
                    <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-700/50 rounded-xl mr-4 shadow-inner backdrop-blur-sm">
                                <Scale className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-2xl">
                                    Entrada Carga (Vacío)
                                </h2>
                                <p className="text-blue-200 text-sm">
                                    Identificación por Folio de Orden de Embarque (OE)
                                </p>
                            </div>
                        </div>

                        {/* Scale Indicator */}
                        <ActiveScaleIndicator 
                            scaleId={active_scale_id} 
                            className="bg-blue-900/50 border-blue-700/50"
                        />
                    </div>

                    {/* Search Section */}
                    <div className="p-6 bg-white border-b border-gray-100">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full max-w-2xl">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Buscar por Folio de Orden (OE)
                                </label>
                                <div className="flex gap-2">
                                    {/* Camera Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowCamera(!showCamera)}
                                        className={`p-2.5 rounded-lg border transition-colors ${showCamera ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                                        title={showCamera ? "Cerrar Cámara" : "Abrir Cámara"}
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
                                            list="pending-oes"
                                            value={folioQuery}
                                            onChange={(e) => {
                                                const val = normalizeFolio(e.target.value);
                                                setFolioQuery(val);
                                                // Automatic search if selected from list
                                                if (pending_shipment_orders.some(oe => oe.folio.toUpperCase() === val.toUpperCase())) {
                                                    searchOrder(val);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    searchOrder();
                                                }
                                            }}
                                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 font-mono text-lg"
                                            placeholder="Ej: 00123"
                                            autoFocus
                                        />
                                        <datalist id="pending-oes">
                                            {pending_shipment_orders.map((oe) => (
                                                 <option key={oe.id} value={oe.folio} />
                                            ))}
                                        </datalist>
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
                                        className="bg-blue-600 hover:bg-blue-700 h-full px-6"
                                    >
                                        {isLoading ? "..." : "Buscar Orden"}
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
                                            const text = typeof result.getText === "function" ? result.getText() : result.text;
                                            if (text && !isSearchingRef.current) {
                                                setFolioQuery(text);
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
                                    Apunte al código QR de la OE...
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
                                    Peso Tara (Entrada)
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
                                    className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 ${isConnected ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"}`}
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
                            className={`rounded-2xl p-6 border shadow-sm ${orderDetails ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                        >
                            <h3 className="font-bold text-gray-800 flex items-center mb-2">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Estado del Registro
                            </h3>
                            <p className="text-sm text-gray-600">
                                {orderDetails
                                    ? `Orden ${orderDetails.folio} lista para pesar Tara.`
                                    : "Ingrese un Folio para comenzar."}
                            </p>
                        </div>

                        <div className="pt-2">
                            <PrimaryButton
                                disabled={
                                    processing ||
                                    !data.shipment_order_id ||
                                    !capturedWeight ||
                                    capturedWeight <= 0
                                }
                                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 shadow-xl transform transition hover:scale-[1.01] flex justify-center items-center rounded-xl"
                            >
                                <Save className="w-6 h-6 mr-2" />
                                GUARDAR TARA
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Info (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        {/* 1. Información General */}
                        <div className="p-8 border-b border-gray-100">
                            <h4 className="text-blue-800 font-bold mb-6 flex items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <FileText className="w-5 h-5 mr-3" />
                                Información de la Orden ({orderDetails?.folio || "---"})
                            </h4>

                            {!orderDetails && (
                                <div className="text-center py-12 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Busque una orden por folio para ver sus detalles</p>
                                </div>
                            )}

                            {orderDetails && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Cliente Destino" className="mb-2" />
                                            <TextInput
                                                value={data.provider}
                                                readOnly
                                                className="w-full bg-gray-50 text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Producto" className="mb-2" />
                                            <TextInput
                                                value={data.product}
                                                readOnly
                                                className="w-full bg-gray-50 text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Carta Porte" className="mb-2" />
                                            <TextInput
                                                value={data.bill_of_lading}
                                                readOnly
                                                className="w-full bg-gray-50 text-gray-600"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Peso Programado" className="mb-2" />
                                            <div className="text-xl font-bold text-blue-900 p-2.5 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                                                {orderDetails?.programmed_weight ? `${orderDetails.programmed_weight} TM` : "N/A"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-6">
                                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center">
                                            <Truck className="w-4 h-4 mr-2" />
                                            Transporte Asignado
                                            {data.unit_type && (
                                                <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px]">
                                                    {data.unit_type}
                                                </span>
                                            )}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 bg-amber-50 rounded-2xl border border-amber-100 shadow-inner">
                                            {/* Top Row: Line and Full Operator */}
                                            <div className="space-y-1">
                                                <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">Línea</span>
                                                <span className="font-black text-gray-900 text-lg block leading-tight text-center md:text-left" title={data.transport_line}>{data.transport_line}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">Operador</span>
                                                <span className="font-black text-gray-900 text-lg block leading-tight text-center md:text-left break-words">{data.driver}</span>
                                            </div>

                                            {/* Bottom Row: Plates and Economic */}
                                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-amber-200/50">
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">P. TRACTO</span>
                                                    <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">{data.vehicle_plate}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">P. REMOLQUE</span>
                                                    <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">{data.trailer_plate || "N/A"}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] text-amber-600 uppercase font-black tracking-widest text-center md:text-left">No. Económico</span>
                                                    <span className="font-mono font-black text-gray-900 text-xl block leading-tight text-center md:text-left">{data.economic_number || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Full Unit Options Section */}
                                        {isFull && (
                                            <div className="mt-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner animate-fade-in">
                                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center">
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    Configuración de Unidad Full
                                                    {lockedFull && (
                                                        <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                            Vínculo Detectado Automáticamente
                                                        </span>
                                                    )}
                                                </h4>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Part Selector */}
                                                    <div className="space-y-2">
                                                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Parte de la Unidad</span>
                                                        <div className="flex gap-4">
                                                            {['primera', 'segunda'].map((part) => (
                                                                <label key={part} className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${data.full_part === part ? 'border-indigo-600 bg-indigo-100 text-indigo-900 font-bold' : 'border-gray-200 bg-white text-gray-400 hover:border-indigo-200'} ${lockedFull ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                    <input 
                                                                        type="radio" 
                                                                        name="full_part" 
                                                                        value={part} 
                                                                        checked={data.full_part === part}
                                                                        onChange={(e) => !lockedFull && setData('full_part', e.target.value)}
                                                                        disabled={lockedFull}
                                                                        className="hidden" 
                                                                    />
                                                                    {part === 'primera' ? 'Primera Parte' : 'Segunda Parte'}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Companion OE Selector */}
                                                    <div className="space-y-2">
                                                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">OE de {data.full_part === 'primera' ? 'Segunda' : 'Primera'} Parte (Doble Remolque)</span>
                                                        <select
                                                            value={data.companion_shipment_order_id || ""}
                                                            onChange={(e) => !lockedFull && setData("companion_shipment_order_id", e.target.value)}
                                                            disabled={lockedFull}
                                                            className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold text-gray-700 ${lockedFull ? 'bg-gray-100' : 'bg-white'}`}
                                                        >
                                                            <option value="">Seleccionar OE de {data.full_part === 'primera' ? 'Segunda' : 'Primera'} Parte...</option>
                                                            {pending_shipment_orders
                                                                .filter(oe => oe.id !== data.shipment_order_id && (
                                                                    oe.operator_name && data.driver && 
                                                                    oe.operator_name.toUpperCase().includes(data.driver.split(' ')[0].toUpperCase())
                                                                ))
                                                                .map((oe) => (
                                                                    <option key={oe.id} value={oe.id}>
                                                                        OE: {oe.folio} - {oe.operator_name}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <p className="text-[10px] text-gray-400 italic">Filtrado por nombre de operador</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Observaciones */}
                        <div className="p-8">
                            <h4 className="text-blue-800 font-bold mb-4 flex items-center bg-blue-50 p-2 rounded-lg border border-blue-100 text-sm">
                                <Settings className="w-4 h-4 mr-2" />
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
                                            setData("observations", e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
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
