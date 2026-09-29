import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Box,
    Plus,
    ArrowLeft,
    Search,
    Edit,
    Trash2,
    AlertTriangle,
    X,
} from "lucide-react";
import { useState, Fragment } from "react";
// @ts-ignore
import { pickBy } from "lodash";

interface Product {
    id: number;
    code: string;
    name: string;
}

interface PageProps {
    products: Product[];
    auth: any;
}

export default function Index({ auth, products }: PageProps) {
    const [search, setSearch] = useState("");
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(
        null,
    );
    const { delete: destroy, processing } = useForm({});

    const isAdmin = auth.user.roles.includes("Admin");

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.code.toLowerCase().includes(search.toLowerCase()),
    );

    const handleDelete = () => {
        if (deletingProduct) {
            destroy(route("traffic.products.destroy", deletingProduct.id), {
                onSuccess: () => setDeletingProduct(null),
                preserveScroll: true,
            });
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Lista de Productos">
            <Head title="Productos" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-6">
                    <div className="flex-1 min-w-0">
                        <div className="mb-4">
                            <Link
                                href={route("traffic.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver a Tráfico
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold leading-7 text-indigo-900 sm:text-3xl sm:truncate flex items-center uppercase tracking-wider">
                            <Box className="mr-3 h-8 w-8 text-indigo-600" />
                            Productos
                        </h2>
                    </div>
                    {isAdmin && (
                        <div className="mt-4 flex md:mt-0 md:ml-4">
                            <Link
                                href={route("traffic.products.create")}
                                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
                            >
                                <Plus className="-ml-1 mr-2 h-5 w-5" />
                                Agregar Producto
                            </Link>
                        </div>
                    )}
                </div>

                {/* Filters & Actions */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                            placeholder="Buscar por código o nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
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
                                        Código
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                                    >
                                        Producto
                                    </th>
                                    {isAdmin && (
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider"
                                        >
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-indigo-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700 uppercase tracking-tighter">
                                                {product.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                                        {product.name.substring(
                                                            0,
                                                            2,
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 uppercase">
                                                            {product.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    <Link
                                                        href={route(
                                                            "traffic.products.edit",
                                                            product.id,
                                                        )}
                                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-all transform hover:scale-105"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            setDeletingProduct(
                                                                product,
                                                            )
                                                        }
                                                        className="inline-flex items-center text-red-600 hover:text-red-900 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-all transform hover:scale-105"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={isAdmin ? 3 : 2}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <Box className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">
                                                No se encontraron productos
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
                </div>
            </div>

            {/* Custom Animated Delete Confirmation Modal */}
            {deletingProduct && (
                <div className="fixed inset-0 z-[60] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                            onClick={() => setDeletingProduct(null)}
                        />

                        {/* Modal content */}
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <AlertTriangle
                                            className="h-6 w-6 text-red-600"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <h3 className="text-lg font-bold leading-6 text-gray-900 uppercase tracking-tight">
                                            Eliminar Producto
                                        </h3>
                                        <div className="mt-2 text-sm text-gray-500">
                                            ¿Estás seguro de que deseas eliminar
                                            el producto{" "}
                                            <span className="font-bold text-gray-900">
                                                {deletingProduct.name}
                                            </span>
                                            ? Esta acción no se puede deshacer.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDeletingProduct(null)}
                                        className="ml-auto text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                                <button
                                    type="button"
                                    disabled={processing}
                                    className="inline-flex w-full justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 sm:w-auto transition-all transform hover:scale-105"
                                    onClick={handleDelete}
                                >
                                    {processing
                                        ? "Eliminando..."
                                        : "Sí, Eliminar"}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all transform hover:scale-105"
                                    onClick={() => setDeletingProduct(null)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
