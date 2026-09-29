import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import {
    UserPlus,
    ArrowLeft,
    Save,
    Building,
    FileText,
    MapPin,
    Phone,
    CheckCircle,
    User,
} from "lucide-react";

export default function Create({ auth }: { auth: any }) {
    const { flash } = usePage<any>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        rfc: "",
        business_name: "",
        address: "",
        contact_info: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("clients.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Registro de Clientes">
            <Head title="Alta Cliente" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("clients.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al listado
                    </Link>
                </div>

                {flash?.success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-md flex items-center transition-all duration-300 animate-fade-in-down">
                        <div className="bg-green-100 p-2 rounded-full mr-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <span className="block font-bold text-lg">
                                ¡Registro Exitoso!
                            </span>
                            <span className="block text-sm font-medium text-green-700">
                                {flash.success}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">
                                    Agregar Nuevo Cliente
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Ingrese los detalles del cliente para
                                    registrarlo en el sistema
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                            <Building className="w-5 h-5 mr-2 text-indigo-600" />
                            Información Fiscal y General
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    RFC <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.rfc}
                                        onChange={(e) => setData("rfc", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase text-sm"
                                        placeholder="RFC del cliente"
                                        required
                                    />
                                    <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nombre / Razón Social <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.business_name}
                                        onChange={(e) => setData("business_name", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        placeholder="Nombre completo o razón social"
                                        required
                                    />
                                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Dirección <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => setData("address", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        placeholder="Calle, número, colonia, CP..."
                                        required
                                    />
                                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Contacto <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.contact_info}
                                        onChange={(e) => setData("contact_info", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 text-sm"
                                        placeholder="Teléfono, Email o Nombre de contacto"
                                        required
                                    />
                                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save className="w-6 h-6 mr-2" />
                                {processing
                                    ? "Guardando..."
                                    : "GUARDAR CLIENTE"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
