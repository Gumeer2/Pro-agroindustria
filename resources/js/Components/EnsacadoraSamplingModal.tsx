import React, { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import {
    X,
    Printer,
    Check,
    AlertCircle,
    Pencil,
    Save,
    Trash2,
    Scale,
    Layers,
    TrendingUp,
    BarChart3,
    Activity,
    Info,
    CheckCircle2,
    AlertTriangle,
    FileText,
    ArrowRight,
    Lock,
    Unlock,
    Cloud,
    RotateCcw,
    ShieldAlert,
    KeyRound,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface SampleRecord {
    id: number;
    num: number;
    ensacadora: 1 | 2;
    envasadora?: 1 | 2;
    weight: number;
    time?: string;
    captured_at?: string;
}

interface ToleranceRow {
    programmedTons: number;
    pesoIdealKg: number;
    pesoLimiteInferiorKg: number;
    pesoLimiteSuperiorKg: number;
    redondeadoInferiorKg: number;
    redondeadoSuperiorKg: number;
}

// GUIA PARA TOLERANCIA DE PESOS DE SACOS DE 25 KG (Oficial Almacenes de Producto Terminado)
const TOLERANCE_TABLE_25KG: Record<number, ToleranceRow> = {
    20: { programmedTons: 20, pesoIdealKg: 20064, pesoLimiteInferiorKg: 20044, pesoLimiteSuperiorKg: 20084, redondeadoInferiorKg: 20040, redondeadoSuperiorKg: 20080 },
    21: { programmedTons: 21, pesoIdealKg: 21067, pesoLimiteInferiorKg: 21047, pesoLimiteSuperiorKg: 21087, redondeadoInferiorKg: 21050, redondeadoSuperiorKg: 21090 },
    22: { programmedTons: 22, pesoIdealKg: 22070, pesoLimiteInferiorKg: 22050, pesoLimiteSuperiorKg: 22090, redondeadoInferiorKg: 22050, redondeadoSuperiorKg: 22090 },
    23: { programmedTons: 23, pesoIdealKg: 23074, pesoLimiteInferiorKg: 23054, pesoLimiteSuperiorKg: 23094, redondeadoInferiorKg: 23050, redondeadoSuperiorKg: 23090 },
    24: { programmedTons: 24, pesoIdealKg: 24077, pesoLimiteInferiorKg: 24057, pesoLimiteSuperiorKg: 24097, redondeadoInferiorKg: 24060, redondeadoSuperiorKg: 24100 },
    25: { programmedTons: 25, pesoIdealKg: 25080, pesoLimiteInferiorKg: 25060, pesoLimiteSuperiorKg: 25100, redondeadoInferiorKg: 25060, redondeadoSuperiorKg: 25100 },
    26: { programmedTons: 26, pesoIdealKg: 26083, pesoLimiteInferiorKg: 26063, pesoLimiteSuperiorKg: 26103, redondeadoInferiorKg: 26060, redondeadoSuperiorKg: 26100 },
    27: { programmedTons: 27, pesoIdealKg: 27086, pesoLimiteInferiorKg: 27066, pesoLimiteSuperiorKg: 27106, redondeadoInferiorKg: 27070, redondeadoSuperiorKg: 27110 },
    28: { programmedTons: 28, pesoIdealKg: 28090, pesoLimiteInferiorKg: 28070, pesoLimiteSuperiorKg: 28110, redondeadoInferiorKg: 28070, redondeadoSuperiorKg: 28110 },
    29: { programmedTons: 29, pesoIdealKg: 29093, pesoLimiteInferiorKg: 29073, pesoLimiteSuperiorKg: 29113, redondeadoInferiorKg: 29070, redondeadoSuperiorKg: 29110 },
    30: { programmedTons: 30, pesoIdealKg: 30096, pesoLimiteInferiorKg: 30076, pesoLimiteSuperiorKg: 30116, redondeadoInferiorKg: 30080, redondeadoSuperiorKg: 30120 },
    31: { programmedTons: 31, pesoIdealKg: 31099, pesoLimiteInferiorKg: 31079, pesoLimiteSuperiorKg: 31119, redondeadoInferiorKg: 31080, redondeadoSuperiorKg: 31120 },
    32: { programmedTons: 32, pesoIdealKg: 32102, pesoLimiteInferiorKg: 32082, pesoLimiteSuperiorKg: 32122, redondeadoInferiorKg: 32080, redondeadoSuperiorKg: 32120 },
    33: { programmedTons: 33, pesoIdealKg: 33106, pesoLimiteInferiorKg: 33086, pesoLimiteSuperiorKg: 33126, redondeadoInferiorKg: 33090, redondeadoSuperiorKg: 33130 },
    34: { programmedTons: 34, pesoIdealKg: 34109, pesoLimiteInferiorKg: 34089, pesoLimiteSuperiorKg: 34129, redondeadoInferiorKg: 34090, redondeadoSuperiorKg: 34130 },
    35: { programmedTons: 35, pesoIdealKg: 35112, pesoLimiteInferiorKg: 35092, pesoLimiteSuperiorKg: 35132, redondeadoInferiorKg: 35090, redondeadoSuperiorKg: 35130 },
    36: { programmedTons: 36, pesoIdealKg: 36115, pesoLimiteInferiorKg: 36095, pesoLimiteSuperiorKg: 36135, redondeadoInferiorKg: 36100, redondeadoSuperiorKg: 36140 },
};

// GUIA PARA TOLERANCIA DE PESOS DE SACOS DE 50 KG (Oficial Almacenes de Producto Terminado)
const TOLERANCE_TABLE_50KG: Record<number, ToleranceRow> = {
    20: { programmedTons: 20, pesoIdealKg: 20048, pesoLimiteInferiorKg: 20028, pesoLimiteSuperiorKg: 20068, redondeadoInferiorKg: 20030, redondeadoSuperiorKg: 20070 },
    21: { programmedTons: 21, pesoIdealKg: 21050, pesoLimiteInferiorKg: 21030, pesoLimiteSuperiorKg: 21070, redondeadoInferiorKg: 21030, redondeadoSuperiorKg: 21070 },
    22: { programmedTons: 22, pesoIdealKg: 22053, pesoLimiteInferiorKg: 22033, pesoLimiteSuperiorKg: 22073, redondeadoInferiorKg: 22030, redondeadoSuperiorKg: 22070 },
    23: { programmedTons: 23, pesoIdealKg: 23055, pesoLimiteInferiorKg: 23035, pesoLimiteSuperiorKg: 23075, redondeadoInferiorKg: 23040, redondeadoSuperiorKg: 23080 },
    24: { programmedTons: 24, pesoIdealKg: 24058, pesoLimiteInferiorKg: 24038, pesoLimiteSuperiorKg: 24078, redondeadoInferiorKg: 24040, redondeadoSuperiorKg: 24080 },
    25: { programmedTons: 25, pesoIdealKg: 25060, pesoLimiteInferiorKg: 25040, pesoLimiteSuperiorKg: 25080, redondeadoInferiorKg: 25040, redondeadoSuperiorKg: 25080 },
    26: { programmedTons: 26, pesoIdealKg: 26062, pesoLimiteInferiorKg: 26042, pesoLimiteSuperiorKg: 26082, redondeadoInferiorKg: 26040, redondeadoSuperiorKg: 26080 },
    27: { programmedTons: 27, pesoIdealKg: 27065, pesoLimiteInferiorKg: 27045, pesoLimiteSuperiorKg: 27085, redondeadoInferiorKg: 27050, redondeadoSuperiorKg: 27090 },
    28: { programmedTons: 28, pesoIdealKg: 28067, pesoLimiteInferiorKg: 28047, pesoLimiteSuperiorKg: 28087, redondeadoInferiorKg: 28050, redondeadoSuperiorKg: 28090 },
    29: { programmedTons: 29, pesoIdealKg: 29070, pesoLimiteInferiorKg: 29050, pesoLimiteSuperiorKg: 29090, redondeadoInferiorKg: 29050, redondeadoSuperiorKg: 29090 },
    30: { programmedTons: 30, pesoIdealKg: 30072, pesoLimiteInferiorKg: 30052, pesoLimiteSuperiorKg: 30092, redondeadoInferiorKg: 30050, redondeadoSuperiorKg: 30090 },
    31: { programmedTons: 31, pesoIdealKg: 31074, pesoLimiteInferiorKg: 31054, pesoLimiteSuperiorKg: 31094, redondeadoInferiorKg: 31050, redondeadoSuperiorKg: 31090 },
    32: { programmedTons: 32, pesoIdealKg: 32077, pesoLimiteInferiorKg: 32057, pesoLimiteSuperiorKg: 32097, redondeadoInferiorKg: 32060, redondeadoSuperiorKg: 32100 },
    33: { programmedTons: 33, pesoIdealKg: 33079, pesoLimiteInferiorKg: 33059, pesoLimiteSuperiorKg: 33099, redondeadoInferiorKg: 33060, redondeadoSuperiorKg: 33100 },
    34: { programmedTons: 34, pesoIdealKg: 34082, pesoLimiteInferiorKg: 34062, pesoLimiteSuperiorKg: 34102, redondeadoInferiorKg: 34060, redondeadoSuperiorKg: 34100 },
    35: { programmedTons: 35, pesoIdealKg: 35084, pesoLimiteInferiorKg: 35064, pesoLimiteSuperiorKg: 35104, redondeadoInferiorKg: 35060, redondeadoSuperiorKg: 35100 },
    36: { programmedTons: 36, pesoIdealKg: 36086, pesoLimiteInferiorKg: 36066, pesoLimiteSuperiorKg: 36106, redondeadoInferiorKg: 36070, redondeadoSuperiorKg: 36110 },
};

// GUIA PARA TOLERANCIA DE PESOS DE SACOS DE 1000 KG (Oficial Almacenes de Producto Terminado)
const TOLERANCE_TABLE_1000KG: Record<number, ToleranceRow> = {
    20: { programmedTons: 20, pesoIdealKg: 20050, pesoLimiteInferiorKg: 20030, pesoLimiteSuperiorKg: 20070, redondeadoInferiorKg: 20030, redondeadoSuperiorKg: 20070 },
    21: { programmedTons: 21, pesoIdealKg: 21053, pesoLimiteInferiorKg: 21033, pesoLimiteSuperiorKg: 21073, redondeadoInferiorKg: 21030, redondeadoSuperiorKg: 21070 },
    22: { programmedTons: 22, pesoIdealKg: 22055, pesoLimiteInferiorKg: 22035, pesoLimiteSuperiorKg: 22075, redondeadoInferiorKg: 22040, redondeadoSuperiorKg: 22080 },
    23: { programmedTons: 23, pesoIdealKg: 23058, pesoLimiteInferiorKg: 23038, pesoLimiteSuperiorKg: 23078, redondeadoInferiorKg: 23040, redondeadoSuperiorKg: 23080 },
    24: { programmedTons: 24, pesoIdealKg: 24060, pesoLimiteInferiorKg: 24040, pesoLimiteSuperiorKg: 24080, redondeadoInferiorKg: 24040, redondeadoSuperiorKg: 24080 },
    25: { programmedTons: 25, pesoIdealKg: 25063, pesoLimiteInferiorKg: 25043, pesoLimiteSuperiorKg: 25083, redondeadoInferiorKg: 25040, redondeadoSuperiorKg: 25080 },
    26: { programmedTons: 26, pesoIdealKg: 26065, pesoLimiteInferiorKg: 26045, pesoLimiteSuperiorKg: 26085, redondeadoInferiorKg: 26050, redondeadoSuperiorKg: 26080 },
    27: { programmedTons: 27, pesoIdealKg: 27068, pesoLimiteInferiorKg: 27048, pesoLimiteSuperiorKg: 27088, redondeadoInferiorKg: 27050, redondeadoSuperiorKg: 27090 },
    28: { programmedTons: 28, pesoIdealKg: 28070, pesoLimiteInferiorKg: 28050, pesoLimiteSuperiorKg: 28090, redondeadoInferiorKg: 27050, redondeadoSuperiorKg: 27090 },
    29: { programmedTons: 29, pesoIdealKg: 29073, pesoLimiteInferiorKg: 29053, pesoLimiteSuperiorKg: 29093, redondeadoInferiorKg: 27050, redondeadoSuperiorKg: 27090 },
    30: { programmedTons: 30, pesoIdealKg: 30075, pesoLimiteInferiorKg: 30055, pesoLimiteSuperiorKg: 30095, redondeadoInferiorKg: 30060, redondeadoSuperiorKg: 30100 },
    31: { programmedTons: 31, pesoIdealKg: 31078, pesoLimiteInferiorKg: 31058, pesoLimiteSuperiorKg: 31098, redondeadoInferiorKg: 31060, redondeadoSuperiorKg: 31100 },
    32: { programmedTons: 32, pesoIdealKg: 32080, pesoLimiteInferiorKg: 32060, pesoLimiteSuperiorKg: 32100, redondeadoInferiorKg: 32060, redondeadoSuperiorKg: 32100 },
    33: { programmedTons: 33, pesoIdealKg: 33083, pesoLimiteInferiorKg: 33063, pesoLimiteSuperiorKg: 33103, redondeadoInferiorKg: 33060, redondeadoSuperiorKg: 33100 },
    34: { programmedTons: 34, pesoIdealKg: 34085, pesoLimiteInferiorKg: 34065, pesoLimiteSuperiorKg: 34105, redondeadoInferiorKg: 34070, redondeadoSuperiorKg: 34110 },
    35: { programmedTons: 35, pesoIdealKg: 35088, pesoLimiteInferiorKg: 35068, pesoLimiteSuperiorKg: 35108, redondeadoInferiorKg: 35070, redondeadoSuperiorKg: 35110 },
    36: { programmedTons: 36, pesoIdealKg: 36090, pesoLimiteInferiorKg: 36070, pesoLimiteSuperiorKg: 36110, redondeadoInferiorKg: 36070, redondeadoSuperiorKg: 36110 },
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    stowageCount?: string | number;
    totalSamplesCount?: number;
    onOpenPrintDocuments?: (samples: SampleRecord[]) => void;
    onSave?: (samples: SampleRecord[]) => void;
    onUnlockSuccess?: (incident: any) => void;
}

export default function EnsacadoraSamplingModal({
    isOpen,
    onClose,
    order,
    stowageCount,
    totalSamplesCount = 80,
    onOpenPrintDocuments,
    onSave,
    onUnlockSuccess,
}: Props) {
    const [selectedEnsacadora, setSelectedEnsacadora] = useState<1 | 2>(1);
    const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
    const [pendingWeight, setPendingWeight] = useState<number | null>(null);
    const [sampleInput, setSampleInput] = useState<string>("");
    const [inputError, setInputError] = useState<string>("");
    const [samples, setSamples] = useState<SampleRecord[]>([]);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
    const sampleInputRef = useRef<HTMLInputElement>(null);
    const isLoadedRef = useRef<boolean>(false);

    // Block & Unlock states
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [isAuthorizedAfterLock, setIsAuthorizedAfterLock] = useState<boolean>(false);
    const [isEndOfSamplingBlock, setIsEndOfSamplingBlock] = useState<boolean>(false);
    const [consecutiveOutCount, setConsecutiveOutCount] = useState<number>(0);
    const [unlockCount, setUnlockCount] = useState<number>(0);
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
    const [unlockUser, setUnlockUser] = useState<string>("");
    const [unlockPassword, setUnlockPassword] = useState<string>("");
    const [unlockNotes, setUnlockNotes] = useState<string>("");
    const [unlockError, setUnlockError] = useState<string>("");
    const [isSubmittingUnlock, setIsSubmittingUnlock] = useState<boolean>(false);
    const [blockReason, setBlockReason] = useState<string>("Validación de tolerancia de pesos");

    // Identifica si el bloqueo actual corresponde a la advertencia de las últimas 5 muestras (fin de muestreo)
    const isFinalSamplingBlock = useMemo(() => {
        return (
            isEndOfSamplingBlock ||
            blockReason.includes("Cierre de muestreo") ||
            blockReason.includes("Validación de cierre") ||
            (isBlocked && (samples.length >= 75 || samples.length === 80))
        );
    }, [isEndOfSamplingBlock, blockReason, isBlocked, samples.length]);

    // Tolerance Guide modal
    const [showToleranceGuideModal, setShowToleranceGuideModal] = useState<boolean>(false);

    // Enriched order state with sacks and tons
    const [detailedOrder, setDetailedOrder] = useState<any>(order);

    useEffect(() => {
        setDetailedOrder(order);
        if (isOpen && order?.id) {
            // If sacks_count or programmed_tons is missing from history item, fetch from order print-data
            if (!order.sacks_count && !order.programmed_tons) {
                try {
                    axios
                        .get(route("documentation.orders.print-data", order.id))
                        .then((res) => {
                            if (res.data?.order) {
                                setDetailedOrder((prev: any) => ({ ...prev, ...res.data.order }));
                            }
                        })
                        .catch(() => {});
                } catch (e) {}
            }
        }
    }, [isOpen, order]);

    // Editing state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");

    // Storage Key for draft & persistence per order
    const getStorageKey = () => {
        if (!order) return "ensacadora_sampling_draft_temp";
        const id = order.id || order.order_number || order.folio || "current";
        return `ensacadora_sampling_order_${id}`;
    };

    // Determine target weight automatically based on order presentation / product / sacks / tons
    const detectedBaseWeight = useMemo<25 | 50 | 1000>(() => {
        const o = detailedOrder || order;
        if (!o) return 25;

        const combinedText = `${o.presentation || ""} ${o.product || ""} ${o.product_text || ""} ${o.sacks_count || ""}`.toUpperCase();

        // 1. Detección por texto explícito (1000 kg / Supersaco / Big Bag)
        if (
            combinedText.includes("1000") ||
            combinedText.includes("1 TON") ||
            combinedText.includes("1TM") ||
            combinedText.includes("BIG") ||
            combinedText.includes("SUPERSACO") ||
            combinedText.includes("SUPER SACO")
        ) {
            return 1000;
        }

        // 50 KG
        if (
            combinedText.includes("50KG") ||
            combinedText.includes("50 KG") ||
            /\b50\s*KG\b/i.test(combinedText) ||
            /\b50\s*KILOS\b/i.test(combinedText) ||
            /\bSACO[S]?\s+DE\s+50\b/i.test(combinedText)
        ) {
            return 50;
        }

        // 25 KG
        if (
            combinedText.includes("25KG") ||
            combinedText.includes("25 KG") ||
            /\b25\s*KG\b/i.test(combinedText) ||
            /\b25\s*KILOS\b/i.test(combinedText) ||
            /\bSACO[S]?\s+DE\s+25\b/i.test(combinedText)
        ) {
            return 25;
        }

        // 2. Si no viene en texto, deducir automáticamente por la relación de toneladas y sacos
        const tons =
            parseFloat(String(o.programmed_tons || "0")) ||
            (parseFloat(String(o.programmed_weight || "0")) > 1000
                ? parseFloat(String(o.programmed_weight || "0")) / 1000
                : parseFloat(String(o.programmed_weight || "0")));

        const sacksRaw = String(o.sacks_count || o.total_sacks || o.sacks_quantity || "").replace(/\D/g, "");
        const sacks = parseInt(sacksRaw, 10);

        if (tons > 0 && sacks > 0) {
            const kgPerSack = (tons * 1000) / sacks;
            if (kgPerSack >= 800) return 1000;
            if (kgPerSack >= 40 && kgPerSack <= 65) return 50;
            if (kgPerSack >= 18 && kgPerSack <= 35) return 25;
        }

        // 3. Fallback en presentation directo
        if (/\b50\b/.test(String(o.presentation || ""))) return 50;
        if (/\b25\b/.test(String(o.presentation || ""))) return 25;

        return 25;
    }, [detailedOrder, order]);

    // Presentación programada según la orden
    const targetBaseWeight = detectedBaseWeight;

    // Cantidad total de sacos programados en la orden de embarque
    const totalSacks = useMemo(() => {
        const o = detailedOrder || order;
        if (!o) return 0;

        // 1. Conteo directo si ya viene como propiedad numérica
        if (o.total_sacks && Number(o.total_sacks) > 0) return Number(o.total_sacks);
        if (o.sacks_quantity && Number(o.sacks_quantity) > 0) return Number(o.sacks_quantity);

        const rawSacks = String(o.sacks_count || "").trim();

        // 2. Si sacks_count contiene el conteo directo (ej. "1440 SACOS", "1440", "1200 sacos")
        const directMatch = rawSacks.match(/^(\d+)\s*(sacos?|sck)?$/i);
        if (directMatch && !rawSacks.toUpperCase().includes("KG")) {
            const val = parseInt(directMatch[1], 10);
            if (!isNaN(val) && val > 0) return val;
        }

        let bagSize = targetBaseWeight || 25;
        const sizeFromSacks = rawSacks.match(/(\d+)\s*kg/i);
        if (sizeFromSacks) {
            bagSize = parseInt(sizeFromSacks[1], 10) || bagSize;
        } else {
            const pText = String(o.product_text || o.product || o.presentation || "");
            const matchP = pText.match(/(\d+)\s*kg/i);
            if (matchP) {
                bagSize = parseInt(matchP[1], 10) || bagSize;
            }
        }

        const tons =
            parseFloat(String(o.programmed_tons || "0")) ||
            (parseFloat(String(o.programmed_weight || "0")) > 1000
                ? parseFloat(String(o.programmed_weight || "0")) / 1000
                : parseFloat(String(o.programmed_weight || "0"))) || 36;

        // 4. Calcular a partir de toneladas programadas (ej. 36.00 ton / 25 kg = 1440 sacos)
        if (tons > 0 && bagSize > 0) {
            return Math.round((tons * 1000) / bagSize);
        }

        // 5. Calcular a partir de peso programado en kg
        const weightKg = parseFloat(String(o.programmed_weight || "0"));
        if (weightKg > 0 && bagSize > 0) {
            return Math.round(weightKg / bagSize);
        }

        // 6. Respaldo: si sacks_count tiene dígitos mayores a 50 (ej. "1080")
        const digits = rawSacks.replace(/\D/g, "");
        if (digits && parseInt(digits, 10) > 50) {
            return parseInt(digits, 10);
        }

        return 0;
    }, [detailedOrder, order, targetBaseWeight]);

    // Toneladas programadas de la orden
    const orderTons = useMemo(() => {
        const o = detailedOrder || order;
        if (!o) return 36;
        const pt = parseFloat(String(o.programmed_tons || "0"));
        if (pt > 0) return pt;
        const pw = parseFloat(String(o.programmed_weight || "0"));
        if (pw > 0) return pw > 1000 ? pw / 1000 : pw;
        if (totalSacks > 0 && targetBaseWeight > 0) {
            return (totalSacks * targetBaseWeight) / 1000;
        }
        return 36;
    }, [detailedOrder, order, totalSacks, targetBaseWeight]);

    // Límites de Tolerancia Oficiales basados estrictamente en la GUIA PARA TOLERANCIA DE PESOS
    // Almacenes de Producto Terminado (considerando incertidumbre de báscula camionera +-20 kg y redondeo)
    const limits = useMemo(() => {
        const presentation = (targetBaseWeight === 1000 ? 1000 : (targetBaseWeight === 50 ? 50 : 25)) as 25 | 50 | 1000;
        const tons = Math.max(1, Math.round(orderTons || 36));
        const sacks = totalSacks > 0 ? totalSacks : Math.round((tons * 1000) / presentation);

        const sackWeight = presentation === 1000 ? 2.5 : (presentation === 50 ? 0.12 : 0.08);
        const idealSack = presentation + sackWeight;

        // Búsqueda en la tabla oficial de la guía
        const table = presentation === 1000 ? TOLERANCE_TABLE_1000KG : (presentation === 50 ? TOLERANCE_TABLE_50KG : TOLERANCE_TABLE_25KG);
        const row = table[tons];

        const totalIdealKg = row ? row.pesoIdealKg : (sacks * idealSack);
        const totalInferiorKg = row ? row.pesoLimiteInferiorKg : (totalIdealKg - 20);
        const totalSuperiorKg = row ? row.pesoLimiteSuperiorKg : (totalIdealKg + 20);

        // Límites Redondeados Oficiales (Columnas Verdes de la Guía Excel)
        const roundedInfKg = row ? row.redondeadoInferiorKg : (Math.floor(totalInferiorKg / 10) * 10);
        const roundedSupKg = row ? row.redondeadoSuperiorKg : (Math.ceil(totalSuperiorKg / 10) * 10);

        // Límites por saco requeridos:
        // 25 kg: Límite inferior (24.900), límite de control (25.080) y límite superior (25.250)
        // 50 kg: Límite inferior (49.900), límite de control (50.100) y límite superior (50.300)
        const inferiorPerSack = presentation === 1000 ? 998.00 : (presentation === 50 ? 49.90 : 24.90);
        const controlPerSack = presentation === 1000 ? 1002.50 : (presentation === 50 ? 50.10 : 25.08);
        const superiorPerSack = presentation === 1000 ? 1002.00 : (presentation === 50 ? 50.30 : 25.25);

        return {
            productWeight: presentation,
            sackWeight,
            ideal: controlPerSack, // 25.080 kg / 50.100 kg
            inferior: inferiorPerSack, // 24.900 kg / 49.900 kg
            superior: superiorPerSack, // 25.250 kg / 50.300 kg
            totalIdealTons: totalIdealKg / 1000,
            totalInferiorTons: roundedInfKg / 1000, // 36.100 ton
            totalSuperiorTons: roundedSupKg / 1000, // 36.140 ton
            roundedInferiorTons: roundedInfKg / 1000,
            roundedSuperiorTons: roundedSupKg / 1000,
            unroundedInferiorTons: totalInferiorKg / 1000,
            unroundedSuperiorTons: totalSuperiorKg / 1000,
            totalIdealKg,
            totalInferiorKg: roundedInfKg,
            totalSuperiorKg: roundedSupKg,
            roundedInfKg,
            roundedSupKg,
            sacks,
            tons,
            minChart: presentation === 25 ? 24.80 : (presentation === 50 ? 49.75 : 995),
            maxChart: presentation === 25 ? 25.35 : (presentation === 50 ? 50.45 : 1005),
        };
    }, [targetBaseWeight, orderTons, totalSacks]);

    // Load samples or restore draft when modal opens
    useEffect(() => {
        if (isOpen && order) {
            isLoadedRef.current = false;

            // 1. Inicializar estrictamente desde los datos de la orden en DB (solo completado si tiene 80 muestras)
            const initialSamples = Array.isArray(order.samples) ? order.samples : [];
            const initialSaved = initialSamples.length >= 80;
            setSamples(initialSamples);
            setIsSaved(initialSaved);
            setSavedAt(initialSaved ? (order.sampling_completed_at || null) : null);
            setLastAutosavedAt(null);
            const initialBlocked = Boolean(order.is_sampling_blocked);
            setIsBlocked(initialBlocked);
            if (initialBlocked) {
                setBlockReason("Muestreo bloqueado por validación de tolerancia");
                setIsUnlockModalOpen(true);
            }
            const initialUnlockCount = Number(order.sampling_unlock_count || 0);
            setUnlockCount(initialUnlockCount);
            if (initialUnlockCount > 0 && !initialBlocked) {
                setIsAuthorizedAfterLock(true);
            }
            setConsecutiveOutCount(0);

            // 2. Claves de almacenamiento de esta orden
            const primaryKey = getStorageKey();
            const candidateKeys = [
                primaryKey,
                order.id ? `ensacadora_sampling_order_${order.id}` : null,
                order.id ? `ensacadora_sampling_${order.id}` : null,
                order.id ? `envasadora_sampling_order_${order.id}` : null,
                order.id ? `envasadora_sampling_${order.id}` : null,
                order.folio ? `ensacadora_sampling_order_${order.folio}` : null,
                order.folio ? `ensacadora_sampling_${order.folio}` : null,
                order.order_number ? `ensacadora_sampling_order_${order.order_number}` : null,
                "ensacadora_sampling_draft_temp",
                "envasadora_sampling_draft_temp",
            ].filter(Boolean) as string[];

            // 3. Consultar la base de datos de manera autoritativa
            const currentOrderId = order.id || order.shipment_order_id || order.folio;
            if (currentOrderId) {
                axios
                    .get(route("documentation.shipment-orders.get-sampling", currentOrderId))
                    .then((res) => {
                        const dbSamples = Array.isArray(res.data?.samples) ? res.data.samples : [];
                        if (dbSamples.length > 0) {
                            setSamples(dbSamples);
                            if (dbSamples.length >= 80) {
                                setIsSaved(true);
                                setSavedAt(res.data.sampling_completed_at || null);
                            } else {
                                setIsSaved(false);
                                setSavedAt(null);
                            }
                        } else {
                            // En base de datos no hay muestras: garantizar 0 y limpiar borradores
                            setSamples([]);
                            setIsSaved(false);
                            setSavedAt(null);
                            candidateKeys.forEach((k) => {
                                try {
                                    localStorage.removeItem(k);
                                } catch (err) {}
                            });
                        }
                        if (res.data?.is_sampling_blocked !== undefined) {
                            const b = Boolean(res.data.is_sampling_blocked);
                            setIsBlocked(b);
                            if (b) {
                                setBlockReason("Muestreo bloqueado por validación de tolerancia");
                                setIsUnlockModalOpen(true);
                            }
                        }
                        if (res.data?.sampling_unlock_count !== undefined) {
                            const uc = Number(res.data.sampling_unlock_count);
                            setUnlockCount(uc);
                            if (uc > 0 && !res.data.is_sampling_blocked) {
                                setIsAuthorizedAfterLock(true);
                            }
                        }
                    })
                    .catch(() => {});
            }

            setSampleInput("");
            setInputError("");
            setEditingId(null);
            setIsSelectorOpen(false);
            setPendingWeight(null);
            setTimeout(() => {
                isLoadedRef.current = true;
                sampleInputRef.current?.focus();
            }, 100);
        } else {
            isLoadedRef.current = false;
        }
    }, [isOpen, order?.id, order?.order_number, order?.folio]);

    const persistSamplingData = (payload: any) => {
        const primaryKey = getStorageKey();
        const candidateKeys = new Set<string>();
        candidateKeys.add(primaryKey);

        const ids = [order?.id, order?.order_number, order?.folio].filter(Boolean);
        ids.forEach((id) => {
            candidateKeys.add(`ensacadora_sampling_order_${id}`);
            candidateKeys.add(`envasadora_sampling_order_${id}`);
            candidateKeys.add(`ensacadora_sampling_${id}`);
            candidateKeys.add(`envasadora_sampling_${id}`);
        });

        // Do NOT wipe out stored samples if new payload is empty
        const newSamples = Array.isArray(payload?.samples) ? payload.samples : [];
        if (newSamples.length === 0) {
            for (const k of candidateKeys) {
                try {
                    const raw = localStorage.getItem(k);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed?.samples) && parsed.samples.length > 0) {
                            return;
                        }
                    }
                } catch (e) {}
            }
        }

        const serialized = JSON.stringify(payload);
        candidateKeys.forEach((k) => {
            try {
                localStorage.setItem(k, serialized);
            } catch (err) {}
        });

        try {
            window.dispatchEvent(new Event("storage"));
        } catch (err) {}
    };

    // Helper: Guardar en tiempo real directamente en la base de datos (shipment_process_histories)
    const saveSamplesToDatabase = async (
        samplesToSave: SampleRecord[],
        isCompleted: boolean = false,
        isBlockedParam?: boolean
    ) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        const targetId = order?.id || order?.shipment_order_id || order?.folio || order?.order_number;
        if (!targetId) return null;

        const effectiveBlocked = isBlockedParam !== undefined ? isBlockedParam : isBlocked;

        // Respaldo local
        try {
            persistSamplingData({
                orderId: targetId,
                samples: samplesToSave,
                isSaved: isCompleted,
                isBlocked: effectiveBlocked,
                savedAt: isCompleted ? (savedAt || now.toISOString()) : null,
                selectedEnsacadora,
                selectedEnvasadora: selectedEnsacadora,
                updatedAt: now.toISOString(),
            });
            setLastAutosavedAt(timeStr);
        } catch (e) {
            console.error("Error al respaldar en localStorage:", e);
        }

        try {
            const response = await axios.post(
                route("documentation.shipment-orders.save-sampling", targetId),
                {
                    samples: samplesToSave,
                    stowage_count: stowageCount || order?.stowage_count || null,
                    is_completed: isCompleted,
                    is_blocked: effectiveBlocked,
                    shipment_order_id: order?.id || order?.shipment_order_id,
                    folio: order?.folio,
                    history_id: order?.history_id,
                }
            );
            return response.data;
        } catch (err) {
            console.error("Error al guardar estibas en base de datos:", err);
            return null;
        }
    };

    // Autoguardado continuo de respaldo en tiempo real
    useEffect(() => {
        if (!isLoadedRef.current || !order || !isOpen) return;
        const effectiveIsSaved = isSaved && samples.length === 80;

        const currentOrderId = order.id || order.shipment_order_id || order.folio;
        if (currentOrderId && samples.length > 0) {
            const timer = setTimeout(() => {
                saveSamplesToDatabase(samples, effectiveIsSaved);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [samples, isSaved, savedAt, selectedEnsacadora, stowageCount, order?.id, order?.folio]);

    // Bloqueo estricto: solo está bloqueado si TIENE LAS 80 ESTIBAS y fue guardado
    const isLocked = isSaved && samples.length === 80;

    // Proteger contra cierre involuntario de pestaña/navegador si hay estibas sin guardar
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isOpen && !isLocked && samples.length > 0) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isOpen, isLocked, samples.length]);

    const handleSave = async () => {
        // Verificar si al finalizar el muestreo el peso neto proyectado queda fuera de los rangos oficiales permitidos
        const currentRoundedNetTons = estimatedNetWeightTons !== null ? Math.round(estimatedNetWeightTons * 1000) / 1000 : null;
        const isNetOut = currentRoundedNetTons !== null
            ? (currentRoundedNetTons < limits.totalInferiorTons || currentRoundedNetTons > limits.totalSuperiorTons)
            : false;

        // Si está bloqueado o si llega a 80 muestras fuera de rango sin previa autorización del Jefe de Almacén
        const needsSupervisorAuth = !isAuthorizedAfterLock && (unlockCount || 0) === 0;
        if (isBlocked || (samples.length === 80 && isNetOut && needsSupervisorAuth)) {
            setIsEndOfSamplingBlock(true);
            setIsBlocked(true);
            setBlockReason(`Validación de cierre (80 muestras): El peso neto proyectado (${estimatedNetWeightTons?.toFixed(3)} ton) no está en el peso adecuado (${limits.totalInferiorTons.toFixed(3)} a ${limits.totalSuperiorTons.toFixed(3)} ton). El Jefe de Almacen o Supervisor Autoriza Peso Fuera de Rango.`);
            saveSamplesToDatabase(samples, false, true);
            Swal.fire({
                icon: "error",
                title: "Validación de Cierre - Captura Bloqueada",
                text: "Se requiere usuario y contraseña del Jefe de Almacén para autorizar y desbloquear la captura.",
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Entendido",
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: { container: "!z-[999999]" },
            }).then(() => {
                setIsUnlockModalOpen(true);
            });
            return;
        }

        const now = new Date().toISOString();
        const isCompleted = samples.length === 80;

        // Guardar directamente en la base de datos MariaDB (esperando confirmación)
        await saveSamplesToDatabase(samples, isCompleted);

        if (isCompleted) {
            setIsSaved(true);
            setSavedAt(savedAt || now);
            if (onSave) {
                await onSave(samples);
            }
            Swal.fire({
                icon: "success",
                title: "¡Muestreo Completado y Guardado!",
                html: "Se han guardado las <b>80 muestras</b> en la base de datos con éxito.<br/><br/>Muestreo finalizado y certificado.",
                confirmButtonColor: "#16a34a",
                confirmButtonText: "Aceptar",
            });
            onClose();
        } else {
            setIsSaved(false);
            if (onSave) {
                await onSave(samples);
            }
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "info",
                title: "Avance guardado",
                text: `${samples.length} de 80 muestras guardadas en la base de datos. Se sincronizarán en cualquier navegador.`,
                showConfirmButton: false,
                timer: 3000,
            });
            onClose();
        }
    };

    const handleAttemptClose = () => {
        handleSave();
    };

    const handleClearAllSamples = () => {
        Swal.fire({
            title: "¿Reiniciar muestreo a 0?",
            text: "Se eliminarán todas las muestras de esta orden y el conteo volverá a 0.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Sí, reiniciar a 0",
            cancelButtonText: "Cancelar",
        }).then(async (result) => {
            if (result.isConfirmed) {
                setSamples([]);
                setIsSaved(false);
                setSavedAt(null);
                setLastAutosavedAt(null);
                setIsEndOfSamplingBlock(false);
                await saveSamplesToDatabase([], false);

                const id = order?.id || order?.shipment_order_id || order?.folio || order?.order_number;
                const candidateKeys = [
                    getStorageKey(),
                    id ? `ensacadora_sampling_order_${id}` : null,
                    id ? `ensacadora_sampling_${id}` : null,
                    id ? `envasadora_sampling_order_${id}` : null,
                    id ? `envasadora_sampling_${id}` : null,
                    order?.folio ? `ensacadora_sampling_order_${order.folio}` : null,
                    order?.folio ? `ensacadora_sampling_${order.folio}` : null,
                    order?.id ? `ensacadora_sampling_order_${order.id}` : null,
                    "ensacadora_sampling_draft_temp",
                    "envasadora_sampling_draft_temp",
                ].filter(Boolean) as string[];
                candidateKeys.forEach((k) => {
                    try { localStorage.removeItem(k); } catch (e) {}
                });

                if (onSave) {
                    await onSave([]);
                }

                Swal.fire({
                    icon: "success",
                    title: "Muestreo Reiniciado",
                    text: "Se han eliminado todas las muestras. El conteo está en 0.",
                    timer: 1800,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleSelectEnsacadora = (env: 1 | 2) => {
        if (isLocked) return;
        if (isBlocked) {
            setIsSelectorOpen(false);
            setPendingWeight(null);
            Swal.fire({
                icon: "error",
                title: "Atención",
                text: "La toma de muestras se encuentra bloqueada por registrar pesos fuera de tolerancia. Ingrese el usuario y contraseña del Jefe de Almacén para desbloquear.",
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Entendido",
                customClass: { container: "!z-[999999]" },
            }).then(() => {
                setIsUnlockModalOpen(true);
            });
            return;
        }
        const weightToSave = pendingWeight !== null ? pendingWeight : parseFloat(sampleInput);
        if (weightToSave && !isNaN(weightToSave) && weightToSave > 0) {
            const countForThisEnv = samples.filter((s) => (s.ensacadora || s.envasadora) === env).length;
            if (countForThisEnv >= 40) {
                Swal.fire({
                    icon: "warning",
                    title: `ENS-${env} completada`,
                    text: `La ensacadora ENS-${env} ya cuenta con sus 40 muestras capturadas. Por favor seleccione la otra ensacadora.`,
                    confirmButtonColor: "#4f46e5",
                });
                return;
            }
            if (samples.length >= 80) {
                Swal.fire({
                    icon: "info",
                    title: "80 muestras completadas",
                    text: "Ya se completaron las 80 muestras requeridas en total. Por favor guarde el muestreo.",
                    confirmButtonColor: "#16a34a",
                });
                return;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
            const newRecord: SampleRecord = {
                id: Date.now() + Math.random(),
                num: countForThisEnv + 1,
                ensacadora: env,
                envasadora: env,
                weight: weightToSave,
                time: timeStr,
                captured_at: now.toISOString(),
            };
            const updated = [...samples, newRecord];
            setSamples(updated);

            // Calcular nuevo promedio y nuevo peso neto estimado
            const newOverallAvg = updated.reduce((acc, s) => acc + (Number(s.weight) || 0), 0) / updated.length;
            const newEstimatedNetTons = totalSacks > 0 ? (newOverallAvg * totalSacks) / 1000 : null;

            // VALIDACIÓN AL FINAL DE LAS 5 MUESTRAS (Muestra 40 de la ensacadora o muestra 80 total, no 1 por 1)
            const currentCountThisEnv = countForThisEnv + 1;
            const isEndOfSampling = currentCountThisEnv === 40 || updated.length === 80;

            // Verificar tolerancias basadas estrictamente en la guía oficial de toneladas (igual que la evaluación cada 10)
            const roundedNetTons = newEstimatedNetTons !== null ? Math.round(newEstimatedNetTons * 1000) / 1000 : null;

            // Límites exactos según la guía (ej. 36.100 a 36.140 ton exactos)
            const isBelow = roundedNetTons !== null
                ? roundedNetTons < limits.totalInferiorTons
                : false;
            const isAbove = roundedNetTons !== null
                ? roundedNetTons > limits.totalSuperiorTons
                : false;
            const isOut = isBelow || isAbove;

            if (isEndOfSampling) {
                // VALIDACIÓN CRÍTICA AL FINAL:
                // No revisa 1 por 1 en las últimas 5 muestras; se toman y al final si no está en rango permitido, se bloquea y pide jefe.
                if (isOut) {
                    setIsEndOfSamplingBlock(true);
                    setIsBlocked(true);
                    const diffDetail = isBelow
                        ? `El peso neto proyectado (${newEstimatedNetTons?.toFixed(3)} ton) queda por debajo del mínimo oficial (${limits.totalInferiorTons.toFixed(3)} ton)`
                        : `El peso neto proyectado (${newEstimatedNetTons?.toFixed(3)} ton) supera el máximo oficial (${limits.totalSuperiorTons.toFixed(3)} ton)`;

                    setBlockReason(`Cierre de muestreo (#${currentCountThisEnv}/40 ENS-${env}): ${diffDetail}. El Jefe de Almacen o Supervisor Autoriza Peso Fuera de Rango.`);
                    saveSamplesToDatabase(updated, false, true);

                    Swal.fire({
                        icon: "error",
                        title: "Validación de Cierre - Captura Bloqueada",
                        text: "Se requiere usuario y contraseña del Jefe de Almacén para autorizar y desbloquear la captura.",
                        confirmButtonColor: "#dc2626",
                        confirmButtonText: "Entendido",
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        customClass: { container: "!z-[999999]" },
                    }).then(() => {
                        setIsUnlockModalOpen(true);
                    });
                } else {
                    setConsecutiveOutCount(0);
                    saveSamplesToDatabase(updated, updated.length === 80, false);

                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: `Validación Cierre (Muestra #${currentCountThisEnv}/40 ENS-${env}): Peso Adecuado`,
                        text: `Peso neto estimado: ${newEstimatedNetTons?.toFixed(3)} ton (Dentro del rango oficial: ${limits.totalInferiorTons.toFixed(3)} a ${limits.totalSuperiorTons.toFixed(3)} ton).`,
                        showConfirmButton: false,
                        timer: 3500,
                        customClass: { container: "!z-[999999]" },
                    });
                }
            } else if (updated.length % 10 === 0) {
                // EVALUACIÓN CADA 10 MUESTRAS (10, 20, 30, etc.) PARA MUESTRAS 1 A 35
                let nextStreak = consecutiveOutCount;

                if (!isOut) {
                    nextStreak = 0;
                    setConsecutiveOutCount(0);
                    saveSamplesToDatabase(updated, false, false);

                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: `Control a las ${updated.length} muestras: Conforme`,
                        text: `Peso neto estimado: ${newEstimatedNetTons?.toFixed(3)} ton (Dentro del rango oficial: ${limits.totalInferiorTons.toFixed(3)} - ${limits.totalSuperiorTons.toFixed(3)} ton).`,
                        showConfirmButton: false,
                        timer: 3500,
                        customClass: { container: "!z-[999999]" },
                    });
                } else {
                    nextStreak = consecutiveOutCount + 1;
                    setConsecutiveOutCount(nextStreak);

                    const diffText = isBelow
                        ? `por debajo del límite inferior (${limits.totalInferiorTons.toFixed(3)} ton)`
                        : `por encima del límite superior (${limits.totalSuperiorTons.toFixed(3)} ton)`;

                    const netInfo = newEstimatedNetTons !== null
                        ? ` • Peso Neto Estimado: ${newEstimatedNetTons.toFixed(3)} ton`
                        : "";
                    const avgInfo = ` • Promedio actual: ${newOverallAvg.toFixed(3)} kg/saco`;

                    if (nextStreak === 1) {
                        Swal.fire({
                            icon: "error",
                            title: "Atención",
                            text: `ALERTA: Control a las ${updated.length} muestras está ${diffText}.${netInfo}${avgInfo}. Rango oficial: ${limits.totalInferiorTons.toFixed(3)} a ${limits.totalSuperiorTons.toFixed(3)} ton. Advertencia 1 de 2.`,
                            confirmButtonColor: "#dc2626",
                            confirmButtonText: "Entendido",
                            customClass: { container: "!z-[999999]" },
                        });
                        saveSamplesToDatabase(updated, false, false);
                    } else if (nextStreak === 2) {
                        Swal.fire({
                            icon: "error",
                            title: "Atención",
                            text: `ALERTA: Segundo control consecutivo fuera de tolerancia a las ${updated.length} muestras (${diffText}).${netInfo}${avgInfo}. Si en el siguiente control de 10 muestras sigue fuera de tolerancia, la toma de muestras será BLOQUEADA automáticamente. Advertencia 2 de 2.`,
                            confirmButtonColor: "#dc2626",
                            confirmButtonText: "Entendido",
                            customClass: { container: "!z-[999999]" },
                        });
                        saveSamplesToDatabase(updated, false, false);
                    } else if (nextStreak >= 3) {
                        setIsEndOfSamplingBlock(false);
                        setIsBlocked(true);
                        setBlockReason(`3 controles consecutivos fuera de tolerancia (${diffText})`);
                        saveSamplesToDatabase(updated, false, true);
                        Swal.fire({
                            icon: "error",
                            title: "Atención",
                            text: `ALERTA: Se han detectado 3 controles consecutivos fuera de tolerancia a las ${updated.length} muestras (${diffText}).${netInfo}${avgInfo}. La toma de muestras ha sido BLOQUEADA. Se requiere usuario y contraseña del Jefe de Almacén para desbloquear la captura.`,
                            confirmButtonColor: "#dc2626",
                            confirmButtonText: "Entendido",
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            customClass: { container: "!z-[999999]" },
                        }).then(() => {
                            setIsUnlockModalOpen(true);
                        });
                    }
                }
            } else {
                saveSamplesToDatabase(updated, false, false);
            }
        }
        setSelectedEnsacadora(env);
        setPendingWeight(null);
        setSampleInput("");
        setIsSelectorOpen(false);
        setTimeout(() => {
            sampleInputRef.current?.focus();
        }, 100);
    };

    const handleCancelSelector = () => {
        setIsSelectorOpen(false);
        setPendingWeight(null);
        setTimeout(() => {
            sampleInputRef.current?.focus();
        }, 100);
    };

    // Samples by Ensacadora
    const samplesEnv1 = useMemo(() => samples.filter((s) => (s.ensacadora || s.envasadora) === 1), [samples]);
    const samplesEnv2 = useMemo(() => samples.filter((s) => (s.ensacadora || s.envasadora) === 2), [samples]);

    // Calculate averages and standard deviations
    const statsEnv1 = useMemo(() => {
        if (samplesEnv1.length === 0) return { avg: null, std: null };
        const sum = samplesEnv1.reduce((acc, s) => acc + s.weight, 0);
        const avg = sum / samplesEnv1.length;
        if (samplesEnv1.length < 2) return { avg, std: NaN };
        const variance =
            samplesEnv1.reduce((acc, s) => acc + Math.pow(s.weight - avg, 2), 0) /
            (samplesEnv1.length - 1);
        return { avg, std: Math.sqrt(variance) };
    }, [samplesEnv1]);

    const statsEnv2 = useMemo(() => {
        if (samplesEnv2.length === 0) return { avg: null, std: null };
        const sum = samplesEnv2.reduce((acc, s) => acc + s.weight, 0);
        const avg = sum / samplesEnv2.length;
        if (samplesEnv2.length < 2) return { avg, std: NaN };
        const variance =
            samplesEnv2.reduce((acc, s) => acc + Math.pow(s.weight - avg, 2), 0) /
            (samplesEnv2.length - 1);
        return { avg, std: Math.sqrt(variance) };
    }, [samplesEnv2]);

    // Overall Average (Peso Estimado Actual por Saco)
    const overallAvg = useMemo(() => {
        if (samples.length === 0) return null;
        const sum = samples.reduce((acc, s) => acc + s.weight, 0);
        return sum / samples.length;
    }, [samples]);

    // Peso Estimado Neto = Peso Estimado Saco (overallAvg) x Cantidad de Sacos (totalSacks)
    const estimatedNetWeightKg = useMemo(() => {
        if (overallAvg === null || totalSacks <= 0) return null;
        return overallAvg * totalSacks;
    }, [overallAvg, totalSacks]);

    const estimatedNetWeightTons = useMemo(() => {
        if (estimatedNetWeightKg === null) return null;
        return estimatedNetWeightKg / 1000;
    }, [estimatedNetWeightKg]);

    // Compliance status basado estrictamente en el PESO ESTIMADO NETO contra las tolerancias oficiales
    const isWithinTolerance = useMemo(() => {
        if (estimatedNetWeightTons === null) return null;
        const rounded = Math.round(estimatedNetWeightTons * 1000) / 1000;
        return rounded >= limits.totalInferiorTons && rounded <= limits.totalSuperiorTons;
    }, [estimatedNetWeightTons, limits]);

    // Semáforo dinámico de 4 estados para control visual en tiempo real:
    // - 'empty': Sin datos
    // - 'below': 🟡 AMARILLO (Bajando / Por debajo del límite inferior)
    // - 'success': 🟢 VERDE (Nivelando / En tolerancia)
    // - 'above': 🟠 NARANJA (Superando / Por encima del límite superior)
    // - 'danger': 🔴 ROJO (Bloqueado por 3 advertencias consecutivas)
    const netCardStatus = useMemo<'empty' | 'success' | 'below' | 'above' | 'danger'>(() => {
        if (estimatedNetWeightTons === null) return 'empty';
        if (isBlocked || consecutiveOutCount >= 3) return 'danger'; // ROJO: Bloqueado
        const rounded = Math.round(estimatedNetWeightTons * 1000) / 1000;
        if (rounded < limits.totalInferiorTons) return 'below'; // AMARILLO: Bajando
        if (rounded > limits.totalSuperiorTons) return 'above'; // NARANJA: Superando
        return 'success'; // VERDE: Nivelando / En tolerancia
    }, [estimatedNetWeightTons, isBlocked, consecutiveOutCount, limits]);

    const currentAssistantName = detailedOrder?.loading_assistant || order?.loading_assistant || "Auxiliar no especificado";

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unlockUser.trim() || !unlockPassword) {
            setUnlockError(isFinalSamplingBlock ? "Por favor ingrese el usuario/correo y contraseña del Jefe de Almacén o Supervisor." : "Por favor ingrese el usuario/correo y contraseña del Jefe de Almacén.");
            return;
        }
        setIsSubmittingUnlock(true);
        setUnlockError("");

        try {
            const targetId = order?.id || order?.shipment_order_id || order?.folio || order?.order_number;
            const res = await axios.post(
                route("documentation.shipment-orders.unlock-sampling", targetId),
                {
                    username_or_email: unlockUser.trim(),
                    password: unlockPassword,
                    assistant_name: currentAssistantName,
                    notes: unlockNotes.trim() || ((samples.length >= 36 || isWithinTolerance === false) ? "El Jefe de Almacen o Supervisor Autoriza Peso Fuera de Rango" : ""),
                }
            );

            if (res.data?.success) {
                setIsBlocked(false);
                setIsAuthorizedAfterLock(true);
                setIsEndOfSamplingBlock(false);
                setConsecutiveOutCount(0);
                setIsSaved(false);
                setSavedAt(null);
                setIsUnlockModalOpen(false);
                setUnlockUser("");
                setUnlockPassword("");
                setUnlockNotes("");
                const newCount = res.data.unlock_count || (unlockCount + 1);
                setUnlockCount(newCount);

                // Limpiar cualquier estado previo guardado o bloqueado en localStorage
                const id = order?.id || order?.shipment_order_id || order?.folio || order?.order_number;
                const candidateKeys = [
                    getStorageKey(),
                    id ? `ensacadora_sampling_order_${id}` : null,
                    id ? `ensacadora_sampling_${id}` : null,
                    id ? `envasadora_sampling_order_${id}` : null,
                    id ? `envasadora_sampling_${id}` : null,
                ].filter(Boolean) as string[];
                candidateKeys.forEach((k) => {
                    try {
                        const raw = localStorage.getItem(k);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            parsed.isSaved = false;
                            parsed.isBlocked = false;
                            parsed.savedAt = null;
                            localStorage.setItem(k, JSON.stringify(parsed));
                        }
                    } catch (e) {}
                });

                Swal.fire({
                    icon: "success",
                    title: "¡Muestreo Desbloqueado!",
                    html: `<div class="text-left space-y-2 text-sm text-slate-700">
                        <p>La captura de muestras ha sido autorizada y desbloqueada por <b>${res.data.incident?.unlocked_by_name || "el Jefe de Almacén"}</b>.</p>
                        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold">
                            Desbloqueo registrado como <b>Desbloqueo #${newCount}</b> en la tabla de Incidencias.
                        </div>
                        <p class="text-[11px] text-slate-500">
                            Aviso: Si las capturas posteriores vuelven a situarse fuera de tolerancia, las alertas y el bloqueo seguirán activos normalmente.
                        </p>
                    </div>`,
                    confirmButtonColor: "#16a34a",
                    confirmButtonText: "Continuar Muestreo",
                });

                if (onUnlockSuccess) {
                    onUnlockSuccess(res.data.incident);
                }
                setTimeout(() => {
                    sampleInputRef.current?.focus();
                }, 200);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al validar credenciales del Jefe de Almacén.";
            setUnlockError(msg);
        } finally {
            setIsSubmittingUnlock(false);
        }
    };

    const handleAddSample = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isLocked) return;
        if (isBlocked) {
            Swal.fire({
                icon: "error",
                title: "Atención",
                text: "La toma de muestras se encuentra bloqueada por registrar pesos fuera de tolerancia. Ingrese el usuario y contraseña del Jefe de Almacén para autorizar el desbloqueo.",
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Entendido",
                customClass: { container: "!z-[999999]" },
            }).then(() => {
                setIsUnlockModalOpen(true);
            });
            return;
        }
        if (samples.length >= 80) {
            Swal.fire({
                icon: "info",
                title: "80 muestras completadas",
                text: "Ya se ha capturado el total de 80 muestras requeridas. Haga clic en 'Guardar Muestreo' para finalizar y bloquear el registro.",
                confirmButtonColor: "#16a34a",
            });
            return;
        }
        const val = parseFloat(sampleInput);
        if (isNaN(val) || val <= 0) {
            setInputError("Por favor capture un peso válido en kg.");
            return;
        }

        setInputError("");
        setPendingWeight(val);
        setIsSelectorOpen(true);
    };

    const handleStartEdit = (sample: SampleRecord) => {
        if (isLocked) return;
        setEditingId(sample.id);
        setEditingValue(sample.weight.toString());
    };

    const handleSaveEdit = (id: number) => {
        if (isLocked) return;
        const val = parseFloat(editingValue);
        if (isNaN(val) || val <= 0) return;
        const targetSample = samples.find((s) => s.id === id);
        const updated = samples.map((s) => (s.id === id ? { ...s, weight: val } : s));
        setSamples(updated);

        const newOverallAvg = updated.reduce((acc, s) => acc + (Number(s.weight) || 0), 0) / updated.length;
        const newEstimatedNetTons = totalSacks > 0 ? (newOverallAvg * totalSacks) / 1000 : null;

        const roundedNetTons = newEstimatedNetTons !== null ? Math.round(newEstimatedNetTons * 1000) / 1000 : null;

        const isTargetFinal = (updated.length === 80 || (targetSample && targetSample.num === 40));
        const isBelow = roundedNetTons !== null
            ? roundedNetTons < limits.totalInferiorTons
            : false;
        const isAbove = roundedNetTons !== null
            ? roundedNetTons > limits.totalSuperiorTons
            : false;
        const isOut = isBelow || isAbove;

        if (isTargetFinal && isOut) {
            setIsBlocked(true);
            const diffDetail = isBelow
                ? `queda por debajo del mínimo oficial (${limits.totalInferiorTons.toFixed(3)} ton)`
                : `supera el máximo oficial (${limits.totalSuperiorTons.toFixed(3)} ton)`;
            setBlockReason(`Edición en muestra #${targetSample.num}: Peso neto proyectado (${newEstimatedNetTons?.toFixed(3)} ton) fuera de límites (${limits.totalInferiorTons.toFixed(3)} a ${limits.totalSuperiorTons.toFixed(3)} ton)`);
            saveSamplesToDatabase(updated, false, true);

            Swal.fire({
                icon: "error",
                title: "Validación de Cierre - Captura Bloqueada",
                text: "Se requiere usuario y contraseña del Jefe de Almacén para autorizar y desbloquear la captura.",
                confirmButtonColor: "#dc2626",
                confirmButtonText: "Entendido",
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: { container: "!z-[999999]" },
            }).then(() => {
                setIsUnlockModalOpen(true);
            });
        } else {
            saveSamplesToDatabase(updated, isSaved && updated.length === 80, isBlocked);
        }

        setEditingId(null);
        setEditingValue("");
    };

    const handleDeleteSample = (id: number) => {
        if (isLocked) return;
        const filtered = samples.filter((s) => s.id !== id);
        let env1Count = 0;
        let env2Count = 0;
        const updated = filtered.map((s) => {
            if ((s.ensacadora || s.envasadora) === 1) {
                env1Count++;
                return { ...s, num: env1Count };
            } else {
                env2Count++;
                return { ...s, num: env2Count };
            }
        });
        setSamples(updated);
        saveSamplesToDatabase(updated, false);
    };

    // Chart dimensions
    const chartTotalPoints = totalSamplesCount || 80;
    const chartWidth = 920;
    const chartHeight = 330;
    const paddingLeft = 60;
    const paddingRight = 35;
    const paddingTop = 30;
    const paddingBottom = 40;

    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const yMin = useMemo(() => {
        let min = limits.inferior;
        if (samples.length > 0) {
            const minSample = Math.min(...samples.map((s) => s.weight));
            min = Math.min(min, minSample);
        }
        return min - (limits.superior - limits.inferior) * 0.15;
    }, [limits, samples]);

    const yMax = useMemo(() => {
        let max = limits.superior;
        if (samples.length > 0) {
            const maxSample = Math.max(...samples.map((s) => s.weight));
            max = Math.max(max, maxSample);
        }
        return max + (limits.superior - limits.inferior) * 0.15;
    }, [limits, samples]);

    const getY = (val: number) => {
        const clamped = Math.max(yMin, Math.min(yMax, val));
        const ratio = (clamped - yMin) / (yMax - yMin);
        return paddingTop + plotHeight - ratio * plotHeight;
    };

    const getX = (index: number) => {
        return paddingLeft + (index / (chartTotalPoints - 1 || 1)) * plotWidth;
    };

    const yTicks = useMemo(() => {
        const ticks = [];
        const step = (yMax - yMin) / 6;
        for (let i = 0; i <= 6; i++) {
            ticks.push(yMin + i * step);
        }
        return ticks;
    }, [yMin, yMax]);

    // Smooth Bezier Curve Path for Sample Points
    const curvePath = useMemo(() => {
        if (samples.length === 0) return "";
        const points = samples.map((s, idx) => ({
            x: getX(idx),
            y: getY(s.weight),
        }));

        if (points.length === 1) {
            return `M ${points[0].x} ${points[0].y}`;
        }
        if (points.length === 2) {
            return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        }

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[i];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;

            const tension = 0.25;

            const cp1x = p1.x + (p2.x - p0.x) * tension;
            const cp1y = p1.y + (p2.y - p0.y) * tension;

            const cp2x = p2.x - (p3.x - p1.x) * tension;
            const cp2y = p2.y - (p3.y - p1.y) * tension;

            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
        }

        return d;
    }, [samples, yMin, yMax]);

    return (
        <>
            <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {}}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-5xl border border-gray-100 p-5 sm:p-7">
                                {/* Header Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-md shadow-emerald-600/20">
                                            <Scale className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Dialog.Title className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                                                    Control de Muestreo en Ensacadora
                                                </Dialog.Title>
                                                {order?.order_number && (
                                                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                        Orden #{order.order_number}
                                                    </span>
                                                )}
                                                {isLocked ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                        Guardado Finalizado (80/80 muestras)
                                                    </span>
                                                ) : samples.length > 0 ? (
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        title="Su avance se encuentra autoguardado en tiempo real"
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                                        Autoguardado activo ({samples.length}/80 muestras)
                                                    </span>
                                                ) : (
                                                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">
                                                        80 muestras requeridas (40 por ENS)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                                <span>
                                                    Monitoreo estadístico de peso por saco • Tolva 1 • Presentación {targetBaseWeight} kg
                                                </span>
                                                {totalSacks > 0 && (
                                                    <strong className="text-indigo-700 font-bold">
                                                        • {totalSacks.toLocaleString("es-MX")} sacos
                                                    </strong>
                                                )}
                                                {lastAutosavedAt && !isLocked && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-mono font-medium bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                                                        <Cloud className="w-3 h-3 text-indigo-500" />
                                                        Último autoguardado: {lastAutosavedAt}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowToleranceGuideModal(true)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold transition shadow-xs cursor-pointer"
                                                    title="Ver Guía Oficial para Tolerancia de Pesos de Sacos (25, 50 y 1000 kg)"
                                                >
                                                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                                                    <span>Guía de Tolerancia</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                                        {isBlocked && (
                                            <button
                                                type="button"
                                                onClick={() => setIsUnlockModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/30 transition transform active:scale-95 animate-pulse cursor-pointer"
                                                title="Desbloquear captura de muestras con usuario del Jefe de Almacén"
                                            >
                                                <KeyRound className="w-4 h-4" />
                                                <span>Desbloquear con Jefe</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => (onOpenPrintDocuments ? onOpenPrintDocuments(samples) : window.print())}
                                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition shadow-sm cursor-pointer"
                                            title="Imprimir"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition shadow-sm cursor-pointer"
                                            title="Cerrar modal"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* KPI Metrics Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
                                    {/* ENS-1 Metric Card */}
                                    <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between text-indigo-700 mb-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                AVG ENS-1
                                            </span>
                                            <span className="text-[10px] font-semibold bg-indigo-100/80 px-2 py-0.5 rounded-md text-indigo-800">
                                                {samplesEnv1.length} / 40 mstr.
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 font-mono">
                                            {statsEnv1.avg !== null ? `${statsEnv1.avg.toFixed(3)} kg` : "--"}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono mt-1">
                                            σ: {statsEnv1.std !== null ? (isNaN(statsEnv1.std) ? "0.000" : statsEnv1.std.toFixed(3)) : "--"}
                                        </div>
                                    </div>

                                    {/* ENS-2 Metric Card */}
                                    <div className="bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-100 rounded-2xl p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between text-emerald-700 mb-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                AVG ENS-2
                                            </span>
                                            <span className="text-[10px] font-semibold bg-emerald-100/80 px-2 py-0.5 rounded-md text-emerald-800">
                                                {samplesEnv2.length} / 40 mstr.
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 font-mono">
                                            {statsEnv2.avg !== null ? `${statsEnv2.avg.toFixed(3)} kg` : "--"}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono mt-1">
                                            σ: {statsEnv2.std !== null ? (isNaN(statsEnv2.std) ? "0.000" : statsEnv2.std.toFixed(3)) : "--"}
                                        </div>
                                    </div>

                                    {/* Muestreo Progress */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200/90 rounded-2xl p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between text-gray-600 mb-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                Progreso Total
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-700">
                                                {samples.length} / {chartTotalPoints}
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900">
                                            {Math.round((samples.length / chartTotalPoints) * 100)}%
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${Math.min(100, (samples.length / chartTotalPoints) * 100)}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner de Bloqueo por 3 Alertas */}
                                {isBlocked && (
                                            <div className="mt-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-400 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-rose-950 animate-fade-in">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 shrink-0">
                                                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                                                            🚫 TOMA DE MUESTRAS BLOQUEADA
                                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-950 font-bold border border-rose-300">
                                                                {blockReason.includes("Últimas 5") ? "Validación de Cierre" : "Fuera de Tolerancia"}
                                                            </span>
                                                        </h4>
                                                        <p className="text-xs text-rose-800 mt-0.5">
                                                            {blockReason ? `${blockReason}.` : `Toma de muestras fuera de tolerancia (${limits.totalInferiorTons.toFixed(3)} - ${limits.totalSuperiorTons.toFixed(3)} ton).`} Se requiere autorización y contraseña del <b>Jefe de Almacén</b> para desbloquear la captura.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsUnlockModalOpen(true)}
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/30 transition transform active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                    <span>Desbloquear con Jefe</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Alerta Preventiva de 1 o 2 advertencias consecutivas */}
                                        {!isBlocked && consecutiveOutCount > 0 && (
                                            <div className="mt-4 bg-amber-50 border border-amber-300 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2 text-amber-950 animate-fade-in">
                                                <div className="flex items-center gap-2.5 text-xs font-bold">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>
                                                        ⚠️ Advertencia de Tolerancia: Lleva <b>{consecutiveOutCount} de 2 alertas</b> consecutivas fuera de rango. A la 3ª alerta se bloqueará automáticamente la captura.
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
                                                    Límites: {limits.inferior.toFixed(3)} a {limits.superior.toFixed(3)} kg
                                                </span>
                                            </div>
                                        )}

                                        <form
                                            onSubmit={handleAddSample}
                                            className={`mt-4 border rounded-2xl p-4 shadow-sm transition-all ${
                                                isBlocked
                                                    ? "bg-rose-50/40 border-rose-200"
                                                    : "bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-indigo-100/90"
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 whitespace-nowrap">
                                                    <Scale className="w-4 h-4 text-indigo-600" />
                                                    <span>Capturar muestra (#{samples.length + 1} de 80):</span>
                                                </div>

                                                <div className="relative flex-1">
                                                    <input
                                                        ref={sampleInputRef}
                                                        type="number"
                                                        step="0.001"
                                                        disabled={isBlocked || isLocked || samples.length >= 80}
                                                        value={sampleInput}
                                                        onChange={(e) => {
                                                            setSampleInput(e.target.value);
                                                            if (inputError) setInputError("");
                                                        }}
                                                        placeholder={
                                                            isBlocked
                                                                ? "Captura bloqueada. Requiere desbloqueo del Jefe de Almacén."
                                                                : isLocked || samples.length >= 80
                                                                ? "Muestreo completado (80/80 muestras)."
                                                                : `Ingrese peso del saco en kg (ej. ${limits.ideal.toFixed(2)})`
                                                        }
                                                        className={`w-full rounded-xl px-4 py-2.5 pr-14 text-sm font-bold font-mono transition shadow-sm ${
                                                            isBlocked || isLocked || samples.length >= 80
                                                                ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed placeholder:text-slate-400"
                                                                : inputError
                                                                ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                                : sampleInput
                                                                ? "border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                                                                : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                        }`}
                                                        autoFocus
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-xs font-bold text-gray-400 font-mono">kg</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isBlocked || isLocked || samples.length >= 80}
                                                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 ${
                                                        isBlocked
                                                            ? "bg-rose-400 cursor-not-allowed shadow-none"
                                                            : isLocked || samples.length >= 80
                                                            ? "bg-slate-400 cursor-not-allowed shadow-none"
                                                            : selectedEnsacadora === 1
                                                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer"
                                                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer"
                                                    }`}
                                                >
                                                    {isBlocked ? (
                                                        <>
                                                            <Lock className="w-4 h-4" />
                                                            <span>Bloqueado</span>
                                                        </>
                                                    ) : isLocked || samples.length >= 80 ? (
                                                        <>
                                                            <Check className="w-4 h-4 stroke-[3]" />
                                                            <span>80 Muestras Completadas</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="w-4 h-4 stroke-[3]" />
                                                            <span>Capturar Muestra</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            {inputError && (
                                                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-2">
                                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                                    {inputError}
                                                </div>
                                            )}
                                        </form>

                                {/* Tables Grid: ENS-1 and ENS-2 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* ENS-1 Table */}
                                    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                                        <div className="bg-gradient-to-r from-indigo-50 to-white px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                                Últimos Muestreos ENS-1
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-semibold text-indigo-600 font-mono">
                                                    {samplesEnv1.length} / 40 muestras
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto max-h-40 overflow-y-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-100">
                                                    <tr>
                                                        <th className="py-2 px-3 w-16 text-center">N°</th>
                                                        <th className="py-2 px-2.5 w-24 text-center">Hora</th>
                                                        <th className="py-2 px-3">Peso Registrado</th>
                                                        <th className="py-2 px-3 w-24 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {samplesEnv1.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="py-5 px-3 text-gray-400 italic text-center">
                                                                Sin muestras capturadas en ENS-1
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        samplesEnv1.map((sample, idx) => (
                                                            <tr key={sample.id} className="hover:bg-indigo-50/30 transition">
                                                                <td className="py-2 px-3 font-bold text-gray-600 text-center font-mono">
                                                                    #{idx + 1}
                                                                </td>
                                                                <td className="py-2 px-2.5 text-center font-mono text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                                                                    {sample.time || (sample.captured_at ? new Date(sample.captured_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "--:--")}
                                                                </td>
                                                                <td className="py-2 px-3 font-mono">
                                                                    {editingId === sample.id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="0.001"
                                                                            value={editingValue}
                                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                                            className="w-28 py-0.5 px-2 border border-indigo-400 rounded-lg text-xs font-bold font-mono"
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <span className="font-extrabold text-gray-900">
                                                                            {sample.weight.toFixed(3)} kg
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    {isLocked ? (
                                                                        <span className="inline-flex items-center justify-center text-gray-400 font-bold text-xs" title="Muestreo guardado y bloqueado">
                                                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                                                        </span>
                                                                    ) : editingId === sample.id ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSaveEdit(sample.id)}
                                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                                            title="Guardar"
                                                                        >
                                                                            <Save className="w-4 h-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleStartEdit(sample)}
                                                                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                                                title="Editar"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteSample(sample.id)}
                                                                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                                                title="Eliminar"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* ENS-2 Table */}
                                    <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">
                                        <div className="bg-gradient-to-r from-emerald-50 to-white px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                                Últimos Muestreos ENS-2
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-semibold text-emerald-600 font-mono">
                                                    {samplesEnv2.length} / 40 muestras
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto max-h-40 overflow-y-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-100">
                                                    <tr>
                                                        <th className="py-2 px-3 w-16 text-center">N°</th>
                                                        <th className="py-2 px-2.5 w-24 text-center">Hora</th>
                                                        <th className="py-2 px-3">Peso Registrado</th>
                                                        <th className="py-2 px-3 w-24 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {samplesEnv2.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="py-5 px-3 text-gray-400 italic text-center">
                                                                Sin muestras capturadas en ENS-2
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        samplesEnv2.map((sample, idx) => (
                                                            <tr key={sample.id} className="hover:bg-emerald-50/30 transition">
                                                                <td className="py-2 px-3 font-bold text-gray-600 text-center font-mono">
                                                                    #{idx + 1}
                                                                </td>
                                                                <td className="py-2 px-2.5 text-center font-mono text-[11px] text-gray-600 font-semibold whitespace-nowrap">
                                                                    {sample.time || (sample.captured_at ? new Date(sample.captured_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "--:--")}
                                                                </td>
                                                                <td className="py-2 px-3 font-mono">
                                                                    {editingId === sample.id ? (
                                                                        <input
                                                                            type="number"
                                                                            step="0.001"
                                                                            value={editingValue}
                                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                                            className="w-28 py-0.5 px-2 border border-emerald-400 rounded-lg text-xs font-bold font-mono"
                                                                            autoFocus
                                                                        />
                                                                    ) : (
                                                                        <span className="font-extrabold text-gray-900">
                                                                            {sample.weight.toFixed(3)} kg
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-center">
                                                                    {isLocked ? (
                                                                        <span className="inline-flex items-center justify-center text-gray-400 font-bold text-xs" title="Muestreo guardado y bloqueado">
                                                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                                                        </span>
                                                                    ) : editingId === sample.id ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSaveEdit(sample.id)}
                                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                                            title="Guardar"
                                                                        >
                                                                            <Save className="w-4 h-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleStartEdit(sample)}
                                                                                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                                                title="Editar"
                                                                            >
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteSample(sample.id)}
                                                                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                                                title="Eliminar"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Tolerancias y Especificaciones */}
                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 shadow-xs">
                                        <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                                            Límite Inferior
                                        </div>
                                        <div className="text-sm font-black text-rose-950 font-mono mt-0.5">
                                            {limits.inferior.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 shadow-xs">
                                        <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                                            Límite de Control
                                        </div>
                                        <div className="text-sm font-black text-sky-950 font-mono mt-0.5">
                                            {limits.ideal.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs">
                                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                            Límite Superior
                                        </div>
                                        <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                            {limits.superior.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 shadow-xs">
                                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                            Peso Estimado Saco
                                        </div>
                                        <div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
                                            {overallAvg !== null ? `${overallAvg.toFixed(3)} kg` : "---"}
                                        </div>
                                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                            Promedio actual
                                        </div>
                                    </div>
                                    <div className={`border-2 rounded-xl p-2.5 col-span-2 sm:col-span-1 shadow-sm transition-all duration-300 ${
                                        netCardStatus === "danger"
                                            ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/50 shadow-md shadow-rose-200/50 animate-pulse"
                                            : netCardStatus === "below"
                                            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/50 shadow-xs shadow-amber-100"
                                            : netCardStatus === "above"
                                            ? "bg-orange-50 border-orange-500 ring-2 ring-orange-400/50 shadow-xs shadow-orange-100"
                                            : netCardStatus === "success"
                                            ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xs shadow-emerald-100"
                                            : "bg-slate-50 border-slate-200"
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className={`text-[11px] font-bold uppercase tracking-wider ${
                                                netCardStatus === "danger"
                                                    ? "text-rose-950 font-black"
                                                    : netCardStatus === "below"
                                                    ? "text-amber-950 font-black"
                                                    : netCardStatus === "above"
                                                    ? "text-orange-950 font-black"
                                                    : netCardStatus === "success"
                                                    ? "text-emerald-900 font-bold"
                                                    : "text-slate-700 font-bold"
                                            }`}>
                                                Peso Estimado Neto
                                            </div>
                                            {totalSacks > 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    netCardStatus === "danger"
                                                        ? "bg-rose-200 text-rose-950 font-black"
                                                        : netCardStatus === "below"
                                                        ? "bg-amber-200 text-amber-950 font-black"
                                                        : netCardStatus === "above"
                                                        ? "bg-orange-200 text-orange-950 font-black"
                                                        : netCardStatus === "success"
                                                        ? "bg-emerald-200 text-emerald-950 font-black"
                                                        : "bg-slate-200 text-slate-800"
                                                }`}>
                                                    {totalSacks.toLocaleString("es-MX")} sacos
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className={`text-sm font-black font-mono mt-0.5 ${
                                                netCardStatus === "danger"
                                                    ? "text-rose-700 animate-pulse font-black"
                                                    : netCardStatus === "below"
                                                    ? "text-amber-950 font-black"
                                                    : netCardStatus === "above"
                                                    ? "text-orange-950 font-black"
                                                    : netCardStatus === "success"
                                                    ? "text-emerald-950 font-black"
                                                    : "text-slate-700 font-black"
                                            }`}
                                            title={
                                                estimatedNetWeightTons !== null
                                                    ? `${overallAvg?.toFixed(3)} kg × ${totalSacks.toLocaleString("es-MX")} sacos`
                                                    : undefined
                                            }
                                        >
                                            {estimatedNetWeightTons !== null
                                                ? `${estimatedNetWeightTons.toFixed(3)} ton`
                                                : "---"}
                                        </div>
                                        {estimatedNetWeightTons !== null && (
                                            <div className={`text-[10px] font-bold mt-0.5 ${
                                                netCardStatus === "danger"
                                                    ? "text-rose-700 font-black"
                                                    : netCardStatus === "below"
                                                    ? "text-amber-900 font-extrabold"
                                                    : netCardStatus === "above"
                                                    ? "text-orange-900 font-extrabold"
                                                    : "text-emerald-700 font-bold"
                                            }`}>
                                                {netCardStatus === "danger"
                                                    ? "🚫 Bloqueado: 3 alertas fuera de tolerancia"
                                                    : netCardStatus === "below"
                                                    ? `⬇️ Bajando (Inferior al límite • ${consecutiveOutCount > 0 ? `Alerta ${consecutiveOutCount} de 2 • ` : ""}Mín: ${limits.totalInferiorTons.toFixed(3)} ton)`
                                                    : netCardStatus === "above"
                                                    ? `⬆️ Superando el límite (${consecutiveOutCount > 0 ? `Alerta ${consecutiveOutCount} de 2 • ` : ""}Máx: ${limits.totalSuperiorTons.toFixed(3)} ton)`
                                                    : `✓ Nivelado en tolerancia (${limits.totalInferiorTons.toFixed(3)} a ${limits.totalSuperiorTons.toFixed(3)} ton)`}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Interactive SVG Control Chart */}
                                <div className="mt-5 rounded-2xl border border-gray-200/90 p-4 md:p-5 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
                                    {/* Chart Header & Legend */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                                            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                                                Gráfico de Control Estadístico de Pesos
                                            </span>
                                        </div>

                                        {/* Legend Pills */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-1.5 bg-slate-900 rounded-full inline-block"></span>
                                                <span className="text-gray-700">Lím. Superior</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-1.5 bg-sky-400 rounded-full inline-block"></span>
                                                <span className="text-gray-700">Lím. de Control</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-1.5 bg-rose-600 rounded-full inline-block"></span>
                                                <span className="text-gray-700">Lím. Inferior</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-rose-600 border-2 border-emerald-700 inline-block shadow-sm"></span>
                                                <span className="text-emerald-900 font-extrabold">Curvatura Muestras</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SVG Chart Container */}
                                    <div className="w-full overflow-x-auto">
                                        <svg
                                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                            className="w-full h-auto min-w-[720px] select-none"
                                        >
                                            <defs>
                                                <linearGradient id="chartBgGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.8" />
                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
                                                </linearGradient>
                                                <filter id="curveShadow" x="-10%" y="-10%" width="130%" height="130%">
                                                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#166534" floodOpacity="0.25" />
                                                </filter>
                                            </defs>

                                            {/* Background area */}
                                            <rect
                                                x={paddingLeft}
                                                y={paddingTop}
                                                width={plotWidth}
                                                height={plotHeight}
                                                fill="url(#chartBgGrad)"
                                                rx="8"
                                            />

                                            {/* Background Y Grid Lines & Labels */}
                                            {yTicks.map((tick, i) => {
                                                const y = getY(tick);
                                                return (
                                                    <g key={`ytick-${i}`}>
                                                        <line
                                                            x1={paddingLeft}
                                                            y1={y}
                                                            x2={chartWidth - paddingRight}
                                                            y2={y}
                                                            stroke="#e2e8f0"
                                                            strokeDasharray="4 4"
                                                            strokeWidth="1"
                                                        />
                                                        <text
                                                            x={paddingLeft - 10}
                                                            y={y + 4}
                                                            textAnchor="end"
                                                            className="text-[10px] font-mono fill-slate-500 font-semibold"
                                                        >
                                                            {tick.toFixed(2).replace(".", ",")}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* X-Axis Grid Lines & Sample Number Labels (1 to 40) */}
                                            {Array.from({ length: chartTotalPoints }, (_, i) => i + 1).map((num, i) => {
                                                const x = getX(i);
                                                return (
                                                    <g key={`xnum-${num}`}>
                                                        <line
                                                            x1={x}
                                                            y1={paddingTop}
                                                            x2={x}
                                                            y2={chartHeight - paddingBottom}
                                                            stroke="#f1f5f9"
                                                            strokeWidth="1"
                                                        />
                                                        <text
                                                            x={x}
                                                            y={chartHeight - paddingBottom + 16}
                                                            textAnchor="middle"
                                                            className="text-[9px] font-mono fill-slate-600 font-bold"
                                                        >
                                                            {num}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* Axis Base Lines */}
                                            <line
                                                x1={paddingLeft}
                                                y1={chartHeight - paddingBottom}
                                                x2={chartWidth - paddingRight}
                                                y2={chartHeight - paddingBottom}
                                                stroke="#94a3b8"
                                                strokeWidth="1.5"
                                            />
                                            <line
                                                x1={paddingLeft}
                                                y1={paddingTop}
                                                x2={paddingLeft}
                                                y2={chartHeight - paddingBottom}
                                                stroke="#94a3b8"
                                                strokeWidth="1.5"
                                            />

                                            {/* Límite Superior (Slate/Black line with dots) */}
                                            <line
                                                x1={paddingLeft}
                                                y1={getY(limits.superior)}
                                                x2={chartWidth - paddingRight}
                                                y2={getY(limits.superior)}
                                                stroke="#0f172a"
                                                strokeWidth="2"
                                            />
                                            {Array.from({ length: chartTotalPoints }, (_, i) => (
                                                <circle
                                                    key={`sup-${i}`}
                                                    cx={getX(i)}
                                                    cy={getY(limits.superior)}
                                                    r="2"
                                                    fill="#0f172a"
                                                />
                                            ))}

                                            {/* Límite Central (Cyan/Sky line with dots) */}
                                            <line
                                                x1={paddingLeft}
                                                y1={getY(limits.ideal)}
                                                x2={chartWidth - paddingRight}
                                                y2={getY(limits.ideal)}
                                                stroke="#38bdf8"
                                                strokeWidth="2"
                                            />
                                            {Array.from({ length: chartTotalPoints }, (_, i) => (
                                                <circle
                                                    key={`ideal-${i}`}
                                                    cx={getX(i)}
                                                    cy={getY(limits.ideal)}
                                                    r="2"
                                                    fill="#7dd3fc"
                                                    stroke="#38bdf8"
                                                    strokeWidth="0.5"
                                                />
                                            ))}

                                            {/* Límite Inferior (Rose/Ruby line with dots) */}
                                            <line
                                                x1={paddingLeft}
                                                y1={getY(limits.inferior)}
                                                x2={chartWidth - paddingRight}
                                                y2={getY(limits.inferior)}
                                                stroke="#be123c"
                                                strokeWidth="2"
                                            />
                                            {Array.from({ length: chartTotalPoints }, (_, i) => (
                                                <circle
                                                    key={`inf-${i}`}
                                                    cx={getX(i)}
                                                    cy={getY(limits.inferior)}
                                                    r="2"
                                                    fill="#be123c"
                                                />
                                            ))}

                                            {/* Smooth Spline Curvature Path (Curvatura) */}
                                            {curvePath && (
                                                <path
                                                    d={curvePath}
                                                    fill="none"
                                                    stroke="#16a34a"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    filter="url(#curveShadow)"
                                                    className="transition-all duration-300"
                                                />
                                            )}

                                            {/* Captured Data Points (Peso Estimado - Red dot with Green border) */}
                                            {samples.map((sample, idx) => {
                                                const x = getX(idx);
                                                const y = getY(sample.weight);
                                                return (
                                                    <g key={`datapoint-${sample.id}`} className="group cursor-pointer">
                                                        <circle
                                                            cx={x}
                                                            cy={y}
                                                            r="4.5"
                                                            fill="#dc2626"
                                                            stroke="#166534"
                                                            strokeWidth="2"
                                                            className="transition-all duration-200 group-hover:scale-150"
                                                        />
                                                        {/* Tooltip on hover */}
                                                        <title>
                                                            {`Muestra #${sample.num} (${(sample.ensacadora || sample.envasadora) === 1 ? "ENS-1" : "ENS-2"}): ${sample.weight.toFixed(3)} kg${sample.time ? ` · ${sample.time}` : ""}`}
                                                        </title>
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Info className="w-4 h-4 text-gray-400" />
                                        <span>
                                            Los datos se grafican en tiempo real con curva de interpolación continua.
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 ${
                                                samples.length >= 80
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-95 ring-2 ring-emerald-400/40 cursor-pointer"
                                                    : isLocked
                                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/30 active:scale-95 cursor-pointer"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-95 cursor-pointer"
                                            }`}
                                            title={
                                                samples.length >= 80
                                                    ? "Guardar y certificar las 80 muestras en historial"
                                                    : isLocked
                                                    ? "Muestreo finalizado y guardado - Salir"
                                                    : `Guardar avance (${samples.length}/80 muestras) y salir`
                                            }
                                        >
                                            {isLocked ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                    <span>Guardado (80/80) - Salir</span>
                                                </>
                                            ) : samples.length >= 80 ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                    <span>Guardar Muestreo Final (80/80)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 text-white" />
                                                    <span>Guardar Avance ({samples.length}/80) y Salir</span>
                                                </>
                                            )}
                                        </button>
                                        {onOpenPrintDocuments && (
                                            <button
                                                type="button"
                                                onClick={() => onOpenPrintDocuments(samples)}
                                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span>Ver / Imprimir Documentos PDF</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Ventana emergente: Preguntar en qué ensacadora se capturó la muestra */}
                                <Transition
                                    show={isSelectorOpen}
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div
                                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 transform transition-all animate-fade-in"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Header con gradiente */}
                                            <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-6 text-white relative">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelSelector();
                                                    }}
                                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                                                    title="Cancelar"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <div className="flex items-center gap-3.5 mb-2">
                                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-sm">
                                                        <Scale className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-white leading-tight">
                                                            ¿En qué ensacadora capturó la muestra?
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            {pendingWeight !== null && (
                                                                <span className="font-mono bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-lg font-black text-xs border border-emerald-400/40">
                                                                    Peso: {pendingWeight.toFixed(3)} kg
                                                                </span>
                                                            )}
                                                            <span className="text-indigo-200 text-xs font-medium">
                                                                {order?.folio || (order?.order_number ? `Orden #${order.order_number}` : "Control de Muestreo")}
                                                                {order?.product ? ` • ${order.product}` : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contenido de selección */}
                                            <div className="p-6">
                                                <p className="text-sm font-semibold text-gray-700 mb-5 text-center">
                                                    Seleccione la línea de ensacado correspondiente a este peso:
                                                </p>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {/* Botón ENS-1 */}
                                                    <button
                                                        type="button"
                                                        disabled={samplesEnv1.length >= 40}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectEnsacadora(1);
                                                        }}
                                                        className={`group p-5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between ${
                                                            samplesEnv1.length >= 40
                                                                ? "border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed"
                                                                : selectedEnsacadora === 1
                                                                ? "border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-100 ring-2 ring-indigo-500/30 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                                                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm">ENS-1</span>
                                                                    <span
                                                                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                                            samplesEnv1.length >= 40
                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                : "bg-indigo-100/70 text-indigo-700"
                                                                        }`}
                                                                    >
                                                                        {samplesEnv1.length} / 40 estibas {samplesEnv1.length >= 40 && "✓"}
                                                                    </span>
                                                                </div>
                                                                {selectedEnsacadora === 1 && samplesEnv1.length < 40 && (
                                                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                                                )}
                                                            </div>
                                                            <h4 className="text-base font-black text-gray-900 group-hover:text-indigo-900">
                                                                Ensacadora 01
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Línea de ensacado 1 • Tolva 1
                                                            </p>
                                                        </div>
                                                        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                                                            <span>
                                                                {samplesEnv1.length >= 40
                                                                    ? "Límite de 40 completado"
                                                                    : "Guardar en ENS-1"}
                                                            </span>
                                                            {samplesEnv1.length < 40 && (
                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Botón ENS-2 */}
                                                    <button
                                                        type="button"
                                                        disabled={samplesEnv2.length >= 40}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectEnsacadora(2);
                                                        }}
                                                        className={`group p-5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between ${
                                                            samplesEnv2.length >= 40
                                                                ? "border-gray-200 bg-gray-50/70 opacity-60 cursor-not-allowed"
                                                                : selectedEnsacadora === 2
                                                                ? "border-emerald-600 bg-emerald-50/80 shadow-md shadow-emerald-100 ring-2 ring-emerald-500/30 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                                                : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-sm">ENS-2</span>
                                                                    <span
                                                                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                                                            samplesEnv2.length >= 40
                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                : "bg-emerald-100/70 text-emerald-700"
                                                                        }`}
                                                                    >
                                                                        {samplesEnv2.length} / 40 estibas {samplesEnv2.length >= 40 && "✓"}
                                                                    </span>
                                                                </div>
                                                                {selectedEnsacadora === 2 && samplesEnv2.length < 40 && (
                                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                                )}
                                                            </div>
                                                            <h4 className="text-base font-black text-gray-900 group-hover:text-emerald-900">
                                                                Ensacadora 02
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Línea de ensacado 2 • Tolva 1
                                                            </p>
                                                        </div>
                                                        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                                                            <span>
                                                                {samplesEnv2.length >= 40
                                                                    ? "Límite de 40 completado"
                                                                    : "Guardar en ENS-2"}
                                                            </span>
                                                            {samplesEnv2.length < 40 && (
                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            )}
                                                        </div>
                                                    </button>
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">
                                                        Muestra #{samples.length + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelSelector();
                                                        }}
                                                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Transition>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>

        {/* Modal de Desbloqueo con Jefe de Almacén */}
        <Transition.Root show={isUnlockModalOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-[60]"
                onClose={() => {
                    // Si está bloqueado, no permitir salir haciendo clic en el fondo ni con Escape
                    if (!isBlocked && !isSubmittingUnlock) {
                        setIsUnlockModalOpen(false);
                    }
                }}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-md border border-rose-200 p-6">
                                <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${isFinalSamplingBlock ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"}`}>
                                            <ShieldAlert className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-base font-extrabold text-gray-900">
                                                {isFinalSamplingBlock ? "Autorización de Cierre de Muestreo" : "Desbloqueo de Muestreo"}
                                            </Dialog.Title>
                                            {!isFinalSamplingBlock && (
                                                <p className="text-xs text-rose-700 font-semibold">
                                                    Autorización de Jefe de Almacén
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!isBlocked && (
                                        <button
                                            type="button"
                                            disabled={isSubmittingUnlock}
                                            onClick={() => setIsUnlockModalOpen(false)}
                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                            title="Cerrar"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {isFinalSamplingBlock ? (
                                    <div className="mt-4 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center gap-3 shadow-xs">
                                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-amber-950 leading-snug">
                                                El Jefe de Almacen o Supervisor Autoriza Peso Fuera de Rango
                                            </p>
                                            <p className="text-[11px] text-amber-800/90 font-medium mt-0.5">
                                                Orden: <span className="font-mono font-bold text-gray-900">{order?.folio || order?.order_number || "N/A"}</span> • {samples.length}/80 muestras
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Orden de Embarque:</span>
                                                <span className="font-bold text-gray-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                                                    {order?.folio || order?.order_number || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Auxiliar que Tomaba Muestras:</span>
                                                <span className="font-bold text-indigo-900">
                                                    {currentAssistantName}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500 font-medium">Contador de Desbloqueos:</span>
                                                <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full text-[11px]">
                                                    Desbloqueo #{unlockCount + 1}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-gray-500 font-medium shrink-0">Motivo:</span>
                                                <span className="font-bold text-rose-700 text-right text-[11px]">
                                                    {blockReason || "Pesos fuera de tolerancia"}
                                                </span>
                                            </div>
                                        </div>

                                        {isBlocked && (
                                            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-bold flex items-center gap-2">
                                                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                                                <span>Pantalla Bloqueada: Ingrese usuario y contraseña del Jefe de Almacén para autorizar y continuar.</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {unlockError && (
                                    <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>{unlockError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleUnlockSubmit} className="mt-4 space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            {isFinalSamplingBlock
                                                ? "Usuario o Correo del Jefe de Almacén o Supervisor *"
                                                : "Usuario o Correo del Jefe de Almacén *"}
                                        </label>
                                        <input
                                            type="text"
                                            value={unlockUser}
                                            onChange={(e) => setUnlockUser(e.target.value)}
                                            placeholder={isFinalSamplingBlock ? "Ej. admin@proagro.com o nombre del jefe o supervisor" : "Ej. admin@proagro.com o nombre del jefe"}
                                            className="w-full rounded-xl border-gray-300 text-xs font-medium focus:border-rose-500 focus:ring-rose-500 px-3 py-2.5 shadow-xs"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            {isFinalSamplingBlock
                                                ? "Contraseña del Jefe de Almacén o Supervisor *"
                                                : "Contraseña del Jefe de Almacén *"}
                                        </label>
                                        <input
                                            type="password"
                                            value={unlockPassword}
                                            onChange={(e) => setUnlockPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-xl border-gray-300 text-xs font-medium focus:border-rose-500 focus:ring-rose-500 px-3 py-2.5 shadow-xs"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Observaciones o Medida Tomada (Opcional)
                                        </label>
                                        <textarea
                                            value={unlockNotes}
                                            onChange={(e) => setUnlockNotes(e.target.value)}
                                            placeholder={isFinalSamplingBlock ? "El Jefe de Almacen o Supervisor Autoriza Peso Fuera de Rango" : "Ej. Se re-calibró la báscula de ensacadora y se autoriza continuar..."}
                                            rows={2}
                                            className="w-full rounded-xl border-gray-300 text-xs font-medium focus:border-rose-500 focus:ring-rose-500 px-3 py-2 shadow-xs resize-none"
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        {!isBlocked && (
                                            <button
                                                type="button"
                                                disabled={isSubmittingUnlock}
                                                onClick={() => setIsUnlockModalOpen(false)}
                                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSubmittingUnlock}
                                            className={`${isBlocked ? "w-full" : ""} inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer`}
                                        >
                                            <KeyRound className="w-3.5 h-3.5" />
                                            <span>{isSubmittingUnlock ? "Validando..." : "Autorizar y Desbloquear"}</span>
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>

        {/* Modal Oficial de Guía de Tolerancia de Pesos */}
        <Transition.Root show={showToleranceGuideModal} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={() => setShowToleranceGuideModal(false)}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-indigo-100 p-6">
                                <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                                            <FileSpreadsheet className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-base font-extrabold text-gray-900 uppercase">
                                                Guía Oficial para Tolerancia de Pesos
                                            </Dialog.Title>
                                            <p className="text-xs text-indigo-700 font-semibold">
                                                Almacenes de Producto Terminado • Sacos de 25, 50 y 1000 KG
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowToleranceGuideModal(false)}
                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
                                    {/* Destacado: Parámetros de la Orden Actual */}
                                    <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl shadow-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                                                🎯 Parámetros Oficiales de Esta Orden ({limits.tons} TM • {limits.sacks.toLocaleString("es-MX")} sacos)
                                            </span>
                                            <span className="text-[10px] font-bold bg-indigo-200 text-indigo-950 px-2 py-0.5 rounded">
                                                Presentación {limits.productWeight} kg
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                            <div className="bg-white p-2 rounded-xl border border-rose-200">
                                                <div className="text-[10px] font-bold text-rose-800 uppercase">Límite Inferior</div>
                                                <div className="font-black text-rose-950 mt-0.5">{limits.inferior.toFixed(3)} kg/saco</div>
                                                <div className="text-[10px] text-rose-700 font-semibold">{limits.totalInferiorTons.toFixed(3)} ton</div>
                                            </div>
                                            <div className="bg-white p-2 rounded-xl border border-sky-200">
                                                <div className="text-[10px] font-bold text-sky-800 uppercase">Peso Ideal</div>
                                                <div className="font-black text-sky-950 mt-0.5">{limits.ideal.toFixed(3)} kg/saco</div>
                                                <div className="text-[10px] text-sky-700 font-semibold">{limits.totalIdealTons.toFixed(3)} ton</div>
                                            </div>
                                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-700 uppercase">Límite Superior</div>
                                                <div className="font-black text-slate-950 mt-0.5">{limits.superior.toFixed(3)} kg/saco</div>
                                                <div className="text-[10px] text-slate-600 font-semibold">{limits.totalSuperiorTons.toFixed(3)} ton</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 25 KG */}
                                    <div className="border border-sky-200 rounded-2xl overflow-hidden shadow-xs">
                                        <div className="bg-sky-700 text-white px-4 py-2 font-black text-xs uppercase flex justify-between items-center">
                                            <span>Tolerancia de Sacos de 25 KG (Tara saco: 0.08 kg • Total ideal: 25.08 kg)</span>
                                            <span className="text-[10px] bg-sky-800 px-2 py-0.5 rounded font-mono">25 kg</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px] text-left">
                                                <thead className="bg-sky-50 text-sky-950 font-bold border-b border-sky-100">
                                                    <tr>
                                                        <th className="p-2">Prog. TM</th>
                                                        <th className="p-2">Sacos</th>
                                                        <th className="p-2">Ideal TM</th>
                                                        <th className="p-2 text-rose-800">Lím. Inferior</th>
                                                        <th className="p-2 text-slate-800">Lím. Superior</th>
                                                        <th className="p-2 text-emerald-800">Redondeado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-sky-100 font-mono">
                                                    {[20, 24, 25, 28, 30, 32, 35, 36].map((tm) => {
                                                        const r = TOLERANCE_TABLE_25KG[tm];
                                                        const isCur = tm === limits.tons && limits.productWeight === 25;
                                                        return (
                                                            <tr key={tm} className={isCur ? "bg-amber-100/80 font-bold" : "hover:bg-sky-50/50"}>
                                                                <td className="p-2">{tm} TM {isCur && "⭐"}</td>
                                                                <td className="p-2">{(tm * 1000 / 25).toLocaleString("es-MX")}</td>
                                                                <td className="p-2">{(r.pesoIdealKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-rose-800">{(r.pesoLimiteInferiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-slate-800">{(r.pesoLimiteSuperiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-emerald-800">{(r.redondeadoInferiorKg / 1000).toFixed(3)} - {(r.redondeadoSuperiorKg / 1000).toFixed(3)} ton</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 50 KG */}
                                    <div className="border border-emerald-200 rounded-2xl overflow-hidden shadow-xs">
                                        <div className="bg-emerald-700 text-white px-4 py-2 font-black text-xs uppercase flex justify-between items-center">
                                            <span>Tolerancia de Sacos de 50 KG (Tara saco: 0.12 kg • Total ideal: 50.12 kg)</span>
                                            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded font-mono">50 kg</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px] text-left">
                                                <thead className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-100">
                                                    <tr>
                                                        <th className="p-2">Prog. TM</th>
                                                        <th className="p-2">Sacos</th>
                                                        <th className="p-2">Ideal TM</th>
                                                        <th className="p-2 text-rose-800">Lím. Inferior</th>
                                                        <th className="p-2 text-slate-800">Lím. Superior</th>
                                                        <th className="p-2 text-emerald-800">Redondeado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-100 font-mono">
                                                    {[20, 24, 25, 28, 30, 32, 35, 36].map((tm) => {
                                                        const r = TOLERANCE_TABLE_50KG[tm];
                                                        const isCur = tm === limits.tons && limits.productWeight === 50;
                                                        return (
                                                            <tr key={tm} className={isCur ? "bg-amber-100/80 font-bold" : "hover:bg-emerald-50/50"}>
                                                                <td className="p-2">{tm} TM {isCur && "⭐"}</td>
                                                                <td className="p-2">{(tm * 1000 / 50).toLocaleString("es-MX")}</td>
                                                                <td className="p-2">{(r.pesoIdealKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-rose-800">{(r.pesoLimiteInferiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-slate-800">{(r.pesoLimiteSuperiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-emerald-800">{(r.redondeadoInferiorKg / 1000).toFixed(3)} - {(r.redondeadoSuperiorKg / 1000).toFixed(3)} ton</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 1000 KG */}
                                    <div className="border border-purple-200 rounded-2xl overflow-hidden shadow-xs">
                                        <div className="bg-purple-700 text-white px-4 py-2 font-black text-xs uppercase flex justify-between items-center">
                                            <span>Tolerancia de Big Bag de 1000 KG (Tara: 2.50 kg • Total ideal: 1002.50 kg)</span>
                                            <span className="text-[10px] bg-purple-800 px-2 py-0.5 rounded font-mono">1000 kg</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px] text-left">
                                                <thead className="bg-purple-50 text-purple-950 font-bold border-b border-purple-100">
                                                    <tr>
                                                        <th className="p-2">Prog. TM</th>
                                                        <th className="p-2">Sacos</th>
                                                        <th className="p-2">Ideal TM</th>
                                                        <th className="p-2 text-rose-800">Lím. Inferior</th>
                                                        <th className="p-2 text-slate-800">Lím. Superior</th>
                                                        <th className="p-2 text-emerald-800">Redondeado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-purple-100 font-mono">
                                                    {[20, 24, 25, 28, 30, 32, 35, 36].map((tm) => {
                                                        const r = TOLERANCE_TABLE_1000KG[tm];
                                                        const isCur = tm === limits.tons && limits.productWeight === 1000;
                                                        return (
                                                            <tr key={tm} className={isCur ? "bg-amber-100/80 font-bold" : "hover:bg-purple-50/50"}>
                                                                <td className="p-2">{tm} TM {isCur && "⭐"}</td>
                                                                <td className="p-2">{tm}</td>
                                                                <td className="p-2">{(r.pesoIdealKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-rose-800">{(r.pesoLimiteInferiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-slate-800">{(r.pesoLimiteSuperiorKg / 1000).toFixed(3)} ton</td>
                                                                <td className="p-2 text-emerald-800">{(r.redondeadoInferiorKg / 1000).toFixed(3)} - {(r.redondeadoSuperiorKg / 1000).toFixed(3)} ton</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                                        <b>Nota Oficial:</b> Para la corrida se está considerando (+ -) 20 kg de la incertidumbre de la báscula camionera, así mismo se está aplicando un redondeo para mayor control en el pesaje.
                                    </div>
                                </div>

                                <div className="mt-5 text-right">
                                    <button
                                        type="button"
                                        onClick={() => setShowToleranceGuideModal(false)}
                                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition cursor-pointer"
                                    >
                                        Cerrar Guía
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    </>
    );
}
