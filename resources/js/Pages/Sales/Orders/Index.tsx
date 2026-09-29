import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Plus,
    Search,
    FileText,
    ArrowLeft,
    CheckCircle,
    X,
    MoreVertical,
    MoreHorizontal,
    Settings,
    Eye,
    Edit2,
    Lock,
    Unlock,
    Calendar,
} from "lucide-react";
import { useState, useEffect, useMemo, Fragment } from "react";
import Modal from "@/Components/Modal";
import { Menu, Transition } from "@headlessui/react";
import { Truck, ChevronLeft, ChevronRight } from "lucide-react";
import Pagination from "@/Components/Pagination";

interface Client {
    id: number;
    business_name: string;
    rfc: string;
}

interface Order {
    id: string;
    folio: string;
    sale_order: string;
    client: Client;
    product: {
        name: string;
    };
    total_quantity: number;
    loaded_quantity: number;
    balance: number;
    status: string;
    created_at: string;
    loading_orders: Array<{
        id: string;
        folio: string;
        status: string;
        programmed_tons?: number;
        shipment_order?: {
            folio: string;
        };
        driver?: {
            name: string;
        };
        transporter?: {
            name: string;
        };
        weight_ticket?: {
            ticket_number: string;
            net_weight: number;
            weighing_status: string;
        };
    }>;
}

