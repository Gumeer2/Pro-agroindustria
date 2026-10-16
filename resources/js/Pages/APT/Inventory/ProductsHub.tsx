import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import React, { useState, useMemo } from "react";
import {
    Boxes,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeft,
    Package,
    Search,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    DollarSign,
    ShieldCheck,
    ArrowUpRight,
    X,
    ExternalLink,
} from "lucide-react";

interface MainModule {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    border: string;
    hover: string;
    accent: string;
    href: string;
    badge: string;
    stats_label: string;
    stats_value: string | number;
    secondary_label?: string;
    secondary_value?: string;
}

interface Metrics {
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface Props {
    auth: any;
    mainModules: MainModule[];
    metrics: Metrics;
    lowStockAlerts?: any[];
    types?: any[];
}

const iconMap: Record<string, React.ElementType> = {
    Boxes,
    ArrowDownToLine,
    ArrowUpFromLine,
};

export default function ProductsHub({
    auth,
    mainModules = [],
    metrics,
    lowStockAlerts = [],
    types = [],
}: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

    // Stock Alerts Modal State
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertFilterType, setAlertFilterType] = useState<string>("all");
    const [alertFilterGroup, setAlertFilterGroup] = useState<string>("all");
    const [alertFilterCode, setAlertFilterCode] = useState<string>("");
    const [alertFilterStatus, setAlertFilterStatus] = useState<"all" | "out_of_stock" | "low_stock">("all");

    // Available groups for the alert modal based on alertFilterType
    const alertModalGroups = useMemo(() => {
        if (alertFilterType === "all") {
            const allG: { number: number; name: string; typeName: string }[] = [];
            (types || []).forEach((t: any) => {
                (t.groups || []).forEach((g: any) => {
                    allG.push({ number: g.number, name: g.name, typeName: t.name });
                });
            });
            return allG;
        }
        const selT = (types || []).find((t: any) => t.slug === alertFilterType);
        return selT ? (selT.groups || []).map((g: any) => ({ number: g.number, name: g.name, typeName: selT.name })) : [];
    }, [alertFilterType, types]);

    // Items filtered by current Type, Group, and Code (base scope for counts)
    const scopedAlerts = useMemo(() => {
        return (lowStockAlerts || []).filter((item: any) => {
            if (alertFilterType !== "all" && item.type_slug !== alertFilterType) {
                return false;
            }
            if (alertFilterGroup !== "all" && String(item.group_number) !== alertFilterGroup) {
                return false;
            }
            if (alertFilterCode.trim()) {
                const query = alertFilterCode.trim().toLowerCase();
                const matchesCode = (item.code || "").toLowerCase().includes(query);
                const matchesPart = (item.part_number || "").toLowerCase().includes(query);
                const matchesConsecutive = (item.consecutive || "").toLowerCase().includes(query);
                const matchesName = (item.name || "").toLowerCase().includes(query);
                if (!matchesCode && !matchesPart && !matchesConsecutive && !matchesName) {
                    return false;
                }
            }
            return true;
        });
    }, [lowStockAlerts, alertFilterType, alertFilterGroup, alertFilterCode]);

    // Dynamic counts reflecting the currently selected Type, Group, and Code
    const alertTotalCount = scopedAlerts.length;
    const alertOutOfStockCount = useMemo(() => scopedAlerts.filter((i: any) => i.stock <= 0).length, [scopedAlerts]);
    const alertLowStockCount = useMemo(() => scopedAlerts.filter((i: any) => i.stock > 0 && i.stock <= i.min_stock).length, [scopedAlerts]);

    // Final filtered alerts to display in the table (applying status tab)
    const filteredAlerts = useMemo(() => {
        if (alertFilterStatus === "out_of_stock") {
            return scopedAlerts.filter((i: any) => i.stock <= 0);
        }
        if (alertFilterStatus === "low_stock") {
            return scopedAlerts.filter((i: any) => i.stock > 0 && i.stock <= i.min_stock);
        }
        return scopedAlerts;
    }, [scopedAlerts, alertFilterStatus]);

    const getBackUrl = () => {
        const from = fromParam || "production";
        try {
            return typeof route === "function" ? `${route("apt.inventory.index")}?from=${from}` : `/apt/inventory?from=${from}`;
        } catch {
            return `/apt/inventory?from=${from}`;
        }
    };

