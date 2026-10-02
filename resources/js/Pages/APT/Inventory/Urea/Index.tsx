import React, { useState, useEffect, useMemo, FormEventHandler } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage, useForm } from "@inertiajs/react";
import {
    Search,
    ArrowLeft,
    Plus,
    X,
    Database,
    Factory,
    Clock,
    TrendingUp,
    BarChart3,
    Boxes,
    Save,
    RotateCcw,
    ShieldCheck,
    Edit,
    Trash2,
    Filter,
} from "lucide-react";
import Swal from "sweetalert2";

interface DailyProduction {
    id: number;
    date: string;
    shift: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
    packaging: string;
    quantity_tons: string | number;
    sacks_count?: number;
    lot_folio?: string;
    supervisor_name?: string;
    notes?: string;
    user?: {
        name: string;
    };
    created_at: string;
}

interface InitialInventory {
    id: number;
    date: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
    packaging: string;
    quantity_tons: string | number;
    sacks_count?: number;
    lot_folio?: string;
    notes?: string;
    user?: {
        name: string;
    };
    created_at: string;
}

interface Metrics {
    operationalDate?: string;
    totalInitialTons: number;
    totalInitialSacks: number;
    totalDailyTons: number;
    totalDailySacks: number;
    todayProductionTons: number;
    todayProductionSacks: number;
    totalStockTons: number;
    totalStockSacks: number;
    byPlant: {
        [key: string]: {
            initial_tons: number;
            daily_tons: number;
            total_tons: number;
        };
    };
    byWarehouse: {
        [key: string]: {
            name: string;
            initial_tons: number;
            daily_tons: number;
            total_tons: number;
        };
    };
}

interface LotOption {
    id: string;
    folio: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
}

