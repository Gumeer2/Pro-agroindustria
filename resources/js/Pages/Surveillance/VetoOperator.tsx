import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
    UserX,
    Search,
    ArrowLeft,
    ShieldAlert,
    Truck,
    CreditCard,
    AlertCircle,
    User,
    Hash,
    Scan,
    LogOut,
    ShieldCheck,
    History,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Filter,
    Calendar,
    FileText,
    ChevronRight,
    UserCheck,
    AlertTriangle,
    X,
    Info,
    Clock,
    UserMinus,
    ExternalLink,
    Eye,
    Printer,
    Building2,
    Users,
    QrCode,
} from "lucide-react";
import axios from "axios";
// @ts-ignore
import { debounce } from "lodash";
import Modal from "@/Components/Modal";
import QrScannerModal from "@/Components/QrScannerModal";
import Pagination from "@/Components/Pagination";
import Swal from "sweetalert2";

interface Operator {
    id: number;
    type?: string;
    name: string;
    license: string;
    transport_line: string;
    real_transport_line: string;
    economic_number: string;
    unit_type: string;
    brand_model: string;
    tractor_plate: string;
    trailer_plate: string;
    policy: string;
    validity: string;
    status: string;
    clients?: Array<{ id: number; business_name: string }>;
    veto_reason?: string;
    vetoed_at?: string;
    vetoed_by_name?: string;
    unveto_reason?: string;
    unvetoed_at?: string;
    unvetoed_by_name?: string;
}

interface HistoryLog {
    id: number;
    operator_id: number;
    operator_type: string;
    operator_name: string;
    license?: string;
    tractor_plate?: string;
    trailer_plate?: string;
    transport_line?: string;
    economic_number?: string;
    action: "vetoed" | "unvetoed";
    reason?: string;
    user_id?: number;
    user?: { id: number; name: string };
    created_at: string;
}

