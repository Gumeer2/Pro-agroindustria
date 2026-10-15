import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import React, { useState } from "react";
import {
    TrendingUp,
    Factory,
    Ship,
    Boxes,
    ArrowLeft,
    Search,
    ChevronRight,
    ArrowUpRight,
    Clock,
    Sparkles,
    Truck,
    Layers,
} from "lucide-react";
import Swal from "sweetalert2";

interface PanelMetricData {
    stock_total?: number;
    today_production?: number;
    shipped_total?: number;
    initial_total?: number;
}

interface Props {
    auth: any;
    metrics?: {
        operational_date?: string;
        urea_proagro?: PanelMetricData;
        urea_importada?: PanelMetricData;
        dap?: PanelMetricData;
        urea_importada_dap?: PanelMetricData;

        urea_agricola_total?: number;
        urea_agricola_daily?: number;
        urea_agricola_initial?: number;
        urea_agricola_shipped?: number;
        urea_agricola_today?: number;

        urea_industrial_total?: number;
        urea_industrial_daily?: number;
        urea_industrial_initial?: number;
        urea_industrial_shipped?: number;
        urea_industrial_today?: number;

        urea_automotriz_total?: number;
        urea_automotriz_daily?: number;
        urea_automotriz_initial?: number;
        urea_automotriz_shipped?: number;
        urea_automotriz_today?: number;

        urea_importada_total?: number;
        urea_importada_daily?: number;
        urea_importada_initial?: number;
        urea_importada_shipped?: number;
        urea_importada_today?: number;

        dap_total?: number;
        dap_daily?: number;
        dap_initial?: number;
        dap_shipped?: number;
        dap_today?: number;
    };
}

type GlobalScope = "proagro" | "importada" | "dap" | "all";

