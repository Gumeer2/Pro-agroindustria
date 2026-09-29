import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    User,
    Truck,
    Search,
    Plus,
    Edit,
    ArrowLeft,
    Printer,
    ShieldAlert,
    ShieldCheck,
    CheckCircle,
    X,
    Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
// @ts-ignore
import { pickBy } from "lodash";

interface Operator {
    id: number;
    name: string;
    transport_line: string;
    real_transport_line: string;
    unit_type: string;
    economic_number: string;
    tractor_plate: string;
    trailer_plate: string;
    license: string;
    policy: string;
    validity: string;
    brand_model: string;
    status: string;
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
        status?: string;
    };
    auth: {
        user: any;
    };
    flash: {
        success?: string;
        error?: string;
    };
}

export default function Index({
    auth,
    operators,
    filters,
}: PageProps) {
    const { flash } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "active");
    const [showAlert, setShowAlert] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const applyFilters = (newParams: Partial<PageProps["filters"]>) => {
        const params = pickBy({
            search,
            status,
            ...newParams,
        });
        router.get(route("documentation.exit-operators.index"), params as any, {
            preserveState: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({});
    };

    const handleFilterChange = (key: string, value: string) => {
        if (key === "status") setStatus(value);
        applyFilters({ [key]: value });
    };

    return (
        <DashboardLayout user={auth.user} header="Gestión Operadores Salida">
            <Head title="Operadores de Salida" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Dynamic Alert */}
                {showAlert && flash?.success && (
                    <div className="fixed top-24 right-8 z-50 animate-fade-in-right">
                        <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-center max-w-md">
                            <div className="bg-green-100 p-2 rounded-full mr-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 mr-4">
                                <h4 className="text-green-900 font-bold text-sm">Operación Exitosa</h4>
                                <p className="text-green-700 text-xs font-medium">{flash.success}</p>
                            </div>
                            <button
                                onClick={() => setShowAlert(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <Link
                                href={route("documentation.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver a Documentación
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center">
                            <User className="mr-3 h-8 w-8 text-indigo-600" />
                            Operadores de Salida
                        </h2>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Link
                            href={route("documentation.exit-operators.create")}
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
                            placeholder="Buscar por nombre, línea, placas..."
                            value={search}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setSearch(e.target.value)}
                        />
                    </form>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <select
                            value={status}
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                            ) => handleFilterChange("status", e.target.value)}
                            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                        >
                            <option value="active">Activos</option>
                            <option value="vetoed">Vetados</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        QR
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Operador
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Línea Trans.
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Unidad / Placas
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
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
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                        {operator.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900 uppercase">
                                                            {operator.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Lic: {operator.license}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">{operator.transport_line}</div>
                                                <div className="text-xs text-gray-500 italic">Real: {operator.real_transport_line}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {operator.unit_type} - {operator.brand_model}
                                                </div>
                                                <div className="text-xs text-indigo-600 font-mono font-bold">
                                                    Tracto: {operator.tractor_plate} | Rem: {operator.trailer_plate || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {operator.status === 'active' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center w-fit">
                                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                                        ACTIVO
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center w-fit">
                                                        <ShieldAlert className="w-3 h-3 mr-1" />
                                                        VETADO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    {operator.status === 'active' ? (
                                                        <>
                                                            <Link
                                                                href={route("documentation.exit-operators.qr", operator.id)}
                                                                className="inline-flex items-center text-gray-600 hover:text-indigo-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-200 transition-all font-bold"
                                                            >
                                                                <Printer className="w-4 h-4 mr-1.5" />
                                                                QR
                                                            </Link>

                                                            <Link
                                                                href={route("documentation.exit-operators.edit", operator.id)}
                                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:border-indigo-300 transition-all font-bold"
                                                            >
                                                                <Edit className="w-4 h-4 mr-1.5" />
                                                                Editar
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                disabled
                                                                title="Operador Vetado - No se puede generar QR"
                                                                className="inline-flex items-center text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed font-bold"
                                                            >
                                                                <Printer className="w-4 h-4 mr-1.5" />
                                                                QR
                                                            </button>

                                                            <button
                                                                disabled
                                                                title="Operador Vetado - No se puede editar"
                                                                className="inline-flex items-center text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-not-allowed font-bold"
                                                            >
                                                                <Edit className="w-4 h-4 mr-1.5" />
                                                                Editar
                                                            </button>
                                                        </>
                                                    )}

                                                    <Link
                                                        href={route("documentation.exit-operators.toggle", operator.id)}
                                                        method="patch"
                                                        as="button"
                                                        className={`inline-flex items-center justify-center w-28 px-3 py-1.5 rounded-lg border transition-all font-bold ${operator.status === 'active'
                                                            ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-300'
                                                            : 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100 hover:border-green-300'
                                                            }`}
                                                    >
                                                        {operator.status === 'active' ? (
                                                            <>
                                                                <ShieldAlert className="w-4 h-4 mr-1.5" />
                                                                Vetar
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldCheck className="w-4 h-4 mr-1.5" />
                                                                Activar
                                                            </>
                                                        )}
                                                    </Link>

                                                    <button
                                                        onClick={() => {
                                                            if (confirm("¿Estás seguro de que deseas eliminar este operador? Esta acción no se puede deshacer.")) {
                                                                router.delete(route("documentation.exit-operators.destroy", operator.id));
                                                            }
                                                        }}
                                                        className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg border border-red-100 hover:border-red-300 transition-all font-bold ml-2"
                                                        title="Eliminar Operador"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">
                                                No se encontraron operadores de salida
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
                                Mostrando <span className="font-medium">{operators.from}</span> a <span className="font-medium">{operators.to}</span> de <span className="font-medium">{operators.total}</span> resultados
                            </div>
                            <div className="flex justify-center space-x-1">
                                {operators.links.map((link: any, key: any) =>
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
