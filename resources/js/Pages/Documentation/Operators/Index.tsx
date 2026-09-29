import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react"; // ensure router is imported if you use it, or use Inertia.get
import {
    User,
    Truck,
    FileText,
    Search,
    Plus,
    Edit,
    ArrowLeft,
    ArrowRight,
    ArrowLeftCircle,
    Printer,
    Trash2,
} from "lucide-react";
import { useState } from "react";
// @ts-ignore
import { pickBy } from "lodash";

interface Operator {
    id: number;
    operator_name: string;
    transporter_line: string;
    unit_type: string;
    economic_number: string;
    tractor_plate: string;
    vessel?: {
        id: string;
        name: string;
        is_active: boolean;
    };
    is_active?: boolean;
}

interface PageProps {
    operators: {
        data: Operator[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    filters: {
        search?: string;
        vessel_id?: string;
        status?: string;
    };
    vessels: Array<{ id: string; name: string }>;
    auth: {
        user: any;
    };
}

export default function Index({
    auth,
    operators,
    filters,
    vessels,
}: PageProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [vesselId, setVesselId] = useState(filters.vessel_id || "");
    const [status, setStatus] = useState(filters.status || "active");

    const applyFilters = (newParams: Partial<PageProps["filters"]>) => {
        const params = pickBy({
            search,
            vessel_id: vesselId,
            status,
            ...newParams,
        });
        router.get(route("documentation.operators.index"), params as any, {
            preserveState: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({});
    };

    const handleFilterChange = (key: string, value: string) => {
        if (key === "vessel_id") setVesselId(value);
        if (key === "status") setStatus(value);
        applyFilters({ [key]: value });
    };

    return (
        <DashboardLayout user={auth.user} header="Lista de Operadores">
            <Head title="Operadores" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <Link
                                href={route("documentation.dock")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver a Documentación (Muelle)
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                            <User className="mr-3 h-8 w-8 text-indigo-600" />
                            Operadores Registrados
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={route("documentation.operators.create")}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Alta Operador
                        </Link>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <form
                        onSubmit={handleSearch}
                        className="relative w-full lg:w-96"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                            placeholder="Buscar por nombre, ID, línea..."
                            value={search}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setSearch(e.target.value)}
                        />
                    </form>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <select
                            value={vesselId}
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                            ) =>
                                handleFilterChange("vessel_id", e.target.value)
                            }
                            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                        >
                            <option value="">Todos los barcos</option>
                            {vessels.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                            ) => handleFilterChange("status", e.target.value)}
                            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                        >
                            <option value="active">Activos</option>
                            <option value="archived">
                                Archivados (Zarpado)
                            </option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        ID
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Operador
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Línea Trans.
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Unidad
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Barco / Estado
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {operators.data.length > 0 ? (
                                    operators.data.map((operator) => (
                                        <tr
                                            key={operator.id}
                                            className="hover:bg-indigo-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                                                #{operator.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                        {operator.operator_name.charAt(
                                                            0,
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {
                                                                operator.operator_name
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {operator.transporter_line}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {operator.unit_type}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {operator.economic_number} -{" "}
                                                    {operator.tractor_plate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {operator.vessel ? (
                                                        operator.vessel.name
                                                    ) : (
                                                        <span className="text-red-400 italic">
                                                            Sin Asignar
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1">
                                                    {operator.is_active ? (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                            Activo
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full italic">
                                                            Archivado
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium flex items-center gap-2 flex-wrap">
                                                {/* Print QR Button */}
                                                <Link
                                                    href={route("documentation.qr", {
                                                        qr: "OP " + operator.id,
                                                    })}
                                                    className="inline-flex items-center text-gray-600 hover:text-indigo-600 bg-gray-50 px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors border border-gray-200 hover:border-indigo-200"
                                                    title="Imprimir QR"
                                                >
                                                    <Printer className="w-4 h-4 mr-1.5" />
                                                    QR
                                                </Link>

                                                {operator.is_active ? (
                                                    <Link
                                                        href={route(
                                                            "documentation.operators.edit",
                                                            operator.id,
                                                        )}
                                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1.5" />
                                                        Editar
                                                    </Link>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md cursor-not-allowed opacity-60 tooltip"
                                                        title="Barco zarpado"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1.5" />
                                                        Editar
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        if (confirm("¿Estás seguro de que deseas eliminar este operador? Esta acción no se puede deshacer.")) {
                                                            router.delete(route("documentation.operators.destroy", operator.id));
                                                        }
                                                    }}
                                                    className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md hover:bg-red-100 transition-colors ml-2"
                                                    title="Eliminar Operador"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">
                                                No se encontraron operadores
                                            </p>
                                            <p className="text-sm">
                                                Intenta ajustar los filtros de
                                                búsqueda.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {operators.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 md:flex md:items-center md:justify-between">
                            <div className="text-sm text-gray-500 mb-4 md:mb-0">
                                Mostrando{" "}
                                <span className="font-medium">
                                    {operators.from}
                                </span>{" "}
                                a{" "}
                                <span className="font-medium">
                                    {operators.to}
                                </span>{" "}
                                de{" "}
                                <span className="font-medium">
                                    {operators.total}
                                </span>{" "}
                                resultados
                            </div>
                            <div className="flex justify-center space-x-1">
                                {operators.links.map((link, key) =>
                                    link.url ? (
                                        <Link
                                            key={key}
                                            href={link.url}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${link.active
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout >
    );
}
