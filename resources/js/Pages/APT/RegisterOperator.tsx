import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { UserPlus, ArrowLeft, Save, Truck } from "lucide-react";
import { useEffect } from "react";

export default function RegisterOperator({
    auth,
    vessels,
}: {
    auth: any;
    vessels: any[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        vessel_id: "",
        operator_name: "",
        unit_type: "Volteo",
        economic_number: "",
        tractor_plate: "",
        trailer_plate: "",
        transporter_line: "",
    });

    useEffect(() => {
        if (data.unit_type === "Volteo") {
            setData("trailer_plate", "");
        }
    }, [data.unit_type]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("apt.operators.store"), {
            onSuccess: () =>
                reset(
                    "operator_name",
                    "economic_number",
                    "tractor_plate",
                    "trailer_plate",
                    "transporter_line",
                ),
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Registro de Operadores (APT)">
            <Head title="Alta Operador - APT" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={new URLSearchParams(window.location.search).get("from") === "production" ? route("apt.production") : route("apt.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {new URLSearchParams(window.location.search).get("from") === "production" ? "Volver al menú de submódulos" : "Volver al menú APT"}
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-indigo-900 px-6 py-4 border-b flex items-center">
                        <Truck className="w-5 h-5 text-white mr-2" />
                        <h3 className="text-white font-bold">
                            Registro de Operador
                        </h3>
                    </div>

                    <form onSubmit={submit} className="p-8 space-y-6">
                        {/* Barco */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Barco
                            </label>
                            <select
                                value={data.vessel_id}
                                onChange={(e) =>
                                    setData("vessel_id", e.target.value)
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                required
                            >
                                <option value="">
                                    Seleccione el barco activo...
                                </option>
                                {vessels.map((v: any) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name} ({v.origin} - {v.product?.name}
                                        )
                                    </option>
                                ))}
                            </select>
                            {errors.vessel_id && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.vessel_id}
                                </p>
                            )}
                        </div>

                        {/* Nombre del Operador */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Nombre del operador
                            </label>
                            <input
                                type="text"
                                value={data.operator_name}
                                onChange={(e) =>
                                    setData("operator_name", e.target.value)
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                placeholder="Nombre completo"
                            />
                            {errors.operator_name && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.operator_name}
                                </p>
                            )}
                        </div>

                        {/* Tipo de unidad y Económico */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Tipo de unidad
                                </label>
                                <select
                                    value={data.unit_type}
                                    onChange={(e) =>
                                        setData("unit_type", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                >
                                    <option value="Volteo">Volteo</option>
                                    <option value="Tolva">Tolva</option>
                                    <option value="Caja Seca">Caja Seca</option>
                                    <option value="Plataforma">
                                        Plataforma
                                    </option>
                                    <option value="Contenedor">
                                        Contenedor
                                    </option>
                                </select>
                                {errors.unit_type && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.unit_type}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Económico
                                </label>
                                <input
                                    type="text"
                                    value={data.economic_number}
                                    onChange={(e) =>
                                        setData(
                                            "economic_number",
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    placeholder="No. Económico"
                                />
                                {errors.economic_number && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.economic_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Placas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Placa tracto
                                </label>
                                <input
                                    type="text"
                                    value={data.tractor_plate}
                                    onChange={(e) =>
                                        setData("tractor_plate", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                    placeholder="Placa del tractor"
                                />
                                {errors.tractor_plate && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.tractor_plate}
                                    </p>
                                )}
                            </div>

                            {data.unit_type !== "Volteo" && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Placa remolque
                                    </label>
                                    <input
                                        type="text"
                                        value={data.trailer_plate}
                                        onChange={(e) =>
                                            setData(
                                                "trailer_plate",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                        placeholder="Placa del remolque"
                                    />
                                    {errors.trailer_plate && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.trailer_plate}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Línea transportista */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Línea transportista
                            </label>
                            <input
                                type="text"
                                value={data.transporter_line}
                                onChange={(e) =>
                                    setData("transporter_line", e.target.value)
                                }
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5"
                                placeholder="Nombre de la línea"
                            />
                            {errors.transporter_line && (
                                <p className="text-red-500 text-xs mt-1">
                                    {errors.transporter_line}
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    backgroundColor: "#4ade80",
                                    color: "#ffffff",
                                }}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors uppercase"
                            >
                                {processing
                                    ? "Guardando..."
                                    : "Guardar Operador"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
