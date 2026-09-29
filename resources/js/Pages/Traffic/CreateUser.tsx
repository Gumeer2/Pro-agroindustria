import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Save, ArrowLeft, UserPlus } from "lucide-react";
import { FormEventHandler } from "react";

export default function CreateUser({ auth }: { auth: any }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        position: "",
        level: "",
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("traffic.users.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Alta de Usuarios">
            <Head title="Alta de Usuarioss" />

            <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("traffic.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al menú
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <UserPlus className="w-6 h-6 text-white mr-3" />
                            <h3 className="text-white font-bold text-lg">
                                Ingresa los datos de usuario
                            </h3>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Nombre */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nombre:
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    required
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Usuario (Email) */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Usuario:
                                </label>
                                <input
                                    type="email" // Using email type for validation, displayed as "Usuario" per request
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Puesto */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Puesto:
                                </label>
                                <input
                                    type="text"
                                    value={data.position}
                                    onChange={(e) =>
                                        setData("position", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                />
                                {errors.position && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.position}
                                    </p>
                                )}
                            </div>

                            {/* Nivel */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nivel:
                                </label>
                                <input
                                    type="text"
                                    value={data.level}
                                    onChange={(e) =>
                                        setData("level", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                />
                                {errors.level && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.level}
                                    </p>
                                )}
                            </div>

                            {/* Contraseña */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Contraseña:
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    required
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Confirmar Contraseña:
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    required
                                />
                                {errors.password_confirmation && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors uppercase tracking-wide"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
