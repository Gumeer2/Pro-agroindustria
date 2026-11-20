import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import React, { useState } from "react";
import {
    Package,
    ArrowLeft,
    Search,
    Plus,
    Check,
    CheckCircle,
    X,
    Building2,
    Boxes,
    CheckCircle2,
    SlidersHorizontal,
    FileText,
    FolderKanban,
} from "lucide-react";
// @ts-ignore
import { pickBy } from "lodash";

interface Client {
    id: number;
    business_name: string;
    rfc: string;
    contact_info?: string;
    address?: string;
    bag_types?: string[] | null;
}

interface PaginatedClients {
    data: Client[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Stats {
    total_clients: number;
    configured_clients: number;
    unrestricted_clients: number;
    total_bag_types: number;
}

export default function Index({
    auth,
    clients,
    filters,
    available_bag_types = [],
    stats,
}: {
    auth: any;
    clients: PaginatedClients;
    filters: { search?: string; bag_filter?: string };
    available_bag_types: string[];
    stats: Stats;
}) {
    const { flash } = usePage<any>().props;

    // Filters
    const [search, setSearch] = useState(filters.search || "");
    const [bagFilter, setBagFilter] = useState(filters.bag_filter || "all");

    // Modal state for client bag configuration
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientBagTypes, setClientBagTypes] = useState<string[]>([]);
    const [newCustomBagInput, setNewCustomBagInput] = useState("");

    // Modal state for adding a new master bag type
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [newMasterTypeName, setNewMasterTypeName] = useState("");

    // Forms
    const {
        data: updateData,
        setData: setUpdateData,
        put: putUpdate,
        processing: updating,
    } = useForm<{ bag_types: string[] }>({
        bag_types: [],
    });

    const {
        data: newTypeData,
        setData: setNewTypeData,
        post: postNewType,
        processing: savingType,
        reset: resetNewType,
    } = useForm({
        name: "",
    });

    // Handle filter application
    const applyFilters = (newSearch?: string, newFilter?: string) => {
        const s = newSearch !== undefined ? newSearch : search;
        const f = newFilter !== undefined ? newFilter : bagFilter;

        const params = pickBy({
            search: s.trim() ? s.trim() : undefined,
            bag_filter: f !== "all" ? f : undefined,
            page: 1,
        });

        router.get(route("documentation.client-bags.index"), params as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(search, bagFilter);
    };

    const handleClearSearch = () => {
        setSearch("");
        applyFilters("", bagFilter);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setBagFilter(val);
        applyFilters(search, val);
    };

    // Open configuration modal
    const handleOpenConfigModal = (client: Client) => {
        setSelectedClient(client);
        const current = Array.isArray(client.bag_types) ? client.bag_types : [];
        setClientBagTypes(current);
        setUpdateData("bag_types", current);
        setNewCustomBagInput("");
    };

    const handleCloseModal = () => {
        setSelectedClient(null);
        setClientBagTypes([]);
        setNewCustomBagInput("");
    };

    // Toggle a bag type for active client
    const toggleClientBag = (typeName: string) => {
        const upper = typeName.trim().toUpperCase();
        const next = clientBagTypes.includes(upper)
            ? clientBagTypes.filter((t) => t !== upper)
            : [...clientBagTypes, upper];
        setClientBagTypes(next);
        setUpdateData("bag_types", next);
    };

    // Select all / Deselect all
    const handleSelectAll = () => {
        const all = Array.from(
            new Set([...available_bag_types, ...clientBagTypes])
        );
        setClientBagTypes(all);
        setUpdateData("bag_types", all);
    };

    const handleDeselectAll = () => {
        setClientBagTypes([]);
        setUpdateData("bag_types", []);
    };

    // Add custom bag in modal
    const handleAddCustomToClient = () => {
        const val = newCustomBagInput.trim().toUpperCase();
        if (!val) return;
        if (!clientBagTypes.includes(val)) {
            const next = [...clientBagTypes, val];
            setClientBagTypes(next);
            setUpdateData("bag_types", next);
        }
        setNewCustomBagInput("");
    };

    // Save client bag configuration
    const handleSaveClientBags = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;

        putUpdate(route("documentation.client-bags.update", selectedClient.id), {
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
            },
        });
    };