export default function ProductionHub({ auth, metrics }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedScope, setSelectedScope] = useState<GlobalScope>("proagro");
    const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

    const getBackUrl = () => {
        const from = fromParam || "production";
        try {
            return typeof route === "function" ? `${route("apt.inventory.index")}?from=${from}` : `/apt/inventory?from=${from}`;
        } catch {
            return `/apt/inventory?from=${from}`;
        }
    };

    const handleUpcomingModule = (name: string) => {
        Swal.fire({
            icon: "info",
            title: `Módulo ${name}`,
            text: `El módulo de ${name} se encuentra en fase de configuración y estará disponible próximamente.`,
            confirmButtonColor: "#0d9488",
            confirmButtonText: "Entendido",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-2.5 font-bold",
            },
        });
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const formatNumber = (val: number | string | undefined | null, decimals = 2) => {
        if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
        return Number(val).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const operationalDate = metrics?.operational_date || new Date().toISOString().slice(0, 10);

    // Panel 1: Urea Proagro (Agrícola + Industrial + Automotriz)
    const proagroMetrics: PanelMetricData = metrics?.urea_proagro ?? {
        stock_total:
            (metrics?.urea_agricola_total ?? 0) +
            (metrics?.urea_industrial_total ?? 0) +
            (metrics?.urea_automotriz_total ?? 0),
        today_production:
            (metrics?.urea_agricola_today ?? 0) +
            (metrics?.urea_industrial_today ?? 0) +
            (metrics?.urea_automotriz_today ?? 0),
        shipped_total:
            (metrics?.urea_agricola_shipped ?? 0) +
            (metrics?.urea_industrial_shipped ?? 0) +
            (metrics?.urea_automotriz_shipped ?? 0),
        initial_total:
            (metrics?.urea_agricola_initial ?? 0) +
            (metrics?.urea_industrial_initial ?? 0) +
            (metrics?.urea_automotriz_initial ?? 0),
    };

    // Panel 2: Urea Importada (Aparte)
    const importadaMetrics: PanelMetricData = metrics?.urea_importada ?? {
        stock_total: metrics?.urea_importada_total ?? 0,
        today_production: metrics?.urea_importada_today ?? metrics?.urea_importada_daily ?? 0,
        shipped_total: metrics?.urea_importada_shipped ?? 0,
        initial_total: metrics?.urea_importada_initial ?? 0,
    };

    // Panel 3: DAP (Aparte)
    const dapPanelMetrics: PanelMetricData = metrics?.dap ?? {
        stock_total: metrics?.dap_total ?? 0,
        today_production: metrics?.dap_today ?? metrics?.dap_daily ?? 0,
        shipped_total: metrics?.dap_shipped ?? 0,
        initial_total: metrics?.dap_initial ?? 0,
    };

    const searchLower = searchTerm.toLowerCase();
    const effectiveFrom = fromParam || "production";

    // The 5 Modules - kept identical and in one place
    const modules = [
        {
            id: "urea-agricola",
            name: "Urea Agrícola",
            badge: "Producción",
            badgeColor: "bg-teal-100 text-teal-800 border-teal-200 group-hover:bg-teal-900 group-hover:text-white",
            icon: TrendingUp,
            iconBg: "bg-teal-50 text-teal-600",
            border: "border-teal-200 hover:border-teal-500 hover:shadow-teal-100",
            glowColor: "from-teal-50",
            accentColor: "text-teal-600",
            buttonBg: "bg-teal-50/60 group-hover:bg-teal-100/80 text-teal-600 group-hover:text-teal-700",
            description: "Módulo especializado de producción diaria por turno, planta de origen (Urea 1 y 2) e inventario inicial balanceado.",
            specialModuleLabel: "Stock Disponible",
            specialModuleValue: metrics?.urea_agricola_total !== undefined ? `${Number(metrics.urea_agricola_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM` : "0.00 TM",
            secondaryLabel: "Plantas:",
            secondaryValue: "UREA 1 / UREA 2",
            href: typeof route === "function" ? `${route("apt.inventory.urea.index")}?tab=production&from=${effectiveFrom}` : `/apt/inventory/urea?tab=production&from=${effectiveFrom}`,
            active: true,
        },
        {
            id: "urea-industrial",
            name: "Urea Industrial",
            badge: "Industrial",
            badgeColor: "bg-blue-100 text-blue-800 border-blue-200 group-hover:bg-blue-900 group-hover:text-white",
            icon: Factory,
            iconBg: "bg-blue-50 text-blue-600",
            border: "border-blue-200 hover:border-blue-500 hover:shadow-blue-100",
            glowColor: "from-blue-50",
            accentColor: "text-blue-600",
            buttonBg: "bg-blue-50/60 group-hover:bg-blue-100/80 text-blue-600 group-hover:text-blue-700",
            description: "Control y seguimiento de producción diaria, balance de inventarios y especificaciones de Urea Industrial.",
            specialModuleLabel: "Stock Disponible",
            specialModuleValue: metrics?.urea_industrial_total !== undefined ? `${Number(metrics.urea_industrial_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM` : "0.00 TM",
            secondaryLabel: "Plantas:",
            secondaryValue: "UREA 1 / UREA 2",
            href: typeof route === "function" ? `${route("apt.inventory.urea-industrial.index")}?tab=production&from=${effectiveFrom}` : `/apt/inventory/urea-industrial?tab=production&from=${effectiveFrom}`,
            active: true,
        },
        {
            id: "urea-automotriz",
            name: "Urea Automotriz",
            badge: "Automotriz",
            badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200 group-hover:bg-indigo-900 group-hover:text-white",
            icon: Truck,
            iconBg: "bg-indigo-50 text-indigo-600",
            border: "border-indigo-200 hover:border-indigo-500 hover:shadow-indigo-100",
            glowColor: "from-indigo-50",
            accentColor: "text-indigo-600",
            buttonBg: "bg-indigo-50/60 group-hover:bg-indigo-100/80 text-indigo-600 group-hover:text-indigo-700",
            description: "Control y seguimiento de producción diaria, balance de inventarios y especificaciones de Urea Automotriz.",
            specialModuleLabel: "Stock Disponible",
            specialModuleValue: metrics?.urea_automotriz_total !== undefined ? `${Number(metrics.urea_automotriz_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM` : "0.00 TM",
            secondaryLabel: "Plantas:",
            secondaryValue: "UREA 1 / UREA 2",
            href: typeof route === "function" ? `${route("apt.inventory.urea-automotriz.index")}?tab=production&from=${effectiveFrom}` : `/apt/inventory/urea-automotriz?tab=production&from=${effectiveFrom}`,
            active: true,
        },
        {
            id: "urea-importada",
            name: "Urea Importada",
            badge: "Importación",
            badgeColor: "bg-purple-100 text-purple-800 border-purple-200 group-hover:bg-purple-900 group-hover:text-white",
            icon: Ship,
            iconBg: "bg-purple-50 text-purple-600",
            border: "border-purple-200 hover:border-purple-500 hover:shadow-purple-100",
            glowColor: "from-purple-50",
            accentColor: "text-purple-600",
            buttonBg: "bg-purple-50/60 group-hover:bg-purple-100/80 text-purple-600 group-hover:text-purple-700",
            description: "Recepción, balance de descarga de buques y control de existencias de Urea Importada en almacenes.",
            specialModuleLabel: "Stock Disponible",
            specialModuleValue: metrics?.urea_importada_total !== undefined ? `${Number(metrics.urea_importada_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM` : "0.00 TM",
            secondaryLabel: "Origen:",
            secondaryValue: "Barco / Muelle",
            href: typeof route === "function" ? `${route("apt.inventory.urea-importada.index")}?tab=production&from=${effectiveFrom}` : `/apt/inventory/urea-importada?tab=production&from=${effectiveFrom}`,
            active: true,
        },
        {
            id: "dap",
            name: "DAP",
            badge: "Fertilizante",
            badgeColor: "bg-amber-100 text-amber-800 border-amber-200 group-hover:bg-amber-900 group-hover:text-white",
            icon: Boxes,
            iconBg: "bg-amber-50 text-amber-600",
            border: "border-amber-200 hover:border-amber-500 hover:shadow-amber-100",
            glowColor: "from-amber-50",
            accentColor: "text-amber-600",
            buttonBg: "bg-amber-50/60 group-hover:bg-amber-100/80 text-amber-600 group-hover:text-amber-700",
            description: "Gestión y seguimiento de producción, almacenamiento y despacho de Fosfato Diamónico (DAP).",
            specialModuleLabel: "Stock Disponible",
            specialModuleValue: metrics?.dap_total !== undefined ? `${Number(metrics.dap_total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM` : "0.00 TM",
            secondaryLabel: "Presentación:",
            secondaryValue: "Granel / Envasado",
            href: typeof route === "function" ? `${route("apt.inventory.dap.index")}?tab=production&from=${effectiveFrom}` : `/apt/inventory/dap?tab=production&from=${effectiveFrom}`,
            active: true,
        },
    ];

    const filteredModules = modules.filter(
        (mod) =>
            !searchTerm ||
            mod.name.toLowerCase().includes(searchLower) ||
            mod.description.toLowerCase().includes(searchLower)
    );

    // Configuration for the 3 scopes
    const scopeConfigs = {
        proagro: {
            id: "proagro",
            title: "Urea Proagro",
            subtitle: "Consolidado global de Urea Agrícola, Urea Industrial y Urea Automotriz",
            badge: "Agrícola · Industrial · Automotriz",
            badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
            tag: "Producción Nacional",
            tagColor: "text-teal-700 bg-white/90 border-teal-100",
            icon: TrendingUp,
            iconBg: "bg-teal-600 text-white shadow-xs",
            headerBg: "from-teal-50/80 via-emerald-50/40 to-transparent border-teal-100/80",
            todayLabel: "Producción Hoy",
            metrics: proagroMetrics,
        },
        importada: {
            id: "importada",
            title: "Urea Importada",
            subtitle: "Balance global de recepción, descarga de buques y control en almacenes",
            badge: "Urea de Importación",
            badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
            tag: "Barco / Muelle",
            tagColor: "text-purple-700 bg-white/90 border-purple-100",
            icon: Ship,
            iconBg: "bg-purple-600 text-white shadow-xs",
            headerBg: "from-purple-50/80 via-indigo-50/40 to-transparent border-purple-100/80",
            todayLabel: "Recepción / Prod. Hoy",
            metrics: importadaMetrics,
        },
        dap: {
            id: "dap",
            title: "DAP (Fosfato Diamónico)",
            subtitle: "Balance global de almacenamiento y despacho de Fosfato Diamónico",
            badge: "Fertilizante Fosfatado",
            badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
            tag: "Granel / Envasado",
            tagColor: "text-amber-700 bg-white/90 border-amber-100",
            icon: Boxes,
            iconBg: "bg-amber-600 text-white shadow-xs",
            headerBg: "from-amber-50/80 via-orange-50/40 to-transparent border-amber-100/80",
            todayLabel: "Producción Hoy",
            metrics: dapPanelMetrics,
        },
    };

    const renderMetricCards = (panelMetrics: PanelMetricData, todayLabel: string) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Stock Total Disponible */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Stock Neto Disponible
                    </p>
                    <h3 className="text-2xl font-black text-emerald-700">
                        {formatNumber(panelMetrics.stock_total, 2)}{" "}
                        <span className="text-sm font-semibold text-emerald-600">TM</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Disponible en almacenes
                    </p>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
            </div>

            {/* Card 2: Producción Hoy */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {todayLabel}
                    </p>
                    <h3 className="text-2xl font-black text-teal-700">
                        {formatNumber(panelMetrics.today_production, 2)}{" "}
                        <span className="text-sm font-semibold text-teal-600">TM</span>
                    </h3>
                    <p className="text-xs text-teal-600 font-medium mt-1">
                        {formatDate(operationalDate)}
                        <span className="ml-1 text-[11px] text-gray-400 font-normal">(Corte 5:00 AM)</span>
                    </p>
                </div>
                <div className="p-3.5 bg-teal-50 rounded-2xl text-teal-600">
                    <Clock className="w-6 h-6" />
                </div>
            </div>

            {/* Card 3: Embarques Despachados */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Embarques Despachados
                    </p>
                    <h3 className="text-2xl font-black text-rose-700">
                        {formatNumber(panelMetrics.shipped_total, 2)}{" "}
                        <span className="text-sm font-semibold text-rose-600">TM</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Salidas completadas (O.E.)
                    </p>
                </div>
                <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
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
                        {formatNumber(panelMetrics.initial_total, 2)}{" "}
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
    );

    const renderSingleScopePanel = (cfg: typeof scopeConfigs.proagro) => {
        const Icon = cfg.icon;
        return (
            <div key={cfg.id} className="mb-6">
                <div className={`bg-gradient-to-r ${cfg.headerBg} p-1.5 rounded-2xl mb-4 border flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                    {cfg.title}
                                </h3>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.badgeColor}`}>
                                    {cfg.badge}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {cfg.subtitle}
                            </p>
                        </div>
                    </div>
                    <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold backdrop-blur-sm px-3 py-1.5 rounded-xl border shadow-2xs ${cfg.tagColor}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{cfg.tag}</span>
                    </div>
                </div>

                {renderMetricCards(cfg.metrics, cfg.todayLabel)}
            </div>
        );
    };

    return (
        <DashboardLayout user={auth?.user} header="Gestión de Inventarios: Producción">
            <Head title="Producción - Gestión de Inventarios" />

            <div className="py-8 max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Navigation & Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div>
                        <Link
                            href={getBackUrl()}
                            className="inline-flex items-center text-gray-500 hover:text-teal-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-3 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Volver a Gestión de Inventarios
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-teal-600 to-emerald-800 text-white rounded-2xl shadow-md shadow-teal-200">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                    Producción
                                    <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
                                        5 Tarjetas
                                    </span>
                                </h1>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Control especializado de producción diaria e inventarios por producto
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search bar */}
                    <div className="w-full lg:w-80">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar fertilizante..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* GLOBAL METRIC PANEL (Placed above the 5 module cards) */}
                <div className="bg-white/80 backdrop-blur-xs rounded-3xl border border-gray-200 p-6 shadow-sm mb-10">
                    {/* Panel Scope Switcher Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-xl text-gray-700">
                                <Layers className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    Panel Global de Inventarios
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Seleccione el panel consolidado para visualizar las métricas globales
                                </p>
                            </div>
                        </div>

                        {/* Interactive Pill Tabs */}
                        <div className="flex flex-wrap items-center bg-gray-100/90 p-1 rounded-2xl text-xs font-semibold gap-1">
                            <button
                                type="button"
                                onClick={() => setSelectedScope("proagro")}
                                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                                    selectedScope === "proagro"
                                        ? "bg-white text-teal-800 shadow-sm font-bold"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <TrendingUp className="w-4 h-4 text-teal-600" />
                                <span>Urea Proagro</span>
                                <span className="hidden md:inline-block text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md font-medium">
                                    Agrícola / Industrial / Automotriz
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedScope("importada")}
                                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                                    selectedScope === "importada"
                                        ? "bg-white text-purple-800 shadow-sm font-bold"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Ship className="w-4 h-4 text-purple-600" />
                                <span>Urea Importada</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedScope("dap")}
                                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                                    selectedScope === "dap"
                                        ? "bg-white text-amber-800 shadow-sm font-bold"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Boxes className="w-4 h-4 text-amber-600" />
                                <span>DAP</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedScope("all")}
                                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                                    selectedScope === "all"
                                        ? "bg-white text-gray-900 shadow-sm font-bold"
                                        : "text-gray-500 hover:text-gray-800"
                                }`}
                                title="Mostrar los 3 paneles"
                            >
                                <span>Ver los 3</span>
                            </button>
                        </div>
                    </div>

                    {/* Render Selected Global Panel (or All 3) */}
                    {selectedScope === "all" ? (
                        <div className="space-y-6">
                            {renderSingleScopePanel(scopeConfigs.proagro)}
                            {renderSingleScopePanel(scopeConfigs.importada)}
                            {renderSingleScopePanel(scopeConfigs.dap)}
                        </div>
                    ) : (
                        renderSingleScopePanel(scopeConfigs[selectedScope])
                    )}
                </div>

                {/* Section Title for the 5 Modules */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            Módulos de Producción
                            <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-full border border-gray-200">
                                {filteredModules.length} de {modules.length} Tarjetas
                            </span>
                        </h2>
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="text-xs text-teal-600 hover:text-teal-800 font-semibold underline"
                        >
                            Limpiar filtro
                        </button>
                    )}
                </div>

                {/* THE 5 MODULE CARDS (Maintained identical in 5-card row, just like Image 1) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
                    {filteredModules.map((mod) => {
                        const Icon = mod.icon;

                        const CardContent = (
                            <>
                                <div
                                    className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl ${mod.glowColor} to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60 group-hover:opacity-100 transition-opacity`}
                                />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className={`p-3.5 rounded-2xl ${mod.iconBg} shadow-sm transition-transform group-hover:scale-110 duration-200`}
                                        >
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <span
                                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${mod.badgeColor}`}
                                        >
                                            {mod.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
                                        {mod.name}
                                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-2 leading-relaxed flex-1">
                                        {mod.description}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                            <span className="font-medium text-gray-400 uppercase tracking-wider text-[10px]">
                                                {mod.specialModuleLabel}
                                            </span>
                                            <span className="font-bold text-gray-900 text-xs">
                                                {mod.specialModuleValue}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                            <span className="text-[11px]">{mod.secondaryLabel}</span>
                                            <span className="font-semibold text-gray-700 text-xs">
                                                {mod.secondaryValue}
                                            </span>
                                        </div>

                                        <div
                                            className={`mt-5 flex items-center justify-between text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors ${mod.buttonBg}`}
                                        >
                                            <span>{mod.active ? "Acceder al módulo" : "Próximamente"}</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        );

                        if (mod.active && mod.href) {
                            return (
                                <Link
                                    key={mod.id}
                                    href={mod.href}
                                    className={`bg-white rounded-3xl border ${mod.border} p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group`}
                                >
                                    {CardContent}
                                </Link>
                            );
                        }

                        return (
                            <button
                                key={mod.id}
                                type="button"
                                onClick={() => handleUpcomingModule(mod.name)}
                                className={`text-left bg-white rounded-3xl border ${mod.border} p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group w-full`}
                            >
                                {CardContent}
                            </button>
                        );
                    })}
                </div>

                {/* Empty State when search returns nothing */}
                {filteredModules.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6 max-w-xl mx-auto shadow-sm">
                        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-800">No se encontraron fertilizantes</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            No hay productos que coincidan con la búsqueda "{searchTerm}".
                        </p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="mt-4 text-xs font-semibold text-teal-600 hover:text-teal-800 underline"
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
