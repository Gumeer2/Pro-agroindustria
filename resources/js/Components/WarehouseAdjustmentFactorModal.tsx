import React, { Fragment, useState, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { SlidersHorizontal, X, Save, Database, ArrowRight } from "lucide-react";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productName: string; // e.g. "Urea Agrícola"
    productType: "agricola" | "industrial" | "automotriz" | "importada" | "dap";
    postRoute: string; // e.g. route('apt.inventory.urea.adjustment.store')
    plantOptions?: string[];
    currentStockByWarehouse?: { [key: string]: { name: string; total_tons: number } };
    totalGlobalStock?: number;
    onSuccess?: () => void;
}

export default function WarehouseAdjustmentFactorModal({
    isOpen,
    onClose,
    productName,
    productType,
    postRoute,
    plantOptions = ["UREA 1", "UREA 2"],
    currentStockByWarehouse = {},
    totalGlobalStock,
    onSuccess,
}: Props) {
    const today = new Date().toISOString().split("T")[0];

    const [warehouse, setWarehouse] = useState<string>("Almacen 1");
    const [cubicle, setCubicle] = useState<string>("");
    const [plantOrigin, setPlantOrigin] = useState<string>(plantOptions[0] || "UREA 1");
    const [date, setDate] = useState<string>(today);
    const [adjustmentType, setAdjustmentType] = useState<"decrease" | "increase">("decrease");
    const [rawTons, setRawTons] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Current stock of selected warehouse
    const currentStock = useMemo(() => {
        const found = currentStockByWarehouse[warehouse];
        return found ? Number(found.total_tons || 0) : 0;
    }, [currentStockByWarehouse, warehouse]);

    // Signed adjustment tons
    const signedTons = useMemo(() => {
        const parsed = parseFloat(rawTons);
        if (isNaN(parsed) || parsed <= 0) return 0;
        return adjustmentType === "decrease" ? -parsed : parsed;
    }, [rawTons, adjustmentType]);

    const projectedStock = useMemo(() => {
        return currentStock + signedTons;
    }, [currentStock, signedTons]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const tonsVal = parseFloat(rawTons);
        if (isNaN(tonsVal) || tonsVal <= 0) {
            Swal.fire({
                icon: "warning",
                title: "Cantidad Inválida",
                text: "Por favor ingrese una cantidad en toneladas mayor a 0 para el factor de ajuste.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        if (!notes.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Motivo Requerido",
                text: "Por favor indique el motivo u observación del ajuste de inventario.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        setIsSubmitting(true);

        router.post(
            postRoute,
            {
                date,
                warehouse,
                cubicle: warehouse === "Almacen 5" ? (cubicle || null) : null,
                plant_origin: plantOrigin,
                adjustment_tons: signedTons,
                notes: notes.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                    setRawTons("");
                    setNotes("");
                    Swal.fire({
                        icon: "success",
                        title: "Factor de Ajuste Aplicado",
                        text: `El ajuste de ${signedTons > 0 ? "+" : ""}${signedTons.toFixed(3)} TM ha sido registrado en ${warehouse}.`,
                        timer: 2200,
                        showConfirmButton: false,
                    });
                    if (onSuccess) onSuccess();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const firstErr = Object.values(errors)[0] as string;
                    Swal.fire({
                        icon: "error",
                        title: "Error al registrar ajuste",
                        text: firstErr || "No se pudo registrar el factor de ajuste.",
                        confirmButtonColor: "#4f46e5",
                    });
                },
            }
        );
    };

    // Color theme matching the app's corporate look
    const themeStyles = useMemo(() => {
        switch (productType) {
            case "industrial":
                return {
                    headerGradient: "bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900",
                    badgeBg: "bg-blue-700/50",
                    subtitle: "text-blue-200",
                    focusRing: "focus:ring-blue-500 focus:border-blue-500",
                    btnSubmit: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
                };
            case "automotriz":
                return {
                    headerGradient: "bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950",
                    badgeBg: "bg-indigo-700/50",
                    subtitle: "text-indigo-200",
                    focusRing: "focus:ring-indigo-500 focus:border-indigo-500",
                    btnSubmit: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20",
                };
            case "importada":
                return {
                    headerGradient: "bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900",
                    badgeBg: "bg-purple-700/50",
                    subtitle: "text-purple-200",
                    focusRing: "focus:ring-purple-500 focus:border-purple-500",
                    btnSubmit: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20",
                };
            case "dap":
                return {
                    headerGradient: "bg-gradient-to-r from-amber-900 via-stone-900 to-slate-900",
                    badgeBg: "bg-amber-700/50",
                    subtitle: "text-amber-200",
                    focusRing: "focus:ring-amber-500 focus:border-amber-500",
                    btnSubmit: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
                };
            case "agricola":
            default:
                return {
                    headerGradient: "bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900",
                    badgeBg: "bg-purple-700/50",
                    subtitle: "text-purple-200",
                    focusRing: "focus:ring-purple-500 focus:border-purple-500",
                    btnSubmit: "bg-purple-700 hover:bg-purple-800 shadow-purple-600/20",
                };
        }
    }, [productType]);

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={() => !isSubmitting && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-gray-100">
                                {/* Corporate Header */}
                                <div className={`${themeStyles.headerGradient} px-6 py-5 text-white flex justify-between items-center`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2.5 ${themeStyles.badgeBg} rounded-xl`}>
                                            <SlidersHorizontal className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="font-bold text-lg leading-snug">
                                                Factor de Ajuste de Almacén
                                            </Dialog.Title>
                                            <p className={`${themeStyles.subtitle} text-xs mt-0.5`}>
                                                {productName} · Conciliación y balance de existencias
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                        className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    {/* Warehouse & Plant */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Almacén <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={warehouse}
                                                onChange={(e) => setWarehouse(e.target.value)}
                                                className={`w-full rounded-xl border-gray-300 text-sm font-medium bg-white ${themeStyles.focusRing}`}
                                                required
                                            >
                                                <option value="Almacen 1">Almacén 01</option>
                                                <option value="Almacen 2">Almacén 02</option>
                                                <option value="Almacen 3">Almacén 03</option>
                                                <option value="Almacen 4">Almacén 04</option>
                                                <option value="Almacen 5">Almacén 05</option>
                                            </select>
                                        </div>

                                        {warehouse === "Almacen 5" ? (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                                    Cubículo
                                                </label>
                                                <select
                                                    value={cubicle}
                                                    onChange={(e) => setCubicle(e.target.value)}
                                                    className={`w-full rounded-xl border-gray-300 text-sm font-medium bg-white ${themeStyles.focusRing}`}
                                                >
                                                    <option value="">General (Todos)</option>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                                                        <option key={c} value={`Cubiculo ${c}`}>
                                                            Cubículo {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                                    Planta / Origen <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={plantOrigin}
                                                    onChange={(e) => setPlantOrigin(e.target.value)}
                                                    className={`w-full rounded-xl border-gray-300 text-sm font-medium bg-white ${themeStyles.focusRing}`}
                                                    required
                                                >
                                                    {plantOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Date & Type Selector */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Fecha de Aplicación <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className={`w-full rounded-xl border-gray-300 text-sm font-medium ${themeStyles.focusRing}`}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Sentido del Ajuste <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setAdjustmentType("decrease")}
                                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                                                        adjustmentType === "decrease"
                                                            ? "bg-white text-rose-700 shadow-xs border border-gray-200"
                                                            : "text-gray-600 hover:text-gray-900"
                                                    }`}
                                                >
                                                    Deducción (−)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAdjustmentType("increase")}
                                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                                                        adjustmentType === "increase"
                                                            ? "bg-white text-emerald-700 shadow-xs border border-gray-200"
                                                            : "text-gray-600 hover:text-gray-900"
                                                    }`}
                                                >
                                                    Incremento (+)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity in Tons */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Cantidad del Ajuste (TM) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                required
                                                placeholder="0.000"
                                                value={rawTons}
                                                onChange={(e) => setRawTons(e.target.value)}
                                                className={`w-full pr-12 rounded-xl border-gray-300 text-base font-bold text-gray-900 ${themeStyles.focusRing}`}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-gray-400">
                                                TM
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Summary Table */}
                                    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Database className="w-3.5 h-3.5 text-gray-400" />
                                                Stock actual en {warehouse}:
                                            </span>
                                            <span className="font-bold text-gray-800">
                                                {currentStock.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span className="font-medium">Ajuste a aplicar:</span>
                                            <span className={`font-bold ${signedTons < 0 ? "text-rose-600" : signedTons > 0 ? "text-emerald-600" : "text-gray-500"}`}>
                                                {signedTons > 0 ? "+" : ""}{signedTons.toFixed(3)} TM
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold">
                                            <span className="text-gray-800">Stock resultante en {warehouse}:</span>
                                            <span className={`text-sm ${projectedStock < 0 ? "text-rose-600 font-extrabold" : "text-gray-900"}`}>
                                                {projectedStock.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM
                                            </span>
                                        </div>
                                        {totalGlobalStock !== undefined && (
                                            <div className="pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Stock Neto Total Global (Todos los almacenes):</span>
                                                <span className="font-semibold text-gray-700">
                                                    {(totalGlobalStock + signedTons).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Observation */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Motivo / Justificación <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            required
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Describa el motivo del ajuste (ej. ajuste por merma, barrido, diferencia de cubicación)..."
                                            className={`w-full rounded-xl border-gray-300 text-xs text-gray-800 ${themeStyles.focusRing}`}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSubmitting}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`inline-flex items-center px-6 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 ${themeStyles.btnSubmit}`}
                                        >
                                            <Save className="w-4 h-4 mr-1.5" />
                                            {isSubmitting ? "Guardando..." : "Guardar Ajuste"}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
