import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    UserPlus,
    ArrowLeft,
    Save,
    Truck,
    FileText,
    User,
    Hash,
    CreditCard,
    Box,
} from "lucide-react";
import { useEffect } from "react";

interface Vessel {
    id: string;
    name: string;
    origin?: string;
    is_active: boolean;
}

interface Operator {
    id: number;
    vessel_id: string;
    operator_name: string;
    transporter_line: string;
    unit_type: string;
    brand_model?: string;
    trailer_plate?: string;
    economic_number: string;
    tractor_plate: string;
    vessel: Vessel;
}

interface PageProps {
    auth: {
        user: any;
    };
    operator: Operator;
    vessels: Vessel[];
}

export default function Edit({ auth, operator, vessels }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        vessel_id: operator.vessel_id,
        operator_name: operator.operator_name,
        transporter_line: operator.transporter_line,
        unit_type: operator.unit_type,
        brand_model: operator.brand_model || "",
        trailer_plate: operator.trailer_plate || "",
        economic_number: operator.economic_number,
        tractor_plate: operator.tractor_plate,
    });

    const isVesselInactive = operator.vessel && !operator.vessel.is_active;

    useEffect(() => {
        if (data.unit_type === "VOLTEO") {
            setData("trailer_plate", "");
        }
    }, [data.unit_type]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("documentation.operators.update", operator.id));
    };

    return (
        <DashboardLayout user={auth.user} header="Edición de Operador">
            <Head title="Editar Operador" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("documentation.operators.index")}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver a la Lista
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header: Indigo Gradient */}
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">
                                    Editar Operador #{operator.id}
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Actualice los datos del conductor y unidad
                                </p>
                            </div>
                        </div>
                    </div>

                    {isVesselInactive && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-yellow-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.514 2.625H3.72c-1.347 0-2.187-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-bold text-yellow-800">
                                        BARCO ARCHIVADO / ZARPADO
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            Este barco ya ha zarpado. No se
                                            permite editar la información de sus
                                            operadores para mantener la
                                            integridad de los datos históricos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="p-8">
                        {/* Section: Vinculación - Indigo Theme */}
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
                                        {vessels.map((v: Vessel) => (
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
                            {/* Button: Green Theme */}
                            <button
                                type="submit"
                                disabled={processing || isVesselInactive}
                                className={`inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white transition-all transform ${processing || isVesselInactive
                                        ? "bg-gray-400 cursor-not-allowed opacity-60"
                                        : "bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-green-200"
                                    }`}
                            >
                                <Save className="w-6 h-6 mr-2" />
                                {processing
                                    ? "Guardando..."
                                    : "GUARDAR CAMBIOS"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