export default function Index({
    auth,
    orders,
    filters,
    flash,
}: {
    auth: any;
    orders: {
        data: Order[];
        links: any[];
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        historical_date?: string;
    };
    flash?: { success?: string; error?: string };
}) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "created");
    const [historicalDate, setHistoricalDate] = useState(filters.historical_date || "");
    const [showAlert, setShowAlert] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [breakdownLoading, setBreakdownLoading] = useState(false);
    const [breakdownData, setBreakdownData] = useState<any[]>([]);
    const [breakdownLinks, setBreakdownLinks] = useState<any[]>([]);
    const [currentTripPage, setCurrentTripPage] = useState(1);
    const [totalTripPages, setTotalTripPages] = useState(1);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const formatter = new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 3,
        minimumFractionDigits: 0,
    });

    const toggleStatus = (id: string) => {
        router.patch(
            route("sales.toggle-status", id),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const hasSearchChanged = search !== (filters.search || "");
            const hasStatusChanged = status !== (filters.status || "");
            const hasDateChanged = historicalDate !== (filters.historical_date || "");

            if (hasSearchChanged || hasStatusChanged || hasDateChanged) {
                router.get(
                    route("sales.orders.index"),
                    { search, status, historical_date: historicalDate },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    }
                );
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [search, status, historicalDate]);

    const filteredOrders = orders.data;

    const handleOpenBreakdown = async (order: Order, page = 1) => {
        if (page === 1) setSelectedOrder(order);
        setBreakdownLoading(true);
        setCurrentTripPage(page);

        try {
            const response = await fetch(route("sales.orders.breakdown", { id: order.id, page }));
            const data = await response.json();
            setBreakdownData(data.data || []);
            setBreakdownLinks(data.links || []);
            setTotalTripPages(data.last_page || 1);
        } catch (error) {
            console.error("Error fetching breakdown:", error);
        } finally {
            setBreakdownLoading(false);
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Órdenes de Venta">
            <Head title="Órdenes de Venta" />

            <div className="py-8 max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 relative">
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
                                href={
                                    new URLSearchParams(window.location.search).get("from") === "documentation"
                                        ? route("documentation.index")
                                        : auth.user?.roles?.includes("Documentador")
                                            ? route("documentation.index")
                                            : route("sales.index")
                                }
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {new URLSearchParams(window.location.search).get("from") === "documentation"
                                    ? "Volver a Documentación"
                                    : auth.user?.roles?.includes("Documentador")
                                        ? "Volver a Documentación"
                                        : "Volver a Comercialización"}
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                            <FileText className="mr-3 h-8 w-8 text-indigo-600" />
                            Historial de Órdenes de Venta
                        </h2>
                    </div>
                    {/* Only show create button for non-Documentador roles */}
                    {!auth.user?.roles?.includes("Documentador") && (
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <Link
                                href={route("sales.create")}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Nueva Orden de Venta
                            </Link>
                        </div>
                    )}
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por folio, cliente..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={!!historicalDate}
                            className={`block w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow font-bold ${historicalDate ? 'text-gray-400 bg-gray-50 opacity-50 cursor-not-allowed' : 'text-gray-700'}`}
                        >
                            <option value="created">ABIERTAS</option>
                            <option value="closed">CERRADAS</option>
                            {filters.status === 'historical' && <option value="historical">HISTÓRICO</option>}
                        </select>

                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center relative group focus-within:ring-2 ring-indigo-500/20">
                            <div className="bg-indigo-50 p-2 rounded-lg ml-1">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="px-3 text-sm font-bold text-gray-700 pointer-events-none">
                                {historicalDate
                                    ? historicalDate.split("-").reverse().join("/")
                                    : "dd/mm/aaaa"}
                            </span>
                            <input
                                type="date"
                                value={historicalDate}
                                onChange={(e) => setHistoricalDate(e.target.value)}
                                onClick={(event) => {
                                    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
                                    if (input.showPicker) {
                                        event.preventDefault();
                                        input.showPicker();
                                    }
                                }}
                                aria-label="Seleccionar fecha histórica"
                                className="absolute inset-0 z-10 h-full w-full opacity-0 cursor-pointer"
                            />
                            {historicalDate && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHistoricalDate("");
                                    }}
                                    className="relative z-20 p-1 hover:bg-gray-100 rounded-full mr-1"
                                    title="Limpiar filtro histórico"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full ml-4 whitespace-nowrap">
                        {orders.total} Registros
                    </span>
                </div>

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr>
                                    <th className="sticky left-0 px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider bg-indigo-800 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                                        <Settings className="w-5 h-5 mx-auto opacity-50" />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Orden de Venta
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Estatus
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                        Solicitado
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                        Cargado
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                        Saldo
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No hay órdenes registradas</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-indigo-50 transition-colors duration-150 group"
                                        >
                                            <td className="sticky left-0 px-4 py-4 whitespace-nowrap text-center text-sm font-medium bg-white group-hover:bg-indigo-50 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] transition-colors">
                                                {auth.user?.roles?.includes("Documentador") ? (
                                                    <Link
                                                        href={route("sales.show", {
                                                            sales: order.id,
                                                            module: "sales",
                                                        })}
                                                        className="inline-flex items-center p-2 rounded-full text-indigo-500 hover:bg-indigo-100 transition-colors"
                                                        title="Ver Detalle"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </Link>
                                                ) : (
                                                    <Menu as="div" className="relative inline-block text-left">
                                                        <div>
                                                            <Menu.Button className="inline-flex justify-center w-full px-2 py-2 text-sm font-medium text-gray-700 bg-transparent rounded-full hover:bg-white/50 focus:outline-none transition-all group-hover:bg-indigo-100/50">
                                                                <MoreHorizontal className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600" aria-hidden="true" />
                                                            </Menu.Button>
                                                        </div>
                                                        <Transition
                                                            as={Fragment}
                                                            enter="transition ease-out duration-100"
                                                            enterFrom="transform opacity-0 scale-95"
                                                            enterTo="transform opacity-100 scale-100"
                                                            leave="transition ease-in duration-75"
                                                            leaveFrom="transform opacity-100 scale-100"
                                                            leaveTo="transform opacity-0 scale-95"
                                                        >
                                                            <Menu.Items
                                                                anchor="bottom start"
                                                                className="w-48 origin-top-left bg-white divide-y divide-gray-100 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                                            >
                                                                <div className="px-1 py-1">
                                                                    <Menu.Item>
                                                                        {({ active }) => (
                                                                            <Link
                                                                                href={route("sales.show", {
                                                                                    sales: order.id,
                                                                                    module: "sales",
                                                                                })}
                                                                                className={`${active ? 'bg-indigo-600 text-white' : 'text-gray-900'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                            >
                                                                                <Eye className={`w-4 h-4 mr-2 ${active ? 'text-white' : 'text-indigo-500'}`} />
                                                                                Ver Detalle
                                                                            </Link>
                                                                        )}
                                                                    </Menu.Item>
                                                                    {!auth.user?.roles?.includes("Documentador") && order.status === "created" && (
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <Link
                                                                                    href={route("sales.edit", order.id)}
                                                                                    className={`${active ? 'bg-indigo-600 text-white' : 'text-gray-900'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                                >
                                                                                    <Edit2 className={`w-4 h-4 mr-2 ${active ? 'text-white' : 'text-amber-500'}`} />
                                                                                    Editar Orden
                                                                                </Link>
                                                                            )}
                                                                        </Menu.Item>
                                                                    )}
                                                                </div>
                                                                <div className="px-1 py-1">
                                                                    {!auth.user?.roles?.includes("Documentador") && order.status === "created" && (
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => toggleStatus(order.id)}
                                                                                    className={`${active ? 'bg-red-600 text-white' : 'text-red-600'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                                >
                                                                                    <Lock className={`w-4 h-4 mr-2 ${active ? 'text-white' : 'text-red-500'}`} />
                                                                                    Cerrar Orden
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                    )}
                                                                    {!auth.user?.roles?.includes("Documentador") && order.status === "closed" && (
                                                                        <Menu.Item>
                                                                            {({ active }) => (
                                                                                <button
                                                                                    onClick={() => toggleStatus(order.id)}
                                                                                    className={`${active ? 'bg-green-600 text-white' : 'text-green-600'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                                >
                                                                                    <Unlock className={`w-4 h-4 mr-2 ${active ? 'text-white' : 'text-green-500'}`} />
                                                                                    Abrir Orden
                                                                                </button>
                                                                            )}
                                                                        </Menu.Item>
                                                                    )}
                                                                </div>
                                                            </Menu.Items>
                                                        </Transition>
                                                    </Menu>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                                                {order.folio || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                {order.product?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                {order.client?.business_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold
                                                ${(order.status === "created" || order.status === "open" || order.status === "in_progress") ? "bg-blue-100 text-blue-800" : ""}
                                                ${(order.status === "closed" || order.status === "completed") ? "bg-red-100 text-red-800" : ""}
                                                ${order.status === "cancelled" ? "bg-gray-100 text-gray-800" : ""}
                                            `}
                                                >
                                                    {(() => {
                                                        const s = order.status.toLowerCase();
                                                        if (s === 'created' || s === 'open' || s === 'in_progress') return 'ABIERTA';
                                                        if (s === 'closed' || s === 'completed') return 'CERRADA';
                                                        if (s === 'cancelled') return 'CANCELADA';
                                                        return s.toUpperCase();
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-center">
                                                {formatter.format(Number(order.total_quantity))} TM
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700 text-center">
                                                <button
                                                    onClick={() => handleOpenBreakdown(order)}
                                                    className="hover:underline flex items-center justify-center mx-auto"
                                                >
                                                    {formatter.format(Number(order.loaded_quantity))} TM
                                                    <Truck className="w-3 h-3 ml-1 opacity-50" />
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-amber-700 text-center">
                                                {formatter.format(Number(order.balance))} TM
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {/* TOTALS FOOTER */}
                            {filteredOrders.length > 0 && (
                                <tfoot className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                                    <tr>
                                        <td className="sticky left-0 bg-gray-100 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] pt-[50.5px]"></td>
                                        <td colSpan={4} className="px-6 py-4 text-right text-sm text-indigo-900 uppercase tracking-wider">
                                            TOTAL GENERAL
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-900">
                                            {formatter.format(filteredOrders.reduce((sum, order) => sum + Number(order.total_quantity), 0))} TM
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-emerald-700">
                                            {formatter.format(filteredOrders.reduce((sum, order) => sum + Number(order.loaded_quantity), 0))} TM
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-amber-700">
                                            {formatter.format(filteredOrders.reduce((sum, order) => sum + Number(order.balance), 0))} TM
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                <Pagination links={orders.links} />
            </div>

            <Modal show={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="5xl">
                <div className="flex flex-col max-h-[85vh]">
                    {/* Header - Sticky */}
                    <div className="p-6 border-b border-gray-100 bg-indigo-50/50 sticky top-0 z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-extrabold text-indigo-900 flex items-center mb-1">
                                    <Truck className="mr-3 h-7 w-7 text-indigo-600" />
                                    Desglose de Viajes: {selectedOrder?.folio}
                                </h3>
                                <p className="text-indigo-700/70 text-sm font-medium">
                                    {selectedOrder?.client?.business_name} • {selectedOrder?.product?.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 transition-colors hover:bg-white rounded-full text-gray-400 hover:text-indigo-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Summary Info in Header */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="bg-white/60 p-3 rounded-lg border border-indigo-100 flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-indigo-400">Solicitado</span>
                                <span className="text-lg font-black text-indigo-900">{formatter.format(selectedOrder?.total_quantity || 0)} TM</span>
                            </div>
                            <div className="bg-white/60 p-3 rounded-lg border border-emerald-100 flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-emerald-400">Total Cargado</span>
                                <span className="text-lg font-black text-emerald-700">{formatter.format(selectedOrder?.loaded_quantity || 0)} TM</span>
                            </div>
                            <div className="bg-white/60 p-3 rounded-lg border border-amber-100 flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-amber-400">Saldo</span>
                                <span className="text-lg font-black text-amber-700">{formatter.format(selectedOrder?.balance || 0)} TM</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-0 min-h-[300px] flex flex-col">
                        {breakdownLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-gray-500 font-medium">Cargando detalles del viaje...</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white sticky top-0 z-20 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-indigo-900/50 uppercase tracking-widest bg-gray-50/50">O. Embarque</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-indigo-900/50 uppercase tracking-widest bg-gray-50/50">Viaje / Ticket</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black text-indigo-900/50 uppercase tracking-widest bg-gray-50/50">Operador</th>
                                        <th className="px-6 py-3 text-center text-[10px] font-black text-indigo-900/50 uppercase tracking-widest bg-gray-50/50">Estatus Báscula</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black text-indigo-900/50 uppercase tracking-widest bg-gray-50/50 border-l border-indigo-50">Peso (TM)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {breakdownData.length > 0 ? (
                                        breakdownData.map((trip) => {
                                            const isCompleted = trip.weight_ticket?.weighing_status === 'completed';
                                            const weight = isCompleted
                                                ? (trip.weight_ticket?.net_weight || 0) / 1000
                                                : (trip.programmed_tons || 0);

                                            const getStatusTranslation = (status: string) => {
                                                const translations: Record<string, string> = {
                                                    'created': 'CREADO',
                                                    'in_progress': 'EN CURSO',
                                                    'completed': 'COMPLETADO',
                                                    'cancelled': 'CANCELADO',
                                                    'pending': 'PENDIENTE',
                                                };
                                                return translations[status.toLowerCase()] || status.toUpperCase();
                                            };

                                            return (
                                                <tr key={trip.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-800">
                                                        {trip.shipment_order?.folio || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-black text-gray-900">{trip.folio}</div>
                                                        <div className="text-[10px] font-bold text-indigo-400 flex items-center">
                                                            <FileText className="w-3 h-3 mr-1" />
                                                            {trip.weight_ticket?.ticket_number || 'SIN TICKET'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-700 group-hover:text-indigo-900 transition-colors uppercase">{trip.driver?.name || '---'}</div>
                                                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">{trip.transporter?.name || 'FLOTA INTERNA'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center shadow-sm 
                                                        ${isCompleted ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                                trip.weight_ticket ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                                    'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                                            {isCompleted && <CheckCircle className="w-3 h-3 mr-1" />}
                                                            {trip.weight_ticket?.weighing_status ? getStatusTranslation(trip.weight_ticket.weighing_status) : 'PENDIENTE'}
                                                        </div>
                                                        <div className="text-[10px] text-indigo-300 font-bold mt-1 uppercase tracking-tighter">
                                                            {getStatusTranslation(trip.status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-right text-emerald-700 bg-emerald-50/10 border-l border-indigo-50">
                                                        {formatter.format(weight)} TM
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-gray-400 italic font-medium">
                                                <Truck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                                No se encontraron viajes registrados para esta orden
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer / Pagination - Fixed */}
                    {totalTripPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between rounded-b-lg shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Página {currentTripPage} de {totalTripPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenBreakdown(selectedOrder!, currentTripPage - 1)}
                                    disabled={currentTripPage === 1 || breakdownLoading}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleOpenBreakdown(selectedOrder!, currentTripPage + 1)}
                                    disabled={currentTripPage === totalTripPages || breakdownLoading}
                                    className="p-2 border border-gray-200 rounded-lg hover:bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </DashboardLayout >
    );
}
