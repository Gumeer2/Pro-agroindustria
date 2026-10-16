import React, { useState, useRef, useEffect, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import Swal from "sweetalert2";
import {
    Boxes,
    PackagePlus,
    Search,
    Filter,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    AlertTriangle,
    Eye,
    Edit3,
    Trash2,
    X,
    FolderKanban,
    ChevronRight,
    ChevronDown,
    Tag,
    Layers,
    Warehouse,
    Plus,
    Sparkles,
    Check,
    ListFilter,
    Printer,
    ExternalLink,
} from "lucide-react";

interface SupplyGroup {
    number: number;
    consecutive?: string;
    code?: string;
    name: string;
    description?: string;
}

interface SupplyType {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    badge_color?: string;
    total_items: number;
    total_stock: number;
    total_value: number;
    groups: SupplyGroup[];
}

interface InventoryItem {
    id: number;
    consecutive?: string;
    code: string;
    part_number?: string;
    name: string;
    description?: string;
    type_id: number;
    type_name: string;
    type_slug: string;
    group_number: number;
    group_name: string;
    unit: string;
    unit_cost: number;
    stock: number;
    min_stock: number;
    location?: string;
    is_inventoried: boolean;
    created_at?: string;
    user?: {
        name: string;
    };
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
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface LowStockAlertItem {
    id: number;
    name: string;
    code: string;
    part_number?: string;
    consecutive?: string;
    type_id: number;
    type_slug: string;
    type_name: string;
    group_number: number;
    group_name: string;
    unit: string;
    stock: number;
    min_stock: number;
    unit_cost: number;
    location?: string;
    deficit: number;
    is_out_of_stock: boolean;
}

interface Props {
    auth: any;
    items: PaginatedData<InventoryItem>;
    metrics: Metrics;
    locations?: string[];
    lowStockAlerts?: LowStockAlertItem[];
    allItemsSummary?: {
        id: number;
        name?: string;
        type_slug: string;
        type_name?: string;
        type_id: number;
        group_number?: number;
        group_name?: string;
        consecutive?: string;
        code?: string;
        part_number?: string;
        unit?: string;
        stock: number;
        min_stock: number;
        unit_cost: number;
        location: string;
    }[];
    types: SupplyType[];
    selectedTypeSlug: string;
    filters: {
        search?: string;
        type?: string;
        group_number?: string;
        is_inventoried?: string;
        stock_status?: string;
    };
}

export default function ProductsIndex({
    auth,
    items,
    metrics,
    locations = [],
    lowStockAlerts = [],
    allItemsSummary = [],
    types = [],
    selectedTypeSlug = "",
    filters = {},
}: Props) {
    // Initial selection: take from filters.type, or selectedTypeSlug, or if none provided, empty or first type
    const [selectedType, setSelectedType] = useState<string>(
        filters.type || (selectedTypeSlug !== "all" ? selectedTypeSlug : "") || ""
    );
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [search, setSearch] = useState(filters.search || "");
    const [selectedGroup, setSelectedGroup] = useState(filters.group_number || "");
    const [selectedStockStatus, setSelectedStockStatus] = useState(filters.stock_status || "");
    const [selectedInventoried, setSelectedInventoried] = useState(filters.is_inventoried || "");

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Stock Alerts Modal State
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertFilterType, setAlertFilterType] = useState<string>("all");
    const [alertFilterGroup, setAlertFilterGroup] = useState<string>("all");
    const [alertFilterCode, setAlertFilterCode] = useState<string>("");
    const [alertFilterStatus, setAlertFilterStatus] = useState<"all" | "out_of_stock" | "low_stock">("all");

    // Available groups for the alert modal based on alertFilterType
    const alertModalGroups = useMemo(() => {
        if (alertFilterType === "all") {
            const allG: { number: number; name: string; typeName: string }[] = [];
            types.forEach((t) => {
                (t.groups || []).forEach((g) => {
                    allG.push({ number: g.number, name: g.name, typeName: t.name });
                });
            });
            return allG;
        }
        const selT = types.find((t) => t.slug === alertFilterType);
        return selT ? (selT.groups || []).map((g) => ({ number: g.number, name: g.name, typeName: selT.name })) : [];
    }, [alertFilterType, types]);

    // Items filtered by current Type, Group, and Code (base scope for counts)
    const scopedAlerts = useMemo(() => {
        return (lowStockAlerts || []).filter((item) => {
            if (alertFilterType !== "all" && item.type_slug !== alertFilterType) {
                return false;
            }
            if (alertFilterGroup !== "all" && String(item.group_number) !== alertFilterGroup) {
                return false;
            }
            if (alertFilterCode.trim()) {
                const query = alertFilterCode.trim().toLowerCase();
                const matchesCode = (item.code || "").toLowerCase().includes(query);
                const matchesPart = (item.part_number || "").toLowerCase().includes(query);
                const matchesConsecutive = (item.consecutive || "").toLowerCase().includes(query);
                const matchesName = (item.name || "").toLowerCase().includes(query);
                if (!matchesCode && !matchesPart && !matchesConsecutive && !matchesName) {
                    return false;
                }
            }
            return true;
        });
    }, [lowStockAlerts, alertFilterType, alertFilterGroup, alertFilterCode]);

    // Dynamic counts reflecting the currently selected Type, Group, and Code
    const alertTotalCount = scopedAlerts.length;
    const alertOutOfStockCount = useMemo(() => scopedAlerts.filter((i) => i.stock <= 0).length, [scopedAlerts]);
    const alertLowStockCount = useMemo(() => scopedAlerts.filter((i) => i.stock > 0 && i.stock <= i.min_stock).length, [scopedAlerts]);

    // Final filtered alerts to display in the table (applying status tab)
    const filteredAlerts = useMemo(() => {
        if (alertFilterStatus === "out_of_stock") {
            return scopedAlerts.filter((i) => i.stock <= 0);
        }
        if (alertFilterStatus === "low_stock") {
            return scopedAlerts.filter((i) => i.stock > 0 && i.stock <= i.min_stock);
        }
        return scopedAlerts;
    }, [scopedAlerts, alertFilterStatus]);

    const allSelected = items.data.length > 0 && items.data.every((i) => selectedIds.includes(i.id));

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(items.data.map((i) => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Form for Create/Edit
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        consecutive: "0001",
        code: "",
        part_number: "",
        name: "",
        description: "",
        type_slug: selectedType && selectedType !== "all" ? selectedType : (types[0]?.slug || "refaccionamiento-equipos-de-envasado"),
        group_number: types.find((t) => t.slug === (selectedType && selectedType !== "all" ? selectedType : types[0]?.slug))?.groups[0]?.number || 101,
        unit: "PZA",
        unit_cost: 0,
        stock: 0,
        min_stock: 5,
        location: "Almacén General",
        is_inventoried: true,
    });

    const [subgroupSearch, setSubgroupSearch] = useState("");

    // Synchronize selectedGroup and selectedType with incoming props/filters
    useEffect(() => {
        setSelectedGroup(filters.group_number || "");
    }, [filters.group_number]);

    useEffect(() => {
        setSelectedType(filters.type || (selectedTypeSlug !== "all" ? selectedTypeSlug : "") || "");
    }, [filters.type, selectedTypeSlug]);

    const activeTypeObj = types.find((t) => t.slug === selectedType);
    const currentTypeGroups = useMemo(() => {
        if (!selectedType) return [];
        if (selectedType === "all") {
            const allG: SupplyGroup[] = [];
            types.forEach((t) => {
                (t.groups || []).forEach((g) => allG.push(g));
            });
            return allG;
        }
        return activeTypeObj?.groups || [];
    }, [selectedType, activeTypeObj, types]);

    const currentGroupObj = useMemo(() => {
        if (!selectedGroup) return null;
        for (const t of types) {
            const found = (t.groups || []).find((g) => String(g.number) === String(selectedGroup));
            if (found) return found;
        }
        return null;
    }, [selectedGroup, types]);

    const availableGroupsForForm = types.find((t) => t.slug === data.type_slug)?.groups || [];

    const getGroupStats = (groupNumber: number) => {
        const groupItems = (allItemsSummary || []).filter(
            (item) => Number(item.group_number) === Number(groupNumber)
        );
        const count = groupItems.length;
        const totalStock = groupItems.reduce((acc, i) => acc + (Number(i.stock) || 0), 0);
        const totalValue = groupItems.reduce((acc, i) => acc + ((Number(i.stock) || 0) * (Number(i.unit_cost) || 0)), 0);
        const outOfStockCount = groupItems.filter((i) => (Number(i.stock) || 0) <= 0).length;
        const lowStockCount = groupItems.filter((i) => (Number(i.stock) || 0) > 0 && (Number(i.stock) || 0) <= (Number(i.min_stock) || 0)).length;
        return { count, totalStock, totalValue, outOfStockCount, lowStockCount };
    };

    const handleSelectGroup = (groupNumber: number | string) => {
        const groupStr = String(groupNumber);
        setSelectedGroup(groupStr);
        handleFilterChange({ group_number: groupStr });
    };

    const handleBackToGroups = () => {
        setSelectedGroup("");
        handleFilterChange({ group_number: undefined });
    };

    // Filter handling
    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        const query = {
            search,
            type: selectedType || undefined,
            group_number: selectedGroup || undefined,
            stock_status: selectedStockStatus || undefined,
            is_inventoried: selectedInventoried || undefined,
            ...newFilters,
        };

        // Remove undefined/empty keys
        Object.keys(query).forEach((key) => {
            if ((query as any)[key] === undefined || (query as any)[key] === "") {
                delete (query as any)[key];
            }
        });

        router.get(route("apt.inventory.products.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSelectType = (slug: string) => {
        setSelectedType(slug);
        setSelectedGroup("");
        setIsDropdownOpen(false);

        const query = {
            search: search || undefined,
            type: slug || undefined,
            stock_status: selectedStockStatus || undefined,
            is_inventoried: selectedInventoried || undefined,
        };

        Object.keys(query).forEach((key) => {
            if ((query as any)[key] === undefined || (query as any)[key] === "") {
                delete (query as any)[key];
            }
        });

        router.get(route("apt.inventory.products.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const generateProductCode = (typeSlug: string, groupNumber: number) => {
        const matchingItems = (allItemsSummary || items?.data || []).filter(
            (i: any) => Number(i.group_number || groupNumber) === Number(groupNumber)
        );

        let maxNum = 0;
        matchingItems.forEach((i: any) => {
            if (i.code) {
                const numStr = String(i.code).replace(/[^0-9]/g, "");
                if (numStr.length >= 4) {
                    const lastPart = parseInt(numStr.slice(-4), 10);
                    if (!isNaN(lastPart) && lastPart > maxNum) {
                        maxNum = lastPart;
                    }
                }
            }
        });

        const nextCount = maxNum + 1;
        return `${groupNumber}${String(nextCount).padStart(4, "0")}`;
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        const defaultType = (selectedType && selectedType !== "all") ? selectedType : (types[0]?.slug || "refaccionamiento-equipos-de-envasado");
        const defaultTypeObj = types.find((t) => t.slug === defaultType);
        const targetGroupNumber = selectedGroup ? Number(selectedGroup) : (defaultTypeObj?.groups[0]?.number || 101);
        const targetGroupObj = defaultTypeObj?.groups.find(g => g.number === targetGroupNumber) || defaultTypeObj?.groups[0];
        const autoCode = generateProductCode(defaultType, targetGroupNumber);
        const autoConsecutive = targetGroupObj?.consecutive || "0001";
        setData({
            consecutive: autoConsecutive,
            code: autoCode,
            part_number: "",
            name: "",
            description: "",
            type_slug: defaultType,
            group_number: targetGroupNumber,
            unit: "PZA",
            unit_cost: 0,
            stock: 0,
            min_stock: 5,
            location: "Almacén General",
            is_inventoried: true,
        });
        setEditingItem(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        clearErrors();
        setEditingItem(item);
        setData({
            consecutive: item.consecutive || "0001",
            code: item.code,
            part_number: item.part_number || "",
            name: item.name,
            description: item.description || "",
            type_slug: item.type_slug,
            group_number: item.group_number,
            unit: item.unit,
            unit_cost: Number(item.unit_cost) || 0,
            stock: Number(item.stock) || 0,
            min_stock: Number(item.min_stock) || 5,
            location: item.location || "",
            is_inventoried: Boolean(item.is_inventoried),
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            put(route("apt.inventory.supply.update", [editingItem.type_slug, editingItem.id]), {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                    Swal.fire({
                        icon: "success",
                        title: "¡Actualizado!",
                        text: "El producto se ha actualizado correctamente.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        } else {
            post(route("apt.inventory.supply.store", data.type_slug), {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    reset();
                    Swal.fire({
                        icon: "success",
                        title: "¡Registrado!",
                        text: "El producto se ha dado de alta exitosamente.",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
            });
        }
    };

    const handleDelete = (item: InventoryItem) => {
        Swal.fire({
            title: "¿Eliminar producto?",
            text: `¿Estás seguro de eliminar "${item.name}"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.inventory.supply.destroy", [item.type_slug, item.id]), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "El producto ha sido eliminado del catálogo.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    // Dynamically calculate metrics based on selectedWarehouse & selectedType
    const summaryList = allItemsSummary && allItemsSummary.length > 0
        ? allItemsSummary
        : (items?.data || []).map((i) => ({
            id: i.id,
            type_slug: i.type_slug,
            stock: Number(i.stock || 0),
            min_stock: Number(i.min_stock || 0),
            unit_cost: Number(i.unit_cost || 0),
            location: i.location || "Almacén General",
        }));

    const warehouseOptions = Array.from(
        new Set([
            "Almacén General",
            ...(locations || []),
            ...summaryList.map((i) => i.location).filter(Boolean),
        ])
    ).filter(Boolean);

    const filteredSummary = summaryList.filter((item) => {
        const matchesType = (selectedType && selectedType !== "all") ? item.type_slug === selectedType : true;
        const matchesGroup = selectedGroup ? String(item.group_number) === String(selectedGroup) : true;
        const matchesWarehouse = selectedWarehouse === "all" ? true : ((item.location || "Almacén General").trim().toLowerCase() === selectedWarehouse.trim().toLowerCase());
        return matchesType && matchesGroup && matchesWarehouse;
    });

    const isAll = selectedType === "all";
    const displayedProductsCount = filteredSummary.length;
    const displayedStockCount = filteredSummary.reduce((acc, curr) => acc + Number(curr.stock || 0), 0);
    const displayedValue = filteredSummary.reduce((acc, curr) => acc + (Number(curr.stock || 0) * Number(curr.unit_cost || 0)), 0);
    const displayedLowStock = filteredSummary.filter((i) => Number(i.stock || 0) > 0 && Number(i.stock || 0) <= Number(i.min_stock || 0)).length;
    const displayedOutOfStock = filteredSummary.filter((i) => Number(i.stock || 0) <= 0).length;

    return (
        <DashboardLayout user={auth?.user} header="Productos de Inventario">
            <Head title="Productos - Gestión de Inventarios" />

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
                        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                            <Boxes className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {isAll ? "TODOS LOS INSUMOS" : activeTypeObj ? activeTypeObj.name : "PRODUCTOS / INSUMOS"}
                                </h1>
                                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-md border border-indigo-200">
                                    {isAll ? "CATÁLOGO GENERAL" : activeTypeObj ? `TIPO ${activeTypeObj.id}` : `${types.length} SUBMÓDULOS`}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                {isAll
                                    ? `Catálogo general unificado de todos los ${types.length} submódulos y grupos de insumos.`
                                    : activeTypeObj
                                    ? `${activeTypeObj.description} (${activeTypeObj.groups.length} grupos configurados)`
                                    : "Selecciona un submódulo de insumo en el menú desplegable para consultar su catálogo y existencias."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href={route("apt.inventory.products.print", {
                                mode: "catalog",
                                type_slug: selectedType && selectedType !== "all" ? selectedType : undefined,
                                search: search || undefined,
                                group_number: selectedGroup || undefined,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-3 rounded-xl shadow-sm text-xs sm:text-sm transition-all"
                            title="Imprimir catálogo de productos en formato oficial"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Imprimir Catálogo</span>
                        </a>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Dar de Alta Producto</span>
                        </button>
                    </div>
                </div>

                {/* Warehouse / Location Dropdown Selector */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 shadow-xs">
                            <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xs font-black text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                                Filtrar Métricas por Almacén / Ubicación:
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                                {selectedWarehouse === "all"
                                    ? "Mostrando valores consolidados de todos los almacenes y bodegas"
                                    : `Mostrando existencias y valuación exclusivas de: ${selectedWarehouse}`}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                            className="w-full sm:w-auto min-w-[260px] bg-slate-50 border border-gray-300 hover:border-indigo-400 focus:border-indigo-600 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-gray-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
                        >
                            <option value="all">🏢 TODOS LOS ALMACENES (GLOBAL)</option>
                            {warehouseOptions.map((wh) => (
                                <option key={wh} value={wh}>
                                    📦 {wh.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Card 1: PRODUCTOS REGISTRADOS */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                PRODUCTOS REGISTRADOS
                            </span>
                            <span className="text-3xl font-black text-gray-900 mt-1 block">
                                {displayedProductsCount}
                            </span>
                            <span className="text-xs text-indigo-600 font-medium mt-1 block truncate max-w-[180px]">
                                {selectedWarehouse !== "all" ? `En ${selectedWarehouse}` : (selectedGroup && currentGroupObj ? `En G${selectedGroup}: ${currentGroupObj.name}` : (isAll ? "Catálogo General" : activeTypeObj ? `En ${activeTypeObj.name}` : "Total en catálogo"))}
                            </span>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Boxes className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: EXISTENCIA TOTAL */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                EXISTENCIA TOTAL
                            </span>
                            <span className="text-3xl font-black text-emerald-600 mt-1 block">
                                {Number(displayedStockCount || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                {displayedStockCount > 0 ? "Unidades disponibles" : "Sin unidades"}
                            </span>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: VALOR DE INVENTARIO */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                VALOR DE INVENTARIO
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
                                ${Number(displayedValue || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Costo total estimado
                            </span>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: ALERTAS DE STOCK - CLICKABLE TO OPEN ALERTS FILTER MENU */}
                    <div
                        onClick={() => {
                            setAlertFilterType(selectedType || "all");
                            setAlertFilterGroup("all");
                            setAlertFilterCode("");
                            setAlertFilterStatus("all");
                            setIsAlertModalOpen(true);
                        }}
                        title="Haz clic para abrir el menú de alertas y filtrar por tipo, grupo y código"
                        className="bg-white rounded-2xl p-5 border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-2 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                                    ALERTAS DE STOCK
                                </span>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                    Ver menú ➜
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-3xl font-black text-amber-600 group-hover:scale-105 transition-transform">
                                    {displayedOutOfStock}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${displayedOutOfStock > 0 ? "bg-red-100 text-red-800" : displayedLowStock > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                    {displayedOutOfStock > 0 ? "Sin stock" : displayedLowStock > 0 ? "Stock bajo" : "Óptimo"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                {displayedLowStock} con stock bajo · <span className="text-amber-700 font-semibold underline decoration-dotted">Clic para filtrar</span>
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 group-hover:bg-amber-100 group-hover:scale-110 rounded-2xl transition-all">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* ELEGANT DROPDOWN MENU FOR SELECTING INSUMOS / SUBMODULES */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6 relative" ref={dropdownRef}>
                    <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-indigo-600" />
                        Seleccionar Submódulo de Insumo (Menú Desplegable):
                    </label>

                    {/* Main Dropdown Button */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between shadow-sm ${
                                isDropdownOpen
                                    ? "border-indigo-600 bg-indigo-50/40 ring-4 ring-indigo-50"
                                    : "border-gray-200 hover:border-indigo-400 bg-white hover:bg-slate-50/50"
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                                    isAll || activeTypeObj ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-100 text-gray-500"
                                }`}>
                                    <Boxes className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-gray-900 text-base sm:text-lg">
                                            {isAll
                                                ? "Todos los Insumos (Catálogo General)"
                                                : activeTypeObj
                                                ? activeTypeObj.name
                                                : "Selecciona un insumo de la lista..."}
                                        </span>
                                        {isAll && (
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                                                {types.length} SUBMÓDULOS
                                            </span>
                                        )}
                                        {activeTypeObj && (
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                TIPO {activeTypeObj.id}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {isAll
                                            ? `Visualizando catálogo consolidado con todos los productos de los ${types.length} tipos de insumos`
                                            : activeTypeObj
                                            ? `${activeTypeObj.description} • ${activeTypeObj.groups.length} grupos configurados`
                                            : `Haz clic aquí para desplegar la lista de los ${types.length} submódulos disponibles`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {(isAll || activeTypeObj) && (
                                    <div className="hidden sm:flex flex-col items-end text-right pr-2">
                                        <span className="text-xs font-bold text-gray-900">
                                            {isAll ? metrics.total_products : activeTypeObj?.total_items} productos
                                        </span>
                                        <span className="text-[11px] text-gray-500">
                                            {Number(isAll ? metrics.total_stock : activeTypeObj?.total_stock).toLocaleString()} unidades
                                        </span>
                                    </div>
                                )}
                                <div className={`p-2 rounded-xl bg-gray-100 text-gray-600 transition-transform duration-200 ${
                                    isDropdownOpen ? "rotate-180 bg-indigo-100 text-indigo-600" : ""
                                }`}>
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </button>

                        {/* Dropdown Menu Floating List */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                                <div className="p-3 bg-slate-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Lista de Submódulos de Insumos ({types.length} Tipos):</span>
                                    <button
                                        onClick={() => handleSelectType("all")}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold capitalize underline"
                                    >
                                        Ver Catálogo Completo (Todos)
                                    </button>
                                </div>

                                {/* Option: All */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectType("all")}
                                    className={`w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                        selectedType === "all" ? "bg-indigo-50/80 font-semibold" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                            selectedType === "all" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-800 text-white"
                                        }`}>
                                            ALL
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                Todos los Insumos (Catálogo General)
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Visualizar todos los productos de todos los {types.length} submódulos
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {metrics.total_products} productos
                                        </span>
                                        {selectedType === "all" && (
                                            <Check className="w-5 h-5 text-indigo-600" />
                                        )}
                                    </div>
                                </button>

                                {/* 9 Insumo Types */}
                                {types.map((type) => {
                                    const isSelected = selectedType === type.slug;
                                    return (
                                        <button
                                            key={type.slug}
                                            type="button"
                                            onClick={() => handleSelectType(type.slug)}
                                            className={`w-full text-left p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group ${
                                                isSelected ? "bg-indigo-50/80 font-semibold" : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                                    isSelected
                                                        ? "bg-indigo-600 text-white shadow-sm"
                                                        : "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100"
                                                }`}>
                                                    {type.id}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                        <span>{type.name}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-gray-100 text-gray-600">
                                                            {type.groups.length} grupos
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                        {type.description}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                                <div className="text-right hidden sm:block">
                                                    <span className="text-xs font-bold text-gray-900 block">
                                                        {type.total_items} productos
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 block">
                                                        {Number(type.total_stock).toLocaleString()} stock
                                                    </span>
                                                </div>
                                                {isSelected ? (
                                                    <div className="p-1 rounded-full bg-indigo-600 text-white">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* SHOW TABLE ONLY ONCE AN INSUMO IS SELECTED */}
                {!selectedType ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 sm:p-16 text-center shadow-sm mb-6 animate-fadeIn">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                            <Boxes className="w-10 h-10 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Ningún Insumo Seleccionado
                        </h3>
                        <p className="text-sm text-gray-500 max-w-lg mx-auto mt-1.5 mb-6">
                            Para visualizar la tabla de productos, existencias y costos, por favor despliega el menú superior y selecciona alguno de los {types.length} submódulos de insumos configurados.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                        >
                            <ListFilter className="w-4 h-4" />
                            <span>Seleccionar Insumo del Menú</span>
                        </button>
                    </div>
                ) : !selectedGroup ? (
                    /* PASO 2: SELECCIÓN DE SUBGRUPO (Tarjetas de Subgrupos) */
                    <div className="space-y-6 animate-fadeIn">
                        {/* Subgroups Step Header Banner */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
                                    <FolderKanban className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                                            Paso 2: Selección de Subgrupo
                                        </span>
                                        <span className="text-xs text-gray-500 font-bold">
                                            {currentTypeGroups.length} {currentTypeGroups.length === 1 ? "subgrupo configurado" : "subgrupos configurados"}
                                        </span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
                                        {isAll ? "Todos los Subgrupos del Catálogo" : `Subgrupos de ${activeTypeObj?.name}`}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                        Elige a continuación el subgrupo de insumos que deseas consultar para ver sus productos y existencias.
                                    </p>
                                </div>
                            </div>

                            {/* Buscador Rápido de Subgrupos */}
                            {currentTypeGroups.length > 3 && (
                                <div className="relative min-w-[260px] sm:min-w-[320px]">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={subgroupSearch}
                                        onChange={(e) => setSubgroupSearch(e.target.value)}
                                        placeholder="Filtrar subgrupo por nombre o clave..."
                                        className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-800"
                                    />
                                    {subgroupSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setSubgroupSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded cursor-pointer"
                                        >
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tabla de Subgrupos */}
                        {isAll ? (
                            types.map((typeCategory) => {
                                const groupsInCat = (typeCategory.groups || []).filter((g) => {
                                    if (!subgroupSearch.trim()) return true;
                                    const q = subgroupSearch.trim().toLowerCase();
                                    return (
                                        g.name.toLowerCase().includes(q) ||
                                        String(g.number).includes(q) ||
                                        (g.code && g.code.toLowerCase().includes(q)) ||
                                        (g.consecutive && g.consecutive.toLowerCase().includes(q))
                                    );
                                });

                                if (groupsInCat.length === 0) return null;

                                return (
                                    <div key={typeCategory.slug} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                        <div className="p-4 sm:p-5 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                                    {typeCategory.id}
                                                </span>
                                                <div>
                                                    <h4 className="font-extrabold text-gray-900 text-base">
                                                        Tipo {typeCategory.id}: {typeCategory.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        {typeCategory.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-2xs">
                                                {groupsInCat.length} subgrupos
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[#1e1b4b] text-white text-[11px] uppercase tracking-wider font-extrabold">
                                                        <th className="py-4 px-4 text-center w-28">GRUPO</th>
                                                        <th className="py-4 px-4 text-center w-32">CÓDIGO BASE</th>
                                                        <th className="py-4 px-4">NOMBRE DEL SUBGRUPO</th>
                                                        <th className="py-4 px-4 text-center">CONSECUTIVO BASE</th>
                                                        <th className="py-4 px-4 text-center">TOTAL INSUMOS</th>
                                                        <th className="py-4 px-4 text-center">STOCK EN ALMACÉN</th>
                                                        <th className="py-4 px-4 text-center">ESTATUS DE STOCK</th>
                                                        <th className="py-4 px-4 text-center w-40">ACCIÓN</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-xs">
                                                    {groupsInCat.map((group) => {
                                                        const stats = getGroupStats(group.number);
                                                        return (
                                                            <tr
                                                                key={group.number}
                                                                onClick={() => handleSelectGroup(group.number)}
                                                                className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                                            >
                                                                <td className="py-4 px-4 text-center">
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-black text-xs border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                        G{group.number}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-4 text-center font-mono font-bold text-gray-800">
                                                                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                                                                        {group.code || `${group.number}0001`}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-4">
                                                                    <div className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                                                                        {group.name}
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    <span className="font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                                                                        #{group.consecutive || "0001"}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    <span className="text-sm font-black text-gray-900">{stats.count}</span>
                                                                    <span className="text-xs text-gray-500 font-medium ml-1">
                                                                        {stats.count === 1 ? "producto" : "productos"}
                                                                    </span>
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    <span className="text-sm font-black text-emerald-600">
                                                                        {Number(stats.totalStock).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 font-medium ml-1">u.</span>
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    {stats.outOfStockCount > 0 ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
                                                                            <span>🔴</span> {stats.outOfStockCount} sin stock
                                                                        </span>
                                                                    ) : stats.lowStockCount > 0 ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                            <span>🟡</span> {stats.lowStockCount} stock bajo
                                                                        </span>
                                                                    ) : stats.count > 0 ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                            <span>🟢</span> Existencias óptimas
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                                            ⚪ Sin productos
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-4 px-4 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSelectGroup(group.number);
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer group/btn"
                                                                        title={`Ir a los insumos de ${group.name}`}
                                                                    >
                                                                        <span>Ver Insumos</span>
                                                                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#1e1b4b] text-white text-[11px] uppercase tracking-wider font-extrabold">
                                                <th className="py-4 px-4 text-center w-28">GRUPO</th>
                                                <th className="py-4 px-4 text-center w-32">CÓDIGO BASE</th>
                                                <th className="py-4 px-4">NOMBRE DEL SUBGRUPO</th>
                                                <th className="py-4 px-4 text-center">CONSECUTIVO BASE</th>
                                                <th className="py-4 px-4 text-center">TOTAL INSUMOS</th>
                                                <th className="py-4 px-4 text-center">STOCK EN ALMACÉN</th>
                                                <th className="py-4 px-4 text-center">ESTATUS DE STOCK</th>
                                                <th className="py-4 px-4 text-center w-40">ACCIÓN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            {currentTypeGroups
                                                .filter((g) => {
                                                    if (!subgroupSearch.trim()) return true;
                                                    const q = subgroupSearch.trim().toLowerCase();
                                                    return (
                                                        g.name.toLowerCase().includes(q) ||
                                                        String(g.number).includes(q) ||
                                                        (g.code && g.code.toLowerCase().includes(q)) ||
                                                        (g.consecutive && g.consecutive.toLowerCase().includes(q))
                                                    );
                                                })
                                                .map((group) => {
                                                    const stats = getGroupStats(group.number);
                                                    return (
                                                        <tr
                                                            key={group.number}
                                                            onClick={() => handleSelectGroup(group.number)}
                                                            className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-black text-xs border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                    G{group.number}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center font-mono font-bold text-gray-800">
                                                                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                                                                    {group.code || `${group.number}0001`}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                                                                    {group.name}
                                                                </div>
                                                                <div className="text-[11px] text-gray-400 font-medium">
                                                                    {activeTypeObj?.name}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="font-mono font-bold text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                                                                    #{group.consecutive || "0001"}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="text-sm font-black text-gray-900">{stats.count}</span>
                                                                <span className="text-xs text-gray-500 font-medium ml-1">
                                                                    {stats.count === 1 ? "producto" : "productos"}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="text-sm font-black text-emerald-600">
                                                                    {Number(stats.totalStock).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                                                                </span>
                                                                <span className="text-xs text-gray-500 font-medium ml-1">u.</span>
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                {stats.outOfStockCount > 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
                                                                        <span>🔴</span> {stats.outOfStockCount} {stats.outOfStockCount === 1 ? "sin stock" : "sin stock"}
                                                                    </span>
                                                                ) : stats.lowStockCount > 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                        <span>🟡</span> {stats.lowStockCount} con stock bajo
                                                                    </span>
                                                                ) : stats.count > 0 ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                        <span>🟢</span> Existencias óptimas
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                                        ⚪ Sin productos registrados
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectGroup(group.number);
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer group/btn"
                                                                    title={`Ir a los insumos de ${group.name}`}
                                                                >
                                                                    <span>Ver Insumos</span>
                                                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* PASO 3: TABLA DE INSUMOS DEL SUBGRUPO SELECCIONADO */
                    <div className="animate-fadeIn">
                        {/* Subgroup Navigation Bar */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn">
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    type="button"
                                    onClick={handleBackToGroups}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm rounded-xl border border-indigo-200 transition-all hover:-translate-x-0.5 cursor-pointer shadow-xs"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Volver a Subgrupos de {activeTypeObj?.name || "este Tipo"}</span>
                                </button>

                                <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
                                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                                        G{selectedGroup}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-gray-900 text-sm sm:text-base">
                                                {currentGroupObj?.name || `Subgrupo G${selectedGroup}`}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                SUBGRUPO ACTIVO
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 block">
                                            Consecutivo #{currentGroupObj?.consecutive || "0001"} · Clave Base: {currentGroupObj?.code || selectedGroup + "0001"} · {items.total} {items.total === 1 ? "insumo registrado" : "insumos registrados"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Subgroup Switcher */}
                            <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs font-bold text-gray-500 whitespace-nowrap hidden sm:inline">
                                    Cambiar Subgrupo:
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => {
                                        if (!e.target.value) {
                                            handleBackToGroups();
                                        } else {
                                            handleSelectGroup(e.target.value);
                                        }
                                    }}
                                    className="py-2 px-3 bg-slate-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                                >
                                    <option value="">📁 ← Volver a ver todos los subgrupos</option>
                                    {currentTypeGroups.map((g) => (
                                        <option key={g.number} value={g.number}>
                                            G{g.number}: {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Filter and Search Bar for the selected Insumo */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                                {/* Search Input */}
                                <div className="lg:col-span-5 relative">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleFilterChange({ search })}
                                        placeholder={`Buscar en ${currentGroupObj ? currentGroupObj.name : "este subgrupo"} por nombre o clave...`}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>

                                {/* Group Filter (Filtered to this Insumo's groups) */}
                                <div className="lg:col-span-3">
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => {
                                            if (!e.target.value) {
                                                handleBackToGroups();
                                            } else {
                                                handleSelectGroup(e.target.value);
                                            }
                                        }}
                                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-700 font-medium"
                                    >
                                        <option value="">📁 ← Volver a Subgrupos</option>
                                        {currentTypeGroups.map((g) => (
                                            <option key={g.number} value={g.number}>
                                                G{g.number}: {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Stock Filter */}
                                <div className="lg:col-span-2">
                                    <select
                                        value={selectedStockStatus}
                                        onChange={(e) => {
                                            setSelectedStockStatus(e.target.value);
                                            handleFilterChange({ stock_status: e.target.value || undefined });
                                        }}
                                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-700 font-medium"
                                    >
                                        <option value="">EXISTENCIA: TODAS</option>
                                        <option value="in_stock">Con Existencia (&gt; 0)</option>
                                        <option value="low_stock">Stock Bajo (≤ Mínimo)</option>
                                        <option value="out_of_stock">Sin Existencia (= 0)</option>
                                    </select>
                                </div>

                                {/* Inventoried Filter */}
                                <div className="lg:col-span-2">
                                    <select
                                        value={selectedInventoried}
                                        onChange={(e) => {
                                            setSelectedInventoried(e.target.value);
                                            handleFilterChange({ is_inventoried: e.target.value || undefined });
                                        }}
                                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-700 font-medium"
                                    >
                                        <option value="">CONTROL: TODOS</option>
                                        <option value="1">Inventariado</option>
                                        <option value="0">No inventariado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Batch Selection Action Bar */}
                        {selectedIds.length > 0 && (
                            <div className="bg-indigo-50 border border-indigo-300 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-2.5 text-indigo-950 font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                    <span>
                                        {selectedIds.length} {selectedIds.length === 1 ? "producto seleccionado" : "productos seleccionados para impresión"}
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
                                        href={route("apt.inventory.products.print", { ids: selectedIds.join(","), mode: "inventory" })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-200 transition-all hover:scale-105 cursor-pointer"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Imprimir Seleccionados ({selectedIds.length})</span>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Main Table for the Selected Insumo */}
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
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                                    title="Seleccionar todos los productos de la página"
                                                />
                                            </th>
                                            <th className="py-4 px-3 text-center">CONSECUTIVO</th>
                                            <th className="py-4 px-3 text-center">CÓDIGO</th>
                                            <th className="py-4 px-3 text-center">N. DE PARTE</th>
                                            <th className="py-4 px-4">PRODUCTO / INSUMO</th>
                                            <th className="py-4 px-4">GRUPO DE INSUMO</th>
                                            <th className="py-4 px-3 text-center">UNIDAD</th>
                                            <th className="py-4 px-4 text-center">EXISTENCIA (STOCK)</th>
                                            <th className="py-4 px-4 text-right">COSTO / VALOR</th>
                                            <th className="py-4 px-4 text-center">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                                        {items.data.length > 0 ? (
                                            items.data.map((item) => {
                                                const isLowStock = Number(item.stock) > 0 && Number(item.stock) <= Number(item.min_stock);
                                                const isOutOfStock = Number(item.stock) <= 0;
                                                const isSelected = selectedIds.includes(item.id);

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={`transition-colors group ${isSelected ? "bg-indigo-50/60 hover:bg-indigo-50" : "hover:bg-slate-50/80"}`}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="py-4 px-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleToggleRow(item.id)}
                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                                                            />
                                                        </td>

                                                        {/* Consecutivo */}
                                                        <td className="py-4 px-3 text-center font-mono font-bold">
                                                            <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs border border-amber-200">
                                                                {item.consecutive || "0001"}
                                                            </span>
                                                        </td>

                                                        {/* Clave / Código */}
                                                        <td className="py-4 px-3 text-center font-mono font-bold text-gray-800">
                                                            <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs border border-gray-200">
                                                                {item.code}
                                                            </span>
                                                        </td>

                                                        {/* N. DE PARTE */}
                                                        <td className="py-4 px-3 text-center font-mono text-xs">
                                                            {item.part_number ? (
                                                                <span className="bg-sky-50 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
                                                                    {item.part_number}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 font-mono text-xs">—</span>
                                                            )}
                                                        </td>

                                                        {/* Producto / Insumo */}
                                                        <td className="py-4 px-4">
                                                            <div className="font-bold text-gray-900 text-sm">
                                                                {item.name}
                                                            </div>
                                                            {item.description && (
                                                                <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Grupo de Insumo */}
                                                        <td className="py-4 px-4">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
                                                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                                                <span>
                                                                    G{item.group_number}: {item.group_name}
                                                                </span>
                                                            </span>
                                                        </td>

                                                        {/* Unidad */}
                                                        <td className="py-4 px-3 text-center">
                                                            <span className="font-bold text-gray-700 text-xs uppercase bg-slate-100 px-2 py-0.5 rounded">
                                                                {item.unit}
                                                            </span>
                                                        </td>

                                                        {/* Existencia (Stock) */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="font-extrabold text-gray-900 text-base">
                                                                {Number(item.stock).toLocaleString("es-MX", { maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-[11px] mt-0.5">
                                                                {isOutOfStock ? (
                                                                    <span className="text-red-500 font-semibold">Sin stock</span>
                                                                ) : isLowStock ? (
                                                                    <span className="text-amber-500 font-semibold">Stock bajo</span>
                                                                ) : (
                                                                    <span className="text-emerald-600 font-semibold">Disponible</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Costo / Valor */}
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="font-bold text-gray-900 text-sm">
                                                                ${Number(item.unit_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                                Tot: ${(Number(item.stock || 0) * Number(item.unit_cost || 0)).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </td>

                                                        {/* Acciones */}
                                                        <td className="py-4 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => openEditModal(item)}
                                                                    title="Editar Producto"
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item)}
                                                                    title="Eliminar Producto"
                                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="text-center py-12 text-gray-500">
                                                    <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        No se encontraron productos registrados en el subgrupo {currentGroupObj ? `G${selectedGroup}: ${currentGroupObj.name}` : `G${selectedGroup}`}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Intenta ajustar los filtros de búsqueda o da de alta un nuevo insumo en este subgrupo.
                                                    </p>
                                                    <button
                                                        onClick={openCreateModal}
                                                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
                                                    >
                                                        + Dar de alta producto en este subgrupo ahora
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {items.links && items.links.length > 3 && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        Mostrando <span className="font-bold">{items.from || 0}</span> a{" "}
                                        <span className="font-bold">{items.to || 0}</span> de{" "}
                                        <span className="font-bold">{items.total}</span> productos
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {items.links.map((link, idx) => (
                                            <button
                                                key={idx}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                                                    link.active
                                                        ? "bg-indigo-600 text-white font-bold"
                                                        : link.url
                                                        ? "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                        : "text-gray-300 cursor-not-allowed"
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE ALERTAS DE STOCK CON FILTRADO POR TIPO, GRUPO Y CÓDIGO */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-start justify-between relative shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
                                    <AlertTriangle className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg sm:text-xl font-black">
                                            Centro de Alertas de Stock
                                        </h3>
                                        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-100 backdrop-blur-xs">
                                            {alertTotalCount} {alertTotalCount === 1 ? "Insumo" : "Insumos"}
                                        </span>
                                    </div>
                                    <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
                                        Filtra por Tipo, Grupo y Código los insumos que requieren reabastecimiento urgente.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAlertModalOpen(false)}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filter Bar: Tipo, Grupo, Código y Estatus de Alerta */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-b border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                {/* Filtro por Tipo */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        1. Filtrar por Tipo / Submódulo
                                    </label>
                                    <select
                                        value={alertFilterType}
                                        onChange={(e) => {
                                            setAlertFilterType(e.target.value);
                                            setAlertFilterGroup("all");
                                        }}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="all">📦 TODOS LOS TIPOS (GLOBAL)</option>
                                        {types.map((t) => (
                                            <option key={t.slug} value={t.slug}>
                                                Tipo {t.id}: {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por Grupo */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        2. Filtrar por Grupo
                                    </label>
                                    <select
                                        value={alertFilterGroup}
                                        onChange={(e) => setAlertFilterGroup(e.target.value)}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="all">📁 TODOS LOS GRUPOS</option>
                                        {alertModalGroups.map((g) => (
                                            <option key={`${g.number}-${g.name}`} value={String(g.number)}>
                                                G{g.number}: {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por Código / Nombre */}
                                <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                        3. Buscar Código, Parte o Nombre
                                    </label>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={alertFilterCode}
                                            onChange={(e) => setAlertFilterCode(e.target.value)}
                                            placeholder="Ej. 1010001, CS-001..."
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sub-bar: Status Tabs & Result count */}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                <div className="flex items-center gap-1.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("all")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors ${alertFilterStatus === "all" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        Todas las Alertas ({alertTotalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("out_of_stock")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors ${alertFilterStatus === "out_of_stock" ? "bg-red-600 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        🔴 Sin Stock ({alertOutOfStockCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAlertFilterStatus("low_stock")}
                                        className={`px-3 py-1 rounded-lg font-bold transition-colors ${alertFilterStatus === "low_stock" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                                    >
                                        🟡 Stock Bajo ({alertLowStockCount})
                                    </button>
                                </div>

                                {(alertFilterType !== "all" || alertFilterGroup !== "all" || alertFilterCode.trim() !== "" || alertFilterStatus !== "all") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAlertFilterType("all");
                                            setAlertFilterGroup("all");
                                            setAlertFilterCode("");
                                            setAlertFilterStatus("all");
                                        }}
                                        className="text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Body / Table of Low Stock Items */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            {filteredAlerts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                                                <th className="py-2.5 px-3 text-center">CÓDIGO</th>
                                                <th className="py-2.5 px-3">PRODUCTO / INSUMO</th>
                                                <th className="py-2.5 px-3">SUBMÓDULO & GRUPO</th>
                                                <th className="py-2.5 px-3 text-center">EXISTENCIA ACTUAL</th>
                                                <th className="py-2.5 px-3 text-center">STOCK MÍNIMO</th>
                                                <th className="py-2.5 px-3 text-center">ESTADO / DÉFICIT</th>
                                                <th className="py-2.5 px-3 text-center">ACCIÓN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs">
                                            {filteredAlerts.map((alertItem) => {
                                                const isOut = alertItem.stock <= 0;
                                                return (
                                                    <tr key={alertItem.id} className="hover:bg-amber-50/50 transition-colors">
                                                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-900">
                                                            <div className="bg-slate-100 px-2 py-0.5 rounded text-xs inline-block">
                                                                {alertItem.code}
                                                            </div>
                                                            {alertItem.part_number && (
                                                                <div className="text-[10px] text-sky-700 font-medium mt-0.5">
                                                                    N/P: {alertItem.part_number}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="font-bold text-gray-900">
                                                                {alertItem.name}
                                                            </div>
                                                            {alertItem.consecutive && (
                                                                <div className="text-[10px] text-gray-400">
                                                                    Consecutivo: #{alertItem.consecutive}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="text-[10px] font-extrabold text-indigo-700 uppercase">
                                                                {alertItem.type_name}
                                                            </div>
                                                            <div className="text-[11px] text-gray-600 font-semibold">
                                                                G{alertItem.group_number}: {alertItem.group_name}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <span className={`font-black text-sm ${isOut ? "text-red-600" : "text-amber-600"}`}>
                                                                {alertItem.stock} {alertItem.unit}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <span className="font-bold text-gray-700 text-xs">
                                                                {alertItem.min_stock} {alertItem.unit}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            {isOut ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-800 border border-red-200">
                                                                    🔴 Sin Stock
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                    🟡 Faltan {alertItem.deficit} {alertItem.unit}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsAlertModalOpen(false);
                                                                    handleFilterChange({
                                                                        type: alertItem.type_slug,
                                                                        group_number: String(alertItem.group_number),
                                                                        search: alertItem.code,
                                                                    });
                                                                }}
                                                                title="Ver producto en la tabla principal"
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl font-bold text-xs transition-colors shadow-xs cursor-pointer"
                                                            >
                                                                <span>Ir a Tabla</span>
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-gray-800">
                                        No se encontraron insumos con alerta bajo los filtros seleccionados
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Todos los insumos correspondientes a estos criterios cuentan con existencias superiores al stock mínimo.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Mostrando <strong>{filteredAlerts.length}</strong> de <strong>{alertTotalCount}</strong> insumos en alerta
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAlertModalOpen(false);
                                        handleFilterChange({ stock_status: "low_stock" });
                                    }}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                                >
                                    Ver todos en tabla principal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAlertModalOpen(false)}
                                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                                >
                                    Cerrar Menú
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Create/Edit Product */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <PackagePlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingItem ? "Editar Producto / Insumo" : "Dar de Alta Nuevo Producto"}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Completa la información técnica, clasificación por grupo y existencias.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Classification Type & Group */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Tipo *
                                    </label>
                                    <select
                                        value={data.type_slug}
                                        onChange={(e) => {
                                            const newTypeSlug = e.target.value;
                                            const targetTypeObj = types.find((t) => t.slug === newTypeSlug);
                                            const firstGroupObj = targetTypeObj?.groups[0];
                                            const firstGroup = firstGroupObj?.number || 101;
                                            const autoCode = generateProductCode(newTypeSlug, firstGroup);
                                            const autoConsecutive = firstGroupObj?.consecutive || "0001";
                                            setData({
                                                ...data,
                                                type_slug: newTypeSlug,
                                                group_number: firstGroup,
                                                consecutive: autoConsecutive,
                                                code: autoCode,
                                            });
                                        }}
                                        disabled={Boolean(editingItem)}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-semibold"
                                    >
                                        {types.map((t) => (
                                            <option key={t.slug} value={t.slug}>
                                                {t.id}. {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type_slug && <p className="text-red-500 text-xs mt-1">{errors.type_slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Grupo de Insumo *
                                    </label>
                                    <select
                                        value={data.group_number}
                                        onChange={(e) => {
                                            const newGroupNum = Number(e.target.value);
                                            const selGroup = availableGroupsForForm.find((g) => g.number === newGroupNum);
                                            const autoCode = generateProductCode(data.type_slug, newGroupNum);
                                            const autoConsecutive = selGroup?.consecutive || "0001";
                                            setData({
                                                ...data,
                                                group_number: newGroupNum,
                                                consecutive: autoConsecutive,
                                                code: autoCode,
                                            });
                                        }}
                                        disabled={Boolean(editingItem)}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-semibold"
                                    >
                                        {availableGroupsForForm.map((g) => (
                                            <option key={g.number} value={g.number}>
                                                {g.number}: {g.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.group_number && <p className="text-red-500 text-xs mt-1">{errors.group_number}</p>}
                                </div>
                            </div>

                            {/* Consecutive, Code, Part Number and Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 whitespace-nowrap">
                                        Consecutivo
                                    </label>
                                    <input
                                        type="text"
                                        value={data.consecutive}
                                        onChange={(e) => setData("consecutive", e.target.value)}
                                        placeholder="0001"
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.consecutive && <p className="text-red-500 text-xs mt-1">{errors.consecutive}</p>}
                                </div>

                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 whitespace-nowrap">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData("code", e.target.value)}
                                        placeholder="1010001"
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                                </div>

                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 whitespace-nowrap">
                                        N. de Parte
                                    </label>
                                    <input
                                        type="text"
                                        value={data.part_number}
                                        onChange={(e) => setData("part_number", e.target.value)}
                                        placeholder="Ej. CS-001"
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.part_number && <p className="text-red-500 text-xs mt-1">{errors.part_number}</p>}
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Nombre del Producto / Insumo *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="Ej. Banda de transmision A-32"
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Descripción Detallada
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    rows={2}
                                    placeholder="Especificaciones técnicas, medidas, presentación..."
                                    className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            {/* Unit, Cost, Stock, Min Stock */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Unidad *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.unit}
                                        onChange={(e) => setData("unit", e.target.value.toUpperCase())}
                                        placeholder="PZA, KG, M, TON..."
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Costo Unitario ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.unit_cost}
                                        onChange={(e) => setData("unit_cost", Number(e.target.value))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.unit_cost && <p className="text-red-500 text-xs mt-1">{errors.unit_cost}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Existencia Inicial
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.stock}
                                        onChange={(e) => setData("stock", Number(e.target.value))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-emerald-600"
                                    />
                                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Stock Mínimo
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.min_stock}
                                        onChange={(e) => setData("min_stock", Number(e.target.value))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-amber-600"
                                    />
                                    {errors.min_stock && <p className="text-red-500 text-xs mt-1">{errors.min_stock}</p>}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
                                >
                                    {processing ? "Guardando..." : editingItem ? "Guardar Cambios" : "Dar de Alta Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
