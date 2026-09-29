import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    Scan,
    User,
    CheckCircle,
    XCircle,
    Clock,
    Truck,
    Search,
    FileText,
    LogOut,
    Calendar,
    PlusCircle,
    Edit3,
    ShieldAlert,
    ArrowLeft,
    AlertTriangle,
    AlertCircle,
    Ban,
    Printer
} from "lucide-react";
import Modal from "@/Components/Modal";
import axios from "axios";
import Swal from "sweetalert2";

export default function Exits({
    auth,
    in_plant = [],
    pending_count = 0,
}: {
    auth: any;
    in_plant: any[];
    pending_count?: number;
}) {
    const [inPlantLogs, setInPlantLogs] = useState<any[]>(in_plant);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewingLog, setViewingLog] = useState<any>(null);

    useEffect(() => {
        setInPlantLogs(in_plant);
    }, [in_plant]);

    // Selection state for checkboxes (per-row / per-order)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

    // Exit Modal (supports single or multiple selected items: { log: any; order: any })
    const [exitModalItems, setExitModalItems] = useState<{ log: any; order: any }[]>([]);
    const [exitDate, setExitDate] = useState("");
    const [exitTime, setExitTime] = useState("");

    // SADER Convoy Validation State
    const [convoyNumber, setConvoyNumber] = useState("");
    const [convoyValidated, setConvoyValidated] = useState(false);

    // Open Exit Modal for single or multiple items
    const openExitModal = (items: { log: any; order: any }[]) => {
        if (!items || items.length === 0) return;
        setExitModalItems(items);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        setExitDate(`${year}-${month}-${day}`);
        setExitTime(`${hours}:${minutes}`);
        setConvoyNumber("");
        setConvoyValidated(false);
    };

    // Toggle individual row selection
    const toggleSelectRow = (rowKey: string) => {
        setSelectedRowKeys((curr) =>
            curr.includes(rowKey) ? curr.filter((k) => k !== rowKey) : [...curr, rowKey]
        );
    };

    // Order Selection Modal (Linking 1 to 3 orders)
    const [orderModalLog, setOrderModalLog] = useState<any>(null);
    const [availableOrders, setAvailableOrders] = useState<any[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Open order selection modal and fetch available orders from server
    const openOrderSelectionModal = async (log: any) => {
        setOrderModalLog(log);
        setLoadingOrders(true);
        setAvailableOrders([]);

        // Preselect already linked order IDs
        const currentOrders = log.shipment_orders_data || log.shipment_orders || [];
        const currentLinked = currentOrders.map((o: any) => o.id);
        setSelectedOrderIds(currentLinked);

        try {
            const response = await axios.get(route("surveillance.available-orders", log.id));
            setAvailableOrders(response.data.orders || []);
            if (response.data.linked_order_ids && response.data.linked_order_ids.length > 0) {
                setSelectedOrderIds(response.data.linked_order_ids);
            }
        } catch (error) {
            console.error("Error fetching available orders:", error);
            Swal.fire({
                icon: "error",
                title: "Error al cargar órdenes",
                text: "No se pudieron obtener las órdenes de embarque del operador.",
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
            });
        } finally {
            setLoadingOrders(false);
        }
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds((curr) => {
            if (curr.includes(orderId)) return curr.filter((id) => id !== orderId);
            if (curr.length >= 3) {
                Swal.fire({
                    icon: "warning",
                    title: "Máximo 3 órdenes",
                    text: "Solo se pueden vincular hasta un máximo de 3 órdenes por operador.",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 2500,
                });
                return curr;
            }
            return [...curr, orderId];
        });
    };

    const saveAttachedOrders = () => {
        if (!orderModalLog || selectedOrderIds.length === 0) return;

        router.post(
            route("surveillance.attach-orders", orderModalLog.id),
            {
                order_ids: selectedOrderIds,
            },
            {
                onSuccess: () => {
                    const chosenOrders = availableOrders.filter((o) => selectedOrderIds.includes(o.id));
                    const allCompleted = chosenOrders.every((o: any) => o.is_completed || o.has_destare || o.is_cancelled);
                    const uncompleted = chosenOrders
                        .filter((o: any) => !o.is_completed && !o.has_destare && !o.is_cancelled)
                        .map((o: any) => o.folio || o.id);

                    const hasSader = chosenOrders.some((o: any) =>
                        o.is_sader ||
                        (o.consigned_to && String(o.consigned_to).toUpperCase().includes("SADER")) ||
                        (o.client && String(o.client.business_name || o.client.name || o.client).toUpperCase().includes("SADER")) ||
                        (o.client_name && String(o.client_name).toUpperCase().includes("SADER")) ||
                        (o.destination && String(o.destination).toUpperCase().includes("SADER"))
                    );

                    setInPlantLogs((curr) =>
                        curr.map((log) =>
                            log.id === orderModalLog.id
                                ? {
                                      ...log,
                                      shipment_orders: chosenOrders,
                                      shipment_orders_data: chosenOrders,
                                      can_exit: allCompleted,
                                      uncompleted_folios: uncompleted,
                                      has_sader_orders: hasSader,
                                  }
                                : log
                        )
                    );
                    setOrderModalLog(null);
                    Swal.fire({
                        icon: "success",
                        title: "Órdenes Vinculadas",
                        text: `${selectedOrderIds.length} orden(es) de embarque vinculada(s) correctamente.`,
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 3000,
                    });
                },
            }
        );
    };

    const isLogSader = (log: any) => {
        if (!log) return false;
        if (log.has_sader_orders) return true;
        const orders = log.shipment_orders_data || log.shipment_orders || [];
        return orders.some(
            (o: any) =>
                o.is_sader ||
                (o.consigned_to && String(o.consigned_to).toUpperCase().includes("SADER")) ||
                (o.client && String(o.client.business_name || o.client.name || o.client).toUpperCase().includes("SADER")) ||
                (o.client_name && String(o.client_name).toUpperCase().includes("SADER")) ||
                (o.destination && String(o.destination).toUpperCase().includes("SADER"))
        );
    };

    const isItemSader = (item: { log: any; order: any }) => {
        if (item.order) {
            const o = item.order;
            return (
                o.is_sader ||
                (o.consigned_to && String(o.consigned_to).toUpperCase().includes("SADER")) ||
                (o.client && String(o.client.business_name || o.client.name || o.client).toUpperCase().includes("SADER")) ||
                (o.client_name && String(o.client_name).toUpperCase().includes("SADER")) ||
                (o.destination && String(o.destination).toUpperCase().includes("SADER"))
            );
        }
        return isLogSader(item.log);
    };

    // Modal SADER and completion evaluations
    const modalHasSader = exitModalItems.some((item) => isItemSader(item));
    const modalBlockedItems = exitModalItems.filter((item) => {
        const o = item.order;
        if (!o) return false;
        const isCompleted = o.is_completed || o.has_destare || o.destare_status === "completed";
        const isCancelled = o.is_cancelled || o.status === "cancelled";
        return !isCompleted && !isCancelled;
    });
    const isModalExitBlocked = modalBlockedItems.length > 0;

    const handleExitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (exitModalItems.length === 0) return;

        if (isModalExitBlocked) {
            Swal.fire({
                icon: "warning",
                title: "Salida Bloqueada",
                text: "Uno o más elementos seleccionados tienen órdenes pendientes de báscula / destare. Deben completar su pesaje antes de autorizar la salida.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        if (modalHasSader && (!convoyNumber.trim() || !convoyValidated)) {
            Swal.fire({
                icon: "warning",
                title: "Validación de Convoy Requerida (SADER)",
                text: "Se detectaron órdenes consignadas a SADER. Es obligatorio registrar el número de convoy y marcar la confirmación de custodia para autorizar la salida.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        const fullExitDateTime = `${exitDate} ${exitTime}`;

        if (exitModalItems.length === 1) {
            const singleItem = exitModalItems[0];
            const singleLogId = singleItem.log.id;
            const singleOrderId = singleItem.order?.id ?? null;

            router.put(
                route("surveillance.update", singleLogId),
                {
                    exit_at: fullExitDateTime,
                    order_id: singleOrderId,
                    convoy_number: convoyNumber.trim(),
                    convoy_validated: convoyValidated,
                },
                {
                    onSuccess: () => {
                        setExitModalItems([]);
                        setSelectedRowKeys((curr) => curr.filter((k) => k !== `${singleLogId}-order-${singleOrderId}`));
                        setConvoyNumber("");
                        setConvoyValidated(false);
                        Swal.fire({
                            icon: "success",
                            title: "Salida Registrada",
                            text: singleItem.order
                                ? `Se ha registrado la salida de la orden ${singleItem.order.folio || singleItem.order.id}.`
                                : "Se ha registrado la salida del operador.",
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 3500,
                        });
                    },
                }
            );
        } else {
            const payloadItems = exitModalItems.map((item) => ({
                log_id: item.log.id,
                order_id: item.order?.id ?? null,
            }));

            router.post(
                route("surveillance.bulk-exit"),
                {
                    items: payloadItems,
                    exit_at: fullExitDateTime,
                    convoy_number: convoyNumber.trim(),
                    convoy_validated: convoyValidated,
                },
                {
                    onSuccess: () => {
                        setExitModalItems([]);
                        setSelectedRowKeys([]);
                        setConvoyNumber("");
                        setConvoyValidated(false);
                        Swal.fire({
                            icon: "success",
                            title: "Salidas Registradas",
                            text: `Se registró exitosamente la salida de ${payloadItems.length} elemento(s).`,
                            toast: true,
                            position: "top-end",
                            showConfirmButton: false,
                            timer: 3500,
                        });
                    },
                }
            );
        }
    };

    // Filter units in plant
    const filteredLogs = inPlantLogs.filter((log) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;

        const opName = (log.subject?.operator_name || log.subject?.name || "").toLowerCase();
        const plate = (log.subject?.tractor_plate || "").toLowerCase();
        const econ = (log.subject?.economic_number || "").toLowerCase();
        const orders = (log.shipment_orders_data || log.shipment_orders || [])
            .map((o: any) => (o.folio || o.id || "").toLowerCase())
            .join(" ");

        return opName.includes(query) || plate.includes(query) || econ.includes(query) || orders.includes(query);
    });

    const totalWithOrders = inPlantLogs.filter((log) => {
        const o = log.shipment_orders_data || log.shipment_orders;
        return o && o.length > 0;
    }).length;

    // Flatten logs so each shipment order gets its own row
    const displayRows = filteredLogs.flatMap((log) => {
        const orders = log.shipment_orders_data || log.shipment_orders;
        if (orders && orders.length > 0) {
            return orders.map((order: any, idx: number) => ({
                rowKey: `${log.id}-order-${order.id || idx}`,
                log,
                order,
            }));
        }
        return [{
            rowKey: `${log.id}-no-order`,
            log,
            order: null,
        }];
    });

    // Toggle select all in-plant rows
    const allRowKeys = displayRows.map((r) => r.rowKey);
    const isAllSelected = allRowKeys.length > 0 && allRowKeys.every((k) => selectedRowKeys.includes(k));
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRowKeys([]);
        } else {
            setSelectedRowKeys(allRowKeys);
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Vigilancia - Salidas de Operadores">
            <Head title="Vigilancia - Salidas de Operadores" />

            <div className="py-6">
                <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 space-y-6">

                    {/* Submodules Navigation Bar */}
                    <div className="bg-white rounded-3xl p-3 shadow-md border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                            <Link
                                href={route("surveillance.index")}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Menú Principal</span>
                            </Link>
                        </div>

                        <Link
                            href={route("surveillance.veto")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wide text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <ShieldAlert className="w-4 h-4" />
                            <span>Operadores Vetados</span>
                        </Link>
                    </div>

                    {/* Header with Metrics */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-indigo-900 uppercase tracking-tight flex items-center">
                                <LogOut className="w-8 h-8 mr-3 text-red-500" />
                                Salidas y Control de Operadores en Planta
                            </h2>
                            <p className="text-gray-500 text-sm font-medium ml-11">
                                Registro de salida, vinculación de órdenes de embarque activas y cierre de viajes
                            </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                                        En Planta
                                    </p>
                                    <p className="text-lg font-black text-indigo-900 leading-none">
                                        {inPlantLogs.length}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                                        Con Órdenes
                                    </p>
                                    <p className="text-lg font-black text-emerald-900 leading-none">
                                        {totalWithOrders}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por operador, placas, económico, folio..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
                            {selectedRowKeys.length > 0 && (
                                <button
                                    onClick={() => {
                                        const selected = displayRows.filter((r) => selectedRowKeys.includes(r.rowKey));
                                        openExitModal(selected);
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 animate-pulse transition-all whitespace-nowrap"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Dar Salida a Seleccionados ({selectedRowKeys.length})</span>
                                </button>
                            )}

                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-800 uppercase px-3 py-2 bg-gray-100 rounded-xl transition-colors"
                                >
                                    Limpiar filtro
                                </button>
                            )}

                            <Link
                                href={route("surveillance.exits.report")}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white shadow-md shadow-red-100 transition-all whitespace-nowrap"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Reporte de Salidas</span>
                            </Link>
                        </div>
                    </div>

                    {/* In Plant & Exits Table */}
                    <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-xl bg-white">
                        <table className="w-full divide-y divide-gray-200 text-left">
                            <thead className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white">
                                <tr>
                                    <th className="px-3 py-3.5 text-center text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap w-12">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 bg-white cursor-pointer"
                                            title="Seleccionar todos"
                                        />
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Entrada
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-indigo-100">
                                        Orden de Embarque
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Operador
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Unidad
                                    </th>
                                    <th className="px-4 py-3.5 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {displayRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-gray-500 bg-gray-50/50">
                                            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="font-bold text-lg text-gray-700">
                                                No hay operadores en planta {searchTerm ? "que coincidan con la búsqueda." : "actualmente."}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Los operadores autorizados en Control de Accesos aparecerán aquí para registrar su salida.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayRows.map(({ rowKey, log, order }) => {
                                        const isCancelled = order ? (order.is_cancelled || order.status === "cancelled") : false;
                                        const isCompleted = order ? (order.is_completed || order.has_destare || order.destare_status === "completed") : true;
                                        const rowCanExit = !order || isCompleted || isCancelled;
                                        const isChecked = selectedRowKeys.includes(rowKey);

                                        return (
                                            <tr
                                                key={rowKey}
                                                className={`transition-colors duration-200 text-gray-700 ${
                                                    isChecked ? "bg-indigo-50/70" : "hover:bg-indigo-50/30"
                                                }`}
                                            >
                                                {/* Column 0: Checkbox */}
                                                <td className="px-3 py-3.5 text-center whitespace-nowrap w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleSelectRow(rowKey)}
                                                        className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Column 1: Entry Time */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center text-gray-900 font-bold">
                                                        <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                                                        {new Date(log.entry_at).toLocaleTimeString([], {
                                                             hour: "2-digit",
                                                             minute: "2-digit",
                                                         })}
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-bold ml-5">
                                                        {new Date(log.entry_at).toLocaleDateString()}
                                                    </span>
                                                </td>

                                                {/* Column 2: Linked Shipment Order */}
                                                <td className="px-4 py-3.5">
                                                    {order ? (
                                                        <div
                                                            className={`inline-flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold w-full max-w-md shadow-sm ${
                                                                isCancelled
                                                                    ? "bg-slate-100 border-slate-200 text-slate-700"
                                                                    : isCompleted
                                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                                                    : "bg-amber-50 border-amber-200 text-amber-900"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <FileText
                                                                    className={`w-4 h-4 ${
                                                                        isCancelled
                                                                            ? "text-slate-500"
                                                                            : isCompleted
                                                                            ? "text-emerald-600"
                                                                            : "text-amber-600"
                                                                    }`}
                                                                />
                                                                <span className="font-mono">Folio: {order.folio ?? (order.id ? String(order.id).slice(0, 8) : "")}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 font-bold uppercase text-gray-800 shadow-2xs">
                                                                    {order.client?.business_name || order.client?.name || order.client || order.client_name || "Cliente"}
                                                                </span>
                                                                {order.is_sader && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase bg-emerald-600 text-white shadow-sm flex items-center gap-0.5">
                                                                        🛡️ SADER / CONVOY
                                                                    </span>
                                                                )}
                                                                <span
                                                                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                                                                        isCancelled
                                                                            ? "bg-slate-200 text-slate-800 border-slate-300"
                                                                            : isCompleted
                                                                            ? "bg-emerald-200 text-emerald-900 border-emerald-300"
                                                                            : "bg-amber-200 text-amber-900 border-amber-300"
                                                                    }`}
                                                                >
                                                                    {isCancelled
                                                                        ? "Cancelada"
                                                                        : isCompleted
                                                                        ? "Completada / Destarada"
                                                                        : "Pendiente Báscula"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : log.subject_type?.includes("Vessel") ? (
                                                        <span className="text-xs text-gray-400 italic">No aplica (Barco)</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Sin órdenes activas</span>
                                                    )}
                                                </td>

                                                {/* Column 3: Operator */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="text-sm font-black text-gray-900 uppercase">
                                                        {log.subject?.operator_name || log.subject?.name || "N/A"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        Lic: <span className="font-bold">{log.subject?.license || "N/A"}</span>
                                                    </div>
                                                    <div className="text-[11px] text-indigo-600 font-bold">
                                                        {log.subject?.transport_line || log.subject?.transporter_line || ""}
                                                    </div>
                                                </td>

                                                {/* Column 4: Vehicle Unit */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="text-sm font-black text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded-md inline-block border border-gray-200">
                                                        {log.subject?.tractor_plate || "S/P"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Econ: <span className="font-bold text-gray-800">{log.subject?.economic_number || "S/N"}</span>
                                                    </div>
                                                </td>

                                                {/* Column 5: Access Type */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${
                                                            log.subject_type?.includes("Vessel")
                                                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {log.subject_type?.includes("Vessel") ? "Barco/Muelle" : "Salida/Doc"}
                                                    </span>
                                                </td>

                                                {/* Column 6: Actions */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="inline-flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewingLog(log)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-all shadow-sm font-bold text-xs uppercase inline-flex items-center gap-1"
                                                        >
                                                            <User className="w-3.5 h-3.5" />
                                                            Detalles
                                                        </button>
                                                        {!rowCanExit ? (
                                                            <button
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: "Orden No Completada",
                                                                        html: `<p class="text-sm font-medium">No se puede registrar la salida de la orden <b>${order?.folio || order?.id}</b> del operador <b>${log.subject?.operator_name || log.subject?.name}</b>.</p><div class="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl mt-3 border border-amber-200 text-left"><b>Estado:</b> Pendiente en báscula / destare.<p class="mt-2 text-slate-600 font-normal">Debe completarse el proceso de pesaje / destare en báscula antes de marcar la salida de esta orden.</p></div>`,
                                                                        confirmButtonColor: "#4f46e5",
                                                                        confirmButtonText: "Entendido",
                                                                    });
                                                                }}
                                                                className="text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-2 rounded-xl transition-all shadow-sm font-black text-xs uppercase inline-flex items-center gap-1.5"
                                                                title="Salida bloqueada: Orden pendiente por completar en báscula"
                                                            >
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                                                Salida Bloqueada
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => openExitModal([{ log, order }])}
                                                                className="text-white bg-red-600 hover:bg-red-700 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-red-100 font-black text-xs uppercase inline-flex items-center gap-1.5"
                                                            >
                                                                <LogOut className="w-3.5 h-3.5" />
                                                                Marcar Salida
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === ORDER SELECTION MODAL (In Exits Submodule) === */}
            <Modal show={!!orderModalLog} onClose={() => setOrderModalLog(null)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 uppercase flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                Vincular Órdenes de Embarque
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Operador:{" "}
                                <span className="font-bold text-gray-800 uppercase">
                                    {orderModalLog?.subject?.operator_name || orderModalLog?.subject?.name}
                                </span>{" "}
                                | Placas:{" "}
                                <span className="font-bold text-gray-800">{orderModalLog?.subject?.tractor_plate}</span>
                            </p>
                        </div>
                        <button onClick={() => setOrderModalLog(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                        Selecciona de 1 a 3 órdenes de embarque activas o destaradas para este viaje:
                    </p>

                    {loadingOrders ? (
                        <div className="py-12 text-center text-gray-500">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-xs font-bold uppercase">Buscando órdenes del operador...</p>
                        </div>
                    ) : availableOrders.length === 0 ? (
                        <div className="py-8 text-center bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="font-bold text-sm text-gray-700">No se encontraron órdenes activas</p>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                                El operador no tiene órdenes pendientes o destaradas asociadas a sus placas o nombre en este momento.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6 max-h-[380px] overflow-y-auto pr-1">
                            {availableOrders.map((order: any) => {
                                const isSelected = selectedOrderIds.includes(order.id);
                                return (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => toggleOrderSelection(order.id)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                            isSelected
                                                ? "border-indigo-500 bg-indigo-50/80 shadow-md ring-2 ring-indigo-200"
                                                : "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/20"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span
                                                        className={`text-sm font-black uppercase ${
                                                            isSelected ? "text-indigo-900" : "text-gray-900"
                                                        }`}
                                                    >
                                                        Folio: {order.folio}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                                                            order.is_completed || order.has_destare
                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                                : "bg-amber-100 text-amber-800 border-amber-300"
                                                        }`}
                                                    >
                                                        {order.is_completed || order.has_destare
                                                            ? "Completada / Destarada"
                                                            : "Pendiente en Báscula"}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                                                    <span>
                                                        <span className="font-bold text-gray-400 uppercase">Cliente:</span>{" "}
                                                        {order.client}
                                                    </span>
                                                    <span>
                                                        <span className="font-bold text-gray-400 uppercase">Producto:</span>{" "}
                                                        {order.product}
                                                    </span>
                                                    <span>
                                                        <span className="font-bold text-gray-400 uppercase">Cantidad:</span>{" "}
                                                        {order.quantity}
                                                    </span>
                                                    <span>
                                                        <span className="font-bold text-gray-400 uppercase">Origen:</span>{" "}
                                                        {order.origin}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className={`ml-3 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                                                }`}
                                            >
                                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setOrderModalLog(null)}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={saveAttachedOrders}
                            disabled={selectedOrderIds.length === 0}
                            className="flex-2 bg-indigo-600 text-white font-black py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Vincular {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""} Órdenes
                        </button>
                    </div>
                </div>
            </Modal>

            {/* === EXIT MODAL (Single / Multi-Operator with SADER, Convoy, Date & Time) === */}
            <Modal show={exitModalItems.length > 0} onClose={() => setExitModalItems([])} maxWidth="lg">
                <form onSubmit={handleExitSubmit} className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 uppercase flex items-center">
                            <Clock className="w-6 h-6 mr-3 text-red-600" />
                            Registrar Salida de Planta
                        </h2>
                        <button
                            type="button"
                            onClick={() => setExitModalItems([])}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Operator(s) to checkout */}
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                                {exitModalItems.length > 1
                                    ? `Elementos Seleccionados (${exitModalItems.length})`
                                    : "Operador a Salir"}
                            </p>

                            {exitModalItems.length === 1 ? (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-black text-gray-900 uppercase">
                                            {exitModalItems[0]?.log?.subject?.operator_name || exitModalItems[0]?.log?.subject?.name || "N/A"}
                                        </p>
                                        <span className="text-xs font-mono font-black bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-indigo-900">
                                            Placas: {exitModalItems[0]?.log?.subject?.tractor_plate || "S/P"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Línea: <span className="font-bold text-slate-700">{exitModalItems[0]?.log?.subject?.transport_line || exitModalItems[0]?.log?.subject?.transporter_line || "N/A"}</span> | Econ: <span className="font-bold text-slate-700">{exitModalItems[0]?.log?.subject?.economic_number || "S/N"}</span>
                                    </p>

                                    {/* Order information for single item */}
                                    {exitModalItems[0]?.order && (
                                        <div className="pt-2 border-t border-slate-200 mt-2 space-y-1">
                                            <p className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                                Orden de embarque a salir:
                                            </p>
                                            <div className="text-xs font-bold text-indigo-950 flex justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                                                <span>Folio: {exitModalItems[0].order.folio ?? exitModalItems[0].order.id}</span>
                                                <span className="font-normal text-slate-600 truncate max-w-[200px]">
                                                    {exitModalItems[0].order.client?.business_name || exitModalItems[0].order.client?.name || exitModalItems[0].order.client || exitModalItems[0].order.client_name || ""}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto space-y-1.5">
                                    {exitModalItems.map((item, idx) => (
                                        <div
                                            key={`${item.log.id}-${item.order?.id || idx}`}
                                            className="flex items-center justify-between text-xs font-bold bg-white p-2.5 rounded-xl border border-slate-100"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 uppercase truncate max-w-[200px]">
                                                    {item.log.subject?.operator_name || item.log.subject?.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-normal">
                                                    {item.order ? `Folio: ${item.order.folio ?? item.order.id}` : "Sin orden vinculada"}
                                                </span>
                                            </div>
                                            <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                                {item.log.subject?.tractor_plate || "S/P"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Uncompleted Order Warning Banner in Modal */}
                        {isModalExitBlocked && (
                            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-sm">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-900">
                                    <p className="font-black uppercase tracking-wide">Salida Bloqueada por Báscula</p>
                                    <p className="mt-1">
                                        Uno o más elementos seleccionados tienen órdenes pendientes de completar su pesaje/destare final en báscula:
                                    </p>
                                    <ul className="list-disc ml-4 mt-1 font-black">
                                        {modalBlockedItems.map((item, idx) => (
                                            <li key={idx}>
                                                {item.log.subject?.operator_name || item.log.subject?.name}: Folio {item.order?.folio ?? item.order?.id}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* SADER Convoy Validation Section (ONLY displayed for SADER orders) */}
                        {modalHasSader && (
                            <div className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 space-y-3 shadow-sm">
                                <div className="flex items-start gap-2.5">
                                    <div className="p-2 rounded-xl flex-shrink-0 text-white bg-emerald-600">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-black uppercase tracking-wide text-emerald-950">
                                                Validación de Convoy Obligatoria (SADER)
                                            </p>
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-full shadow-xs">
                                                Requerido
                                            </span>
                                        </div>
                                        <p className="text-[11px] leading-tight mt-1 text-emerald-700 font-semibold">
                                            Esta unidad transporta órdenes consignadas a SADER. Es necesario ingresar el número de convoy y confirmar la custodia para autorizar la salida.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase block mb-1.5 text-emerald-950">
                                        ¿Qué convoy es? / No. de Convoy SADER <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. CONVOY-2026-001 / CUSTODIA-05"
                                        value={convoyNumber}
                                        onChange={(e) => setConvoyNumber(e.target.value)}
                                        className="w-full bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold uppercase border-2 border-emerald-300 text-emerald-950 placeholder-emerald-300 focus:border-emerald-600 focus:ring-0 transition-all"
                                        required
                                    />
                                </div>

                                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={convoyValidated}
                                        onChange={(e) => setConvoyValidated(e.target.checked)}
                                        className="w-4.5 h-4.5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                                        required
                                    />
                                    <span className="text-xs font-bold text-emerald-950 leading-snug">
                                        Confirmo que la(s) unidad(es) cuentan con la validación y custodia de convoy de SADER correspondiente.
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Date and Time Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5 text-indigo-600" />
                                    Fecha de Salida <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={exitDate}
                                    onChange={(e) => setExitDate(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase flex items-center">
                                    <Clock className="w-4 h-4 mr-1.5 text-indigo-600" />
                                    Hora de Salida <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={exitTime}
                                    onChange={(e) => setExitTime(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setExitModalItems([])}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase text-xs"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isModalExitBlocked ||
                                !exitDate ||
                                !exitTime ||
                                (modalHasSader && (!convoyNumber.trim() || !convoyValidated))
                            }
                            className="flex-2 bg-red-600 text-white font-black py-3 px-6 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirmar Salida {exitModalItems.length > 1 ? `(${exitModalItems.length})` : ""}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* === VIEW DETAILS MODAL === */}
            <Modal show={!!viewingLog} onClose={() => setViewingLog(null)} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase">Detalles del Registro</h2>
                        </div>
                        <button
                            onClick={() => setViewingLog(null)}
                            className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    {viewingLog && viewingLog.subject && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-6 border border-indigo-100 shadow-md">
                                <div className="flex items-start space-x-5">
                                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center border-2 border-indigo-50 shadow-md flex-shrink-0">
                                        <Truck className="w-10 h-10 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-gray-900 uppercase leading-none mb-2">
                                            {viewingLog.subject.operator_name || viewingLog.subject.name}
                                        </h3>
                                        <div className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest mb-3">
                                            {viewingLog.subject.transport_line || viewingLog.subject.transporter_line || "Línea de Transporte"}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="bg-white p-3 rounded-xl border border-indigo-50">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                                                    Placas
                                                </p>
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono font-bold text-gray-900 border border-gray-200">
                                                    {viewingLog.subject.tractor_plate}
                                                </span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-indigo-50">
                                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                                                    Unidad
                                                </p>
                                                <p className="text-xs text-gray-800 font-bold">
                                                    {viewingLog.subject.unit_type || "N/A"} - #{viewingLog.subject.economic_number || "S/N"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                                        Hora de Entrada
                                    </p>
                                    <p className="text-lg font-black text-gray-900">
                                        {new Date(viewingLog.entry_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                                        Autorizado Por
                                    </p>
                                    <p className="text-base font-bold text-gray-900">
                                        {viewingLog.user?.name || "Sistema"}
                                    </p>
                                </div>
                            </div>

                            {((viewingLog.shipment_orders_data || viewingLog.shipment_orders)?.length > 0) && (
                                <div className="p-5 bg-white border border-indigo-100 rounded-2xl shadow-sm">
                                    <p className="text-xs text-indigo-700 uppercase font-black tracking-wider mb-3 flex items-center">
                                        <FileText className="w-4 h-4 mr-1.5" />
                                        Órdenes de Embarque Vinculadas ({(viewingLog.shipment_orders_data || viewingLog.shipment_orders).length})
                                    </p>
                                    <div className="space-y-2">
                                        {(viewingLog.shipment_orders_data || viewingLog.shipment_orders).map((o: any) => (
                                            <div
                                                key={o.id}
                                                className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-indigo-900 uppercase">
                                                        Folio: {o.folio ?? o.id}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase text-[10px]">
                                                        {o.status}
                                                    </span>
                                                </div>
                                                <div className="text-gray-600 font-medium">
                                                    {o.client?.business_name || o.client?.name || o.client || "N/A"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setViewingLog(null)}
                            className="bg-gray-100 text-gray-700 font-bold py-2.5 px-6 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wide text-xs"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
