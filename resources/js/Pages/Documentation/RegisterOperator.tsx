import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import {
    UserPlus,
    ArrowLeft,
    Save,
    Truck,
    FileText,
    Shield,
    Calendar,
    User,
    Hash,
    CreditCard,
    Box,
    CheckCircle,
} from "lucide-react";
import { useEffect } from "react";

export default function RegisterOperator({
    auth,
    vessels,
}: {
    auth: any;
    vessels: any[];
}) {
    const { flash } = usePage<any>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        vessel_id: "",
        operator_name: "",
        transporter_line: "",
        unit_type: "VOLTEO",
        brand_model: "",
        trailer_plate: "",
        economic_number: "",
        tractor_plate: "",
    });

    useEffect(() => {
        if (data.unit_type === "VOLTEO") {
            setData("trailer_plate", "");
        }
    }, [data.unit_type]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("documentation.operators.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Registro de Operadores">
            <Head title="Alta Operador" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("documentation.operators.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a Lista de Operadores
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
                                    Alta de Operador
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Registre los datos del conductor y unidad
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        {/* Section: Vinculación */}
                        <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h4 className="text-indigo-800 font-bold mb-4 flex items-center">
                                <Truck className="w-5 h-5 mr-2" />
                                Vinculación de Barco
                            </h4>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Seleccionar Barco Activo{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={data.vessel_id}
                                        onChange={(e) =>
                                            setData("vessel_id", e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 pl-4 pr-10 appearance-none bg-white text-gray-700 font-medium"
                                        required
                                    >
                                        <option value="">
                                            -- Seleccione un barco --
                                        </option>
                                        {vessels.map((v: any) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}{" "}
                                                {v.origin
                                                    ? `(${v.origin})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            ></path>
                                        </svg>
                                    </div>
                                </div>
                                {errors.vessel_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.vessel_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Personal Data */}
                            <div className="space-y-6">
                                <h4 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4">
                                    Datos del Transportista
                                </h4>

                                {/* Nombre */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del Operador{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.operator_name}
                                            onChange={(e) =>
                                                setData(
                                                    "operator_name",
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold"
                                            placeholder="Nombre Completo"
                                            required
                                        />
                                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.operator_name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.operator_name}
                                        </p>
                                    )}
                                </div>

                                {/* Linea Transportista */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Línea Transportista{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.transporter_line}
                                            onChange={(e) =>
                                                setData(
                                                    "transporter_line",
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold"
                                            placeholder="Empresa Transportista"
                                            required
                                        />
                                        <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.transporter_line && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.transporter_line}
                                        </p>
                                    )}
                                </div>

                                {/* Economico */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        No. Económico{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.economic_number}
                                            onChange={(e) =>
                                                setData(
                                                    "economic_number",
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold"
                                            placeholder="Ej. 05, ECO-2024"
                                            required
                                        />
                                        <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.economic_number && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.economic_number}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Vehicle Data */}
                            <div className="space-y-6">
                                <h4 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4">
                                    Datos de la Unidad
                                </h4>

                                {/* Tipo de Unidad */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Unidad
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.unit_type}
                                            onChange={(e) =>
                                                setData(
                                                    "unit_type",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 appearance-none bg-white"
                                        >
                                            <option value="VOLTEO">VOLTEO</option>
                                            <option value="CONTENEDOR">CONTENEDOR</option>
                                            <option value="CAMIONETA">CAMIONETA</option>
                                            <option value="CISTERNA">CISTERNA</option>
                                            <option value="FULL CAJA SECA">FULL CAJA SECA</option>
                                            <option value="FULL ENCORTINADO">FULL ENCORTINADO</option>
                                            <option value="FULL GONDOLA">FULL GONDOLA</option>
                                            <option value="FULL JAULA">FULL JAULA</option>
                                            <option value="FULL PIPA">FULL PIPA</option>
                                            <option value="FULL PLATAFORMA">FULL PLATAFORMA</option>
                                            <option value="FULL TOLVA">FULL TOLVA</option>
                                            <option value="PIPA">PIPA</option>
                                            <option value="SENCILLO JAULA">SENCILLO JAULA</option>
                                            <option value="SENCILLO CAJA SECA">SENCILLO CAJA SECA</option>
                                            <option value="SENCILLO GONDOLA">SENCILLO GONDOLA</option>
                                            <option value="SENCILLO PIPA">SENCILLO PIPA</option>
                                            <option value="SENCILLO PLATAFORMA">SENCILLO PLATAFORMA</option>
                                            <option value="SENCILLO TOLVA">SENCILLO TOLVA</option>
                                            <option value="TORTON">TORTON</option>
                                        </select>
                                        <Box className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                ></path>
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.unit_type && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.unit_type}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Marca / Modelo */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Marca / Modelo
                                        </label>
                                        <input
                                            type="text"
                                            value={data.brand_model}
                                            onChange={(e) =>
                                                setData(
                                                    "brand_model",
                                                    e.target.value.toUpperCase(),
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 uppercase font-bold"
                                            placeholder="Ej. Kenworth 2020"
                                        />
                                    </div>

                                    {/* Placa Tracto */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Placa Tracto{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.tractor_plate}
                                                onChange={(e) =>
                                                    setData(
                                                        "tractor_plate",
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold font-mono"
                                                placeholder="ABC-123"
                                                required
                                            />
                                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                        </div>
                                        {errors.tractor_plate && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.tractor_plate}
                                            </p>
                                        )}
                                    </div>

                                    {/* Remolque */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Placa Remolque
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.trailer_plate}
                                                onChange={(e) =>
                                                    setData(
                                                        "trailer_plate",
                                                        e.target.value.toUpperCase(),
                                                    )
                                                }
                                                disabled={
                                                    data.unit_type === "VOLTEO"
                                                }
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold font-mono disabled:bg-gray-100 disabled:text-gray-400"
                                                placeholder={
                                                    data.unit_type === "VOLTEO"
                                                        ? "N/A"
                                                        : "XYZ-999"
                                                }
                                            />
                                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                        </div>
                                        {errors.trailer_plate && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.trailer_plate}
                                            </p>
                                        )}
                                    </div>
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
                                    : "GUARDAR OPERADOR"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
