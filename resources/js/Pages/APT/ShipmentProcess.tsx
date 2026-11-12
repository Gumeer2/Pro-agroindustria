import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import {
    ArrowLeft,
    Camera,
    Check,
    CheckCircle2,
    ChevronsUpDown,
    Clock,
    FileText,
    MoreHorizontal,
    Package,
    Pause,
    Pencil,
    Plus,
    Printer,
    QrCode,
    Search,
    Settings,
    Trash2,
    Truck,
    User,
    UserRound,
    Warehouse,
    X,
    Layers,
    Scale,
    Sliders,
    FileSpreadsheet,
    Lock,
    Unlock,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    UserCheck,
    RotateCcw,
    ShieldAlert,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { Dialog, Menu, Transition } from "@headlessui/react";
import LoadingAssistantDropdown from "@/Components/LoadingAssistantDropdown";
import VerifierDropdown from "@/Components/VerifierDropdown";
import QrScannerModal from "@/Components/QrScannerModal";
import EnsacadoraSamplingModal from "@/Components/EnsacadoraSamplingModal";
import ShipmentDocumentsPrintModal from "@/Components/ShipmentDocumentsPrintModal";
import StowagePlanModal from "@/Components/StowagePlanModal";

interface Lot {
    id: number;
    folio: string;
    plant_origin?: string;
    warehouse?: string;
    cubicle?: string;
}

interface Assistant {
    id: number;
    name: string;
}

interface HistoryItem {
    id: string;
    history_id?: number;
    shipment_order_id?: string;
    lot_id: number | string | null;
    warehouse?: string;
    cubicle?: string;
    lot_folio?: string;
    folio: string;
    order_number?: string;
    operator: string;
    squad_leader: string;
    product: string;
    presentation?: string;
    sacks_count?: string | number | null;
    programmed_tons?: string | number | null;
    programmed_weight?: string | number | null;
    plates: string;
    started_at: string | null;
    finished_at: string | null;
    status: string;
    stowage_count?: number | null;
    samples?: any[];
    target_samples_count?: number;
    sampling_completed_at?: string | null;
    sampling_status?: string | null;
    sampling_avg?: number | null;
    stowage_plan?: any;
    stowage_plan_status?: string | null;
    stowage_plan_saved_at?: string | null;
    stowage_plan_saved_by?: number | string | null;
    vobo_status?: string | null;
    vobo_by?: string | null;
    vobo_at?: string | null;
    sampling_release_status?: string | null;
    released_by?: string | null;
    released_at?: string | null;
    loading_assistant?: string | null;
    is_sampling_blocked?: boolean;
    sampling_unlock_count?: number;
}

interface Props {
    auth: any;
    is_estibadores_module?: boolean;
    context_module?: string;
    lots: Lot[];
    squad_leaders: string[];
    assistants: Assistant[];
    verifiers?: Assistant[];
    initial_history: HistoryItem[];
    initial_incidents?: any[];
}

function normalizeWarehouseNumber(w?: string | null): number | null {
    if (!w) return null;
    const match = w.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

function normalizeCubicleNumber(c?: string | null): number | null {
    if (!c) return null;
    const match = c.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

const WarehouseModal = ({
    isOpen,
    onClose,
    currentWarehouse,
    currentCubicle,
    onSelect,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentWarehouse: number;
    currentCubicle: number | null;
    onSelect: (warehouseId: number, cubicleId: number | null) => void;
}) => {
    const [selectedWh, setSelectedWh] = useState<number>(currentWarehouse);
    const [selectedCub, setSelectedCub] = useState<number | null>(currentCubicle);

    useEffect(() => {
        if (isOpen) {
            setSelectedWh(currentWarehouse);
            setSelectedCub(currentCubicle);
        }
    }, [isOpen, currentWarehouse, currentCubicle]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Warehouse className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black">Seleccionar Almacén</h3>
                            <p className="text-indigo-100 text-sm font-medium">
                                Almacén de trabajo activo
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 max-h-[75vh] overflow-y-auto">
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((id) => {
                            const isSelected = selectedWh === id;
                            return (
                                <div key={id} className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedWh(id);
                                            if (id !== 5 && id !== 4) {
                                                onSelect(id, null);
                                                onClose();
                                            }
                                        }}
                                        className={`w-full group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                            isSelected
                                                ? "border-indigo-600 bg-indigo-50/70"
                                                : "border-gray-100 hover:border-indigo-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`p-3.5 rounded-xl font-black text-lg transition-colors ${
                                                    isSelected
                                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                        : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                                                }`}
                                            >
                                                <span>0{id}</span>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-gray-900 text-base">
                                                    ALMACÉN 0{id}
                                                </div>
                                                {(id === 5 || id === 4) && (
                                                    <div className="text-xs text-indigo-600 font-bold">
                                                        {selectedWh === id && selectedCub !== null
                                                            ? `Cubículo 0${selectedCub} seleccionado`
                                                            : "8 cubículos disponibles"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && id !== 5 && id !== 4 && (
                                            <div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-md shadow-indigo-200">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                        )}
                                        {(id === 5 || id === 4) && isSelected && (
                                            <div className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                                                {selectedCub ? `Cub. 0${selectedCub}` : "Todos"}
                                            </div>
                                        )}
                                    </button>

                                    {/* Cubicle Selection for Warehouse 4 and 5 */}
                                    {(id === 5 || id === 4) && isSelected && (
                                        <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 animate-fade-in">
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                                                    Cubículos de Almacén {id}:
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCub(null);
                                                        onSelect(id, null);
                                                        onClose();
                                                    }}
                                                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                        selectedCub === null
                                                            ? "bg-indigo-600 text-white shadow-sm"
                                                            : "bg-white text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 border border-gray-200"
                                                    }`}
                                                >
                                                    Ver Todos
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((cId) => (
                                                    <button
                                                        key={cId}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCub(cId);
                                                            onSelect(id, cId);
                                                            onClose();
                                                        }}
                                                        className={`py-2 px-1 rounded-xl text-xs font-black border transition-all text-center ${
                                                            selectedCub === cId
                                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105"
                                                                : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-white/80"
                                                        }`}
                                                    >
                                                        Cub. 0{cId}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [
        h > 0 ? String(h).padStart(2, "0") : null,
        String(m).padStart(2, "0"),
        String(s).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");
}

function formatDateTime(isoString: string | null): string {
    if (!isoString) return "Pendiente";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "p.m." : "a.m.";
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
}

function LiveStopwatch({
    startedAt,
    finishedAt,
    status,
}: {
    startedAt: string | null;
    finishedAt: string | null;
    status?: string;
    isSamplingIncomplete?: boolean;
    samplingCompletedAt?: string | null;
}) {
    const calculateElapsed = () => {
        if (!startedAt) return 0;
        const startMs = new Date(startedAt).getTime();
        if (isNaN(startMs)) return 0;

        if (finishedAt) {
            const endMs = new Date(finishedAt).getTime();
            if (isNaN(endMs)) return 0;
            return Math.max(0, Math.floor((endMs - startMs) / 1000));
        }

        return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    };

    const [elapsed, setElapsed] = useState(calculateElapsed);

    useEffect(() => {
        setElapsed(calculateElapsed());

        if (!startedAt || finishedAt) {
            return;
        }

        const startMs = new Date(startedAt).getTime();
        const timer = setInterval(() => {
            const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
            setElapsed(diff);
        }, 1000);

        return () => clearInterval(timer);
    }, [startedAt, finishedAt]);

    return (
        <span className="font-mono font-bold text-xs text-indigo-900 tracking-wider">
            {formatDuration(elapsed)}
        </span>
    );
}

const isRowEnvasado = (row: any): boolean => {
    if (!row) return false;
    const pres = (row.presentation || "").toString().toUpperCase();
    if (pres.includes("ENVASADO")) return true;
    if (pres.includes("GRANEL")) return false;
    if (row.stowage_plan || row.stowage_plan_status === "completed" || row.stowage_plan_saved_at) return true;
    if (row.stowage_count && parseInt(row.stowage_count, 10) > 0) return true;
    if (row.sacks_count && parseInt(row.sacks_count, 10) > 0) return true;
    const text = `${row.product || row.product_text || ""}`.toUpperCase();
    return text.includes("ENVASADO") || text.includes("SACO") || text.includes("25KG") || text.includes("50KG") || text.includes("25 KG") || text.includes("50 KG");
};

const getTargetSamplesPerEnsacadoraForRow = (row: any): number => {
    if (row?.target_samples_per_ensacadora && Number(row.target_samples_per_ensacadora) > 0) {
        return Math.min(40, Math.max(2, Number(row.target_samples_per_ensacadora)));
    }
    const pt = parseFloat(String(row?.programmed_tons || "0"));
    const pw = parseFloat(String(row?.programmed_weight || "0"));
    const tons = pt > 0 ? pt : (pw > 0 ? (pw > 200 ? pw / 1000 : pw) : 36);
    const m = 2 * Math.ceil(((tons * 40.0) / 36.0) / 2.0);
    return Math.max(2, Math.min(40, m));
};

const getTargetSamplesForRow = (row: any): number => {
    return getTargetSamplesPerEnsacadoraForRow(row) * 2;
};

const getOrderSamplingStatus = (row: HistoryItem): {
    isEnvasado: boolean;
    isCompleted: boolean;
    samplesCount: number;
    targetSamples: number;
    targetPerEnsacadora: number;
    env1Count: number;
    env2Count: number;
    savedAt: string | null;
} => {
    const targetPerEnsacadora = getTargetSamplesPerEnsacadoraForRow(row);
    const targetSamples = targetPerEnsacadora * 2;
    if (!isRowEnvasado(row)) {
        return { isEnvasado: false, isCompleted: true, samplesCount: 0, targetSamples, targetPerEnsacadora, env1Count: 0, env2Count: 0, savedAt: null };
    }

    // La base de datos es la única fuente de verdad (fórmula VECODE: M por ensacadora, M*2 total)
    const dbSamples = Array.isArray(row.samples) ? row.samples : [];
    const dbCount = dbSamples.length;
    const env1Count = dbSamples.filter((s: any) => (s?.ensacadora || s?.envasadora || 1) === 1).length;
    const env2Count = dbSamples.filter((s: any) => (s?.ensacadora || s?.envasadora) === 2).length;
    const dbCompleted = env1Count >= targetPerEnsacadora && env2Count >= targetPerEnsacadora;
    const dbSavedAt = dbCompleted ? (row.sampling_completed_at || null) : null;

    // Si la base de datos no tiene muestras, limpiar cualquier clave huérfana de localStorage
    if (dbCount === 0 && typeof window !== "undefined") {
        const id = row.id || (row as any).order_number || row.folio;
        const keysToClean = [
            `ensacadora_sampling_order_${id}`,
            `ensacadora_sampling_${id}`,
            `envasadora_sampling_order_${id}`,
            `envasadora_sampling_${id}`,
            row.folio ? `ensacadora_sampling_order_${row.folio}` : null,
            row.folio ? `ensacadora_sampling_${row.folio}` : null,
            row.folio ? `envasadora_sampling_order_${row.folio}` : null,
            row.folio ? `envasadora_sampling_${row.folio}` : null,
            row.id ? `ensacadora_sampling_order_${row.id}` : null,
            row.id ? `ensacadora_sampling_${row.id}` : null,
            "ensacadora_sampling_draft_temp",
            "envasadora_sampling_draft_temp",
        ].filter(Boolean) as string[];
        keysToClean.forEach((k) => {
            try { localStorage.removeItem(k); } catch (e) {}
        });
    }

    return {
        isEnvasado: true,
        isCompleted: dbCompleted,
        samplesCount: dbCount,
        targetSamples,
        targetPerEnsacadora,
        env1Count,
        env2Count,
        savedAt: dbSavedAt,
    };
};

export default function ShipmentProcess({
    auth,
    is_estibadores_module = false,
    context_module = "",
    lots = [],
    squad_leaders = [],
    assistants = [],
    verifiers = [],
    initial_history = [],
    initial_incidents = [],
}: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [history, setHistory] = useState<HistoryItem[]>(initial_history);
    const [incidents, setIncidents] = useState<any[]>(initial_incidents || []);
    const [isIncidentsOpen, setIsIncidentsOpen] = useState(false);
    const [incidentsSearch, setIncidentsSearch] = useState("");
    const [searchQr, setSearchQr] = useState("");
    const [isSearchingQr, setIsSearchingQr] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [scannedOrder, setScannedOrder] = useState<any>(null);

    const refreshIncidents = async () => {
        try {
            const res = await axios.get(route("documentation.shipment-orders.sampling-incidents"));
            if (res.data?.incidents) {
                setIncidents(res.data.incidents);
            }
        } catch (e) {
            console.error("Error al refrescar incidencias:", e);
        }
    };

    const filteredIncidents = useMemo(() => {
        if (!incidentsSearch.trim()) return incidents;
        const q = incidentsSearch.toLowerCase().trim();
        return incidents.filter((inc) => {
            const folio = (inc.order_folio || "").toLowerCase();
            const user = (inc.unlocked_by_name || "").toLowerCase();
            const assistant = (inc.assistant_name || "").toLowerCase();
            const wh = (inc.warehouse || "").toLowerCase();
            const reason = (inc.reason || "").toLowerCase();
            return folio.includes(q) || user.includes(q) || assistant.includes(q) || wh.includes(q) || reason.includes(q);
        });
    }, [incidents, incidentsSearch]);

    // Active Warehouse & Cubicle Selection
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("shipment_process_selected_warehouse") : null;
        if (saved) {
            const num = parseInt(saved, 10);
            if (num >= 1 && num <= 5) return num;
        }
        return 1;
    });

    const [selectedCubicle, setSelectedCubicle] = useState<number | null>(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("shipment_process_selected_cubicle") : null;
        if (saved && saved !== "all") {
            const num = parseInt(saved, 10);
            if (num >= 1 && num <= 8) return num;
        }
        return null;
    });

    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

    // Form fields
    const [warehouse, setWarehouse] = useState<string>(() => `Almacen ${selectedWarehouseId}`);
    const [selectedLotId, setSelectedLotId] = useState<string>("");
    const [squadLeader, setSquadLeader] = useState<string>(squad_leaders[0] || "");
    const [loadingAssistant, setLoadingAssistant] = useState<string>("");
    const [stowageCount, setStowageCount] = useState<string>("");
    const [verifier, setVerifier] = useState<string>("");
    const [estibaObservations, setEstibaObservations] = useState<string>("");
    const [avgUnitWeight, setAvgUnitWeight] = useState<string>("");
    const [stowageGroups, setStowageGroups] = useState<Array<{ count: number; sacks: number }>>([]);
    const [isSaving, setIsSaving] = useState(false);

    const buildStowagesArray = (groups: Array<{ count: number; sacks: number }>): (number | null)[] => {
        const arr: (number | null)[] = Array(24).fill(null);
        let idx = 0;
        for (const g of groups) {
            for (let i = 0; i < g.count && idx < 24; i++) {
                arr[idx] = g.sacks;
                idx++;
            }
        }
        return arr;
    };

    const totalEstibasCaptured = useMemo(
        () => stowageGroups.reduce((sum, g) => sum + g.count, 0),
        [stowageGroups]
    );

    const totalSacksCaptured = useMemo(
        () => stowageGroups.reduce((sum, g) => sum + g.count * g.sacks, 0),
        [stowageGroups]
    );

    const expectedSacksForOrder = useMemo(() => {
        if (!scannedOrder) return 0;
        const tons = parseFloat(String(scannedOrder.programmed_tons ?? scannedOrder.programmed_weight ?? 0));
        const sacksStr = String(scannedOrder.sacks_count ?? "").trim();

        if (!isNaN(tons) && tons > 0) {
            if (sacksStr.toUpperCase().includes("KG")) {
                const size = parseInt(sacksStr.replace(/\D/g, ""), 10);
                if (!isNaN(size) && size > 0) {
                    return Math.round((tons * 1000) / size);
                }
            }
            const pres = `${scannedOrder.presentation || ""} ${scannedOrder.product || ""} ${scannedOrder.product_text || ""}`.toUpperCase();
            if (pres.includes("25")) return Math.round(tons * 40);
            if (pres.includes("50")) return Math.round(tons * 20);
            if (pres.includes("200")) return Math.round(tons * 5);
            if (pres.includes("500")) return Math.round(tons * 2);
            if (pres.includes("1000")) return Math.round(tons * 1);
        }

        if (sacksStr && !sacksStr.toUpperCase().includes("KG")) {
            const numericSacks = parseInt(sacksStr.replace(/\D/g, ""), 10);
            if (!isNaN(numericSacks) && numericSacks > 0) {
                return numericSacks;
            }
        }

        if (!isNaN(tons) && tons > 0) {
            return Math.round(tons * 40);
        }
        return 0;
    }, [scannedOrder]);

    const handleAddStowageGroup = async () => {
        const remaining = 24 - totalEstibasCaptured;
        if (remaining <= 0) {
            Swal.fire({
                icon: "info",
                title: "Límite alcanzado",
                text: "Ya se completaron las 24 estibas máximas.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        const remainingSacks = expectedSacksForOrder > 0 ? Math.max(0, expectedSacksForOrder - totalSacksCaptured) : null;
        if (expectedSacksForOrder > 0 && remainingSacks !== null && remainingSacks <= 0) {
            Swal.fire({
                icon: "info",
                title: "Sacos Completados",
                html: `Ya se completaron los <b>${expectedSacksForOrder} sacos</b> programados para esta orden (${scannedOrder?.programmed_tons || ""} TM).<br/><span class="text-xs text-slate-500">Si desea modificar la distribución, elimine primero un grupo de estibas.</span>`,
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        const startIdx = totalEstibasCaptured + 1;
        const sacksBannerHtml = expectedSacksForOrder > 0
            ? `<div class="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between">
                    <span>Programados: <b>${expectedSacksForOrder} sacos</b></span>
                    <span>Capturados: <b>${totalSacksCaptured}</b></span>
                    <span class="font-extrabold text-indigo-700">Restan: ${remainingSacks} sacos</span>
               </div>`
            : "";

        const { value: formValues } = await Swal.fire({
            title: "Agregar Estibas y Sacos",
            html: `
                <div class="text-left space-y-3">
                    <p class="text-xs text-slate-600">
                        Se asignará consecutivamente a partir del lugar <b>#${startIdx}</b> (disponibles: <b>${remaining}</b> estiba(s)).
                    </p>
                    ${sacksBannerHtml}
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Cantidad de estibas</label>
                        <input id="swal-est-count" type="number" min="1" max="${remaining}" class="swal2-input !m-0 !w-full" placeholder="Ej: 9 (o 1 para el lugar ${startIdx})" autofocus />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Número de sacos por estiba</label>
                        <input id="swal-est-sacks" type="number" min="1" ${remainingSacks !== null ? `max="${remainingSacks}"` : ""} class="swal2-input !m-0 !w-full" placeholder="Ej: 120" />
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Agregar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#4f46e5",
            preConfirm: () => {
                const cnt = parseInt((document.getElementById("swal-est-count") as HTMLInputElement)?.value || "0", 10);
                const sck = parseInt((document.getElementById("swal-est-sacks") as HTMLInputElement)?.value || "0", 10);
                if (!cnt || cnt < 1 || cnt > remaining) {
                    Swal.showValidationMessage(`La cantidad de estibas debe estar entre 1 y ${remaining}.`);
                    return false;
                }
                if (!sck || sck < 1) {
                    Swal.showValidationMessage("Ingrese un número válido de sacos mayor a 0.");
                    return false;
                }
                const addedSacks = cnt * sck;
                if (expectedSacksForOrder > 0 && remainingSacks !== null && addedSacks > remainingSacks) {
                    Swal.showValidationMessage(
                        `El subtotal a agregar (${cnt} × ${sck} = ${addedSacks} sacos) excede los ${remainingSacks} sacos restantes de la orden (Total programado: ${expectedSacksForOrder} sacos).`
                    );
                    return false;
                }
                return { cnt, sck };
            },
        });

        if (formValues) {
            setStowageGroups((prev) => [...prev, { count: formValues.cnt, sacks: formValues.sck }]);
        }
    };

    const totalSamples = "80";

    const isEnvasado = useMemo(() => {
        if (!scannedOrder) return false;
        const pres = (scannedOrder.presentation || "").toString().toUpperCase();
        if (pres.includes("ENVASADO")) return true;
        if (pres.includes("GRANEL")) return false;
        const text = `${scannedOrder.product || ""} ${scannedOrder.product_text || ""} ${scannedOrder.sacks_count || ""}`.toUpperCase();
        return text.includes("ENVASADO") || text.includes("SACO") || text.includes("25KG") || text.includes("50KG") || text.includes("25 KG") || text.includes("50 KG");
    }, [scannedOrder]);

    const suggestedSamplesPerStowage = useMemo(() => {
        const estibas = parseFloat(stowageCount);
        if (!estibas || isNaN(estibas) || estibas <= 0) return "";
        const result = 80 / estibas;
        if (Number.isInteger(result)) {
            return result.toString();
        }
        return parseFloat(result.toFixed(2)).toString();
    }, [stowageCount]);

    // Success Modal & Sampling Modal & Print Documents Modal & Plan de Estiba
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSamplingModalOpen, setIsSamplingModalOpen] = useState(false);
    const [activeSamplingOrder, setActiveSamplingOrder] = useState<any>(null);
    const [isStowageModalOpen, setIsStowageModalOpen] = useState(false);
    const [activeStowageOrder, setActiveStowageOrder] = useState<any>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printOrderData, setPrintOrderData] = useState<any>(null);
    const [printSamplesData, setPrintSamplesData] = useState<any[]>([]);
    const [samplingRevision, setSamplingRevision] = useState(0);

    const userRoles: any[] = auth?.user?.roles || [];
    const isAdmin = useMemo(() => {
        return userRoles.some((r: any) => {
            const name = (typeof r === "string" ? r : r.name || "").toLowerCase();
            return name === "admin" || name === "administrador" || name === "super-admin";
        }) || Boolean(auth?.user?.is_admin) || (auth?.user?.name || "").toLowerCase().includes("admin");
    }, [userRoles, auth?.user]);

    const isEstibadorRole = useMemo(() => {
        if (isAdmin) return false;
        return userRoles.some((r: any) => {
            const name = (typeof r === "string" ? r : r.name || "").toLowerCase();
            return name === "estibador" || name === "estibadores";
        });
    }, [userRoles, isAdmin]);

    // Determina si está en el módulo o con rol de Estibadores
    const isEstibadorUser = Boolean(
        is_estibadores_module ||
        context_module === "estibadores" ||
        isEstibadorRole ||
        (typeof window !== "undefined" && (window.location.pathname.includes("estibadores") || window.location.href.includes("estibadores")))
    );

    const isStowagePlanCompleted = (row: any): boolean => {
        if (!row) return false;
        if (row.stowage_plan_status === "completed") return true;
        if (row.stowage_plan_saved_at) return true;
        if (row.stowage_plan && typeof row.stowage_plan === "object") {
            const st = row.stowage_plan;
            if (st.operator_name || st.unit_type || (Array.isArray(st.stowages) && st.stowages.length > 0)) {
                return true;
            }
        }
        return false;
    };

    const isVoBoApproved = (row: any): boolean => {
        if (!row) return false;
        return (row.vobo_status || row.stowage_plan?.vobo_status) === "approved";
    };

    const isSamplingReleased = (row: any): boolean => {
        if (!row) return false;
        return Boolean(row.finished_at) || (row.sampling_release_status || row.stowage_plan?.sampling_release_status) === "released";
    };

    const isInAptProcess = (row: any): boolean => {
        if (!row) return false;
        if (isVoBoApproved(row)) return true;
        if (Array.isArray(row.samples) && row.samples.length > 0) return true;
        if (row.finished_at) return true;
        return false;
    };

    const handleApproveVoBo = async (row: any) => {
        const targetId = row?.id || row?.shipment_order_id || row?.history_id;
        if (!targetId) return;

        const result = await Swal.fire({
            title: "¿Dar VoBo a la Nota de Estiba?",
            html: `¿Confirmas que revisaste la <b>Nota de Estiba (GLS-AP-FO-002)</b> de la orden <b>${row.folio || ""}</b> y autorizas el <b>VoBo</b> para que el personal estibador inicie la toma de muestras?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "✓ Sí, autorizar VoBo",
            cancelButtonText: "Revisar Nota primero",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#4f46e5",
        });

        if (result.dismiss === Swal.DismissReason.cancel) {
            handleOpenStowagePlan(row);
            return;
        }
        if (!result.isConfirmed) return;

        try {
            const res = await axios.post(route("documentation.shipment-orders.vobo-stowage-plan", targetId));
            await refreshHistory();
            Swal.fire({
                icon: "success",
                title: "¡VoBo Autorizado!",
                text: res.data?.message || "VoBo registrado correctamente. El personal estibador ya puede realizar la toma de muestras.",
                timer: 2500,
                showConfirmButton: false,
            });
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "No se pudo registrar el VoBo.",
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    const handleOpenStowagePlan = (order: any) => {
        if (isEstibadorUser && order && isInAptProcess(order)) {
            Swal.fire({
                icon: "warning",
                title: "Nota de Estiba con VoBo / En Proceso",
                html: `<div class="text-left space-y-2">
                    <p class="font-medium text-slate-800">
                        La orden <b>${order.folio || ""}</b> ya cuenta con <b>VoBo de Supervisión PROAGRO</b> o ya inició la toma de muestras.
                    </p>
                    <p class="text-sm text-slate-600">
                        Solo podrá editar la nota de estiba si Supervisión PROAGRO la libera/elimina primero en Gestión de Proceso de Embarques (APT).
                    </p>
                </div>`,
                confirmButtonColor: "#4f46e5",
            });
            return;
        }
        setActiveStowageOrder(order);
        setIsStowageModalOpen(true);
    };

    const handleOpenSampling = (row: any) => {
        const isRowEnvasadoVal = isRowEnvasado(row);

        if (isRowEnvasadoVal && !isStowagePlanCompleted(row)) {
            Swal.fire({
                icon: "warning",
                title: "Paso 1 Requerido: Crear Nota de Estiba",
                html: `<div class="text-left space-y-3">
                    <p class="font-medium text-slate-800">
                        No se pueden tomar las muestras de la orden <b>${row?.folio || ""}</b> porque la <b>Nota de Estiba (GLS-AP-FO-002)</b> aún no ha sido creada.
                    </p>
                    <div class="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm">
                        <b>Paso 1:</b> El estibador debe registrar primero la <b>Nota de Estiba a Camión</b>.
                    </div>
                </div>`,
                confirmButtonColor: "#059669",
                confirmButtonText: "Entendido",
            });
            return;
        }

        if (isRowEnvasadoVal && !isVoBoApproved(row)) {
            if (!isEstibadorUser) {
                Swal.fire({
                    icon: "info",
                    title: "Paso 2 Pendiente: Revisión y VoBo",
                    html: `<div class="text-left space-y-3">
                        <p class="font-medium text-slate-800">
                            La Nota de Estiba de la orden <b>${row?.folio || ""}</b> se encuentra en estado <b>"Pendiente de VoBo"</b>.
                        </p>
                        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-sm">
                            Revise la Nota de Estiba y presione el <b>Botón: VoBo</b> para habilitar la toma de muestras.
                        </div>
                    </div>`,
                    showCancelButton: true,
                    confirmButtonColor: "#16a34a",
                    cancelButtonColor: "#64748b",
                    confirmButtonText: "Revisar Nota de Estiba",
                    cancelButtonText: "Cerrar",
                }).then((res) => {
                    if (res.isConfirmed) {
                        handleOpenStowagePlan(row);
                    }
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Pendiente de VoBo (Paso 2)",
                    html: `<div class="text-left space-y-3">
                        <p class="font-medium text-slate-800">
                            La Nota de Estiba de la orden <b>${row?.folio || ""}</b> está en estado <b>"Pendiente de VoBo"</b>.
                        </p>
                        <div class="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm">
                            <b>Regla de negocio:</b> El personal de <b>Supervisión PROAGRO</b> en Gestión de Proceso de Embarques (APT) debe revisar la información y dar su <b>VoBo</b> antes de continuar con la toma de muestras.
                        </div>
                    </div>`,
                    confirmButtonColor: "#4f46e5",
                    confirmButtonText: "Entendido",
                });
            }
            return;
        }

        setActiveSamplingOrder(row);
        setIsSamplingModalOpen(true);
    };

    useEffect(() => {
        const handleStorageChange = () => setSamplingRevision((r) => r + 1);
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const handleOpenPrintModal = async (itemId: string | number) => {
        try {
            const response = await axios.get(route("documentation.orders.print-data", itemId));
            if (response.data?.order) {
                const orderData = response.data.order;
                setPrintOrderData(orderData);

                // Recuperar muestras almacenadas para esta orden desde base de datos e historial
                const row = history.find((h) => String(h.id) === String(itemId) || String(h.shipment_order_id) === String(itemId));
                let loadedSamples: any[] = Array.isArray(row?.samples) && row.samples.length > 0 
                    ? row.samples 
                    : (Array.isArray(orderData?.samples) && orderData.samples.length > 0 ? orderData.samples : []);

                const orderId = orderData.id || itemId;
                const folio = orderData.folio;
                const orderNum = orderData.order_number;

                const candidateKeys = [
                    `ensacadora_sampling_order_${orderId}`,
                    `ensacadora_sampling_${orderId}`,
                    `envasadora_sampling_order_${orderId}`,
                    `envasadora_sampling_${orderId}`,
                    folio ? `ensacadora_sampling_order_${folio}` : null,
                    folio ? `envasadora_sampling_order_${folio}` : null,
                    orderNum ? `ensacadora_sampling_order_${orderNum}` : null,
                    "ensacadora_sampling_draft_temp",
                ].filter(Boolean) as string[];

                for (const key of candidateKeys) {
                    try {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (Array.isArray(parsed.samples) && parsed.samples.length > loadedSamples.length) {
                                loadedSamples = parsed.samples;
                            }
                        }
                    } catch (e) {}
                }

                if (loadedSamples.length === 0 && orderId) {
                    try {
                        const sampRes = await axios.get(route("documentation.shipment-orders.get-sampling", orderId));
                        if (Array.isArray(sampRes.data?.samples) && sampRes.data.samples.length > 0) {
                            loadedSamples = sampRes.data.samples;
                        }
                    } catch (e) {}
                }

                setPrintSamplesData(loadedSamples);
                setIsPrintModalOpen(true);
            }
        } catch (e) {
            console.error("Error loading print data:", e);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los datos del documento.",
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    const handleOpenPrintModalFromSampling = (samples: any[]) => {
        setPrintSamplesData(samples);
        if (activeSamplingOrder) {
            setPrintOrderData(activeSamplingOrder);
        } else if (scannedOrder) {
            setPrintOrderData(scannedOrder);
        }
        setIsPrintModalOpen(true);
    };

    // Table search filter
    const [historySearch, setHistorySearch] = useState("");

    const qrInputRef = useRef<HTMLInputElement>(null);

    const handleSelectWarehouse = (warehouseId: number, cubicleId: number | null = null) => {
        setSelectedWarehouseId(warehouseId);
        setSelectedCubicle((warehouseId === 5 || warehouseId === 4) ? cubicleId : null);
        localStorage.setItem("shipment_process_selected_warehouse", warehouseId.toString());
        if ((warehouseId === 5 || warehouseId === 4) && cubicleId !== null) {
            localStorage.setItem("shipment_process_selected_cubicle", cubicleId.toString());
        } else {
            localStorage.removeItem("shipment_process_selected_cubicle");
        }
        setWarehouse(`Almacen ${warehouseId}`);
        setSelectedLotId("");
    };

    useEffect(() => {
        if (currentStep === 1) {
            setTimeout(() => {
                qrInputRef.current?.focus();
            }, 100);
        }
    }, [currentStep]);

    const refreshHistory = async () => {
        try {
            const response = await axios.get(route("documentation.shipment-orders.loading-history"), {
                params: {
                    is_estibadores: isEstibadorUser ? 1 : 0,
                },
            });
            if (Array.isArray(response.data)) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error("Error refreshing loading history:", error);
        }
    };


    const handleSearchOrder = async (query?: string) => {
        const q = (query !== undefined ? query : searchQr).trim();
        if (!q) {
            Swal.fire({
                icon: "warning",
                title: "Folio o QR Requerido",
                text: "Por favor escanee un código QR o escriba el folio de la orden.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        setIsSearchingQr(true);
        try {
            const response = await axios.get(route("documentation.shipment-orders.search-qr"), {
                params: { qr: q },
            });

            if (response.data?.order) {
                const order = response.data.order;
                setScannedOrder(order);
                setSearchQr(order.folio || q);
                if (order.warehouse) {
                    setWarehouse(order.warehouse);
                } else {
                    setWarehouse(`Almacen ${selectedWarehouseId}`);
                }

                const matchedHistory = history.find(
                    (h) => String(h.id) === String(order.id) || h.folio === order.folio || String(h.shipment_order_id) === String(order.id)
                );
                const targetOrder = matchedHistory ? { ...matchedHistory, ...order } : order;

                const isTargetEnvasado = (() => {
                    const pres = (targetOrder?.presentation || "").toString().toUpperCase();
                    if (pres.includes("ENVASADO")) return true;
                    if (pres.includes("GRANEL")) return false;
                    const text = `${targetOrder?.product || targetOrder?.product_text || ""}`.toUpperCase();
                    return text.includes("ENVASADO") || text.includes("SACO") || text.includes("25KG") || text.includes("50KG");
                })();

                // 1. Para Estibadores:
                if (isEstibadorUser) {
                    if (!isTargetEnvasado) {
                        setSearchQr("");
                        setScannedOrder(null);
                        Swal.fire({
                            icon: "info",
                            title: "Orden a Granel",
                            text: `La orden ${targetOrder.folio || ""} es a GRANEL y no pasa por el módulo de estibadores (no se registra estiba).`,
                            confirmButtonColor: "#4f46e5",
                        });
                        return;
                    }

                    // Si la Nota de Estiba ya tiene VoBo de Supervisión PROAGRO, abrir directamente la Toma de Muestras (Paso 3)
                    if (isVoBoApproved(targetOrder)) {
                        setSearchQr("");
                        setScannedOrder(null);
                        handleOpenSampling(targetOrder);
                        return;
                    }

                    const plan = targetOrder.stowage_plan || {};
                    setScannedOrder(targetOrder);
                    if (targetOrder.warehouse) {
                        setWarehouse(targetOrder.warehouse);
                        const whNum = normalizeWarehouseNumber(targetOrder.warehouse);
                        if (whNum) setSelectedWarehouseId(whNum);
                    }
                    setSelectedLotId(targetOrder.lot_id ? String(targetOrder.lot_id) : "");
                    if (targetOrder.loading_squad_leader || targetOrder.squad_leader) {
                        setSquadLeader(targetOrder.loading_squad_leader || targetOrder.squad_leader);
                    }
                    setLoadingAssistant(targetOrder.loading_assistant || "");
                    setVerifier(plan.verifier || "");
                    setEstibaObservations(plan.comments || "");
                    setAvgUnitWeight(plan.avg_unit_weight !== undefined && plan.avg_unit_weight !== null ? String(plan.avg_unit_weight) : "");

                    if (Array.isArray(plan.stowage_groups) && plan.stowage_groups.length > 0 && plan.stowage_groups[0].count !== undefined) {
                        setStowageGroups(plan.stowage_groups.map((g: any) => ({ count: Number(g.count), sacks: Number(g.sacks) })));
                    } else if (Array.isArray(plan.stowages)) {
                        const reconstructed: Array<{ count: number; sacks: number }> = [];
                        for (const rawVal of plan.stowages) {
                            const n = Number(rawVal);
                            if (rawVal === true || isNaN(n) || n <= 0) continue;
                            if (reconstructed.length > 0 && reconstructed[reconstructed.length - 1].sacks === n) {
                                reconstructed[reconstructed.length - 1].count += 1;
                            } else {
                                reconstructed.push({ count: 1, sacks: n });
                            }
                        }
                        setStowageGroups(reconstructed);
                    } else {
                        setStowageGroups([]);
                    }

                    setCurrentStep(2);
                    return;
                }

                // 2. Si NO es Estibador (Supervisión PROAGRO en Gestión de Proceso de Embarques - APT):
                if (isTargetEnvasado) {
                    setSearchQr("");
                    setScannedOrder(null);
                    if (!isStowagePlanCompleted(targetOrder)) {
                        Swal.fire({
                            icon: "warning",
                            title: "Paso 1 Pendiente: Nota de Estiba",
                            html: `<div class="text-left space-y-3">
                                <p class="font-medium text-slate-800">
                                    La orden <b>${targetOrder.folio || ""}</b> aún no cuenta con la <b>Nota de Estiba (GLS-AP-FO-002)</b> registrada por el personal estibador.
                                </p>
                                <div class="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm">
                                    Una vez que el estibador cree la Nota de Estiba, aparecerá en el <b>Historial de Órdenes de Embarque</b> para su revisión, VoBo y liberación.
                                </div>
                            </div>`,
                            confirmButtonColor: "#4f46e5",
                            confirmButtonText: "Entendido",
                        });
                        return;
                    }

                    // Si ya tiene Nota de Estiba, abrirla para revisión y VoBo (y filtrar en el historial)
                    setHistorySearch(targetOrder.folio || "");
                    handleOpenStowagePlan(targetOrder);
                    return;
                }

                // 3. Si NO es envasado (a Granel):
                if (response.data?.is_registered) {
                    Swal.fire({
                        icon: "info",
                        title: "Orden Registrada",
                        text: `La orden de embarque ${targetOrder.folio} ya se encuentra registrada en el historial.`,
                        confirmButtonColor: "#4f46e5",
                    });
                    setSearchQr("");
                    setScannedOrder(null);
                    return;
                }

                setCurrentStep(2);
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Orden no encontrada",
                    text: `No se encontró la orden con el código o folio: ${q}`,
                    confirmButtonColor: "#4f46e5",
                });
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || "Orden de embarque no encontrada o no válida.";
            Swal.fire({
                icon: error.response?.data?.blocked ? "info" : "warning",
                title: error.response?.data?.blocked ? "Pase a báscula" : "Atención",
                text: msg,
                confirmButtonColor: "#4f46e5",
            });
            setScannedOrder(null);
        } finally {
            setIsSearchingQr(false);
        }
    };

    const handleResetToStep1 = () => {
        setScannedOrder(null);
        setSearchQr("");
        setWarehouse(`Almacen ${selectedWarehouseId}`);
        setStowageCount("");
        setSelectedLotId("");
        setLoadingAssistant("");
        setVerifier("");
        setEstibaObservations("");
        setAvgUnitWeight("");
        setStowageGroups([]);
        setCurrentStep(1);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!scannedOrder?.id) {
            Swal.fire({
                icon: "info",
                title: "Orden Requerida",
                text: "Por favor escanea o ingresa el folio de la Orden de Embarque a cargar.",
                confirmButtonColor: "#4f46e5",
            });
            setCurrentStep(1);
            return;
        }

        if (!selectedLotId) {
            Swal.fire({
                icon: "warning",
                title: "Lote requerido",
                text: "Por favor selecciona el lote que cargará.",
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        if (isEstibadorUser) {
            const hasLegacyStowages = Array.isArray(scannedOrder?.stowage_plan?.stowages) &&
                scannedOrder.stowage_plan.stowages.some((v: any) => v !== null && v !== undefined && v !== "");
            if (stowageGroups.length === 0 && !hasLegacyStowages) {
                Swal.fire({
                    icon: "warning",
                    title: "Estibas y Sacos requeridos",
                    text: "Por favor agregue al menos un grupo de estibas y número de sacos usando el botón (+).",
                    confirmButtonColor: "#4f46e5",
                });
                return;
            }

            if (expectedSacksForOrder > 0 && stowageGroups.length > 0 && totalSacksCaptured !== expectedSacksForOrder) {
                const diff = expectedSacksForOrder - totalSacksCaptured;
                Swal.fire({
                    icon: "warning",
                    title: diff > 0 ? "Sacos Incompletos" : "Exceso de Sacos",
                    html: diff > 0
                        ? `Ha capturado <b>${totalSacksCaptured} sacos</b>, pero la orden tiene programados <b>${expectedSacksForOrder} sacos</b> (${scannedOrder?.programmed_tons || ""} TM).<br/><br/>Faltan <b>${diff} sacos</b> por asignar en las estibas.`
                        : `Ha capturado <b>${totalSacksCaptured} sacos</b>, lo cual excede los <b>${expectedSacksForOrder} sacos</b> programados para la orden (${scannedOrder?.programmed_tons || ""} TM) por <b>${Math.abs(diff)} sacos</b>.`,
                    confirmButtonColor: "#4f46e5",
                });
                return;
            }
        }

        setIsSaving(true);

        try {
            if (isEstibadorUser) {
                const stowagesArray = stowageGroups.length > 0
                    ? buildStowagesArray(stowageGroups)
                    : (scannedOrder?.stowage_plan?.stowages || Array(24).fill(null));
                const usedCount = stowageGroups.length > 0
                    ? totalEstibasCaptured
                    : stowagesArray.filter((v: any) => v !== null && v !== undefined && v !== "").length;
                const existingPlan = scannedOrder?.stowage_plan || {};
                const nowTime = new Date().toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                const stowagePlanPayload = {
                    ...existingPlan,
                    shift: existingPlan.shift || "1",
                    hour: existingPlan.hour || nowTime,
                    supervisor: loadingAssistant || existingPlan.supervisor || currentUserName || "",
                    stowages: stowagesArray,
                    stowage_groups: stowageGroups.length > 0 ? stowageGroups : (existingPlan.stowage_groups || null),
                    verifier: verifier || "",
                    comments: estibaObservations,
                    avg_unit_weight: existingPlan.avg_unit_weight || null,
                    net_weight: existingPlan.net_weight || null,
                    warehouse: warehouse || `Almacen ${selectedWarehouseId}`,
                };

                const response = await axios.post(route("documentation.shipment-orders.save-loading"), {
                    shipment_order_id: scannedOrder.id,
                    lot_id: selectedLotId,
                    warehouse: warehouse || `Almacen ${selectedWarehouseId}`,
                    squad_leader: squadLeader || null,
                    loading_assistant: loadingAssistant || null,
                    stowage_count: usedCount || null,
                    from_estibadores: true,
                    stowage_plan: stowagePlanPayload,
                });

                const savedOrder = {
                    ...scannedOrder,
                    ...(response.data?.order || {}),
                    stowage_plan: stowagePlanPayload,
                    stowage_count: usedCount || scannedOrder.stowage_count || null,
                    loading_squad_leader: squadLeader || null,
                    loading_assistant: loadingAssistant || null,
                    is_in_apt: false,
                };

                handleResetToStep1();
                setActiveStowageOrder(savedOrder);
                setIsStowageModalOpen(true);
                await refreshHistory();
                return;
            }

            const response = await axios.post(route("documentation.shipment-orders.save-loading"), {
                shipment_order_id: scannedOrder.id,
                lot_id: selectedLotId,
                warehouse: warehouse || `Almacen ${selectedWarehouseId}`,
                squad_leader: squadLeader || null,
                loading_assistant: loadingAssistant || null,
                stowage_count: stowageCount ? parseInt(stowageCount, 10) : null,
            });

            const savedOrder = {
                ...scannedOrder,
                ...(response.data?.order || {}),
                stowage_count: stowageCount ? parseInt(stowageCount, 10) : (scannedOrder.stowage_count || null),
            };

            if (isEnvasado) {
                if (isStowagePlanCompleted(savedOrder)) {
                    // Open the Sampling Modal (Estibas y gráfica)
                    setActiveSamplingOrder(savedOrder);
                    setPrintOrderData(savedOrder);
                    setIsSamplingModalOpen(true);
                } else {
                    Swal.fire({
                        icon: "warning",
                        title: "Embarque Iniciado - Candado Activo",
                        html: `<div class="text-left space-y-2">
                            <p class="font-medium text-slate-800">La orden <b>${savedOrder.folio || ""}</b> se ha registrado correctamente.</p>
                            <div class="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm">
                                <b>Candado de seguridad:</b> El usuario <b>Estibador</b> debe registrar y guardar primero la <b>Nota de Estiba (GLS-AP-FO-002)</b>.
                            </div>
                            <p class="text-xs text-slate-600">
                                Mientras el estibador no guarde la nota de estiba, no se pueden tomar las muestras de ensacadora. Una vez que el estibador guarde la nota de estiba, al escanear el código QR se habilitará automáticamente la toma de muestras.
                            </p>
                        </div>`,
                        confirmButtonColor: "#059669",
                        confirmButtonText: "Entendido",
                    });
                }
            } else {
                setShowSuccessModal(true);
            }

            // Refresh list & reset to step 1
            setScannedOrder(null);
            setSearchQr("");
            setStowageCount("");
            setSelectedLotId("");
            setLoadingAssistant("");
            setCurrentStep(1);
            await refreshHistory();
        } catch (error: any) {
            const msg =
                error.response?.data?.message ||
                error.response?.data?.errors?.squad_leader?.[0] ||
                "Error al guardar el embarque.";
            Swal.fire({
                icon: msg.includes("debe pasar a Bascula") ? "info" : "error",
                title: msg.includes("debe pasar a Bascula") ? "Pase a báscula" : "Error al guardar",
                text: msg,
                confirmButtonColor: "#4f46e5",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinish = async (id: string, folio: string) => {
        const targetRow = history.find((h) => String(h.id) === String(id));
        if (targetRow) {
            if (targetRow.is_sampling_blocked) {
                Swal.fire({
                    icon: "error",
                    title: "Autorización de Desbloqueo Pendiente",
                    html: `No se puede liberar la toma de muestras de la orden <b>${folio}</b> porque existe una autorización de desbloqueo pendiente por peso fuera del límite.<br/><br/>Autorice primero el desbloqueo en el control de muestreo.`,
                    confirmButtonColor: "#dc2626",
                    confirmButtonText: "Entendido",
                });
                return;
            }
            const status = getOrderSamplingStatus(targetRow);
            if (status.isEnvasado && !status.isCompleted) {
                Swal.fire({
                    icon: "warning",
                    title: "Toma de Muestras Incompleta",
                    html: `No se puede liberar la toma de muestras de la orden <b>${folio}</b> porque ambas ensacadoras deben completar su cantidad requerida:<br/><br/>• <b>Ensacadora 1:</b> ${status.env1Count} de ${status.targetPerEnsacadora} muestras<br/>• <b>Ensacadora 2:</b> ${status.env2Count} de ${status.targetPerEnsacadora} muestras<br/>• <b>Total Unidad:</b> ${status.samplesCount} de ${status.targetSamples} muestras`,
                    confirmButtonColor: "#4f46e5",
                    confirmButtonText: "Entendido",
                });
                return;
            }
        }

        const isEnvasadoRow = targetRow ? isRowEnvasado(targetRow) : false;
        const result = await Swal.fire({
            title: isEnvasadoRow ? "¿Liberar Toma de Muestras?" : "¿Finalizar orden?",
            html: isEnvasadoRow
                ? `¿Confirmas la <b>liberación de la toma de muestras</b> de la orden <b>${folio || ""}</b> (Paso 4) para finalizar el proceso y habilitar el destare en báscula?`
                : `¿Estás seguro que quieres finalizar esta orden de embarque ${folio ? `(${folio})` : ""}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: isEnvasadoRow ? "✓ Sí, liberar toma de muestras" : "Sí, finalizar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            customClass: { container: "!z-[999999]" },
        });

        if (!result.isConfirmed) return;

        try {
            await axios.patch(route("documentation.shipment-orders.finish-loading", id));
            setIsSamplingModalOpen(false);
            await refreshHistory();
            Swal.fire({
                icon: "success",
                title: isEnvasadoRow ? "¡Toma de Muestras Liberada!" : "Orden Finalizada",
                text: isEnvasadoRow
                    ? `La toma de muestras de la orden ${folio} ha sido liberada y el proceso ha finalizado correctamente.`
                    : `La orden ${folio} ha sido finalizada correctamente.`,
                timer: 2200,
                showConfirmButton: false,
            });
        } catch (error: any) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "No se pudo liberar/finalizar la orden.",
                confirmButtonColor: "#4f46e5",
            });
        }
    };

    const handleDelete = async (id: string, folio: string) => {
        const targetRow = history.find((h) => String(h.id) === String(id) || h.folio === folio);
        if (isEstibadorUser && targetRow && isInAptProcess(targetRow)) {
            Swal.fire({
                icon: "warning",
                title: "Acción Bloqueada",
                html: `<div class="text-left space-y-2">
                    <p class="font-medium text-slate-800">
                        La orden <b>${folio}</b> se encuentra actualmente en proceso en <b>Gestión de Proceso de Embarques (APT)</b>.
                    </p>
                    <p class="text-sm text-slate-600">
                        Solo podrá <b>eliminar</b> la nota de estiba siempre y cuando en APT la hayan eliminado primero del proceso.
                    </p>
                </div>`,
                confirmButtonColor: "#4f46e5",
            });
            return;
        }

        const titleText = isEstibadorUser ? "¿Eliminar Nota de Estiba?" : "¿Eliminar del historial?";
        const bodyText = isEstibadorUser
            ? `¿Estás seguro de eliminar la nota de estiba de la orden ${folio}? Esto te permitirá volver a escanearla y realizar una nueva nota si te equivocaste.`
            : `¿Estás seguro de eliminar la orden ${folio} del historial de carga?`;

        const result = await Swal.fire({
            title: titleText,
            text: bodyText,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#991b1b",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(route("documentation.shipment-orders.delete-loading", id), {
                    params: {
                        is_estibadores: isEstibadorUser ? 1 : 0,
                    },
                });
                setHistory((prev) =>
                    prev.filter(
                        (item) =>
                            String(item.id) !== String(id) &&
                            String(item.shipment_order_id) !== String(id) &&
                            item.folio !== folio
                    )
                );
                await refreshHistory();
                Swal.fire({
                    icon: "success",
                    title: "Eliminado",
                    text: isEstibadorUser ? "Nota de estiba eliminada. Ya puedes volver a escanearla para realizar una nueva." : "El registro ha sido eliminado del historial.",
                    timer: 2000,
                    showConfirmButton: false,
                });
            } catch (error: any) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.response?.data?.message || "No se pudo eliminar el registro.",
                    confirmButtonColor: "#4f46e5",
                });
            }
        }
    };

    const filteredHistory = history.filter((item) => {
        // En el módulo de Gestión de Embarques (APT), la orden solo debe aparecer si ya fue guardada y asignada para muestreo/carga
        if (!isEstibadorUser && !item.lot_id && !item.history_id) {
            return false;
        }

        // Para el módulo de Estibadores: mostrar órdenes con nota de estiba guardada o productos envasados (excluyendo granel)
        if (isEstibadorUser) {
            const pres = (item.presentation || "").toString().toUpperCase();
            if (pres.includes("GRANEL") && !pres.includes("ENVASADO")) {
                return false;
            }
            const hasStowage = Boolean(
                item.stowage_plan ||
                item.stowage_plan_status === "completed" ||
                item.stowage_plan_saved_at
            );
            if (!hasStowage && !isRowEnvasado(item)) {
                return false;
            }
        }

        // Warehouse filter
        const itemWhNum = normalizeWarehouseNumber(item.warehouse);
        if (itemWhNum !== null && itemWhNum !== selectedWarehouseId) {
            return false;
        }

        // Extra check: if lot_folio explicitly specifies APT{X}, it must match the selected warehouse
        if (item.lot_folio) {
            const matchApt = item.lot_folio.match(/APT(\d+)/i);
            if (matchApt && parseInt(matchApt[1], 10) !== selectedWarehouseId) {
                return false;
            }
        }

        // Cubicle filter (Almacén 5 specific cubicle)
        if (selectedWarehouseId === 5 && selectedCubicle !== null) {
            const itemCubNum = normalizeCubicleNumber(item.cubicle);
            if (itemCubNum !== null && itemCubNum !== selectedCubicle) {
                return false;
            }
        }

        // Search text filter
        if (!historySearch.trim()) return true;
        const q = historySearch.toLowerCase();
        return (
            item.folio.toLowerCase().includes(q) ||
            (item.lot_folio && item.lot_folio.toLowerCase().includes(q)) ||
            item.operator.toLowerCase().includes(q) ||
            item.squad_leader.toLowerCase().includes(q) ||
            item.product.toLowerCase().includes(q) ||
            item.plates.toLowerCase().includes(q) ||
            (item.warehouse && item.warehouse.toLowerCase().includes(q))
        );
    });

    const currentUserName = auth?.user?.name || auth?.user?.username || "admin";

    const pageTitle = isEstibadorUser ? "Módulo de Estibadores" : "Gestión de proceso de embarques";
    const pageSubtitle = isEstibadorUser
        ? "Elaboración y edición de Nota de Estiba a Camión (GLS-AP-FO-002)."
        : "Registro, control y seguimiento de órdenes de embarque en tiempo real.";

    return (
        <DashboardLayout user={auth.user} header={pageTitle}>
            <Head title={pageTitle} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link & Header with Active Warehouse Indicator */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        {!isEstibadorUser && (
                            <Link
                                href={route("apt.production")}
                                className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm text-sm font-semibold mb-4"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5 text-gray-500" />
                                Volver a Gestión de almacenes
                            </Link>
                        )}
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isEstibadorUser ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                                {isEstibadorUser ? <Layers className="w-6 h-6" /> : <Truck className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {pageTitle}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {pageSubtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Active Warehouse Indicator Badge */}
                    <button
                        type="button"
                        onClick={() => setIsWarehouseModalOpen(true)}
                        className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group relative cursor-pointer active:scale-95"
                        title="Cambiar almacén activo"
                    >
                        <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                            <Warehouse className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                Almacén Activo
                            </div>
                            <div className="text-sm font-black text-gray-800 leading-none flex items-center gap-2">
                                <span className="text-indigo-600 text-lg font-black">
                                    ALMACÉN 0{selectedWarehouseId}
                                </span>
                                {selectedWarehouseId === 5 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                                        {selectedCubicle ? `Cub. 0${selectedCubicle}` : "Todos los cubículos"}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="ml-2 p-1.5 bg-gray-50 rounded-lg text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-gray-100">
                            <Settings className="w-4 h-4" />
                        </div>
                    </button>
                </div>

                {/* Tabs Navigation (Gestión de Órdenes de Embarque vs Incidencias) */}
                {!isEstibadorUser && (
                    <div className="mb-6 bg-white rounded-2xl border border-gray-200 flex justify-center overflow-x-auto shadow-xs">
                        <button
                            type="button"
                            onClick={() => setIsIncidentsOpen(false)}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 cursor-pointer ${
                                !isIncidentsOpen
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <Truck className={`w-5 h-5 mr-2 ${!isIncidentsOpen ? "text-indigo-600" : "text-gray-400"}`} />
                            Gestión de Órdenes de Embarque
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsIncidentsOpen(true)}
                            className={`flex items-center px-8 py-5 font-bold text-sm uppercase tracking-wider transition-all border-b-4 cursor-pointer ${
                                isIncidentsOpen
                                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <AlertTriangle className={`w-5 h-5 mr-2 ${isIncidentsOpen ? "text-amber-500" : "text-gray-400"}`} />
                            Incidencias
                            {incidents.length > 0 && (
                                <span
                                    className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-bold ${
                                        isIncidentsOpen ? "bg-indigo-600 text-white" : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                                    {incidents.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Vista Standalone de Incidencias cuando está activa la pestaña de Incidencias */}
                {isIncidentsOpen && !isEstibadorUser && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-8 animate-fade-in">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-amber-950 flex items-center gap-2">
                                        <span>Registro de Incidencias de Muestreo</span>
                                        <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                                            {filteredIncidents.length} {filteredIncidents.length === 1 ? "registro" : "registros"}
                                        </span>
                                    </h4>
                                    <p className="text-xs text-amber-800">
                                        Historial de desbloqueos autorizados por el Jefe de Almacén tras registrar 3 pesos consecutivos fuera de tolerancia.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={incidentsSearch}
                                        onChange={(e) => setIncidentsSearch(e.target.value)}
                                        placeholder="Filtrar por orden, jefe o auxiliar..."
                                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-amber-200 bg-white text-xs font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshIncidents}
                                    className="p-1.5 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition shadow-2xs cursor-pointer"
                                    title="Actualizar tabla de incidencias"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Tabla de Incidencias */}
                        <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-amber-100/80 border-b border-amber-200 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
                                        <th className="py-2.5 px-3">Folio Orden</th>
                                        <th className="py-2.5 px-3">Almacén</th>
                                        <th className="py-2.5 px-3">Quién Desbloqueó</th>
                                        <th className="py-2.5 px-3">Fecha y Hora</th>
                                        <th className="py-2.5 px-3 text-center">Veces Desbloqueado</th>
                                        <th className="py-2.5 px-3">Auxiliar de Muestras</th>
                                        <th className="py-2.5 px-3">Motivo / Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 font-medium text-slate-700">
                                    {filteredIncidents.length > 0 ? (
                                        filteredIncidents.map((inc: any) => (
                                            <tr key={inc.id} className="hover:bg-amber-50/50 transition-colors">
                                                <td className="py-2.5 px-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                                                        {inc.order_folio || "N/A"}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <span className="font-semibold text-slate-800">
                                                        {inc.warehouse || "Almacén"}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>{inc.unlocked_by_name || "Jefe de Almacén"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>
                                                            {inc.unlocked_at_formatted ||
                                                                (inc.unlocked_at
                                                                    ? new Date(inc.unlocked_at).toLocaleString("es-MX")
                                                                    : "N/A")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                                        {inc.unlock_count || 1} {Number(inc.unlock_count) === 1 ? "vez" : "veces"} (Desbloqueo #{inc.unlock_count || 1})
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                                                        <User className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span>{inc.assistant_name || "No asignado"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={inc.reason}>
                                                    {inc.reason || "3 pesos consecutivos fuera de tolerancia"}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-8 px-4 text-center text-slate-400">
                                                <AlertTriangle className="w-8 h-8 mx-auto text-amber-300 mb-1" />
                                                <p className="font-medium text-slate-600">
                                                    No hay incidencias registradas {incidentsSearch ? "con ese criterio" : "en este momento"}.
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Las incidencias se generan automáticamente cuando el Jefe de Almacén autoriza y desbloquea la toma de muestras.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Stepper Progress Bar (Hidden for Estibadores y cuando Incidencias está abierto) */}
                {isEstibadorUser || isIncidentsOpen ? null : (
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            {/* Step 1 Indicator */}
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className={`flex items-center gap-3 text-left transition-all ${
                                    currentStep === 1
                                        ? "opacity-100"
                                        : "opacity-75 hover:opacity-100 cursor-pointer"
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                                        currentStep === 1
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50"
                                            : scannedOrder
                                            ? "bg-emerald-600 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {scannedOrder && currentStep === 2 ? (
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    ) : (
                                        "1"
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs uppercase font-bold text-gray-400">
                                        Paso 1
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${
                                            currentStep === 1 ? "text-indigo-950" : "text-gray-700"
                                        }`}
                                    >
                                        Escanear QR / Folio
                                    </span>
                                </div>
                            </button>

                            {/* Step Divider */}
                            <div className="flex-1 mx-4 sm:mx-8 h-0.5 bg-gray-200 relative">
                                <div
                                    className={`absolute inset-0 bg-indigo-600 transition-all duration-300 ${
                                        currentStep === 2 ? "w-full" : "w-0"
                                    }`}
                                />
                            </div>

                            {/* Step 2 Indicator */}
                            <div
                                className={`flex items-center gap-3 text-left transition-all ${
                                    currentStep === 2 ? "opacity-100" : "opacity-50"
                                }`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                                        currentStep === 2
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-indigo-50"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                >
                                    2
                                </div>
                                <div>
                                    <span className="block text-xs uppercase font-bold text-gray-400">
                                        Paso 2
                                    </span>
                                    <span
                                        className={`text-sm font-bold ${
                                            currentStep === 2 ? "text-indigo-950" : "text-gray-500"
                                        }`}
                                    >
                                        Asignación y Carga
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                {(!isIncidentsOpen || isEstibadorUser) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 md:p-8 mb-8">
                    {/* STEP 1: SCAN QR / ENTER FOLIO */}
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <div className="text-center max-w-xl mx-auto mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
                                    <QrCode className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900">
                                    {isEstibadorUser ? "Escanear QR para Editar Nota de Estiba" : "Escanear Código QR de Orden de Embarque"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {isEstibadorUser
                                        ? "Pase la pistola lectora o use la cámara para escanear el código QR y abrir la Nota de Estiba a Camión (GLS-AP-FO-002)."
                                        : "Utilice el lector óptico, la cámara del dispositivo o escriba el folio para comenzar el proceso de carga."}
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <QrCode className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <input
                                            ref={qrInputRef}
                                            type="text"
                                            value={searchQr}
                                            onChange={(e) => setSearchQr(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
                                            placeholder="Ej: PA2026-0005 o escanear código..."
                                            className="block w-full pl-12 pr-10 py-3.5 rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold text-gray-900 uppercase placeholder-gray-400 text-base"
                                        />
                                        {searchQr && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQr("");
                                                    setScannedOrder(null);
                                                }}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraOpen(true)}
                                        className="inline-flex items-center justify-center px-5 py-3.5 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl shadow-sm text-sm font-bold transition gap-2"
                                        title="Escanear con cámara"
                                    >
                                        <Camera className="w-5 h-5 text-indigo-600" />
                                        <span>Cámara</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSearchOrder()}
                                        disabled={isSearchingQr || !searchQr.trim()}
                                        className="inline-flex items-center justify-center px-7 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50 gap-2"
                                    >
                                        <Search className="w-4 h-4" />
                                        {isSearchingQr ? "Buscando..." : "Siguiente"}
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Lector óptico listo para captura automática al presionar Enter</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ORDER DETAILS & ASSIGNMENT FORM */}
                    {currentStep === 2 && scannedOrder && (
                        <div className="animate-fade-in">
                            {/* Identified Order Header Badge */}
                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm font-bold">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xl font-extrabold text-indigo-950">
                                                {scannedOrder.folio}
                                            </span>
                                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                Orden Identificada
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1 font-medium">
                                            <span>
                                                <strong className="text-gray-900">Operador:</strong> {scannedOrder.operator_name || "N/A"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong className="text-gray-900">Placas:</strong> {scannedOrder.tractor_plate || "N/A"}{" "}
                                                {scannedOrder.trailer_plate ? `/ ${scannedOrder.trailer_plate}` : ""}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong className="text-gray-900">Producto:</strong> {scannedOrder.product || "N/A"}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                <strong className="text-gray-900">Presentación:</strong>{" "}
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold ${isEnvasado ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                                                    {scannedOrder.presentation || (isEnvasado ? "ENVASADO" : "GRANEL")}
                                                    {scannedOrder.sacks_count ? ` (${scannedOrder.sacks_count})` : ""}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetToStep1}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Cambiar Orden
                                </button>
                            </div>

                            {/* Main Form Fields */}
                            <form onSubmit={handleSave}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Lote que cargará */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Lote que cargará
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedLotId}
                                                onChange={(e) => {
                                                    const lotId = e.target.value;
                                                    setSelectedLotId(lotId);
                                                    const lot = lots.find((l) => l.id.toString() === lotId);
                                                    if (lot?.warehouse) {
                                                        setWarehouse(lot.warehouse);
                                                    }
                                                }}
                                                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Seleccione un lote...</option>
                                                {lots
                                                    .filter(lot => normalizeWarehouseNumber(lot.warehouse) === selectedWarehouseId)
                                                    .map((lot) => (
                                                    <option key={lot.id} value={lot.id}>
                                                        {lot.folio} {lot.cubicle ? `(Cubículo ${lot.cubicle})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                                                <ChevronsUpDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Número de almacén */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Número de almacén
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                readOnly
                                                value={warehouse}
                                                placeholder={`Almacen ${selectedWarehouseId}`}
                                                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 font-medium shadow-sm cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Encargado de Cuadrilla */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Encargado de Cuadrilla
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={squadLeader}
                                                onChange={(e) => setSquadLeader(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Seleccione encargado de cuadrilla...</option>
                                                {squad_leaders.map((leader) => (
                                                    <option key={leader} value={leader}>
                                                        {leader}
                                                    </option>
                                                ))}
                                                {!squad_leaders.includes("PABLO FRANCISCO VIVAS TORRES") && (
                                                    <option value="PABLO FRANCISCO VIVAS TORRES">
                                                        PABLO FRANCISCO VIVAS TORRES
                                                    </option>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400">
                                                <ChevronsUpDown className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auxiliar de Carga */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Auxiliar de Carga
                                        </label>
                                        <LoadingAssistantDropdown
                                            value={loadingAssistant}
                                            initialAssistants={assistants}
                                            onChange={(name) => setLoadingAssistant(name)}
                                        />
                                    </div>

                                    {/* Encargado de Almacén / Turno */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Encargado de Almacén
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={currentUserName}
                                            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-700 font-medium shadow-sm cursor-not-allowed"
                                        />
                                    </div>

                                    {isEstibadorUser && (
                                        <>
                                            {/* Lista de Verificador */}
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                    Verificador
                                                </label>
                                                <VerifierDropdown
                                                    value={verifier}
                                                    initialVerifiers={verifiers}
                                                    onChange={(name) => setVerifier(name)}
                                                />
                                            </div>

                                            {/* Cantidad de estibas y número de sacos (+) */}
                                            <div className="md:col-span-2">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <label className="block text-sm font-semibold text-gray-700">
                                                        Estibas y Número de Sacos
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                                                                expectedSacksForOrder > 0 && totalSacksCaptured === expectedSacksForOrder
                                                                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                                                                    : "text-indigo-800 bg-indigo-50 border-indigo-200"
                                                            }`}
                                                        >
                                                            {totalEstibasCaptured} / 24 estibas • {totalSacksCaptured}
                                                            {expectedSacksForOrder > 0 ? ` / ${expectedSacksForOrder}` : ""} sacos
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={handleAddStowageGroup}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                                                            title="Agregar cantidad de estibas y número de sacos"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Agregar Estibas / Sacos
                                                        </button>
                                                    </div>
                                                </div>

                                                {stowageGroups.length > 0 ? (
                                                    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                                                        {(() => {
                                                            let cursor = 1;
                                                            return stowageGroups.map((group, idx) => {
                                                                const start = cursor;
                                                                const end = Math.min(24, cursor + group.count - 1);
                                                                cursor = end + 1;
                                                                const rangeText = start === end ? `Estiba ${start}` : `Del ${start} al ${end}`;
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="flex items-center justify-between gap-3 bg-white border border-indigo-100 rounded-lg px-3.5 py-2 shadow-2xs"
                                                                    >
                                                                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-800">
                                                                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono">
                                                                                {rangeText} ({group.count} {group.count === 1 ? "estiba" : "estibas"})
                                                                            </span>
                                                                            <span className="text-emerald-700 font-extrabold">
                                                                                {group.sacks} sacos c/u
                                                                            </span>
                                                                            <span className="text-gray-400 font-medium">
                                                                                (Subtotal: {group.count * group.sacks} sacos)
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setStowageGroups((prev) => prev.filter((_, i) => i !== idx))
                                                                            }
                                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                                                                            title="Eliminar grupo"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-500 bg-gray-50/60">
                                                        Presione el ícono <b className="text-indigo-700">(+)</b> para capturar la cantidad de estibas y el número de sacos (ej. 9 estibas de 120 sacos, 1 de 180 sacos).
                                                    </div>
                                                )}
                                            </div>

                                            {/* Observaciones -> Comentarios Nota de Estiba */}
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                    Observaciones
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={estibaObservations}
                                                    onChange={(e) => setEstibaObservations(e.target.value)}
                                                    placeholder="Comentarios para la Nota de Estiba..."
                                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 font-medium shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase text-sm"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Submit & Back Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleResetToStep1}
                                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-gray-300 shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center justify-center px-8 py-3 rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        {isSaving
                                            ? "Guardando..."
                                            : isEstibadorUser
                                            ? "Guardar y Ver Nota de Estiba"
                                            : isEnvasado
                                            ? "Guardar y Realizar Muestreo"
                                            : "Guardar Embarque"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
                )}

                {/* Table Section: HISTORIAL */}
                {!isIncidentsOpen && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full">
                        <div className="p-5 md:p-6 bg-white border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-xl font-extrabold text-indigo-950 uppercase tracking-wide">
                                        {isEstibadorUser ? "Historial de Notas de Estiba" : "Historial de Órdenes de Embarque"}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsWarehouseModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm transition-colors cursor-pointer"
                                        title="Cambiar filtro de almacén"
                                    >
                                        <Warehouse className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>ALMACÉN 0{selectedWarehouseId}</span>
                                        {selectedWarehouseId === 5 && (
                                            <span className="text-indigo-900 font-black">
                                                {selectedCubicle ? `(Cubículo 0${selectedCubicle})` : "(Todos los cubículos)"}
                                            </span>
                                        )}
                                        <Settings className="w-3 h-3 ml-0.5 text-indigo-400" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {isEstibadorUser
                                        ? "Registro de notas de estiba a camión (GLS-AP-FO-002) generadas para este almacén."
                                        : "Consulta de órdenes en proceso de carga y finalizadas asignadas a este almacén."}
                                </p>
                            </div>
                            <div className="relative w-full sm:w-72">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder={isEstibadorUser ? "Filtrar folio, operador, placas..." : "Filtrar folio, operador..."}
                                    className="block w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="w-full overflow-hidden">
                            <table className="w-full table-fixed divide-y divide-gray-200 text-xs">
                            <thead className="bg-[#1e1b4b] text-white">
                                <tr>
                                    <th className="w-[2.5%] px-0.5 py-3.5 text-center font-bold uppercase tracking-wider">
                                        <Settings className="w-3.5 h-3.5 mx-auto text-indigo-300 opacity-60" />
                                    </th>
                                    <th className="w-[7.5%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        FOLIO
                                    </th>
                                    <th className="w-[8.5%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        LOTE
                                    </th>
                                    <th className="w-[9%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        OPERADOR
                                    </th>
                                    <th className="w-[8.5%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        LÍDER CUADRILLA
                                    </th>
                                    <th className="w-[9%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        PRODUCTO
                                    </th>
                                    <th className="w-[6%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        PLACAS
                                    </th>
                                    <th className="w-[6%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        HORA INI.
                                    </th>
                                    <th className="w-[6%] px-1 py-3.5 text-left font-bold uppercase tracking-wider truncate">
                                        HORA FIN.
                                    </th>
                                    <th className="w-[6.5%] px-0.5 py-3.5 text-center font-bold uppercase tracking-wider truncate">
                                        CRONÓMETRO
                                    </th>
                                    <th className="w-[31%] px-1 py-3.5 text-center font-bold uppercase tracking-wider truncate">
                                        {isEstibadorUser ? "ACCIONES" : "ACCIÓN"}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((row) => {
                                        const samplingStatus = getOrderSamplingStatus(row);
                                        return (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-indigo-50/50 transition-colors duration-150"
                                        >
                                            {/* Gear Menu */}
                                            <td className="w-[2.5%] px-1 py-2 text-center">
                                                <Menu as="div" className="relative inline-block text-left">
                                                    <Menu.Button className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Menu.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-100"
                                                        enterFrom="transform opacity-0 scale-95"
                                                        enterTo="transform opacity-100 scale-100"
                                                        leave="transition ease-in duration-75"
                                                        leaveFrom="transform opacity-100 scale-100"
                                                        leaveTo="transform opacity-0 scale-95"
                                                    >
                                                        <Menu.Items className="absolute left-0 z-50 mt-1 w-48 origin-top-left rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none text-xs">
                                                            {!isEstibadorUser && (
                                                                <Menu.Item>
                                                                    {({ active }) => (
                                                                        <a
                                                                            href={route("documentation.print-order", row.id)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold ${
                                                                                active ? "bg-indigo-600 text-white" : "text-gray-700"
                                                                            }`}
                                                                        >
                                                                            <Printer className="w-3.5 h-3.5" />
                                                                            Imprimir OE
                                                                        </a>
                                                                    )}
                                                                </Menu.Item>
                                                            )}
                                                            {(() => {
                                                                const rowIsEnvasado = isRowEnvasado(row);

                                                                if (!rowIsEnvasado) return null;

                                                                return (
                                                                    <>
                                                                        {(!isEstibadorUser || !isStowagePlanCompleted(row)) && (
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleOpenStowagePlan(row)}
                                                                                        className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg font-bold text-left ${
                                                                                            active ? "bg-indigo-600 text-white" : "text-gray-700"
                                                                                        }`}
                                                                                    >
                                                                                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                                                        Nota de Estiba (GLS-AP-FO-002)
                                                                                    </button>
                                                                                )}
                                                                            </Menu.Item>
                                                                        )}
                                                                        {isEstibadorUser && isStowagePlanCompleted(row) && (
                                                                            <Menu.Item>
                                                                                {({ active }) => (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDelete(row.id, row.folio)}
                                                                                        className={`flex w-full items-center gap-2 px-3 py-2 rounded-lg font-bold text-left text-red-600 ${
                                                                                            active ? "bg-red-50 text-red-700" : ""
                                                                                        }`}
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                                                                        Eliminar Nota de Estiba
                                                                                    </button>
                                                                                )}
                                                                            </Menu.Item>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </td>

                                            {/* Folio & Warehouse */}
                                            <td className="w-[7.5%] px-1 py-2 font-bold text-indigo-700 uppercase truncate text-left">
                                                {isEstibadorUser ? (
                                                    <span className="block font-extrabold text-[11px] text-gray-900">
                                                        {row.folio}
                                                    </span>
                                                ) : (
                                                    <a
                                                        href={route("documentation.print-order", row.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="hover:underline block font-extrabold text-[11px]"
                                                        title="Ver / Imprimir orden"
                                                    >
                                                        {row.folio}
                                                    </a>
                                                )}
                                                <div className="text-[9px] text-gray-500 font-medium truncate">
                                                    {row.warehouse || `Almacen ${selectedWarehouseId}`}
                                                    {row.cubicle ? ` • Cub. 0${row.cubicle}` : ""}
                                                </div>
                                            </td>

                                            {/* Lote */}
                                            <td className="w-[8.5%] px-1 py-2 text-left truncate" title={row.lot_folio || "Sin Lote"}>
                                                {row.lot_folio ? (
                                                    <span className="inline-block max-w-full truncate px-1.5 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-900 border border-indigo-200">
                                                        {row.lot_folio}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-medium italic text-xs">
                                                        Sin Lote
                                                    </span>
                                                )}
                                            </td>

                                            {/* Operador */}
                                            <td className="w-[9%] px-1 py-2 font-semibold text-gray-800 uppercase truncate text-left text-[11px]" title={row.operator}>
                                                {row.operator}
                                            </td>

                                            {/* Líder de Cuadrilla */}
                                            <td className="w-[8.5%] px-1 py-2 text-gray-700 uppercase truncate text-left text-[11px]" title={row.squad_leader}>
                                                {row.squad_leader}
                                            </td>

                                            {/* Producto */}
                                            <td className="w-[9%] px-1 py-2 text-left text-[11px]" title={row.product}>
                                                <div className="font-semibold text-gray-700 uppercase truncate">
                                                    {row.product}
                                                </div>
                                                {row.stowage_count ? (
                                                    <div className="text-[10px] text-indigo-600 font-bold">
                                                        {row.stowage_count} estibas
                                                    </div>
                                                ) : null}
                                            </td>

                                            {/* Placas */}
                                            <td className="w-[6%] px-1 py-2 font-mono text-gray-600 uppercase text-[10px] truncate text-left" title={row.plates}>
                                                {row.plates}
                                            </td>

                                            {/* Hora Inicial */}
                                            <td className="w-[6%] px-1 py-2 text-gray-700 text-[10px] leading-tight text-left" title={formatDateTime(row.started_at)}>
                                                {formatDateTime(row.started_at)}
                                            </td>

                                            {/* Hora Final */}
                                            <td className="w-[6%] px-1 py-2 text-[10px] leading-tight text-left" title={row.finished_at ? formatDateTime(row.finished_at) : "Pendiente"}>
                                                {row.finished_at ? (
                                                    <span className="text-gray-700 font-medium">
                                                        {formatDateTime(row.finished_at)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic font-semibold">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>

                                            {/* Cronómetro */}
                                            <td className="w-[6.5%] px-0.5 py-2 text-center text-[11px]">
                                                <LiveStopwatch
                                                    startedAt={row.started_at}
                                                    finishedAt={row.finished_at}
                                                    status={row.status}
                                                />
                                            </td>

                                            {/* Acciones */}
                                            <td className="w-[31%] px-1 py-2 text-center">
                                                {isEstibadorUser ? (
                                                    <div className="flex items-center justify-center gap-1 flex-nowrap">
                                                        {isVoBoApproved(row) ? (
                                                            <>
                                                                <span
                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0"
                                                                    title={`VoBo autorizado por ${row.vobo_by || row.stowage_plan?.vobo_by || "Supervisión PROAGRO"}`}
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                    VoBo ✓
                                                                </span>

                                                                {isSamplingReleased(row) ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenSampling(row)}
                                                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0"
                                                                            title="Muestreo completado y liberado por Supervisión PROAGRO"
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                            <span>{samplingStatus.samplesCount}/{samplingStatus.targetSamples} • Liberada ✓</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenPrintModal(row.id)}
                                                                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center justify-center shrink-0"
                                                                            title="Imprimir Documentos (GLS-AP-FO-002 / 003)"
                                                                        >
                                                                            <Printer className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </>
                                                                ) : samplingStatus.isCompleted ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenSampling(row)}
                                                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0"
                                                                            title={`Muestras completadas (${samplingStatus.samplesCount}/${samplingStatus.targetSamples}). Haga clic para ver.`}
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                            <span>{samplingStatus.samplesCount}/{samplingStatus.targetSamples}</span>
                                                                        </button>
                                                                        <span
                                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
                                                                            title="En espera de que Supervisión PROAGRO libere la toma de muestras (Paso 4)"
                                                                        >
                                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                                            Pend. Liberación
                                                                        </span>
                                                                    </>
                                                                ) : row.is_sampling_blocked ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenSampling(row)}
                                                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 animate-pulse shrink-0 cursor-pointer"
                                                                        title="Muestreo bloqueado por peso fuera de límite. Haga clic para que el Supervisor PROAGRO autorice el desbloqueo."
                                                                    >
                                                                        <Lock className="w-3 h-3" />
                                                                        <span>Bloqueado ({samplingStatus.samplesCount}/{samplingStatus.targetSamples})</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenSampling(row)}
                                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
                                                                        title={`Paso 3: Capturar muestras de pesos de sacos (${samplingStatus.samplesCount}/${samplingStatus.targetSamples})`}
                                                                    >
                                                                        <Scale className="w-3 h-3" />
                                                                        <span>Tomar Muestras ({samplingStatus.samplesCount}/{samplingStatus.targetSamples})</span>
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span
                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0"
                                                                    title="Pendiente de Revisión y VoBo por parte de Supervisión PROAGRO (Paso 2)"
                                                                >
                                                                    <Clock className="w-3 h-3 text-amber-600" />
                                                                    Pendiente VoBo
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenStowagePlan(row)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition shrink-0"
                                                                    title="Editar Nota de Estiba (GLS-AP-FO-002)"
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(row.id, row.folio)}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition shrink-0"
                                                                    title="Eliminar Nota de Estiba"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                    Eliminar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1 flex-nowrap">
                                                        {samplingStatus.isEnvasado ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenStowagePlan(row)}
                                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-1.5 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
                                                                    title="Revisar Nota de Estiba (GLS-AP-FO-002)"
                                                                >
                                                                    <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
                                                                    <span>Nota Estiba</span>
                                                                </button>

                                                                {!isVoBoApproved(row) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApproveVoBo(row)}
                                                                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer"
                                                                        title="Paso 2: Dar visto bueno (VoBo) a la Nota de Estiba para habilitar la toma de muestras"
                                                                    >
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span>VoBo</span>
                                                                    </button>
                                                                )}

                                                                {isVoBoApproved(row) && (
                                                                    row.is_sampling_blocked ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenSampling(row)}
                                                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 animate-pulse shrink-0 cursor-pointer"
                                                                            title="Peso fuera del límite: Haga clic para autorizar el desbloqueo de la unidad"
                                                                        >
                                                                            <Lock className="w-3 h-3" />
                                                                            <span>Desbloquear</span>
                                                                        </button>
                                                                    ) : !isSamplingReleased(row) && samplingStatus.isCompleted ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenSampling(row)}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center gap-1 animate-pulse shrink-0 cursor-pointer"
                                                                            title="Paso 4: Ver toma de muestras y liberar al finalizar"
                                                                        >
                                                                            <Unlock className="w-3 h-3" />
                                                                            <span>Liberar Muestras</span>
                                                                        </button>
                                                                    ) : null
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenPrintModal(row.id)}
                                                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center justify-center shrink-0"
                                                                    title="Imprimir Documentos (GLS-AP-FO-002 / 003)"
                                                                >
                                                                    <Printer className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(row.id, row.folio)}
                                                                    className="bg-red-800 hover:bg-red-900 text-white font-bold p-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center justify-center shrink-0"
                                                                    title="Eliminar orden del historial"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {row.status === "loading" && !row.finished_at && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleFinish(row.id, row.folio)}
                                                                        className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-1.5 py-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap shrink-0"
                                                                    >
                                                                        Finalizar
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(row.id, row.folio)}
                                                                    className="bg-red-800 hover:bg-red-900 text-white font-bold p-1 rounded-md text-[10px] transition shadow-xs whitespace-nowrap flex items-center justify-center shrink-0"
                                                                    title="Eliminar orden del historial"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center text-gray-400">
                                            <Package className="mx-auto h-10 w-10 mb-2 opacity-40" />
                                            <p className="text-sm font-medium">
                                                {isEstibadorUser
                                                    ? `No hay notas de estiba generadas para Almacén 0${selectedWarehouseId}`
                                                    : `No hay registros en el historial de carga para Almacén 0${selectedWarehouseId}`}
                                                {selectedWarehouseId === 5 && selectedCubicle ? ` (Cubículo 0${selectedCubicle})` : ""}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}
            </div>

            {/* Warehouse Selection Modal (like Báscula Modal) */}
            <WarehouseModal
                isOpen={isWarehouseModalOpen}
                onClose={() => setIsWarehouseModalOpen(false)}
                currentWarehouse={selectedWarehouseId}
                currentCubicle={selectedCubicle}
                onSelect={handleSelectWarehouse}
            />

            {/* Qr Scanner Modal for Camera Scanning */}
            <QrScannerModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onScan={(code) => {
                    if (code) {
                        setIsCameraOpen(false);
                        setSearchQr(code);
                        handleSearchOrder(code);
                    }
                }}
                title="Escanear Código QR de OE"
            />

            {/* Modal "Embarque guardado" (Pixel-perfect matching Image 3) */}
            <Transition.Root show={showSuccessModal} as={Fragment}>
                <Dialog
                    as="div"
                    className="relative z-50"
                    onClose={() => setShowSuccessModal(false)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white px-8 pb-8 pt-10 text-center shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                                    {/* Circular Checkmark Badge */}
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-200 bg-green-50/50">
                                        <Check className="h-12 w-12 text-green-500 stroke-[3]" />
                                    </div>

                                    {/* Modal Text */}
                                    <div className="mt-6">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-2xl font-bold leading-6 text-gray-800"
                                        >
                                            Embarque guardado
                                        </Dialog.Title>
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-500">
                                                El embarque se guardó correctamente.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-8">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 focus:outline-none transition duration-150"
                                            onClick={() => setShowSuccessModal(false)}
                                        >
                                            Entendido
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
            {/* Modal de Muestreo de Ensacadora (Acción) */}
            <EnsacadoraSamplingModal
                isOpen={isSamplingModalOpen}
                onClose={async () => {
                    setIsSamplingModalOpen(false);
                    setSamplingRevision((r) => r + 1);
                    await refreshHistory();
                    await refreshIncidents();
                }}
                order={activeSamplingOrder}
                stowageCount={activeSamplingOrder?.stowage_count || stowageCount}
                totalSamplesCount={activeSamplingOrder ? getTargetSamplesForRow(activeSamplingOrder) : 80}
                onSave={async () => {
                    setSamplingRevision((r) => r + 1);
                    await refreshHistory();
                }}
                canRelease={
                    !isEstibadorUser &&
                    Boolean(activeSamplingOrder) &&
                    isRowEnvasado(activeSamplingOrder) &&
                    isVoBoApproved(activeSamplingOrder) &&
                    !isSamplingReleased(activeSamplingOrder)
                }
                onRelease={async () => {
                    if (!activeSamplingOrder) return;
                    await handleFinish(String(activeSamplingOrder.id), activeSamplingOrder.folio || "");
                }}
                onUnlockSuccess={async (newIncident) => {
                    setSamplingRevision((r) => r + 1);
                    await refreshHistory();
                    await refreshIncidents();
                    if (newIncident) {
                        setIncidents((prev) => [newIncident, ...prev.filter((i) => i.id !== newIncident.id)]);
                    }
                    setActiveSamplingOrder((prev: any) =>
                        prev
                            ? {
                                  ...prev,
                                  is_sampling_blocked: false,
                                  sampling_status:
                                      (Array.isArray(prev.samples) ? prev.samples.length : 0) >= getTargetSamplesForRow(prev)
                                          ? "completed"
                                          : "in_progress",
                                  sampling_completed_at: null,
                                  sampling_unlock_count:
                                      newIncident?.unlock_count ?? ((prev.sampling_unlock_count || 0) + 1),
                              }
                            : prev
                    );
                }}
                onOpenPrintDocuments={handleOpenPrintModalFromSampling}
            />

            {/* Modal de Plan de Estiba (GLS-AP-FO-002) */}
            <StowagePlanModal
                isOpen={isStowageModalOpen}
                onClose={async () => {
                    setIsStowageModalOpen(false);
                    await refreshHistory();
                }}
                order={activeStowageOrder}
                isEstibadorUser={isEstibadorUser}
                verifiers={verifiers}
                onSaved={async (updated) => {
                    if (updated) {
                        setActiveStowageOrder(updated);
                        if (isEstibadorUser || updated.lot_id || (updated as any).history_id) {
                            setHistory((prev) => {
                                const exists = prev.some((h) => String(h.id) === String(updated.id) || h.folio === updated.folio);
                                if (exists) {
                                    return prev.map((h) => (String(h.id) === String(updated.id) || h.folio === updated.folio ? { ...h, ...updated } : h));
                                }
                                return [updated, ...prev];
                            });
                        }
                    }
                    await refreshHistory();
                }}
            />

            {/* Modal de Impresión de Documentos (GLS-AP-FO-003 y GLS-AP-FO-002) */}
            <ShipmentDocumentsPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                order={printOrderData}
                samples={printSamplesData}
            />
        </DashboardLayout>
    );
}
