import React, { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import Swal from "sweetalert2";
import {
    UserCheck,
    Layers,
    Search,
    Edit2,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    X,
    Save,
    Ban,
    Warehouse,
    Filter,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Plus,
    Info,
    Settings,
} from "lucide-react";

interface WarehouseBaggingMachine {
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
    assistant_name?: string | null;
    assistant_id?: number | null;
    status?: string;
    notes?: string | null;
    has_cubicles?: boolean;
}

interface Assistant {
    id: number;
    name: string;
}

interface PackagingEquipment {
    id: number;
    tag: string;
    description: string;
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
}

interface Props {
    warehouseBaggingMachines: WarehouseBaggingMachine[];
    assistants: Assistant[];
    packagingEquipments?: PackagingEquipment[];
    onBackToMenu?: () => void;
}

export default function TolvaAssistantManager({
    warehouseBaggingMachines,
    assistants = [],
    packagingEquipments = [],
    onBackToMenu,
}: Props) {
    const [configs, setConfigs] = useState<WarehouseBaggingMachine[]>(
        warehouseBaggingMachines || []
    );
    const [assistantList] = useState<Assistant[]>(assistants || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Almacenes expandidos inline en la tabla
    const [expandedWarehouses, setExpandedWarehouses] = useState<number[]>([]);

    // Modal para ver los 8 cubículos de Almacén 4 o 5
    const [selectedCubiclesWarehouse, setSelectedCubiclesWarehouse] = useState<{
        warehouse_number: number;
        warehouse_name: string;
        hopper_tag: string;
    } | null>(null);

    // Modal de asignación individual de auxiliar existente
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<WarehouseBaggingMachine | null>(null);
    const [selectedAssistantName, setSelectedAssistantName] = useState("");
    const [selectedAssistantId, setSelectedAssistantId] = useState<number | null>(null);
    const [selectedHopperTag, setSelectedHopperTag] = useState("");
    const [selectedLeftTag, setSelectedLeftTag] = useState("");
    const [selectedRightTag, setSelectedRightTag] = useState("");
    const [assignCompany, setAssignCompany] = useState<"PRO-AGRO" | "FERTINAL">("PRO-AGRO");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal de "Asignar Nuevo"
    const [isNewAssignModalOpen, setIsNewAssignModalOpen] = useState(false);
    const [newAssignCompany, setNewAssignCompany] = useState<"PRO-AGRO" | "FERTINAL">("PRO-AGRO");
    const [newAssignData, setNewAssignData] = useState({
        warehouse: "Almacén 01",
        cubicle: "Cubículo 01",
        hopper_tag: "LE-P01",
        assistant_name: "",
        assistant_id: null as number | null,
        left_tag: "ENS-P01",
        right_tag: "ENS-P02",
    });

    // Formatear nombre de almacén
    const formatWarehouseName = (name?: string | null) => {
        if (!name) return "Almacén";
        return name.replace("Almac?n", "Almacén").replace("Almacen", "Almacén");
    };

    // Helper para etiqueta de tolva (Tolva 1, Tolva 2...)
    const getHopperLabel = (tag?: string | null) => {
        if (!tag) return "Tolva";
        const match = tag.match(/\d+/);
        if (match) {
            return `Tolva ${parseInt(match[0], 10)}`;
        }
        return `Tolva (${tag})`;
    };

    // Tolvas disponibles de catálogo filtradas por empresa (PRO-AGRO o FERTINAL)
    const getHoppersForCompany = (comp: "PRO-AGRO" | "FERTINAL") => {
        const isFer = comp === "FERTINAL";
        const list = packagingEquipments.filter((eq) => {
            const isHopper =
                eq.description.toUpperCase().includes("TOLVA") ||
                eq.tag.startsWith("LE-");
            if (!isHopper) return false;
            return isFer
                ? eq.company === "FERTINAL" || eq.tag.startsWith("LE-F")
                : eq.company === "PRO-AGRO" || eq.tag.startsWith("LE-P");
        });

        if (list.length > 0) return list;

        if (isFer) {
            return [
                { id: 101, company: "FERTINAL", tag: "LE-F01", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF093" },
                { id: 102, company: "FERTINAL", tag: "LE-F02", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF090" },
                { id: 103, company: "FERTINAL", tag: "LE-F03", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF089" },
            ];
        }

        return [
            { id: 1, company: "PRO-AGRO", tag: "LE-P01", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF093" },
            { id: 2, company: "PRO-AGRO", tag: "LE-P02", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF090" },
            { id: 3, company: "PRO-AGRO", tag: "LE-P03", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF089" },
            { id: 4, company: "PRO-AGRO", tag: "LE-P04", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF102" },
            { id: 5, company: "PRO-AGRO", tag: "LE-P05", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF148" },
            { id: 6, company: "PRO-AGRO", tag: "LE-P06", description: "TOLVA DE LINEA DE ENVASADO", serial_number: "GAF147" },
        ];
    };

    // Tolvas disponibles generales de catálogo o fallback
    const availableHoppers = useMemo(() => {
        return getHoppersForCompany("PRO-AGRO");
    }, [packagingEquipments]);

    // Función auxiliar para obtener los 8 cubículos de Almacén 4 o 5
    const getCubiclesForWarehouse = (whNum: number): WarehouseBaggingMachine[] => {
        const numStr = `0${whNum}`;
        const baseWh = `Almacén ${numStr}`;
        const hopperTag = `LE-P${numStr}`;

        const baseCfg = configs.find(
            (c) =>
                c.warehouse.toLowerCase() === baseWh.toLowerCase() ||
                c.warehouse_number === whNum
        );

        const list: WarehouseBaggingMachine[] = [];
        for (let i = 1; i <= 8; i++) {
            const cubStr = `Cubículo 0${i}`;
            const fullWhName = `${baseWh} - ${cubStr}`;

            const found = configs.find((c) => {
                return (
                    c.warehouse.toLowerCase() === fullWhName.toLowerCase() ||
                    (c.warehouse.toLowerCase().includes(baseWh.toLowerCase()) &&
                        (c.cubicle === cubStr || c.warehouse.toLowerCase().includes(cubStr.toLowerCase())))
                );
            });

            if (found) {
                list.push({
                    ...found,
                    warehouse: fullWhName,
                    cubicle: cubStr,
                    warehouse_number: whNum,
                    hopper_tag: found.hopper_tag || hopperTag,
                    left_tag: found.left_tag || baseCfg?.left_tag || (whNum === 4 ? "ENS-P07" : "ENS-P09"),
                    right_tag: found.right_tag || baseCfg?.right_tag || (whNum === 4 ? "ENS-P08" : "ENS-P10"),
                });
            } else {
                list.push({
                    id: 9000 + whNum * 100 + i,
                    warehouse: fullWhName,
                    cubicle: cubStr,
                    warehouse_number: whNum,
                    company: "PRO-AGRO",
                    hopper_tag: hopperTag,
                    left_tag: baseCfg?.left_tag || (whNum === 4 ? "ENS-P07" : "ENS-P09"),
                    right_tag: baseCfg?.right_tag || (whNum === 4 ? "ENS-P08" : "ENS-P10"),
                    status: "active",
                });
            }
        }
        return list;
    };

    // Lista principal: Almacén 01, Almacén 02, Almacén 03, Almacén 04 y Almacén 05 (NO repetidos)
    const displayWarehouses = useMemo(() => {
        const result: (WarehouseBaggingMachine & {
            cubiclesCount?: number;
            assignedCubiclesCount?: number;
        })[] = [];

        // Almacenes 1, 2 y 3 (Tolva única)
        for (let whNum = 1; whNum <= 3; whNum++) {
            const numStr = `0${whNum}`;
            const whName = `Almacén ${numStr}`;
            const found = configs.find(
                (c) =>
                    c.warehouse.toLowerCase() === whName.toLowerCase() ||
                    c.warehouse.toLowerCase().startsWith(whName.toLowerCase())
            );

            const isFer = (found?.hopper_tag && found.hopper_tag.includes("-F")) || found?.company === "FERTINAL";
            const defaultLeft = isFer ? `ENS-F0${whNum * 2 - 1}` : `ENS-P0${whNum * 2 - 1}`;
            const defaultRight = isFer ? `ENS-F0${whNum * 2}` : `ENS-P0${whNum * 2}`;

            if (found) {
                result.push({
                    ...found,
                    warehouse: whName,
                    warehouse_number: whNum,
                    hopper_tag: found.hopper_tag || `LE-P${numStr}`,
                    left_tag: found.left_tag || defaultLeft,
                    right_tag: found.right_tag || defaultRight,
                    has_cubicles: false,
                });
            } else {
                result.push({
                    id: 900 + whNum,
                    warehouse: whName,
                    warehouse_number: whNum,
                    company: "PRO-AGRO",
                    hopper_tag: `LE-P${numStr}`,
                    left_tag: defaultLeft,
                    right_tag: defaultRight,
                    status: "active",
                    has_cubicles: false,
                });
            }
        }

        // Almacenes 4 y 5 (Cada uno con 8 cubículos agrupados)
        for (let whNum = 4; whNum <= 5; whNum++) {
            const numStr = `0${whNum}`;
            const whName = `Almacén ${numStr}`;
            const hopperTag = `LE-P${numStr}`;

            const baseCfg = configs.find(
                (c) =>
                    c.warehouse.toLowerCase() === whName.toLowerCase() ||
                    c.warehouse_number === whNum
            );

            const cubicles = getCubiclesForWarehouse(whNum);
            const assignedCount = cubicles.filter((c) => c.assistant_name).length;

            result.push({
                id: 900 + whNum,
                warehouse: whName,
                warehouse_number: whNum,
                company: "PRO-AGRO",
                hopper_tag: hopperTag,
                left_tag: baseCfg?.left_tag || (whNum === 4 ? "ENS-P07" : "ENS-P09"),
                right_tag: baseCfg?.right_tag || (whNum === 4 ? "ENS-P08" : "ENS-P10"),
                status: assignedCount === 8 ? "active" : assignedCount > 0 ? "partial" : "unassigned",
                has_cubicles: true,
                cubiclesCount: 8,
                assignedCubiclesCount: assignedCount,
            });
        }

        return result;
    }, [configs]);

    // Filtrar almacenes según búsqueda y estatus
    const filteredWarehouses = useMemo(() => {
        return displayWarehouses.filter((wh) => {
            const q = searchQuery.toLowerCase().trim();
            const whName = formatWarehouseName(wh.warehouse).toLowerCase();
            const hop = (wh.hopper_tag || "").toLowerCase();
            const hopLabel = getHopperLabel(wh.hopper_tag).toLowerCase();
            const asst = (wh.assistant_name || "").toLowerCase();

            // Si tiene cubículos, checar si algún cubículo o auxiliar coincide con la búsqueda
            let cubiclesMatch = false;
            if (wh.has_cubicles && q) {
                const cubs = getCubiclesForWarehouse(wh.warehouse_number || 0);
                cubiclesMatch = cubs.some(
                    (c) =>
                        (c.cubicle || "").toLowerCase().includes(q) ||
                        (c.assistant_name || "").toLowerCase().includes(q)
                );
            }

            const matchesQuery =
                !q ||
                whName.includes(q) ||
                hop.includes(q) ||
                hopLabel.includes(q) ||
                asst.includes(q) ||
                cubiclesMatch;

            const isAssigned = wh.has_cubicles
                ? (wh.assignedCubiclesCount || 0) > 0
                : Boolean(wh.assistant_name);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ASSIGNED" && isAssigned) ||
                (statusFilter === "UNASSIGNED" && !isAssigned);

            return matchesQuery && matchesStatus;
        });
    }, [displayWarehouses, searchQuery, statusFilter, configs]);

    // Toggle expandir inline en la tabla
    const toggleExpandWarehouse = (whNum: number) => {
        setExpandedWarehouses((prev) =>
            prev.includes(whNum) ? prev.filter((n) => n !== whNum) : [...prev, whNum]
        );
    };

    // Métricas totales
    const totalLinesCount = 3 + 8 + 8; // Alm 1, 2, 3 (3) + Alm 4 (8 cubículos) + Alm 5 (8 cubículos) = 19
    const totalAssignedCount = useMemo(() => {
        const alm123 = displayWarehouses
            .filter((w) => !w.has_cubicles && w.assistant_name)
            .length;
        const alm4 = getCubiclesForWarehouse(4).filter((c) => c.assistant_name).length;
        const alm5 = getCubiclesForWarehouse(5).filter((c) => c.assistant_name).length;
        return alm123 + alm4 + alm5;
    }, [displayWarehouses, configs]);
    const totalUnassignedCount = totalLinesCount - totalAssignedCount;

    // Detectar si el auxiliar ya está en otra tolva/cubículo
    const getAssistantConflict = (name: string, currentWh?: string) => {
        if (!name) return null;
        const normName = name.trim().toUpperCase();

        // Checar en almacenes 1 a 3
        for (let whNum = 1; whNum <= 3; whNum++) {
            const numStr = `0${whNum}`;
            const wh = `Almacén ${numStr}`;
            if (currentWh && currentWh === wh) continue;
            const found = configs.find(
                (c) =>
                    c.warehouse.toLowerCase() === wh.toLowerCase() &&
                    (c.assistant_name || "").trim().toUpperCase() === normName
            );
            if (found) {
                return {
                    warehouse: formatWarehouseName(found.warehouse),
                    hopper: getHopperLabel(found.hopper_tag),
                };
            }
        }

        // Checar en cubículos de Almacén 4 y 5
        for (const whNum of [4, 5]) {
            const cubs = getCubiclesForWarehouse(whNum);
            for (const c of cubs) {
                if (currentWh && currentWh === c.warehouse) continue;
                if ((c.assistant_name || "").trim().toUpperCase() === normName) {
                    return {
                        warehouse: formatWarehouseName(c.warehouse),
                        hopper: getHopperLabel(c.hopper_tag),
                    };
                }
            }
        }

        return null;
    };

    // Ensacadoras y tolvas automáticas según almacén y empresa
    const getAutomaticBaggingMachines = (wh: string, comp: "PRO-AGRO" | "FERTINAL") => {
        const isFer = comp === "FERTINAL";
        const m = wh.match(/\d+/);
        const whNum = m ? parseInt(m[0], 10) : 1;
        const left = isFer
            ? `ENS-F0${whNum * 2 - 1}`
            : (whNum >= 5 ? `ENS-P${whNum * 2 - 1}` : `ENS-P0${whNum * 2 - 1}`);
        const right = isFer
            ? `ENS-F0${whNum * 2}`
            : (whNum >= 5 ? `ENS-P${whNum * 2}` : `ENS-P0${whNum * 2}`);
        const hopper = isFer ? `LE-F0${whNum}` : `LE-P0${whNum}`;
        return { left, right, hopper, whNum };
    };

    // Buscar la configuración guardada de Tolva y Ensacadoras por Almacén / Cubículo (desde "Configuración de Ensacadoras por Almacén")
    const findWarehouseConfig = (whName: string, cubName?: string | null) => {
        const m = whName.match(/\d+/);
        const whNum = m ? parseInt(m[0], 10) : 0;

        // Si tiene cubículo (Almacén 4 o 5)
        if (cubName && (whNum === 4 || whNum === 5)) {
            const mCub = cubName.match(/\d+/);
            const cubNum = mCub ? parseInt(mCub[0], 10) : 0;
            const foundCub = configs.find((c) => {
                const cWh = (c.warehouse || "").toLowerCase();
                const cCub = (c.cubicle || "").toLowerCase();
                const cNum = c.warehouse_number || (cWh.match(/\d+/) ? parseInt(cWh.match(/\d+/)[0], 10) : 0);
                if (cNum !== whNum) return false;
                if (cCub && cCub.match(/\d+/) && parseInt(cCub.match(/\d+/)[0], 10) === cubNum) return true;
                if (
                    cWh.includes(`cubículo 0${cubNum}`) ||
                    cWh.includes(`cubículo ${cubNum}`) ||
                    cWh.includes(`cubiculo 0${cubNum}`) ||
                    cWh.includes(`cubiculo ${cubNum}`)
                ) {
                    return true;
                }
                return false;
            });
            if (foundCub) return foundCub;
        }

        // Buscar por almacén base (sin cubículo o cubículo vacío)
        const foundExactBase = configs.find((c) => {
            const cWh = (c.warehouse || "").toLowerCase();
            const cNum = c.warehouse_number || (cWh.match(/\d+/) ? parseInt(cWh.match(/\d+/)[0], 10) : 0);
            if (cNum === whNum && (!c.cubicle || c.cubicle.trim() === "")) {
                return true;
            }
            return false;
        });
        if (foundExactBase) return foundExactBase;

        // Fallback: cualquier registro de ese número de almacén
        const foundAny = configs.find((c) => {
            const cWh = (c.warehouse || "").toLowerCase();
            const cNum = c.warehouse_number || (cWh.match(/\d+/) ? parseInt(cWh.match(/\d+/)[0], 10) : 0);
            return cNum === whNum;
        });

        return foundAny || null;
    };

    // Validar auxiliar asignado actualmente a un almacén / cubículo
    const getWarehouseAssignedAssistant = (wh: string, cub?: string | null) => {
        const cfg = findWarehouseConfig(wh, cub);
        return cfg?.assistant_name ? cfg : null;
    };

    // Abrir modal de asignación individual
    const openAssignModal = (config: WarehouseBaggingMachine) => {
        const cfg = findWarehouseConfig(config.warehouse, config.cubicle) || config;
        const tag = cfg.hopper_tag || config.hopper_tag || `LE-P0${config.warehouse_number || 1}`;
        const isFer = tag.includes("-F") || cfg.company === "FERTINAL" || config.company === "FERTINAL";
        const comp = isFer ? "FERTINAL" : "PRO-AGRO";
        const auto = getAutomaticBaggingMachines(config.warehouse, comp);

        setEditingConfig(config);
        setSelectedAssistantName(cfg.assistant_name || config.assistant_name || "");
        setSelectedAssistantId(cfg.assistant_id || config.assistant_id || null);
        setSelectedHopperTag(tag);
        setAssignCompany(comp);
        setSelectedLeftTag(cfg.left_tag || config.left_tag || auto.left);
        setSelectedRightTag(cfg.right_tag || config.right_tag || auto.right);
        setIsAssignModalOpen(true);
    };

    // Abrir modal "Asignar Nuevo"
    const openNewAssignModal = () => {
        const initialWh = "Almacén 01";
        const cfg = findWarehouseConfig(initialWh, null);
        const isFer = (cfg?.hopper_tag && cfg.hopper_tag.includes("-F")) || cfg?.company === "FERTINAL";
        const comp = isFer ? "FERTINAL" : "PRO-AGRO";
        const auto = getAutomaticBaggingMachines(initialWh, comp);
        const assignedHopper = cfg?.hopper_tag || auto.hopper;
        const assignedCompany = assignedHopper.includes("-F") ? "FERTINAL" : comp;

        setNewAssignCompany(assignedCompany);
        setNewAssignData({
            warehouse: initialWh,
            cubicle: "Cubículo 01",
            hopper_tag: assignedHopper,
            assistant_name: cfg?.assistant_name || "",
            assistant_id: cfg?.assistant_id || null,
            left_tag: cfg?.left_tag || auto.left,
            right_tag: cfg?.right_tag || auto.right,
        });
        setIsNewAssignModalOpen(true);
    };

    // Handler al cambiar de almacén en "Asignar Nuevo": PONE EN AUTOMÁTICO LA TOLVA Y ENSACADORAS ASIGNADAS
    const handleNewAssignWarehouseChange = (wh: string) => {
        const targetCub = (wh === "Almacén 04" || wh === "Almacén 05") ? (newAssignData.cubicle || "Cubículo 01") : null;
        const cfg = findWarehouseConfig(wh, targetCub);
        const isFer = (cfg?.hopper_tag && cfg.hopper_tag.includes("-F")) || cfg?.company === "FERTINAL";
        const comp = isFer ? "FERTINAL" : "PRO-AGRO";
        const auto = getAutomaticBaggingMachines(wh, comp);
        const assignedHopper = cfg?.hopper_tag || auto.hopper;
        const assignedCompany = assignedHopper.includes("-F") ? "FERTINAL" : comp;

        setNewAssignCompany(assignedCompany);
        setNewAssignData((prev) => ({
            ...prev,
            warehouse: wh,
            cubicle: targetCub || "",
            hopper_tag: assignedHopper,
            assistant_name: cfg?.assistant_name || "",
            assistant_id: cfg?.assistant_id || null,
            left_tag: cfg?.left_tag || auto.left,
            right_tag: cfg?.right_tag || auto.right,
        }));
    };

    // Handler al cambiar de cubículo en Almacén 4 o 5: PONE EN AUTOMÁTICO LA TOLVA Y ENSACADORAS
    const handleNewAssignCubicleChange = (cub: string) => {
        const cfg = findWarehouseConfig(newAssignData.warehouse, cub);
        const isFer = (cfg?.hopper_tag && cfg.hopper_tag.includes("-F")) || cfg?.company === "FERTINAL";
        const comp = isFer ? "FERTINAL" : newAssignCompany;
        const auto = getAutomaticBaggingMachines(newAssignData.warehouse, comp);
        const assignedHopper = cfg?.hopper_tag || auto.hopper;
        const assignedCompany = assignedHopper.includes("-F") ? "FERTINAL" : comp;

        setNewAssignCompany(assignedCompany);
        setNewAssignData((prev) => ({
            ...prev,
            cubicle: cub,
            hopper_tag: assignedHopper,
            assistant_name: cfg?.assistant_name || "",
            assistant_id: cfg?.assistant_id || null,
            left_tag: cfg?.left_tag || auto.left,
            right_tag: cfg?.right_tag || auto.right,
        }));
    };

    // Handler al seleccionar el auxiliar de carga (pone en automático las ensacadoras)
    const handleNewAssignAssistantChange = (name: string) => {
        const matched = assistantList.find(
            (a) => a.name.toUpperCase() === name.toUpperCase()
        );
        const targetCub = (newAssignData.warehouse === "Almacén 04" || newAssignData.warehouse === "Almacén 05") ? newAssignData.cubicle : null;
        const cfg = findWarehouseConfig(newAssignData.warehouse, targetCub);
        const auto = getAutomaticBaggingMachines(newAssignData.warehouse, newAssignCompany);
        setNewAssignData((prev) => ({
            ...prev,
            assistant_name: name,
            assistant_id: matched?.id || null,
            left_tag: cfg?.left_tag || auto.left,
            right_tag: cfg?.right_tag || auto.right,
        }));
    };

    // Guardar asignación desde "Asignar Nuevo"
    const handleSaveNewAssignment = (e: React.FormEvent) => {
        e.preventDefault();

        const hasCubicle =
            (newAssignData.warehouse === "Almacén 04" || newAssignData.warehouse === "Almacén 05") &&
            Boolean(newAssignData.cubicle);

        const targetWarehouse = hasCubicle
            ? `${newAssignData.warehouse} - ${newAssignData.cubicle}`
            : newAssignData.warehouse;

        const conflict = getAssistantConflict(
            newAssignData.assistant_name,
            targetWarehouse
        );

        const executeSave = () => {
            setIsSubmitting(true);
            const auto = getAutomaticBaggingMachines(newAssignData.warehouse, newAssignCompany);
            const payload = {
                warehouse: targetWarehouse,
                cubicle: hasCubicle ? newAssignData.cubicle : null,
                assistant_name: newAssignData.assistant_name
                    ? newAssignData.assistant_name.trim().toUpperCase()
                    : null,
                assistant_id: newAssignData.assistant_id || null,
                hopper_tag: newAssignData.hopper_tag,
                left_tag: newAssignData.left_tag || auto.left,
                right_tag: newAssignData.right_tag || auto.right,
            };

            router.post(
                route("apt.warehouse-bagging-machines.assign-assistant"),
                payload,
                {
                    onSuccess: () => {
                        setIsNewAssignModalOpen(false);
                        setIsSubmitting(false);

                        // Actualizar estado local
                        setConfigs((prev) => {
                            let found = false;
                            const updated = prev.map((item) => {
                                if (item.warehouse === payload.warehouse) {
                                    found = true;
                                    return {
                                        ...item,
                                        cubicle: payload.cubicle,
                                        assistant_name: payload.assistant_name,
                                        assistant_id: payload.assistant_id,
                                        hopper_tag: payload.hopper_tag,
                                        left_tag: payload.left_tag,
                                        right_tag: payload.right_tag,
                                    };
                                }
                                if (
                                    payload.assistant_name &&
                                    item.assistant_name?.toUpperCase() ===
                                        payload.assistant_name.toUpperCase()
                                ) {
                                    return {
                                        ...item,
                                        assistant_name: null,
                                        assistant_id: null,
                                    };
                                }
                                return item;
                            });

                            if (!found) {
                                updated.push({
                                    id: Date.now(),
                                    warehouse: payload.warehouse,
                                    cubicle: payload.cubicle,
                                    hopper_tag: payload.hopper_tag,
                                    left_tag: payload.left_tag,
                                    right_tag: payload.right_tag,
                                    assistant_name: payload.assistant_name,
                                    assistant_id: payload.assistant_id,
                                    status: "active",
                                });
                            }
                            return updated;
                        });

                        Swal.fire({
                            title: "¡Asignación guardada!",
                            text: payload.assistant_name
                                ? `Se asignó a ${payload.assistant_name} a ${formatWarehouseName(payload.warehouse)} (${getHopperLabel(payload.hopper_tag)} - Ensacadoras: ${payload.left_tag} / ${payload.right_tag}).`
                                : `La posición ha quedado sin auxiliar asignado.`,
                            icon: "success",
                            timer: 2500,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        setIsSubmitting(false);
                        Swal.fire({
                            title: "Error",
                            text: "No se pudo guardar la asignación. Intente de nuevo.",
                            icon: "error",
                        });
                    },
                }
            );
        };

        if (conflict && newAssignData.assistant_name) {
            Swal.fire({
                title: "Auxiliar ya asignado",
                html: `El auxiliar <b>${newAssignData.assistant_name}</b> ya está actualmente asignado a <b>${conflict.warehouse} (${conflict.hopper})</b>.<br/><br/>¿Deseas reasignarlo a esta posición? Se removerá automáticamente de la anterior.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, reasignar",
                cancelButtonText: "Cancelar",
            }).then((res) => {
                if (res.isConfirmed) executeSave();
            });
        } else {
            executeSave();
        }
    };

    // Guardar asignación individual
    const handleSaveAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConfig) return;

        const conflict = getAssistantConflict(
            selectedAssistantName,
            editingConfig.warehouse
        );

        const executeAssign = () => {
            setIsSubmitting(true);
            const auto = getAutomaticBaggingMachines(editingConfig.warehouse, assignCompany);
            const payload = {
                warehouse: editingConfig.warehouse,
                cubicle: editingConfig.cubicle || null,
                assistant_name: selectedAssistantName ? selectedAssistantName.trim().toUpperCase() : null,
                assistant_id: selectedAssistantId || null,
                hopper_tag: selectedHopperTag || editingConfig.hopper_tag,
                left_tag: selectedLeftTag || editingConfig.left_tag || auto.left,
                right_tag: selectedRightTag || editingConfig.right_tag || auto.right,
            };

            router.post(
                route("apt.warehouse-bagging-machines.assign-assistant"),
                payload,
                {
                    onSuccess: () => {
                        setIsAssignModalOpen(false);
                        setIsSubmitting(false);

                        // Actualizar estado local
                        setConfigs((prev) => {
                            let found = false;
                            const updated = prev.map((item) => {
                                if (item.warehouse === payload.warehouse) {
                                    found = true;
                                    return {
                                        ...item,
                                        cubicle: payload.cubicle,
                                        assistant_name: payload.assistant_name,
                                        assistant_id: payload.assistant_id,
                                        hopper_tag: payload.hopper_tag,
                                        left_tag: payload.left_tag,
                                        right_tag: payload.right_tag,
                                    };
                                }
                                // Si estaba en otra posición, desasignar
                                if (
                                    payload.assistant_name &&
                                    item.assistant_name?.toUpperCase() ===
                                        payload.assistant_name.toUpperCase()
                                ) {
                                    return {
                                        ...item,
                                        assistant_name: null,
                                        assistant_id: null,
                                    };
                                }
                                return item;
                            });

                            if (!found) {
                                updated.push({
                                    id: Date.now(),
                                    warehouse: payload.warehouse,
                                    cubicle: payload.cubicle,
                                    hopper_tag: payload.hopper_tag,
                                    left_tag: payload.left_tag,
                                    right_tag: payload.right_tag,
                                    assistant_name: payload.assistant_name,
                                    assistant_id: payload.assistant_id,
                                    status: "active",
                                });
                            }
                            return updated;
                        });

                        Swal.fire({
                            title: "¡Asignación guardada!",
                            text: payload.assistant_name
                                ? `Se asignó a ${payload.assistant_name} a ${formatWarehouseName(payload.warehouse)} (${getHopperLabel(payload.hopper_tag)} - Ensacadoras: ${payload.left_tag} / ${payload.right_tag}).`
                                : `La posición ha quedado sin auxiliar asignado.`,
                            icon: "success",
                            timer: 2500,
                            showConfirmButton: false,
                        });
                    },
                    onError: () => {
                        setIsSubmitting(false);
                        Swal.fire({
                            title: "Error",
                            text: "No se pudo guardar la asignación. Intente de nuevo.",
                            icon: "error",
                        });
                    },
                }
            );
        };

        if (conflict && selectedAssistantName) {
            Swal.fire({
                title: "Auxiliar ya asignado",
                html: `El auxiliar <b>${selectedAssistantName}</b> ya está actualmente asignado a <b>${conflict.warehouse} (${conflict.hopper})</b>.<br/><br/>¿Deseas reasignarlo a esta posición? Se removerá automáticamente de la anterior.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, reasignar",
                cancelButtonText: "Cancelar",
            }).then((res) => {
                if (res.isConfirmed) executeAssign();
            });
        } else {
            executeAssign();
        }
    };

    // Limpiar asignación directa
    const handleClearDirectAssignment = (config: WarehouseBaggingMachine) => {
        Swal.fire({
            title: "¿Desasignar auxiliar?",
            text: `¿Deseas dejar sin auxiliar asignado a ${formatWarehouseName(config.warehouse)} (${getHopperLabel(config.hopper_tag)})?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, desasignar",
            cancelButtonText: "Cancelar",
        }).then((res) => {
            if (res.isConfirmed) {
                router.post(
                    route("apt.warehouse-bagging-machines.assign-assistant"),
                    {
                        warehouse: config.warehouse,
                        cubicle: config.cubicle || null,
                        assistant_name: null,
                        assistant_id: null,
                        hopper_tag: config.hopper_tag,
                    },
                    {
                        onSuccess: () => {
                            setConfigs((prev) =>
                                prev.map((c) =>
                                    c.warehouse === config.warehouse
                                        ? { ...c, assistant_name: null, assistant_id: null }
                                        : c
                                )
                            );
                            Swal.fire({
                                title: "Auxiliar desasignado",
                                text: "La posición ha quedado sin auxiliar asignado.",
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false,
                            });
                        },
                    }
                );
            }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Submodule Banner con botón Asignar Nuevo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                        <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                                ASIGNACIÓN DE AUXILIARES A TOLVAS
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                5 Almacenes ({totalLinesCount} Puntos de Carga)
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                            Asigna y controla los auxiliares de carga en tolvas y cubículos de envasado activos. Almacén 04 y 05 cuentan con 8 cubículos independientes.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                        type="button"
                        onClick={openNewAssignModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                        title="Asignar nuevo auxiliar a tolva o cubículo"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Asignar Nuevo</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Total Tolvas / Cubículos
                        </span>
                        <span className="text-2xl font-black text-gray-800">
                            {totalLinesCount}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                            Con Auxiliar Asignado
                        </span>
                        <span className="text-2xl font-black text-emerald-700">
                            {totalAssignedCount}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                            Sin Auxiliar Asignado
                        </span>
                        <span className="text-2xl font-black text-amber-700">
                            {totalUnassignedCount}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por almacén, cubículo, tolva o auxiliar..."
                            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                        <Filter className="w-4 h-4 text-gray-400 hidden sm:block shrink-0" />
                        <div className="flex rounded-xl bg-gray-200/70 p-0.5 text-xs font-bold text-gray-600 overflow-x-auto scrollbar-none shrink-0">
                            <button
                                type="button"
                                onClick={() => setStatusFilter("ALL")}
                                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                    statusFilter === "ALL"
                                        ? "bg-white text-indigo-950 shadow-xs"
                                        : "hover:text-gray-900"
                                }`}
                            >
                                Todos ({displayWarehouses.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("ASSIGNED")}
                                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                    statusFilter === "ASSIGNED"
                                        ? "bg-white text-emerald-800 shadow-xs"
                                        : "hover:text-gray-900"
                                }`}
                            >
                                Con Asignación
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter("UNASSIGNED")}
                                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                                    statusFilter === "UNASSIGNED"
                                        ? "bg-white text-amber-800 shadow-xs"
                                        : "hover:text-gray-900"
                                }`}
                            >
                                Sin Asignación
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table: exactamente los 5 almacenes */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#2E2A72] text-white font-bold uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-4">Almacén</th>
                                <th className="py-3 px-4">Tolva (Línea)</th>
                                <th className="py-3 px-4">Ensacadoras Operativas</th>
                                <th className="py-3 px-4">Auxiliar de Carga Asignado</th>
                                <th className="py-3 px-4 text-center">Estatus</th>
                                <th className="py-3 px-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                            {filteredWarehouses.length > 0 ? (
                                filteredWarehouses.map((wh) => {
                                    const hopLabel = getHopperLabel(wh.hopper_tag);
                                    const isExpanded = expandedWarehouses.includes(wh.warehouse_number || 0);

                                    // Si es Almacén 4 o 5 (con cubículos)
                                    if (wh.has_cubicles) {
                                        const cubicles = getCubiclesForWarehouse(wh.warehouse_number || 0);
                                        const assignedCount = wh.assignedCubiclesCount || 0;

                                        return (
                                            <React.Fragment key={wh.id || wh.warehouse}>
                                                {/* Fila Principal de Almacén 04 o 05 */}
                                                <tr className="hover:bg-indigo-50/40 transition-colors">
                                                    {/* Almacén con botón de cubículo */}
                                                    <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Warehouse className="w-4 h-4 text-indigo-600" />
                                                            <span className="font-bold text-sm">
                                                                {formatWarehouseName(wh.warehouse)}
                                                            </span>

                                                            {/* Botón de Cubículo solicitado por el usuario */}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedCubiclesWarehouse({
                                                                        warehouse_number: wh.warehouse_number || 0,
                                                                        warehouse_name: formatWarehouseName(wh.warehouse),
                                                                        hopper_tag: wh.hopper_tag || "",
                                                                    })
                                                                }
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                                                                title="Picar para abrir los 8 cubículos"
                                                            >
                                                                <Layers className="w-3.5 h-3.5" />
                                                                <span>Cubículos (8)</span>
                                                            </button>

                                                            {/* Botón para expandir/contraer inline */}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleExpandWarehouse(wh.warehouse_number || 0)}
                                                                className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                                                                title={isExpanded ? "Ocultar cubículos" : "Desplegar cubículos en la tabla"}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <ChevronDown className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Tolva */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <span className="font-mono font-black text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-xs">
                                                            {wh.hopper_tag || "LE-P04"}
                                                        </span>
                                                        <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
                                                            {hopLabel}
                                                        </span>
                                                    </td>

                                                    {/* Ensacadoras */}
                                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-[11px]">
                                                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                                                Izq: {wh.left_tag}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                                Der: {wh.right_tag}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Auxiliar de Carga Asignado (Resumen de cubículos) */}
                                                    <td className="py-3.5 px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedCubiclesWarehouse({
                                                                    warehouse_number: wh.warehouse_number || 0,
                                                                    warehouse_name: formatWarehouseName(wh.warehouse),
                                                                    hopper_tag: wh.hopper_tag || "",
                                                                })
                                                            }
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                                assignedCount > 0
                                                                    ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                                                                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                            }`}
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span>
                                                                {assignedCount} de 8 Cubículos Asignados
                                                            </span>
                                                            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                                                        </button>
                                                    </td>

                                                    {/* Estatus */}
                                                    <td className="py-3.5 px-4 text-center">
                                                        {assignedCount === 8 ? (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                                COMPLETO (8/8)
                                                            </span>
                                                        ) : assignedCount > 0 ? (
                                                            <span className="bg-blue-100 text-blue-800 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                                PARCIAL ({assignedCount}/8)
                                                            </span>
                                                        ) : (
                                                            <span className="bg-gray-100 text-gray-600 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                                SIN ASIGNAR
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Acciones */}
                                                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedCubiclesWarehouse({
                                                                    warehouse_number: wh.warehouse_number || 0,
                                                                    warehouse_name: formatWarehouseName(wh.warehouse),
                                                                    hopper_tag: wh.hopper_tag || "",
                                                                })
                                                            }
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs transition-all duration-150 shadow-2xs cursor-pointer active:scale-95"
                                                        >
                                                            <Layers className="w-3.5 h-3.5" />
                                                            <span>Ver 8 Cubículos</span>
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Despliegue inline si está expandido */}
                                                {isExpanded && (
                                                    <tr className="bg-indigo-50/20">
                                                        <td colSpan={6} className="p-4">
                                                            <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-sm space-y-3">
                                                                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers className="w-4 h-4 text-indigo-600" />
                                                                        <span className="font-bold text-xs text-indigo-950 uppercase tracking-wider">
                                                                            Cubículos de {formatWarehouseName(wh.warehouse)} (8 Cubículos)
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[11px] text-gray-500 font-medium">
                                                                        {assignedCount} de 8 asignados
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                                                    {cubicles.map((cub) => {
                                                                        const hasAsst = Boolean(cub.assistant_name);
                                                                        return (
                                                                            <div
                                                                                key={cub.warehouse}
                                                                                className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                                                                            >
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs font-black text-indigo-900 flex items-center gap-1">
                                                                                        <Layers className="w-3 text-indigo-500" />
                                                                                        {cub.cubicle}
                                                                                    </span>
                                                                                    <span
                                                                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                                            hasAsst
                                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                                : "bg-gray-200 text-gray-600"
                                                                                        }`}
                                                                                    >
                                                                                        {hasAsst ? "Asignado" : "Vacío"}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="text-[11px] min-h-[22px] flex items-center">
                                                                                    {hasAsst ? (
                                                                                        <span className="font-bold text-gray-800 truncate" title={cub.assistant_name || ""}>
                                                                                            👤 {cub.assistant_name}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-gray-400 italic">
                                                                                            Sin auxiliar
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => openAssignModal(cub)}
                                                                                        className="flex-1 py-1 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-[11px] transition-all text-center"
                                                                                    >
                                                                                        {hasAsst ? "Cambiar" : "Asignar"}
                                                                                    </button>
                                                                                    {hasAsst && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleClearDirectAssignment(cub)}
                                                                                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                                                                            title="Desasignar"
                                                                                        >
                                                                                            <RotateCcw className="w-3 h-3" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }

                                    // Almacenes 1, 2 y 3 (Tolva única)
                                    const isAssigned = Boolean(wh.assistant_name);
                                    return (
                                        <tr
                                            key={wh.id || wh.warehouse}
                                            className="hover:bg-indigo-50/30 transition-colors"
                                        >
                                            {/* Almacén */}
                                            <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse className="w-4 h-4 text-indigo-600" />
                                                    <span className="text-sm">{formatWarehouseName(wh.warehouse)}</span>
                                                </div>
                                            </td>

                                            {/* Tolva */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="font-mono font-black text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md text-xs">
                                                    {wh.hopper_tag || "LE-P01"}
                                                </span>
                                                <span className="text-[11px] text-indigo-700 font-bold block mt-0.5">
                                                    {hopLabel}
                                                </span>
                                            </td>

                                            {/* Ensacadoras Operativas */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    {wh.left_tag ? (
                                                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                                            Izq: {wh.left_tag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Izq: Sin Asig.</span>
                                                    )}
                                                    {wh.right_tag ? (
                                                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                                            Der: {wh.right_tag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Der: Sin Asig.</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Auxiliar de Carga */}
                                            <td className="py-3.5 px-4">
                                                {isAssigned ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs shadow-2xs">
                                                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <span className="tracking-wide">
                                                            {wh.assistant_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100 border border-gray-200">
                                                        <Ban className="w-3.5 h-3.5" />
                                                        Sin Auxiliar Asignado
                                                    </span>
                                                )}
                                            </td>

                                            {/* Estatus */}
                                            <td className="py-3.5 px-4 text-center">
                                                {isAssigned ? (
                                                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                        ASIGNADO
                                                    </span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                                                        SIN ASIGNAR
                                                    </span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(wh)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs transition-all duration-150 shadow-2xs cursor-pointer active:scale-95"
                                                        title="Asignar o cambiar auxiliar"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                        <span>{isAssigned ? "Cambiar" : "Asignar"}</span>
                                                    </button>

                                                    {isAssigned && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClearDirectAssignment(wh)}
                                                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                                            title="Quitar asignación de auxiliar"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-12 text-center text-gray-400 font-semibold text-xs"
                                    >
                                        No se encontraron registros de almacenes coincidentes con el filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold border-t-2 border-indigo-200">
                                <td colSpan={2} className="py-3.5 px-4 text-indigo-950 font-black">
                                    TOTAL GENERAL ({filteredWarehouses.length} Almacenes • {totalLinesCount} Puntos de Carga)
                                </td>
                                <td colSpan={4} className="py-3.5 px-4 text-right text-indigo-950 font-black">
                                    {totalAssignedCount} de {totalLinesCount} Tolvas/Cubículos con Auxiliar Asignado
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Modal: Vista de los 8 Cubículos (Se abre al picar el botón "Cubículos (8)") */}
            {selectedCubiclesWarehouse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 animate-fade-in flex flex-col max-h-[92vh] sm:max-h-[90vh]">
                        {/* Header del Modal de Cubículos */}
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="p-2 rounded-xl bg-white/10 shrink-0">
                                    <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base sm:text-lg leading-tight flex items-center gap-2 flex-wrap">
                                        <span>Cubículos de {selectedCubiclesWarehouse.warehouse_name}</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-indigo-100">
                                            8 Cubículos
                                        </span>
                                    </h3>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        Línea de Envasado: {getHopperLabel(selectedCubiclesWarehouse.hopper_tag)} ({selectedCubiclesWarehouse.hopper_tag})
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCubiclesWarehouse(null)}
                                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Contenido: Tabla de los 8 Cubículos */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-950 font-medium">
                                <span>
                                    Asigna un auxiliar de carga a cada uno de los 8 cubículos del {selectedCubiclesWarehouse.warehouse_name}.
                                </span>
                                <span className="font-bold text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs whitespace-nowrap">
                                    {getCubiclesForWarehouse(selectedCubiclesWarehouse.warehouse_number).filter((c) => c.assistant_name).length} de 8 Asignados
                                </span>
                            </div>

                            <div className="rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
                                <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                                            <th className="py-3 px-4">Cubículo</th>
                                            <th className="py-3 px-4">Tolva de Línea</th>
                                            <th className="py-3 px-4">Auxiliar de Carga Asignado</th>
                                            <th className="py-3 px-4 text-center">Estatus</th>
                                            <th className="py-3 px-4 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {getCubiclesForWarehouse(selectedCubiclesWarehouse.warehouse_number).map((cub) => {
                                            const hasAsst = Boolean(cub.assistant_name);
                                            return (
                                                <tr key={cub.warehouse} className="hover:bg-indigo-50/30 transition-colors">
                                                    {/* Cubículo */}
                                                    <td className="py-3 px-4 font-bold text-indigo-950">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="w-4 h-4 text-indigo-600" />
                                                            <span className="font-black text-sm">{cub.cubicle}</span>
                                                        </div>
                                                    </td>

                                                    {/* Tolva */}
                                                    <td className="py-3 px-4 text-gray-700 font-mono font-bold">
                                                        {cub.hopper_tag} ({getHopperLabel(cub.hopper_tag)})
                                                    </td>

                                                    {/* Auxiliar */}
                                                    <td className="py-3 px-4">
                                                        {hasAsst ? (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs">
                                                                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                <span>{cub.assistant_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-400 bg-gray-100">
                                                                <Ban className="w-3 h-3" />
                                                                Sin Asignar
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Estatus */}
                                                    <td className="py-3 px-4 text-center">
                                                        {hasAsst ? (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase">
                                                                ASIGNADO
                                                            </span>
                                                        ) : (
                                                            <span className="bg-gray-100 text-gray-600 text-[11px] font-black rounded-full px-2.5 py-0.5 uppercase">
                                                                SIN ASIGNAR
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Acción */}
                                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openAssignModal(cub)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                <span>{hasAsst ? "Cambiar" : "Asignar"}</span>
                                                            </button>

                                                            {hasAsst && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClearDirectAssignment(cub)}
                                                                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                                                    title="Desasignar auxiliar de este cubículo"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setSelectedCubiclesWarehouse(null)}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Asignar Nuevo (Botón Asignar Nuevo en encabezado) */}
            {isNewAssignModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-fade-in max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <UserCheck className="w-6 h-6 text-indigo-300" />
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                        Asignar Nuevo Auxiliar a Tolva
                                    </h3>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        Selecciona el almacén, cubículo (4 y 5), tolva y el auxiliar
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsNewAssignModalOpen(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveNewAssignment} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                            {/* Almacén y Cubículo (dinámico: solo si es Almacén 04 o 05) */}
                            {newAssignData.warehouse === "Almacén 04" || newAssignData.warehouse === "Almacén 05" ? (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                                Almacén (1 al 5)
                                            </label>
                                            <select
                                                value={newAssignData.warehouse}
                                                onChange={(e) => handleNewAssignWarehouseChange(e.target.value)}
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
                                                value={newAssignData.cubicle}
                                                onChange={(e) => handleNewAssignCubicleChange(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl border border-indigo-300 text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-indigo-50/50 shadow-2xs"
                                            >
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

                                    {/* Validación automática de auxiliar en la posición seleccionada */}
                                    {(() => {
                                        const targetWh = `${newAssignData.warehouse} - ${newAssignData.cubicle}`;
                                        const currentWhAssign = getWarehouseAssignedAssistant(newAssignData.warehouse, newAssignData.cubicle);
                                        return currentWhAssign ? (
                                            <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                                                <span className="flex items-center gap-1.5">
                                                    <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                                    <span>
                                                        Auxiliar actual en {targetWh}: <strong className="text-indigo-950 underline">{currentWhAssign.assistant_name}</strong>
                                                    </span>
                                                </span>
                                                {newAssignData.assistant_name !== currentWhAssign.assistant_name && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNewAssignAssistantChange(currentWhAssign.assistant_name || "")}
                                                        className="text-[10px] bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded-md font-bold transition shadow-2xs cursor-pointer"
                                                        title="Cargar auxiliar asignado actual"
                                                    >
                                                        Cargar
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{targetWh} actualmente sin auxiliar asignado.</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                            Almacén (1 al 5)
                                        </label>
                                        <select
                                            value={newAssignData.warehouse}
                                            onChange={(e) => handleNewAssignWarehouseChange(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                        >
                                            <option value="Almacén 01">Almacén 01</option>
                                            <option value="Almacén 02">Almacén 02</option>
                                            <option value="Almacén 03">Almacén 03</option>
                                            <option value="Almacén 04">Almacén 04</option>
                                            <option value="Almacén 05">Almacén 05</option>
                                        </select>
                                    </div>

                                    {/* Validación automática de auxiliar en el almacén */}
                                    {(() => {
                                        const currentWhAssign = getWarehouseAssignedAssistant(newAssignData.warehouse);
                                        return currentWhAssign ? (
                                            <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                                                <span className="flex items-center gap-1.5">
                                                    <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                                    <span>
                                                        Auxiliar actual en {newAssignData.warehouse}: <strong className="text-indigo-950 underline">{currentWhAssign.assistant_name}</strong>
                                                    </span>
                                                </span>
                                                {newAssignData.assistant_name !== currentWhAssign.assistant_name && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNewAssignAssistantChange(currentWhAssign.assistant_name || "")}
                                                        className="text-[10px] bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded-md font-bold transition shadow-2xs cursor-pointer"
                                                        title="Cargar auxiliar asignado actual"
                                                    >
                                                        Cargar
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{newAssignData.warehouse} actualmente sin auxiliar asignado.</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Filtro de Empresa / Planta (PRO-AGRO / FERTINAL) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Filtrar Tolvas por Empresa</span>
                                    <span className="text-[10px] text-indigo-600 font-bold">
                                        {newAssignCompany === "FERTINAL" ? "Fertinal (LE-F)" : "Pro-Agro (LE-P)"}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewAssignCompany("PRO-AGRO");
                                            const auto = getAutomaticBaggingMachines(newAssignData.warehouse, "PRO-AGRO");
                                            setNewAssignData((prev) => ({
                                                ...prev,
                                                hopper_tag: auto.hopper,
                                                left_tag: auto.left,
                                                right_tag: auto.right,
                                            }));
                                        }}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            newAssignCompany === "PRO-AGRO"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${newAssignCompany === "PRO-AGRO" ? "bg-white" : "bg-blue-500"}`}></span>
                                        PRO-AGRO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewAssignCompany("FERTINAL");
                                            const auto = getAutomaticBaggingMachines(newAssignData.warehouse, "FERTINAL");
                                            setNewAssignData((prev) => ({
                                                ...prev,
                                                hopper_tag: auto.hopper,
                                                left_tag: auto.left,
                                                right_tag: auto.right,
                                            }));
                                        }}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            newAssignCompany === "FERTINAL"
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${newAssignCompany === "FERTINAL" ? "bg-white" : "bg-emerald-500"}`}></span>
                                        FERTINAL
                                    </button>
                                </div>
                            </div>

                            {/* Tolva de Línea */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <span>Tolva de Línea ({newAssignCompany})</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            Asignada por almacén
                                        </span>
                                    </span>
                                    <span className="text-[10px] text-indigo-600 font-bold">
                                        {getHopperLabel(newAssignData.hopper_tag)}
                                    </span>
                                </label>
                                <select
                                    value={newAssignData.hopper_tag}
                                    onChange={(e) => setNewAssignData((prev) => ({ ...prev, hopper_tag: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                >
                                    {getHoppersForCompany(newAssignCompany).map((hop) => (
                                        <option key={hop.tag} value={hop.tag}>
                                            {hop.tag} - {getHopperLabel(hop.tag)} {hop.serial_number ? `(Serie: ${hop.serial_number})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Auxiliar de Carga */}
                            <div>
                                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">
                                    Auxiliar de Carga
                                </label>

                                <select
                                    value={newAssignData.assistant_name}
                                    onChange={(e) => handleNewAssignAssistantChange(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                                >
                                    <option value="">-- Sin Auxiliar (Dejar vacía) --</option>
                                    {assistantList
                                        .filter((asst) => {
                                            const targetWh = (newAssignData.warehouse === "Almacén 04" || newAssignData.warehouse === "Almacén 05") && newAssignData.cubicle
                                                ? `${newAssignData.warehouse} - ${newAssignData.cubicle}`
                                                : newAssignData.warehouse;
                                            const conflict = getAssistantConflict(asst.name, targetWh);
                                            // Si ya está asignado a una tolva, no aparece en la lista
                                            return !conflict;
                                        })
                                        .map((asst) => (
                                            <option key={asst.id || asst.name} value={asst.name}>
                                                {asst.name}
                                            </option>
                                        ))}
                                </select>

                                {newAssignData.assistant_name && (
                                    <div className="mt-1.5 text-[11px]">
                                        {(() => {
                                            const targetWh = (newAssignData.warehouse === "Almacén 04" || newAssignData.warehouse === "Almacén 05") && newAssignData.cubicle
                                                ? `${newAssignData.warehouse} - ${newAssignData.cubicle}`
                                                : newAssignData.warehouse;
                                            const conflict = getAssistantConflict(newAssignData.assistant_name, targetWh);
                                            return conflict ? (
                                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    Este auxiliar ya está asignado a otra posición ({conflict.warehouse}). Se reasignará al guardar.
                                                </span>
                                            ) : (
                                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Auxiliar disponible para asignación.
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Ensacadoras Operativas Puestas en Automático */}
                            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-3 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                    <label className="text-[11px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                                        Ensacadoras Operativas de la Línea
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded-lg p-2 border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                                            Ensacadora Izquierda
                                        </span>
                                        <span className="text-xs font-black text-indigo-800 font-mono">
                                            {newAssignData.left_tag}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border border-emerald-100 shadow-2xs">
                                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                                            Ensacadora Derecha
                                        </span>
                                        <span className="text-xs font-black text-emerald-800 font-mono">
                                            {newAssignData.right_tag}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span>Línea vinculada:</span>
                                    <strong className="text-indigo-900 font-bold">
                                        {newAssignData.hopper_tag} ({getHopperLabel(newAssignData.hopper_tag)})
                                    </strong>
                                </p>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsNewAssignModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSubmitting ? "Guardando..." : "Guardar Asignación"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Asignar Auxiliar a Tolva / Cubículo Individual */}
            {isAssignModalOpen && editingConfig && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-fade-in max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <UserCheck className="w-6 h-6 text-indigo-300" />
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                        Asignar Auxiliar: {formatWarehouseName(editingConfig.warehouse)}
                                    </h3>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        {getHopperLabel(selectedHopperTag)} • {selectedHopperTag}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAssignModalOpen(false)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveAssignment} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
                            {/* Almacén y Cubículo */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Posición (Almacén / Cubículo)
                                </label>
                                <input
                                    type="text"
                                    value={formatWarehouseName(editingConfig.warehouse)}
                                    disabled
                                    className="w-full bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-xl text-sm border border-gray-200 cursor-not-allowed"
                                />
                            </div>

                            {/* Filtro de Empresa / Planta (PRO-AGRO / FERTINAL) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>Filtrar Tolvas por Empresa</span>
                                    <span className="text-[10px] text-indigo-600 font-bold">
                                        {assignCompany === "FERTINAL" ? "Fertinal (LE-F)" : "Pro-Agro (LE-P)"}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignCompany("PRO-AGRO");
                                            if (selectedHopperTag.startsWith("LE-F")) {
                                                setSelectedHopperTag("LE-P01");
                                            }
                                        }}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            assignCompany === "PRO-AGRO"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${assignCompany === "PRO-AGRO" ? "bg-white" : "bg-blue-500"}`}></span>
                                        PRO-AGRO
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAssignCompany("FERTINAL");
                                            if (selectedHopperTag.startsWith("LE-P")) {
                                                setSelectedHopperTag("LE-F01");
                                            }
                                        }}
                                        className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            assignCompany === "FERTINAL"
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${assignCompany === "FERTINAL" ? "bg-white" : "bg-emerald-500"}`}></span>
                                        FERTINAL
                                    </button>
                                </div>
                            </div>

                            {/* Tolva de Línea */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <span>Tolva de Línea ({assignCompany})</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            Asignada por almacén
                                        </span>
                                    </span>
                                    <span className="text-[10px] text-indigo-600 font-bold">
                                        {getHopperLabel(selectedHopperTag)}
                                    </span>
                                </label>
                                <select
                                    value={selectedHopperTag}
                                    onChange={(e) => setSelectedHopperTag(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs"
                                >
                                    {getHoppersForCompany(assignCompany).map((hop) => (
                                        <option key={hop.tag} value={hop.tag}>
                                            {hop.tag} - {getHopperLabel(hop.tag)} {hop.serial_number ? `(Serie: ${hop.serial_number})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Auxiliar de Carga */}
                            <div>
                                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1">
                                    Auxiliar de Carga
                                </label>

                                <select
                                    value={selectedAssistantName}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setSelectedAssistantName(name);
                                        const matched = assistantList.find(
                                            (a) => a.name.toUpperCase() === name.toUpperCase()
                                        );
                                        setSelectedAssistantId(matched?.id || null);
                                        const cfg = editingConfig ? findWarehouseConfig(editingConfig.warehouse, editingConfig.cubicle) : null;
                                        const auto = editingConfig ? getAutomaticBaggingMachines(editingConfig.warehouse, assignCompany) : { left: "", right: "" };
                                        setSelectedLeftTag(cfg?.left_tag || editingConfig?.left_tag || auto.left);
                                        setSelectedRightTag(cfg?.right_tag || editingConfig?.right_tag || auto.right);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                                >
                                    <option value="">-- Sin Auxiliar (Dejar vacía) --</option>
                                    {assistantList
                                        .filter((asst) => {
                                            const conflict = editingConfig
                                                ? getAssistantConflict(asst.name, editingConfig.warehouse)
                                                : null;
                                            // Si ya está asignado a otra tolva, no aparece en la lista
                                            return !conflict;
                                        })
                                        .map((asst) => (
                                            <option key={asst.id || asst.name} value={asst.name}>
                                                {asst.name}
                                            </option>
                                        ))}
                                </select>

                                {selectedAssistantName && (
                                    <div className="mt-1.5 text-[11px]">
                                        {getAssistantConflict(selectedAssistantName, editingConfig.warehouse) ? (
                                            <span className="text-amber-600 font-bold flex items-center gap-1">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Este auxiliar ya está asignado a otra posición. Se reasignará al guardar.
                                            </span>
                                        ) : (
                                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Auxiliar disponible para asignación.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Ensacadoras Operativas Puestas en Automático */}
                            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-3 space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                    <label className="text-[11px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                                        Ensacadoras Operativas de la Línea
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded-lg p-2 border border-indigo-100 shadow-2xs">
                                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                                            Ensacadora Izquierda
                                        </span>
                                        <span className="text-xs font-black text-indigo-800 font-mono">
                                            {selectedLeftTag || editingConfig.left_tag || getAutomaticBaggingMachines(editingConfig.warehouse, assignCompany).left}
                                        </span>
                                    </div>
                                    <div className="bg-white rounded-lg p-2 border border-emerald-100 shadow-2xs">
                                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                                            Ensacadora Derecha
                                        </span>
                                        <span className="text-xs font-black text-emerald-800 font-mono">
                                            {selectedRightTag || editingConfig.right_tag || getAutomaticBaggingMachines(editingConfig.warehouse, assignCompany).right}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span>Línea vinculada:</span>
                                    <strong className="text-indigo-900 font-bold">
                                        {selectedHopperTag} ({getHopperLabel(selectedHopperTag)})
                                    </strong>
                                </p>
                            </div>

                            {/* Botón rápido para limpiar asignación */}
                            {selectedAssistantName && (
                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAssistantName("");
                                            setSelectedAssistantId(null);
                                        }}
                                        className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Quitar auxiliar (Dejar sin asignación)</span>
                                    </button>
                                </div>
                            )}

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isSubmitting ? "Guardando..." : "Guardar Asignación"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
