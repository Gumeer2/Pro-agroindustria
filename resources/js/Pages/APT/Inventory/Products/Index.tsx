import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface SupplyGroup {
    number: number;
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
    code: string;
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

interface Props {
    auth: any;
    items: PaginatedData<InventoryItem>;
    metrics: Metrics;
    locations?: string[];
    allItemsSummary?: {
        id: number;
        type_slug: string;
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
        code: "",
        name: "",
        description: "",
        type_slug: selectedType || types[0]?.slug || "materiales",
        group_number: types.find((t) => t.slug === (selectedType || types[0]?.slug))?.groups[0]?.number || 1,
        unit: "PZA",
        unit_cost: 0,
        stock: 0,
        min_stock: 5,
        location: "Almacén General",
        is_inventoried: true,
    });

    const activeTypeObj = types.find((t) => t.slug === selectedType);
    const currentTypeGroups = activeTypeObj?.groups || [];
    const availableGroupsForForm = types.find((t) => t.slug === data.type_slug)?.groups || [];

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
        const typeObj = types.find((t) => t.slug === typeSlug);
        const typeId = typeObj?.id || 1;
        const typePad = String(typeId).padStart(2, "0");
        const groupPad = String(groupNumber).padStart(2, "0");
        const prefix = `${typePad}-${groupPad}`;

        const matchingItems = (allItemsSummary || items?.data || []).filter(
            (i: any) => (i.type_slug === typeSlug || Number(i.type_id) === Number(typeId)) && Number(i.group_number || groupNumber) === Number(groupNumber)
        );

        let maxNum = matchingItems.length;
        matchingItems.forEach((i: any) => {
            if (i.code) {
                const parts = i.code.split("-");
                const lastPart = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastPart) && lastPart > maxNum) {
                    maxNum = lastPart;
                }
            }
        });

        const nextCount = maxNum + 1;
        return `${prefix}-${String(nextCount).padStart(4, "0")}`;
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        const defaultType = (selectedType && selectedType !== "all") ? selectedType : (types[0]?.slug || "materiales");
        const defaultGroup = types.find((t) => t.slug === defaultType)?.groups[0]?.number || 1;
        const autoCode = generateProductCode(defaultType, defaultGroup);
        setData({
            code: autoCode,
            name: "",
            description: "",
            type_slug: defaultType,
            group_number: defaultGroup,
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
            code: item.code,
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
        const matchesWarehouse = selectedWarehouse === "all" ? true : ((item.location || "Almacén General").trim().toLowerCase() === selectedWarehouse.trim().toLowerCase());
        return matchesType && matchesWarehouse;
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
                        href={route("apt.inventory.index")}
                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver a Gestión de Inventarios
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
                                    {isAll ? "CATÁLOGO GENERAL" : activeTypeObj ? `TIPO ${activeTypeObj.id}` : "9 SUBMÓDULOS"}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                                {isAll
                                    ? "Catálogo general unificado de todos los 9 submódulos y grupos de insumos."
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
                                {selectedWarehouse !== "all" ? `En ${selectedWarehouse}` : (isAll ? "Catálogo General" : activeTypeObj ? `En ${activeTypeObj.name}` : "Total en catálogo")}
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

                    {/* Card 4: ALERTAS DE STOCK */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                ALERTAS DE STOCK
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-3xl font-black text-amber-600">
                                    {displayedOutOfStock}
                                </span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${displayedOutOfStock > 0 ? "bg-red-100 text-red-800" : displayedLowStock > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                                    {displayedOutOfStock > 0 ? "Sin stock" : displayedLowStock > 0 ? "Stock bajo" : "Óptimo"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                {displayedLowStock} con stock bajo
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
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
                                                9 SUBMÓDULOS
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
                                            ? "Visualizando catálogo consolidado con todos los productos de los 9 tipos de insumos"
                                            : activeTypeObj
                                            ? `${activeTypeObj.description} • ${activeTypeObj.groups.length} grupos configurados`
                                            : "Haz clic aquí para desplegar la lista de los 9 submódulos disponibles"}
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
                                    <span>Lista de Submódulos de Insumos (9 Tipos):</span>
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
                                                Visualizar todos los productos de todos los 9 submódulos
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
                            Para visualizar la tabla de productos, existencias y costos, por favor despliega el menú superior y selecciona alguno de los 9 submódulos de insumos configurados.
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
                ) : (
                    <div className="animate-fadeIn">
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
                                        placeholder={`Buscar en ${activeTypeObj ? activeTypeObj.name : "todos los insumos"} por nombre, clave o ubicación...`}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>

                                {/* Group Filter (Filtered to this Insumo's groups) */}
                                <div className="lg:col-span-3">
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => {
                                            setSelectedGroup(e.target.value);
                                            handleFilterChange({ group_number: e.target.value || undefined });
                                        }}
                                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-gray-700 font-medium"
                                    >
                                        <option value="">
                                            {currentTypeGroups.length > 0
                                                ? `TODOS LOS GRUPOS (${currentTypeGroups.length})`
                                                : "TODOS LOS GRUPOS"}
                                        </option>
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
                                            <th className="py-4 px-4 text-center">CLAVE / CÓDIGO</th>
                                            <th className="py-4 px-4">PRODUCTO / INSUMO</th>
                                            <th className="py-4 px-4">GRUPO DE INSUMO</th>
                                            <th className="py-4 px-3 text-center">UNIDAD</th>
                                            <th className="py-4 px-4 text-center">EXISTENCIA (STOCK)</th>
                                            <th className="py-4 px-4 text-right">COSTO / VALOR</th>
                                            <th className="py-4 px-4">UBICACIÓN</th>
                                            <th className="py-4 px-3 text-center">ESTATUS</th>
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

                                                        {/* Clave / Código */}
                                                        <td className="py-4 px-4 text-center font-mono font-bold text-gray-700">
                                                            <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs border border-gray-200">
                                                                {item.code}
                                                            </span>
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

                                                        {/* Grupo de Insumo - CLICKABLE PILL TO DEDICATED GROUP INTERFACE */}
                                                        <td className="py-4 px-4">
                                                            <Link
                                                                href={route("apt.inventory.products.group", [item.type_slug, item.group_number])}
                                                                title={`Ver tabla exclusiva del grupo ${item.group_name}`}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 transition-all hover:scale-105 shadow-sm group/btn"
                                                            >
                                                                <span className="w-2 h-2 rounded-full bg-indigo-600 group-hover/btn:animate-ping" />
                                                                <span>
                                                                    G{item.group_number}: {item.group_name}
                                                                </span>
                                                                <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
                                                            </Link>
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

                                                        {/* Ubicación */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                                                                <Warehouse className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                <span>{item.location || "Almacén General"}</span>
                                                            </div>
                                                        </td>

                                                        {/* Estatus */}
                                                        <td className="py-4 px-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                item.is_inventoried
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                                            }`}>
                                                                {item.is_inventoried ? "Inventariado" : "No Inventariado"}
                                                            </span>
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
                                                    <p className="text-sm font-semibold">
                                                        No se encontraron productos registrados en {activeTypeObj ? activeTypeObj.name : "este submódulo"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Intenta ajustar los filtros de búsqueda o da de alta un nuevo producto.
                                                    </p>
                                                    <button
                                                        onClick={openCreateModal}
                                                        className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        + Dar de alta producto ahora
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
                                            const firstGroup = types.find((t) => t.slug === newTypeSlug)?.groups[0]?.number || 1;
                                            const autoCode = generateProductCode(newTypeSlug, firstGroup);
                                            setData({
                                                ...data,
                                                type_slug: newTypeSlug,
                                                group_number: firstGroup,
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
                                            const autoCode = generateProductCode(data.type_slug, newGroupNum);
                                            setData({
                                                ...data,
                                                group_number: newGroupNum,
                                                code: autoCode,
                                            });
                                        }}
                                        disabled={Boolean(editingItem)}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-semibold"
                                    >
                                        {availableGroupsForForm.map((g) => (
                                            <option key={g.number} value={g.number}>
                                                G{g.number}: {g.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.group_number && <p className="text-red-500 text-xs mt-1">{errors.group_number}</p>}
                                </div>
                            </div>

                            {/* Code and Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Clave / Código *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData("code", e.target.value)}
                                        placeholder="Ej. MAT-ACE-001"
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Nombre del Producto / Insumo *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="Ej. Varilla Corrugada 3/8 Grado 42"
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

                            {/* Location and Is Inventoried */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Ubicación en Almacén
                                    </label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => setData("location", e.target.value)}
                                        placeholder="Ej. Patio de Materiales A, Estante F-2..."
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="is_inventoried"
                                        checked={data.is_inventoried}
                                        onChange={(e) => setData("is_inventoried", e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="is_inventoried" className="text-xs font-bold text-gray-700 cursor-pointer">
                                        Sujeto a Control de Inventario Activo
                                    </label>
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
