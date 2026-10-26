import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Search,
    RefreshCw,
    Truck,
    Clock,
    CheckCircle2,
    Hourglass,
    Warehouse,
    Package,
    Edit3,
    X,
    Save,
    Filter,
    Calendar,
    AlertCircle,
    FileSpreadsheet,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";

interface UnitRow {
    id: string;
    folio: string;
    tractor_plate: string;
    trailer_plate: string;
    operator_name: string;
    transport_company: string;
    client: string;
    programmed_tons: number;
    product: string;
    presentation: string;
    packaging: string;
    warehouse: string;
    lot_location: string;
    loading_date: string;
    status_key: string;
    status_label: string;
    status_color: string;
    observations: string;
    created_at: string;
}

interface PageProps {
    auth: any;
    units: UnitRow[];
    all_units?: UnitRow[];
    filters: {
        search: string;
        status: string;
        date?: string;
    };
    stats: {
        total: number;
        in_plant: number;
        completed: number;
        total_tons: number;
    };
}

export default function Index({ auth, units, all_units, filters, stats }: PageProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
    const [selectedDate, setSelectedDate] = useState(filters.date || "");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal para observaciones manuales
    const [editingUnit, setEditingUnit] = useState<UnitRow | null>(null);
    const [obsText, setObsText] = useState("");
    const [isSavingObs, setIsSavingObs] = useState(false);

    // Conjunto base de unidades
    const [allUnits, setAllUnits] = useState<UnitRow[]>(all_units && all_units.length > 0 ? all_units : units);

    // Sincronizar unidades al recibir nuevas props
    useEffect(() => {
        setAllUnits(all_units && all_units.length > 0 ? all_units : units);
    }, [all_units, units]);

    // Obtener ruta base relativa segura sin depender de APP_URL o Ziggy
    const getBaseUrl = () => {
        if (typeof window !== "undefined") {
            return window.location.pathname.replace(/\/+$/, "");
        }
        return "/traffic/unit-status";
    };

    // Filtrado reactivo e instantáneo en cliente (0ms de latencia, inmune a diferencias de dominio)
    const displayedUnits = useMemo(() => {
        return allUnits.filter((row) => {
            // Filtro por estatus
            if (selectedStatus !== "all" && row.status_key !== selectedStatus) {
                return false;
            }

            // Filtro por texto de búsqueda
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const matchesFolio = (row.folio || "").toLowerCase().includes(q);
                const matchesTractor = (row.tractor_plate || "").toLowerCase().includes(q);
                const matchesTrailer = (row.trailer_plate || "").toLowerCase().includes(q);
                const matchesOperator = (row.operator_name || "").toLowerCase().includes(q);
                const matchesClient = (row.client || "").toLowerCase().includes(q);
                const matchesProduct = (row.product || "").toLowerCase().includes(q);
                const matchesTransport = (row.transport_company || "").toLowerCase().includes(q);
                const matchesWarehouse = (row.warehouse || "").toLowerCase().includes(q);
                const matchesLot = (row.lot_location || "").toLowerCase().includes(q);
                const matchesObs = (row.observations || "").toLowerCase().includes(q);

                if (
                    !matchesFolio &&
                    !matchesTractor &&
                    !matchesTrailer &&
                    !matchesOperator &&
                    !matchesClient &&
                    !matchesProduct &&
                    !matchesTransport &&
                    !matchesWarehouse &&
                    !matchesLot &&
                    !matchesObs
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [allUnits, selectedStatus, search]);

    // Recargar datos
    const refreshData = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    // Exportar reporte a Excel con ruta relativa segura
    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);
        if (selectedDate) params.append("date", selectedDate);
        const queryStr = params.toString();
        window.location.href = `${getBaseUrl()}/export${queryStr ? `?${queryStr}` : ""}`;
    };

    // Cambio instantáneo de estatus al hacer clic en cualquier botón
    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        try {
            const url = new URL(window.location.href);
            if (status && status !== "all") {
                url.searchParams.set("status", status);
            } else {
                url.searchParams.delete("status");
            }
            window.history.replaceState({}, "", url.toString());
        } catch (e) {}
    };

    // Aplicar filtro de fecha desde el servidor usando ruta relativa
    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        router.get(
            window.location.pathname,
            {
                search: search,
                status: selectedStatus,
                date: date,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            try {
                const url = new URL(window.location.href);
                if (search.trim()) {
                    url.searchParams.set("search", search.trim());
                } else {
                    url.searchParams.delete("search");
                }
                window.history.replaceState({}, "", url.toString());
            } catch (err) {}
        }
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedStatus("all");
        try {
            const url = new URL(window.location.href);
            url.search = "";
            window.history.replaceState({}, "", url.toString());
        } catch (e) {}

        if (selectedDate) {
            setSelectedDate("");
            router.get(window.location.pathname, {}, { preserveState: true, replace: true });
        }
    };

    // Modal de observaciones
    const openEditModal = (unit: UnitRow) => {
        setEditingUnit(unit);
        setObsText(unit.observations || "");
    };

    const closeEditModal = () => {
        setEditingUnit(null);
        setObsText("");
    };

    const handleSaveObservations = async () => {
        if (!editingUnit) return;
        setIsSavingObs(true);
        try {
            await axios.patch(
                `${getBaseUrl()}/${editingUnit.id}/observations`,
                { observations: obsText },
                { headers: { Accept: "application/json" } }
            );

            // Actualizar en el estado local inmediatamente
            setAllUnits((prev) =>
                prev.map((u) =>
                    u.id === editingUnit.id ? { ...u, observations: obsText } : u
                )
            );
            closeEditModal();
        } catch (error) {
            console.error("Error al guardar observaciones:", error);
            alert("No se pudo guardar la observación. Por favor intenta de nuevo.");
        } finally {
            setIsSavingObs(false);
        }
    };

    // Formateador de Toneladas con punto decimal
    const formatTonnes = (val: number) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(val || 0);

    // Status badge helper
    const renderStatusBadge = (color: string, label: string) => {
        const colorClasses: Record<string, string> = {
            red: "bg-red-50 text-red-700 border-red-200",
            amber: "bg-amber-50 text-amber-800 border-amber-200",
            purple: "bg-purple-50 text-purple-700 border-purple-200",
            indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
            blue: "bg-blue-50 text-blue-700 border-blue-200",
            emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
        const cls = colorClasses[color] || "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls}`}
            >
                {label}
            </span>
        );
    };

    const statusTabs = [
        { key: "all", label: "Todas" },
        { key: "pending_entry", label: "Por Ingresar" },
        { key: "in_plant", label: "En Planta" },
        { key: "tared", label: "Tara Báscula" },
        { key: "loading", label: "Cargando" },
        { key: "loaded", label: "Cargadas" },
        { key: "completed", label: "Destaradas" },
    ];

    return (
        <DashboardLayout user={auth.user} header="Estatus de Unidades">
            <Head title="Estatus de Unidades - Tráfico" />

            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 8mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="py-5 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 space-y-4 font-sans print:p-0 print:m-0 print:max-w-none">
                {/* Print-Only Header */}
                <div className="hidden print:block mb-4 border-b-2 border-slate-800 pb-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                PROAGROINDUSTRIA - ESTATUS DE UNIDADES
                            </h1>
                            <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                Reporte de trazabilidad y monitoreo operativo de carga en planta
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-700">
                            <p className="font-bold">
                                Fecha de emisión: {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-1">
                                Total: <strong>{stats.total}</strong> | En Planta: <strong>{stats.in_plant}</strong> | Destaradas: <strong>{stats.completed}</strong> | Tons: <strong>{formatTonnes(stats.total_tons)} TM</strong>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-lg print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                            <Truck className="w-7 h-7 text-blue-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Link
                                    href={route("traffic.index")}
                                    className="text-xs text-blue-200 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Volver a Tráfico
                                </Link>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                                Estatus de Unidades
                            </h1>
                            <p className="text-blue-200 text-[11px] font-bold uppercase tracking-wider">
                                Monitoreo y trazabilidad de carga en planta
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="p-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl transition-all border border-emerald-400/30 flex items-center gap-2 text-xs font-bold shadow-sm"
                            title="Exportar reporte de estatus a Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                            <span>Exportar Excel</span>
                        </button>

                        <button
                            onClick={refreshData}
                            className={`p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 flex items-center gap-2 text-xs font-bold ${
                                isRefreshing ? "opacity-50" : ""
                            }`}
                            title="Actualizar datos"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                            <span>Actualizar</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Total Unidades
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-2xl md:text-3xl font-black text-gray-800">
                                {stats.total}
                            </span>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                Registros
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-amber-500">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            En Planta / Proceso
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-2xl md:text-3xl font-black text-amber-600">
                                {stats.in_plant}
                            </span>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                Activas
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-emerald-500">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Destaradas / Concluidas
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-2xl md:text-3xl font-black text-emerald-600">
                                {stats.completed}
                            </span>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Salida OK
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-indigo-600">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Tons. Programadas
                        </span>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-xl md:text-2xl font-black text-indigo-700 truncate">
                                {formatTonnes(stats.total_tons)}
                            </span>
                            <span className="text-xs font-black text-indigo-500">TM</span>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4 print:hidden">
                    <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                        {/* Search Input */}
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar por OE, Cliente o Producto..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        try {
                                            const url = new URL(window.location.href);
                                            url.searchParams.delete("search");
                                            window.history.replaceState({}, "", url.toString());
                                        } catch (e) {}
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Date Filter & Search Action */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>Fecha:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="border-none bg-transparent p-0 text-xs font-bold text-gray-700 focus:ring-0"
                                />
                                {selectedDate && (
                                    <button
                                        type="button"
                                        onClick={() => handleDateChange("")}
                                        className="text-gray-400 hover:text-red-500 ml-1"
                                        title="Quitar filtro de fecha"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        const url = new URL(window.location.href);
                                        if (search.trim()) {
                                            url.searchParams.set("search", search.trim());
                                        } else {
                                            url.searchParams.delete("search");
                                        }
                                        window.history.replaceState({}, "", url.toString());
                                    } catch (e) {}
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                            >
                                Buscar
                            </button>

                            {(search || selectedStatus !== "all" || selectedDate) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 border-t border-gray-100 text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mr-2 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Estatus:
                        </span>
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleStatusChange(tab.key)}
                                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    selectedStatus === tab.key
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border print:border-gray-300 print:rounded-none print:shadow-none">
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full table-auto divide-y divide-gray-100 text-[11px] print:text-[10px]">
                            <thead className="bg-slate-900 text-white print:bg-slate-100 print:text-black">
                                <tr>
                                    <th className="px-2.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        # OE
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px]">
                                        Cliente
                                    </th>
                                    <th className="px-2 py-2.5 text-right font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        TM
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px]">
                                        Producto
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        Envases
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        Almacén
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px]">
                                        Ubicación de Lote
                                    </th>
                                    <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        Fecha de Carga
                                    </th>
                                    <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">
                                        Estatus
                                    </th>
                                    <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[10px]">
                                        Observaciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {displayedUnits.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-blue-50/40 transition-colors duration-100 print:hover:bg-transparent"
                                    >
                                        {/* OE Folio */}
                                        <td className="px-2.5 py-2 whitespace-nowrap">
                                            <span className="font-mono font-bold text-blue-700 block text-xs print:text-[10px] print:text-black">
                                                {row.folio}
                                            </span>
                                            {row.folio === "Sin Documentar" && row.tractor_plate && row.tractor_plate !== "---" && (
                                                <span className="text-[10px] text-gray-500 font-mono font-semibold block">
                                                    {row.tractor_plate}
                                                </span>
                                            )}
                                        </td>

                                        {/* Cliente */}
                                        <td
                                            className="px-2 py-2 font-semibold text-gray-800 max-w-[140px] 2xl:max-w-[210px] truncate print:max-w-none print:whitespace-normal"
                                            title={row.client}
                                        >
                                            {row.client}
                                        </td>

                                        {/* TM */}
                                        <td className="px-2 py-2 text-right font-black text-gray-900 whitespace-nowrap">
                                            {formatTonnes(row.programmed_tons)}
                                        </td>

                                        {/* Producto */}
                                        <td
                                            className="px-2 py-2 text-gray-700 font-medium max-w-[130px] 2xl:max-w-[190px] truncate print:max-w-none print:whitespace-normal"
                                            title={row.product}
                                        >
                                            {row.product}
                                        </td>

                                        {/* Envases / Presentación */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase print:bg-transparent print:p-0 print:border print:border-gray-200">
                                                {row.packaging}
                                            </span>
                                        </td>

                                        {/* Almacén */}
                                        <td className="px-2 py-2 whitespace-nowrap">
                                            {row.warehouse !== "Pendiente" ? (
                                                <span className="inline-flex items-center gap-1 font-bold text-indigo-700 print:text-black">
                                                    <Warehouse className="w-3 h-3 text-indigo-500 print:hidden" />
                                                    {row.warehouse}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>

                                        {/* Ubicación de Lote */}
                                        <td
                                            className="px-2 py-2 whitespace-nowrap text-gray-700 font-medium max-w-[120px] 2xl:max-w-[170px] truncate print:max-w-none print:whitespace-normal"
                                            title={row.lot_location}
                                        >
                                            {row.lot_location !== "Sin asignar" ? (
                                                <span className="font-bold text-gray-800">
                                                    {row.lot_location}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Sin asignar
                                                </span>
                                            )}
                                        </td>

                                        {/* Fecha de Carga */}
                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            {row.loading_date !== "Pendiente" ? (
                                                <span className="font-mono text-gray-700 font-bold bg-gray-100 px-1.5 py-0.5 rounded text-[10px] print:bg-transparent print:p-0">
                                                    {row.loading_date}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>

                                        {/* Estatus */}
                                        <td className="px-2 py-2 text-center whitespace-nowrap">
                                            {renderStatusBadge(
                                                row.status_color,
                                                row.status_label
                                            )}
                                        </td>

                                        {/* Observaciones (Manuales) */}
                                        <td className="px-2 py-2 max-w-[140px] 2xl:max-w-[220px]">
                                            <div className="flex items-center justify-between gap-1 group">
                                                <span
                                                    className={`text-[11px] truncate max-w-[110px] 2xl:max-w-[190px] print:max-w-none print:whitespace-normal ${
                                                        row.observations
                                                            ? "text-gray-700 font-medium"
                                                            : "text-gray-300 italic"
                                                    }`}
                                                    title={row.observations || "Sin observaciones"}
                                                >
                                                    {row.observations || "Sin notas"}
                                                </span>
                                                <button
                                                    onClick={() => openEditModal(row)}
                                                    className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0 print:hidden"
                                                    title="Editar observación manual"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {displayedUnits.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-6 py-16 text-center text-gray-400"
                                        >
                                            <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                            <p className="font-bold text-sm">
                                                No se encontraron unidades con los filtros seleccionados
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Intenta modificando el término de búsqueda o limpiando los filtros.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap justify-between items-center text-xs text-gray-500 print:hidden">
                        <span>
                            Mostrando{" "}
                            <strong className="text-gray-700">
                                {displayedUnits.length}
                            </strong>{" "}
                            unidades
                        </span>
                        <span className="font-semibold text-gray-600">
                            * Por Ingresar: Pasó por vigilancia pero no se ha documentado. En Planta: Pasó por vigilancia y ya se documentó.
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal de Observaciones Manuales */}
            {editingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
                            <div>
                                <h3 className="font-black text-gray-900 text-base">
                                    Observaciones Manuales
                                </h3>
                                <p className="text-xs font-bold text-blue-600">
                                    OE: {editingUnit.folio} • Placas:{" "}
                                    {editingUnit.tractor_plate}
                                </p>
                            </div>
                            <button
                                onClick={closeEditModal}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Escribe las notas u observaciones para Tráfico
                                </label>
                                <textarea
                                    rows={4}
                                    value={obsText}
                                    onChange={(e) => setObsText(e.target.value)}
                                    placeholder="Ej. Unidad en espera de documentación adicional, cambio de chofer, etc."
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">
                                    Estas observaciones son manuales y exclusivas para el seguimiento de la unidad.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={isSavingObs}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveObservations}
                                disabled={isSavingObs}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{isSavingObs ? "Guardando..." : "Guardar Observación"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
