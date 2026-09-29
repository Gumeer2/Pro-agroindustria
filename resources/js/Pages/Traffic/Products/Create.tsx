import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Box, ArrowLeft, Save } from "lucide-react";

export default function Create({ auth }: { auth: any }) {
    const { data, setData, post, processing, errors } = useForm({
        code: "",
        name: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("traffic.products.store"));
    };

    return (
        <DashboardLayout user={auth.user} header="Nuevo Producto">
            <Head title="Crear Producto" />

            <div className="py-8 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("traffic.products.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al listado
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6">
                        <h2 className="text-xl font-bold text-white flex items-center uppercase tracking-widest">
                            <Box className="mr-3 h-6 w-6 text-indigo-300" />
                            Registro de Producto
                        </h2>
                        <p className="text-indigo-200 text-sm mt-1">
                            Completa la información básica del producto.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Code Field */}
                            <div>
                                <label
                                    htmlFor="code"
                                    className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-2"
                                >
                                    Código del Producto
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    placeholder="Ej: MA-25"
                                    className={`mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all py-3 ${errors.code ? "border-red-500" : ""}`}
                                    value={data.code}
                                    onChange={(e) =>
                                        setData("code", e.target.value)
                                    }
                                    required
                                />
                                {errors.code && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.code}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-gray-400">
                                    Identificador único para el sistema.
                                </p>
                            </div>

                            {/* Name Field */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-bold text-gray-700 uppercase tracking-tight mb-2"
                                >
                                    Nombre del Producto
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Ej: Maíz Amarillo"
                                    className={`mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all py-3 ${errors.name ? "border-red-500" : ""}`}
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-500 font-medium">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing
                                    ? "Registrando..."
                                    : "Registrar Producto"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
