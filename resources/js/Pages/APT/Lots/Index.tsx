import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Search,
    ArrowLeft,
    Plus,
    X,
    Database,
    Factory,
    User,
    Calendar,
    Edit,
    Trash2,
    CheckCircle,
    Archive,
    RotateCcw,
    Package,
    Boxes,
} from "lucide-react";
import { useState, useEffect } from "react";
// @ts-ignore
import { pickBy } from "lodash";
import Swal from "sweetalert2";

interface Lot {
    id: string;
    folio: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
    status: "open" | "closed";
    user?: {
        name: string;
    };
    created_at: string;
}

interface PageProps {
    lots: {
        data: Lot[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search?: string;
    };
    auth: any;
}

export default function Index({ auth, lots, filters }: PageProps) {
    const { flash } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search || "");
    const [showAlert, setShowAlert] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const handleSearch = (newSearch?: string) => {
        const s = newSearch !== undefined ? newSearch : search;
        const from = new URLSearchParams(window.location.search).get("from");
        router.get(
            route("apt.lots.index"),
            pickBy({ search: s, from }),
            { preserveState: true },
        );
    };

    const handleDelete = (lotId: string) => {
        Swal.fire({
            title: "¿Eliminar Lote?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.lots.destroy", lotId));
            }
        });
    };

    const handleToggleStatus = (lot: Lot) => {
        const action = lot.status === "open" ? "Cerrar" : "Reabrir";
        const color = lot.status === "open" ? "#d97706" : "#059669"; // Amber vs Emerald

        Swal.fire({
            title: `¿${action} Lote?`,
            text: lot.status === "open"
                ? "El lote pasará a estado CERRADO."
                : "El lote volverá a estar ABIERTO.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: color,
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Sí, ${action.toLowerCase()}`,
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route("apt.lots.toggle", lot.id));
            }
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Gestión de Lotes">
            <Head title="Gestión de Lotes" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Dynamic Alert */}
                {showAlert && flash?.success && (
                    <div className="fixed top-24 right-8 z-50 animate-fade-in-right">
                        <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-center max-w-md">
                            <div className="bg-green-100 p-2 rounded-full mr-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 mr-4">
                                <h4 className="text-green-900 font-bold text-sm">Operación Exitosa</h4>
                                <p className="text-green-700 text-xs font-medium">{flash.success}</p>
                            </div>
                            <button
                                onClick={() => setShowAlert(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <Link
                                href={new URLSearchParams(window.location.search).get("from") === "production" ? route("apt.production") : route("apt.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {new URLSearchParams(window.location.search).get("from") === "production" ? "Volver al menú de submódulos" : "Volver a APT"}
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                            <Database className="mr-3 h-8 w-8 text-indigo-600" />
                            Gestión de Lotes
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={`${route("apt.lots.create")}${new URLSearchParams(window.location.search).get("from") === "production" ? "?from=production" : ""}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Crear Nuevo Lote
                        </Link>
                    </div>
                </div>


                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                            placeholder="Buscar por folio, almacén..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr className="text-white">
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Folio</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Ubicación</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Planta Origen</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Creado Por</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha Creación</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lots.data.length > 0 ? (
                                    lots.data.map((lot) => (
                                        <tr key={lot.id} className="hover:bg-indigo-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-indigo-700 uppercase">
                                                    {lot.folio}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div className="flex flex-col">
                                                    <span className="font-bold flex items-center gap-1">
                                                        <Database className="w-3 h-3 text-gray-400" />
                                                        {lot.warehouse}
                                                    </span>
                                                    {lot.cubicle && (
                                                        <span className="text-xs text-gray-500 ml-4">
                                                            Cubículo: {lot.cubicle}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <Factory className="w-3 h-3 text-gray-400" />
                                                    {lot.plant_origin}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    {lot.user?.name || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {new Date(lot.created_at).toLocaleString()}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">

                                                    {/* Toggle Status Button (Acts as Status Indicator) */}
                                                    <button
                                                        onClick={() => handleToggleStatus(lot)}
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg border transition-all font-bold ${lot.status === 'open'
                                                                ? "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100 hover:border-amber-300"
                                                                : "text-green-600 bg-green-50 border-green-100 hover:bg-green-100 hover:border-green-300"
                                                            }`}
                                                        title={lot.status === 'open' ? "Cerrar Lote" : "Reabrir Lote"}
                                                    >
                                                        {lot.status === 'open' ? (
                                                            <>
                                                                <Archive className="w-4 h-4 mr-1.5" />
                                                                Cerrar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RotateCcw className="w-4 h-4 mr-1.5" />
                                                                Abrir
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Edit */}
                                                    <Link
                                                        href={`${route("apt.lots.edit", lot.id)}${new URLSearchParams(window.location.search).get("from") === "production" ? "?from=production" : ""}`}
                                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:border-indigo-300 transition-all font-bold"
                                                        title="Editar Lote"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1.5" />
                                                        Editar
                                                    </Link>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(lot.id)}
                                                        className="inline-flex items-center text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-300 transition-all font-bold"
                                                        title="Eliminar Lote"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1.5" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            <Database className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No se encontraron lotes</p>
                                            <p className="text-sm">Intenta ajustar los filtros de búsqueda.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {lots.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 md:flex md:items-center md:justify-between">
                            <div className="text-sm text-gray-500 mb-4 md:mb-0">
                                Mostrando <span className="font-medium">{lots.from}</span> a{" "}
                                <span className="font-medium">{lots.to}</span> de{" "}
                                <span className="font-medium">{lots.total}</span> resultados
                            </div>
                            <div className="flex justify-center space-x-1">
                                {lots.links.map((link, key) =>
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${link.active
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
