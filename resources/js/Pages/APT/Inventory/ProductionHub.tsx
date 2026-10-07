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
} from "lucide-react";
import Swal from "sweetalert2";

interface Props {
    auth: any;
    metrics?: {
        urea_agricola_total?: number;
        urea_agricola_daily?: number;
        urea_agricola_initial?: number;
        urea_agricola_shipped?: number;
        urea_industrial_total?: number;
        urea_industrial_daily?: number;
        urea_industrial_initial?: number;
        urea_industrial_shipped?: number;
    };
}

export default function ProductionHub({ auth, metrics }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

    const getBackUrl = () => {
        try {
            if (fromParam === "production") {
                return typeof route === "function" ? route("apt.production") : "/apt/production";
            }
            return typeof route === "function" ? route("apt.inventory.index") : "/apt/inventory";
        } catch {
            return "/apt/inventory";
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

    const searchLower = searchTerm.toLowerCase();

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
            href: typeof route === "function" ? route("apt.inventory.urea.index") + "?tab=production" : "/apt/inventory/urea?tab=production",
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
            href: typeof route === "function" ? route("apt.inventory.urea-industrial.index") + "?tab=production" : "/apt/inventory/urea-industrial?tab=production",
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
            specialModuleLabel: "Módulo especial",
            specialModuleValue: "Recepción y Balance",
            secondaryLabel: "Origen:",
            secondaryValue: "Barco / Muelle",
            active: false,
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
            specialModuleLabel: "Módulo especial",
            specialModuleValue: "Fosfato Diamónico",
            secondaryLabel: "Presentación:",
            secondaryValue: "Granel / Envasado",
            active: false,
        },
    ];

    const filteredModules = modules.filter(
        (mod) =>
            !searchTerm ||
            mod.name.toLowerCase().includes(searchLower) ||
            mod.description.toLowerCase().includes(searchLower)
    );

    return (
        <DashboardLayout user={auth?.user} header="Gestión de Inventarios: Producción">
            <Head title="Producción - Gestión de Inventarios" />

            <div className="py-8 max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Navigation & Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
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
                                        4 Tarjetas
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

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
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

                                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
                                        {mod.name}
                                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-teal-600" />
                                    </h2>
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
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 mt-6 max-w-xl mx-auto">
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
