import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Anchor,
    Save,
    ArrowLeft,
    Ruler,
    Calendar,
    Ship,
    FileText,
    Briefcase,
    Navigation,
    LayoutGrid,
} from "lucide-react";
import { useEffect } from "react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import Swal from "sweetalert2";

export default function CreateVessel({
    auth,
    products,
    clients,
}: {
    auth: any;
    products: any[];
    clients: any[];
}) {
    const { data, setData, post, processing, errors } = useForm({
        vessel_type: "M/V",
        name: "",
        nationality: "",
        imo_number: "",
        registration_number: "",
        client_id: "",

        eta: "",
        external_dock_arrival_date: "",
        external_dock_arrival_time: "",
        external_dock_departure_date: "",
        external_dock_departure_time: "",
        docking_date: "",
        docking_time: "",
        dock: "",

        length: "",
        beam: "",
        draft: "",

        operation_type: "Resguardo",
        destination_port: "", // For Carga
        origin_port: "", // For Descarga
        loading_port: "", // For Descarga

        product_id: "",
        programmed_tonnage: "",

        importer: "",
        consignee_agency: "",
        customs_agency: "",

        stay_days: "",
        etc: "",
        departure_date: "",
        observations: "",
        apt_operation_type: "scale", // Default
        holds: [] as { hold_number: number; tonnage: string }[],
        has_chief_foreman: false,
        is_external_warehouse: false,
    });

    // Reset fields if operation type changes
    useEffect(() => {
        if (
            data.operation_type !== "Descarga" &&
            data.operation_type !== "Carga"
        ) {
            setData((data) => ({
                ...data,
                product_id: "",
                programmed_tonnage: "",
                origin_port: "",
                loading_port: "",
            }));
        }
        if (data.operation_type !== "Carga") {
            setData((data) => ({ ...data, destination_port: "" }));
        }
    }, [data.operation_type]);


    // Auto-calculate ETC when Docking Date (ETB) or Stay Days change
    // Auto-calculate ETC when Docking Date (ETB), ETA or Stay Days change
    useEffect(() => {
        const baseDateString = data.docking_date || data.eta;

        if (baseDateString && data.stay_days) {
            const baseDate = new Date(baseDateString + "T00:00:00");
            const days = parseInt(data.stay_days.toString());

            if (!isNaN(baseDate.getTime()) && !isNaN(days)) {
                baseDate.setDate(baseDate.getDate() + days);
                // Format to YYYY-MM-DD
                const etc = baseDate.toISOString().split("T")[0];
                setData((prevData) => ({
                    ...prevData,
                    etc: etc,
                    // departure_date: etc, // REMOVED: Departure date is manual
                }));
            }
        }
    }, [data.docking_date, data.eta, data.stay_days]);



    // Vessel Holds Logic
    const handleHoldsCountChange = (count: number) => {
        const newHolds = [...data.holds];
        if (count > newHolds.length) {
            for (let i = newHolds.length + 1; i <= count; i++) {
                newHolds.push({ hold_number: i, tonnage: "" });
            }
        } else {
            newHolds.splice(count);
        }
        setData("holds", newHolds);
    };

    const handleHoldTonnageChange = (index: number, value: string) => {
        const newHolds = [...data.holds];
        newHolds[index].tonnage = value;
        setData("holds", newHolds);
    };

    const totalHoldTonnage = data.holds.reduce((acc, hold) => acc + (parseFloat(hold.tonnage) || 0), 0);
    const isTonnageMismatch = data.holds.length > 0 &&
        (data.operation_type === "Descarga" || data.operation_type === "Carga") &&
        Math.abs(totalHoldTonnage - (parseFloat(data.programmed_tonnage) || 0)) > 0.01;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isTonnageMismatch) {
            Swal.fire({
                title: '<span style="color: #ef4444; font-weight: 700;">Desfase de Tonelaje</span>',
                html: `
                    <div style="text-align: left;">
                        <p style="color: #4b5563;">La suma del peso en las bodegas (<b>${totalHoldTonnage.toFixed(2)} TM</b>) no coincide con el tonelaje programado (<b>${data.programmed_tonnage} TM</b>).</p>
                        <p style="color: #ef4444; font-weight: bold; margin-top: 10px;">Diferencia: ${(totalHoldTonnage - (parseFloat(data.programmed_tonnage) || 0)).toFixed(2)} TM</p>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 10px;">Por favor ajuste los pesos antes de continuar.</p>
                    </div>
                `,
                icon: "warning",
                iconColor: "#f59e0b",
                confirmButtonColor: "#4f46e5",
                confirmButtonText: "Entendido",
            });
            return;
        }

        post(route("dock.vessel.store"), {
            onSuccess: () => {
                Swal.fire({
                    title: '<span style="color: #4f46e5; font-weight: 700;">¡Registro Exitoso!</span>',
                    html: `<p style="color: #4b5563;">El buque <b>${data.name}</b> ha sido registrado correctamente.</p>`,
                    icon: "success",
                    iconColor: "#10b981",
                    confirmButtonColor: "#4f46e5",
                    confirmButtonText: "Entendido",
                    background: "#ffffff",
                    customClass: {
                        popup: "rounded-2xl border border-gray-100 shadow-2xl",
                        confirmButton:
                            "rounded-xl px-8 py-3 font-bold transition-all hover:scale-105 active:scale-95",
                    },
                });
            },
            onError: (errors: any) => {
                let errorDetails = "";

                // Mapa de traducción para campos
                const fieldNames: { [key: string]: string } = {
                    name: "Nombre del Buque",
                    client_id: "Cliente",
                    product_id: "Producto",
                    operation_type: "Tipo de Operación",
                    origin_port: "Puerto de Origen",
                    loading_port: "Puerto de Carga",
                    destination_port: "Puerto de Destino",
                    programmed_tonnage: "Tonelaje Programado",
                    eta: "ETA",
                    dock: "Muelle",
                    vessel_type: "Tipo de Buque",
                    stay_days: "Días de Estadía",
                    error: "Error General",
                };

                // Concatenar todos los errores encontrados
                Object.keys(errors).forEach((key) => {
                    const translatedKey =
                        fieldNames[key] || key.replace("_", " ");
                    errorDetails += `<li><b>${translatedKey}:</b> ${errors[key]}</li>`;
                });

                Swal.fire({
                    title: '<span style="color: #ef4444; font-weight: 700;">Error en el Registro</span>',
                    html: `
                        <div style="text-align: left; margin-top: 10px;">
                            <p style="color: #4b5563; margin-bottom: 10px;">No se pudo completar el registro debido a los siguientes motivos:</p>
                            <ul style="color: #ef4444; font-size: 0.875rem; list-style-type: disc; padding-left: 20px;">
                                ${errorDetails || "<li>Revisa los campos marcados en rojo.</li>"}
                            </ul>
                        </div>
                    `,
                    icon: "error",
                    iconColor: "#ef4444",
                    confirmButtonColor: "#4f46e5",
                    confirmButtonText: "Corregir Datos",
                    background: "#ffffff",
                    customClass: {
                        popup: "rounded-2xl border border-gray-100 shadow-2xl",
                        confirmButton:
                            "rounded-xl px-8 py-3 font-bold transition-all hover:scale-105 active:scale-95",
                    },
                });
            },
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Registro de Barco">
            <Head title="Nuevo Barco" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("dock.index", { tab: "gestion" })}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al menú
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-indigo-700 rounded-xl mr-4 shadow-inner">
                                <Anchor className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-2xl">
                                    Registro de Barco
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Ingrese los datos del buque y la operación
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Global Error Banner */}
                    {(errors as any).error && (
                        <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">
                                        {(errors as any).error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="p-8 space-y-8">
                        {/* Section 1: Vessel Identification */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Ship className="w-5 h-5 mr-3" />
                                1. Identificación del Buque
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel value="Tipo de Buque" />
                                    <select
                                        value={data.vessel_type}
                                        onChange={(e) =>
                                            setData(
                                                "vessel_type",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1"
                                    >
                                        <option value="M/V">M/V</option>
                                        <option value="B/T">B/T</option>
                                    </select>
                                    {errors.vessel_type && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.vessel_type}
                                        </p>
                                    )}
                                </div>

                                {/* Mode Selectors */}
                                <div className="md:col-span-1 flex items-end">
                                    <div className={`w-full p-4 rounded-xl border transition-all duration-500 flex items-center justify-between group ${data.has_chief_foreman
                                        ? "bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 shadow-md"
                                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors duration-500 ${data.has_chief_foreman ? "bg-orange-500 text-white shadow-lg" : "bg-gray-200 text-gray-500"}`}>
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-wider transition-colors duration-500 ${data.has_chief_foreman ? "text-orange-700" : "text-gray-400 group-hover:text-gray-600"}`}>
                                                    Chief Foreman
                                                </p>
                                                <p className="text-[10px] text-gray-400 leading-tight">Control Muelle</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newValue = !data.has_chief_foreman;
                                                if (newValue) {
                                                    Swal.fire({
                                                        title: '<span class="text-indigo-600 font-black">¿ACTIVAR MODO FOREMAN?</span>',
                                                        html: `<div class="text-left space-y-4"><div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100"><p class="text-sm text-indigo-800 leading-relaxed">Al activar este modo, el sistema <b>REQUERIRÁ</b> que las unidades pasen por muelle antes de descargar en APT.</p></div></div>`,
                                                        icon: "info",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Activar",
                                                        cancelButtonText: "No",
                                                        confirmButtonColor: "#4f46e5",
                                                    }).then((result: any) => { if (result.isConfirmed) setData("has_chief_foreman", true); });
                                                } else {
                                                    setData("has_chief_foreman", false);
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 ${data.has_chief_foreman ? "bg-orange-500" : "bg-gray-200"}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500 ${data.has_chief_foreman ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-1 flex items-end">
                                    <div className={`w-full p-4 rounded-xl border transition-all duration-500 flex items-center justify-between group ${data.is_external_warehouse
                                        ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 shadow-md"
                                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors duration-500 ${data.is_external_warehouse ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-200 text-gray-500"}`}>
                                                <LayoutGrid className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-wider transition-colors duration-500 ${data.is_external_warehouse ? "text-indigo-700" : "text-gray-400 group-hover:text-gray-600"}`}>
                                                    Almacén Externo
                                                </p>
                                                <p className="text-[10px] text-gray-400 leading-tight">Cliente / Báscula</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newValue = !data.is_external_warehouse;
                                                if (newValue) {
                                                    Swal.fire({
                                                        title: '<span class="text-indigo-600 font-black">¿ACTIVAR MODO EXTERNO?</span>',
                                                        html: `<div class="text-left space-y-4"><div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100"><p class="text-sm text-indigo-800 leading-relaxed">Al activar este modo, el sistema <b>OMITIRÁ</b> el escaneo en APT. Se asignará automáticamente "ALMACÉN CLIENTE" al operador.</p></div></div>`,
                                                        icon: "info",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Activar",
                                                        cancelButtonText: "No",
                                                        confirmButtonColor: "#4f46e5",
                                                    }).then((result: any) => { if (result.isConfirmed) setData("is_external_warehouse", true); });
                                                } else {
                                                    setData("is_external_warehouse", false);
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-500 ${data.is_external_warehouse ? "bg-indigo-600" : "bg-gray-200"}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-500 ${data.is_external_warehouse ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="md:col-span-1">
                                    <InputLabel value="Nombre del Buque" />
                                    <TextInput
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        className="w-full mt-1"
                                        placeholder="Ej. MSC ALEXANDRA"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Nacionalidad" />
                                    <TextInput
                                        value={data.nationality}
                                        onChange={(e) =>
                                            setData(
                                                "nationality",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.nationality && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.nationality}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="N# IMO" />
                                    <TextInput
                                        value={data.imo_number}
                                        onChange={(e) =>
                                            setData(
                                                "imo_number",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.imo_number && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.imo_number}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Matrícula" />
                                    <TextInput
                                        value={data.registration_number}
                                        onChange={(e) =>
                                            setData(
                                                "registration_number",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.registration_number && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.registration_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Technical Specs */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Ruler className="w-5 h-5 mr-3" />
                                2. Especificaciones Técnicas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel value="Eslora (m)" />
                                    <TextInput
                                        type="number"
                                        step="0.01"
                                        value={data.length}
                                        onChange={(e) =>
                                            setData("length", e.target.value)
                                        }
                                        onWheel={(e) =>
                                            (
                                                e.target as HTMLInputElement
                                            ).blur()
                                        }
                                        className="w-full mt-1"
                                        placeholder="0.00"
                                    />
                                    {errors.length && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.length}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Manga (m)" />
                                    <TextInput
                                        type="number"
                                        step="0.01"
                                        value={data.beam}
                                        onChange={(e) =>
                                            setData("beam", e.target.value)
                                        }
                                        onWheel={(e) =>
                                            (
                                                e.target as HTMLInputElement
                                            ).blur()
                                        }
                                        className="w-full mt-1"
                                        placeholder="0.00"
                                    />
                                    {errors.beam && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.beam}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Calado (m)" />
                                    <TextInput
                                        type="number"
                                        step="0.01"
                                        value={data.draft}
                                        onChange={(e) =>
                                            setData("draft", e.target.value)
                                        }
                                        onWheel={(e) =>
                                            (
                                                e.target as HTMLInputElement
                                            ).blur()
                                        }
                                        className="w-full mt-1"
                                        placeholder="0.00"
                                    />
                                    {errors.draft && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.draft}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Arrival Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Calendar className="w-5 h-5 mr-3" />
                                3. Datos de Arribo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <InputLabel value="Llegada Muelle Externo" />
                                    <TextInput
                                        type="date"
                                        value={data.external_dock_arrival_date}
                                        onChange={(e) =>
                                            setData("external_dock_arrival_date", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.external_dock_arrival_date && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.external_dock_arrival_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Hora Llegada M. Externo" />
                                    <TextInput
                                        type="time"
                                        value={data.external_dock_arrival_time}
                                        onChange={(e) =>
                                            setData("external_dock_arrival_time", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.external_dock_arrival_time && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.external_dock_arrival_time}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Salida Muelle Externo" />
                                    <TextInput
                                        type="date"
                                        value={data.external_dock_departure_date}
                                        onChange={(e) =>
                                            setData("external_dock_departure_date", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.external_dock_departure_date && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.external_dock_departure_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Hora Salida M. Externo" />
                                    <TextInput
                                        type="time"
                                        value={data.external_dock_departure_time}
                                        onChange={(e) =>
                                            setData("external_dock_departure_time", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.external_dock_departure_time && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.external_dock_departure_time}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <InputLabel value="ETA (Estimado Arribo)" />
                                    <TextInput
                                        type="date"
                                        value={data.eta}
                                        onChange={(e) =>
                                            setData("eta", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    {errors.eta && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.eta}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Fecha Atraco (ETB)" />
                                    <TextInput
                                        type="date"
                                        value={data.docking_date}
                                        onChange={(e) =>
                                            setData(
                                                "docking_date",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Puerto Proagro
                                    </p>
                                    {errors.docking_date && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.docking_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Hora Atraco" />
                                    <TextInput
                                        type="time"
                                        value={data.docking_time}
                                        onChange={(e) =>
                                            setData(
                                                "docking_time",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Puerto Proagro
                                    </p>
                                    {errors.docking_time && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.docking_time}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Muelle Asignado" />
                                    <select
                                        value={data.dock}
                                        onChange={(e) =>
                                            setData("dock", e.target.value)
                                        }
                                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1 ${errors.dock ? "border-red-500 ring-1 ring-red-500" : ""}`}
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="ECO">ECO</option>
                                        <option value="WHISKY">WHISKY</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Requerido para Status
                                    </p>
                                    {errors.dock && (
                                        <p className="text-red-500 text-xs mt-1 font-bold">
                                            {errors.dock}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* New Operation Type Buttons (Scale vs Burreo) */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <InputLabel
                                    value="Operación en APT"
                                    className="text-center mb-3 text-indigo-800 font-bold"
                                />
                                <div className="flex justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                "apt_operation_type",
                                                "scale",
                                            )
                                        }
                                        className={`flex-1 max-w-[200px] py-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                                            ${data.apt_operation_type ===
                                                "scale"
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-md ring-2 ring-indigo-500/20"
                                                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                                            }
                                        `}
                                    >
                                        <div
                                            className={`p-2 rounded-lg ${data.apt_operation_type === "scale" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                                        >
                                            <Save className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-sm">
                                            DESCARGA BASCULA
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData(
                                                "apt_operation_type",
                                                "burreo",
                                            )
                                        }
                                        className={`flex-1 max-w-[200px] py-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                                            ${data.apt_operation_type ===
                                                "burreo"
                                                ? "border-orange-500 bg-orange-50 text-orange-800 shadow-md ring-2 ring-orange-500/20"
                                                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                                            }
                                        `}
                                    >
                                        <div
                                            className={`p-2 rounded-lg ${data.apt_operation_type === "burreo" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
                                        >
                                            <Ship className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-sm">
                                            BURREO
                                        </span>
                                    </button>
                                </div>
                                {errors.apt_operation_type && (
                                    <p className="text-red-500 text-xs mt-2 text-center font-bold">
                                        {errors.apt_operation_type}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Operation & Clients */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Briefcase className="w-5 h-5 mr-3" />
                                4. Detalles de la Operación
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <InputLabel value="Cliente" />
                                    <select
                                        value={data.client_id}
                                        onChange={(e) =>
                                            setData("client_id", e.target.value)
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1"
                                    >
                                        <option value="">
                                            Seleccione Cliente...
                                        </option>
                                        {(clients || []).map((c: any) => (
                                            <option key={c.id} value={c.id}>
                                                {c.business_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.client_id && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.client_id}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="Tipo de Operación" />
                                    <select
                                        value={data.operation_type}
                                        onChange={(e) =>
                                            setData(
                                                "operation_type",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1"
                                    >
                                        <option value="Resguardo">
                                            Resguardo
                                        </option>
                                        <option value="Descarga">
                                            Descarga
                                        </option>
                                        <option value="Carga">Carga</option>
                                    </select>
                                    {errors.operation_type && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.operation_type}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Conditional Fields based on Operation Type */}
                            {data.operation_type === "Descarga" && (
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value="Puerto de Origen" />
                                        <TextInput
                                            value={data.origin_port}
                                            onChange={(e) =>
                                                setData(
                                                    "origin_port",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full mt-1"
                                        />
                                        {errors.origin_port && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.origin_port}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <InputLabel value="Puerto de Carga" />
                                        <TextInput
                                            value={data.loading_port}
                                            onChange={(e) =>
                                                setData(
                                                    "loading_port",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full mt-1"
                                        />
                                        {errors.loading_port && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.loading_port}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <InputLabel value="Producto" />
                                        <select
                                            value={data.product_id}
                                            onChange={(e) =>
                                                setData(
                                                    "product_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1 bg-white"
                                        >
                                            <option value="">
                                                Seleccione...
                                            </option>
                                            {products.map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.product_id && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.product_id}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <InputLabel value="Toneladas Programadas" />
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            value={data.programmed_tonnage}
                                            onChange={(e) =>
                                                setData(
                                                    "programmed_tonnage",
                                                    e.target.value,
                                                )
                                            }
                                            onWheel={(e) =>
                                                (
                                                    e.target as HTMLInputElement
                                                ).blur()
                                            }
                                            className="w-full mt-1"
                                        />
                                        {errors.programmed_tonnage && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.programmed_tonnage}
                                            </p>
                                        )}
                                    </div>

                                    {/* Holds Distribution */}
                                    <div className="md:col-span-2 pt-4 border-t border-blue-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <InputLabel value="Número de Bodegas" />
                                                <select
                                                    value={data.holds.length}
                                                    onChange={(e) => handleHoldsCountChange(parseInt(e.target.value))}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1 bg-white"
                                                >
                                                    <option value="0">Sin Bodegas</option>
                                                    <option value="1">1 Bodega</option>
                                                    <option value="2">2 Bodegas</option>
                                                    <option value="3">3 Bodegas</option>
                                                    <option value="4">4 Bodegas</option>
                                                    <option value="5">5 Bodegas</option>
                                                    <option value="6">6 Bodegas</option>
                                                </select>
                                            </div>
                                        </div>

                                        {data.holds.length > 0 && (
                                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-indigo-900 font-bold uppercase tracking-wider">Resumen de Bodegas</p>
                                                    <p className="text-xs text-indigo-600">Suma total asignada a bodegas</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black ${isTonnageMismatch ? 'text-red-600' : 'text-green-600'}`}>
                                                        {totalHoldTonnage.toFixed(2)} / {data.programmed_tonnage || '0'} <small className="text-xs">TM</small>
                                                    </p>
                                                    {isTonnageMismatch && (
                                                        <p className="text-[10px] text-red-500 font-bold animate-pulse">EL TONELAJE NO COINCIDE</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {data.holds.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                                {data.holds.map((hold: any, idx: number) => (
                                                    <div key={idx}>
                                                        <InputLabel value={`Bodega ${hold.hold_number}`} />
                                                        <div className="relative mt-1">
                                                            <TextInput
                                                                type="number"
                                                                step="0.01"
                                                                value={hold.tonnage}
                                                                onChange={(e) => handleHoldTonnageChange(idx, e.target.value)}
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                                className="w-full pr-12"
                                                                placeholder="0.00"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="text-gray-500 font-bold text-xs">TM</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {data.operation_type === "Carga" && (
                                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 mb-6 space-y-6">
                                    <div>
                                        <InputLabel value="Puerto de Destino" />
                                        <TextInput
                                            value={data.destination_port}
                                            onChange={(e) =>
                                                setData(
                                                    "destination_port",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full mt-1"
                                        />
                                        {errors.destination_port && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.destination_port}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value="Producto" />
                                            <select
                                                value={data.product_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "product_id",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1 bg-white"
                                            >
                                                <option value="">
                                                    Seleccione...
                                                </option>
                                                {products.map((p: any) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.product_id && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.product_id}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <InputLabel value="Toneladas Programadas" />
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                value={data.programmed_tonnage}
                                                onChange={(e) =>
                                                    setData(
                                                        "programmed_tonnage",
                                                        e.target.value,
                                                    )
                                                }
                                                onWheel={(e) =>
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).blur()
                                                }
                                                className="w-full mt-1"
                                            />
                                            {errors.programmed_tonnage && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.programmed_tonnage}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Holds Distribution */}
                                    <div className="pt-4 border-t border-orange-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <InputLabel value="Número de Bodegas" />
                                                <select
                                                    value={data.holds.length}
                                                    onChange={(e) => handleHoldsCountChange(parseInt(e.target.value))}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1 bg-white"
                                                >
                                                    <option value="0">Sin Bodegas</option>
                                                    <option value="1">1 Bodega</option>
                                                    <option value="2">2 Bodegas</option>
                                                    <option value="3">3 Bodegas</option>
                                                    <option value="4">4 Bodegas</option>
                                                    <option value="5">5 Bodegas</option>
                                                    <option value="6">6 Bodegas</option>
                                                </select>
                                            </div>
                                        </div>

                                        {data.holds.length > 0 && (
                                            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-orange-900 font-bold uppercase tracking-wider">Resumen de Bodegas</p>
                                                    <p className="text-xs text-orange-600">Suma total asignada a bodegas</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black ${isTonnageMismatch ? 'text-red-700' : 'text-green-600'}`}>
                                                        {totalHoldTonnage.toFixed(2)} / {data.programmed_tonnage || '0'} <small className="text-xs">TM</small>
                                                    </p>
                                                    {isTonnageMismatch && (
                                                        <p className="text-[10px] text-red-500 font-bold animate-pulse">EL TONELAJE NO COINCIDE</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {data.holds.length > 0 && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                                {data.holds.map((hold: any, idx: number) => (
                                                    <div key={idx}>
                                                        <InputLabel value={`Bodega ${hold.hold_number}`} />
                                                        <div className="relative mt-1">
                                                            <TextInput
                                                                type="number"
                                                                step="0.01"
                                                                value={hold.tonnage}
                                                                onChange={(e) => handleHoldTonnageChange(idx, e.target.value)}
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                                className="w-full pr-12"
                                                                placeholder="0.00"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <span className="text-gray-500 font-bold text-xs">TM</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 5: Agencies & Logistics */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <FileText className="w-5 h-5 mr-3" />
                                5. Agencias y Logística
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel value="Importador" />
                                    <TextInput
                                        value={data.importer}
                                        onChange={(e) =>
                                            setData("importer", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Agencia Consignataria" />
                                    <TextInput
                                        value={data.consignee_agency}
                                        onChange={(e) =>
                                            setData(
                                                "consignee_agency",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Agencia Aduanal" />
                                    <TextInput
                                        value={data.customs_agency}
                                        onChange={(e) =>
                                            setData(
                                                "customs_agency",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Planning & Departure */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="text-indigo-800 font-bold mb-6 flex items-center text-lg bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                <Navigation className="w-5 h-5 mr-3" />
                                6. Planificación y Salida
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel value="Días de Estadía" />
                                    <TextInput
                                        type="number"
                                        value={data.stay_days}
                                        onChange={(e) =>
                                            setData("stay_days", e.target.value)
                                        }
                                        onWheel={(e) =>
                                            (
                                                e.target as HTMLInputElement
                                            ).blur()
                                        }
                                        className="w-full mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Días de estadía programados
                                    </p>
                                    {errors.stay_days && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.stay_days}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <InputLabel value="ETC (Estimado Final)" />
                                    <TextInput
                                        type="date"
                                        value={data.etc}
                                        onChange={(e) =>
                                            setData("etc", e.target.value)
                                        }
                                        className="w-full mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Opcional
                                    </p>
                                </div>
                                <div>
                                    <InputLabel value="Fecha de Salida" />
                                    <TextInput
                                        type="date"
                                        value={data.departure_date}
                                        onChange={(e) =>
                                            setData(
                                                "departure_date",
                                                e.target.value,
                                            )
                                        }
                                        className="w-full mt-1 bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Llenar al zarpe
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <InputLabel value="Observaciones" />
                                <textarea
                                    value={data.observations}
                                    onChange={(e) =>
                                        setData("observations", e.target.value)
                                    }
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 mt-1"
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <PrimaryButton
                                disabled={processing}
                                className="w-full md:w-auto h-12 px-8 text-base bg-green-600 hover:bg-green-700 shadow-lg transform transition hover:scale-[1.02]"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing
                                    ? "Guardando Registro..."
                                    : "Guardar Barco"}
                            </PrimaryButton>
                        </div>
                    </form>

                    {/* Footer Legend */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-gray-500 flex justify-center space-x-8 font-medium">
                        <span>
                            <strong className="text-indigo-700">ETA:</strong>{" "}
                            TIEMPO ESTIMADO DE ARRIBO
                        </span>
                        <span>
                            <strong className="text-indigo-700">ETB:</strong>{" "}
                            TIEMPO ESTIMADO DE ATRAQUE
                        </span>
                        <span>
                            <strong className="text-indigo-700">ETC:</strong>{" "}
                            TIEMPO ESTIMADO DE FINALIZACION
                        </span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