    const filteredModules = (mainModules || []).filter(
        (mod) =>
            mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mod.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout user={auth?.user} header="Entrada y Salida de Productos">
            <Head title="Entrada y Salida de Productos" />

            <div className="py-8 max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Navigation & Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href={getBackUrl()}
                            className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-3 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Volver a Gestión de Inventarios
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-2xl shadow-md shadow-blue-200">
                                <Boxes className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                    Entrada y Salida de Productos
                                    <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                                        3 Submódulos
                                    </span>
                                </h1>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Control de catálogo general de insumos, recepción de compras y vales de despacho
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
                                placeholder="Buscar submódulo..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Global Metrics Bar */}
                {metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Total Productos
                                </span>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <Boxes className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {metrics.total_products}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">catálogo general</span>
                            </div>
                            <div className="mt-3 text-xs text-blue-600 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>9 subcategorías activas</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Existencias Totales
                                </span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {Number(metrics.total_stock || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">unidades en almacén</span>
                            </div>
                            <div className="mt-3 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Inventario disponible</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Valuación de Inventario
                                </span>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    ${Number(metrics.total_value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="mt-3 text-xs text-indigo-600 font-semibold flex items-center gap-1">
                                <span>Costo total estimado</span>
                            </div>
                        </div>

                        {/* Card 4: ALERTAS DE STOCK - EXACTAMENTE IGUAL QUE EN PRODUCTOS */}
                        <div
                            onClick={() => {
                                setAlertFilterType("all");
                                setAlertFilterGroup("all");
                                setAlertFilterCode("");
                                setAlertFilterStatus("all");
                                setIsAlertModalOpen(true);
                            }}
                            title="Haz clic para abrir el menú de alertas y filtrar por tipo, grupo y código"
                            className="bg-white rounded-2xl p-5 border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                                        ALERTAS DE STOCK
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        Ver menú ➜
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-3xl font-black text-amber-600 group-hover:scale-105 transition-transform">
                                        {metrics.out_of_stock_count}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${metrics.out_of_stock_count > 0 ? "bg-red-100 text-red-800" : metrics.low_stock_count > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                        {metrics.out_of_stock_count > 0 ? "Sin stock" : metrics.low_stock_count > 0 ? "Stock bajo" : "Óptimo"}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 font-medium mt-1 block">
                                    {metrics.low_stock_count} con stock bajo · <span className="text-amber-700 font-semibold underline decoration-dotted">Clic para filtrar</span>
                                </span>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:scale-110 rounded-2xl transition-all">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3 Submodules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredModules.map((sub, index) => {
                        const IconComponent = iconMap[sub.icon] || Boxes;
                        return (
                            <Link
                                key={sub.id}
                                href={sub.href}
                                className={`group bg-white rounded-2xl border ${sub.border} p-6 shadow-sm ${sub.hover} transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-50 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3.5 rounded-2xl ${sub.color} shadow-sm transition-transform group-hover:scale-110 duration-200`}>
                                            <IconComponent className="w-7 h-7" />
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                            {sub.badge || `Módulo ${index + 1}`}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                        {sub.name}
                                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-2 line-clamp-3">
                                        {sub.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 relative z-10">
                                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span className="font-medium text-gray-400 uppercase tracking-wider">{sub.stats_label}</span>
                                        <span className="font-bold text-gray-900 text-sm">{sub.stats_value}</span>
                                    </div>

                                    {sub.secondary_label && (
                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                            <span>{sub.secondary_label}</span>
                                            <span className="font-semibold text-gray-700">{sub.secondary_value}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                                        <span>Acceder al submódulo</span>
                                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {filteredModules.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-800">No se encontraron submódulos</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            No hay submódulos que coincidan con el término de búsqueda "{searchTerm}".
                        </p>
                        <button
                            onClick={() => setSearchTerm("")}
                            className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL DE ALERTAS DE STOCK CON FILTRADO POR TIPO, GRUPO Y CÓDIGO */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-start justify-between relative shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg sm:text-xl font-black">
                                            Centro de Alertas de Stock
                                        </h3>
                                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-100 backdrop-blur-xs">
                                            {alertTotalCount} {alertTotalCount === 1 ? "Insumo" : "Insumos"}
                                        </span>
                                    </div>
                                    <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
                                        Filtra por Tipo, Grupo y Código los insumos que requieren reabastecimiento urgente.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAlertModalOpen(false)}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filter Bar: Tipo, Grupo, Código y Estatus de Alerta */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-b border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                {/* Filtro por Tipo */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        1. Filtrar por Tipo / Submódulo
                                    </label>
                                    <select
                                        value={alertFilterType}
                                        onChange={(e) => {
                                            setAlertFilterType(e.target.value);
                                            setAlertFilterGroup("all");
                                        }}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="all">📦 TODOS LOS TIPOS (GLOBAL)</option>
                                        {(types || []).map((t: any) => (
                                            <option key={t.slug} value={t.slug}>
                                                Tipo {t.id}: {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por Grupo */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        2. Filtrar por Grupo
                                    </label>
                                    <select
                                        value={alertFilterGroup}
                                        onChange={(e) => setAlertFilterGroup(e.target.value)}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="all">📁 TODOS LOS GRUPOS</option>
                                        {alertModalGroups.map((g: any) => (
                                            <option key={`${g.number}-${g.name}`} value={String(g.number)}>
                                                G{g.number}: {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por Código / Nombre */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        3. Buscar Código, Parte o Nombre
                                    </label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={alertFilterCode}
                                            onChange={(e) => setAlertFilterCode(e.target.value)}
                                            placeholder="Ej. 1010001, CS-001..."
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sub-bar: Status Tabs & Result count */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-1.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("all")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${alertFilterStatus === "all" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        Todas las Alertas ({alertTotalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("out_of_stock")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${alertFilterStatus === "out_of_stock" ? "bg-red-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        🔴 Sin Stock ({alertOutOfStockCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("low_stock")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${alertFilterStatus === "low_stock" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        🟡 Stock Bajo ({alertLowStockCount})
                                    </button>
                                </div>

                                {(alertFilterType !== "all" || alertFilterGroup !== "all" || alertFilterCode.trim() !== "" || alertFilterStatus !== "all") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAlertFilterType("all");
                                            setAlertFilterGroup("all");
                                            setAlertFilterCode("");
                                            setAlertFilterStatus("all");
                                        }}
                                        className="text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Body / Table of Low Stock Items */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {filteredAlerts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                                                <th className="py-2.5 px-3 text-center">CÓDIGO</th>
                                                <th className="py-2.5 px-3">PRODUCTO / INSUMO</th>
                                                <th className="py-2.5 px-3">SUBMÓDULO & GRUPO</th>
                                                <th className="py-2.5 px-3 text-center">EXISTENCIA ACTUAL</th>
                                                <th className="py-2.5 px-3 text-center">STOCK MÍNIMO</th>
                                                <th className="py-2.5 px-3 text-center">ESTADO / DÉFICIT</th>
                                                <th className="py-2.5 px-3 text-center">ACCIÓN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            {filteredAlerts.map((alertItem: any) => {
                                                const isOut = alertItem.stock <= 0;
                                                return (
                                                    <tr key={alertItem.id} className="hover:bg-amber-50/50 transition-colors">
                                                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-900">
                                                            <div className="bg-slate-100 px-2 py-0.5 rounded text-xs inline-block">
                                                                {alertItem.code}
                                                            </div>
                                                            {alertItem.part_number && (
                                                                <div className="text-[10px] text-sky-700 font-medium mt-0.5">
                                                                    N/P: {alertItem.part_number}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-gray-900">
                                                                {alertItem.name}
                                                            </div>
                                                            {alertItem.consecutive && (
                                                                <div className="text-[10px] text-gray-400">
                                                                    Consecutivo: #{alertItem.consecutive}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[10px] font-extrabold text-indigo-700 uppercase">
                                                                {alertItem.type_name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-600 font-semibold">
                                                                G{alertItem.group_number}: {alertItem.group_name}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <span className={`font-black text-sm ${isOut ? "text-red-600" : "text-amber-600"}`}>
                                                                {alertItem.stock} {alertItem.unit}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <span className="font-bold text-gray-700 text-xs">
                                                                {alertItem.min_stock} {alertItem.unit}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            {isOut ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-200">
                                                                    🔴 Sin Stock
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                    🟡 Faltan {alertItem.deficit} {alertItem.unit}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsAlertModalOpen(false);
                                                                    router.get(route("apt.inventory.products.index"), {
                                                                        type: alertItem.type_slug,
                                                                        group_number: String(alertItem.group_number),
                                                                        search: alertItem.code,
                                                                    });
                                                                }}
                                                                title="Ver producto en la tabla principal"
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
                                                            >
                                                                <span>Ir a Tabla</span>
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-800">
                                        No se encontraron insumos con alerta bajo los filtros seleccionados
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Todos los insumos correspondientes a estos criterios cuentan con existencias superiores al stock mínimo.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Mostrando <strong>{filteredAlerts.length}</strong> de <strong>{alertTotalCount}</strong> insumos en alerta
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAlertModalOpen(false);
                                        router.get(route("apt.inventory.products.index"), { stock_status: "low_stock" });
                                    }}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                                >
                                    Ver todos en tabla principal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAlertModalOpen(false)}
                                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                                >
                                    Cerrar Menú
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
