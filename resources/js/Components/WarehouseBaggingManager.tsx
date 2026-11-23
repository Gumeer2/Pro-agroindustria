import React, { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import {
    Edit2,
    Settings,
    Warehouse,
    Plus,
    X,
    Check,
    Tag,
    AlertCircle,
    Info,
    Truck,
    Save,
    RotateCcw,
    Ban,
    Layers,
    Filter
} from "lucide-react";
import Swal from "sweetalert2";
import { PackagingEquipment } from "./PackagingEquipmentManager";

export interface WarehouseBaggingConfig {
    id: number;
    warehouse: string;
    cubicle?: string | null;
    warehouse_number?: number;
    company?: string;
    left_tag?: string | null;
    left_brand?: string | null;
    left_model?: string | null;
    left_serial?: string | null;
    right_tag?: string | null;
    right_brand?: string | null;
    right_model?: string | null;
    right_serial?: string | null;
    hopper_tag?: string | null;
    status?: string;
    notes?: string | null;
    active_operation?: {
        vehicle_plate?: string;
        driver?: string;
        folio?: string;
    } | null;
}

interface Props {
    configs: WarehouseBaggingConfig[];
    equipments: PackagingEquipment[];
}

export default function WarehouseBaggingManager({ configs, equipments }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<WarehouseBaggingConfig | null>(null);

    // Filtro de empresa para la tabla ("TODOS" | "PRO-AGRO" | "FERTINAL")
    const [tableCompanyFilter, setTableCompanyFilter] = useState<"TODOS" | "PRO-AGRO" | "FERTINAL">("TODOS");

    // Empresa seleccionada en el modal ("PRO-AGRO" | "FERTINAL")
    const [selectedCompany, setSelectedCompany] = useState<"PRO-AGRO" | "FERTINAL">("PRO-AGRO");

    // Estado del formulario
    const [formData, setFormData] = useState({
        warehouse: "Almacén 01",
        cubicle: "",
        left_tag: "ENS-P01",
        right_tag: "ENS-P02",
        hopper_tag: "LE-P01",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Limpieza del nombre de almacén
    const formatWarehouseName = (name?: string | null) => {
        if (!name) return "Almacén";
        return name
            .replace("Almac?n", "Almacén")
            .replace("Almacen", "Almacén");
    };

    // Helper para obtener la etiqueta de tolva (Tolva 1, Tolva 2, etc.)
    const getHopperLabel = (tag?: string | null) => {
        if (!tag) return "Tolva 1";
        const match = tag.match(/\d+/);
        if (match) {
            return `Tolva ${parseInt(match[0], 10)}`;
        }
        return `Tolva (${tag})`;
    };

    // Tolvas disponibles filtradas por empresa seleccionada
    const availableHoppers = useMemo(() => {
        const isFertinal = selectedCompany === "FERTINAL";
        const list = equipments.filter((eq) => {
            const isHopper =
                eq.description.toUpperCase().includes("TOLVA") ||
                eq.tag.startsWith("LE-");
            if (!isHopper) return false;
            return isFertinal
                ? eq.company === "FERTINAL" || eq.tag.startsWith("LE-F")
                : eq.company === "PRO-AGRO" || eq.tag.startsWith("LE-P");
        });

        if (list.length > 0) return list;

        // Fallbacks si la lista viniera vacía
        if (isFertinal) {
            return [
                { id: 101, company: "FERTINAL", tag: "LE-F01", description: "TOLVA DE LINEA DE ENVASADO", brand: "VICTOR", model: "TMII-DS", serial_number: "GAF093" },
                { id: 102, company: "FERTINAL", tag: "LE-F02", description: "TOLVA DE LINEA DE ENVASADO", brand: "VICTOR", model: "TMII-DS", serial_number: "GAF090" },
                { id: 103, company: "FERTINAL", tag: "LE-F03", description: "TOLVA DE LINEA DE ENVASADO", brand: "VICTOR", model: "TMII-DS", serial_number: "GAF089" },
            ];
        }

        const defaultList: PackagingEquipment[] = [];
        for (let i = 1; i <= 6; i++) {
            const num = i < 10 ? `0${i}` : `${i}`;
            defaultList.push({
                id: i,
                company: "PRO-AGRO",
                tag: `LE-P${num}`,
                description: "TOLVA DE LINEA DE ENVASADO",
                brand: "VICTOR",
                model: "TMII-DS",
                serial_number: `GAF0${90 + i}`,
            });
        }
        return defaultList;
    }, [equipments, selectedCompany]);

    // Ensacadoras disponibles filtradas por empresa seleccionada
    const availableTags = useMemo(() => {
        const isFertinal = selectedCompany === "FERTINAL";
        const list = equipments.filter((eq) => {
            const isEnsacadora =
                eq.description.toUpperCase().includes("ENSACADORA") ||
                eq.tag.startsWith("ENS-");
            if (!isEnsacadora) return false;
            return isFertinal
                ? eq.company === "FERTINAL" || eq.tag.startsWith("ENS-F")
                : eq.company === "PRO-AGRO" || eq.tag.startsWith("ENS-P");
        });

        if (list.length > 0) return list;

        // Fallbacks si no vinieran en equipments
        const defaultList: PackagingEquipment[] = [];
        if (isFertinal) {
            for (let i = 1; i <= 8; i++) {
                const num = i < 10 ? `0${i}` : `${i}`;
                defaultList.push({
                    id: 100 + i,
                    company: "FERTINAL",
                    tag: `ENS-F${num}`,
                    description: "ENSACADORA ELECTRONICA",
                    brand: "VICTOR",
                    model: "EETII-60",
                    serial_number: `CAO-52${4 + i}`,
                });
            }
        } else {
            for (let i = 1; i <= 15; i++) {
                const num = i < 10 ? `0${i}` : `${i}`;
                defaultList.push({
                    id: i,
                    company: "PRO-AGRO",
                    tag: `ENS-P${num}`,
                    description: "ENSACADORA ELECTRONICA",
                    brand: "VICTOR",
                    model: "EETII-60",
                    serial_number: `CAO-${num}`,
                });
            }
        }
        return defaultList;
    }, [equipments, selectedCompany]);

    // Cálculo automático de ensacadoras (Izquierda y Derecha) según Tolva y Empresa
    const getAutoBaggingMachinesForHopper = (hopperTag?: string | null, company?: "PRO-AGRO" | "FERTINAL") => {
        if (!hopperTag) return { autoLeft: "", autoRight: "" };
        const match = hopperTag.match(/\d+/);
        if (!match) return { autoLeft: "", autoRight: "" };
        const num = parseInt(match[0], 10);
        const lNum = num * 2 - 1;
        const rNum = num * 2;
        const isFertinal = company === "FERTINAL" || hopperTag.includes("-F");
        const prefix = isFertinal ? "ENS-F" : "ENS-P";
        const autoLeft = `${prefix}${lNum < 10 ? "0" + lNum : lNum}`;
        const autoRight = `${prefix}${rNum < 10 ? "0" + rNum : rNum}`;
        return { autoLeft, autoRight };
    };

    // Cambio de Empresa en el modal: filtra listas y reajusta automáticamente tolva y ensacadoras
    const handleCompanyChange = (newCompany: "PRO-AGRO" | "FERTINAL") => {
        setSelectedCompany(newCompany);
        const nextHopper = newCompany === "FERTINAL" ? "LE-F01" : "LE-P01";
        const { autoLeft, autoRight } = getAutoBaggingMachinesForHopper(nextHopper, newCompany);
        setFormData((prev) => ({
            ...prev,
            hopper_tag: nextHopper,
            left_tag: autoLeft,
            right_tag: autoRight,
        }));
    };

    // Handler al cambiar de Tolva: actualiza la tolva y pre-selecciona automáticamente las ensacadoras
    const handleHopperChange = (newHopperTag: string) => {
        const { autoLeft, autoRight } = getAutoBaggingMachinesForHopper(newHopperTag, selectedCompany);
        setFormData((prev) => ({
            ...prev,
            hopper_tag: newHopperTag,
            left_tag: autoLeft,
            right_tag: autoRight,
        }));
    };

    // Abrir modal para crear una nueva configuración de almacén
    const openCreateModal = () => {
        setEditingConfig(null);
        setSelectedCompany("PRO-AGRO");
        const defaultHopper = "LE-P01";
        const { autoLeft, autoRight } = getAutoBaggingMachinesForHopper(defaultHopper, "PRO-AGRO");

        // Buscar el primer almacén del 1 al 5 no configurado, o por defecto Almacén 01
        const configuredBaseNames = configs.map((c) => {
            const m = c.warehouse.match(/Almac[eé]n\s*0?(\d+)/i);
            return m ? `Almacén 0${m[1]}` : c.warehouse;
        });

        let defaultWh = "Almacén 01";
        for (let i = 1; i <= 5; i++) {
            const candidate = `Almacén 0${i}`;
            if (!configuredBaseNames.includes(candidate)) {
                defaultWh = candidate;
                break;
            }
        }

        setFormData({
            warehouse: defaultWh,
            cubicle: "",
            left_tag: autoLeft,
            right_tag: autoRight,
            hopper_tag: defaultHopper,
            notes: "",
        });
        setIsModalOpen(true);
    };

    // Abrir modal para editar configuración existente
    const openEditModal = (config: WarehouseBaggingConfig) => {
        setEditingConfig(config);

        // Detectar empresa
        const isFer =
            config.company?.toUpperCase().includes("FERTINAL") ||
            Boolean(config.hopper_tag?.includes("-F")) ||
            Boolean(config.left_tag?.includes("-F")) ||
            Boolean(config.right_tag?.includes("-F"));
        const comp = isFer ? "FERTINAL" : "PRO-AGRO";
        setSelectedCompany(comp);

        // Detectar almacén base (Almacén 01 a 05)
        let baseWh = "Almacén 01";
        const mWh = config.warehouse?.match(/Almac[eé]n\s*0?(\d+)/i);
        if (mWh) {
            const n = parseInt(mWh[1], 10);
            baseWh = `Almacén 0${n <= 5 ? n : 1}`;
        }

        // Detectar cubículo si existe
        let cub = config.cubicle || "";
        if (!cub && config.warehouse) {
            const mCub = config.warehouse.match(/Cub[ií]culo\s*0?(\d+)/i);
            if (mCub) {
                cub = `Cubículo 0${mCub[1]}`;
            }
        }

        setFormData({
            warehouse: baseWh,
            cubicle: cub,
            left_tag: config.left_tag || "",
            right_tag: config.right_tag || "",
            hopper_tag: config.hopper_tag || (comp === "FERTINAL" ? "LE-F01" : "LE-P01"),
            notes: config.notes || "",
        });
        setIsModalOpen(true);
    };

    // Find equipment info by tag
    const getEquipmentByTag = (tag?: string | null) => {
        if (!tag) return null;
        return equipments.find((eq) => eq.tag === tag);
    };

    // Validador de uso
    const getEnsacadoraUsage = (tag: string, currentEditingId?: number) => {
        if (!tag) return null;

        for (const cfg of configs) {
            if (currentEditingId && cfg.id === currentEditingId) continue;

            const isLeft = cfg.left_tag === tag;
            const isRight = cfg.right_tag === tag;

            if (isLeft || isRight) {
                return {
                    warehouse: formatWarehouseName(cfg.warehouse),
                    position: isLeft ? "Izquierda" : "Derecha",
                    hasActiveOperation: Boolean(cfg.active_operation),
                    activePlate: cfg.active_operation?.vehicle_plate,
                };
            }
        }
        return null;
    };

    const handleClearAssignments = () => {
        setFormData((prev) => ({
            ...prev,
            left_tag: "",
            right_tag: "",
        }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validación: Misma ensacadora en ambas posiciones
        if (
            formData.left_tag &&
            formData.right_tag &&
            formData.left_tag === formData.right_tag
        ) {
            Swal.fire({
                title: "Ensacadora duplicada",
                text: `No es posible asignar la misma ensacadora física (${formData.left_tag}) tanto a la izquierda como a la derecha del mismo almacén.`,
                icon: "warning",
            });
            return;
        }

        // 2. Validación de uso en otros almacenes
        const leftConflict = formData.left_tag
            ? getEnsacadoraUsage(formData.left_tag, editingConfig?.id)
            : null;
        const rightConflict = formData.right_tag
            ? getEnsacadoraUsage(formData.right_tag, editingConfig?.id)
            : null;

        const executeSave = () => {
            setIsSubmitting(true);

            const leftEq = getEquipmentByTag(formData.left_tag);
            const rightEq = getEquipmentByTag(formData.right_tag);

            // Si es Almacén 04 o 05 y tiene cubículo seleccionado, formatear nombre
            const hasCubicle =
                (formData.warehouse === "Almacén 04" || formData.warehouse === "Almacén 05") &&
                Boolean(formData.cubicle);
            const finalWarehouse = hasCubicle
                ? `${formData.warehouse} - ${formData.cubicle}`
                : formData.warehouse;

            const payload = {
                warehouse: finalWarehouse,
                cubicle: hasCubicle ? formData.cubicle : null,
                company: selectedCompany,
                left_tag: formData.left_tag || null,
                left_brand: leftEq?.brand || (formData.left_tag ? "VICTOR" : null),
                left_model: leftEq?.model || (formData.left_tag ? "EETII-60" : null),
                left_serial: leftEq?.serial_number || null,
                right_tag: formData.right_tag || null,
                right_brand: rightEq?.brand || (formData.right_tag ? "VICTOR" : null),
                right_model: rightEq?.model || (formData.right_tag ? "EETII-60" : null),
                right_serial: rightEq?.serial_number || null,
                hopper_tag: formData.hopper_tag || (selectedCompany === "FERTINAL" ? "LE-F01" : "LE-P01"),
                notes: formData.notes,
            };

            const onSaveSuccess = () => {
                setIsModalOpen(false);
                setIsSubmitting(false);

                // Sync with localStorage
                try {
                    const stored = JSON.parse(
                        localStorage.getItem("warehouse_bagging_machines") || "[]"
                    );
                    const updated = Array.isArray(stored)
                        ? stored.filter((c: any) => c.warehouse !== payload.warehouse)
                        : [];
                    updated.push({ ...payload, id: editingConfig?.id || Date.now() });
                    localStorage.setItem(
                        "warehouse_bagging_machines",
                        JSON.stringify(updated)
                    );
                } catch (err) {}

                const msg =
                    !payload.left_tag && !payload.right_tag
                        ? `El ${payload.warehouse} ha quedado sin asignación de ensacadoras.`
                        : `Configuración guardada para ${payload.warehouse} (${payload.company}) - Izquierda: ${payload.left_tag || "Sin asignar"}, Derecha: ${payload.right_tag || "Sin asignar"}.`;

                Swal.fire({
                    title: "¡Configuración guardada!",
                    text: msg,
                    icon: "success",
                    timer: 2500,
                    showConfirmButton: false,
                });
            };

            if (editingConfig && editingConfig.id) {
                router.put(
                    route("apt.warehouse-bagging-machines.update", editingConfig.id),
                    payload,
                    {
                        onSuccess: onSaveSuccess,
                        onError: () => setIsSubmitting(false),
                    }
                );
            } else {
                router.post(route("apt.warehouse-bagging-machines.store"), payload, {
                    onSuccess: onSaveSuccess,
                    onError: () => setIsSubmitting(false),
                });
            }
        };

        // Si hay conflictos de uso en otros almacenes, preguntar al usuario
        if (leftConflict || rightConflict) {
            let conflictMsg = "";
            if (leftConflict) {
                conflictMsg += `• La ensacadora <b>${formData.left_tag}</b> está actualmente asignada al <b>${leftConflict.warehouse} (${leftConflict.position})</b>${leftConflict.hasActiveOperation ? ` [EN OPERACIÓN con tracto ${leftConflict.activePlate}]` : ""}.<br/>`;
            }
            if (rightConflict) {
                conflictMsg += `• La ensacadora <b>${formData.right_tag}</b> está actualmente asignada al <b>${rightConflict.warehouse} (${rightConflict.position})</b>${rightConflict.hasActiveOperation ? ` [EN OPERACIÓN con tracto ${rightConflict.activePlate}]` : ""}.<br/>`;
            }
            conflictMsg += `<br/>¿Deseas reasignarla(s) a este almacén? Se desasignarán automáticamente de su almacén anterior para evitar duplicidad.`;

            Swal.fire({
                title: "¿Reasignar ensacadoras en uso?",
                html: conflictMsg,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, reasignar",
                cancelButtonText: "Cancelar",
            }).then((res) => {
                if (res.isConfirmed) {
                    executeSave();
                }
            });
            return;
        }

        executeSave();
    };

    // Filtrar configuraciones para la tabla
    const filteredConfigs = useMemo(() => {
        if (tableCompanyFilter === "TODOS") return configs;
        return configs.filter((cfg) => {
            const isFer =
                cfg.company?.toUpperCase().includes("FERTINAL") ||
                Boolean(cfg.hopper_tag?.includes("-F")) ||
                Boolean(cfg.left_tag?.includes("-F")) ||
                Boolean(cfg.right_tag?.includes("-F"));
            return tableCompanyFilter === "FERTINAL" ? isFer : !isFer;
        });
    }, [configs, tableCompanyFilter]);

    return (
        <div className="space-y-6">
            {/* Top Toolbar matching style */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-indigo-600" />
                        Configuración de Ensacadoras por Almacén
                    </h3>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                        {configs.length} Registros
                    </span>

                    {/* Filtro por Empresa en Toolbar */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => setTableCompanyFilter("TODOS")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                tableCompanyFilter === "TODOS"
                                    ? "bg-white text-indigo-950 shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Todos ({configs.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTableCompanyFilter("PRO-AGRO")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                tableCompanyFilter === "PRO-AGRO"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Pro-Agro
                        </button>
                        <button
                            type="button"
                            onClick={() => setTableCompanyFilter("FERTINAL")}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                tableCompanyFilter === "FERTINAL"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Fertinal
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 hidden xl:block">
                        Asigna ensacadoras <strong className="text-indigo-700">Izquierda</strong> y <strong className="text-emerald-700">Derecha</strong> con validación en tiempo real.
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                        title="Configurar nuevo"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Configurar Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Table Card matching Sales Orders style */}
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white text-xs font-bold uppercase tracking-wider">
                                <th className="py-4 px-3 text-center w-12">
                                    <Settings className="w-5 h-5 mx-auto opacity-70" />
                                </th>
                                <th className="py-4 px-4">ALMACÉN / CUBÍCULO</th>
                                <th className="py-4 px-4">EMPRESA</th>
                                <th className="py-4 px-4">TOLVA (LÍNEA)</th>
                                <th className="py-4 px-4">IZQUIERDA ENSACADORA</th>
                                <th className="py-4 px-4">DERECHA ENSACADORA</th>
                                <th className="py-4 px-4 text-center">ESTATUS</th>
                                <th className="py-4 px-4 text-center">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredConfigs.map((config) => {
                                const leftEq = getEquipmentByTag(config.left_tag);
                                const rightEq = getEquipmentByTag(config.right_tag);
                                const hasLeft = Boolean(config.left_tag && config.left_tag.trim());
                                const hasRight = Boolean(config.right_tag && config.right_tag.trim());
                                const isUnassigned = !hasLeft && !hasRight;
                                const isPartial = (hasLeft && !hasRight) || (!hasLeft && hasRight);

                                const isFer =
                                    config.company?.toUpperCase().includes("FERTINAL") ||
                                    Boolean(config.hopper_tag?.includes("-F")) ||
                                    Boolean(config.left_tag?.includes("-F")) ||
                                    Boolean(config.right_tag?.includes("-F"));

                                // Detectar si tiene cubículo
                                const cubicleName = config.cubicle || (config.warehouse.match(/Cub[ií]culo\s*0?\d+/i)?.[0] ?? null);

                                return (
                                    <tr
                                        key={config.id || config.warehouse}
                                        className="hover:bg-indigo-50/30 transition-colors duration-150 group"
                                    >
                                        {/* Action Icon */}
                                        <td className="py-3 px-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(config)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-indigo-50"
                                                title="Configurar almacén"
                                            >
                                                <Edit2 className="w-4 h-4 mx-auto" />
                                            </button>
                                        </td>

                                        {/* Almacén */}
                                        <td className="py-3 px-4 font-black text-indigo-950">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                                                    <Warehouse className="w-4 h-4" />
                                                </span>
                                                <span className="font-bold">
                                                    {formatWarehouseName(config.warehouse)}
                                                </span>
                                                {cubicleName && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                        <Layers className="w-3 h-3 text-indigo-600" />
                                                        {cubicleName}
                                                    </span>
                                                )}
                                            </div>
                                            {config.active_operation && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                                                        <Truck className="w-3 h-3" />
                                                        En Carga: {config.active_operation.vehicle_plate}
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Empresa */}
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wide border ${
                                                    isFer
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                                        : "bg-blue-50 text-blue-800 border-blue-300"
                                                }`}
                                            >
                                                {isFer ? "FERTINAL" : "PRO-AGRO"}
                                            </span>
                                        </td>

                                        {/* Tolva */}
                                        <td className="py-3 px-4 text-xs font-semibold text-gray-600">
                                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono font-bold">
                                                {config.hopper_tag || "LE-P01"}
                                            </span>
                                            <span className="text-[11px] text-gray-500 block mt-0.5 font-medium">
                                                {getHopperLabel(config.hopper_tag)}
                                            </span>
                                        </td>

                                        {/* Ensacadora Izquierda */}
                                        <td className="py-3 px-4">
                                            {hasLeft ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-2.5 py-0.5 rounded-md">
                                                            {config.left_tag}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            Izquierda
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {leftEq?.brand || config.left_brand || "VICTOR"} • {leftEq?.model || config.left_model || "EETII-60"}
                                                        {leftEq?.serial_number || config.left_serial ? ` • S/N: ${leftEq?.serial_number || config.left_serial}` : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200">
                                                    <Ban className="w-3 h-3" />
                                                    Sin Asignar
                                                </span>
                                            )}
                                        </td>

                                        {/* Ensacadora Derecha */}
                                        <td className="py-3 px-4">
                                            {hasRight ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-md">
                                                            {config.right_tag}
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            Derecha
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-500">
                                                        {rightEq?.brand || config.right_brand || "VICTOR"} • {rightEq?.model || config.right_model || "EETII-60"}
                                                        {rightEq?.serial_number || config.right_serial ? ` • S/N: ${rightEq?.serial_number || config.right_serial}` : ""}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200">
                                                    <Ban className="w-3 h-3" />
                                                    Sin Asignar
                                                </span>
                                            )}
                                        </td>

                                        {/* Estatus */}
                                        <td className="py-3 px-4 text-center">
                                            {isUnassigned ? (
                                                <span className="bg-gray-100 text-gray-600 text-xs font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                    SIN ASIGNAR
                                                </span>
                                            ) : isPartial ? (
                                                <span className="bg-amber-100 text-amber-800 text-xs font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                    PARCIAL (1)
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-800 text-xs font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                    ACTIVO
                                                </span>
                                            )}
                                        </td>

                                        {/* Botón Acción */}
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(config)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs transition-all duration-150 shadow-2xs"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                <span>Editar</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                                <td colSpan={3} className="py-3.5 px-4 text-indigo-950 font-black">
                                    TOTAL GENERAL ({filteredConfigs.length} de {configs.length} mostrados)
                                </td>
                                <td colSpan={5} className="py-3.5 px-4 text-right text-indigo-950 font-black">
                                    {filteredConfigs.filter((c) => c.left_tag || c.right_tag).length} de {filteredConfigs.length} con Ensacadoras Asignadas
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal de Configuración por Almacén */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-fade-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Warehouse className="w-5 h-5 text-indigo-300" />
                                <div>
                                    <h3 className="font-bold text-base">
                                        {editingConfig ? `Configurar Ensacadoras: ${formData.warehouse}` : "Configurar Nuevo"}
                                    </h3>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        {editingConfig ? "Asigna tolva física y máquinas ensacadoras" : "Registra configuración con tolva y ensacadoras"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                            {/* Alerta si el almacén tiene operación activa */}
                            {editingConfig?.active_operation && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-800">
                                        <strong>Atención:</strong> Este almacén tiene un embarque en curso (Tracto: <strong>{editingConfig.active_operation.vehicle_plate}</strong>). Los cambios en las ensacadoras afectarán el muestreo activo.
                                    </div>
                                </div>
                            )}

                            {/* Filtro de Empresa / Planta (PRO-AGRO / FERTINAL) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Filtrar por Empresa / Planta</span>
                                    <span className="text-[10px] text-indigo-600 font-bold">Tolvas y Ensacadoras</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCompanyChange("PRO-AGRO")}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            selectedCompany === "PRO-AGRO"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${selectedCompany === "PRO-AGRO" ? "bg-white" : "bg-blue-500"}`}></span>
                                        PRO-AGRO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCompanyChange("FERTINAL")}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            selectedCompany === "FERTINAL"
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${selectedCompany === "FERTINAL" ? "bg-white" : "bg-emerald-500"}`}></span>
                                        FERTINAL
                                    </button>
                                </div>
                            </div>

                            {/* Almacén (1 al 5) y Cubículo (solo aparece si es Almacén 04 o Almacén 05) */}
                            {formData.warehouse === "Almacén 04" || formData.warehouse === "Almacén 05" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                            Almacén (1 al 5)
                                        </label>
                                        <select
                                            value={formData.warehouse}
                                            onChange={(e) => {
                                                const wh = e.target.value;
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    warehouse: wh,
                                                    cubicle: (wh === "Almacén 04" || wh === "Almacén 05") ? prev.cubicle : "",
                                                }));
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                        >
                                            <option value="Almacén 01">Almacén 01</option>
                                            <option value="Almacén 02">Almacén 02</option>
                                            <option value="Almacén 03">Almacén 03</option>
                                            <option value="Almacén 04">Almacén 04</option>
                                            <option value="Almacén 05">Almacén 05</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center justify-between">
                                            <span>Cubículo</span>
                                            <span className="text-[10px] text-indigo-600 font-bold">8 Cubículos</span>
                                        </label>
                                        <select
                                            value={formData.cubicle}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, cubicle: e.target.value }))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-indigo-300 text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50/50 shadow-2xs"
                                        >
                                            <option value="">-- General (Sin Cubículo) --</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => {
                                                const cVal = `Cubículo 0${c}`;
                                                return (
                                                    <option key={cVal} value={cVal}>
                                                        {cVal}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Almacén (1 al 5)
                                    </label>
                                    <select
                                        value={formData.warehouse}
                                        onChange={(e) => {
                                            const wh = e.target.value;
                                            setFormData((prev) => ({
                                                ...prev,
                                                warehouse: wh,
                                                cubicle: "",
                                            }));
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                    >
                                        <option value="Almacén 01">Almacén 01</option>
                                        <option value="Almacén 02">Almacén 02</option>
                                        <option value="Almacén 03">Almacén 03</option>
                                        <option value="Almacén 04">Almacén 04</option>
                                        <option value="Almacén 05">Almacén 05</option>
                                    </select>
                                </div>
                            )}

                            {/* Tolva de Línea (¡PRIMERO DESPUÉS DE ALMACÉN!) */}
                            <div>
                                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Tolva de Línea ({selectedCompany})</span>
                                    <span className="text-[10px] text-indigo-600 font-bold">{getHopperLabel(formData.hopper_tag)}</span>
                                </label>
                                <select
                                    value={formData.hopper_tag}
                                    onChange={(e) => handleHopperChange(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                >
                                    {availableHoppers.map((hop) => (
                                        <option key={hop.tag} value={hop.tag}>
                                            {hop.tag} - {getHopperLabel(hop.tag)} {hop.serial_number ? `(Serie: ${hop.serial_number})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    💡 Al seleccionar la tolva se asignan automáticamente las ensacadoras correspondientes de {selectedCompany}.
                                </p>
                            </div>

                            {/* Botón rápido para dejar sin asignación */}
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={handleClearAssignments}
                                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                    title="Quitar la asignación de ensacadoras a este almacén"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Dejar sin asignación (Limpiar ambos)</span>
                                </button>
                            </div>

                            {/* Ensacadora Izquierda */}
                            <div>
                                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Izquierda Ensacadora (TAG) - {selectedCompany}</span>
                                    <span className="text-[10px] text-indigo-600 font-semibold">Posición Izquierda</span>
                                </label>
                                <select
                                    value={formData.left_tag}
                                    onChange={(e) =>
                                        setFormData({ ...formData, left_tag: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">-- Sin Asignar (Dejar vacía) --</option>
                                    {availableTags.map((eq) => {
                                        const usage = getEnsacadoraUsage(eq.tag, editingConfig?.id);
                                        const isSameWarehouseRight = formData.right_tag === eq.tag;

                                        let label = `${eq.tag} - ${eq.brand} ${eq.model} (Serie: ${eq.serial_number})`;
                                        if (isSameWarehouseRight) {
                                            label += ` ⚠️ [Seleccionada en Derecha]`;
                                        } else if (usage) {
                                            label += ` ⚠️ [En uso en ${usage.warehouse} - ${usage.position}]`;
                                        }

                                        return (
                                            <option key={eq.tag} value={eq.tag}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {formData.left_tag && (
                                    <div className="mt-1 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                                        {getEnsacadoraUsage(formData.left_tag, editingConfig?.id) ? (
                                            <span className="text-amber-600 font-bold">
                                                ⚠️ Máquina en uso en otro almacén (se reasignará si guardas).
                                            </span>
                                        ) : (
                                            <span>✓ Ensacadora disponible para asignación.</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Ensacadora Derecha */}
                            <div>
                                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Derecha Ensacadora (TAG) - {selectedCompany}</span>
                                    <span className="text-[10px] text-emerald-600 font-semibold">Posición Derecha</span>
                                </label>
                                <select
                                    value={formData.right_tag}
                                    onChange={(e) =>
                                        setFormData({ ...formData, right_tag: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">-- Sin Asignar (Dejar vacía) --</option>
                                    {availableTags.map((eq) => {
                                        const usage = getEnsacadoraUsage(eq.tag, editingConfig?.id);
                                        const isSameWarehouseLeft = formData.left_tag === eq.tag;

                                        let label = `${eq.tag} - ${eq.brand} ${eq.model} (Serie: ${eq.serial_number})`;
                                        if (isSameWarehouseLeft) {
                                            label += ` ⚠️ [Seleccionada en Izquierda]`;
                                        } else if (usage) {
                                            label += ` ⚠️ [En uso en ${usage.warehouse} - ${usage.position}]`;
                                        }

                                        return (
                                            <option key={eq.tag} value={eq.tag}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                                {formData.right_tag && (
                                    <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                        {getEnsacadoraUsage(formData.right_tag, editingConfig?.id) ? (
                                            <span className="text-amber-600 font-bold">
                                                ⚠️ Máquina en uso en otro almacén (se reasignará si guardas).
                                            </span>
                                        ) : (
                                            <span>✓ Ensacadora disponible para asignación.</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSubmitting ? "Guardando..." : "Guardar Configuración"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
