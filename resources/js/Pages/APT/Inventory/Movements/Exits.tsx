import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
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
} from "lucide-react";

interface MovementItem {
    id: number;
    movement_type: "entry" | "exit";
    item_id: number;
    item_code: string;
    item_name: string;
    type_name: string;
    group_name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
    reference_document?: string;
    responsible_person?: string;
    location?: string;
    notes?: string;
    movement_date: string;
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

    const allSelected = movements.data.length > 0 && movements.data.every((m) => selectedIds.includes(m.id));

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(movements.data.map((m) => m.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleRow = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        item_id: availableProducts[0]?.id || "",
        quantity: 1,
        movement_date: new Date().toISOString().split("T")[0],
        reference_document: "",
        responsible_person: auth?.user?.name || "",
        location: availableProducts[0]?.location || "Almacén General",
        notes: "",
    });

    const selectedProduct = availableProducts.find((p) => p.id === Number(data.item_id));

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
        clearErrors();
        reset();
        const first = availableProducts[0];
        setData({
            item_id: first?.id || "",
            quantity: 1,
            movement_date: new Date().toISOString().split("T")[0],
            reference_document: "",
            responsible_person: auth?.user?.name || "",
            location: first?.location || "Almacén General",
            notes: "",
        });
        setIsCreateModalOpen(true);
    };

    const handleProductSelectChange = (itemId: number) => {
        const prod = availableProducts.find((p) => p.id === itemId);
        if (prod) {
            setData({
                ...data,
                item_id: prod.id,
                location: prod.location || "Almacén General",
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct && data.quantity > selectedProduct.stock) {
            Swal.fire({
                icon: "error",
                title: "Existencia Insuficiente",
                text: `La cantidad solicitada (${data.quantity} ${selectedProduct.unit}) supera el stock disponible (${selectedProduct.stock} ${selectedProduct.unit}).`,
            });
            return;
        }

        post(route("apt.inventory.exits.store"), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
                Swal.fire({
                    icon: "success",
                    title: "¡Salida Registrada!",
                    text: "El vale de salida y el descuento de stock se han procesado correctamente.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (err: any) => {
                if (err.quantity) {
                    Swal.fire({
                        icon: "error",
                        title: "Error de Stock",
                        text: err.quantity,
                    });
                }
            },
        });
    };

    return (
        <DashboardLayout user={auth?.user} header="Salidas de Inventario">
            <Head title="Salida de Materiales - Inventario" />

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
                                    <th className="py-4 px-4">PRODUCTO / INSUMO</th>
                                    <th className="py-4 px-4">SUBMÓDULO & GRUPO</th>
                                    <th className="py-4 px-4 text-center">CANTIDAD SALIDA</th>
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
                                        const isSelected = selectedIds.includes(m.id);

                                        return (
                                            <tr key={m.id} className={`transition-colors ${isSelected ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-slate-50/80"}`}>
                                                <td className="py-4 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleRow(m.id)}
                                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
                                                    />
                                                </td>
                                                <td className="py-4 px-4 text-center font-bold text-gray-700">
                                                    {cleanDate}
                                                </td>
                                                <td className="py-4 px-4 text-center font-mono font-bold text-gray-700">
                                                    <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-xs border border-amber-200">
                                                        {m.reference_document || `VAL-${m.id.toString().padStart(4, "0")}`}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-gray-900">{m.item_name}</div>
                                                    <div className="font-mono text-xs text-gray-500">{m.item_code}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-xs font-semibold text-gray-800">{m.type_name}</div>
                                                    <div className="text-[11px] text-gray-500">{m.group_name}</div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="font-extrabold text-amber-600 text-sm">
                                                        -{Number(m.quantity).toLocaleString("es-MX", { maximumFractionDigits: 2 })} {m.unit}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="font-bold text-gray-900">
                                                        ${Number(m.total_cost || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        (${Number(m.unit_cost || 0).toFixed(2)} c/u)
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{m.responsible_person || m.user?.name || "N/D"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                                        <Warehouse className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{m.location || "Área Operativa"}</span>
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
                                        <td colSpan={10} className="text-center py-12 text-gray-500">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <ArrowUpFromLine className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Registrar Salida / Vale de Material</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Descuenta existencias del almacén y valida disponibilidad.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Seleccionar Producto / Insumo *
                                </label>
                                <select
                                    value={data.item_id}
                                    onChange={(e) => handleProductSelectChange(Number(e.target.value))}
                                    required
                                    className="w-full py-2.5 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {availableProducts.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            [{p.code}] {p.name} - Stock disponible: {p.stock} {p.unit} ({p.group_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedProduct && (
                                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center">
                                    <span>Existencia actual: <strong className="text-amber-700">{selectedProduct.stock} {selectedProduct.unit}</strong></span>
                                    <span>Costo unitario: <strong>${Number(selectedProduct.unit_cost).toFixed(2)}</strong></span>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Cantidad a Despachar *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedProduct?.stock || 999999}
                                        value={data.quantity}
                                        onChange={(e) => setData("quantity", Number(e.target.value))}
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Fecha de Salida *
                                    </label>
                                    <input
                                        type="date"
                                        value={data.movement_date}
                                        onChange={(e) => setData("movement_date", e.target.value)}
                                        required
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Folio de Vale / Requisición
                                    </label>
                                    <input
                                        type="text"
                                        value={data.reference_document}
                                        onChange={(e) => setData("reference_document", e.target.value)}
                                        placeholder="Ej. VALE-2026-001, REQ-44"
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Solicitante / Quien recibe
                                    </label>
                                    <input
                                        type="text"
                                        value={data.responsible_person}
                                        onChange={(e) => setData("responsible_person", e.target.value)}
                                        placeholder="Nombre u operador receptor"
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Área de Destino / Trabajo
                                </label>
                                <input
                                    type="text"
                                    value={data.location}
                                    onChange={(e) => setData("location", e.target.value)}
                                    placeholder="Ej. Mantenimiento Planta 1, Obra Civil, Empaque..."
                                    className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Notas / Justificación
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    rows={2}
                                    placeholder="Motivo del retiro, proyecto o cuadrilla..."
                                    className="w-full py-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-amber-200"
                                >
                                    {processing ? "Registrando..." : "Registrar Salida"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
