import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import Swal from "sweetalert2";
import {
    Boxes,
    PackagePlus,
    Search,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    AlertTriangle,
    Edit3,
    Trash2,
    X,
    Warehouse,
    Plus,
    FolderKanban,
    ChevronRight,
    Tag,
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
    type: SupplyType;
    group: SupplyGroup;
    items: PaginatedData<InventoryItem>;
    metrics: Metrics;
    filters: {
        search?: string;
    };
}

export default function GroupView({
    auth,
    type,
    group,
    items,
    metrics,
    filters = {},
}: Props) {
    const [search, setSearch] = useState(filters.search || "");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: "",
        name: "",
        description: "",
        type_slug: type.slug,
        group_number: group.number,
        unit: "PZA",
        unit_cost: 0,
        stock: 0,
        min_stock: 5,
        location: "Almacén General",
        is_inventoried: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route("apt.inventory.products.group", [type.slug, group.number]),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const generateProductCode = (typeSlug: string, groupNumber: number) => {
        const typeId = type.id || 1;
        const typePad = String(typeId).padStart(2, "0");
        const groupPad = String(groupNumber).padStart(2, "0");
        const prefix = `${typePad}-${groupPad}`;

        const matchingItems = (items?.data || []).filter(
            (i: any) => Number(i.group_number || group.number) === Number(groupNumber)
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
        const autoCode = generateProductCode(type.slug, group.number);
        setData({
            code: autoCode,
            name: "",
            description: "",
            type_slug: type.slug,
            group_number: group.number,
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
                        text: "El producto se ha dado de alta exitosamente en este grupo.",
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
                            text: "El producto ha sido eliminado del grupo.",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    return (
        <DashboardLayout user={auth?.user} header={`Grupo G${group.number}: ${group.name}`}>
            <Head title={`G${group.number}: ${group.name} - Inventario`} />

            <div className="py-6 max-w-[98%] mx-auto px-2 sm:px-4 lg:px-6">
                {/* Back navigation buttons */}
                <div className="flex items-center gap-2 mb-4">
                    <Link
                        href={route("apt.inventory.products.index")}
                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver a Catálogo de Productos
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {type.name} &gt; G{group.number}: {group.name}
                    </span>
                </div>

                {/* Header Banner for this Group */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 shadow-sm">
                            <FolderKanban className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-indigo-700 text-white font-extrabold px-2.5 py-0.5 rounded-md">
                                    GRUPO {group.number}
                                </span>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {group.name}
                                </h1>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                Submódulo: <span className="font-semibold text-gray-700">{type.name} (Tipo {type.id})</span> • Control específico de inventario y catálogo para este grupo.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Dar de Alta Producto en este Grupo</span>
                    </button>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                PRODUCTOS EN EL GRUPO
                            </span>
                            <span className="text-3xl font-black text-gray-900 mt-1 block">
                                {metrics.total_products}
                            </span>
                            <span className="text-xs text-indigo-600 font-medium mt-1 block">
                                Registrados en G{group.number}
                            </span>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Boxes className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                EXISTENCIA DEL GRUPO
                            </span>
                            <span className="text-3xl font-black text-emerald-600 mt-1 block">
                                {Number(metrics.total_stock || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Unidades disponibles
                            </span>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                VALOR ESTIMADO
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
                                ${Number(metrics.total_value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                Total valuado en grupo
                            </span>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                                ALERTAS DE STOCK
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-3xl font-black text-amber-600">
                                    {metrics.out_of_stock_count}
                                </span>
                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                    {metrics.out_of_stock_count > 0 ? "Sin stock" : "Óptimo"}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 font-medium mt-1 block">
                                {metrics.low_stock_count} con stock bajo
                            </span>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Search Bar for this group */}
                <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm mb-6 flex gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Buscar producto en G${group.number}: ${group.name}...`}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2 bg-gray-900 text-white font-bold rounded-xl text-xs sm:text-sm hover:bg-black transition-colors"
                    >
                        Buscar
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                router.get(route("apt.inventory.products.group", [type.slug, group.number]));
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-600 font-semibold rounded-xl text-xs sm:text-sm hover:bg-gray-200 transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </form>

                {/* Table for this Group */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1e1b4b] text-white text-[11px] uppercase tracking-wider font-extrabold">
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

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/80 transition-colors"
                                            >
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

                                                {/* Grupo de Insumo */}
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full border border-indigo-200">
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                                        G{item.group_number}: {item.group_name}
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
                                        <td colSpan={9} className="text-center py-12 text-gray-500">
                                            <Boxes className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm font-semibold">No hay productos registrados en el grupo G{group.number}: {group.name}</p>
                                            <button
                                                onClick={openCreateModal}
                                                className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
                                            >
                                                + Dar de alta producto en este grupo
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

            {/* Modal Create/Edit in this group */}
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
                                        {editingItem ? "Editar Producto" : `Dar de Alta en G${group.number}: ${group.name}`}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Clasificación: {type.name} (Tipo {type.id})
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
                                        placeholder="Ej. MAT-001"
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
                                        placeholder="Nombre descriptivo del insumo"
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
                                    placeholder="Detalles técnicos, medidas, marca, especificaciones..."
                                    className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
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
                                </div>
                            </div>

                            {/* Location and Inventoried */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Ubicación en Almacén
                                    </label>
                                    <input
                                        type="text"
                                        value={data.location}
                                        onChange={(e) => setData("location", e.target.value)}
                                        placeholder="Ej. Patio A, Bahía 3, Estante F-2..."
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="group_is_inventoried"
                                        checked={data.is_inventoried}
                                        onChange={(e) => setData("is_inventoried", e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="group_is_inventoried" className="text-xs font-bold text-gray-700 cursor-pointer">
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
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-200"
                                >
                                    {processing ? "Guardando..." : editingItem ? "Guardar Cambios" : "Dar de Alta en Grupo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