interface Props {
    auth: any;
    all_operators?: {
        data: Operator[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
        from?: number;
        to?: number;
    };
    vetoed_operators?: Operator[];
    history_logs?: {
        data: HistoryLog[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    stats?: {
        total_operators_count?: number;
        active_vetoed_count: number;
        total_history_count: number;
        total_vetoes: number;
        total_unvetoes: number;
    };
    filters?: {
        tab?: string;
        action: string;
        history_search: string;
        date_from: string;
        date_to: string;
        operator_search?: string;
        operator_status?: string;
    };
}

export default function VetoOperator({
    auth,
    all_operators = { data: [], links: [], total: 0, current_page: 1, last_page: 1, from: 0, to: 0 },
    vetoed_operators = [],
    history_logs = { data: [], links: [], total: 0, current_page: 1, last_page: 1 },
    stats = {
        total_operators_count: 0,
        active_vetoed_count: 0,
        total_history_count: 0,
        total_vetoes: 0,
        total_unvetoes: 0,
    },
    filters = {
        tab: "operators_list",
        action: "all",
        history_search: "",
        date_from: "",
        date_to: "",
        operator_search: "",
        operator_status: "all",
    },
}: Props) {
    // Search / Inspection State
    const [operator, setOperator] = useState<Operator | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Active Tab in bottom section
    const [activeTab, setActiveTab] = useState<"operators_list" | "active_vetoed" | "history">(
        (filters.tab as any) || "operators_list"
    );

    // Operator List Filters (searches directly the operator list)
    const [operatorSearch, setOperatorSearch] = useState(filters.operator_search || "");
    const [operatorStatus, setOperatorStatus] = useState(filters.operator_status || "all");

    // Local Search Filter for Active Vetoed table
    const [activeVetoFilter, setActiveVetoFilter] = useState("");

    // History Filters State
    const [historySearch, setHistorySearch] = useState(filters.history_search || "");
    const [actionFilter, setActionFilter] = useState(filters.action || "all");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");

    // Modals State
    const [vetoModalOpen, setVetoModalOpen] = useState(false);
    const [unvetoModalOpen, setUnvetoModalOpen] = useState(false);
    const [showQrScanner, setShowQrScanner] = useState(false);
    const [targetOperator, setTargetOperator] = useState<Operator | null>(null);
    const [modalReason, setModalReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Parse and extract ID / clean term from QR codes (e.g. OP_EXIT 668, OP?EXIT 668, OP_VESSEL 12, #668, 668)
    const parseQrInput = (raw: string): string => {
        let clean = raw.trim();
        const normalized = clean.replace(/[\?\'\-\|]/g, "_").toUpperCase();
        const exitMatch = normalized.match(/OP[_\s]*EXIT[_\s]*(\d+)/i);
        if (exitMatch) {
            return exitMatch[1];
        }
        const vesselMatch = normalized.match(/OP[_\s]*VESSEL[_\s]*(\d+)/i);
        if (vesselMatch) {
            return vesselMatch[1];
        }
        const opMatch = normalized.match(/^OP[_\s]*(\d+)/i);
        if (opMatch) {
            return opMatch[1];
        }
        if (clean.includes("|")) {
            return clean.split("|")[0].trim();
        }
        return clean;
    };

    const handleQrScan = (data: string | null) => {
        if (!data) return;
        setShowQrScanner(false);
        const parsed = parseQrInput(data);
        setOperatorSearch(parsed);
        setOperatorStatus("all");
        handleApplyOperatorFilters({ operator_search: parsed, operator_status: "all", is_qr: 1 });
    };

    const handleOperatorSearchChange = (value: string) => {
        const isQrCode = /OP[_\s]*(EXIT|VESSEL)?[_\s]*\d+/i.test(value);
        if (isQrCode) {
            const parsed = parseQrInput(value);
            setOperatorSearch(parsed);
            setOperatorStatus("all");
            handleApplyOperatorFilters({ operator_search: parsed, operator_status: "all", is_qr: 1 });
        } else {
            setOperatorSearch(value);
        }
    };

    // Open Veto Modal
    const handleOpenVetoModal = (op: Operator) => {
        setTargetOperator(op);
        setModalReason("");
        setVetoModalOpen(true);
    };

    // Open Unveto Modal
    const handleOpenUnvetoModal = (op: Operator) => {
        setTargetOperator(op);
        setModalReason("");
        setUnvetoModalOpen(true);
    };

    // Submit Veto
    const handleConfirmVeto = () => {
        if (!targetOperator) return;

        setSubmitting(true);
        router.post(
            route("surveillance.operators.veto", targetOperator.id),
            {
                reason: modalReason.trim() || "Veto administrativo",
                type: targetOperator.type || "exit",
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    setVetoModalOpen(false);
                    setModalReason("");
                    // Update search operator card if same operator
                    if (operator && operator.id === targetOperator.id) {
                        setOperator({
                            ...operator,
                            status: "vetoed",
                            veto_reason: modalReason.trim() || "Veto administrativo",
                            vetoed_at: new Date().toISOString(),
                            vetoed_by_name: auth.user?.name || "Vigilancia",
                        });
                    }
                    Swal.fire({
                        icon: "success",
                        title: "Operador Vetado",
                        text: `El operador ${targetOperator.name} ha sido vetado exitosamente.`,
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3500,
                    });
                },
                onError: () => setSubmitting(false),
            }
        );
    };

    // Submit Unveto (Retiro de Veto)
    const handleConfirmUnveto = () => {
        if (!targetOperator) return;

        setSubmitting(true);
        router.post(
            route("surveillance.operators.unveto", targetOperator.id),
            {
                reason: modalReason.trim() || "Retiro de veto autorizado",
                type: targetOperator.type || "exit",
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubmitting(false);
                    setUnvetoModalOpen(false);
                    setModalReason("");
                    // Update search operator card if same operator
                    if (operator && operator.id === targetOperator.id) {
                        setOperator({
                            ...operator,
                            status: "active",
                            unveto_reason: modalReason.trim() || "Retiro de veto autorizado",
                            unvetoed_at: new Date().toISOString(),
                            unvetoed_by_name: auth.user?.name || "Vigilancia",
                        });
                    }
                    Swal.fire({
                        icon: "success",
                        title: "Veto Retirado",
                        text: `Se ha retirado el veto al operador ${targetOperator.name}. Ahora está ACTIVO.`,
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3500,
                    });
                },
                onError: () => setSubmitting(false),
            }
        );
    };

    // Apply History Filters (Server-side)
    const handleApplyHistoryFilters = () => {
        router.get(
            route("surveillance.veto"),
            {
                history_search: historySearch,
                action: actionFilter,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Select operator to view detailed card above
    const handleSelectOperator = (op: Operator) => {
        setOperator(op);
        window.scrollTo({ top: 300, behavior: "smooth" });
    };

    // Apply Operator List Filters
    const handleApplyOperatorFilters = (newParams?: { operator_search?: string; operator_status?: string; operator_page?: number; is_qr?: number }) => {
        const searchTerm = newParams?.operator_search !== undefined ? newParams.operator_search : operatorSearch;
        const isQr = newParams?.is_qr !== undefined ? newParams.is_qr : (/^(\d+|#\d+|OP_EXIT.*)$/i.test(searchTerm.trim()) ? 1 : 0);

        router.get(
            route("surveillance.veto"),
            {
                tab: "operators_list",
                operator_search: searchTerm,
                operator_status: newParams?.operator_status !== undefined ? newParams.operator_status : operatorStatus,
                operator_page: newParams?.operator_page || 1,
                is_qr: isQr,
                history_search: historySearch,
                action: actionFilter,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Clear Operator List Filters
    const handleClearOperatorFilters = () => {
        setOperatorSearch("");
        setOperatorStatus("all");
        router.get(
            route("surveillance.veto"),
            {
                tab: "operators_list",
                operator_search: "",
                operator_status: "all",
                operator_page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Clear History Filters

    const handleClearHistoryFilters = () => {
        setHistorySearch("");
        setActionFilter("all");
        setDateFrom("");
        setDateTo("");

        router.get(
            route("surveillance.veto"),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    // Filter Active Vetoed operators locally in real time
    const filteredActiveVetoed = vetoed_operators.filter((op) => {
        if (!activeVetoFilter.trim()) return true;
        const q = activeVetoFilter.toLowerCase();
        return (
            op.name.toLowerCase().includes(q) ||
            op.tractor_plate.toLowerCase().includes(q) ||
            (op.trailer_plate && op.trailer_plate.toLowerCase().includes(q)) ||
            (op.transport_line && op.transport_line.toLowerCase().includes(q)) ||
            (op.economic_number && op.economic_number.toLowerCase().includes(q)) ||
            (op.license && op.license.toLowerCase().includes(q)) ||
            String(op.id).includes(q)
        );
    });

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            return d.toLocaleString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Veto y Retiro de Operadores">
            <Head title="Vigilancia - Veto e Historial de Operadores" />

            <div className="py-6 w-full max-w-[1600px] mx-auto px-3 sm:px-6 space-y-6">
                {/* Submodules Navigation Bar */}
                <div className="bg-white rounded-3xl p-3 shadow-md border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                        <Link
                            href={route("surveillance.access.index")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all border border-slate-200"
                        >
                            <Scan className="w-5 h-5 text-indigo-500" />
                            <span>Control de Accesos</span>
                        </Link>

                        <Link
                            href={route("surveillance.exits.index")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-all border border-slate-200"
                        >
                            <LogOut className="w-5 h-5 text-rose-500" />
                            <span>Salidas de Operadores</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wide bg-red-600 text-white shadow-md shadow-red-200">
                            <ShieldAlert className="w-5 h-5" />
                            <span>Operadores Vetados</span>
                        </span>
                    </div>
                </div>

                {/* Hero Header & KPI Cards */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="bg-red-100 p-4 rounded-2xl mr-4 shadow-sm text-red-600">
                                <ShieldAlert className="w-9 h-9" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                                    Veto de Operadores & Historial
                                </h1>
                                <p className="text-gray-500 text-sm font-medium mt-0.5">
                                    Consulte el padrón de sancionados, aplique o retire vetos de acceso y audite la bitácora histórica.
                                </p>
                            </div>
                        </div>

                        {/* Print Report Button */}
                        <div className="flex items-center gap-3">
                            <a
                                href={route("surveillance.veto.report")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap cursor-pointer"
                                title="Abrir e imprimir el reporte oficial de operadores vetados"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Imprimir Reporte de Vetados</span>
                            </a>
                        </div>
                    </div>

                    {/* KPI Stat Cards (5 Tarjetas Interactivas) */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* 1. Total Padrón Operadores */}
                        <div
                            onClick={() => setActiveTab("operators_list")}
                            className={`rounded-3xl p-5 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                                activeTab === "operators_list"
                                    ? "bg-gradient-to-br from-indigo-900 to-indigo-800 text-white shadow-indigo-200 border-indigo-700 ring-4 ring-indigo-200"
                                    : "bg-white text-slate-900 border-slate-200/80 hover:border-indigo-300"
                            }`}
                            title="Ver padrón general de operadores registrados"
                        >
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest ${activeTab === "operators_list" ? "text-indigo-200" : "text-slate-400"}`}>
                                    Padrón Operadores
                                </p>
                                <p className={`text-3xl font-black mt-1 tracking-tight ${activeTab === "operators_list" ? "text-white" : "text-indigo-950"}`}>
                                    {stats.total_operators_count ?? all_operators.total}
                                </p>
                                <p className={`text-[11px] font-bold mt-1 ${activeTab === "operators_list" ? "text-indigo-200" : "text-slate-500"}`}>
                                    Total registrados
                                </p>
                            </div>
                            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border ${
                                activeTab === "operators_list"
                                    ? "bg-white/15 border-white/20 text-white"
                                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            }`}>
                                <Truck className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 2. Active Vetoed */}
                        <div
                            onClick={() => setActiveTab("active_vetoed")}
                            className={`rounded-3xl p-5 text-white shadow-xl shadow-red-200/50 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                                activeTab === "active_vetoed"
                                    ? "bg-gradient-to-br from-red-600 to-rose-700 ring-4 ring-red-300"
                                    : "bg-gradient-to-br from-red-600 to-rose-700 opacity-90 hover:opacity-100"
                            }`}
                            title="Ver lista de operadores vetados actualmente"
                        >
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-red-200">
                                    Vetados Actualmente
                                </p>
                                <p className="text-3xl font-black mt-1 tracking-tight">
                                    {stats.active_vetoed_count}
                                </p>
                                <p className="text-[11px] font-bold text-red-100 mt-1">
                                    Acceso restringido en planta
                                </p>
                            </div>
                            <div className="w-13 h-13 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <UserX className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* 3. Total Veto Events */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Vetos Aplicados
                                </p>
                                <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                                    {stats.total_vetoes}
                                </p>
                                <p className="text-[11px] font-bold text-slate-500 mt-1">
                                    Sanciones en bitácora
                                </p>
                            </div>
                            <div className="w-13 h-13 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 text-red-600">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 4. Total Unveto Events */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    Retiros de Veto
                                </p>
                                <p className="text-3xl font-black text-emerald-600 mt-1 tracking-tight">
                                    {stats.total_unvetoes}
                                </p>
                                <p className="text-[11px] font-bold text-slate-500 mt-1">
                                    Reactivaciones autorizadas
                                </p>
                            </div>
                            <div className="w-13 h-13 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-600">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                        </div>

                        {/* 5. Total History Log */}
                        <div
                            onClick={() => setActiveTab("history")}
                            className={`rounded-3xl p-5 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                                activeTab === "history"
                                    ? "bg-gradient-to-br from-indigo-700 to-indigo-900 text-white shadow-indigo-200 border-indigo-600 ring-4 ring-indigo-200"
                                    : "bg-white text-slate-900 border-slate-200/80 hover:border-indigo-300"
                            }`}
                            title="Ver historial de movimientos de veto"
                        >
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest ${activeTab === "history" ? "text-indigo-200" : "text-slate-400"}`}>
                                    Total Movimientos
                                </p>
                                <p className={`text-3xl font-black mt-1 tracking-tight ${activeTab === "history" ? "text-white" : "text-indigo-600"}`}>
                                    {stats.total_history_count}
                                </p>
                                <p className={`text-[11px] font-bold mt-1 ${activeTab === "history" ? "text-indigo-200" : "text-slate-500"}`}>
                                    Auditoría completa
                                </p>
                            </div>
                            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border ${
                                activeTab === "history"
                                    ? "bg-white/15 border-white/20 text-white"
                                    : "bg-indigo-50 border-indigo-100 text-indigo-600"
                            }`}>
                                <History className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buscador de Operadores (Filtro para la lista de operadores) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <Search className="w-4 h-4 text-indigo-600" />
                            Buscador de Operadores
                        </span>
                        {(operatorSearch || operatorStatus !== "all") && (
                            <button
                                type="button"
                                onClick={handleClearOperatorFilters}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                Limpiar filtros
                            </button>
                        )}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleApplyOperatorFilters();
                        }}
                        className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative group flex flex-col md:flex-row items-center gap-4"
                    >
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                ref={searchRef}
                                type="text"
                                className="block w-full pl-14 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-0 text-base sm:text-lg font-black placeholder-gray-400 transition-all uppercase tracking-wide"
                                placeholder="BUSCAR POR NOMBRE, LÍNEA, PLACAS, ID O ESCANEAR QR..."
                                value={operatorSearch}
                                onChange={(e) => handleOperatorSearchChange(e.target.value)}
                            />
                            {operatorSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOperatorSearch("");
                                        handleApplyOperatorFilters({ operator_search: "" });
                                    }}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                    title="Borrar texto"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Botón Escanear QR */}
                            <button
                                type="button"
                                onClick={() => setShowQrScanner(true)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-wider border border-indigo-200 shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                title="Abrir cámara para escanear código QR"
                            >
                                <QrCode className="w-4 h-4 text-indigo-600" />
                                <span>Escanear QR</span>
                            </button>

                            <select
                                value={operatorStatus}
                                onChange={(e) => {
                                    const newStatus = e.target.value;
                                    setOperatorStatus(newStatus);
                                    handleApplyOperatorFilters({ operator_status: newStatus });
                                }}
                                className="py-3.5 px-5 bg-gray-50 hover:bg-gray-100 border-none rounded-2xl text-xs sm:text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full md:w-auto"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activos</option>
                                <option value="vetoed">Vetados</option>
                            </select>

                            <button
                                type="submit"
                                className="px-6 py-3.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
                            >
                                Buscar
                            </button>
                        </div>
                    </form>
                </div>

                {/* Operator Details Card (Inspection / Action) */}
                {operator && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-fade-in-up">
                        {/* Status Header */}
                        <div
                            className={`px-8 py-6 flex flex-wrap items-center justify-between gap-4 ${
                                operator.status === "active"
                                    ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white"
                                    : "bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white"
                            }`}
                        >
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-5 backdrop-blur-md border border-white/20 shadow-inner">
                                    <User className="w-9 h-9 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-2xl sm:text-3xl uppercase tracking-tighter leading-none">
                                        {operator.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center mt-2 gap-2">
                                        <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-black tracking-widest border border-white/10 shadow-sm">
                                            ID: {operator.id}
                                        </span>
                                        <span className="text-indigo-200 text-xs font-black uppercase tracking-widest flex items-center">
                                            <CreditCard className="w-4 h-4 mr-1.5 opacity-70" />
                                            LIC: {operator.license || "N/A"}
                                        </span>
                                        {operator.type && (
                                            <span className="bg-indigo-500/30 text-indigo-100 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                                                {operator.type === "vessel" ? "Operador Barco" : "Operador Salidas"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg border-2 ${
                                    operator.status === "active"
                                        ? "bg-green-500/20 text-green-300 border-green-500/40"
                                        : "bg-red-500/20 text-red-200 border-red-500/40 ring-4 ring-red-500/20"
                                }`}
                            >
                                {operator.status === "active" ? "● ESTATUS: ACTIVO" : "● ESTATUS: VETADO"}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="p-8 space-y-8">
                            {/* If Vetado Banner Details */}
                            {operator.status === "vetoed" && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-red-100 text-red-700 rounded-2xl shrink-0">
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-base font-black text-red-900 uppercase tracking-tight">
                                                Restricción Activa: Operador Vetado en Planta
                                            </h4>
                                            <p className="text-xs font-medium text-red-700">
                                                Este operador no tiene permitido el acceso a las instalaciones de Proagroindustria.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-red-200/80">
                                        <div>
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                Motivo Registrado
                                            </p>
                                            <p className="text-sm font-bold text-red-950 mt-0.5 bg-white p-3 rounded-xl border border-red-200">
                                                "{operator.veto_reason || "Veto administrativo general"}"
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                Fecha de Sanción
                                            </p>
                                            <p className="text-sm font-bold text-red-950 mt-0.5">
                                                {formatDate(operator.vetoed_at)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                Sancionado por
                                            </p>
                                            <p className="text-sm font-bold text-red-950 mt-0.5">
                                                {operator.vetoed_by_name || "Personal de Vigilancia"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Operator Information Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-start">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-4 text-indigo-600 shrink-0">
                                                <Truck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    Línea Transportista
                                                </p>
                                                <p className="text-base font-black text-gray-800 uppercase leading-snug">
                                                    {operator.transport_line || "N/A"}
                                                </p>
                                                {operator.real_transport_line && (
                                                    <p className="text-[11px] font-bold text-indigo-500 mt-1 italic">
                                                        Real: {operator.real_transport_line}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-start">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-4 text-indigo-600 shrink-0">
                                                <Truck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    Tipo y Modelo
                                                </p>
                                                <p className="text-base font-black text-gray-800 uppercase leading-snug">
                                                    {operator.unit_type || "N/A"}
                                                </p>
                                                {operator.brand_model && (
                                                    <p className="text-[11px] font-bold text-indigo-500 mt-1 uppercase">
                                                        {operator.brand_model}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-start">
                                            <div className="bg-amber-100 p-3 rounded-xl mr-4 text-amber-600 shrink-0">
                                                <ShieldAlert className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    Póliza de Seguro
                                                </p>
                                                <p className="text-base font-black text-gray-800 uppercase leading-snug">
                                                    {operator.policy || "N/A"}
                                                </p>
                                                <p className="text-[11px] font-bold text-amber-600 mt-1 uppercase">
                                                    Vigencia: {operator.validity?.split("T")[0] || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-start">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-4 text-indigo-600 shrink-0">
                                                <Hash className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    Número Económico
                                                </p>
                                                <p className="text-2xl font-black text-gray-800 uppercase leading-none">
                                                    {operator.economic_number || "S/N"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Plates Cards */}
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl border-2 border-indigo-100/60 relative overflow-hidden shadow-sm">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">
                                            Placa Tracto
                                        </p>
                                        <div className="bg-white border-2 border-slate-700 rounded-xl px-4 py-2 inline-block shadow-inner">
                                            <span className="text-2xl font-black text-slate-900 font-mono tracking-widest">
                                                {operator.tractor_plate || "SIN PLACA"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-3xl border-2 border-slate-200/60 relative overflow-hidden shadow-sm">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                            Placa Remolque
                                        </p>
                                        <div className="bg-white border-2 border-slate-500 rounded-xl px-4 py-2 inline-block shadow-inner">
                                            <span className="text-2xl font-black text-slate-800 font-mono tracking-widest">
                                                {operator.trailer_plate || "SIN REMOLQUE"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-6 border-t border-gray-100">
                                {operator.status === "active" ? (
                                    <button
                                        onClick={() => handleOpenVetoModal(operator)}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <ShieldAlert className="w-6 h-6" />
                                        <span>VETAR A ESTE OPERADOR</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleOpenUnvetoModal(operator)}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <ShieldCheck className="w-6 h-6" />
                                        <span>RETIRAR VETO A ESTE OPERADOR (REACTIVAR ACCESO)</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sub-sections / Tabs: Operadores Vetados Activos vs Historial de Movimientos */}
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    {/* Tabs Header */}
                    <div className="px-6 pt-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setActiveTab("operators_list")}
                                className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all cursor-pointer ${
                                    activeTab === "operators_list"
                                        ? "bg-indigo-900 text-white shadow-lg shadow-indigo-300 -mb-px"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <Truck className="w-4 h-4" />
                                <span>Lista de Operadores</span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                        activeTab === "operators_list"
                                            ? "bg-indigo-800 text-white"
                                            : "bg-indigo-100 text-indigo-700"
                                    }`}
                                >
                                    {all_operators?.total || 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("active_vetoed")}
                                className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all cursor-pointer ${
                                    activeTab === "active_vetoed"
                                        ? "bg-red-600 text-white shadow-lg shadow-red-200 -mb-px"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <ShieldAlert className="w-4 h-4" />
                                <span>Operadores Vetados Actualmente</span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                        activeTab === "active_vetoed"
                                            ? "bg-red-700 text-white"
                                            : "bg-red-100 text-red-700"
                                    }`}
                                >
                                    {vetoed_operators.length}
                                </span>
                            </button>

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all cursor-pointer ${
                                    activeTab === "history"
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 -mb-px"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                                }`}
                            >
                                <History className="w-4 h-4" />
                                <span>Historial de Movimientos de Veto</span>
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                        activeTab === "history"
                                            ? "bg-indigo-700 text-white"
                                            : "bg-indigo-100 text-indigo-700"
                                    }`}
                                >
                                    {history_logs.total || 0}
                                </span>
                            </button>
                        </div>

                        {/* Print Report Tab Action */}
                        <div className="flex items-center pb-2 sm:pb-0">
                            <a
                                href={route("surveillance.veto.report")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                title="Abrir versión para imprimir del padrón de operadores vetados"
                            >
                                <Printer className="w-4 h-4 text-red-600" />
                                <span>Imprimir Reporte</span>
                            </a>
                        </div>
                    </div>

                    {/* Tab: Padrón General / Lista de Operadores */}
                    {activeTab === "operators_list" && (
                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Summary Bar for All Operators */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                                <div className="text-xs font-bold text-slate-500">
                                    Mostrando <span className="font-black text-indigo-950">{all_operators?.from || 0}</span> a <span className="font-black text-indigo-950">{all_operators?.to || 0}</span> de <span className="font-black text-indigo-950">{all_operators?.total || 0}</span> operador(es)
                                    {operatorSearch && (
                                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
                                            Búsqueda: "{operatorSearch}"
                                        </span>
                                    )}
                                    {operatorStatus !== "all" && (
                                        <span className={`ml-2 px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase ${
                                            operatorStatus === "active"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                        }`}>
                                            {operatorStatus === "active" ? "Solo Activos" : "Solo Vetados"}
                                        </span>
                                    )}
                                </div>

                                {(operatorSearch || operatorStatus !== "all") && (
                                    <button
                                        type="button"
                                        onClick={handleClearOperatorFilters}
                                        className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>

                            {/* Operators Table */}
                            {all_operators?.data && all_operators.data.length > 0 ? (
                                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left divide-y divide-slate-200/80">
                                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white text-[10px] font-black uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3.5 text-center w-20">ID</th>
                                                    <th className="px-5 py-3.5">Operador</th>
                                                    <th className="px-5 py-3.5">Línea Trans.</th>
                                                    <th className="px-5 py-3.5">Unidad / Placas</th>
                                                    <th className="px-5 py-3.5 text-center">Estado</th>
                                                    <th className="px-5 py-3.5 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700 bg-white">
                                                {all_operators.data.map((op) => (
                                                    <tr key={op.id} className="hover:bg-indigo-50/40 transition-colors">
                                                        {/* ID */}
                                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                                            <span className="font-mono font-black text-indigo-900 bg-indigo-50 border border-indigo-200/80 px-2 py-1 rounded-lg text-xs">
                                                                #{op.id}
                                                            </span>
                                                        </td>

                                                        {/* Operador */}
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0 uppercase shadow-xs">
                                                                    {op.name.charAt(0)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-black text-slate-900 uppercase text-xs truncate max-w-xs">
                                                                        {op.name}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                                                        Lic: {op.license || "N/A"}
                                                                    </p>
                                                                    {op.clients && op.clients.length > 0 && (
                                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                                            <span
                                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                                                title={op.clients.map(c => c.business_name).join(', ')}
                                                                            >
                                                                                <Building2 className="w-2.5 h-2.5" />
                                                                                {op.clients.length === 1
                                                                                    ? op.clients[0].business_name
                                                                                    : `${op.clients.length} clientes`}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Línea Trans */}
                                                        <td className="px-5 py-3">
                                                            <div className="font-bold text-slate-800 uppercase text-xs">
                                                                {op.transport_line || "N/A"}
                                                            </div>
                                                            {op.real_transport_line && (
                                                                <div className="text-[10px] text-slate-400 italic">
                                                                    Real: {op.real_transport_line}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Unidad / Placas */}
                                                        <td className="px-5 py-3 whitespace-nowrap">
                                                            <div className="text-xs font-semibold text-slate-700">
                                                                {op.unit_type || "N/A"} {op.brand_model ? `- ${op.brand_model}` : ""}
                                                            </div>
                                                            <div className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5">
                                                                Tracto: <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200">{op.tractor_plate || "S/P"}</span>
                                                                {op.trailer_plate && (
                                                                    <span className="ml-1 text-slate-500">
                                                                        | Rem: <span className="bg-slate-50 px-1 py-0.2 rounded border border-slate-200 font-medium">{op.trailer_plate}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Estado */}
                                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                                            {op.status === "active" ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs">
                                                                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                                    ACTIVO
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs">
                                                                    <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                                                    VETADO
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Acciones */}
                                                        <td className="px-5 py-3 text-center whitespace-nowrap">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {op.status === "active" ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenVetoModal(op)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs shadow-rose-200 transition-all cursor-pointer"
                                                                        title="Aplicar veto de acceso a planta"
                                                                    >
                                                                        <ShieldAlert className="w-3.5 h-3.5" />
                                                                        <span>Vetar</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenUnvetoModal(op)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs shadow-emerald-200 transition-all cursor-pointer"
                                                                        title="Retirar veto y reactivar acceso"
                                                                    >
                                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                                        <span>Activar</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectOperator(op)}
                                                                    className="inline-flex items-center p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                                                    title="Inspeccionar detalles del operador"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {all_operators.links && all_operators.links.length > 3 && (
                                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                            <Pagination links={all_operators.links} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
                                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                        <Truck className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                        No se encontraron operadores
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                                        No hay registros de operadores que coincidan con los filtros aplicados.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Operadores Vetados Actualmente */}
                    {activeTab === "active_vetoed" && (

                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Filter Bar for Active Vetoed */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="relative w-full sm:w-96">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Filtrar por nombre, placas o línea..."
                                        value={activeVetoFilter}
                                        onChange={(e) => setActiveVetoFilter(e.target.value)}
                                    />
                                    {activeVetoFilter && (
                                        <button
                                            onClick={() => setActiveVetoFilter("")}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="text-xs font-bold text-slate-500">
                                    Mostrando {filteredActiveVetoed.length} de {vetoed_operators.length} operador(es) vetado(s)
                                </div>
                            </div>

                            {/* Table of Active Vetoed */}
                            {filteredActiveVetoed.length > 0 ? (
                                <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-left divide-y divide-slate-200/80">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-5 py-3.5 w-[26%]">Operador & Identificación</th>
                                                <th className="px-5 py-3.5 w-[24%]">Línea & Unidad / Placas</th>
                                                <th className="px-5 py-3.5 w-[33%]">Detalle & Registro del Veto</th>
                                                <th className="px-5 py-3.5 w-[17%] text-right whitespace-nowrap">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredActiveVetoed.map((op) => (
                                                <tr
                                                    key={op.id}
                                                    className="hover:bg-red-50/30 transition-colors group"
                                                >
                                                    {/* 1. Operador & Gafete */}
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="flex items-start gap-3">
                                                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black bg-red-100 text-red-800 border border-red-200 shrink-0 shadow-xs">
                                                                #{op.id}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="font-black text-slate-900 text-sm uppercase leading-snug break-words">
                                                                    {op.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                                                    Lic: <span className="font-mono text-slate-700">{op.license || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 2. Línea & Unidad / Placas */}
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-1.5">
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-800 uppercase leading-snug break-words">
                                                                    {op.transport_line || "SIN LÍNEA"}
                                                                </div>
                                                                {op.real_transport_line && (
                                                                    <div className="text-[11px] font-medium text-slate-500 uppercase italic mt-0.5 break-words">
                                                                        Real: {op.real_transport_line}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-mono text-xs font-black flex-wrap">
                                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                                                    {op.tractor_plate || "S/P"}
                                                                </span>
                                                                {op.trailer_plate && (
                                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                                        {op.trailer_plate}
                                                                    </span>
                                                                )}
                                                                {op.economic_number && (
                                                                    <span className="text-[11px] font-bold text-slate-500 font-sans">
                                                                        Econ: {op.economic_number}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 3. Detalle del Veto */}
                                                    <td className="px-5 py-4 align-top">
                                                        <div className="space-y-1.5">
                                                            <div className="bg-red-50/80 text-red-900 p-2.5 rounded-xl text-xs font-semibold border border-red-200/80 leading-relaxed break-words">
                                                                "{op.veto_reason || "Veto administrativo"}"
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 flex-wrap">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    {formatDate(op.vetoed_at)}
                                                                </span>
                                                                <span>•</span>
                                                                <span>Por: <strong className="text-slate-700">{op.vetoed_by_name || "Vigilancia"}</strong></span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 4. Acciones */}
                                                    <td className="px-5 py-4 align-top text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setOperator(op);
                                                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                                                }}
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-xs"
                                                                title="Ver ficha completa arriba"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                <span>Ver</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenUnvetoModal(op)}
                                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/60 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                                                            >
                                                                <ShieldCheck className="w-4 h-4" />
                                                                <span>Retirar Veto</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-200 space-y-3">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">
                                        {activeVetoFilter
                                            ? "Sin coincidencias en el filtro"
                                            : "No hay operadores vetados actualmente"}
                                    </h3>
                                    <p className="text-sm font-medium text-emerald-700 max-w-md mx-auto">
                                        {activeVetoFilter
                                            ? "Intenta con otro término de búsqueda o limpia el filtro."
                                            : "Todos los operadores registrados cuentan con autorización de acceso vigente."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Historial Completo de Movimientos de Veto */}
                    {activeTab === "history" && (
                        <div className="p-6 sm:p-8 space-y-6">
                            {/* Filter Toolbar */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
                                        <Filter className="w-3.5 h-3.5 text-indigo-600" />
                                        Filtros de Búsqueda en Bitácora
                                    </span>
                                    {(historySearch || actionFilter !== "all" || dateFrom || dateTo) && (
                                        <button
                                            onClick={handleClearHistoryFilters}
                                            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Restablecer filtros
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {/* Text Search */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Buscar Operador / Placa / Motivo
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Nombre, placa, motivo, usuario..."
                                                value={historySearch}
                                                onChange={(e) => setHistorySearch(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleApplyHistoryFilters()}
                                            />
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Action Filter */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Tipo de Movimiento
                                        </label>
                                        <select
                                            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                            value={actionFilter}
                                            onChange={(e) => setActionFilter(e.target.value)}
                                        >
                                            <option value="all">Todos los movimientos</option>
                                            <option value="vetoed">Solo Vetos Aplicados</option>
                                            <option value="unvetoed">Solo Retiros de Veto</option>
                                        </select>
                                    </div>

                                    {/* Date From */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Desde
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                                            Hasta
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                            />
                                            <button
                                                onClick={handleApplyHistoryFilters}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm"
                                            >
                                                Filtrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            {history_logs.data && history_logs.data.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left divide-y divide-slate-200/80">
                                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                <tr>
                                                    <th className="px-5 py-3.5 w-[20%]">Movimiento & Fecha</th>
                                                    <th className="px-5 py-3.5 w-[22%]">Operador & Identificación</th>
                                                    <th className="px-5 py-3.5 w-[22%]">Línea & Unidad / Placas</th>
                                                    <th className="px-5 py-3.5 w-[24%]">Motivo / Causa</th>
                                                    <th className="px-5 py-3.5 w-[12%] text-right whitespace-nowrap">Usuario</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {history_logs.data.map((log) => (
                                                    <tr
                                                        key={log.id}
                                                        className="hover:bg-slate-50/70 transition-colors"
                                                    >
                                                        {/* 1. Movimiento & Fecha */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <div>
                                                                    {log.action === "vetoed" ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-700 border border-red-200 shadow-xs">
                                                                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                                                                            <span>Veto Aplicado</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs">
                                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                                            <span>Veto Retirado</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                    <span>{formatDate(log.created_at)}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 2. Operador & Identificación */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="flex items-start gap-2.5">
                                                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                                                    #{log.operator_id}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <div className="font-black text-slate-900 text-xs uppercase leading-snug break-words">
                                                                        {log.operator_name}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                                                        Lic: <span className="font-mono text-slate-700">{log.license || "N/A"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 3. Línea & Unidad / Placas */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div className="space-y-1.5">
                                                                <div className="text-xs font-bold text-slate-800 uppercase leading-snug break-words">
                                                                    {log.transport_line || "SIN LÍNEA"}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 font-mono text-xs font-black flex-wrap">
                                                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                                                        {log.tractor_plate || "S/P"}
                                                                    </span>
                                                                    {log.trailer_plate && (
                                                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                                            {log.trailer_plate}
                                                                        </span>
                                                                    )}
                                                                    {log.economic_number && (
                                                                        <span className="text-[11px] font-bold text-slate-500 font-sans">
                                                                            Econ: {log.economic_number}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* 4. Motivo / Causa */}
                                                        <td className="px-5 py-4 align-top">
                                                            <div
                                                                className={`p-2.5 rounded-xl text-xs font-semibold border leading-relaxed break-words ${
                                                                    log.action === "vetoed"
                                                                        ? "bg-red-50/70 border-red-200/80 text-red-950"
                                                                        : "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
                                                                }`}
                                                            >
                                                                "{log.reason || "Sin motivo especificado"}"
                                                            </div>
                                                        </td>

                                                        {/* 5. Usuario Responsable */}
                                                        <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs shadow-xs">
                                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{log.user?.name || "Sistema"}</span>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {history_logs.links && (
                                        <Pagination links={history_logs.links} />
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
                                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                        <History className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                        No hay registros en el historial
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
                                        No se encontraron eventos en la bitácora con los filtros seleccionados.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal 1: Confirmar VETO de Operador */}
            <Modal
                show={vetoModalOpen}
                onClose={() => !submitting && setVetoModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                Vetar Operador
                            </h3>
                            <p className="text-slate-500 text-xs font-semibold">
                                Restricción de acceso permanente a planta hasta autorización de retiro.
                            </p>
                        </div>
                    </div>

                    {/* Operator Summary Card */}
                    {targetOperator && (
                        <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">
                                        {targetOperator.name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Línea: {targetOperator.transport_line}
                                    </p>
                                </div>
                                <span className="bg-red-100 text-red-800 text-xs font-black px-2.5 py-1 rounded-lg">
                                    ID #{targetOperator.id}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-red-200/60 font-mono text-xs font-bold text-slate-700">
                                <span>Tracto: {targetOperator.tractor_plate || "S/P"}</span>
                                {targetOperator.trailer_plate && (
                                    <span>• Remolque: {targetOperator.trailer_plate}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reason Textarea */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Motivo o Causa del Veto <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Describa el motivo o incidente por el cual se aplica el veto..."
                            value={modalReason}
                            onChange={(e) => setModalReason(e.target.value)}
                        />
                    </div>

                    {/* Warning Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            Esta acción se asentará de forma inmediata en la bitácora con su usuario responsable ({auth.user?.name}).
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setVetoModalOpen(false)}
                            className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleConfirmVeto}
                            className="px-6 py-3 rounded-xl font-black text-sm uppercase bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            <span>{submitting ? "Procesando..." : "Confirmar Veto"}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal 2: Confirmar RETIRO DE VETO de Operador */}
            <Modal
                show={unvetoModalOpen}
                onClose={() => !submitting && setUnvetoModalOpen(false)}
                maxWidth="lg"
            >
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                Retirar Veto a Operador
                            </h3>
                            <p className="text-slate-500 text-xs font-semibold">
                                Reactivación de estatus a ACTIVO para autorizar ingreso a planta.
                            </p>
                        </div>
                    </div>

                    {/* Operator Summary Card */}
                    {targetOperator && (
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase">
                                        {targetOperator.name}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Línea: {targetOperator.transport_line}
                                    </p>
                                </div>
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-lg">
                                    ID #{targetOperator.id}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60 font-mono text-xs font-bold text-slate-700">
                                <span>Tracto: {targetOperator.tractor_plate || "S/P"}</span>
                                {targetOperator.trailer_plate && (
                                    <span>• Remolque: {targetOperator.trailer_plate}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Justification Textarea */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                            Justificación / Motivo del Retiro de Veto <span className="text-emerald-600">*</span>
                        </label>
                        <textarea
                            rows={4}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Describa el motivo, acuerdo o autorización por el cual se levanta la sanción..."
                            value={modalReason}
                            onChange={(e) => setModalReason(e.target.value)}
                        />
                    </div>

                    {/* Information Notice */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs font-bold text-emerald-800">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                            El operador quedará habilitado inmediatamente para escaneo y registro de acceso en caseta.
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setUnvetoModalOpen(false)}
                            className="px-5 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleConfirmUnveto}
                            className="px-6 py-3 rounded-xl font-black text-sm uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{submitting ? "Procesando..." : "Confirmar y Levantar Veto"}</span>
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Escáner QR de Cámara */}
            <QrScannerModal
                isOpen={showQrScanner}
                onClose={() => setShowQrScanner(false)}
                onScan={handleQrScan}
                title="Escanear Código QR de Operador"
            />
        </DashboardLayout>
    );
}
