import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm } from "@inertiajs/react";
import {
    Anchor,
    Calculator,
    Save,
    Ship,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
} from "lucide-react";
import { Link } from "@inertiajs/react";

interface Vessel {
    id: string;
    name: string;
    provisional_burreo_weight: number | null;
    draft_weight: number | null;
    client?: { name: string };
    product?: { name: string };
}

interface Props {
    auth: any;
    vessels: Vessel[];
}

export default function BurreoWeightManager({ auth, vessels }: Props) {
    const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

    const provisionalForm = useForm({
        provisional_burreo_weight: 0,
    });

    const draftForm = useForm({
        draft_weight: 0,
    });

    const handleSelectVessel = (vessel: Vessel) => {
        setSelectedVessel(vessel);
        provisionalForm.setData(
            "provisional_burreo_weight",
            (vessel.provisional_burreo_weight || 0) / 1000,
        );
        draftForm.setData("draft_weight", (vessel.draft_weight || 0) / 1000);
    };

    const submitProvisional = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVessel) return;

        provisionalForm.post(
            route("traffic.burreo.provisional", selectedVessel.id),
            {
                onSuccess: () => {
                    // Update local state or just rely on Inertia reload
                },
            },
        );
    };

    const submitDraft = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVessel) return;

        draftForm.post(route("traffic.burreo.draft", selectedVessel.id), {
            onSuccess: () => {
                // Update local state or just rely on Inertia reload
            },
        });
    };

    return (
        <DashboardLayout user={auth.user} header="Gestión de Pesos Burreo">
            <Head title="Gestión Pesos Burreo" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Link
                            href={route("traffic.index")}
                            className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver a Tráfico
                        </Link>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Gestión de Pesos Burreo</h2>
                        <p className="text-gray-500 mt-1">Administración de pesos provisionales y recálculos por calado.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Vessel List */}
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 italic-text">
                            <div className="p-6 bg-indigo-600">
                                <h3 className="text-white font-bold text-lg flex items-center">
                                    <Ship className="mr-2 w-5 h-5" />
                                    Buques Activos / Recientes
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                                {vessels.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        No hay buques registrados.
                                    </div>
                                ) : (
                                    vessels.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() =>
                                                handleSelectVessel(v)
                                            }
                                            className={`w-full text-left p-4 hover:bg-indigo-50 transition-colors ${selectedVessel?.id === v.id ? "bg-indigo-50 border-l-4 border-indigo-600" : ""}`}
                                        >
                                            <div className="font-bold text-gray-800">
                                                {v.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 uppercase">
                                                {v.product?.name ||
                                                    "Producto N/A"}{" "}
                                                |{" "}
                                                {v.client?.name ||
                                                    "Cliente N/A"}
                                            </div>
                                            <div className="flex mt-2 gap-2">
                                                {v.provisional_burreo_weight ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                        Prov:{" "}
                                                        {(v.provisional_burreo_weight ||
                                                            0) / 1000}{" "}
                                                        TM
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                                        Sin peso prov.
                                                    </span>
                                                )}
                                                {v.draft_weight && (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                        Draft:{" "}
                                                        {(v.draft_weight || 0) /
                                                            1000}{" "}
                                                        TM
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Forms Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {!selectedVessel ? (
                                <div className="bg-white rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 h-full">
                                    <Anchor className="w-16 h-16 text-gray-200 mb-4" />
                                    <h3 className="text-xl font-medium text-gray-400">
                                        Selecciona un buque para gestionar sus
                                        pesos
                                    </h3>
                                </div>
                            ) : (
                                <>
                                    {/* Provisional Weight Form */}
                                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                        <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-amber-800 font-bold text-lg flex items-center">
                                                    <AlertCircle className="mr-2 w-5 h-5 text-amber-500" />
                                                    Peso Promedio Provisional
                                                </h3>
                                                <p className="text-amber-600 text-sm mt-1">
                                                    Este peso se usará para los
                                                    tickets que no pasen por
                                                    báscula.
                                                </p>
                                            </div>
                                            <Ship className="w-10 h-10 text-amber-200" />
                                        </div>
                                        <form
                                            onSubmit={submitProvisional}
                                            className="p-8"
                                        >
                                            <div className="max-w-md">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Peso Promedio (TM)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={
                                                            provisionalForm.data
                                                                .provisional_burreo_weight
                                                        }
                                                        onChange={(e) =>
                                                            provisionalForm.setData(
                                                                "provisional_burreo_weight",
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg font-bold pl-4 pr-12 py-3"
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-medium">
                                                        TM
                                                    </div>
                                                </div>
                                                {provisionalForm.errors
                                                    .provisional_burreo_weight && (
                                                        <p className="mt-2 text-sm text-red-600">
                                                            {
                                                                provisionalForm
                                                                    .errors
                                                                    .provisional_burreo_weight
                                                            }
                                                        </p>
                                                    )}
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        provisionalForm.processing
                                                    }
                                                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                                                >
                                                    <Save className="mr-2 w-5 h-5" />
                                                    Guardar Peso Provisional
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Draft Weight / Final Recalculation Form */}
                                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                                        <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-emerald-800 font-bold text-lg flex items-center">
                                                    <Calculator className="mr-2 w-5 h-5 text-emerald-500" />
                                                    Cierre de Operación: Peso de
                                                    Calado (Draft)
                                                </h3>
                                                <p className="text-emerald-600 text-sm mt-1">
                                                    Al ingresar este peso, se
                                                    recalcularán todos los
                                                    tickets "burreo".
                                                </p>
                                            </div>
                                            <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                                        </div>
                                        <form
                                            onSubmit={submitDraft}
                                            className="p-8"
                                        >
                                            <div className="max-w-md">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Peso Total de Calado (TM)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={
                                                            draftForm.data
                                                                .draft_weight
                                                        }
                                                        onChange={(e) =>
                                                            draftForm.setData(
                                                                "draft_weight",
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg font-bold pl-4 pr-12 py-3"
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 font-medium">
                                                        TM
                                                    </div>
                                                </div>
                                                {draftForm.errors
                                                    .draft_weight && (
                                                        <p className="mt-2 text-sm text-red-600">
                                                            {
                                                                draftForm.errors
                                                                    .draft_weight
                                                            }
                                                        </p>
                                                    )}

                                                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600">
                                                    <p className="font-bold text-gray-700 mb-1 flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-2 text-indigo-500" />
                                                        Acción Crítica
                                                    </p>
                                                    Esta acción tomará el peso
                                                    ingresado y lo **asignará directamente**
                                                    a cada uno de los tickets de burreo del buque {" "}
                                                    <strong>
                                                        {selectedVessel.name}
                                                    </strong>
                                                    , reemplazando el valor provisional.
                                                    (No divide, asigna el valor tal cual).
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        draftForm.processing
                                                    }
                                                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
                                                >
                                                    <Calculator className="mr-2 w-5 h-5" />
                                                    Aplicar Recálculo Final
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