interface PageProps {
    auth: any;
    tab?: "production" | "initial" | "summary";
    operationalDate?: string;
    dailyProductions: {
        data: DailyProduction[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    initialInventories: {
        data: InitialInventory[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    metrics: Metrics;
    lots: LotOption[];
    filters: {
        search?: string;
        warehouse?: string;
        plant_origin?: string;
        date_from?: string;
        date_to?: string;
        shift?: string;
        tab?: string;
    };
}

const PACKAGING_OPTIONS = [
    "Granel",
    "Sacos 25 Kg",
    "Sacos 50 Kg",
    "Big Bag 1000 Kg",
    "Jumbo 1.5 TM",
];

const SHIFT_OPTIONS = [
    "Turno 1 (07:00 - 15:00)",
    "Turno 2 (15:00 - 23:00)",
    "Turno 3 (23:00 - 07:00)",
    "Turno Especial / Mixto",
];

export default function UreaInventoryIndex({
    auth,
    tab: initialTab = "production",
    operationalDate,
    dailyProductions,
    initialInventories,
    metrics,
    lots = [],
    filters = {},
}: PageProps) {
    const { flash } = usePage<any>().props;
    const requestedTab = typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("tab") as "production" | "initial" | "summary" | null)
        : null;
    const [activeTab, setActiveTab] = useState<"production" | "initial" | "summary">(
        requestedTab || initialTab || (filters?.tab as any) || "production"
    );

    // Search and filter state
    const [search, setSearch] = useState(filters?.search || "");
    const [warehouseFilter, setWarehouseFilter] = useState(filters?.warehouse || "");
    const [plantFilter, setPlantFilter] = useState(filters?.plant_origin || "");
    const [shiftFilter, setShiftFilter] = useState(filters?.shift || "");
    const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
    const [dateTo, setDateTo] = useState(filters?.date_to || "");

    // Modal States
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
    const [editingDaily, setEditingDaily] = useState<DailyProduction | null>(null);

    const [isInitialModalOpen, setIsInitialModalOpen] = useState(false);
    const [editingInitial, setEditingInitial] = useState<InitialInventory | null>(null);

    // Helper: Determinar la fecha operativa con corte a las 5:00 AM
    const getOperationalDate = () => {
        if (operationalDate) return operationalDate;
        if (metrics?.operationalDate) return metrics.operationalDate;
        const now = new Date();
        if (now.getHours() < 5) {
            now.setDate(now.getDate() - 1);
        }
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Daily Production Form
    const dailyForm = useForm({
        date: getOperationalDate(),
        shift: "Turno 1",
        warehouse: "Almacen 1",
        cubicle: "",
        plant_origin: "UREA 1",
        packaging: "Granel",
        quantity_tons: "",
        sacks_count: "",
        lot_folio: "",
        supervisor_name: auth?.user?.name || "",
        notes: "",
    });

    // Initial Inventory Form
    const initialForm = useForm({
        date: getOperationalDate(),
        warehouse: "Almacen 1",
        cubicle: "",
        plant_origin: "UREA 1",
        packaging: "Granel",
        quantity_tons: "",
        sacks_count: "",
        lot_folio: "",
        notes: "",
    });

    const cleanParams = (params: Record<string, any>) => {
        const result: Record<string, any> = {};
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== "") {
                result[key] = val;
            }
        });
        return result;
    };

    // Handle filter application
    const applyFilters = (overrides = {}) => {
        const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
        const query = cleanParams({
            tab: activeTab,
            search,
            warehouse: warehouseFilter,
            plant_origin: plantFilter,
            shift: shiftFilter,
            date_from: dateFrom,
            date_to: dateTo,
            from,
            ...overrides,
        });

        router.get(route("apt.inventory.urea.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTabChange = (newTab: "production" | "initial" | "summary") => {
        setActiveTab(newTab);
        applyFilters({ tab: newTab });
    };

    const resetFilters = () => {
        setSearch("");
        setWarehouseFilter("");
        setPlantFilter("");
        setShiftFilter("");
        setDateFrom("");
        setDateTo("");
        const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
        router.get(route("apt.inventory.urea.index"), cleanParams({ tab: activeTab, from }), {
            preserveState: true,
        });
    };

    // Open Daily Production Modal (Create or Edit)
    const openDailyModal = (item?: DailyProduction) => {
        if (item) {
            setEditingDaily(item);
            dailyForm.setData({
                date: item.date ? item.date.substring(0, 10) : "",
                shift: item.shift || "Turno 1",
                warehouse: item.warehouse,
                cubicle: item.cubicle || "",
                plant_origin: item.plant_origin,
                packaging: item.packaging || "Granel",
                quantity_tons: String(item.quantity_tons),
                sacks_count: item.sacks_count ? String(item.sacks_count) : "",
                lot_folio: item.lot_folio || "",
                supervisor_name: item.supervisor_name || auth?.user?.name || "",
                notes: item.notes || "",
            });
        } else {
            setEditingDaily(null);
            dailyForm.setData({
                date: getOperationalDate(),
                shift: "Turno 1",
                warehouse: "Almacen 1",
                cubicle: "",
                plant_origin: "UREA 1",
                packaging: "Granel",
                quantity_tons: "",
                sacks_count: "",
                lot_folio: "",
                supervisor_name: auth?.user?.name || "",
                notes: "",
            });
        }
        setIsDailyModalOpen(true);
    };

    // Submit Daily Production
    const handleDailySubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingDaily) {
            dailyForm.put(route("apt.inventory.urea.daily.update", editingDaily.id), {
                onSuccess: () => {
                    setIsDailyModalOpen(false);
                    setEditingDaily(null);
                    Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: "Producción diaria actualizada correctamente",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        } else {
            dailyForm.post(route("apt.inventory.urea.daily.store"), {
                onSuccess: () => {
                    setIsDailyModalOpen(false);
                    dailyForm.reset();
                    Swal.fire({
                        icon: "success",
                        title: "Registrado",
                        text: "Producción diaria capturada exitosamente",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        }
    };

    // Delete Daily Production
    const handleDeleteDaily = (id: number) => {
        Swal.fire({
            title: "¿Eliminar registro de producción?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.inventory.urea.daily.destroy", id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "Registro eliminado exitosamente",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    // Open Initial Inventory Modal (Create or Edit)
    const openInitialModal = (item?: InitialInventory) => {
        if (item) {
            setEditingInitial(item);
            initialForm.setData({
                date: item.date ? item.date.substring(0, 10) : "",
                warehouse: item.warehouse,
                cubicle: item.cubicle || "",
                plant_origin: item.plant_origin,
                packaging: item.packaging,
                quantity_tons: String(item.quantity_tons),
                sacks_count: item.sacks_count ? String(item.sacks_count) : "",
                lot_folio: item.lot_folio || "",
                notes: item.notes || "",
            });
        } else {
            setEditingInitial(null);
            initialForm.setData({
                date: getOperationalDate(),
                warehouse: "Almacen 1",
                cubicle: "",
                plant_origin: "UREA 1",
                packaging: "Granel",
                quantity_tons: "",
                sacks_count: "",
                lot_folio: "",
                notes: "",
            });
        }
        setIsInitialModalOpen(true);
    };

    // Submit Initial Inventory
    const handleInitialSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingInitial) {
            initialForm.put(route("apt.inventory.urea.initial.update", editingInitial.id), {
                onSuccess: () => {
                    setIsInitialModalOpen(false);
                    setEditingInitial(null);
                    Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: "Inventario inicial actualizado correctamente",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        } else {
            initialForm.post(route("apt.inventory.urea.initial.store"), {
                onSuccess: () => {
                    setIsInitialModalOpen(false);
                    initialForm.reset();
                    Swal.fire({
                        icon: "success",
                        title: "Registrado",
                        text: "Inventario inicial capturado exitosamente",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        }
    };

    // Delete Initial Inventory
    const handleDeleteInitial = (id: number) => {
        Swal.fire({
            title: "¿Eliminar registro de inventario inicial?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.inventory.urea.initial.destroy", id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "Registro eliminado exitosamente",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    // Helper to format numbers
    const formatNumber = (num: number, decimals: number = 2) => {
        return Number(num || 0).toLocaleString("es-MX", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    // Helper to format dates
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const parts = dateStr.split("T")[0].split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return new Date(dateStr).toLocaleDateString("es-MX");
        } catch {
            return dateStr;
        }
    };

    const fromParam = new URLSearchParams(window.location.search).get("from");

    const pageTitle =
        activeTab === "production"
            ? "Urea Agrícola: Producción Diaria"
            : activeTab === "initial"
            ? "Urea Agrícola: Inventario Inicial"
            : "Urea Agrícola: Balance y Desglose";

    return (
        <DashboardLayout user={auth.user} header={pageTitle}>
            <Head title={pageTitle} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={`${route("apt.inventory.index")}${fromParam ? `?from=${fromParam}` : ""}`}
                            className="inline-flex items-center text-purple-700 hover:text-purple-900 transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs text-sm font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Volver a Gestión de Inventarios
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Urea Agrícola
                        </span>
                    </div>
                </div>

                {/* Hero Header */}
                <div
                    className={`rounded-2xl shadow-xl p-6 sm:p-8 text-white mb-8 relative overflow-hidden ${
                        activeTab === "initial"
                            ? "bg-gradient-to-r from-violet-800 via-purple-800 to-indigo-900"
                            : activeTab === "production"
                            ? "bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900"
                            : "bg-gradient-to-r from-indigo-800 via-violet-800 to-sky-900"
                    }`}
                >
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className={`p-2.5 rounded-xl backdrop-blur-sm border ${
                                        activeTab === "initial"
                                            ? "bg-purple-600/40 border-purple-400/30"
                                            : activeTab === "production"
                                            ? "bg-emerald-600/40 border-emerald-400/30"
                                            : "bg-indigo-600/40 border-indigo-400/30"
                                    }`}
                                >
                                    {activeTab === "production" ? (
                                        <TrendingUp className="w-7 h-7 text-emerald-200" />
                                    ) : activeTab === "initial" ? (
                                        <Boxes className="w-7 h-7 text-purple-200" />
                                    ) : (
                                        <BarChart3 className="w-7 h-7 text-indigo-200" />
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {pageTitle}
                                </h1>
                            </div>
                            <p
                                className={`text-sm sm:text-base max-w-2xl ${
                                    activeTab === "initial" ? "text-purple-100" : "text-emerald-100"
                                }`}
                            >
                                {activeTab === "production"
                                    ? "Captura y seguimiento de la producción diaria por turno, planta y almacén."
                                    : activeTab === "initial"
                                    ? "Captura y balance inicial de existencias base de Urea Agrícola."
                                    : "Consolidado de stock total, inventario inicial y producción acumulada."}
                            </p>
                        </div>

                    </div>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {/* Card 1: Stock Total Urea */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Stock Total Urea
                            </p>
                            <h3 className="text-2xl font-black text-gray-900">
                                {formatNumber(metrics?.totalStockTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-gray-500">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {(metrics?.totalStockSacks ?? 0) > 0 ? `${formatNumber(metrics.totalStockSacks, 0)} sacos aprox.` : "Granel / Envasado"}
                            </p>
                        </div>
                        <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Producción Diaria Hoy */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Producción Hoy
                            </p>
                            <h3 className="text-2xl font-black text-teal-700">
                                {formatNumber(metrics?.todayProductionTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-teal-600">TM</span>
                            </h3>
                            <p className="text-xs text-teal-600 font-medium mt-1">
                                {formatDate(metrics?.operationalDate || getOperationalDate())}
                                <span className="ml-1 text-[11px] text-gray-400 font-normal">(Corte 5:00 AM)</span>
                            </p>
                        </div>
                        <div className="p-3.5 bg-teal-50 rounded-2xl text-teal-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: Producción Diaria Acumulada */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Total Prod. Diaria
                            </p>
                            <h3 className="text-2xl font-black text-indigo-900">
                                {formatNumber(metrics?.totalDailyTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-gray-500">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Histórico registrado
                            </p>
                        </div>
                        <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Factory className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: Inventario Inicial */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Inventario Inicial
                            </p>
                            <h3 className="text-2xl font-black text-purple-900">
                                {formatNumber(metrics?.totalInitialTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-gray-500">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Balance base configurado
                            </p>
                        </div>
                        <div className="p-3.5 bg-purple-50 rounded-2xl text-purple-600">
                            <Boxes className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Submodule Tab Selector */}
                <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-xs px-2 pt-2">
                    <button
                        onClick={() => handleTabChange("production")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "production"
                                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                        Producción Diaria
                        <span className="ml-2.5 py-0.5 px-2 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                            {dailyProductions?.total ?? 0}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange("initial")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "initial"
                                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <Boxes className="w-4 h-4 mr-2 text-purple-600" />
                        Inventario Inicial
                        <span className="ml-2.5 py-0.5 px-2 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                            {initialInventories?.total ?? 0}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange("summary")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "summary"
                                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <BarChart3 className="w-4 h-4 mr-2 text-indigo-600" />
                        Balance y Desglose
                    </button>
                </div>

                {/* Filters Section (For production & initial tabs) */}
                {activeTab !== "summary" && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Search */}
                            <div className="lg:col-span-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Buscar folio, almacén, notas..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                />
                            </div>

                            {/* Warehouse Filter */}
                            <div>
                                <select
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                >
                                    <option value="">Todos los Almacenes</option>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={`Almacen ${n}`}>
                                            Almacén {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Plant Filter */}
                            <div>
                                <select
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                    value={plantFilter}
                                    onChange={(e) => setPlantFilter(e.target.value)}
                                >
                                    <option value="">Todas las Plantas</option>
                                    <option value="UREA 1">UREA 1</option>
                                    <option value="UREA 2">UREA 2</option>
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <input
                                    type="date"
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    placeholder="Fecha Desde"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyFilters()}
                                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                                >
                                    <Filter className="w-3.5 h-3.5 mr-1" />
                                    Filtrar
                                </button>
                                <button
                                    onClick={resetFilters}
                                    title="Limpiar filtros"
                                    className="px-2.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 1 Content: Daily Production Table */}
                {activeTab === "production" && (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                                    Historial de Producción Diaria de Urea Agrícola
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Registros diarios por turno, planta y almacén
                                </p>
                            </div>
                            <button
                                onClick={() => openDailyModal()}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Nuevo Registro de Producción
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Planta</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Ubicación</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Producción (TM)</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Folio Lote</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Registró / Supervisor</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {dailyProductions?.data && dailyProductions.data.length > 0 ? (
                                        dailyProductions.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {item.date}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-bold">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                                            item.plant_origin === "UREA 1"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-teal-100 text-teal-800"
                                                        }`}
                                                    >
                                                        {item.plant_origin}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-700">
                                                    <div className="font-bold text-gray-900">{item.warehouse}</div>
                                                    {item.cubicle && (
                                                        <div className="text-[11px] text-gray-500">
                                                            Cubículo: {item.cubicle}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-emerald-700">
                                                    {formatNumber(Number(item.quantity_tons), 3)} TM
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-gray-700">
                                                    {item.lot_folio ? (
                                                        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold border border-indigo-100">
                                                            {item.lot_folio}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                                                    <div className="font-bold text-gray-900">
                                                        {item.supervisor_name || item.user?.name || "Sistema"}
                                                    </div>
                                                    {item.user?.name && item.supervisor_name && item.user.name !== item.supervisor_name && (
                                                        <div className="text-[10px] text-gray-400">
                                                            Por: {item.user.name}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => openDailyModal(item)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                            title="Editar registro"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDaily(item.id)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Eliminar registro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <TrendingUp className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="text-base font-medium text-gray-600">
                                                        No hay registros de producción diaria de Urea Agrícola
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Haga clic en "Nuevo Registro de Producción" para comenzar a capturar.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {dailyProductions?.links && dailyProductions.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Mostrando {dailyProductions.from || 0} a {dailyProductions.to || 0} de {dailyProductions.total} registros
                                </p>
                                <div className="flex space-x-1">
                                    {dailyProductions.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                link.active
                                                    ? "bg-emerald-600 text-white font-bold"
                                                    : link.url
                                                    ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2 Content: Initial Inventory Table */}
                {activeTab === "initial" && (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-purple-50/30 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Boxes className="w-5 h-5 mr-2 text-purple-600" />
                                    Registros de Inventario Inicial de Urea Agrícola
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Balance y stock inicial base por almacén y planta
                                </p>
                            </div>
                            <button
                                onClick={() => openInitialModal()}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Capturar Inventario Inicial
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Fecha Inicial</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Planta</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Almacén / Ubicación</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Cantidad Inicial (TM)</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Observaciones</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Registrado Por</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {initialInventories?.data && initialInventories.data.length > 0 ? (
                                        initialInventories.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {item.date}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-bold">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                                            item.plant_origin === "UREA 1"
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-teal-100 text-teal-800"
                                                        }`}
                                                    >
                                                        {item.plant_origin}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-700">
                                                    <div className="font-bold text-gray-900">{item.warehouse}</div>
                                                    {item.cubicle && (
                                                        <div className="text-[11px] text-gray-500">
                                                            Cubículo: {item.cubicle}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-purple-700">
                                                    {formatNumber(Number(item.quantity_tons), 3)} TM
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">
                                                    {item.notes || "-"}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    <div className="font-medium text-gray-800">
                                                        {item.user?.name || "Sistema"}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => openInitialModal(item)}
                                                            className="text-purple-600 hover:text-purple-900 p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                                            title="Editar inventario inicial"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInitial(item.id)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Eliminar inventario inicial"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Boxes className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="text-base font-medium text-gray-600">
                                                        No hay registros de inventario inicial de Urea Agrícola
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Haga clic en "Capturar Inventario Inicial" para establecer el balance de partida.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {initialInventories?.links && initialInventories.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Mostrando {initialInventories.from || 0} a {initialInventories.to || 0} de {initialInventories.total} registros
                                </p>
                                <div className="flex space-x-1">
                                    {initialInventories.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                link.active
                                                    ? "bg-purple-600 text-white font-bold"
                                                    : link.url
                                                    ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3 Content: Balance & Breakdown */}
                {activeTab === "summary" && (
                    <div className="space-y-6">
                        {/* Summary by Plant Origin */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {["UREA 1", "UREA 2"].map((plant) => {
                                const plantData = metrics?.byPlant?.[plant] || {
                                    initial_tons: 0,
                                    daily_tons: 0,
                                    total_tons: 0,
                                };
                                return (
                                    <div
                                        key={plant}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`p-3 rounded-xl ${
                                                        plant === "UREA 1"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-teal-100 text-teal-700"
                                                    }`}
                                                >
                                                    <Factory className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-extrabold text-gray-900">
                                                        Planta {plant}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        Urea Agrícola
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-gray-900">
                                                    {formatNumber(plantData.total_tons, 2)}
                                                </span>{" "}
                                                <span className="text-xs font-bold text-gray-500">TM</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-3 border-t border-gray-100 text-sm">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span className="flex items-center">
                                                    <Boxes className="w-4 h-4 mr-2 text-purple-500" />
                                                    Inventario Inicial:
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    {formatNumber(plantData.initial_tons, 3)} TM
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span className="flex items-center">
                                                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-500" />
                                                    Producción Diaria Acumulada:
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    {formatNumber(plantData.daily_tons, 3)} TM
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Warehouse Breakdown Table */}
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                        <Database className="w-5 h-5 mr-2 text-indigo-600" />
                                        Existencias de Urea Agrícola por Almacén
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Consolidado de Inventario Inicial + Producción Diaria
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-800 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Almacén</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Inv. Inicial (TM)</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Prod. Diaria (TM)</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Total Stock (TM)</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">% Distribución</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {metrics?.byWarehouse && Object.entries(metrics.byWarehouse).map(([key, wh]) => {
                                            const totalStock = metrics?.totalStockTons ?? 0;
                                            const pct = totalStock > 0 ? (wh.total_tons / totalStock) * 100 : 0;
                                            return (
                                                <tr key={key} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 flex items-center">
                                                        <Database className="w-4 h-4 mr-2 text-gray-400" />
                                                        {wh.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-700">
                                                        {formatNumber(wh.initial_tons, 3)} TM
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-700">
                                                        {formatNumber(wh.daily_tons, 3)} TM
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900">
                                                        {formatNumber(wh.total_tons, 3)} TM
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold text-gray-600">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className="bg-emerald-600 h-2 rounded-full"
                                                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span>{formatNumber(pct, 1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-gray-50 font-black">
                                            <td className="px-6 py-4 text-sm text-gray-900">TOTAL GENERAL</td>
                                            <td className="px-6 py-4 text-right text-sm text-purple-900">
                                                {formatNumber(metrics?.totalInitialTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-emerald-900">
                                                {formatNumber(metrics?.totalDailyTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-6 py-4 text-right text-base text-gray-900">
                                                {formatNumber(metrics?.totalStockTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-gray-900">100.0%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Daily Production Form */}
            {isDailyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-fade-in">
                        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-700/50 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {editingDaily ? "Editar Producción Diaria" : "Capturar Producción Diaria"}
                                    </h3>
                                    <p className="text-emerald-200 text-xs">
                                        Urea Agrícola
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDailyModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDailySubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Fecha de Producción <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={dailyForm.data.date}
                                        onChange={(e) => dailyForm.setData("date", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {dailyForm.errors.date && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.date}</p>
                                    )}
                                </div>

                                {/* Planta Origen */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Planta Origen <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={dailyForm.data.plant_origin}
                                        onChange={(e) => dailyForm.setData("plant_origin", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="UREA 1">UREA 1</option>
                                        <option value="UREA 2">UREA 2</option>
                                    </select>
                                    {dailyForm.errors.plant_origin && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.plant_origin}</p>
                                    )}
                                </div>

                                {/* Almacén Destino */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Almacén de Destino <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={dailyForm.data.warehouse}
                                        onChange={(e) => dailyForm.setData("warehouse", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={`Almacen ${n}`}>
                                                Almacén {n}
                                            </option>
                                        ))}
                                    </select>
                                    {dailyForm.errors.warehouse && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.warehouse}</p>
                                    )}
                                </div>

                                {/* Cantidad en Toneladas */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Cantidad Producida (TM) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        required
                                        placeholder="Ej: 150.500"
                                        value={dailyForm.data.quantity_tons}
                                        onChange={(e) => dailyForm.setData("quantity_tons", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-bold text-gray-900 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    {dailyForm.errors.quantity_tons && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.quantity_tons}</p>
                                    )}
                                </div>

                                {/* Cubículo (if Almacen 4/5) */}
                                {(dailyForm.data.warehouse === "Almacen 4" || dailyForm.data.warehouse === "Almacen 5") && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Cubículo Asignado
                                        </label>
                                        <select
                                            value={dailyForm.data.cubicle}
                                            onChange={(e) => dailyForm.setData("cubicle", e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                                        >
                                            <option value="">Seleccione cubículo...</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                <option key={n} value={`${n}`}>
                                                    Cubículo {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Folio de Lote (opcional) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Lote / Folio Asociado (opcional)
                                    </label>
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            list="lots-datalist"
                                            placeholder="Ej: LOTE-2026-001 o seleccionar"
                                            value={dailyForm.data.lot_folio}
                                            onChange={(e) => dailyForm.setData("lot_folio", e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm font-mono focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <datalist id="lots-datalist">
                                            {Array.from(
                                                new Map(
                                                    lots?.filter((l) => l && l.folio).map((l) => [l.folio, l])
                                                ).values()
                                            ).map((l) => {
                                                const details = [l.warehouse, l.plant_origin].filter(Boolean).join(" - ");
                                                return (
                                                    <option key={l.id || l.folio} value={l.folio} label={details}>
                                                        {details}
                                                    </option>
                                                );
                                            })}
                                        </datalist>
                                    </div>
                                </div>

                                {/* Supervisor / Operador (Automático) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Supervisor / Registrado por <span className="text-emerald-600 font-semibold">(Automático)</span>
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={dailyForm.data.supervisor_name || auth?.user?.name || "Usuario"}
                                        className="w-full rounded-xl border-gray-200 text-sm bg-gray-50 text-gray-700 font-medium cursor-not-allowed focus:ring-0 focus:border-gray-200"
                                    />
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Observaciones / Notas
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Detalles adicionales sobre la producción..."
                                        value={dailyForm.data.notes}
                                        onChange={(e) => dailyForm.setData("notes", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDailyModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={dailyForm.processing}
                                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    {dailyForm.processing ? "Guardando..." : editingDaily ? "Actualizar Registro" : "Guardar Producción"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Initial Inventory Form */}
            {isInitialModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-fade-in">
                        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-700/50 rounded-lg">
                                    <Boxes className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {editingInitial ? "Editar Inventario Inicial" : "Capturar Inventario Inicial"}
                                    </h3>
                                    <p className="text-purple-200 text-xs">
                                        Urea Agrícola
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsInitialModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Fecha de Inventario Inicial <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={initialForm.data.date}
                                        onChange={(e) => initialForm.setData("date", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {initialForm.errors.date && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.date}</p>
                                    )}
                                </div>

                                {/* Planta Origen */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Planta Origen <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={initialForm.data.plant_origin}
                                        onChange={(e) => initialForm.setData("plant_origin", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="UREA 1">UREA 1</option>
                                        <option value="UREA 2">UREA 2</option>
                                    </select>
                                    {initialForm.errors.plant_origin && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.plant_origin}</p>
                                    )}
                                </div>

                                {/* Almacén */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Almacén <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={initialForm.data.warehouse}
                                        onChange={(e) => initialForm.setData("warehouse", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={`Almacen ${n}`}>
                                                Almacén {n}
                                            </option>
                                        ))}
                                    </select>
                                    {initialForm.errors.warehouse && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.warehouse}</p>
                                    )}
                                </div>

                                {/* Cubículo (if Almacen 4/5) */}
                                {(initialForm.data.warehouse === "Almacen 4" || initialForm.data.warehouse === "Almacen 5") && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Cubículo
                                        </label>
                                        <select
                                            value={initialForm.data.cubicle}
                                            onChange={(e) => initialForm.setData("cubicle", e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Seleccione cubículo...</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                <option key={n} value={`${n}`}>
                                                    Cubículo {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Cantidad en Toneladas */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Cantidad Inicial (TM) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        required
                                        placeholder="Ej: 5000.000"
                                        value={initialForm.data.quantity_tons}
                                        onChange={(e) => initialForm.setData("quantity_tons", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-bold text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {initialForm.errors.quantity_tons && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.quantity_tons}</p>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Observaciones / Notas
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Detalles sobre el inventario inicial..."
                                        value={initialForm.data.notes}
                                        onChange={(e) => initialForm.setData("notes", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsInitialModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={initialForm.processing}
                                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    {initialForm.processing ? "Guardando..." : editingInitial ? "Actualizar Inventario" : "Guardar Inventario Inicial"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