    // Save new master bag type
    const handleSaveMasterType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMasterTypeName.trim()) return;

        postNewType(route("documentation.client-bags.store-type"), {
            preserveScroll: true,
            data: { name: newMasterTypeName.trim().toUpperCase() },
            onSuccess: () => {
                setNewMasterTypeName("");
                setShowAddTypeModal(false);
                resetNewType();
            },
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Documentación">
            <Head title="Alta de Clientes Sacos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Flash Success Alert */}
                {flash?.success && (
                    <div className="bg-white border-l-4 border-emerald-500 rounded-lg shadow-md p-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-emerald-100 p-2 rounded-full mr-3 shrink-0">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="text-gray-900 font-bold text-sm">
                                    Operación Exitosa
                                </h4>
                                <p className="text-gray-600 text-xs mt-0.5">
                                    {flash.success}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="mb-3">
                            <Link
                                href={route("documentation.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver a Documentación
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                            <Package className="mr-3 h-8 w-8 text-indigo-600" />
                            Alta de Clientes Sacos
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Asignación de tipos de saco autorizados por cliente para la carga envasada.
                        </p>
                    </div>

                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            type="button"
                            onClick={() => setShowAddTypeModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors cursor-pointer"
                        >
                            <Plus className="h-5 w-5 mr-1.5" />
                            Nuevo Tipo de Saco
                        </button>
                    </div>
                </div>

                {/* KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Total de Clientes
                            </p>
                            <p className="text-2xl font-black text-gray-900 mt-1">
                                {stats?.total_clients ?? clients.total}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Building2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Clientes con Sacos Asignados
                            </p>
                            <p className="text-2xl font-black text-indigo-900 mt-1">
                                {stats?.configured_clients ?? 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Catálogo Maestro Activo */}
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Tipos de Saco Registrados en el Sistema
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddTypeModal(true)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Registrar Otro Tipo</span>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {available_bag_types.map((type) => (
                            <span
                                key={type}
                                className="inline-flex items-center px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-md text-xs font-bold transition-colors"
                            >
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="bg-white p-4 rounded-xl shadow-xs border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative w-full sm:w-96"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                            placeholder="Buscar por cliente o RFC..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                title="Limpiar búsqueda"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="text-xs font-bold text-gray-600 whitespace-nowrap">
                            Filtrar por:
                        </label>
                        <select
                            value={bagFilter}
                            onChange={handleFilterChange}
                            className="block w-full sm:w-56 pl-3 pr-8 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg"
                        >
                            <option value="all">Todos los Clientes</option>
                            <option value="configured">Con Sacos Asignados</option>
                            <option value="unrestricted">Sin Restricción (Todos)</option>
                        </select>
                    </div>
                </div>

                {/* Tabla de Clientes con Encabezado Corporativo */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Cliente / Razón Social
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        RFC
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Tipos de Saco Autorizados (Envasado)
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Acción
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clients.data.length > 0 ? (
                                    clients.data.map((client) => {
                                        const hasBags =
                                            Array.isArray(client.bag_types) &&
                                            client.bag_types.length > 0;
                                        return (
                                            <tr
                                                key={client.id}
                                                className="hover:bg-indigo-50/60 transition-colors duration-150"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                            {client.business_name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {client.business_name}
                                                            </div>
                                                            {client.address && (
                                                                <div className="text-xs text-gray-400 truncate max-w-md">
                                                                    {client.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-700">
                                                    {client.rfc}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {hasBags ? (
                                                        <div className="flex flex-wrap gap-1.5 max-w-lg">
                                                            {client.bag_types!.map((bt) => (
                                                                <span
                                                                    key={bt}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                                                                >
                                                                    {bt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-500 italic">
                                                            Sin restricción (todos permitidos)
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenConfigModal(client)
                                                        }
                                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 shadow-2xs text-xs font-bold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                                                    >
                                                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                                                        Asignar Saco
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-12 text-center text-gray-400 font-medium text-sm"
                                        >
                                            No se encontraron clientes registrados con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación estándar */}
                    {clients.last_page > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                            <div>
                                Mostrando página <span className="font-bold">{clients.current_page}</span> de <span className="font-bold">{clients.last_page}</span> (Total: {clients.total} clientes)
                            </div>
                            <div className="flex items-center gap-1">
                                {clients.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || "#"}
                                        className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                                            link.active
                                                ? "bg-indigo-600 text-white"
                                                : link.url
                                                ? "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: Configurar Sacos para el Cliente Seleccionado */}
            {selectedClient && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        Asignación de Sacos por Cliente
                                    </h3>
                                    <p className="text-indigo-200 text-xs">
                                        {selectedClient.business_name}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveClientBags} className="p-6 space-y-5">
                            {/* Ficha Resumen del Cliente */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <span className="text-gray-500 font-semibold block">RFC:</span>
                                    <span className="font-mono font-bold text-gray-900">{selectedClient.rfc}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 font-semibold block">Contacto:</span>
                                    <span className="text-gray-800">{selectedClient.contact_info || "No registrado"}</span>
                                </div>
                            </div>

                            {/* Controles de Selección */}
                            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Tipos de Saco Autorizados:
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                    >
                                        Marcar todos
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAll}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </div>

                            {/* Badges interactivos para alternar selección */}
                            <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto p-1">
                                {Array.from(
                                    new Set([
                                        ...available_bag_types,
                                        ...clientBagTypes,
                                    ])
                                ).map((type) => {
                                    const isSelected = clientBagTypes.includes(type);
                                    return (
                                        <button
                                            type="button"
                                            key={type}
                                            onClick={() => toggleClientBag(type)}
                                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 scale-102"
                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                                            }`}
                                        >
                                            {isSelected ? (
                                                <Check className="w-4 h-4 text-white" />
                                            ) : (
                                                <Plus className="w-4 h-4 text-gray-400" />
                                            )}
                                            <span>{type}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Registrar saco en caliente para este cliente */}
                            <div className="pt-3 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                    ¿El cliente requiere un tipo de saco no mostrado en la lista?
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newCustomBagInput}
                                        onChange={(e) =>
                                            setNewCustomBagInput(
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddCustomToClient();
                                            }
                                        }}
                                        placeholder="Escriba el tipo (ej. FERTINAL, ESPECIAL, ADM)..."
                                        className="flex-1 rounded-lg border-gray-300 shadow-2xs text-xs font-bold uppercase py-2 px-3 focus:border-indigo-600 focus:ring-indigo-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCustomToClient}
                                        disabled={!newCustomBagInput.trim()}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Agregar</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>
                                        {updating ? "Guardando..." : "Guardar Configuración"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Dar de alta nuevo tipo de saco general al catálogo */}
            {showAddTypeModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Package className="w-5 h-5 text-indigo-300" />
                                <h3 className="text-base font-bold">
                                    Nuevo Tipo de Saco al Catálogo
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddTypeModal(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMasterType} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Nombre del Tipo de Saco <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newMasterTypeName}
                                    onChange={(e) =>
                                        setNewMasterTypeName(
                                            e.target.value.toUpperCase()
                                        )
                                    }
                                    placeholder="EJ. ADM, PROAGRO, GENERICO, FERTINAL..."
                                    className="w-full rounded-lg border-gray-300 shadow-2xs text-xs font-bold uppercase py-2.5 px-3 focus:border-indigo-600 focus:ring-indigo-600"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddTypeModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingType || !newMasterTypeName.trim()}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>
                                        {savingType ? "Registrando..." : "Registrar Saco"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
