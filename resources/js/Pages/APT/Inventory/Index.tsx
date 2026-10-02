import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import React, { useState } from "react";
import {
    Boxes,
    TrendingUp,
    ArrowLeft,
    Package,
    Search,
    ChevronRight,
    ArrowUpRight,
} from "lucide-react";

interface Metrics {
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface Props {
    auth: any;
    metrics?: Metrics;
}

export default function InventoryHub({ auth, metrics }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

    const getBackUrl = () => {
        try {
            if (fromParam === "production") {
                return typeof route === "function" ? route("apt.production") : "/apt/production";
            }
            return typeof route === "function" ? route("apt.index") : "/apt";
        } catch {
            return fromParam === "production" ? "/apt/production" : "/apt";
        }
    };

    const searchLower = searchTerm.toLowerCase();
    const showProductsCard = !searchTerm ||
        "entrada y salida de productos".includes(searchLower) ||
        "productos".includes(searchLower) ||
        "entrada".includes(searchLower) ||
        "salida".includes(searchLower) ||
        "insumos".includes(searchLower);

    const showProductionCard = !searchTerm ||
        "produccion".includes(searchLower) ||
        "producción".includes(searchLower) ||
        "urea".includes(searchLower) ||
        "planta".includes(searchLower);

    return (
        <DashboardLayout user={auth?.user} header="Gestión de Inventarios">
            <Head title="Gestión de Inventarios" />

            <div className="py-8 max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Navigation & Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href={getBackUrl()}
                            className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-3 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            {fromParam === "production" ? "Volver a Gestión de Almacenes" : "Volver al Panel APT"}
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl shadow-md shadow-indigo-200">
                                <Package className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                                    Gestión de Inventarios
                                    <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
                                        2 Módulos
                                    </span>
                                </h1>
                                <p className="text-gray-500 text-sm mt-0.5">
                                    Control integral de Entrada y Salida de Productos y Producción
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
                                placeholder="Buscar módulo..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Grid: 2 Symmetric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
                    {/* CARD 1: Entrada y Salida de Productos */}
                    {showProductsCard && (
                        <Link
                            href={typeof route === "function" ? route("apt.inventory.products-hub") : "/apt/inventory/products-hub"}
                            className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-sm hover:border-blue-500 hover:shadow-blue-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 shadow-sm transition-transform group-hover:scale-110 duration-200">
                                        <Boxes className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                                        Entrada / Salida
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                    Entrada y Salida de Productos
                                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                                </h2>
                                <p className="text-gray-500 text-sm mt-2.5 leading-relaxed">
                                    Control integral de catálogo de productos, registro de entradas, compras, traspasos y vales de salida de almacén.
                                </p>
                            </div>

                            <div className="mt-8 pt-5 border-t border-gray-100 relative z-10">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                                    <span className="font-medium text-gray-400 uppercase tracking-wider">Total Productos</span>
                                    <span className="font-bold text-gray-900 text-sm">
                                        {metrics?.total_products || 0} catálogo
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                    <span>Stock total:</span>
                                    <span className="font-semibold text-gray-700">
                                        {Number(metrics?.total_stock || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })} unidades
                                    </span>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-sm font-semibold text-blue-600 group-hover:text-blue-700 bg-blue-50/60 group-hover:bg-blue-100/80 px-4 py-2.5 rounded-xl transition-colors">
                                    <span>Acceder al módulo</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* CARD 2: Producción */}
                    {showProductionCard && (
                        <Link
                            href={typeof route === "function" ? route("apt.inventory.urea.index") + "?tab=production" : "/apt/inventory/urea?tab=production"}
                            className="bg-white rounded-3xl border border-teal-200 p-6 sm:p-8 shadow-sm hover:border-teal-500 hover:shadow-teal-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="p-4 rounded-2xl bg-teal-50 text-teal-600 shadow-sm transition-transform group-hover:scale-110 duration-200">
                                        <TrendingUp className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-teal-100 text-teal-800 rounded-full border border-teal-200 group-hover:bg-teal-900 group-hover:text-white transition-colors">
                                        Producción
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors flex items-center gap-2">
                                    Producción
                                    <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                                </h2>
                                <p className="text-gray-500 text-sm mt-2.5 leading-relaxed">
                                    Módulo especializado de producción diaria por turno, planta de origen (Urea 1 y 2) e inventario inicial balanceado.
                                </p>
                            </div>

                            <div className="mt-8 pt-5 border-t border-gray-100 relative z-10">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                                    <span className="font-medium text-gray-400 uppercase tracking-wider">Módulo especial</span>
                                    <span className="font-bold text-gray-900 text-sm">Producción e Inicial</span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                    <span>Plantas:</span>
                                    <span className="font-semibold text-gray-700">UREA 1 / UREA 2</span>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-sm font-semibold text-teal-600 group-hover:text-teal-700 bg-teal-50/60 group-hover:bg-teal-100/80 px-4 py-2.5 rounded-xl transition-colors">
                                    <span>Acceder al módulo</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Empty State when search returns nothing */}
                {!showProductsCard && !showProductionCard && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6 max-w-xl mx-auto">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-gray-800">No se encontraron módulos</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            No hay módulos que coincidan con el término de búsqueda "{searchTerm}".
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
