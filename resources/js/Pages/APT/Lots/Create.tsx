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
    FileText,
    Package,
    Layers,
    Sparkles,
} from "lucide-react";
import { FormEventHandler, useEffect } from "react";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";

export default function Create({
    auth,
    consecutives = {
        "Almacen 1": { UA: "012", UI: "003" },
        "Almacen 2": { UA: "008", UI: "003" },
        "Almacen 3": { UA: "007", UI: "003" },
        "Almacen 4": { UA: "001", UI: "003" },
        "Almacen 5": { UA: "001", UI: "003" },
    },
}: {
    auth: any;
    consecutives?: Record<string, any>;
}) {
    const initialCreatedAt = new Date().toISOString().substring(0, 16);
    const initialWarehouse = "Almacen 1";
    const initialPlant = "UREA 1";
    const initialProduct = "UA (UREA AGRICOLA)";
    const initialCeldas = "";

    const getConsecutive = (warehouseVal: string, productVal: string) => {
        const prodCode = productVal?.includes("UI") ? "UI" : "UA";
        const whData = consecutives ? consecutives[warehouseVal] : null;
        if (whData && typeof whData === "object") {
            return whData[prodCode] || whData["UA"] || "001";
        }
        if (typeof whData === "string") {
            return whData;
        }
        return "001";
    };

    const calculateFolio = (
        productVal: string,
        plantVal: string,
        warehouseVal: string,
        celdasVal: string,
        dateVal: string
    ) => {
        const dateObj = dateVal ? new Date(dateVal) : new Date();
        const year = isNaN(dateObj.getFullYear()) ? new Date().getFullYear() : dateObj.getFullYear();
        const plantCode = plantVal === "UREA 2" ? "U2" : "U1";
        const whMatch = (warehouseVal || "").match(/\d+/);
        const aptCode = `APT${whMatch ? whMatch[0] : "1"}`;
        const prodCode = productVal?.includes("UI") ? "UI" : (productVal?.includes("UA") ? "UA" : (productVal || "UA").trim());
        const cleanCells = (celdasVal || "").trim().replace(/^\(+|\)+$/g, "").toUpperCase();
        const cellsPart = cleanCells ? `(${cleanCells})` : "";
        const cons = getConsecutive(warehouseVal, productVal);
        return `PA${year}-${plantCode}-${aptCode}-${prodCode}${cellsPart}-${cons}`;
    };

    const { data, setData, post, processing, errors } = useForm({
        folio: calculateFolio(initialProduct, initialPlant, initialWarehouse, initialCeldas, initialCreatedAt),
        warehouse: initialWarehouse,
        cubicle: "",
        plant_origin: initialPlant,
        product: initialProduct,
        celdas: initialCeldas,
        observations: "",
        created_at: initialCreatedAt,
    });

    // Keep folio updated if inputs change
    useEffect(() => {
        const autoFolio = calculateFolio(
            data.product,
            data.plant_origin,
            data.warehouse,
            data.celdas,
            data.created_at
        );
        if (data.folio !== autoFolio) {
            setData("folio", autoFolio);
        }
    }, [data.product, data.plant_origin, data.warehouse, data.celdas, data.created_at, consecutives]);

    const updateProduct = (newProduct: string) => {
        setData((prev) => ({
            ...prev,
            product: newProduct,
            folio: calculateFolio(newProduct, prev.plant_origin, prev.warehouse, prev.celdas, prev.created_at),
        }));
    };

    const updatePlant = (newPlant: string) => {
        setData((prev) => ({
            ...prev,
            plant_origin: newPlant,
            folio: calculateFolio(prev.product, newPlant, prev.warehouse, prev.celdas, prev.created_at),
        }));
    };

    const updateWarehouse = (newWarehouse: string) => {
        setData((prev) => ({
            ...prev,
            warehouse: newWarehouse,
            folio: calculateFolio(prev.product, prev.plant_origin, newWarehouse, prev.celdas, prev.created_at),
        }));
    };

    const updateCeldas = (newCeldas: string) => {
        setData((prev) => ({
            ...prev,
            celdas: newCeldas,
            folio: calculateFolio(prev.product, prev.plant_origin, prev.warehouse, newCeldas, prev.created_at),
        }));
    };

    const updateCreatedAt = (newDate: string) => {
        setData((prev) => ({
            ...prev,
            created_at: newDate,
            folio: calculateFolio(prev.product, prev.plant_origin, prev.warehouse, prev.celdas, newDate),
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("apt.lots.store"));
    };

    return (
        <DashboardLayout user={auth.user} header="Nuevo Lote">
            <Head title="Crear Lote" />

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
                                    Nuevo Lote
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Registro de inventario y ubicación
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
                                <div className="flex items-center justify-between mb-1">
                                    <InputLabel value="Nombre del Lote / Folio" className="text-gray-700 font-bold" />
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                        Automático ({getConsecutive(data.warehouse, data.product)})
                                    </span>
                                </div>
                                <div className="relative">
                                    <TextInput
                                        value={data.folio}
                                        readOnly
                                        tabIndex={-1}
                                        className="w-full pl-10 font-bold font-mono text-indigo-950 bg-gray-100 border-gray-300 cursor-not-allowed select-all focus:border-gray-300 focus:ring-0 shadow-sm"
                                        placeholder="Generando folio automáticamente..."
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
                                        onChange={(e) => updateCreatedAt(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10"
                                    />
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.created_at} className="mt-2" />
                            </div>

                            {/* Producto */}
                            <div>
                                <InputLabel value="Producto" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <select
                                        value={data.product}
                                        onChange={(e) => updateProduct(e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white font-medium text-gray-800"
                                    >
                                        <option value="UA (UREA AGRICOLA)">UA (UREA AGRICOLA)</option>
                                        <option value="UI (UREA INDUSTRIAL)">UI (UREA INDUSTRIAL)</option>
                                    </select>
                                    <Package className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.product} className="mt-2" />
                            </div>

                            {/* Celdas */}
                            <div>
                                <InputLabel value="Celdas" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <TextInput
                                        value={data.celdas}
                                        onChange={(e) => updateCeldas(e.target.value)}
                                        className="w-full pl-10 font-bold text-gray-800 focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Ej: Celda 1, Celda 2..."
                                    />
                                    <Layers className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                <InputError message={errors.celdas} className="mt-2" />
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
                                        onChange={(e) => updatePlant(e.target.value)}
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
                                        onChange={(e) => updateWarehouse(e.target.value)}
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

                            {/* Observations */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                                    <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                    Observaciones
                                </h4>
                                <InputLabel value="Observaciones" className="mb-1 text-gray-700 font-bold" />
                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        value={data.observations}
                                        onChange={(e) => setData("observations", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 text-gray-800 placeholder-gray-400"
                                        placeholder="Ingrese observaciones del lote (se concatenarán en el ticket de báscula)..."
                                    />
                                </div>
                                <InputError message={errors.observations} className="mt-2" />
                            </div>

                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-gray-500 text-sm italic">
                                Usuario: <span className="font-bold text-indigo-600">{auth.user.name}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {processing ? "Guardando..." : "GUARDAR LOTE"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
