import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import React, { useState } from "react";
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
}

const iconMap: Record<string, React.ElementType> = {
    Boxes,
    ArrowDownToLine,
    ArrowUpFromLine,
};

export default function ProductsHub({ auth, mainModules = [], metrics }: Props) {
    const [searchTerm, setSearchTerm] = useState("");

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
                            href={typeof route === "function" ? route("apt.inventory.index") : "/apt/inventory"}
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

                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Alertas de Stock
                                </span>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-bold text-amber-600">
                                    {metrics.out_of_stock_count}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    sin stock ({metrics.low_stock_count} bajo)
                                </span>
                            </div>
                            <div className="mt-3 text-xs text-amber-600 font-semibold flex items-center gap-1">
                                <span>{metrics.out_of_stock_count > 0 ? "Requiere reabastecimiento" : "Nivel óptimo de stock"}</span>
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
        </DashboardLayout>
    );
}
