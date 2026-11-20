import React, { useState, useMemo, Fragment } from "react";
import { router } from "@inertiajs/react";
import { Menu, Transition } from "@headlessui/react";
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Check,
    Settings,
    MoreHorizontal,
    Tag,
    FileText,
    SlidersHorizontal,
} from "lucide-react";
import Swal from "sweetalert2";

export interface PackagingEquipment {
    id: number;
    company: "PRO-AGRO" | "FERTINAL";
    category_number?: number;
    description: string;
    tag: string;
    brand: string;
    model: string;
    serial_number: string;
    status?: string;
    observations?: string;
}

interface Props {
    company: "PRO-AGRO" | "FERTINAL";
    equipments: PackagingEquipment[];
}

export default function PackagingEquipmentManager({ company, equipments }: Props) {
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("ALL");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PackagingEquipment | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        description: "TOLVA DE LINEA DE ENVASADO",
        customDescription: "",
        tag: "",
        brand: "VICTOR",
        model: "TMII-DS",
        serial_number: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isProAgro = company === "PRO-AGRO";

    // Filter equipments for current company
    const companyEquipments = useMemo(() => {
        return equipments.filter((eq) => eq.company === company);
    }, [equipments, company]);

    // Categories available
    const categories = useMemo(() => {
        const set = new Set<string>();
        companyEquipments.forEach((eq) => set.add(eq.description));
        return Array.from(set);
    }, [companyEquipments]);

    // Filtered by search & category
    const filteredEquipments = useMemo(() => {
        return companyEquipments.filter((eq) => {
            const matchesCategory =
                filterCategory === "ALL" || eq.description === filterCategory;
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                eq.tag.toLowerCase().includes(q) ||
                eq.brand.toLowerCase().includes(q) ||
                eq.model.toLowerCase().includes(q) ||
                eq.serial_number.toLowerCase().includes(q) ||
                eq.description.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
        });
    }, [companyEquipments, filterCategory, search]);

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData({
            description: "TOLVA DE LINEA DE ENVASADO",
            customDescription: "",
            tag: isProAgro ? "LE-P" : "LE-F",
            brand: "VICTOR",
            model: "TMII-DS",
            serial_number: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: PackagingEquipment) => {
        setEditingItem(item);
        const isStandard =
            item.description === "TOLVA DE LINEA DE ENVASADO" ||
            item.description === "ENSACADORA ELECTRONICA";
        setFormData({
            description: isStandard ? item.description : "OTRO",
            customDescription: isStandard ? "" : item.description,
            tag: item.tag,
            brand: item.brand,
            model: item.model,
            serial_number: item.serial_number,
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalDescription =
            formData.description === "OTRO"
                ? formData.customDescription.trim().toUpperCase()
                : formData.description.trim().toUpperCase();

        if (!finalDescription) {
            Swal.fire({
                title: "Error",
                text: "Por favor ingresa la descripción del equipo.",
                icon: "warning",
            });
            return;
        }

        if (!formData.tag.trim()) {
            Swal.fire({
                title: "Error",
                text: "Por favor ingresa el TAG del equipo.",
                icon: "warning",
            });
            return;
        }

        setIsSubmitting(true);

        const payload = {
            company,
            description: finalDescription,
            tag: formData.tag.trim().toUpperCase(),
            brand: formData.brand.trim().toUpperCase(),
            model: formData.model.trim().toUpperCase(),
            serial_number: formData.serial_number.trim().toUpperCase(),
        };

        if (editingItem) {
            router.put(route("apt.packaging-equipments.update", editingItem.id), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                    Swal.fire({
                        title: "¡Actualizado!",
                        text: "El equipo ha sido actualizado con éxito.",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: () => setIsSubmitting(false),
            });
        } else {
            router.post(route("apt.packaging-equipments.store"), payload, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                    Swal.fire({
                        title: "¡Dado de alta!",
                        text: `El equipo ${payload.tag} ha sido dado de alta correctamente.`,
                        icon: "success",
                        timer: 2500,
                        showConfirmButton: false,
                    });
                },
                onError: () => setIsSubmitting(false),
            });
        }
    };

    const handleDelete = (item: PackagingEquipment) => {
        Swal.fire({
            title: `¿Eliminar equipo ${item.tag}?`,
            text: `Se eliminará el registro (${item.description} - Serie: ${item.serial_number}). Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.packaging-equipments.destroy", item.id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: "¡Eliminado!",
                            text: "El equipo ha sido eliminado de la lista.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Toolbar matching Sales Orders style */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                        LISTA DE EQUIPOS DE LÍNEAS DE ENVASADO ({company})
                    </h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                        {filteredEquipments.length} Registros
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                    {/* Search Input */}
                    <div className="relative min-w-[220px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar TAG, Serie, Modelo..."
                            className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Category Filter Dropdown */}
                    {categories.length > 1 && (
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="text-xs font-semibold rounded-xl border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                        >
                            <option value="ALL">Todas las descripciones</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Add Button */}
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-md shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        Dar de Alta Equipo ({company})
                    </button>
                </div>
            </div>

            {/* Table in exact style of Image 2 (Sales Orders) */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                            <tr>
                                <th className="sticky left-0 px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider bg-indigo-800 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] w-14">
                                    <Settings className="w-5 h-5 mx-auto opacity-70" />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    TAG
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    DESCRIPCIÓN
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    MARCA
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    MODELO
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    SERIE
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                    ESTATUS
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                                    ACCIONES
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEquipments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-base font-semibold text-gray-600">
                                            No se encontraron equipos registrados
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Utiliza el botón &quot;Dar de Alta Equipo ({company})&quot; para registrar un nuevo equipo.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEquipments.map((eq, index) => (
                                    <tr
                                        key={eq.id}
                                        className="hover:bg-indigo-50 transition-colors duration-150 group"
                                    >
                                        {/* Actions Menu button in 1st column matching Image 2 */}
                                        <td className="sticky left-0 px-4 py-4 whitespace-nowrap text-center text-sm font-medium bg-white group-hover:bg-indigo-50 z-10 focus-within:z-30 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] transition-colors">
                                            <Menu as="div" className="relative inline-block text-left">
                                                <div>
                                                    <Menu.Button className="inline-flex justify-center items-center w-8 h-8 rounded-full text-indigo-500 hover:text-indigo-900 hover:bg-indigo-100 focus:outline-none transition-colors">
                                                        <MoreHorizontal className="w-5 h-5" />
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
                                                        className="w-48 origin-top-left bg-white divide-y divide-gray-100 rounded-xl shadow-2xl ring-1 ring-black/10 focus:outline-none z-50 p-1"
                                                    >
                                                        <div className="p-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditModal(eq)}
                                                                        className={`${
                                                                            active
                                                                                ? "bg-indigo-600 text-white"
                                                                                : "text-gray-900"
                                                                        } group flex rounded-lg items-center w-full px-3 py-2 text-xs font-semibold transition-colors cursor-pointer`}
                                                                    >
                                                                        <Edit2
                                                                            className={`w-4 h-4 mr-2.5 ${
                                                                                active
                                                                                    ? "text-white"
                                                                                    : "text-amber-500"
                                                                            }`}
                                                                        />
                                                                        Editar Equipo
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                        <div className="p-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDelete(eq)}
                                                                        className={`${
                                                                            active
                                                                                ? "bg-red-600 text-white"
                                                                                : "text-red-600"
                                                                        } group flex rounded-lg items-center w-full px-3 py-2 text-xs font-semibold transition-colors cursor-pointer`}
                                                                    >
                                                                        <Trash2
                                                                            className={`w-4 h-4 mr-2.5 ${
                                                                                active
                                                                                    ? "text-white"
                                                                                    : "text-red-500"
                                                                            }`}
                                                                        />
                                                                        Eliminar Equipo
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </td>

                                        {/* TAG */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                                            <button
                                                onClick={() => openEditModal(eq)}
                                                className="hover:underline font-bold text-left"
                                            >
                                                {eq.tag}
                                            </button>
                                        </td>

                                        {/* DESCRIPCIÓN */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold uppercase">
                                            {eq.description}
                                        </td>

                                        {/* MARCA */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium uppercase">
                                            {eq.brand}
                                        </td>

                                        {/* MODELO */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium uppercase">
                                            {eq.model}
                                        </td>

                                        {/* SERIE */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-800">
                                            {eq.serial_number}
                                        </td>

                                        {/* ESTATUS */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 tracking-wide">
                                                {eq.status === "maintenance"
                                                    ? "MANTENIMIENTO"
                                                    : eq.status === "inactive"
                                                    ? "INACTIVO"
                                                    : "ACTIVO"}
                                            </span>
                                        </td>

                                        {/* Inline Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => openEditModal(eq)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100/60 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(eq)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100/60 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                        {/* TOTALS FOOTER matching Image 2 */}
                        {filteredEquipments.length > 0 && (
                            <tfoot className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                                <tr>
                                    <td className="sticky left-0 bg-gray-100 z-10 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)]"></td>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-4 text-right text-sm text-indigo-900 uppercase tracking-wider font-extrabold"
                                    >
                                        TOTAL GENERAL
                                    </td>
                                    <td
                                        colSpan={2}
                                        className="px-6 py-4 text-center text-sm font-extrabold text-indigo-900 tracking-wider"
                                    >
                                        {filteredEquipments.length}{" "}
                                        {filteredEquipments.length === 1 ? "EQUIPO" : "EQUIPOS"}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal Dar de Alta / Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 text-white flex items-center justify-between bg-gradient-to-r from-indigo-800 to-indigo-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <Tag className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-base tracking-tight">
                                        {editingItem
                                            ? `Editar Equipo: ${editingItem.tag}`
                                            : `Dar de Alta Equipo (${company})`}
                                    </h4>
                                    <p className="text-indigo-200 text-xs">
                                        Línea de Envasado {company}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    DESCRIPCIÓN DEL EQUIPO *
                                </label>
                                <select
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                            model:
                                                e.target.value === "TOLVA DE LINEA DE ENVASADO"
                                                    ? "TMII-DS"
                                                    : e.target.value === "ENSACADORA ELECTRONICA"
                                                    ? "EETII-60"
                                                    : prev.model,
                                        }))
                                    }
                                    className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2.5 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                                >
                                    <option value="TOLVA DE LINEA DE ENVASADO">
                                        TOLVA DE LINEA DE ENVASADO
                                    </option>
                                    <option value="ENSACADORA ELECTRONICA">
                                        ENSACADORA ELECTRONICA
                                    </option>
                                    <option value="OTRO">Otra descripción personalizada...</option>
                                </select>
                            </div>

                            {formData.description === "OTRO" && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        DESCRIPCIÓN PERSONALIZADA *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.customDescription}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                customDescription: e.target.value,
                                            }))
                                        }
                                        placeholder="Ej: BANDA TRANSPORTADORA DE SALIDA"
                                        className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2.5 px-3 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        TAG DEL EQUIPO *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tag}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                tag: e.target.value,
                                            }))
                                        }
                                        placeholder={isProAgro ? "Ej: LE-P07 o ENS-P16" : "Ej: LE-F04 o ENS-F09"}
                                        className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 py-2.5 px-3 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        MARCA *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.brand}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                brand: e.target.value,
                                            }))
                                        }
                                        placeholder="Ej: VICTOR"
                                        className="w-full text-xs font-bold rounded-xl border border-gray-300 py-2.5 px-3 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        MODELO *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.model}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                model: e.target.value,
                                            }))
                                        }
                                        placeholder="Ej: TMII-DS o EETII-60"
                                        className="w-full text-xs font-semibold rounded-xl border border-gray-300 py-2.5 px-3 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        SERIE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.serial_number}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                serial_number: e.target.value,
                                            }))
                                        }
                                        placeholder="Ej: GAF093 o CAO358"
                                        className="w-full text-xs font-mono font-bold rounded-xl border border-gray-300 py-2.5 px-3 uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 shadow-md transition-all"
                                >
                                    <Check className="w-4 h-4" />
                                    {editingItem ? "Actualizar Equipo" : "Dar de Alta Equipo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
