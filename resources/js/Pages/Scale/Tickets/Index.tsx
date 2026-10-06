import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Search,
    Calendar,
    Filter,
    Download,
    Edit,
    Trash2,
    Printer,
    ChevronLeft,
    ChevronRight,
    X,
    ArrowLeft,
    FileText,
    Scale,
    Ban,
    RotateCcw,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { debounce, pickBy } from "lodash";
import Swal from "sweetalert2";
import { Settings, CheckCircle2 } from "lucide-react";
import ActiveScaleIndicator from "@/Components/ActiveScaleIndicator";

const ScaleModal = ({
    onSelect,
    currentScale,
    onClose
}: {
    onSelect: (id: number) => void;
    currentScale: number;
    onClose: () => void
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Scale className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">Seleccionar Báscula</h3>
                            <p className="text-indigo-100 text-sm font-medium">Báscula de trabajo activa</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="space-y-4">
                        {[1, 2, 3].map((id) => (
                            <button
                                key={id}
                                onClick={() => onSelect(id)}
                                className={`w-full group relative flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-200 ${currentScale === id
                                        ? "border-indigo-600 bg-indigo-50"
                                        : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl transition-colors ${currentScale === id
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                        }`}>
                                        <span className="text-xl font-black">{id}</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-gray-900 text-lg">BASCULA 0{id}</div>
                                    </div>
                                </div>
                                {currentScale === id && (
                                    <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default function Index({
    auth,
    tickets,
    filters,
}: {
    auth: any;
    tickets: any;
    filters: any;
}) {
    // Search State
    const [search, setSearch] = useState(filters.search || "");
    const [date, setDate] = useState(filters.date || "");
    const [status, setStatus] = useState(filters.status || "active");
    const [scaleId, setScaleId] = useState<number>(filters.scale_id ? parseInt(filters.scale_id) : 1);
    const [showScaleModal, setShowScaleModal] = useState(false);

    // Initial scale sync (display only)
    useEffect(() => {
        const saved = localStorage.getItem("selected_scale_id");
        if (saved) {
            setScaleId(parseInt(saved));
        }
    }, []);

    // Debounced Search
    const onSearchChange = useCallback(
        debounce((query: string, dateVal: string, statusVal: string) => {
            router.get(
                route("scale.tickets.index"),
                pickBy({ search: query, date: dateVal, status: statusVal, tab: filters.tab }),
                { preserveState: true, preserveScroll: true },
            );
        }, 300),
        [filters.tab],
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        onSearchChange(e.target.value, date, status);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
        onSearchChange(search, e.target.value, status);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        onSearchChange(search, date, newStatus);
    };

    const handleScaleSelect = (id: number) => {
        setScaleId(id);
        localStorage.setItem("selected_scale_id", id.toString());
        setShowScaleModal(false);
    };

    const handlePageChange = (pageNum: string | number) => {
        router.get(
            route("scale.tickets.index"),
            pickBy({ search, date, status, tab: filters.tab, page: pageNum }),
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        setSearch("");
        setDate("");
        setStatus("active");
        router.get(route("scale.tickets.index"), { tab: filters.tab });
    };

    const confirmDelete = (id: string, folio: string) => {
        Swal.fire({
            title: "¿ELIMINAR PERMANENTEMENTE?",
            text: `Se ELIMINARÁ el ticket asociado al Folio ${folio}. Esta acción es destructiva y solo debe usarse para corregir errores de captura graves.`,
            icon: "error",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar para siempre",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-3 font-bold",
                cancelButton: "rounded-xl px-6 py-3 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("scale.tickets.destroy", id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "¡Eliminado!",
                            text: "El ticket ha sido eliminado del sistema.",
                            icon: "success",
                            confirmButtonColor: "#3085d6",
                            timer: 2000,
                        });
                    },
                });
            }
        });
    };

    const confirmCancel = (id: string, folio: string) => {
        Swal.fire({
            title: "¿Cancelar Ticket?",
            text: `El ticket del folio ${folio} se marcará como CANCELADO. La unidad podrá volver a pesarse, pero el registro permanecerá en el historial para auditoría.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f59e0b",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, cancelar ticket",
            cancelButtonText: "Volver",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-3 font-bold",
                cancelButton: "rounded-xl px-6 py-3 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route("scale.tickets.cancel", id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "¡Cancelado!",
                            text: "El ticket ha sido cancelado. La orden está disponible para pesarse de nuevo.",
                            icon: "success",
                            confirmButtonColor: "#3085d6",
                            timer: 2000,
                        });
                    },
                });
            }
        });
    };

    const confirmReopen = (id: string, folio: string) => {
        Swal.fire({
            title: "¿Re-abrir Ticket?",
            text: `El ticket del folio ${folio} dejará de estar cancelado y volverá al historial activo.`,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#3b82f6",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, re-abrir",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-6 py-3 font-bold",
                cancelButton: "rounded-xl px-6 py-3 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route("scale.tickets.reopen", id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "¡Re-abierto!",
                            text: "El ticket ha sido restaurado.",
                            icon: "success",
                            confirmButtonColor: "#3085d6",
                            timer: 2000,
                        });
                    },
                });
            }
        });
    };

    return (
        <DashboardLayout
            user={auth.user}
            header="Historial de Tickets de Báscula"
        >
            <Head title="Historial Tickets" />

            <div className="py-8 max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <Link
                                href={route("scale.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al Panel de Báscula
                            </Link>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                                <Scale className="mr-3 h-8 w-8 text-indigo-600" />
                                Historial de Tickets
                            </h2>

                            <ActiveScaleIndicator 
                                scaleId={scaleId} 
                                onClick={() => setShowScaleModal(true)} 
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => {
                            router.get(route("scale.tickets.index"), { ...filters, tab: "sale" });
                        }}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${(filters.tab || "sale") === "sale"
                            ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        Ticket (O.E)
                    </button>
                    <button
                        onClick={() => {
                            router.get(route("scale.tickets.index"), { ...filters, tab: "vessel" });
                        }}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${filters.tab === "vessel"
                            ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        Ticket Barcos
                    </button>
                </div>

                {/* Filters Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar folio, chofer, placas..."
                                value={search}
                                onChange={handleSearch}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                            />
                        </div>

                        {/* Date */}
                        <div className="relative w-full md:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={handleDateChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative w-full md:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-5 w-5 text-indigo-400" />
                            </div>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white text-gray-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="active">MOSTRAR ACTIVOS</option>
                                <option value="pending">SOLO PENDIENTES</option>
                                <option value="completed">SOLO COMPLETOS</option>
                                <option value="cancelled">SOLO CANCELADOS</option>
                            </select>
                        </div>
                    </div>

                    {(search || date || status !== "active") && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 mr-2" /> Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Folio / Ticket
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Chofer / Unidad
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Operación
                                    </th>

                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Producto / {filters.tab === 'vessel' ? 'Barco' : 'Cliente'}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Pesos (kg)
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Estatus
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tickets.data.length > 0 ? (
                                    tickets.data.map((ticket: any) => (
                                        <tr
                                            key={ticket.id}
                                            className="hover:bg-indigo-50 transition-colors duration-150 group"
                                        >
                                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                                <div className="font-bold text-gray-900">
                                                    Folio: {ticket.folio}
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {ticket.ticket_number}
                                                </div>
                                                <div className="text-xs text-indigo-500 mt-1 font-medium">
                                                    {ticket.exit_at
                                                        ? new Date(
                                                            ticket.exit_at,
                                                        ).toLocaleDateString()
                                                        : "En proceso"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
                                                        {ticket.driver.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800 text-sm">
                                                            {ticket.driver}
                                                        </div>
                                                        <div className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                            {
                                                                ticket.vehicle_plate
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${ticket.operation === 'SALIDA'
                                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                                    : 'bg-orange-100 text-orange-800 border-orange-200'
                                                    }`}>
                                                    {ticket.operation}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-indigo-700 font-bold text-sm">
                                                    {ticket.product}
                                                </div>
                                                <div
                                                    className="text-gray-600 text-xs font-medium break-words max-w-[280px]"
                                                    title={ticket.provider}
                                                >
                                                    {ticket.provider}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-gray-900 font-mono font-medium text-sm">
                                                    <span className="text-gray-400 text-xs mr-1">
                                                        Neto:
                                                    </span>
                                                    {ticket.net_weight?.toLocaleString()}
                                                </div>
                                                <div className="text-gray-500 font-mono text-xs">
                                                    <span className="text-gray-300 mr-1">
                                                        Tara:
                                                    </span>
                                                    {ticket.tare_weight?.toLocaleString()}
                                                </div>
                                                <div className="text-gray-500 font-mono text-xs">
                                                    <span className="text-gray-300 mr-1">
                                                        Bruto:
                                                    </span>
                                                    {ticket.gross_weight?.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {ticket.status === "completed" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                                        Completado
                                                    </span>
                                                ) : ticket.status === "cancelled" ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                                                        Cancelado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* Reprint */}
                                                    <a
                                                        href={route(
                                                            "scale.ticket.print",
                                                            ticket.id,
                                                        )}
                                                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 p-2 rounded-md transition-colors"
                                                        title="Reimprimir Ticket"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </a>

                                                    {/* Edit - Only for Admin */}
                                                    {auth.user?.roles?.includes(
                                                        "Admin",
                                                    ) && (
                                                            <Link
                                                                href={route(
                                                                    "scale.tickets.edit",
                                                                    ticket.id,
                                                                )}
                                                                className="inline-flex items-center text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-md transition-colors"
                                                                title="Editar Ticket"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </Link>
                                                        )}

                                                    {/* Cancel Action - Only for Admin and non-cancelled tickets */}
                                                    {auth.user?.roles?.includes("Admin") && ticket.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => confirmCancel(ticket.ticket_id, ticket.folio)}
                                                            className="inline-flex items-center text-amber-500 hover:text-white hover:bg-amber-500 bg-amber-50 p-2 rounded-md transition-all shadow-sm"
                                                            title="Cancelar Ticket"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {/* Reopen Action - Only for Admin and cancelled tickets */}
                                                    {auth.user?.roles?.includes("Admin") && ticket.status === 'cancelled' && (
                                                        <button
                                                            onClick={() => confirmReopen(ticket.ticket_id, ticket.folio)}
                                                            className="inline-flex items-center text-blue-500 hover:text-white hover:bg-blue-500 bg-blue-50 p-2 rounded-md transition-all shadow-sm"
                                                            title="Re-abrir Ticket"
                                                        >
                                                            <RotateCcw className="w-5 h-5" />
                                                        </button>
                                                    )}

                                                    {/* Delete - Only for Admin */}
                                                    {auth.user?.roles?.includes(
                                                        "Admin",
                                                    ) && (
                                                            <button
                                                                onClick={() =>
                                                                    confirmDelete(
                                                                        ticket.id,
                                                                        ticket.folio,
                                                                    )
                                                                }
                                                                className="inline-flex items-center text-red-400 hover:text-white hover:bg-red-600 bg-red-50 p-2 rounded-md transition-all shadow-sm"
                                                                title="Eliminar permanentemente"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">
                                                No se encontraron tickets
                                            </p>
                                            <p className="text-sm">
                                                Intenta ajustar los filtros de
                                                búsqueda.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tickets.links && tickets.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 md:flex md:items-center md:justify-between">
                            <div className="text-sm text-gray-500 mb-4 md:mb-0">
                                Mostrando{" "}
                                <span className="font-medium">
                                    {tickets.from}
                                </span>{" "}
                                a{" "}
                                <span className="font-medium">
                                    {tickets.to}
                                </span>{" "}
                                de{" "}
                                <span className="font-medium">
                                    {tickets.total}
                                </span>{" "}
                                resultados
                            </div>
                            <div className="flex justify-center space-x-1">
                                {tickets.links.map((link: any, i: number) => {
                                    let label = link.label;
                                    if (label.includes('&laquo;') || label.toLowerCase().includes('anterior') || label.toLowerCase().includes('previous')) {
                                        label = 'Anterior';
                                    } else if (label.includes('&raquo;') || label.toLowerCase().includes('siguiente') || label.toLowerCase().includes('next')) {
                                        label = 'Siguiente';
                                    }

                                    let pageNum: string | null = null;
                                    if (link.url) {
                                        try {
                                            const parsed = new URL(link.url, window.location.origin);
                                            pageNum = parsed.searchParams.get("page") || "1";
                                        } catch (e) {
                                            pageNum = null;
                                        }
                                    }

                                    return pageNum ? (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handlePageChange(pageNum!)}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${link.active
                                                ? "bg-indigo-600 text-white shadow-sm font-bold"
                                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showScaleModal && (
                <ScaleModal
                    onSelect={handleScaleSelect}
                    currentScale={scaleId}
                    onClose={() => setShowScaleModal(false)}
                />
            )}
        </DashboardLayout>
    );
}
