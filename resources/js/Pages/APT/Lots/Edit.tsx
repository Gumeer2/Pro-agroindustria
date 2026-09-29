import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Save,
    ArrowLeft,
    Database,
    Calendar,
    Hash,
    MapPin,
    Factory,
    Box,
} from "lucide-react";
import { FormEventHandler } from "react";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";

export default function Edit({ auth, lot }: { auth: any; lot: any }) {
    const { data, setData, put, processing, errors } = useForm({
        folio: lot.folio,
        warehouse: lot.warehouse,
        cubicle: lot.cubicle || "",
        plant_origin: lot.plant_origin,
        created_at: lot.created_at ? lot.created_at.substring(0, 16) : "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route("apt.lots.update", lot.id));
    };

    return (
        <DashboardLayout user={auth.user} header="Editar Lote">
            <Head title="Editar Lote" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <Link
                        href={new URLSearchParams(window.location.search).get("from") === "production" ? `${route("apt.lots.index")}?from=production` : route("apt.lots.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a Gestión de Lotes
                    </Link>
                    {new URLSearchParams(window.location.search).get("from") === "production" && (
                        <Link
                            href={route("apt.production")}
                            className="text-gray-600 hover:text-sky-700 flex items-center text-sm font-bold transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver al menú de submódulos
                        </Link>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">
                                    Editar Lote
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Modificación de datos del lote
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* General Info */}
                            <div className="md:col-span-2">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                                    <Hash className="w-5 h-5 mr-2 text-indigo-600" />
                                    Identificación
                                </h4>
                            </div>

                            <div>
                                <InputLabel value="Nombre del Lote / Folio" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <TextInput
                                        value={data.folio}
                                        onChange={(e) => setData("folio", e.target.value)}
                                        className="w-full pl-10 font-bold text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Ej: LOTE-2026-001"
                                    />
                                    <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.folio} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Fecha de Creación" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={data.created_at}
                                        onChange={(e) => setData("created_at", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10"
                                    />
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.created_at} className="mt-2" />
                            </div>

                            {/* Location Info */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                                    <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                                    Ubicación y Origen
                                </h4>
                            </div>

                            <div>
                                <InputLabel value="Planta Origen" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <select
                                        value={data.plant_origin}
                                        onChange={(e) => setData("plant_origin", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white"
                                    >
                                        <option value="UREA 1">UREA 1</option>
                                        <option value="UREA 2">UREA 2</option>
                                    </select>
                                    <Factory className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.plant_origin} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Almacén de Destino" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <select
                                        value={data.warehouse}
                                        onChange={(e) => setData("warehouse", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white"
                                    >
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={`Almacen ${n}`}>{`Almacén ${n}`}</option>
                                        ))}
                                    </select>
                                    <Database className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.warehouse} className="mt-2" />
                            </div>

                            {/* Cubicle Logic */}
                            {(data.warehouse === "Almacen 4" || data.warehouse === "Almacen 5") && (
                                <div className="animate-fade-in-down col-span-1 md:col-span-2">
                                    <InputLabel value="Cubículo Asignado" className="mb-1 text-gray-700 font-bold" />
                                    <div className="relative">
                                        <select
                                            value={data.cubicle}
                                            onChange={(e) => setData("cubicle", e.target.value)}
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white"
                                        >
                                            <option value="">Seleccione...</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                <option key={n} value={`${n}`}>{`Cubículo ${n}`}</option>
                                            ))}
                                        </select>
                                        <Box className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    <InputError message={errors.cubicle} className="mt-2" />
                                </div>
                            )}

                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-gray-500 text-sm italic">
                                Modificando registro ID: <span className="font-mono text-xs">{lot.id}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing ? "Guardando..." : "ACTUALIZAR LOTE"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
