import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import {
    SlidersHorizontal,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Scale,
    Package,
    Truck,
    Calendar,
    User,
    Plus,
    Trash2,
    Search,
    Filter,
    FileText,
    TrendingUp,
    Info,
    ArrowRightLeft,
    ShieldCheck,
    Check,
    Clock,
    X,
    Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface Client {
    id: number;
    business_name: string;
}

interface Product {
    id: number;
    name: string;
}

interface SalesOrderRef {
    id: string;
    folio: string;
    client_id?: number;
    client?: Client;
    client_name?: string;
    product_id?: number;
    product?: Product;
    product_name?: string;
    total_quantity: number;
    loaded_quantity: number;
    balance: number;
    status?: string;
}

interface CandidateShipment {
    id: string;
    folio: string;
    client_id?: number;
    client: string;
    product_id?: number;
    product: string;
    presentation: string;
    is_granel: boolean;
    ticket_net_weight: number | null;
    programmed_tons: number;
    base_weight: number;
    weight_type: string;
    sales_order_id: string | null;
    sales_order_folio: string;
    sales_order_total: number;
    sales_order_loaded: number;
    sales_order_balance: number;
    has_active_adjustment: boolean;
    active_adjustment_folio?: string;
    active_adjustment_id?: string;
    tractor_plate: string;
    operator_name: string;
    date: string;
}

interface AdjustmentItem {
    id: string;
    sales_order_id: string;
    order_type: "origin" | "destination";
    assigned_weight: number;
    previous_balance: number | null;
    notes: string | null;
    sales_order?: {
        id: string;
        folio: string;
        client?: Client;
        product?: Product;
        total_quantity: number;
        loaded_quantity: number;
        balance: number;
    };
}

interface Adjustment {
    id: string;
    folio: string;
    shipment_order_id: string;
    origin_sales_order_id: string;
    presentation: string;
    weight_type: string;
    base_weight: number;
    total_assigned_weight: number;
    status: "applied" | "reverted";
    notes: string | null;
    user_id: number | null;
    reverted_at: string | null;
    reverted_by: number | null;
    revert_reason: string | null;
    created_at: string;
    shipment_order?: {
        id: string;
        folio: string;
        tractor_plate?: string;
        client?: Client;
    };
    origin_sales_order?: {
        id: string;
        folio: string;
        client?: Client;
        product?: Product;
    };
    items?: AdjustmentItem[];
    user?: {
        id: number;
        name: string;
    };
    reverter?: {
        id: number;
        name: string;
    };
}

interface PageProps {
    auth: any;
    adjustments: {
        data: Adjustment[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    candidateShipments: CandidateShipment[];
    openSalesOrders: SalesOrderRef[];
    kpis: {
        total: number;
        applied: number;
        reverted: number;
        total_tons: number;
    };
    filters: {
        search: string;
        status: string;
    };
}

export default function Index({
    auth,
    adjustments,
    candidateShipments,
    openSalesOrders,
    kpis,
    filters,
}: PageProps) {
    const [activeTab, setActiveTab] = useState<"nuevo" | "historial">("nuevo");
    const [searchFilter, setSearchFilter] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "all");
    const [shipmentSearchQuery, setShipmentSearchQuery] = useState("");
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [selectedAdjustmentToRevert, setSelectedAdjustmentToRevert] = useState<Adjustment | null>(null);
    const [revertReason, setRevertReason] = useState("");
    const [isReverting, setIsReverting] = useState(false);

    // Selected shipment in form
    const [selectedShipmentId, setSelectedShipmentId] = useState<string>("");

    // Allocations form state
    interface AllocationRow {
        sales_order_id: string;
        order_type: "origin" | "destination";
        assigned_weight: number;
        notes: string;
    }

    const [originWeight, setOriginWeight] = useState<number>(0);
    const [destinationAllocations, setDestinationAllocations] = useState<AllocationRow[]>([
        { sales_order_id: "", order_type: "destination", assigned_weight: 0, notes: "Ajuste por saldo insuficiente" },
    ]);
    const [notes, setNotes] = useState<string>("Ajuste de distribución de peso por saldo de orden de venta");

    // Currently selected shipment object
    const selectedShipment = useMemo(() => {
        return candidateShipments.find((s) => s.id === selectedShipmentId) || null;
    }, [selectedShipmentId, candidateShipments]);

    // Compatible sales orders for destination
    const compatibleSalesOrders = useMemo(() => {
        if (!selectedShipment) return openSalesOrders;
        return openSalesOrders.filter((so) => {
            // Cannot be the same as origin
            if (so.id === selectedShipment.sales_order_id) return false;
            // Match client if known
            if (selectedShipment.client_id && so.client_id && so.client_id !== selectedShipment.client_id) {
                return false;
            }
            return true;
        });
    }, [selectedShipment, openSalesOrders]);

    // Fallback list of candidate shipments filtered by search query in selector
    const filteredCandidateShipments = useMemo(() => {
        if (!shipmentSearchQuery.trim()) return candidateShipments;
        const q = shipmentSearchQuery.toLowerCase();
        return candidateShipments.filter(
            (s) =>
                s.folio.toLowerCase().includes(q) ||
                s.client.toLowerCase().includes(q) ||
                s.product.toLowerCase().includes(q) ||
                s.tractor_plate.toLowerCase().includes(q) ||
                s.sales_order_folio.toLowerCase().includes(q)
        );
    }, [candidateShipments, shipmentSearchQuery]);

    // When a shipment is selected, auto-populate base weight, origin pending balance, and calculate remainder
    const handleSelectShipment = (shipmentId: string) => {
        setSelectedShipmentId(shipmentId);
        const shipment = candidateShipments.find((s) => s.id === shipmentId);
        if (!shipment) return;

        const base = Number(shipment.base_weight) || 0;
        const balance = Math.max(0, Number(shipment.sales_order_balance) || 0);

        // Rule from PDF: If origin balance is less than base weight, origin gets its pending balance,
        // and destination receives the remainder: Remanente = Base - Saldo.
        // If balance >= base, propose full base weight to origin.
        let proposedOrigin = 0;
        let proposedDest = 0;

        if (balance < base) {
            proposedOrigin = Number(balance.toFixed(3));
            proposedDest = Number(Math.max(0, base - proposedOrigin).toFixed(3));
        } else {
            proposedOrigin = Number(base.toFixed(3));
            proposedDest = 0;
        }

        setOriginWeight(proposedOrigin);

        // Find a first compatible destination sales order
        const firstDest = openSalesOrders.find(
            (so) => so.id !== shipment.sales_order_id && (!shipment.client_id || so.client_id === shipment.client_id)
        );

        setDestinationAllocations([
            {
                sales_order_id: firstDest ? firstDest.id : "",
                order_type: "destination",
                assigned_weight: proposedDest,
                notes: "Ajuste por saldo insuficiente",
            },
        ]);
    };

    // Calculate sum of destination weights
    const totalDestinationWeight = useMemo(() => {
        return destinationAllocations.reduce((acc, row) => acc + (Number(row.assigned_weight) || 0), 0);
    }, [destinationAllocations]);

    // Total assigned weight
    const totalAssignedWeight = useMemo(() => {
        return Number((Number(originWeight || 0) + totalDestinationWeight).toFixed(3));
    }, [originWeight, totalDestinationWeight]);

    // Base weight
    const baseWeight = selectedShipment ? selectedShipment.base_weight : 0;

    // Difference
    const weightDifference = useMemo(() => {
        return Number((baseWeight - totalAssignedWeight).toFixed(3));
    }, [baseWeight, totalAssignedWeight]);

    // Is valid: difference is within 0.005 TM
    const isCuadrado = useMemo(() => {
        if (!selectedShipment) return false;
        return Math.abs(weightDifference) <= 0.005;
    }, [selectedShipment, weightDifference]);

    // Auto-distribute weights based on origin available balance and base weight
    const handleAutoDistribute = () => {
        if (!selectedShipment) return;
        const base = Number(selectedShipment.base_weight) || 0;
        const balance = Math.max(0, Number(selectedShipment.sales_order_balance) || 0);

        let proposedOrigin = 0;
        let proposedDest = 0;

        if (balance < base) {
            proposedOrigin = Number(balance.toFixed(3));
            proposedDest = Number(Math.max(0, base - proposedOrigin).toFixed(3));
        } else {
            proposedOrigin = Number(base.toFixed(3));
            proposedDest = 0;
        }

        setOriginWeight(proposedOrigin);
        if (destinationAllocations.length > 0) {
            const updated = [...destinationAllocations];
            updated[0] = { ...updated[0], assigned_weight: proposedDest };
            for (let i = 1; i < updated.length; i++) {
                updated[i] = { ...updated[i], assigned_weight: 0 };
            }
            setDestinationAllocations(updated);
        }
    };

    // Auto-balance destination when origin weight changes
    const handleOriginWeightChange = (val: number) => {
        const safeVal = isNaN(val) ? 0 : val;
        setOriginWeight(safeVal);
        if (destinationAllocations.length === 1 && selectedShipment) {
            const remanente = Math.max(0, Number((selectedShipment.base_weight - safeVal).toFixed(3)));
            const updated = [...destinationAllocations];
            updated[0].assigned_weight = remanente;
            setDestinationAllocations(updated);
        }
    };

    // Fill origin with its pending balance
    const handleSetOriginToPendingBalance = () => {
        if (!selectedShipment) return;
        const bal = Number(selectedShipment.sales_order_balance.toFixed(3));
        handleOriginWeightChange(bal);
    };

    // Quick action: assign remainder needed to balance to a specific destination row
    const handleAssignRemainderToDestination = (index: number) => {
        if (!selectedShipment) return;
        const otherDestWeight = destinationAllocations.reduce(
            (acc, row, i) => (i === index ? acc : acc + (Number(row.assigned_weight) || 0)),
            0
        );
        const remanente = Math.max(0, Number((selectedShipment.base_weight - originWeight - otherDestWeight).toFixed(3)));
        updateDestinationRow(index, "assigned_weight", remanente);
    };

    // Destination row change handler with bidirectional auto-balance
    const updateDestinationRow = (index: number, field: keyof AllocationRow, value: any) => {
        const updated = [...destinationAllocations];
        updated[index] = { ...updated[index], [field]: value };
        setDestinationAllocations(updated);

        // Auto-balance origin weight when destination weight changes (if 1 destination row)
        if (field === "assigned_weight" && destinationAllocations.length === 1 && selectedShipment) {
            const destVal = isNaN(Number(value)) ? 0 : Number(value);
            const newOrigin = Math.max(0, Number((selectedShipment.base_weight - destVal).toFixed(3)));
            setOriginWeight(newOrigin);
        }
    };

    // Add another destination row
    const addDestinationRow = () => {
        setDestinationAllocations([
            ...destinationAllocations,
            { sales_order_id: "", order_type: "destination", assigned_weight: 0, notes: "Ajuste por saldo insuficiente" },
        ]);
    };

    // Remove a destination row
    const removeDestinationRow = (index: number) => {
        if (destinationAllocations.length <= 1) return;
        const updated = destinationAllocations.filter((_, i) => i !== index);
        setDestinationAllocations(updated);
    };

    // Form submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmitAdjustment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedShipment) {
            Swal.fire("Atención", "Por favor selecciona una orden de embarque.", "warning");
            return;
        }

        if (selectedShipment.has_active_adjustment) {
            Swal.fire(
                "Ajuste Activo Detectado",
                `La orden de embarque ya tiene el ajuste activo ${selectedShipment.active_adjustment_folio}. Debes revertirlo primero.`,
                "error"
            );
            return;
        }

        if (!isCuadrado) {
            Swal.fire(
                "Diferencia de peso",
                `La suma de pesos asignados (${totalAssignedWeight} TM) debe coincidir con el peso base (${baseWeight} TM). Diferencia: ${weightDifference} TM.`,
                "warning"
            );
            return;
        }

        // Validate destination orders
        for (const row of destinationAllocations) {
            if (!row.sales_order_id) {
                Swal.fire("Atención", "Debes seleccionar la orden de venta destino.", "warning");
                return;
            }
            if (row.assigned_weight <= 0) {
                Swal.fire("Atención", "El peso asignado a la orden destino debe ser mayor a 0 TM.", "warning");
                return;
            }
        }

        const payload = {
            shipment_order_id: selectedShipment.id,
            origin_sales_order_id: selectedShipment.sales_order_id,
            presentation: selectedShipment.presentation,
            weight_type: selectedShipment.weight_type,
            base_weight: selectedShipment.base_weight,
            notes,
            allocations: [
                {
                    sales_order_id: selectedShipment.sales_order_id,
                    order_type: "origin",
                    assigned_weight: originWeight,
                    notes: "Saldo asignado a orden original",
                },
                ...destinationAllocations,
            ],
        };

        setIsSubmitting(true);
        router.post(route("documentation.sales-order-adjustments.store"), payload, {
            onSuccess: () => {
                setIsSubmitting(false);
                Swal.fire({
                    icon: "success",
                    title: "¡Ajuste Guardado!",
                    text: "El peso ha sido distribuido y los saldos de las órdenes de venta fueron actualizados correctamente.",
                    timer: 2500,
                    showConfirmButton: false,
                });
                // Reset form and view history
                setSelectedShipmentId("");
                setOriginWeight(0);
                setActiveTab("historial");
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const msg = Object.values(errs).join("\n");
                Swal.fire("Error al guardar ajuste", msg || "Ocurrió un error inesperado.", "error");
            },
        });
    };

    // Revert adjustment action
    const handleOpenRevertModal = (adj: Adjustment) => {
        setSelectedAdjustmentToRevert(adj);
        setRevertReason("");
        setShowRevertModal(true);
    };

    const handleConfirmRevert = () => {
        if (!selectedAdjustmentToRevert) return;
        setIsReverting(true);

        router.patch(
            route("documentation.sales-order-adjustments.revert", selectedAdjustmentToRevert.id),
            { reason: revertReason || "Reversión autorizada" },
            {
                onSuccess: () => {
                    setIsReverting(false);
                    setShowRevertModal(false);
                    setSelectedAdjustmentToRevert(null);
                    Swal.fire({
                        icon: "success",
                        title: "Ajuste Revertido",
                        text: "El ajuste fue revertido y los saldos originales fueron restaurados.",
                        timer: 2200,
                        showConfirmButton: false,
                    });
                },
                onError: (errs) => {
                    setIsReverting(false);
                    const msg = Object.values(errs).join("\n");
                    Swal.fire("Error", msg || "No se pudo revertir el ajuste.", "error");
                },
            }
        );
    };

    // Handle search filter for adjustments table
    const handleApplyFilters = () => {
        router.get(
            route("documentation.sales-order-adjustments.index"),
            { search: searchFilter, status: statusFilter },
            { preserveState: true, replace: true }
        );
    };

    return (
        <DashboardLayout user={auth.user} header="Documentación - Ajuste de Órdenes de Venta">
            <Head title="Ajuste de Órdenes de Venta" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* ─── Breadcrumb & Navigation Header ────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("documentation.index")}
                                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver a Documentación
                            </Link>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mt-1">
                            <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                                <SlidersHorizontal className="w-7 h-7" />
                            </span>
                            Submódulo de Ajuste de Órdenes de Venta
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Distribución del peso de un embarque entre órdenes de venta sin perder trazabilidad.
                        </p>
                    </div>

                    {/* Quick Tab switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center border border-gray-200 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setActiveTab("nuevo")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === "nuevo"
                                    ? "bg-white text-teal-700 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <Scale className="w-4 h-4" />
                            Ajuste de Peso
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("historial")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === "historial"
                                    ? "bg-white text-teal-700 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            Historial y Auditoría
                            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-teal-100 text-teal-800 font-bold">
                                {kpis.total}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ─── KPI Metric Cards ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Total Ajustes
                            </span>
                            <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
                                <FileText className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-gray-900 mt-2">{kpis.total}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Registros históricos</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                Ajustes Activos
                            </span>
                            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-emerald-700 mt-2">{kpis.applied}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Distribuciones vigentes</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                                Toneladas Ajustadas
                            </span>
                            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <TrendingUp className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-indigo-700 mt-2">
                            {Number(kpis.total_tons).toFixed(2)}{" "}
                            <span className="text-sm font-semibold text-gray-500">TM</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Peso total redistribuido</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                                Ajustes Revertidos
                            </span>
                            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                <RotateCcw className="w-4 h-4" />
                            </span>
                        </div>
                        <p className="text-2xl font-black text-amber-700 mt-2">{kpis.reverted}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Auditados y revertidos</p>
                    </div>
                </div>

                {/* ───────────────────────────────────────────────────────────────────────── */}
                {/* TAB 1: NUEVO AJUSTE DE PESO (Matches PDF Page 6 mockup strictly)        */}
                {/* ───────────────────────────────────────────────────────────────────────── */}
                {activeTab === "nuevo" && (
                    <div className="space-y-6">
                        <form onSubmit={handleSubmitAdjustment} className="space-y-6">
                            {/* Card: Header Section (PDF Page 6 Mockup) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-teal-700 to-emerald-800 px-6 py-4 text-white flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <SlidersHorizontal className="w-5 h-5 text-teal-200" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold tracking-wide">
                                                SUBMÓDULO: AJUSTE DE PESO
                                            </h3>
                                            <p className="text-xs text-teal-100">
                                                Selecciona la orden de embarque y distribuye las toneladas requeridas
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-teal-900/60 text-teal-200 px-3 py-1 rounded-full font-mono border border-teal-500/30">
                                        Pág. 6 PDF
                                    </span>
                                </div>

                                {/* Top 4 Fields Bar (Page 6 Mockup) */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 border-b border-gray-200">
                                    {/* 1. Orden de Embarque Selector */}
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Orden de embarque
                                        </label>
                                        <select
                                            value={selectedShipmentId}
                                            onChange={(e) => handleSelectShipment(e.target.value)}
                                            className="w-full text-sm font-semibold rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white"
                                        >
                                            <option value="">-- Seleccionar OE --</option>
                                            {filteredCandidateShipments.map((oe) => (
                                                <option key={oe.id} value={oe.id}>
                                                    {oe.folio} | {oe.sales_order_folio} | {oe.base_weight} TM ({oe.presentation})
                                                    {oe.has_active_adjustment ? " [Ajuste Activo]" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-gray-400">
                                            {selectedShipment
                                                ? `Cliente: ${selectedShipment.client} | Placa: ${selectedShipment.tractor_plate}`
                                                : "Selecciona una orden de embarque activa"}
                                        </p>
                                    </div>

                                    {/* 2. Presentación */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Presentación
                                        </label>
                                        <div className="h-10 px-4 flex items-center justify-between rounded-xl bg-white border border-gray-300 shadow-sm">
                                            <span className="text-sm font-bold text-gray-800">
                                                {selectedShipment ? selectedShipment.presentation : "—"}
                                            </span>
                                            {selectedShipment && (
                                                <span
                                                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                                        selectedShipment.is_granel
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-indigo-100 text-indigo-800"
                                                    }`}
                                                >
                                                    {selectedShipment.is_granel ? "Granel" : "Envasado"}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400">
                                            {selectedShipment
                                                ? selectedShipment.is_granel
                                                    ? "Usa peso neto de báscula"
                                                    : "Usa peso programado"
                                                : "Se detecta automáticamente"}
                                        </p>
                                    </div>

                                    {/* 3. Peso Base */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Peso base ({selectedShipment?.weight_type === "PESO_NETO" ? "PN" : "Programado"})
                                        </label>
                                        <div className="h-10 px-4 flex items-center justify-between rounded-xl bg-teal-50 border border-teal-200 shadow-sm">
                                            <span className="text-base font-black text-teal-900 font-mono">
                                                {selectedShipment ? `${Number(selectedShipment.base_weight).toFixed(3)} TM` : "0.000 TM"}
                                            </span>
                                            <span className="text-[11px] font-semibold text-teal-700">
                                                {selectedShipment?.weight_type === "PESO_NETO" ? "Báscula" : "Programado"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400">
                                            {selectedShipment?.ticket_net_weight
                                                ? `Ticket destare neto: ${selectedShipment.ticket_net_weight} TM`
                                                : selectedShipment
                                                ? `Prog: ${selectedShipment.programmed_tons} TM`
                                                : "Toneladas totales a repartir"}
                                        </p>
                                    </div>

                                    {/* 4. Validación Badge (Exact 'Cuadra ✓' from PDF Page 6) */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                            Validación
                                        </label>
                                        <div
                                            className={`h-10 px-4 flex items-center justify-center gap-2 rounded-xl border font-bold text-sm shadow-sm transition-all ${
                                                isCuadrado
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                    : "bg-amber-50 text-amber-800 border-amber-300"
                                            }`}
                                        >
                                            {isCuadrado ? (
                                                <>
                                                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                                                    <span>Cuadra</span>
                                                </>
                                            ) : (
                                                <span>
                                                    Dif: {weightDifference > 0 ? `+${weightDifference}` : weightDifference} TM
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 text-center">
                                            {isCuadrado ? "Asignación lista para guardar" : "Suma no coincide con peso base"}
                                        </p>
                                    </div>
                                </div>

                                {/* Active Adjustment Warning Banner */}
                                {selectedShipment?.has_active_adjustment && (
                                    <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-amber-800">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                            <div className="text-sm">
                                                <strong>Esta OE ya tiene un ajuste activo ({selectedShipment.active_adjustment_folio}).</strong>{" "}
                                                Por regla de negocio (Pág. 7 PDF), no se permite un segundo ajuste activo.
                                                Debes revertir el ajuste anterior antes de crear uno nuevo.
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("historial")}
                                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                                        >
                                            Ir al Historial
                                        </button>
                                    </div>
                                )}

                                {/* Central Allocation Table (PDF Page 6 Mockup) */}
                                <div className="p-6 space-y-4">
                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-100 text-gray-700 text-xs uppercase font-extrabold border-b border-gray-200">
                                                <tr>
                                                    <th className="py-3 px-4 w-1/4">Orden de venta</th>
                                                    <th className="py-3 px-4 w-1/4">Saldo / tipo</th>
                                                    <th className="py-3 px-4 w-1/4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span>PN a asignar</span>
                                                            {selectedShipment && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAutoDistribute}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all normal-case tracking-normal"
                                                                    title="Calcular distribución automática según saldo disponible"
                                                                >
                                                                    <Sparkles className="w-3 h-3 text-teal-200" />
                                                                    <span>Auto</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="py-3 px-4 w-1/4">Observación / Motivo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {/* ROW 1: ORIGIN SALES ORDER (Orden original) */}
                                                <tr className="bg-teal-50/30 hover:bg-teal-50/50 transition-colors">
                                                    <td className="py-4 px-4 font-bold text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-teal-100 text-teal-800 border border-teal-200">
                                                                ORIGEN
                                                            </span>
                                                            <span className="text-base text-gray-900 font-mono">
                                                                {selectedShipment?.sales_order_folio || "—"}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {selectedShipment ? `${selectedShipment.client} • ${selectedShipment.product}` : "Selecciona una OE"}
                                                        </p>
                                                    </td>

                                                    <td className="py-4 px-4">
                                                        {selectedShipment ? (
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900">
                                                                    Saldo: {Number(selectedShipment.sales_order_balance).toFixed(3)} TM
                                                                </span>
                                                                <p className="text-[11px] text-gray-500">
                                                                    Cargado: {Number(selectedShipment.sales_order_loaded).toFixed(2)} / Solicitado: {Number(selectedShipment.sales_order_total).toFixed(2)} TM
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                min="0"
                                                                max={baseWeight || undefined}
                                                                value={originWeight}
                                                                onChange={(e) => handleOriginWeightChange(parseFloat(e.target.value) || 0)}
                                                                className="w-32 text-right font-mono font-bold text-sm rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white"
                                                            />
                                                            <span className="text-xs font-bold text-gray-500">TM</span>
                                                        </div>
                                                        {selectedShipment && (
                                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSetOriginToPendingBalance}
                                                                    className="text-[11px] text-teal-700 hover:text-teal-900 underline font-medium"
                                                                    title="Tomar el saldo disponible de la orden origen"
                                                                >
                                                                    Usar saldo ({Number(selectedShipment.sales_order_balance).toFixed(3)} TM)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="py-4 px-4 text-xs text-gray-500">
                                                        Saldo consumido de la orden original del embarque
                                                    </td>
                                                </tr>

                                                {/* ROW 2+: DESTINATION SALES ORDERS (Nueva OV / Receptora) */}
                                                {destinationAllocations.map((row, index) => (
                                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                                        DESTINO {destinationAllocations.length > 1 ? `#${index + 1}` : ""}
                                                                    </span>
                                                                </div>
                                                                <select
                                                                    value={row.sales_order_id}
                                                                    onChange={(e) => updateDestinationRow(index, "sales_order_id", e.target.value)}
                                                                    className="w-full text-sm font-semibold rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white"
                                                                >
                                                                    <option value="">-- Seleccionar Orden Destino --</option>
                                                                    {compatibleSalesOrders.map((so) => (
                                                                        <option key={so.id} value={so.id}>
                                                                            {so.folio} | {so.client_name} (Disp: {so.balance.toFixed(2)} TM)
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            {(() => {
                                                                const destSO = openSalesOrders.find((s) => s.id === row.sales_order_id);
                                                                if (!destSO) return <span className="text-gray-400 text-xs">Nueva OV</span>;
                                                                return (
                                                                    <div className="space-y-1">
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900">
                                                                            Nueva OV (Saldo: {destSO.balance.toFixed(2)} TM)
                                                                        </span>
                                                                        <p className="text-[11px] text-gray-500">
                                                                            {destSO.client_name} • {destSO.product_name}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>

                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    min="0"
                                                                    value={row.assigned_weight}
                                                                    onChange={(e) =>
                                                                        updateDestinationRow(
                                                                            index,
                                                                            "assigned_weight",
                                                                            parseFloat(e.target.value) || 0
                                                                        )
                                                                    }
                                                                    className="w-32 text-right font-mono font-bold text-sm rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 bg-white"
                                                                />
                                                                <span className="text-xs font-bold text-gray-500">TM</span>
                                                            </div>
                                                            {selectedShipment && destinationAllocations.length === 1 && (
                                                                <div className="mt-1 text-[11px] text-indigo-600 font-medium flex items-center justify-end gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                                    <span>Auto-calculado (Remanente)</span>
                                                                </div>
                                                            )}
                                                            {selectedShipment && destinationAllocations.length > 1 && !isCuadrado && (
                                                                <div className="flex items-center justify-end mt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleAssignRemainderToDestination(index)}
                                                                        className="text-[11px] text-indigo-700 hover:text-indigo-900 underline font-medium"
                                                                    >
                                                                        Asignar remanente
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={row.notes}
                                                                    onChange={(e) => updateDestinationRow(index, "notes", e.target.value)}
                                                                    placeholder="Motivo de la asignación"
                                                                    className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                                                />
                                                                {destinationAllocations.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeDestinationRow(index)}
                                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Eliminar fila"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                                {/* Button to add extra destination row */}
                                                <tr>
                                                    <td colSpan={4} className="py-2 px-4 bg-gray-50/50">
                                                        <button
                                                            type="button"
                                                            onClick={addDestinationRow}
                                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 py-1 px-2 rounded-md hover:bg-teal-50 transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Agregar otra orden de venta destino
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>

                                            {/* TOTAL ROW (Exact mockup Page 6) */}
                                            <tfoot className="bg-slate-100 font-extrabold text-gray-900 border-t-2 border-gray-300">
                                                <tr>
                                                    <td className="py-4 px-4 text-base tracking-wide uppercase font-black">
                                                        TOTAL
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-gray-600">
                                                        Base:{" "}
                                                        <span className="font-mono font-bold text-gray-900">
                                                            {baseWeight.toFixed(3)} TM
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <span
                                                                className={`font-mono text-base font-black px-3 py-1 rounded-lg border ${
                                                                    isCuadrado
                                                                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                                                        : "bg-amber-100 text-amber-900 border-amber-300"
                                                                }`}
                                                            >
                                                                {totalAssignedWeight.toFixed(3)} TM
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                                isCuadrado
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {isCuadrado
                                                                ? "Total coincide al 100%"
                                                                : `Diferencia de ${weightDifference} TM`}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* General notes & proposal disclaimer */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                                Observaciones del ajuste / Folio externo
                                            </label>
                                            <input
                                                type="text"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Ej. Saldo insuficiente al cierre de embarque, remanente asignado a orden suplementaria..."
                                                className="w-full text-sm rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                            />
                                        </div>

                                        <div className="flex flex-col justify-end">
                                            <p className="text-xs text-gray-500 italic pb-1">
                                                "El sistema propone el saldo pendiente y calcula el remanente; el usuario confirma antes de guardar." (Pág. 6 PDF)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button: Guardar Ajuste */}
                                    <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedShipmentId("");
                                                setOriginWeight(0);
                                            }}
                                            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            Limpiar
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={!selectedShipment || !isCuadrado || isSubmitting || selectedShipment.has_active_adjustment}
                                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                                                !selectedShipment || !isCuadrado || isSubmitting || selectedShipment.has_active_adjustment
                                                    ? "bg-gray-400 cursor-not-allowed opacity-60"
                                                    : "bg-teal-600 hover:bg-teal-700 hover:shadow-lg active:scale-95"
                                            }`}
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            {isSubmitting ? "Guardando ajuste..." : "Guardar ajuste"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* ───────────────────────────────────────────────────────────────────────── */}
                {/* TAB 2: HISTORIAL Y AUDITORÍA DE AJUSTES (PDF Page 5 & Page 7)            */}
                {/* ───────────────────────────────────────────────────────────────────────── */}
                {activeTab === "historial" && (
                    <div className="space-y-6">
                        {/* Filters bar */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex flex-1 w-full md:w-auto items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                                        placeholder="Buscar por Folio, OE, OV, cliente o placas..."
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        router.get(
                                            route("documentation.sales-order-adjustments.index"),
                                            { search: searchFilter, status: e.target.value },
                                            { preserveState: true, replace: true }
                                        );
                                    }}
                                    className="text-sm rounded-xl border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="applied">Aplicados (Activos)</option>
                                    <option value="reverted">Revertidos</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={handleApplyFilters}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                                >
                                    Filtrar
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab("nuevo")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Ajuste
                            </button>
                        </div>

                        {/* Adjustments Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-gray-700 text-xs uppercase font-extrabold border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4">Folio / Fecha</th>
                                            <th className="py-3 px-4">Orden de Embarque</th>
                                            <th className="py-3 px-4">Peso Base</th>
                                            <th className="py-3 px-4">Distribución por OV</th>
                                            <th className="py-3 px-4">Usuario</th>
                                            <th className="py-3 px-4">Estado</th>
                                            <th className="py-3 px-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {adjustments.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-400">
                                                    <SlidersHorizontal className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                    No se encontraron ajustes de órdenes de venta registrados.
                                                </td>
                                            </tr>
                                        ) : (
                                            adjustments.data.map((adj) => (
                                                <tr
                                                    key={adj.id}
                                                    className={`hover:bg-slate-50/70 transition-colors ${
                                                        adj.status === "reverted" ? "opacity-60 bg-gray-50/40" : ""
                                                    }`}
                                                >
                                                    {/* Folio & Date */}
                                                    <td className="py-4 px-4">
                                                        <div className="font-mono font-bold text-gray-900 text-sm">
                                                            {adj.folio}
                                                        </div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(adj.created_at).toLocaleDateString("es-MX", {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </div>
                                                    </td>

                                                    {/* Shipment Order */}
                                                    <td className="py-4 px-4">
                                                        <div className="font-bold text-indigo-700 font-mono">
                                                            {adj.shipment_order?.folio || "—"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {adj.shipment_order?.client?.business_name || "Cliente N/A"}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400">
                                                            Placas: {adj.shipment_order?.tractor_plate || "N/A"}
                                                        </div>
                                                    </td>

                                                    {/* Base Weight & Type */}
                                                    <td className="py-4 px-4">
                                                        <div className="font-mono font-black text-gray-900">
                                                            {Number(adj.base_weight).toFixed(3)} TM
                                                        </div>
                                                        <span
                                                            className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                                adj.presentation.includes("GRANEL")
                                                                    ? "bg-amber-100 text-amber-800"
                                                                    : "bg-indigo-100 text-indigo-800"
                                                            }`}
                                                        >
                                                            {adj.presentation} ({adj.weight_type})
                                                        </span>
                                                    </td>

                                                    {/* Distribution Details */}
                                                    <td className="py-4 px-4">
                                                        <div className="space-y-1">
                                                            {adj.items && adj.items.map((item) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between text-xs py-0.5 border-b border-gray-100 last:border-b-0 gap-3"
                                                                >
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span
                                                                            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded ${
                                                                                item.order_type === "origin"
                                                                                    ? "bg-teal-100 text-teal-800"
                                                                                    : "bg-blue-100 text-blue-800"
                                                                            }`}
                                                                        >
                                                                            {item.order_type === "origin" ? "ORIGEN" : "DESTINO"}
                                                                        </span>
                                                                        <span className="font-mono font-semibold text-gray-800">
                                                                            {item.sales_order?.folio || "OV"}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-mono font-bold text-gray-900">
                                                                        {Number(item.assigned_weight).toFixed(3)} TM
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* User */}
                                                    <td className="py-4 px-4 text-xs text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{adj.user?.name || "Sistema"}</span>
                                                        </div>
                                                        {adj.notes && (
                                                            <p className="text-[11px] text-gray-400 mt-1 italic truncate max-w-xs">
                                                                "{adj.notes}"
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="py-4 px-4">
                                                        {adj.status === "applied" ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                                Aplicado
                                                            </span>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                                                    Revertido
                                                                </span>
                                                                {adj.revert_reason && (
                                                                    <p className="text-[10px] text-gray-400 italic">
                                                                        Motivo: {adj.revert_reason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 px-4 text-center">
                                                        {adj.status === "applied" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenRevertModal(adj)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                                                title="Revertir este ajuste y restaurar saldos originales"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                Revertir
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Auditado</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {adjustments.links && adjustments.links.length > 3 && (
                                <div className="p-4 bg-slate-50 border-t border-gray-200 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Total: {adjustments.total} registros
                                    </span>
                                    <div className="flex gap-1">
                                        {adjustments.links.map((link, idx) => (
                                            <button
                                                key={idx}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                    link.active
                                                        ? "bg-teal-600 text-white font-bold"
                                                        : link.url
                                                        ? "bg-white text-gray-700 border hover:bg-gray-100"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Revert Modal ───────────────────────────────────────────────────────── */}
            {showRevertModal && selectedAdjustmentToRevert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-red-600 font-bold text-lg">
                                <RotateCcw className="w-5 h-5" />
                                Revertir Ajuste {selectedAdjustmentToRevert.folio}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRevertModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600">
                            ¿Estás seguro de revertir este ajuste? Al revertirlo:
                        </p>

                        <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
                            <li>
                                El saldo cargado en la orden destino se restará.
                            </li>
                            <li>
                                La orden original volverá a computar la totalidad del peso asignado originalmente.
                            </li>
                            <li>
                                El registro quedará archivado como <strong>Revertido</strong> con fecha y usuario auditor.
                            </li>
                        </ul>

                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                Motivo de la reversión (Requerido para auditoría)
                            </label>
                            <textarea
                                rows={3}
                                value={revertReason}
                                onChange={(e) => setRevertReason(e.target.value)}
                                placeholder="Indica el motivo por el cual se anula este ajuste..."
                                className="w-full text-sm rounded-xl border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowRevertModal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isReverting}
                                onClick={handleConfirmRevert}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all disabled:opacity-50"
                            >
                                {isReverting ? "Revertiendo..." : "Confirmar Reversión"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
