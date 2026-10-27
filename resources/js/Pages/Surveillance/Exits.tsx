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

const UNIT_TYPE_CATEGORIES = [
    { value: "all", label: "Todos los tipos de unidad" },
    { value: "PIPA", label: "Pipas" },
    { value: "VOLTEO", label: "Volteos" },
    { value: "TOLVA", label: "Tolvas" },
    { value: "PLATAFORMA", label: "Plataformas" },
    { value: "JAULA", label: "Jaulas" },
    { value: "GONDOLA", label: "Góndolas" },
    { value: "CAJA_SECA", label: "Cajas Secas" },
    { value: "TORTON", label: "Tortons" },
    { value: "CAMIONETA", label: "Camionetas" },
    { value: "OTROS", label: "Otros" },
];

export default function Exits({
    auth,
    in_plant = [],
    pending_count = 0,
    in_plant_count = 0,
}: {
    auth: any;
    in_plant: any[];
    pending_count?: number;
    in_plant_count?: number;
}) {
    const [inPlantLogs, setInPlantLogs] = useState<any[]>(in_plant);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "in_plant" | "pending">("all");
    const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");

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

    // Cancel authorized entry and delete in-plant access record
    const handleCancelEntry = (log: any) => {
        const opName = log.subject?.operator_name || log.subject?.name || "este operador";
        const tracto = log.subject?.tractor_plate ? ` (Tracto: ${log.subject.tractor_plate})` : "";

        Swal.fire({
            title: "¿Cancelar entrada a planta?",
            html: `
                <div class="text-left text-sm text-slate-700 space-y-2">
                    <p>Se cancelará el ingreso del operador <b>${opName}</b>${tracto}.</p>
                    <p class="text-xs text-slate-500">Se eliminará el registro de entrada actual y se desvincularán las órdenes asociadas. El operador podrá registrar un nuevo ingreso cuando corresponda.</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, Cancelar Entrada",
            cancelButtonText: "No, Volver",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("surveillance.destroy", log.id), {
                    preserveScroll: true,
                    onSuccess: () => {
                        setInPlantLogs((curr) => curr.filter((l) => l.id !== log.id));
                        Swal.fire({
                            icon: "success",
                            title: "Entrada Cancelada",
                            text: `Se ha cancelado la entrada de ${opName} y se eliminó el registro.`,
                            timer: 3000,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "No se pudo cancelar el registro de entrada.",
                        });
                    },
                });
            }
        });
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

    const isItemSader = (item: { log: any; order?: any }) => {
        if (item.order) {
            const o = item.order;
            return Boolean(
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
    const modalBlockedItems = exitModalItems.flatMap((item) => {
        if (item.order) {
            const o = item.order;
            const isCompleted = o.is_completed || o.has_destare || o.destare_status === "completed";
            const isCancelled = o.is_cancelled || o.status === "cancelled";
            return (!isCompleted && !isCancelled) ? [{ log: item.log, order: o }] : [];
        }
        const orders = (item.log.shipment_orders_data || item.log.shipment_orders || []).filter(
            (o: any) => o && o.status !== "closed"
        );
        return orders
            .filter((o: any) => {
                const isCompleted = o.is_completed || o.has_destare || o.destare_status === "completed";
                const isCancelled = o.is_cancelled || o.status === "cancelled";
                return !isCompleted && !isCancelled;
            })
            .map((o: any) => ({ log: item.log, order: o }));
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
                        setSelectedRowKeys([]);
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

    // Filter units by status, unit type, and search term
    const filteredLogs = inPlantLogs.filter((log) => {
        // 1. Status Filter (only "in_plant" and "pending")
        const logStatus = log.current_status || log.status;
        if (statusFilter !== "all" && logStatus !== statusFilter) {
            return false;
        }

        // 2. Unit Type Filter
        if (unitTypeFilter !== "all") {
            const rawUnit = (
                log.unit_type ||
                log.subject?.unit_type ||
                (log.shipment_orders_data && log.shipment_orders_data[0]?.unit_type) ||
                ""
            ).toUpperCase();

            if (unitTypeFilter === "PIPA" && !rawUnit.includes("PIPA")) return false;
            if (unitTypeFilter === "VOLTEO" && !rawUnit.includes("VOLTEO")) return false;
            if (unitTypeFilter === "TOLVA" && !rawUnit.includes("TOLVA")) return false;
            if (unitTypeFilter === "PLATAFORMA" && !rawUnit.includes("PLATAFORMA")) return false;
            if (unitTypeFilter === "JAULA" && !rawUnit.includes("JAULA")) return false;
            if (unitTypeFilter === "GONDOLA" && !rawUnit.includes("GONDOLA") && !rawUnit.includes("GÓNDOLA")) return false;
            if (unitTypeFilter === "CAJA_SECA" && !rawUnit.includes("CAJA SECA")) return false;
            if (unitTypeFilter === "TORTON" && !rawUnit.includes("TORTON")) return false;
            if (unitTypeFilter === "CAMIONETA" && !rawUnit.includes("CAMIONETA")) return false;
            if (unitTypeFilter === "OTROS") {
                const known = ["PIPA", "VOLTEO", "TOLVA", "PLATAFORMA", "JAULA", "GONDOLA", "GÓNDOLA", "CAJA SECA", "TORTON", "CAMIONETA"];
                if (known.some((k) => rawUnit.includes(k))) return false;
            }
        }

        // 3. Search query
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;

        const opName = (log.subject?.operator_name || log.subject?.name || "").toLowerCase();
        const plate = (log.subject?.tractor_plate || "").toLowerCase();
        const trailerPlate = (log.subject?.trailer_plate || "").toLowerCase();
        const econ = (log.subject?.economic_number || "").toLowerCase();
        const unitType = (log.unit_type || log.subject?.unit_type || "").toLowerCase();
        const orders = (log.shipment_orders_data || log.shipment_orders || [])
            .map((o: any) => (o.folio || o.id || "").toLowerCase())
            .join(" ");

        return (
            opName.includes(query) ||
            plate.includes(query) ||
            trailerPlate.includes(query) ||
            econ.includes(query) ||
            unitType.includes(query) ||
            orders.includes(query)
        );
    });

    const inPlantCount = inPlantLogs.filter((l) => (l.current_status || l.status) === "in_plant").length;
    const pendingCount = inPlantLogs.filter((l) => (l.current_status || l.status) === "pending").length;

    // 1 row per operator log (never duplicates operators)
    const displayRows = filteredLogs.map((log) => {
        const isPendingLog = (log.current_status || log.status) === "pending";
        const orders = (log.shipment_orders_data || log.shipment_orders || []).filter(
            (o: any) => o && o.status !== "closed"
        );
        const uncompletedOrders = orders.filter(
            (o: any) => !o.is_completed && !o.has_destare && o.destare_status !== "completed" && !o.is_cancelled && o.status !== "cancelled"
        );
        const hasUncompleted = uncompletedOrders.length > 0;
        const canExit = !isPendingLog && !hasUncompleted;

        return {
            rowKey: `log-${log.id}`,
            log,
            orders,
            isPendingLog,
            canExit,
            uncompletedOrders,
        };
    });

    // Toggle select all in-plant rows (excluding pending units which cannot exit yet)
    const selectableRowKeys = displayRows.filter((r) => !r.isPendingLog).map((r) => r.rowKey);
    const isAllSelected = selectableRowKeys.length > 0 && selectableRowKeys.every((k) => selectedRowKeys.includes(k));
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRowKeys([]);
        } else {
            setSelectedRowKeys(selectableRowKeys);
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

                        {/* Quick Stats Badges (Interactive Status Filter) */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setStatusFilter((curr) => (curr === "in_plant" ? "all" : "in_plant"))}
                                className={`transition-all border px-4 py-2.5 rounded-2xl flex items-center gap-3 text-left ${
                                    statusFilter === "in_plant"
                                        ? "bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-200"
                                        : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70"
                                }`}
                                title="Filtrar operadores dentro de planta"
                            >
                                <div className={`p-2 rounded-xl ${statusFilter === "in_plant" ? "bg-white text-emerald-600" : "bg-emerald-600 text-white"}`}>
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-wider ${statusFilter === "in_plant" ? "text-emerald-100" : "text-emerald-700"}`}>
                                        En Planta
                                    </p>
                                    <p className={`text-lg font-black leading-none ${statusFilter === "in_plant" ? "text-white" : "text-emerald-950"}`}>
                                        {inPlantCount}
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter((curr) => (curr === "pending" ? "all" : "pending"))}
                                className={`transition-all border px-4 py-2.5 rounded-2xl flex items-center gap-3 text-left ${
                                    statusFilter === "pending"
                                        ? "bg-amber-500 border-amber-600 text-white shadow-md shadow-amber-200"
                                        : "bg-amber-50 border-amber-100 hover:bg-amber-100/70"
                                }`}
                                title="Filtrar operadores por ingresar"
                            >
                                <div className={`p-2 rounded-xl ${statusFilter === "pending" ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-wider ${statusFilter === "pending" ? "text-amber-100" : "text-amber-700"}`}>
                                        Por Ingresar
                                    </p>
                                    <p className={`text-lg font-black leading-none ${statusFilter === "pending" ? "text-white" : "text-amber-950"}`}>
                                        {pendingCount}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 flex-wrap">
                            {/* Search Bar */}
                            <div className="relative w-full md:w-72">
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar operador, placas, folio..."
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all"
                                />
                            </div>

                            {/* Status Filter Tabs (Por Ingresar / Dentro de Planta) */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        statusFilter === "all"
                                            ? "bg-white text-indigo-900 shadow-xs"
                                            : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                    Todos ({inPlantLogs.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("in_plant")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                        statusFilter === "in_plant"
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "text-emerald-700 hover:text-emerald-900"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    Dentro de Planta ({inPlantCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter("pending")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                        statusFilter === "pending"
                                            ? "bg-amber-500 text-white shadow-xs"
                                            : "text-amber-700 hover:text-amber-900"
                                    }`}
                                >
                                    <Clock className="w-3 h-3" />
                                    Por Ingresar ({pendingCount})
                                </button>
                            </div>

                            {/* Unit Type Filter Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-500 uppercase whitespace-nowrap">
                                    Tipo:
                                </span>
                                <select
                                    value={unitTypeFilter}
                                    onChange={(e) => setUnitTypeFilter(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:bg-white focus:border-indigo-500 focus:ring-0 cursor-pointer"
                                >
                                    {UNIT_TYPE_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Actions & Reports */}
                        <div className="flex items-center gap-3 w-full xl:w-auto justify-end flex-wrap">
                            {selectedRowKeys.length > 0 && (
                                <button
                                    onClick={() => {
                                        const selected = displayRows
                                            .filter((r) => selectedRowKeys.includes(r.rowKey))
                                            .map((r) => ({ log: r.log, order: null }));
                                        openExitModal(selected);
                                    }}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 animate-pulse transition-all whitespace-nowrap"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Dar Salida a Seleccionados ({selectedRowKeys.length})</span>
                                </button>
                            )}

                            {(searchTerm || statusFilter !== "all" || unitTypeFilter !== "all") && (
                                <button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("all");
                                        setUnitTypeFilter("all");
                                    }}
                                    className="text-xs font-bold text-gray-500 hover:text-gray-800 uppercase px-3 py-2 bg-gray-100 rounded-xl transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            )}

                            <Link
                                href={route("surveillance.exits.report")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white shadow-md shadow-red-100 transition-all whitespace-nowrap"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Reporte de Salidas</span>
                            </Link>
                        </div>
                    </div>

                    {/* In Plant & Exits Table */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-xl bg-white">
                        <table className="w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white">
                                <tr>
                                    <th className="px-2 py-3 text-center text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 bg-white cursor-pointer"
                                            title="Seleccionar todos (dentro de planta)"
                                        />
                                    </th>
                                    <th className="px-2.5 py-3 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Entrada / Registro
                                    </th>
                                    <th className="px-2.5 py-3 text-xs font-black uppercase tracking-wider text-indigo-100">
                                        Orden de Embarque
                                    </th>
                                    <th className="px-2.5 py-3 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Operador
                                    </th>
                                    <th className="px-2.5 py-3 text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Unidad
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                                        Estatus
                                    </th>
                                    <th className="px-2 py-3 text-center text-xs font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap w-36">
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
                                                No hay unidades {searchTerm || statusFilter !== "all" || unitTypeFilter !== "all" ? "que coincidan con los filtros aplicados." : "actualmente."}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Los operadores por ingresar o dentro de planta aparecerán aquí para control y registro de salida.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayRows.map(({ rowKey, log, orders, isPendingLog, canExit, uncompletedOrders }) => {
                                        const isChecked = selectedRowKeys.includes(rowKey);

                                        return (
                                            <tr
                                                key={rowKey}
                                                className={`transition-colors duration-200 text-gray-700 ${
                                                    isChecked ? "bg-indigo-50/70" : isPendingLog ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-indigo-50/30"
                                                }`}
                                            >
                                                {/* Column 0: Checkbox */}
                                                <td className="px-2 py-2.5 text-center whitespace-nowrap w-10">
                                                    <input
                                                        type="checkbox"
                                                        disabled={isPendingLog}
                                                        checked={isChecked && !isPendingLog}
                                                        onChange={() => !isPendingLog && toggleSelectRow(rowKey)}
                                                        className={`w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 ${
                                                            isPendingLog ? "opacity-30 cursor-not-allowed bg-gray-100" : "cursor-pointer"
                                                        }`}
                                                        title={isPendingLog ? "Solo unidades dentro de planta pueden marcar salida" : "Seleccionar"}
                                                    />
                                                </td>

                                                {/* Column 1: Entry / Registration Time */}
                                                <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                    {log.entry_at ? (
                                                        <>
                                                            <div className="flex items-center text-gray-900 font-bold text-xs">
                                                                <Clock className="w-3.5 h-3.5 mr-1 text-indigo-500 flex-shrink-0" />
                                                                {new Date(log.entry_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-semibold block pl-4.5">
                                                                {new Date(log.entry_at).toLocaleDateString()}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center text-amber-700 font-bold text-xs">
                                                                <Clock className="w-3.5 h-3.5 mr-1 text-amber-500 flex-shrink-0" />
                                                                {log.created_at ? new Date(log.created_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }) : "--:--"}
                                                            </div>
                                                            <span className="text-[10px] text-amber-600/80 font-semibold block pl-4.5">
                                                                {log.created_at ? new Date(log.created_at).toLocaleDateString() : "Por ingresar"}
                                                            </span>
                                                        </>
                                                    )}
                                                </td>

                                                {/* Column 2: Linked Shipment Orders */}
                                                <td className="px-2.5 py-2.5">
                                                    {orders.length > 0 ? (
                                                        <div className="flex flex-col gap-1.5 max-w-sm">
                                                            {orders.map((order: any, idx: number) => {
                                                                const isCancelled = order.is_cancelled || order.status === "cancelled";
                                                                const isCompleted = order.is_completed || order.has_destare || order.destare_status === "completed";

                                                                return (
                                                                    <div
                                                                        key={order.id || idx}
                                                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold w-full shadow-2xs transition-all ${
                                                                            isCancelled
                                                                                ? "bg-slate-100 border-slate-200 text-slate-700"
                                                                                : isCompleted
                                                                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                                                                : "bg-amber-50 border-amber-200 text-amber-900"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-1 min-w-0">
                                                                            <FileText
                                                                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                                                                    isCancelled
                                                                                        ? "text-slate-500"
                                                                                        : isCompleted
                                                                                        ? "text-emerald-600"
                                                                                        : "text-amber-600"
                                                                                }`}
                                                                            />
                                                                            <span className="font-mono text-[11px]">Folio: {order.folio ?? (order.id ? String(order.id).slice(0, 8) : "")}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 flex-wrap justify-end">
                                                                            <span
                                                                                className="text-[9px] px-1.5 py-0.5 rounded bg-white/90 font-bold uppercase text-gray-800 shadow-2xs max-w-[110px] truncate"
                                                                                title={order.client?.business_name || order.client?.name || order.client || order.client_name || "Cliente"}
                                                                            >
                                                                                {order.client?.business_name || order.client?.name || order.client || order.client_name || "Cliente"}
                                                                            </span>
                                                                            {order.is_sader && (
                                                                                <span className="text-[8px] px-1 py-0.5 rounded-full font-black uppercase bg-emerald-600 text-white shadow-2xs flex items-center gap-0.5">
                                                                                    🛡️ SADER
                                                                                </span>
                                                                            )}
                                                                            <span
                                                                                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase border ${
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
                                                                                    ? "Destarada"
                                                                                    : "Pendiente"}
                                                                            </span>
                                                                            {orders.length > 1 && isCompleted && !isPendingLog && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        openExitModal([{ log, order }]);
                                                                                    }}
                                                                                    className="text-[9px] font-black text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded transition-all shadow-2xs"
                                                                                    title={`Dar salida individual solo a esta orden (${order.folio})`}
                                                                                >
                                                                                    Salida Orden
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : log.subject_type?.includes("Vessel") ? (
                                                        <span className="text-xs text-gray-400 italic">No aplica (Barco)</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Sin órdenes activas</span>
                                                    )}
                                                </td>

                                                {/* Column 3: Operator */}
                                                <td className="px-2.5 py-2.5 max-w-[210px]">
                                                    <div className="text-xs font-black text-gray-900 uppercase truncate" title={log.subject?.operator_name || log.subject?.name || "N/A"}>
                                                        {log.subject?.operator_name || log.subject?.name || "N/A"}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500 font-medium">
                                                        Lic: <span className="font-bold">{log.subject?.license || "N/A"}</span>
                                                    </div>
                                                    <div className="text-[10px] text-indigo-600 font-bold truncate" title={log.subject?.transport_line || log.subject?.transporter_line || ""}>
                                                        {log.subject?.transport_line || log.subject?.transporter_line || ""}
                                                    </div>
                                                </td>

                                                {/* Column 4: Vehicle Unit & Unit Type */}
                                                <td className="px-2.5 py-2.5 whitespace-nowrap">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <span className="text-[11px] font-black text-gray-900 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200" title="Placa Tracto">
                                                            T: {log.subject?.tractor_plate || "S/P"}
                                                        </span>
                                                        {log.subject?.trailer_plate && (
                                                            <span className="text-[11px] font-black text-indigo-900 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200" title="Placa Remolque">
                                                                R: {log.subject?.trailer_plate}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between gap-1 mt-1 text-[11px]">
                                                        <span className="text-gray-500">
                                                            Econ: <span className="font-bold text-gray-800">{log.subject?.economic_number || "S/N"}</span>
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                                                            <Truck className="w-2.5 h-2.5 text-indigo-500" />
                                                            {log.unit_type || log.subject?.unit_type || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Column 5: Status (Por Ingresar / Dentro de Planta) */}
                                                <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                    {isPendingLog ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                            Por Ingresar
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Dentro de Planta
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Column 6: Actions */}
                                                <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                    <div className="flex flex-col gap-1 items-stretch justify-center w-32 mx-auto">
                                                        {isPendingLog ? (
                                                            <span
                                                                className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg font-black text-[10px] uppercase inline-flex items-center justify-center gap-1 shadow-2xs"
                                                                title="Operador pendiente de ingresar a planta"
                                                            >
                                                                <Clock className="w-3 h-3 text-amber-600" />
                                                                Por Ingresar
                                                            </span>
                                                        ) : !canExit ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const uncompletedFoliosStr = uncompletedOrders
                                                                        .map((o: any) => o.folio || o.id)
                                                                        .join(", ");
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: "Salida Bloqueada por Báscula",
                                                                        html: `<p class="text-sm font-medium">No se puede registrar la salida del operador <b>${log.subject?.operator_name || log.subject?.name}</b>.</p><div class="text-xs text-amber-900 bg-amber-50 p-3 rounded-xl mt-3 border border-amber-200 text-left"><b>Orden(es) pendiente(s) en báscula / destare:</b><p class="font-bold mt-1 text-slate-800">${uncompletedFoliosStr}</p><p class="mt-2 text-slate-600 font-normal">Debe completarse el proceso de pesaje y destare en báscula antes de autorizar la salida del vehículo.</p></div>`,
                                                                        confirmButtonColor: "#4f46e5",
                                                                        confirmButtonText: "Entendido",
                                                                    });
                                                                }}
                                                                className="text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded-lg transition-all shadow-2xs font-black text-[10px] uppercase inline-flex items-center justify-center gap-1"
                                                                title="Salida bloqueada: Órdenes pendientes por completar en báscula"
                                                            >
                                                                <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                                <span>Salida Bloqueada</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openExitModal([{ log, order: null }])}
                                                                className="text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg transition-all shadow-xs font-black text-[10px] uppercase inline-flex items-center justify-center gap-1 cursor-pointer"
                                                            >
                                                                <LogOut className="w-3 h-3 flex-shrink-0" />
                                                                <span>Marcar Salida</span>
                                                            </button>
                                                        )}

                                                        {/* Botón Cancelar Entrada */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCancelEntry(log)}
                                                            className="text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 px-2 py-1 rounded-lg transition-all shadow-2xs hover:shadow-xs font-bold text-[10px] uppercase inline-flex items-center justify-center gap-1 cursor-pointer"
                                                            title="Cancelar entrada de este operador y borrar registro de planta"
                                                        >
                                                            <Ban className="w-3 h-3 flex-shrink-0" />
                                                            <span>Cancelar Entrada</span>
                                                        </button>
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
                                | Tracto:{" "}
                                <span className="font-bold text-gray-800">{orderModalLog?.subject?.tractor_plate || "S/P"}</span>
                                {orderModalLog?.subject?.trailer_plate && (
                                    <>
                                        {" "}| Remolque:{" "}
                                        <span className="font-bold text-indigo-700">{orderModalLog?.subject?.trailer_plate}</span>
                                    </>
                                )}
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
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-mono font-black bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-gray-900" title="Placa Tracto">
                                                T: {exitModalItems[0]?.log?.subject?.tractor_plate || "S/P"}
                                            </span>
                                            {exitModalItems[0]?.log?.subject?.trailer_plate && (
                                                <span className="text-xs font-mono font-black bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-900" title="Placa Remolque">
                                                    R: {exitModalItems[0]?.log?.subject?.trailer_plate}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Línea: <span className="font-bold text-slate-700">{exitModalItems[0]?.log?.subject?.transport_line || exitModalItems[0]?.log?.subject?.transporter_line || "N/A"}</span> | Econ: <span className="font-bold text-slate-700">{exitModalItems[0]?.log?.subject?.economic_number || "S/N"}</span>
                                    </p>

                                    {/* Order information for single item */}
                                    {exitModalItems[0]?.order ? (
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
                                    ) : (exitModalItems[0]?.log?.shipment_orders_data || exitModalItems[0]?.log?.shipment_orders || []).length > 0 ? (
                                        <div className="pt-2 border-t border-slate-200 mt-2 space-y-1.5">
                                            <p className="text-[11px] font-black uppercase text-slate-600 flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                                Órdenes vinculadas a salir ({(exitModalItems[0]?.log?.shipment_orders_data || exitModalItems[0]?.log?.shipment_orders || []).length}):
                                            </p>
                                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                                {(exitModalItems[0]?.log?.shipment_orders_data || exitModalItems[0]?.log?.shipment_orders || []).map((o: any, idx: number) => (
                                                    <div key={idx} className="text-xs font-bold text-indigo-950 flex justify-between bg-white px-3 py-2 rounded-xl border border-slate-200">
                                                        <span>Folio: {o.folio ?? o.id}</span>
                                                        <span className="font-normal text-slate-600 truncate max-w-[200px]">
                                                            {o.client?.business_name || o.client?.name || o.client || o.client_name || ""}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto space-y-1.5">
                                    {exitModalItems.map((item, idx) => {
                                        const itemOrders = item.order ? [item.order] : (item.log.shipment_orders_data || item.log.shipment_orders || []);
                                        const orderFolios = itemOrders.map((o: any) => o.folio ?? o.id).join(", ");
                                        return (
                                            <div
                                                key={`${item.log.id}-${item.order?.id || idx}`}
                                                className="flex items-center justify-between text-xs font-bold bg-white p-2.5 rounded-xl border border-slate-100"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 uppercase truncate max-w-[200px]">
                                                        {item.log.subject?.operator_name || item.log.subject?.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-normal">
                                                        {orderFolios ? `Folio(s): ${orderFolios}` : "Sin órdenes vinculadas"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-[11px] text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                        T: {item.log.subject?.tractor_plate || "S/P"}
                                                    </span>
                                                    {item.log.subject?.trailer_plate && (
                                                        <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                                            R: {item.log.subject?.trailer_plate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
        </DashboardLayout>
    );
}
