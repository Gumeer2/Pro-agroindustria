import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Search,
    Calendar,
    Truck,
    Database,
    Filter,
    RotateCcw,
    Weight,
} from "lucide-react";

interface ShipmentRecord {
    id: number;
    ticket_number: string;
    shipment_order_id?: number | null;
    shipment_folio: string;
    client?: string;
    lot_folio?: string;
    warehouse: string;
    raw_warehouse?: string;
    net_tons: number;
    real_net_tons?: number;
    programmed_tons?: number | null;
    weight_type?: string;
    gross_tons?: number;
    tare_tons?: number;
    net_weight_kg?: number;
    tractor_plate: string;
    trailer_plate: string;
    operator_name?: string;
    transport_company?: string;
    presentation: string;
    date: string;
    date_only: string;
}

interface Metrics {
    filtered_count: number;
    filtered_tons: number;
    total_count: number;
    total_tons: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    shipments: PaginatedData<ShipmentRecord>;
    metrics: Metrics;
    warehouses: string[];
    filters: {
        warehouse?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

export default function Shipments({ shipments, metrics, warehouses, filters }: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [warehouse, setWarehouse] = useState(filters.warehouse || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");

    const handleApplyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            route("apt.inventory.urea-automotriz.shipments"),
            {
                warehouse: warehouse || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleResetFilters = () => {
        setSearch("");
        setWarehouse("");
        setDateFrom("");
        setDateTo("");
        router.get(
            route("apt.inventory.urea-automotriz.shipments"),
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const hasActiveFilters = Boolean(
        filters.warehouse || filters.date_from || filters.date_to || filters.search
    );

    const formatNumber = (num: number, decimals: number = 3) => {
        return (num || 0).toLocaleString("es-MX", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    const getWarehouseBadgeColor = (whName: string) => {
        const clean = (whName || "").toLowerCase();
        if (clean.includes("1")) return "bg-amber-100 text-amber-800 border-amber-200";
        if (clean.includes("2")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
        if (clean.includes("3")) return "bg-blue-100 text-blue-800 border-blue-200";
        if (clean.includes("4")) return "bg-purple-100 text-purple-800 border-purple-200";
        if (clean.includes("5")) return "bg-rose-100 text-rose-800 border-rose-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    return (
        <DashboardLayout>
            <Head title="Salidas y Embarques - Urea de Alta Pureza" />

            <div className="max-w-7xl mx-auto space-y-6 pb-12 px-2 sm:px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={route("apt.inventory.urea-automotriz.index", { tab: "summary" })}
                            className="p-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl shadow-xs transition-all flex items-center justify-center group"
                            title="Volver a Balance y Existencias de Urea de Alta Pureza"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:-translate-x-0.5 group-hover:text-indigo-700 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    Salidas y Embarques de Urea de Alta Pureza
                                </h1>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Urea de Alta Pureza
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Registro detallado de unidades despachadas y salidas completadas en báscula
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={route("apt.inventory.urea-automotriz.index", { tab: "summary" })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition-all"
                        >
                            <Database className="w-4 h-4 text-indigo-600" />
                            <span>Ver Balance de Existencias</span>
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Count of Exits */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                                Total de Salidas
                            </span>
                            <div className="p-2.5 bg-rose-100/70 text-rose-700 rounded-xl">
                                <Truck className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <span className="text-3xl font-black text-gray-900">
                                {metrics.filtered_count}
                            </span>
                            <span className="text-xs font-bold text-gray-500">
                                {metrics.filtered_count === 1 ? "salida" : "salidas"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {hasActiveFilters
                                ? `Filtradas de un total de ${metrics.total_count} salidas`
                                : `Total general en el sistema`}
                        </p>
                    </div>

                    {/* Card 2: Total Tons */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                                Volumen Despachado
                            </span>
                            <div className="p-2.5 bg-indigo-100/70 text-indigo-700 rounded-xl">
                                <Weight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                            <span className="text-3xl font-black text-gray-900">
                                {formatNumber(metrics.filtered_tons, 3)}
                            </span>
                            <span className="text-sm font-bold text-indigo-700">TM</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {hasActiveFilters
                                ? `Total general histórico: ${formatNumber(metrics.total_tons, 3)} TM`
                                : `Toneladas netas completadas`}
                        </p>
                    </div>

                    {/* Card 3: Selected Warehouse */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                Almacén Seleccionado
                            </span>
                            <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-xl">
                                <Database className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-lg font-black text-gray-900 truncate" title={filters.warehouse || "Todos los Almacenes"}>
                            {filters.warehouse || "Todos los Almacenes"}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 truncate">
                            {filters.warehouse
                                ? "Mostrando salidas exclusivas de este almacén"
                                : "Mostrando salidas de todos los almacenes"}
                        </p>
                    </div>

                    {/* Card 4: Date Filter Range */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full pointer-events-none group-hover:scale-105 transition-transform" />
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                                Rango de Fechas
                            </span>
                            <div className="p-2.5 bg-purple-100/70 text-purple-700 rounded-xl">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                            {filters.date_from || filters.date_to ? (
                                <div className="space-y-0.5">
                                    <span className="block text-xs font-semibold text-gray-500">Desde: {filters.date_from || "Inicio"}</span>
                                    <span className="block text-xs font-semibold text-gray-500">Hasta: {filters.date_to || "Hoy"}</span>
                                </div>
                            ) : (
                                <span className="text-base font-black text-gray-900">Todo el Historial</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {filters.date_from || filters.date_to ? "Filtro activo por período" : "Sin restricción de fecha"}
                        </p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
                    <form onSubmit={handleApplyFilters} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Search Field */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Buscar por Ticket, Folio o Lote
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Ej: 1049, PA2026, Lote..."
                                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Warehouse Select */}
                            <div className="md:col-span-3">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Almacén
                                </label>
                                <select
                                    value={warehouse}
                                    onChange={(e) => setWarehouse(e.target.value)}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                                >
                                    <option value="">Todos los Almacenes</option>
                                    {warehouses.map((wh) => (
                                        <option key={wh} value={wh}>
                                            {wh}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date From */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Fecha Desde
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* Date To */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    Fecha Hasta
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="md:col-span-1 flex gap-2">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    title="Aplicar Filtros"
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>Filtrar</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick filters / Reset bar */}
                        {hasActiveFilters && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                                <div className="flex items-center gap-2 text-gray-500 flex-wrap">
                                    <span className="font-semibold text-gray-700">Filtros aplicados:</span>
                                    {filters.warehouse && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium">
                                            Almacén: {filters.warehouse}
                                        </span>
                                    )}
                                    {filters.date_from && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium">
                                            Desde: {filters.date_from}
                                        </span>
                                    )}
                                    {filters.date_to && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium">
                                            Hasta: {filters.date_to}
                                        </span>
                                    )}
                                    {filters.search && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium">
                                            Búsqueda: "{filters.search}"
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Limpiar Filtros</span>
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Shipments Table */}
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Truck className="w-5 h-5 text-gray-700" />
                            <h2 className="text-base font-black text-gray-900">
                                Desglose de Salidas ({shipments.total})
                            </h2>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            Total página:{" "}
                            <strong className="text-gray-900 font-bold">
                                {formatNumber(
                                    shipments.data.reduce((acc, curr) => acc + (curr.net_tons || 0), 0),
                                    3
                                )}{" "}
                                TM
                            </strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="bg-[#1e293b] text-white text-[11px] uppercase tracking-wider font-extrabold">
                                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Ticket</th>
                                    <th className="py-3.5 px-3 whitespace-nowrap">Fecha y Hora</th>
                                    <th className="py-3.5 px-3 whitespace-nowrap">Folio Embarque</th>
                                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Almacén</th>
                                    <th className="py-3.5 px-3 whitespace-nowrap">Lote</th>
                                    <th className="py-3.5 px-3 text-center whitespace-nowrap">Presentación</th>
                                    <th className="py-3.5 px-4 text-right whitespace-nowrap text-rose-300">Peso Despachado (TM)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                                {shipments.data && shipments.data.length > 0 ? (
                                    shipments.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50/80 transition-colors"
                                        >
                                            {/* Ticket */}
                                            <td className="py-3.5 px-3 text-center font-black text-gray-900 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-800 font-mono text-xs font-bold">
                                                    #{item.ticket_number}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="py-3.5 px-3 whitespace-nowrap text-gray-700">
                                                <div className="flex items-center gap-1.5 font-medium text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>{item.date || "N/D"}</span>
                                                </div>
                                            </td>

                                            {/* Folio */}
                                            <td className="py-3.5 px-3 font-bold text-gray-800 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 text-indigo-800 font-mono text-xs">
                                                    {item.shipment_folio}
                                                </span>
                                            </td>

                                            {/* Warehouse */}
                                            <td className="py-3.5 px-3 whitespace-nowrap text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getWarehouseBadgeColor(
                                                        item.warehouse
                                                    )}`}
                                                >
                                                    <Database className="w-3 h-3" />
                                                    {item.warehouse}
                                                </span>
                                            </td>

                                            {/* Lot */}
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-800 font-mono text-xs font-bold"
                                                    title={item.lot_folio}
                                                >
                                                    {item.lot_folio || "Sin Lote"}
                                                </span>
                                            </td>

                                            {/* Presentation */}
                                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${
                                                        item.presentation === "ENVASADO"
                                                            ? "bg-purple-100 text-purple-800 border-purple-200"
                                                            : "bg-teal-100 text-teal-800 border-teal-200"
                                                    }`}
                                                >
                                                    {item.presentation || "Granel"}
                                                </span>
                                            </td>

                                            {/* Final Dispatched Weight (TM) */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap font-black text-rose-600 bg-rose-50/40">
                                                <div className="text-sm font-black">
                                                    {formatNumber(item.net_tons, 3)} TM
                                                </div>
                                                <div className="text-[10px] font-semibold text-gray-400">
                                                    {item.weight_type === "programado" ? "(Programado)" : "(Neto Báscula)"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-500">
                                            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-gray-700">
                                                No se encontraron salidas de Urea Automotriz
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Intenta modificando los filtros de fecha, almacén o búsqueda
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleResetFilters}
                                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>Quitar Filtros</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {shipments.links && shipments.links.length > 3 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-gray-500 font-medium">
                                Mostrando <span className="font-bold text-gray-800">{shipments.from || 0}</span> a{" "}
                                <span className="font-bold text-gray-800">{shipments.to || 0}</span> de{" "}
                                <span className="font-bold text-gray-800">{shipments.total}</span> salidas
                            </div>
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                                {shipments.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url &&
                                            router.get(
                                                link.url,
                                                {},
                                                { preserveState: true, preserveScroll: true }
                                            )
                                        }
                                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                                            link.active
                                                ? "bg-indigo-600 text-white font-bold shadow-xs"
                                                : link.url
                                                ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 cursor-pointer"
                                                : "text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
