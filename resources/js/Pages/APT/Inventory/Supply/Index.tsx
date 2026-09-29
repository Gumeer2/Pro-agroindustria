import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    Boxes,
    Users,
    Wrench,
    FileSignature,
    PieChart,
    Briefcase,
    ScrollText,
    Layers,
    ShoppingBag,
    Plus,
    Search,
    Filter,
    Trash2,
    Edit3,
    ArrowLeft,
    Package,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    DollarSign,
    MapPin,
    FolderKanban,
    Tag,
    X,
    Info,
} from "lucide-react";

interface CatalogGroup {
    number: number;
    name: string;
    is_inventoried: boolean;
}

interface InventoryType {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    border: string;
    hover: string;
    accent: string;
    groups: CatalogGroup[];
}

interface InventoryItem {
    id: number;
    type_id: number;
    type_name: string;
    type_slug: string;
    group_number: number;
    group_name: string;
    code: string | null;
    name: string;
    description: string | null;
    unit: string;
    stock: number;
    min_stock: number;
    unit_cost: number;
    location: string | null;
    kontrol_type: string;
    is_inventoried: boolean;
    notes: string | null;
    created_at: string;
    user?: {
        name: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
}

interface Metrics {
    total_products: number;
    total_stock: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    distinct_groups_with_stock: number;
}

interface Props {
    auth: any;
    type: InventoryType;
    items: PaginatedData<InventoryItem>;
    metrics: Metrics;
    catalog_groups: CatalogGroup[];
    filters: {
        search?: string;
        group_number?: string;
        is_inventoried?: string;
        stock_status?: string;
    };
}

const iconMap: Record<string, React.ElementType> = {
    Boxes,
    Users,
    Wrench,
    FileSignature,
    PieChart,
    Briefcase,
    ScrollText,
    Layers,
    ShoppingBag,
};

const COMMON_UNITS = [
    "PZA",
    "KG",
    "TON",
    "L",
    "M",
    "M2",
    "M3",
    "PAQ",
    "JGO",
    "SRV",
    "HRS",
    "ROLLO",
    "CJA",
    "SACO",
    "LOTE",
];

export default function SupplyInventoryView({
    auth,
    type,
    items,
    metrics,
    catalog_groups,
    filters,
}: Props) {
    const IconComponent = iconMap[type.icon] || Boxes;

    // Filters state
    const [search, setSearch] = useState(filters.search || "");
    const [groupNumber, setGroupNumber] = useState(filters.group_number || "");
    const [stockStatus, setStockStatus] = useState(filters.stock_status || "");
    const [isInventoried, setIsInventoried] = useState(filters.is_inventoried || "");

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    // Create / Edit Form
    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        group_number: catalog_groups[0]?.number || 1,
        code: "",
        name: "",
        description: "",
        unit: "PZA",
        stock: 0,
        min_stock: 0,
        unit_cost: 0,
        location: "",
        is_inventoried: true,
        notes: "",
    });

    // Handle filter submit / debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                search !== (filters.search || "") ||
                groupNumber !== (filters.group_number || "") ||
                stockStatus !== (filters.stock_status || "") ||
                isInventoried !== (filters.is_inventoried || "")
            ) {
                router.get(
                    typeof route === "function" ? route("apt.inventory.supply.index", type.slug) : `/apt/inventory/supply/${type.slug}`,
                    {
                        search: search || undefined,
                        group_number: groupNumber || undefined,
                        stock_status: stockStatus || undefined,
                        is_inventoried: isInventoried || undefined,
                    },
                    { preserveState: true, replace: true, preserveScroll: true }
                );
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, groupNumber, stockStatus, isInventoried]);

    const handleClearFilters = () => {
        setSearch("");
        setGroupNumber("");
        setStockStatus("");
        setIsInventoried("");
        router.get(
            typeof route === "function" ? route("apt.inventory.supply.index", type.slug) : `/apt/inventory/supply/${type.slug}`
        );
    };

    const openCreateModal = () => {
        setEditingItem(null);
        clearErrors();
        const firstGroup = catalog_groups[0];
        setData({
            group_number: firstGroup ? firstGroup.number : 1,
            code: "",
            name: "",
            description: "",
            unit: "PZA",
            stock: 0,
            min_stock: 0,
            unit_cost: 0,
            location: "",
            is_inventoried: firstGroup ? firstGroup.is_inventoried : true,
            notes: "",
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        clearErrors();
        setData({
            group_number: item.group_number,
            code: item.code || "",
            name: item.name,
            description: item.description || "",
            unit: item.unit || "PZA",
            stock: item.stock,
            min_stock: item.min_stock,
            unit_cost: item.unit_cost,
            location: item.location || "",
            is_inventoried: item.is_inventoried,
            notes: item.notes || "",
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            put(
                typeof route === "function"
                    ? route("apt.inventory.supply.update", [type.slug, editingItem.id])
                    : `/apt/inventory/supply/${type.slug}/${editingItem.id}`,
                {
                    onSuccess: () => {
                        setIsCreateModalOpen(false);
                        reset();
                        Swal.fire({
                            title: "¡Producto Actualizado!",
                            text: "El producto se ha modificado exitosamente.",
                            icon: "success",
                            confirmButtonColor: "#4f46e5",
                            timer: 2000,
                        });
                    },
                }
            );
        } else {
            post(
                typeof route === "function"
                    ? route("apt.inventory.supply.store", type.slug)
                    : `/apt/inventory/supply/${type.slug}`,
                {
                    onSuccess: () => {
                        setIsCreateModalOpen(false);
                        reset();
                        Swal.fire({
                            title: "¡Producto Registrado!",
                            text: `El producto ha sido dado de alta correctamente en ${type.name}.`,
                            icon: "success",
                            confirmButtonColor: "#4f46e5",
                            timer: 2000,
                        });
                    },
                }
            );
        }
    };

    const handleDelete = (item: InventoryItem) => {
        Swal.fire({
            title: "¿Eliminar Producto?",
            text: `¿Estás seguro de que deseas dar de baja "${item.name}"? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar producto",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "rounded-3xl",
                confirmButton: "rounded-xl px-6 py-3 font-bold",
                cancelButton: "rounded-xl px-6 py-3 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(
                    typeof route === "function"
                        ? route("apt.inventory.supply.destroy", [type.slug, item.id])
                        : `/apt/inventory/supply/${type.slug}/${item.id}`,
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            Swal.fire({
                                title: "¡Eliminado!",
                                text: "El producto ha sido eliminado del inventario.",
                                icon: "success",
                                confirmButtonColor: "#4f46e5",
                                timer: 2000,
                            });
                        },
                    }
                );
            }
        });
    };

    const handleGroupChange = (grpNumber: number) => {
        const selectedGrp = catalog_groups.find((g) => g.number === grpNumber);
        setData((prev) => ({
            ...prev,
            group_number: grpNumber,
            is_inventoried: selectedGrp ? selectedGrp.is_inventoried : prev.is_inventoried,
        }));
    };

    return (
        <DashboardLayout user={auth?.user} header={`Inventario: ${type.name}`}>
            <Head title={`Inventario - ${type.name}`} />

            <div className="py-8 max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href={typeof route === "function" ? route("apt.inventory.index") : "/apt/inventory"}
                            className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-3 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Volver a Gestión de Inventarios
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className={`p-3.5 rounded-2xl shadow-sm ${type.color}`}>
                                <IconComponent className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                        {type.name}
                                    </h1>
                                    <span className="text-xs uppercase px-2.5 py-0.5 rounded-full font-extrabold bg-gray-100 text-gray-700 border border-gray-200">
                                        TIPO {type.id}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mt-0.5 max-w-2xl">
                                    {type.description} ({catalog_groups.length} grupos configurados)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Dar de Alta Producto
                        </button>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Productos Registrados
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-gray-900">
                                {metrics.total_products}
                            </div>
                            <div className="text-xs text-indigo-600 font-semibold mt-1">
                                Total en catálogo
                            </div>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Package className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Existencia Total
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                                {metrics.total_stock.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-1">
                                Unidades disponibles
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Valor de Inventario
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-indigo-600">
                                ${metrics.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500 font-medium mt-1">
                                Costo total estimado
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Alertas de Stock
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-amber-600 flex items-center gap-2">
                                {metrics.low_stock_count + metrics.out_of_stock_count}
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {metrics.out_of_stock_count} sin stock
                                </span>
                            </div>
                            <div className="text-xs text-amber-700 font-medium mt-1">
                                Requieren atención
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, clave o ubicación..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        {/* Group Filter */}
                        <div className="w-full sm:w-64">
                            <select
                                value={groupNumber}
                                onChange={(e) => setGroupNumber(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">TODOS LOS GRUPOS ({catalog_groups.length})</option>
                                {catalog_groups.map((g) => (
                                    <option key={g.number} value={g.number}>
                                        Grupo {g.number}: {g.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stock Status Filter */}
                        <div className="w-full sm:w-48">
                            <select
                                value={stockStatus}
                                onChange={(e) => setStockStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">EXISTENCIA: TODAS</option>
                                <option value="in_stock">CON EXISTENCIA (&gt; 0)</option>
                                <option value="low_stock">BAJO STOCK (ALERTA)</option>
                                <option value="out_of_stock">SIN EXISTENCIA (= 0)</option>
                            </select>
                        </div>

                        {/* Inventoried Filter */}
                        <div className="w-full sm:w-48">
                            <select
                                value={isInventoried}
                                onChange={(e) => setIsInventoried(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">CONTROL: TODOS</option>
                                <option value="1">SOLO INVENTARIADOS</option>
                                <option value="0">NO INVENTARIADOS</option>
                            </select>
                        </div>
                    </div>

                    {(search || groupNumber || stockStatus || isInventoried) && (
                        <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Limpiar Filtros
                        </button>
                    )}
                </div>

                {/* Products Table Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white text-left text-xs font-bold uppercase tracking-wider">
                                    <th scope="col" className="px-6 py-4">Clave / Código</th>
                                    <th scope="col" className="px-6 py-4">Producto / Insumo</th>
                                    <th scope="col" className="px-6 py-4">Grupo de Insumo</th>
                                    <th scope="col" className="px-6 py-4 text-center">Unidad</th>
                                    <th scope="col" className="px-6 py-4 text-right">Existencia (Stock)</th>
                                    <th scope="col" className="px-6 py-4 text-right">Costo / Valor</th>
                                    <th scope="col" className="px-6 py-4">Ubicación</th>
                                    <th scope="col" className="px-6 py-4 text-center">Estatus</th>
                                    <th scope="col" className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {items.data.length > 0 ? (
                                    items.data.map((item) => {
                                        const isLowStock = item.stock > 0 && item.stock <= item.min_stock;
                                        const isOutOfStock = item.stock <= 0;
                                        const totalValue = item.stock * item.unit_cost;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-indigo-50/40 transition-colors group"
                                            >
                                                {/* Code */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                                        {item.code || "S/C"}
                                                    </span>
                                                </td>

                                                {/* Product Name */}
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900 text-sm">
                                                        {item.name}
                                                    </div>
                                                    {item.description && (
                                                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Group */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                        G{item.group_number}: {item.group_name}
                                                    </span>
                                                </td>

                                                {/* Unit */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                        {item.unit}
                                                    </span>
                                                </td>

                                                {/* Stock */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="text-base font-black text-gray-900 font-mono">
                                                        {item.stock.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                    </div>
                                                    {isOutOfStock ? (
                                                        <span className="inline-flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                            Agotado
                                                        </span>
                                                    ) : isLowStock ? (
                                                        <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            Mínimo: {item.min_stock}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700">
                                                            Disponible
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Cost & Value */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="text-xs text-gray-900 font-medium">
                                                        ${item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[11px] text-indigo-600 font-bold font-mono">
                                                        Tot: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </td>

                                                {/* Location */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                    {item.location ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            {item.location}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No especificada</span>
                                                    )}
                                                </td>

                                                {/* Inventoried Status */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    {item.is_inventoried ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Inventariado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                            No inventariado
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-xl transition-all shadow-sm"
                                                            title="Editar Producto"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all shadow-sm"
                                                            title="Dar de Baja / Eliminar Producto"
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
                                        <td colSpan={9} className="px-6 py-16 text-center text-gray-500">
                                            <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-bold text-gray-800">
                                                No hay productos registrados en {type.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                                                Comienza agregando los materiales o insumos correspondientes a este submódulo con el botón de dar de alta.
                                            </p>
                                            <button
                                                onClick={openCreateModal}
                                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Dar de Alta Primer Producto
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {items.links && items.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Mostrando <span className="font-bold text-gray-800">{items.from || 0}</span> a{" "}
                                <span className="font-bold text-gray-800">{items.to || 0}</span> de{" "}
                                <span className="font-bold text-gray-800">{items.total}</span> productos
                            </div>
                            <div className="flex items-center gap-1">
                                {items.links.map((link, idx) => (
                                    link.url ? (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                link.active
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Dar de Alta / Editar Producto */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
                                    <IconComponent className="w-6 h-6 text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">
                                        {editingItem ? "Editar Producto" : "Dar de Alta Producto"}
                                    </h3>
                                    <p className="text-xs text-indigo-200 font-medium">
                                        Submódulo: {type.name} (Tipo {type.id})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Group Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Grupo de Insumo *
                                </label>
                                <select
                                    value={data.group_number}
                                    onChange={(e) => handleGroupChange(parseInt(e.target.value))}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    {catalog_groups.map((grp) => (
                                        <option key={grp.number} value={grp.number}>
                                            Grupo {grp.number}: {grp.name} {grp.is_inventoried ? "(Inventariado)" : "(No inventariado)"}
                                        </option>
                                    ))}
                                </select>
                                {errors.group_number && (
                                    <p className="text-xs text-red-600 mt-1">{errors.group_number}</p>
                                )}
                            </div>

                            {/* Name & Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Nombre / Descripción del Producto *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Cemento Gris Tolteca 50kg, Cable Calibre 12..."
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Código / SKU (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Auto-generable"
                                        value={data.code}
                                        onChange={(e) => setData("code", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase font-mono"
                                    />
                                    {errors.code && (
                                        <p className="text-xs text-red-600 mt-1">{errors.code}</p>
                                    )}
                                </div>
                            </div>

                            {/* Unit, Stock, Min Stock */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Unidad de Medida *
                                    </label>
                                    <select
                                        value={data.unit}
                                        onChange={(e) => setData("unit", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {COMMON_UNITS.map((u) => (
                                            <option key={u} value={u}>
                                                {u}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.unit && (
                                        <p className="text-xs text-red-600 mt-1">{errors.unit}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Existencia Actual (Stock) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={data.stock}
                                        onChange={(e) => setData("stock", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                    {errors.stock && (
                                        <p className="text-xs text-red-600 mt-1">{errors.stock}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Stock Mínimo (Alerta)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={data.min_stock}
                                        onChange={(e) => setData("min_stock", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Cost, Location & Inventoried Checkbox */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Costo Unitario ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.unit_cost}
                                        onChange={(e) => setData("unit_cost", parseFloat(e.target.value) || 0)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Almacén / Ubicación
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Almacén 1, Estante B..."
                                        value={data.location}
                                        onChange={(e) => setData("location", e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Tipo de Control
                                    </label>
                                    <label className="relative flex items-center gap-2 cursor-pointer mt-2">
                                        <input
                                            type="checkbox"
                                            checked={data.is_inventoried}
                                            onChange={(e) => setData("is_inventoried", e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-bold text-gray-700">
                                            {data.is_inventoried ? "Inventariado" : "No Inventariado"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Observaciones / Especificaciones (Opcional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Detalles adicionales, proveedor sugerido, marca, etc."
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    {processing ? "Guardando..." : editingItem ? "Guardar Cambios" : "Dar de Alta"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
