import React, { useState, useMemo, useRef, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Swal from "sweetalert2";
import {
    ArrowUpFromLine,
    ArrowLeft,
    Plus,
    Search,
    Calendar,
    CheckCircle2,
    DollarSign,
    Boxes,
    FileText,
    User,
    Warehouse,
    X,
    AlertCircle,
    Printer,
    Trash2,
    Barcode,
    ListPlus,
    Tag,
} from "lucide-react";

interface MovementItem {
    id: number;
    ids?: number[];
    movement_type: "entry" | "exit";
    item_id?: number;
    item_code?: string;
    item_name?: string;
    type_name?: string;
    group_name?: string;
    quantity?: number;
    unit?: string;
    unit_cost?: number | null;
    total_cost: number;
    total_quantity?: number;
    reference_document?: string;
    responsible_person?: string;
    destination_area?: string;
    location?: string;
    all_locations?: string[];
    notes?: string;
    items_count?: number;
    items_summary?: string[];
    movement_date: string;
    entry_date?: string;
    exit_date?: string;
    created_at?: string;
    user?: {
        name: string;
    };
}

interface ProductOption {
    id: number;
    name: string;
    code: string;
    type_name: string;
    type_slug: string;
    group_name: string;
    group_number: number;
    unit: string;
    stock: number;
    unit_cost: number;
    location?: string;
}

interface ExitStagedItem {
    temp_id: string;
    item_id: number;
    code: string;
    name: string;
    type_name: string;
    group_name: string;
    unit: string;
    stock: number;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    destination_area?: string;
    location?: string;
    notes?: string;
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

interface Metrics {
    total_exits: number;
    total_quantity: number;
    total_cost: number;
    exits_this_month: number;
}

interface Props {
    auth: any;
    movements: PaginatedData<MovementItem>;
    metrics: Metrics;
    availableProducts: ProductOption[];
    types: any[];
    filters: {
        search?: string;
        type_slug?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function ExitsIndex({
    auth,
    movements,
    metrics,
    availableProducts = [],
    types = [],
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedType, setSelectedType] = useState(filters.type_slug || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Header info for exit batch
    const [exitHeader, setExitHeader] = useState({
        movement_date: new Date().toISOString().split("T")[0],
        reference_document: "",
        responsible_person: auth?.user?.name || "",
        destination_area: "Área Operativa",
        location: "Área Operativa",
        notes: "",
    });

    // Staged items in current modal
    const [stagedItems, setStagedItems] = useState<ExitStagedItem[]>([]);

    // Search and single-item addition state
    const [productSearch, setProductSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
    const [itemQuantity, setItemQuantity] = useState<string | number>(1);
    const [itemDestination, setItemDestination] = useState("");
    const [itemNotes, setItemNotes] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    const allSelected = useMemo(() => {
        if (!movements.data || movements.data.length === 0) return false;
        const allIds: number[] = [];
        movements.data.forEach((m) => {
            if (m.ids && m.ids.length > 0) {
                allIds.push(...m.ids);
            } else {
                allIds.push(m.id);
            }
        });
        return allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    }, [movements.data, selectedIds]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds: number[] = [];
            movements.data.forEach((m) => {
                if (m.ids && m.ids.length > 0) {
                    allIds.push(...m.ids);
                } else {
                    allIds.push(m.id);
                }
            });
            setSelectedIds(Array.from(new Set(allIds)));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleRow = (m: MovementItem) => {
        const rowIds = m.ids && m.ids.length > 0 ? m.ids : [m.id];
        const isRowSelected = rowIds.every((id) => selectedIds.includes(id));
        if (isRowSelected) {
            setSelectedIds((prev) => prev.filter((id) => !rowIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...rowIds])));
        }
    };

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return [];
        const term = productSearch.toLowerCase().trim();
        return availableProducts
            .filter((p) =>
                p.code.toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term) ||
                (p.type_name && p.type_name.toLowerCase().includes(term)) ||
                (p.group_name && p.group_name.toLowerCase().includes(term))
            )
            .slice(0, 10);
    }, [availableProducts, productSearch]);

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        const query = {
            search,
            type_slug: selectedType || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            ...newFilters,
        };

        Object.keys(query).forEach((k) => {
            if ((query as any)[k] === undefined || (query as any)[k] === "") {
                delete (query as any)[k];
            }
        });

        router.get(route("apt.inventory.exits.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openCreateModal = () => {
        setExitHeader({
            movement_date: new Date().toISOString().split("T")[0],
            reference_document: "",
            responsible_person: auth?.user?.name || "",
            destination_area: "",
            location: "",
            notes: "",
        });
        setStagedItems([]);
        setSelectedProduct(null);
        setProductSearch("");
        setItemQuantity(1);
        setItemDestination("");
        setItemNotes("");
        setIsDropdownOpen(false);
        setIsCreateModalOpen(true);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 150);
    };

    const handleSelectProduct = (prod: ProductOption) => {
        setSelectedProduct(prod);
        setProductSearch(`[${prod.code}] ${prod.name}`);
        setItemDestination(exitHeader.destination_area || "");
        setIsDropdownOpen(false);
        setTimeout(() => {
            qtyInputRef.current?.focus();
            qtyInputRef.current?.select();
        }, 100);
    };

    const handleAddItemToList = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedProduct) {
            Swal.fire({
                icon: "warning",
                title: "Seleccione un producto",
                text: "Escriba la nomenclatura o nombre del insumo y seleccione un producto con existencia.",
                confirmButtonColor: "#d97706",
            });
            return;
        }

        const qty = Number(itemQuantity);
        if (!qty || qty <= 0) {
            Swal.fire({
                icon: "warning",
                title: "Cantidad inválida",
                text: "Ingrese una cantidad válida mayor a 0.",
                confirmButtonColor: "#d97706",
            });
            return;
        }

        // Calculate already staged quantity for this product
        const alreadyStagedQty = stagedItems
            .filter((i) => i.item_id === selectedProduct.id)
            .reduce((acc, i) => acc + Number(i.quantity), 0);

        if (alreadyStagedQty + qty > selectedProduct.stock) {
            Swal.fire({
                icon: "error",
                title: "Existencia Insuficiente",
                text: `La cantidad total a despachar (${alreadyStagedQty + qty} ${selectedProduct.unit}) supera el stock disponible (${selectedProduct.stock} ${selectedProduct.unit}).`,
                confirmButtonColor: "#ef4444",
            });
            return;
        }

        const cost = Number(selectedProduct.unit_cost || 0);
        const subtotal = qty * cost;

        const newItem: ExitStagedItem = {
            temp_id: `${Date.now()}_${Math.random()}`,
            item_id: selectedProduct.id,
            code: selectedProduct.code,
            name: selectedProduct.name,
            type_name: selectedProduct.type_name,
            group_name: selectedProduct.group_name,
            unit: selectedProduct.unit,
            stock: selectedProduct.stock,
            quantity: qty,
            unit_cost: cost,
            total_cost: subtotal,
            destination_area: itemDestination || exitHeader.destination_area,
            location: itemDestination || exitHeader.location,
            notes: itemNotes,
        };

        setStagedItems((prev) => [...prev, newItem]);

        // Reset inputs for next rapid addition
        setSelectedProduct(null);
        setProductSearch("");
        setItemQuantity(1);
        setItemDestination("");
        setItemNotes("");
        setIsDropdownOpen(false);

        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    };

    const handleRemoveStagedItem = (temp_id: string) => {
        setStagedItems((prev) => prev.filter((i) => i.temp_id !== temp_id));
    };

    const handleSubmitBatch = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        let itemsToSubmit = [...stagedItems];
        if (itemsToSubmit.length === 0 && selectedProduct && Number(itemQuantity) > 0) {
            const qty = Number(itemQuantity);
            const alreadyStagedQty = stagedItems
                .filter((i) => i.item_id === selectedProduct.id)
                .reduce((acc, i) => acc + Number(i.quantity), 0);

            if (alreadyStagedQty + qty > selectedProduct.stock) {
                Swal.fire({
                    icon: "error",
                    title: "Existencia Insuficiente",
                    text: `La cantidad solicitada supera el stock disponible (${selectedProduct.stock} ${selectedProduct.unit}).`,
                    confirmButtonColor: "#ef4444",
                });
                return;
            }

            const cost = Number(selectedProduct.unit_cost || 0);
            itemsToSubmit.push({
                temp_id: `${Date.now()}_${Math.random()}`,
                item_id: selectedProduct.id,
                code: selectedProduct.code,
                name: selectedProduct.name,
                type_name: selectedProduct.type_name,
                group_name: selectedProduct.group_name,
                unit: selectedProduct.unit,
                stock: selectedProduct.stock,
                quantity: qty,
                unit_cost: cost,
                total_cost: qty * cost,
                destination_area: itemDestination || exitHeader.destination_area,
                location: itemDestination || exitHeader.location,
                notes: itemNotes,
            });
        }

        if (itemsToSubmit.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Lista vacía",
                text: "Escriba la nomenclatura o nombre del insumo y agregue al menos un producto a la lista.",
                confirmButtonColor: "#d97706",
            });
            return;
        }

        setIsSubmitting(true);

        const payload = {
            movement_date: exitHeader.movement_date,
            reference_document: exitHeader.reference_document,
            responsible_person: exitHeader.responsible_person,
            destination_area: exitHeader.destination_area,
            location: exitHeader.location || exitHeader.destination_area,
            notes: exitHeader.notes,
            items: itemsToSubmit.map((i) => ({
                item_id: i.item_id,
                quantity: i.quantity,
                unit_cost: i.unit_cost,
                destination_area: i.destination_area || exitHeader.destination_area,
                location: i.location || exitHeader.location,
                notes: i.notes || exitHeader.notes,
            })),
        };

        router.post(route("apt.inventory.exits.store"), payload, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setStagedItems([]);
                setIsSubmitting(false);
            },
            onError: (errs) => {
                setIsSubmitting(false);
                const msg = Object.values(errs).join("\n") || "Ocurrió un error al procesar el vale de salida.";
                Swal.fire({
                    icon: "error",
                    title: "Error al registrar",
                    text: msg,
                    confirmButtonColor: "#ef4444",
                });
            },
        });
    };

    const stagedTotalQty = stagedItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
    const stagedTotalCost = stagedItems.reduce((acc, i) => acc + Number(i.total_cost || 0), 0);

    return (
        <DashboardLayout user={auth?.user} header="Salidas de Inventario">
            <Head title="Salida de Materiales - Inventario" />

            <div className="py-6 max-w-[98%] mx-auto px-2 sm:px-4 lg:px-6">
                {/* Back button */}
                <div className="mb-4">
                    <Link
                        href={typeof route === "function" ? route("apt.inventory.products-hub") : "/apt/inventory/products-hub"}
                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver a Entrada y Salida de Productos
                    </Link>
                </div>

                {/* Header Banner */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm">
                            <ArrowUpFromLine className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    SALIDA DE INSUMOS
                                </h1>
                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                                    SUBMÓDULO 3
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                Despacho de materiales, entregas a producción/mantenimiento, vales de consumo y disminución de existencias.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-amber-200 hover:shadow-lg transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Registrar Salida / Vale</span>
                        </button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                TOTAL SALIDAS
                            </span>
                            <span className="text-3xl font-black text-gray-900 mt-1 block">
                                {metrics.total_exits}
                            </span>
                            <span className="text-xs text-amber-600 font-medium mt-1 block">
                                Despachos registrados
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <ArrowUpFromLine className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                UNIDADES DESPACHADAS
                            </span>
                            <span className="text-3xl font-black text-amber-600 mt-1 block">
                                {Number(metrics.total_quantity || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Total entregado
                            </span>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Boxes className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                VALOR DE CONSUMO
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
                                ${Number(metrics.total_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Costo acumulado despachado
                            </span>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                SALIDAS ESTE MES
                            </span>
                            <span className="text-3xl font-black text-indigo-600 mt-1 block">
                                {Number(metrics.exits_this_month || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Unidades en el mes actual
                            </span>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                        <div className="lg:col-span-5 relative">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFilterChange({ search })}
                                placeholder="Buscar por producto, clave, folio de vale o solicitante..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <select
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    handleFilterChange({ type_slug: e.target.value || undefined });
                                }}
                                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-700"
                            >
                                <option value="">TODOS LOS SUBMÓDULOS</option>
                                {types.map((t) => (
                                    <option key={t.slug} value={t.slug}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    handleFilterChange({ date_from: e.target.value || undefined });
                                }}
                                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-700"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    handleFilterChange({ date_to: e.target.value || undefined });
                                }}
                                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Batch Selection Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2.5 text-amber-950 font-bold text-sm">
                            <CheckCircle2 className="w-5 h-5 text-amber-600" />
                            <span>
                                {selectedIds.length} {selectedIds.length === 1 ? "material seleccionado" : "materiales seleccionados para vale consolidado"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="px-3.5 py-2 text-xs text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-xl font-bold shadow-sm transition-colors"
                            >
                                Deseleccionar
                            </button>
                            <a
                                href={route("apt.inventory.exits.print-batch", { ids: selectedIds.join(",") })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-200 transition-all hover:scale-105 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Imprimir Seleccionados ({selectedIds.length})</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1e1b4b] text-white text-[11px] uppercase tracking-wider font-extrabold">
                                    <th className="py-4 px-3 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                                            title="Seleccionar todos los registros de la página"
                                        />
                                    </th>
                                    <th className="py-4 px-4 text-center">FECHA</th>
                                    <th className="py-4 px-4 text-center">VALE / REF</th>
                                    <th className="py-4 px-4 text-right">COSTO TOTAL</th>
                                    <th className="py-4 px-4">SOLICITA / ENTREGA</th>
                                    <th className="py-4 px-4">ÁREA / DESTINO</th>
                                    <th className="py-4 px-4 text-center">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                                {movements.data.length > 0 ? (
                                    movements.data.map((m) => {
                                        const cleanDate = (() => {
                                            if (!m.movement_date) return "";
                                            const d = String(m.movement_date).split("T")[0];
                                            const p = d.split("-");
                                            return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
                                        })();
                                        const isSelected = m.ids && m.ids.length > 0
                                            ? m.ids.every((id) => selectedIds.includes(id))
                                            : selectedIds.includes(m.id);

                                        const formatFolio = (ref?: string, id?: number) => {
                                            if (!ref || !ref.trim()) {
                                                return `VAL-${(id || 0).toString().padStart(4, "0")}`;
                                            }
                                            const trimmed = ref.trim();
                                            if (/^\d+$/.test(trimmed)) {
                                                return `VAL-${Number(trimmed).toString().padStart(4, "0")}`;
                                            }
                                            return trimmed.toUpperCase();
                                        };

                                        return (
                                            <tr key={m.id} className={`transition-colors ${isSelected ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-slate-50/80"}`}>
                                                <td className="py-4 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleRow(m)}
                                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                                                    />
                                                </td>
                                                <td className="py-4 px-4 text-center font-bold text-gray-700">
                                                    {cleanDate}
                                                </td>
                                                <td className="py-4 px-4 text-center font-mono font-bold text-gray-700">
                                                    <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs border border-amber-200">
                                                        {formatFolio(m.reference_document, m.id)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        ${Number(m.total_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                                                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{m.responsible_person || m.user?.name || "N/D"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div
                                                        className="flex items-center gap-1.5 text-gray-600 text-xs"
                                                        title={m.items_summary && m.items_summary.length > 0 ? m.items_summary.join("\n") : (m.destination_area || m.location || "Área Operativa")}
                                                    >
                                                        <Warehouse className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate max-w-[200px]">{m.destination_area || m.location || "Área Operativa"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <a
                                                        href={route("apt.inventory.exits.print", m.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Imprimir Formato Oficial de Salida"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-all hover:scale-105 shadow-sm cursor-pointer"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                        <span>Imprimir</span>
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-500">
                                            <ArrowUpFromLine className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm font-semibold">No se han registrado salidas de insumos</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Create Exit */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-100 overflow-hidden">
                        
                        {/* 1. Modal Header */}
                        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between shrink-0 shadow-md">
                            <div className="flex items-center gap-3.5">
                                <div className="p-3 bg-white/15 text-white rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm">
                                    <ArrowUpFromLine className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-extrabold tracking-tight text-white">
                                            Registrar Salida / Vale de Insumos
                                        </h2>
                                        <span className="text-[10px] bg-amber-950/40 text-amber-100 font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wide">
                                            Multi-Producto
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-100/90 mt-0.5">
                                        Escriba la nomenclatura o nombre del insumo, agréguelo al vale y genere el documento para impresión inmediata.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/15 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                            
                            {/* Section 1: Datos Generales del Vale */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                    <span>1. Datos del Vale de Salida y Solicitante</span>
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1 text-[11px]">
                                            Fecha de Salida *
                                        </label>
                                        <input
                                            type="date"
                                            value={exitHeader.movement_date}
                                            onChange={(e) => setExitHeader({ ...exitHeader, movement_date: e.target.value })}
                                            required
                                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1 text-[11px]">
                                            Folio de Vale / Requisición
                                        </label>
                                        <input
                                            type="text"
                                            value={exitHeader.reference_document}
                                            onChange={(e) => setExitHeader({ ...exitHeader, reference_document: e.target.value })}
                                            placeholder="Ej. VALE-2026-001, REQ-44..."
                                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1 text-[11px]">
                                            Solicitante / Quien Recibe
                                        </label>
                                        <input
                                            type="text"
                                            value={exitHeader.responsible_person}
                                            onChange={(e) => setExitHeader({ ...exitHeader, responsible_person: e.target.value })}
                                            placeholder="Nombre u operador receptor"
                                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1 text-[11px]">
                                            Área de Destino / Trabajo
                                        </label>
                                        <input
                                            type="text"
                                            value={exitHeader.destination_area}
                                            onChange={(e) => setExitHeader({ ...exitHeader, destination_area: e.target.value, location: e.target.value })}
                                            placeholder="Ej. Planta 1, Obra Civil, Empaque..."
                                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 md:col-span-4">
                                        <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1 text-[11px]">
                                            Notas / Justificación del Despacho
                                        </label>
                                        <input
                                            type="text"
                                            value={exitHeader.notes}
                                            onChange={(e) => setExitHeader({ ...exitHeader, notes: e.target.value })}
                                            placeholder="Motivo del retiro, proyecto, cuadrilla o máquina..."
                                            className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Buscar y Agregar Insumo */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-sm relative">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Barcode className="w-4 h-4 text-amber-600" />
                                        <span>2. Buscar Insumo por Nomenclatura o Nombre</span>
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-normal">
                                        Solo productos con stock disponible (&gt; 0)
                                    </span>
                                </h3>

                                <div className="space-y-3">
                                    {/* Autocomplete Input */}
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    setIsDropdownOpen(true);
                                                    if (selectedProduct && !e.target.value.includes(selectedProduct.code)) {
                                                        setSelectedProduct(null);
                                                    }
                                                }}
                                                onFocus={() => setIsDropdownOpen(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && filteredProducts.length > 0 && !selectedProduct) {
                                                        e.preventDefault();
                                                        handleSelectProduct(filteredProducts[0]);
                                                    }
                                                }}
                                                placeholder="Escriba nomenclatura / clave (ej. MAT-ELE-001) o nombre del insumo a retirar..."
                                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-amber-300/80 rounded-2xl text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-inner"
                                            />
                                            {productSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProductSearch("");
                                                        setSelectedProduct(null);
                                                        setIsDropdownOpen(false);
                                                        searchInputRef.current?.focus();
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Dropdown Options */}
                                        {isDropdownOpen && productSearch.trim().length > 0 && (
                                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-60 overflow-y-auto divide-y divide-gray-100">
                                                {filteredProducts.length > 0 ? (
                                                    filteredProducts.map((p) => {
                                                        const isOutOfStock = p.stock <= 0;
                                                        return (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                disabled={isOutOfStock}
                                                                onClick={() => !isOutOfStock && handleSelectProduct(p)}
                                                                className={`w-full text-left p-3 transition-colors flex items-center justify-between gap-3 group ${
                                                                    isOutOfStock
                                                                        ? "bg-gray-50 opacity-50 cursor-not-allowed"
                                                                        : "hover:bg-amber-50/80 cursor-pointer"
                                                                }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                                                            {p.code}
                                                                        </span>
                                                                        <span className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                                                            {p.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                                                        {p.type_name} • Grupo: {p.group_name}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <div className={`text-xs font-extrabold ${isOutOfStock ? "text-red-600" : "text-amber-700"}`}>
                                                                        Stock: {p.stock} {p.unit}
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-500">
                                                                        Costo: ${Number(p.unit_cost || 0).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-gray-500">
                                                        No se encontraron insumos con ese nombre o clave.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details & Exit inputs */}
                                    {selectedProduct && (
                                        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-3 animate-fadeIn">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-black text-xs bg-amber-800 text-white px-2 py-0.5 rounded">
                                                            {selectedProduct.code}
                                                        </span>
                                                        <span className="font-black text-amber-950 text-sm">
                                                            {selectedProduct.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-amber-800 mt-0.5">
                                                        {selectedProduct.type_name} &gt; {selectedProduct.group_name}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="bg-white text-amber-900 font-bold px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm">
                                                        Existencia Disponible: <strong className="text-amber-700 text-sm">{selectedProduct.stock} {selectedProduct.unit}</strong>
                                                    </span>
                                                    <span className="bg-white text-amber-900 font-bold px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm">
                                                        Costo Unitario: <strong>${Number(selectedProduct.unit_cost || 0).toFixed(2)}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity, Destination, Add to List */}
                                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                                                        Cantidad a Despachar ({selectedProduct.unit}) *
                                                    </label>
                                                    <input
                                                        ref={qtyInputRef}
                                                        type="number"
                                                        step="0.001"
                                                        min="0.001"
                                                        max={selectedProduct.stock}
                                                        value={itemQuantity}
                                                        onChange={(e) => setItemQuantity(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleAddItemToList()}
                                                        placeholder="1"
                                                        required
                                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-extrabold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                                                        Área de Destino
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={itemDestination}
                                                        onChange={(e) => setItemDestination(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleAddItemToList()}
                                                        placeholder={exitHeader.destination_area || "Área Operativa"}
                                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                                        Subtotal Estimado
                                                    </label>
                                                    <div className="py-2 px-3 bg-white/90 border border-amber-200 rounded-xl text-xs sm:text-sm font-black text-gray-900">
                                                        ${(
                                                            Number(itemQuantity || 0) * Number(selectedProduct.unit_cost || 0)
                                                        ).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddItemToList()}
                                                        className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-amber-200 hover:shadow-lg transition-all cursor-pointer"
                                                    >
                                                        <Plus className="w-4 h-4 stroke-[3]" />
                                                        <span>Agregar al Vale</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section 3: Lista de Insumos en el Vale */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                        <ListPlus className="w-4 h-4 text-amber-600" />
                                        <span>3. Lista de Insumos en el Vale ({stagedItems.length})</span>
                                    </h3>
                                    {stagedItems.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setStagedItems([])}
                                            className="text-[11px] text-red-600 hover:text-red-700 font-bold hover:underline"
                                        >
                                            Limpiar Lista
                                        </button>
                                    )}
                                </div>

                                {stagedItems.length > 0 ? (
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                        <div className="overflow-x-auto max-h-64">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead className="sticky top-0 bg-[#1e1b4b] text-white uppercase text-[10px] tracking-wider font-extrabold z-10">
                                                    <tr>
                                                        <th className="py-2.5 px-3 text-center w-8">#</th>
                                                        <th className="py-2.5 px-3">CLAVE / NOMENCLATURA</th>
                                                        <th className="py-2.5 px-3">PRODUCTO / INSUMO</th>
                                                        <th className="py-2.5 px-3">DESTINO</th>
                                                        <th className="py-2.5 px-3 text-center">CANTIDAD</th>
                                                        <th className="py-2.5 px-3 text-right">COSTO UNIT.</th>
                                                        <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                                                        <th className="py-2.5 px-3 text-center w-12">QUITAR</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {stagedItems.map((item, idx) => (
                                                        <tr key={item.temp_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                            <td className="py-2.5 px-3 text-center font-bold text-gray-400">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono font-bold text-amber-800">
                                                                <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                                                                    {item.code}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="font-bold text-gray-900">{item.name}</div>
                                                                <div className="text-[10px] text-gray-500">{item.type_name} &gt; {item.group_name}</div>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-gray-600 text-xs">
                                                                {item.destination_area || exitHeader.destination_area || "Área Operativa"}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center font-extrabold text-amber-700 text-sm">
                                                                -{Number(item.quantity).toLocaleString("es-MX", { maximumFractionDigits: 3 })} {item.unit}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-semibold text-gray-700">
                                                                ${Number(item.unit_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-black text-gray-900">
                                                                ${Number(item.total_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveStagedItem(item.temp_id)}
                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar del vale"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-amber-50/80 font-bold border-t border-amber-200 text-xs">
                                                    <tr>
                                                        <td colSpan={4} className="py-2.5 px-4 text-right uppercase text-amber-950 font-black">
                                                            Totales del Vale ({stagedItems.length} insumos):
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-black text-amber-900 text-sm">
                                                            {stagedTotalQty.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td></td>
                                                        <td className="py-2.5 px-3 text-right font-black text-amber-950 text-sm">
                                                            ${stagedTotalCost.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-300 text-gray-400">
                                        <Boxes className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p className="text-xs font-bold text-gray-600">No hay productos en el vale todavía</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Escriba la nomenclatura o nombre arriba y presione "Agregar al Vale" para acumular insumos.
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Modal Footer & Actions */}
                        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Printer className="w-4 h-4 text-amber-600" />
                                <span>Al registrar, se abrirá directamente el formato oficial para su impresión.</span>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleSubmitBatch}
                                    disabled={isSubmitting || (stagedItems.length === 0 && !selectedProduct)}
                                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white shadow-lg transition-all ${
                                        isSubmitting || (stagedItems.length === 0 && !selectedProduct)
                                            ? "bg-gray-400 cursor-not-allowed opacity-60"
                                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-300 hover:scale-[1.02] cursor-pointer"
                                    }`}
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>
                                        {isSubmitting
                                            ? "Procesando Salida..."
                                            : `Registrar Salida e Imprimir (${stagedItems.length + (selectedProduct && Number(itemQuantity) > 0 ? 1 : 0)})`}
                                    </span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
