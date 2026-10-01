import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
    Scan,
    User,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Search,
    History,
    FileText,
    LogOut,
    AlertTriangle,
    Camera,
    Trash2,
    ShieldAlert,
    ArrowLeft
} from "lucide-react";
import Modal from "@/Components/Modal";
import axios from "axios";
import Swal from "sweetalert2";
import { QrReader } from "react-qr-reader";

export default function Access({
    auth,
    pending_logs = [],
    in_plant_count = 0,
    history
}: {
    auth: any;
    pending_logs: any[];
    in_plant_count?: number;
    history: any;
}) {
    const [activeTab, setActiveTab] = useState<"scan" | "order_entry" | "pending" | "history">("scan");
    const [pendingLogs, setPendingLogs] = useState<any[]>(pending_logs);
    const [qrInput, setQrInput] = useState("");
    const [viewingLog, setViewingLog] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState("all");

    // Pending Reason Modal
    const [pendingReasonModal, setPendingReasonModal] = useState<any>(null);
    const [pendingReason, setPendingReason] = useState("");

    // Order Selection Modal (linking at scan time)
    const [orderSelectionModal, setOrderSelectionModal] = useState<{ logId: number; orders: any[] } | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    // Order Entry Tab States
    const [orderScanInput, setOrderScanInput] = useState("");
    const [orderScanLoading, setOrderScanLoading] = useState(false);
    const [scannedOrderData, setScannedOrderData] = useState<any>(null);
    const [scannedSubjectData, setScannedSubjectData] = useState<any>(null);
    const [orderAvailableOrders, setOrderAvailableOrders] = useState<any[]>([]);
    const [selectedAdditionalOrderIds, setSelectedAdditionalOrderIds] = useState<string[]>([]);
    const [isOrderInPlant, setIsOrderInPlant] = useState(false);
    const [activeOrderLog, setActiveOrderLog] = useState<any>(null);
    const [orderEntryNotes, setOrderEntryNotes] = useState("");
    const [isAuthorizingOrderEntry, setIsAuthorizingOrderEntry] = useState(false);
    const [showOrderCamera, setShowOrderCamera] = useState(false);
    const orderInputRef = useRef<HTMLInputElement>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const [showCamera, setShowCamera] = useState(false);

    // Auto-focus logic for scanner
    useEffect(() => {
        if (activeTab === "scan" && !showCamera) {
            inputRef.current?.focus();
        }
        if (activeTab === "order_entry" && !showOrderCamera) {
            orderInputRef.current?.focus();
        }
    }, [activeTab, showCamera, showOrderCamera]);

    const processScan = async (code: string) => {
        if (!code) return;

        try {
            const response = await axios.post(route("surveillance.scan"), { qr: code });
            const data = response.data;

            // Add to pending list
            setPendingLogs((currentLogs) => [
                { ...data.log, subject: data.subject, shipment_orders: [] },
                ...currentLogs,
            ]);
            setActiveTab("pending");

            // If ExitOperator has available orders, show selection modal
            if (data.available_orders && data.available_orders.length > 0) {
                setOrderSelectionModal({ logId: data.log.id, orders: data.available_orders });
                setSelectedOrderIds([]);
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Escaneado",
                    text: data.message || "Operador agregado a pendientes.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            }

            setQrInput("");
            setShowCamera(false);
        } catch (error: any) {
            console.error("Scan Error Details:", error);
            const errorMessage = error.response?.data?.error || "Error de conexión o código inválido";

            Swal.fire({
                icon: "error",
                title: "Error de Escaneo",
                html: `<p class="text-lg">${errorMessage}</p><p class="text-xs text-gray-400 mt-2">Intento: ${code}</p>`,
                timer: 4000,
                showConfirmButton: true,
            });

            setQrInput("");
        }
    };

    const handleManualScan = (e: React.FormEvent) => {
        e.preventDefault();
        processScan(qrInput);
    };

    const handleCameraScan = (result: any, error: any) => {
        if (!!result) {
            processScan(result?.text);
            setShowCamera(false);
        }
    };

    // ==========================================
    // ENTRADA DE EMBARQUES: SCAN & AUTHORIZATION
    // ==========================================
    const processOrderScan = async (code: string) => {
        if (!code || !code.trim()) return;
        setOrderScanLoading(true);

        try {
            const response = await axios.post(route("surveillance.scan-order"), { code: code.trim() });
            const data = response.data;

            setOrderScanInput("");
            setShowOrderCamera(false);

            Swal.fire({
                icon: "success",
                title: "¡Entrada Registrada!",
                text: data.message || `Operador ${data.subject?.name || data.order?.operator_name} ingresó a planta.`,
                timer: 1500,
                showConfirmButton: false,
            });

            // Redirect automatically to Salidas de Operadores
            router.visit(route("surveillance.exits.index"));
        } catch (error: any) {
            console.error("Order Scan Error:", error);
            const errorMessage = error.response?.data?.error || "No se encontró la orden de embarque o el código es inválido";

            Swal.fire({
                icon: "error",
                title: "Error al Escanear Orden",
                html: `<p class="text-base">${errorMessage}</p><p class="text-xs text-gray-400 mt-2">Búsqueda: ${code}</p>`,
                showConfirmButton: true,
            });
        } finally {
            setOrderScanLoading(false);
        }
    };

    const handleManualOrderScan = (e: React.FormEvent) => {
        e.preventDefault();
        processOrderScan(orderScanInput);
    };

    const handleCameraOrderScan = (result: any, error: any) => {
        if (!!result) {
            processOrderScan(result?.text);
            setShowOrderCamera(false);
        }
    };

    const toggleAdditionalOrder = (orderId: string) => {
        setSelectedAdditionalOrderIds((curr) => {
            if (curr.includes(orderId)) return curr.filter((id) => id !== orderId);
            if (curr.length >= 2) {
                Swal.fire({
                    icon: "warning",
                    title: "Máximo 3 órdenes",
                    text: "Solo puedes vincular hasta 3 órdenes de embarque por operador (la orden escaneada + 2 adicionales).",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                });
                return curr;
            }
            return [...curr, orderId];
        });
    };

    const resetOrderEntry = () => {
        setScannedOrderData(null);
        setScannedSubjectData(null);
        setOrderAvailableOrders([]);
        setSelectedAdditionalOrderIds([]);
        setIsOrderInPlant(false);
        setActiveOrderLog(null);
        setOrderEntryNotes("");
        setOrderScanInput("");
    };

    const handleAuthorizeOrderEntry = async () => {
        if (!scannedOrderData || !scannedSubjectData) return;

        const totalOrders = 1 + selectedAdditionalOrderIds.length;
        const operatorName = scannedSubjectData.name || scannedOrderData.operator_name;
        const orderFolio = scannedOrderData.folio ?? scannedOrderData.id;

        Swal.fire({
            title: "¿Dar Entrada al Operador?",
            html: `
                <div class="text-left space-y-2 mt-2">
                    <p><strong>Operador:</strong> ${operatorName}</p>
                    <p><strong>Orden Principal:</strong> ${orderFolio}</p>
                    <p><strong>Total de Órdenes a Vincular:</strong> ${totalOrders} de 3</p>
                    <div class="bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-3 text-amber-800 text-xs font-semibold">
                        ⏱ Se registrará la fecha y hora de este momento exacto como la hora oficial de entrada del operador a la planta.
                    </div>
                </div>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, Registrar Entrada",
            cancelButtonText: "Cancelar",
        }).then(async (result) => {
            if (result.isConfirmed) {
                setIsAuthorizingOrderEntry(true);
                try {
                    const response = await axios.post(route("surveillance.authorize-order-entry"), {
                        order_id: scannedOrderData.id,
                        additional_order_ids: selectedAdditionalOrderIds,
                        notes: orderEntryNotes,
                    });

                    const data = response.data;

                    Swal.fire({
                        icon: "success",
                        title: "¡Entrada Registrada!",
                        text: data.message || `El operador ${operatorName} ingresó a planta.`,
                        showConfirmButton: true,
                        confirmButtonText: "Ver Salidas de Operadores",
                        showCancelButton: true,
                        cancelButtonText: "Escanear Otra Orden",
                        confirmButtonColor: "#4f46e5",
                        cancelButtonColor: "#6b7280",
                    }).then((navResult) => {
                        if (navResult.isConfirmed) {
                            router.visit(route("surveillance.exits.index"));
                        } else {
                            resetOrderEntry();
                        }
                    });
                } catch (error: any) {
                    console.error("Authorize Entry Error:", error);
                    const errorMessage = error.response?.data?.error || "Ocurrió un error al registrar la entrada.";
                    Swal.fire({
                        icon: "error",
                        title: "Error de Autorización",
                        text: errorMessage,
                    });
                } finally {
                    setIsAuthorizingOrderEntry(false);
                }
            }
        });
    };

    // Attach selected orders to pending log
    const attachOrders = () => {
        if (!orderSelectionModal || selectedOrderIds.length === 0) return;

        router.post(
            route("surveillance.attach-orders", orderSelectionModal.logId),
            {
                order_ids: selectedOrderIds,
            },
            {
                onSuccess: () => {
                    const selectedOrders = orderSelectionModal.orders.filter((o) =>
                        selectedOrderIds.includes(o.id)
                    );
                    setPendingLogs((curr) =>
                        curr.map((log) =>
                            log.id === orderSelectionModal.logId
                                ? { ...log, shipment_orders: selectedOrders }
                                : log
                        )
                    );
                    setOrderSelectionModal(null);
                    Swal.fire({
                        icon: "success",
                        title: "Órdenes Vinculadas",
                        text: `${selectedOrderIds.length} orden(es) vinculada(s) al acceso.`,
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                    });
                },
            }
        );
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds((curr) => {
            if (curr.includes(orderId)) return curr.filter((id) => id !== orderId);
            if (curr.length >= 3) {
                Swal.fire({
                    icon: "warning",
                    title: "Máximo 3 órdenes",
                    text: "Solo puedes vincular hasta 3 órdenes de embarque por operador.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                });
                return curr;
            }
            return [...curr, orderId];
        });
    };

    const authorizeAccess = (logId: number, operatorName: string) => {
        Swal.fire({
            title: "¿Autorizar Entrada?",
            text: `¿Desea permitir el acceso al operador ${operatorName}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, Autorizar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("surveillance.store"),
                    {
                        log_id: logId,
                        authorized: true,
                    },
                    {
                        onSuccess: () => {
                            setPendingLogs((curr) => curr.filter((l) => l.id !== logId));
                            Swal.fire({
                                icon: "success",
                                title: "Acceso Autorizado",
                                text: `Operador ${operatorName} ingresó a planta.`,
                                timer: 2500,
                                showConfirmButton: false,
                            });
                        },
                    }
                );
            }
        });
    };

    const denyAccess = (logId: number, operatorName: string) => {
        Swal.fire({
            title: "¿Denegar Entrada?",
            text: `Indique el motivo por el cual se deniega el acceso a ${operatorName}:`,
            input: "text",
            inputPlaceholder: "Motivo del rechazo...",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Denegar Acceso",
            cancelButtonText: "Cancelar",
            inputValidator: (value) => {
                if (!value) {
                    return "¡Es necesario ingresar un motivo!";
                }
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(
                    route("surveillance.store"),
                    {
                        log_id: logId,
                        authorized: false,
                        notes: result.value,
                    },
                    {
                        onSuccess: () => {
                            setPendingLogs((curr) =>
                                curr.map((l) =>
                                    l.id === logId ? { ...l, status: "rejected", notes: result.value } : l
                                )
                            );
                            Swal.fire("Acceso Denegado", "El registro ha sido marcado como rechazado.", "info");
                        },
                    }
                );
            }
        });
    };

    const savePendingReason = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingReasonModal) return;

        router.post(
            route("surveillance.store"),
            {
                log_id: pendingReasonModal.id,
                action: "hold",
                notes: pendingReason,
            },
            {
                onSuccess: () => {
                    setPendingLogs((curr) =>
                        curr.map((l) =>
                            l.id === pendingReasonModal.id
                                ? { ...l, status: "pending", notes: pendingReason }
                                : l
                        )
                    );
                    setPendingReasonModal(null);
                    setPendingReason("");
                    Swal.fire({
                        icon: "success",
                        title: "Motivo Guardado",
                        text: "El operador permanece en lista de pendientes con su motivo anotado.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            }
        );
    };

    const deleteLog = (logId: number) => {
        Swal.fire({
            title: "¿Eliminar Registro?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, Eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("surveillance.destroy", logId), {
                    onSuccess: () => {
                        setPendingLogs((curr) => curr.filter((l) => l.id !== logId));
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "Registro eliminado de la lista.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    const filteredPendingLogs = pendingLogs.filter((log) => {
        if (statusFilter === "all") return true;
        return log.status === statusFilter;
    });

    return (
        <DashboardLayout user={auth.user} header="Control de Accesos">
            <Head title="Vigilancia - Control de Accesos" />

            <div className="py-6">
                <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 space-y-6">

                    {/* Top Navigation & Submodule Bar */}
                    <div className="bg-white rounded-3xl p-3 shadow-md border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                            <Link
                                href={route("surveillance.index")}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors mr-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Menú Principal</span>
                            </Link>

                            <Link
                                href={route("surveillance.access.index")}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wide bg-indigo-600 text-white shadow-md shadow-indigo-100 transition-all"
                            >
                                <Scan className="w-5 h-5" />
                                <span>Control de Accesos</span>
                            </Link>
                        </div>

                        <Link
                            href={route("surveillance.veto")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wide text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            <span>Operadores Vetados</span>
                        </Link>
                    </div>

                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-indigo-900 uppercase tracking-tight flex items-center">
                                <Scan className="w-8 h-8 mr-3 text-indigo-600" />
                                Control de Accesos y Entradas
                            </h2>
                            <p className="text-gray-500 text-sm font-medium ml-11">
                                Escaneo de gafete/QR, lista de espera y autorización de entrada a planta
                            </p>
                        </div>
                    </div>

                    {/* Tabs Navigation (Registro Escaneo, Entrada de Embarques, Pendientes, Historial) */}
                    <div className="bg-white rounded-t-2xl border-b border-gray-200 flex overflow-x-auto shadow-sm">
                        <button
                            onClick={() => setActiveTab("scan")}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 ${
                                activeTab === "scan"
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <Scan className={`w-5 h-5 mr-2 ${activeTab === "scan" ? "text-indigo-600" : "text-gray-400"}`} />
                            Registro Escaneo
                        </button>
                        <button
                            onClick={() => setActiveTab("order_entry")}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 ${
                                activeTab === "order_entry"
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <FileText className={`w-5 h-5 mr-2 ${activeTab === "order_entry" ? "text-indigo-600" : "text-gray-400"}`} />
                            Entrada de Embarques
                        </button>
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 ${
                                activeTab === "pending"
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <Clock className={`w-5 h-5 mr-2 ${activeTab === "pending" ? "text-indigo-600" : "text-gray-400"}`} />
                            Pendientes
                            <span
                                className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-bold ${
                                    activeTab === "pending" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                                }`}
                            >
                                {pendingLogs.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 ${
                                activeTab === "history"
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <History className={`w-5 h-5 mr-2 ${activeTab === "history" ? "text-indigo-600" : "text-gray-400"}`} />
                            Historial
                        </button>
                    </div>

                    <div className="bg-white rounded-b-2xl shadow-xl border border-gray-100 p-8 min-h-[550px]">
                        {/* Tab: SCAN */}
                        {activeTab === "scan" && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-10">
                                <div className="text-center space-y-4">
                                    <div className="bg-indigo-50 p-6 rounded-3xl inline-block mb-2 shadow-inner">
                                        <Scan className="w-16 h-16 text-indigo-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Escáner de Acceso</h2>
                                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                                        Escanea el código QR del operador (Barco o Salida) o ingresa manualmente el ID.
                                    </p>
                                </div>

                                {showCamera ? (
                                    <div className="w-full max-w-sm mx-auto bg-black rounded-3xl overflow-hidden relative shadow-2xl ring-4 ring-indigo-100">
                                        <QrReader
                                            onResult={handleCameraScan}
                                            constraints={{ facingMode: "environment" }}
                                            className="w-full h-80 object-cover"
                                        />
                                        <button
                                            onClick={() => setShowCamera(false)}
                                            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 transition-all"
                                        >
                                            <XCircle className="w-8 h-8" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                            <p className="text-white text-center font-bold animate-pulse">
                                                Buscando código QR...
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-lg space-y-6">
                                        <form onSubmit={handleManualScan} className="w-full relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                            </div>
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={qrInput}
                                                onChange={(e) => setQrInput(e.target.value)}
                                                className="block w-full pl-12 pr-32 py-5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:ring-0 focus:border-indigo-500 focus:bg-white text-xl font-bold shadow-sm transition-all placeholder-gray-400"
                                                placeholder="Escanear o escribir ID..."
                                                autoComplete="off"
                                            />
                                            <button
                                                type="submit"
                                                className="absolute inset-y-2 right-2 px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-md transition-all flex items-center"
                                            >
                                                BUSCAR
                                            </button>
                                        </form>

                                        <div className="relative flex py-2 items-center">
                                             <div className="flex-grow border-t border-gray-200"></div>
                                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                O utiliza la cámara
                                            </span>
                                            <div className="flex-grow border-t border-gray-200"></div>
                                        </div>

                                        <button
                                            onClick={() => setShowCamera(true)}
                                            className="w-full flex items-center justify-center px-6 py-5 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all group font-bold text-lg"
                                        >
                                            <Camera className="w-7 h-7 mr-3 group-hover:scale-110 transition-transform" />
                                            ACTIVAR CÁMARA
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: ORDER ENTRY (ENTRADA DE EMBARQUES) */}
                        {activeTab === "order_entry" && (
                            <div className="space-y-8 py-4">
                                {!scannedOrderData ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-8">
                                        <div className="text-center space-y-3">
                                            <div className="bg-emerald-50 p-6 rounded-3xl inline-block mb-1 shadow-inner border border-emerald-100">
                                                <FileText className="w-16 h-16 text-emerald-600" />
                                            </div>
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                                Entrada de Embarques
                                            </h2>
                                            <p className="text-gray-500 text-base max-w-lg mx-auto">
                                                Escanea el código de la Orden de Embarque o ingresa su Folio (ej. <span className="font-bold text-gray-800">PA2026-0031</span>). El sistema identificará al operador asignado y te permitirá darle entrada inmediata a planta.
                                            </p>
                                        </div>

                                        {showOrderCamera ? (
                                            <div className="w-full max-w-sm mx-auto bg-black rounded-3xl overflow-hidden relative shadow-2xl ring-4 ring-emerald-100">
                                                <QrReader
                                                    onResult={handleCameraOrderScan}
                                                    constraints={{ facingMode: "environment" }}
                                                    className="w-full h-80 object-cover"
                                                />
                                                <button
                                                    onClick={() => setShowOrderCamera(false)}
                                                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/40 transition-all"
                                                >
                                                    <XCircle className="w-8 h-8" />
                                                </button>
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                                    <p className="text-white text-center font-bold animate-pulse">
                                                        Buscando Orden de Embarque...
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-lg space-y-6">
                                                <form onSubmit={handleManualOrderScan} className="w-full relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Search className="h-6 w-6 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        ref={orderInputRef}
                                                        type="text"
                                                        value={orderScanInput}
                                                        onChange={(e) => setOrderScanInput(e.target.value)}
                                                        className="block w-full pl-12 pr-32 py-5 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:ring-0 focus:border-emerald-500 focus:bg-white text-xl font-bold shadow-sm transition-all placeholder-gray-400 uppercase"
                                                        placeholder="Folio ej. PA2026-0031..."
                                                        autoComplete="off"
                                                        disabled={orderScanLoading}
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={orderScanLoading}
                                                        className="absolute inset-y-2 right-2 px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold shadow-md transition-all flex items-center disabled:opacity-50"
                                                    >
                                                        {orderScanLoading ? "BUSCANDO..." : "BUSCAR"}
                                                    </button>
                                                </form>

                                                <div className="relative flex py-2 items-center">
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                        O escanea con la cámara
                                                    </span>
                                                    <div className="flex-grow border-t border-gray-200"></div>
                                                </div>

                                                <button
                                                    onClick={() => setShowOrderCamera(true)}
                                                    className="w-full flex items-center justify-center px-6 py-5 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all group font-bold text-lg"
                                                >
                                                    <Camera className="w-7 h-7 mr-3 group-hover:scale-110 transition-transform" />
                                                    ACTIVAR CÁMARA PARA ORDEN
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Order Scanned & Operator Detected View */
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                                                    <CheckCircle className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                                        Orden Localizada: {scannedOrderData.folio ?? scannedOrderData.id}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm font-medium">
                                                        Verifica los datos del operador asignado antes de autorizar la entrada a planta.
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={resetOrderEntry}
                                                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                                            >
                                                <Search className="w-4 h-4" />
                                                Escanear Otra Orden
                                            </button>
                                        </div>

                                        {/* 2-Column Info Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Column 1: Scanned Shipment Order Card */}
                                            <div className="bg-gradient-to-br from-emerald-50/70 to-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-emerald-100/80">
                                                    <div className="flex items-center gap-2 text-emerald-800 font-black text-sm uppercase tracking-wider">
                                                        <FileText className="w-5 h-5 text-emerald-600" />
                                                        Datos de la Orden de Embarque
                                                    </div>
                                                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                                                        {scannedOrderData.status}
                                                    </span>
                                                </div>

                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                            Folio
                                                        </span>
                                                        <p className="text-xl font-black text-gray-900 font-mono">
                                                            {scannedOrderData.folio ?? scannedOrderData.id}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Cliente
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm truncate" title={scannedOrderData.client}>
                                                                {scannedOrderData.client}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Producto
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm truncate" title={scannedOrderData.product}>
                                                                {scannedOrderData.product}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Cantidad / Toneladas
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm">
                                                                {scannedOrderData.quantity} Tons
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Origen
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm truncate">
                                                                {scannedOrderData.origin}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2: Assigned Operator Card */}
                                            <div className="bg-gradient-to-br from-indigo-50/70 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-indigo-100/80">
                                                    <div className="flex items-center gap-2 text-indigo-800 font-black text-sm uppercase tracking-wider">
                                                        <Truck className="w-5 h-5 text-indigo-600" />
                                                        Operador Asignado a la Orden
                                                    </div>
                                                    {scannedSubjectData?.status === "vetoed" ? (
                                                        <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                                                            VETADO
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-black uppercase tracking-wider">
                                                            ACTIVO
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                            Nombre del Operador
                                                        </span>
                                                        <p className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                                            {scannedSubjectData?.name || scannedOrderData.operator_name || "N/A"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                            Línea de Transporte
                                                        </span>
                                                        <p className="font-bold text-indigo-700 text-sm uppercase">
                                                            {scannedOrderData.transport_line || scannedSubjectData?.transport_line || "N/A"}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Placas
                                                            </span>
                                                            <p className="font-mono font-bold text-gray-800 text-sm">
                                                                {scannedOrderData.tractor_plate || scannedSubjectData?.tractor_plate || "S/P"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Económico
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm">
                                                                #{scannedOrderData.economic_number || scannedSubjectData?.economic_number || "S/N"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                                                                Licencia
                                                            </span>
                                                            <p className="font-bold text-gray-800 text-sm truncate">
                                                                {scannedSubjectData?.license || "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other Available Orders for this Operator */}
                                        {orderAvailableOrders && orderAvailableOrders.length > 0 && (
                                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-black text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-indigo-600" />
                                                            Otras Órdenes Disponibles para este Operador (Vincular hasta 3 en total)
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Selecciona si el operador retirará múltiples órdenes en este viaje:
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold font-mono">
                                                        {1 + selectedAdditionalOrderIds.length} / 3 Órdenes
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                                                    {orderAvailableOrders.map((o: any) => {
                                                        const isSelected = selectedAdditionalOrderIds.includes(o.id);
                                                        return (
                                                            <label
                                                                key={o.id}
                                                                onClick={() => toggleAdditionalOrder(o.id)}
                                                                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                                    isSelected
                                                                        ? "bg-indigo-50 border-indigo-600 shadow-sm"
                                                                        : "bg-white border-slate-200 hover:border-indigo-300"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}}
                                                                    className="mt-1 rounded text-indigo-600 focus:ring-0 w-4 h-4 border-slate-300"
                                                                />
                                                                <div className="flex-1 min-w-0 text-xs">
                                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                                        <span className="font-black text-slate-900">
                                                                            {o.folio ?? o.id}
                                                                        </span>
                                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                                                                            {o.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="font-semibold text-slate-700 truncate" title={o.client?.business_name || o.client?.name || o.client}>
                                                                        {o.client?.business_name || o.client?.name || o.client || "Cliente"}
                                                                    </p>
                                                                    <p className="text-slate-500 text-[10px] truncate">
                                                                        {o.items?.[0]?.product?.name || o.product_text || "Producto"}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons & Entry Confirmation */}
                                        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100">
                                            <div className="text-xs text-gray-500 font-medium">
                                                Al autorizar, se registrará el momento actual como la hora de entrada del operador a planta.
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={resetOrderEntry}
                                                    type="button"
                                                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
                                                >
                                                    Cancelar
                                                </button>

                                                <button
                                                    onClick={handleAuthorizeOrderEntry}
                                                    disabled={isAuthorizingOrderEntry || scannedSubjectData?.status === "vetoed"}
                                                    type="button"
                                                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                                >
                                                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                    {isAuthorizingOrderEntry ? "REGISTRANDO..." : "DAR ENTRADA AL OPERADOR"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: PENDING */}
                        {activeTab === "pending" && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-indigo-500 focus:ring-0 shadow-sm transition-all outline-none uppercase"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="pending">Solo Pendientes</option>
                                        <option value="rejected">Solo Denegados</option>
                                    </select>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-lg bg-white">
                                    <table className="w-full divide-y divide-gray-200 text-left">
                                        <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white">
                                            <tr>
                                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Escaneo
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Operador
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Unidad
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Tipo
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Estado
                                                </th>
                                                <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredPendingLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500 bg-gray-50/50">
                                                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                        <p className="font-medium text-lg">No hay registros pendientes de autorización.</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredPendingLogs.map((log) => (
                                                    <tr
                                                        key={log.id}
                                                        className="hover:bg-indigo-50/50 transition-colors duration-200 text-gray-700"
                                                    >
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center text-gray-900 font-bold">
                                                                <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                                                                {new Date(log.created_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>
                                                            <span className="text-xs text-gray-400 font-bold ml-5">
                                                                {new Date(log.created_at).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900 uppercase">
                                                                {log.subject?.operator_name || log.subject?.name || "N/A"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                Lic: {log.subject?.license || "N/A"}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-gray-900 font-mono">
                                                                {log.subject?.tractor_plate || "S/P"}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Econ: <span className="font-bold">{log.subject?.economic_number || "S/N"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                                                                    log.subject_type.includes("Vessel")
                                                                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                        : "bg-green-100 text-green-800 border border-green-200"
                                                                }`}
                                                            >
                                                                {log.subject_type.includes("Vessel") ? "Barco/Muelle" : "Salida/Doc"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                                                                    log.status === "pending"
                                                                        ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                                                        : "bg-red-100 text-red-800 border border-red-200"
                                                                }`}
                                                            >
                                                                {log.status === "pending" ? "Pendiente" : "Denegado"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-medium">
                                                            <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                                                                <button
                                                                    onClick={() => {
                                                                        setPendingReasonModal(log);
                                                                        setPendingReason(log.notes || "");
                                                                    }}
                                                                    title="Agregar Motivo de Espera"
                                                                    className="text-white bg-amber-500 hover:bg-amber-600 border border-amber-500 px-3 py-2 rounded-xl transition-all shadow-sm font-black text-xs uppercase"
                                                                >
                                                                    Pendiente
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        authorizeAccess(
                                                                            log.id,
                                                                            log.subject?.operator_name || log.subject?.name || "Operador"
                                                                        )
                                                                    }
                                                                    className="text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-all shadow-sm font-black text-xs uppercase inline-flex items-center"
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-1.5" />
                                                                    Autorizar
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        denyAccess(
                                                                            log.id,
                                                                            log.subject?.operator_name || log.subject?.name || "Operador"
                                                                        )
                                                                    }
                                                                    className="text-white bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-xl transition-all shadow-sm font-black text-xs uppercase inline-flex items-center"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-1.5" />
                                                                    Denegar
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteLog(log.id)}
                                                                    title="Eliminar Registro"
                                                                    className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 p-2 rounded-xl transition-all shadow-sm inline-flex items-center justify-center align-middle"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            {(log.status === "pending" || log.status === "rejected") && log.notes && (
                                                                <div
                                                                    className={`text-xs font-bold mt-1 max-w-[220px] truncate uppercase mx-auto ${
                                                                        log.status === "rejected" ? "text-red-600" : "text-yellow-600"
                                                                    }`}
                                                                    title={log.notes}
                                                                >
                                                                    Motivo: {log.notes}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab: HISTORY */}
                        {activeTab === "history" && (
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-lg bg-white">
                                <table className="w-full divide-y divide-gray-200 text-left">
                                    <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white">
                                        <tr>
                                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Tiempos (Entrada / Salida)
                                            </th>
                                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Orden de Embarque
                                            </th>
                                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Operador
                                            </th>
                                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Unidad
                                            </th>
                                            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Tipo
                                            </th>
                                            <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {history.data.map((log: any) => {
                                            const orders = log.shipment_orders || log.shipmentOrders || [];
                                            return (
                                                <tr key={log.id} className="hover:bg-indigo-50/50 transition-colors duration-200">
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center text-emerald-700 font-bold mb-1">
                                                            <span className="w-14 text-xs uppercase font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">Entró:</span>
                                                            {log.entry_at ? new Date(log.entry_at).toLocaleString() : "N/A"}
                                                        </div>
                                                        <div className="flex items-center text-rose-700 font-bold">
                                                            <span className="w-14 text-xs uppercase font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mr-2">Salió:</span>
                                                            {log.exit_at ? new Date(log.exit_at).toLocaleString() : "N/A"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-sm">
                                                        {orders && orders.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {orders.map((o: any) => (
                                                                    <div key={o.id} className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 max-w-[240px]">
                                                                        <div className="flex items-center justify-between gap-1">
                                                                            <span className="font-mono font-black text-amber-900 text-xs">
                                                                                {o.folio ?? o.id}
                                                                            </span>
                                                                            <span className="text-[10px] uppercase font-bold text-amber-700">
                                                                                {o.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[11px] text-gray-600 font-medium truncate mt-0.5" title={o.client?.business_name || o.client?.name || o.client_name || ""}>
                                                                            {o.client?.business_name || o.client?.name || o.client_name || "N/A"}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 font-medium italic">
                                                                Sin orden vinculada
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="font-bold uppercase text-gray-800">
                                                            {log.subject?.operator_name || log.subject?.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            {log.subject?.transport_line || log.subject?.transporter_line || "Línea N/A"}
                                                        </div>
                                                        {log.subject?.status === "vetoed" && (
                                                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                VETADO
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                            {log.subject?.tractor_plate || "S/P"}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Econ: <span className="font-bold">#{log.subject?.economic_number || "S/N"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                                        <span
                                                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                                                                log.subject_type.includes("Vessel")
                                                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                    : "bg-green-100 text-green-800 border border-green-200"
                                                            }`}
                                                        >
                                                            {log.subject_type.includes("Vessel") ? "Barco" : "Salida"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                        <button
                                                            onClick={() => setViewingLog(log)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all shadow-sm inline-flex items-center font-bold text-xs uppercase"
                                                        >
                                                            <User className="w-3 h-3 mr-1.5" />
                                                            Ver
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === ORDER SELECTION MODAL === */}
            <Modal show={!!orderSelectionModal} onClose={() => setOrderSelectionModal(null)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                Órdenes de Embarque Detectadas
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Selecciona las órdenes que trae este operador (máx. 3)
                            </p>
                        </div>
                        <button onClick={() => setOrderSelectionModal(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6">
                        {orderSelectionModal?.orders.map((order: any) => {
                            const isSelected = selectedOrderIds.includes(order.id);
                            return (
                                <button
                                    key={order.id}
                                    type="button"
                                    onClick={() => toggleOrderSelection(order.id)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                        isSelected
                                            ? "border-indigo-500 bg-indigo-50 shadow-md"
                                            : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-sm font-black uppercase ${
                                                        isSelected ? "text-indigo-700" : "text-gray-800"
                                                    }`}
                                                >
                                                    Folio: {order.folio}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                                                        order.has_destare
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {order.has_destare ? "Destarada" : "Pendiente"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                                <span>
                                                    <span className="font-bold text-gray-400 uppercase">Cliente:</span>{" "}
                                                    {order.client}
                                                </span>
                                                <span>
                                                    <span className="font-bold text-gray-400 uppercase">Producto:</span>{" "}
                                                    {order.product}
                                                </span>
                                                <span>
                                                    <span className="font-bold text-gray-400 uppercase">Cantidad:</span>{" "}
                                                    {order.quantity}
                                                </span>
                                                <span>
                                                    <span className="font-bold text-gray-400 uppercase">Origen:</span>{" "}
                                                    {order.origin}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            className={`ml-3 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                                            }`}
                                        >
                                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setOrderSelectionModal(null)}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase text-sm"
                        >
                            Omitir
                        </button>
                        <button
                            type="button"
                            onClick={attachOrders}
                            disabled={selectedOrderIds.length === 0}
                            className="flex-2 bg-indigo-600 text-white font-black py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-lg uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Vincular {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""} Órdenes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Pending Reason Modal */}
            <Modal show={!!pendingReasonModal} onClose={() => setPendingReasonModal(null)} maxWidth="md">
                <form onSubmit={savePendingReason} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-gray-900 uppercase flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                            Motivo de Espera (Pendiente)
                        </h2>
                        <button
                            type="button"
                            onClick={() => setPendingReasonModal(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 font-medium">
                        Ingresa el motivo por el cual el operador{" "}
                        <span className="font-bold text-gray-900 uppercase">
                            {pendingReasonModal?.subject?.operator_name || pendingReasonModal?.subject?.name}
                        </span>{" "}
                        permanece en espera:
                    </p>

                    <div className="mb-6">
                        <textarea
                            value={pendingReason}
                            onChange={(e) => setPendingReason(e.target.value)}
                            placeholder="Ej. Falta documentación, en espera de báscula, etc."
                            rows={3}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:ring-0 transition-all"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setPendingReasonModal(null)}
                            className="bg-gray-100 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-200 transition-colors uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-amber-500 text-white font-black py-2.5 px-6 rounded-xl hover:bg-amber-600 transition-all shadow-md uppercase text-xs"
                        >
                            Guardar Motivo
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal show={!!viewingLog} onClose={() => setViewingLog(null)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                        <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase">Detalles del Registro</h2>
                        </div>
                        <button
                            onClick={() => setViewingLog(null)}
                            className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    {viewingLog && viewingLog.subject && (
                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-indigo-100 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-100 rounded-full opacity-50 blur-2xl"></div>
                                <div className="flex items-start space-x-6 relative z-10">
                                    <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center border-2 border-indigo-50 shadow-md flex-shrink-0">
                                        <Truck className="w-12 h-12 text-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-3xl font-black text-gray-900 uppercase leading-none mb-2 tracking-tight">
                                            {viewingLog.subject.operator_name || viewingLog.subject.name}
                                        </h3>
                                        <div className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
                                            {viewingLog.subject.transport_line || viewingLog.subject.transporter_line}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mt-2">
                                            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                                                    Placas
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono font-bold text-gray-900 border border-gray-200">
                                                        {viewingLog.subject.tractor_plate}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                                                    Unidad
                                                </p>
                                                <p className="text-sm text-gray-800 font-bold mt-1">
                                                    {viewingLog.subject.unit_type}
                                                </p>
                                                <p className="text-xs text-indigo-500 font-bold">
                                                    #{viewingLog.subject.economic_number}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                        Hora de Entrada
                                    </p>
                                    <p className="text-xl font-black text-gray-900">
                                        {new Date(viewingLog.entry_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                        Autorizado Por
                                    </p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {viewingLog.user?.name || "Sistema"}
                                    </p>
                                </div>
                            </div>

                            {viewingLog.shipment_orders && viewingLog.shipment_orders.length > 0 && (
                                <div className="p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-indigo-700 uppercase font-black tracking-wider mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-1.5" />
                                        Órdenes de Embarque Vinculadas ({viewingLog.shipment_orders.length})
                                    </p>
                                    <div className="space-y-2">
                                        {viewingLog.shipment_orders.map((o: any) => (
                                            <div
                                                key={o.id}
                                                className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-indigo-900 uppercase">
                                                        Folio: {o.folio ?? o.id}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase text-[10px]">
                                                        {o.status}
                                                    </span>
                                                </div>
                                                <div className="text-gray-600 font-medium">
                                                    {o.client?.business_name || o.client?.name || o.client || "N/A"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => setViewingLog(null)}
                            className="bg-gray-100 text-gray-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
