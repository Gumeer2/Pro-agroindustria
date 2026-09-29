import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import InputError from "@/Components/InputError";
import {
    UserPlus,
    ArrowLeft,
    Save,
    User,
    Mail,
    Shield,
    Lock,
    Key,
    IdCard,
    FileText,
    Eye,
    EyeOff
} from "lucide-react";
import { FormEventHandler, useState } from "react";

export default function Create({ auth, roles }: { auth: any; roles: any[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("admin.users.store"));
    };

    return (
        <DashboardLayout user={auth.user} header="Administración de Usuarios">
            <Head title="Crear Nuevo Usuario" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("admin.users.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al listado
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header: Indéntico a OV */}
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center">
                        <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-normal text-xl">
                                Crear Nuevo Usuario
                            </h3>
                            <p className="text-indigo-200 text-sm">
                                Complete la información para registrar un nuevo acceso al sistema.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        {/* SECTION: Información General - Estilo idéntico a Información General de OV */}
                        <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                            <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                            Información General del Usuario
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nombre Completo <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        required
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.name} className="mt-1" />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Correo Electrónico <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        required
                                        placeholder="correo@ejemplo.com"
                                    />
                                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            {/* SECTION: Credenciales */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                                    <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                                    Acceso y Seguridad
                                </h4>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nombre de Usuario (Login) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData("username", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        required
                                        placeholder="Ej: jperez"
                                    />
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.username} className="mt-1" />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Asignar Rol <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData("role", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white text-sm"
                                        required
                                    >
                                        <option value="">Seleccione un Rol...</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.name}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Shield className="w-5 h-5 text-indigo-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.role} className="mt-1" />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Contraseña <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 pr-10 text-sm"
                                        required
                                    />
                                    <Key className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Confirmar Contraseña <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData("password_confirmation", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 pr-10 text-sm"
                                        required
                                    />
                                    <Key className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-1" />
                            </div>

                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save className="w-6 h-6 mr-2" />
                                {processing ? "Guardando..." : "CREAR USUARIO"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
