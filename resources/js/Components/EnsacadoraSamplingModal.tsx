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
    Cloud,
} from "lucide-react";

interface SampleRecord {
    id: number;
    num: number;
    ensacadora: 1 | 2;
    envasadora?: 1 | 2;
    weight: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    stowageCount?: string | number;
    totalSamplesCount?: number;
    onOpenPrintDocuments?: (samples: SampleRecord[]) => void;
    onSave?: (samples: SampleRecord[]) => void;
}

export default function EnsacadoraSamplingModal({
    isOpen,
    onClose,
    order,
    stowageCount,
    totalSamplesCount = 40,
    onOpenPrintDocuments,
    onSave,
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

    // Determine target weight based on order presentation / product
    const targetBaseWeight = useMemo(() => {
        const o = detailedOrder || order;
        if (!o) return 25;
        const text = `${o.product || ""} ${o.product_text || ""} ${o.presentation || ""} ${o.sacks_count || ""}`.toUpperCase();
        if (text.includes("50KG") || text.includes("50 KG") || text.includes("50")) {
            return 50;
        }
        return 25;
    }, [detailedOrder, order]);

    // Tolerance limits based on base weight
    const limits = useMemo(() => {
        if (targetBaseWeight === 50) {
            return {
                superior: 50.10,
                ideal: 50.10,
                inferior: 50.00,
                minChart: 49.95,
                maxChart: 50.35,
            };
        }
        // 25kg standard
        return {
            superior: 25.25,
            ideal: 25.08,
            inferior: 24.90,
            minChart: 24.80,
            maxChart: 25.35,
        };
    }, [targetBaseWeight]);

    // Load samples or restore draft when modal opens
    useEffect(() => {
        if (isOpen && order) {
            isLoadedRef.current = false;
            
            let loadedSamples: SampleRecord[] = [];
            let loadedIsSaved = false;
            let loadedSavedAt: string | null = null;

            // 1. Check if order passed in props already has samples from shipment_process_histories
            if (Array.isArray(order.samples) && order.samples.length > 0) {
                loadedSamples = order.samples;
                loadedIsSaved = order.samples.length === 40 || order.sampling_status === "completed";
                loadedSavedAt = order.sampling_completed_at || null;
            }

            // 2. Check localStorage drafts
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
            ].filter(Boolean) as string[];

            try {
                let bestPayload: any = null;
                let maxCount = loadedSamples.length;

                for (const k of candidateKeys) {
                    try {
                        const raw = localStorage.getItem(k);
                        if (!raw) continue;
                        const parsed = JSON.parse(raw);
                        if (parsed && Array.isArray(parsed.samples)) {
                            const count = parsed.samples.length;
                            if (count > maxCount) {
                                maxCount = count;
                                bestPayload = parsed;
                            }
                        }
                    } catch (e) {}
                }

                if (bestPayload && Array.isArray(bestPayload.samples) && bestPayload.samples.length > loadedSamples.length) {
                    loadedSamples = bestPayload.samples;
                    loadedIsSaved = Boolean(bestPayload.isSaved) && loadedSamples.length === 40;
                    loadedSavedAt = loadedIsSaved ? (bestPayload.savedAt || null) : null;
                }
            } catch (e) {}

            if (loadedSamples.length > 0) {
                setSamples(loadedSamples);
                setIsSaved(loadedIsSaved);
                setSavedAt(loadedSavedAt);
            } else {
                setSamples([]);
                setIsSaved(false);
                setSavedAt(null);
                setLastAutosavedAt(null);
            }

            // 3. Fetch from API to ensure fresh database state from shipment_process_histories
            // 3. Fetch from API to ensure fresh database state from shipment_process_histories
            const currentOrderId = order.id || order.shipment_order_id || order.folio;
            if (currentOrderId) {
                try {
                    axios
                        .get(route("documentation.shipment-orders.get-sampling", currentOrderId))
                        .then((res) => {
                            if (res.data?.samples && Array.isArray(res.data.samples) && res.data.samples.length > 0) {
                                setSamples(res.data.samples);
                                if (res.data.samples.length >= 40 || res.data.sampling_completed_at) {
                                    setIsSaved(true);
                                    setSavedAt(res.data.sampling_completed_at || null);
                                }
                            } else if (loadedSamples.length > 0) {
                                // If database is empty or has fewer samples, immediately sync the loaded local samples to DB!
                                saveSamplesToDatabase(loadedSamples, loadedIsSaved);
                            }
                        })
                        .catch(() => {});
                } catch (e) {}
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
        isCompleted: boolean = false
    ) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        const targetId = order?.id || order?.shipment_order_id || order?.folio || order?.order_number;
        if (!targetId) return null;

        // Respaldo local
        try {
            persistSamplingData({
                orderId: targetId,
                samples: samplesToSave,
                isSaved: isCompleted,
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
        const effectiveIsSaved = isSaved && samples.length === 40;

        const currentOrderId = order.id || order.shipment_order_id || order.folio;
        if (currentOrderId && samples.length > 0) {
            const timer = setTimeout(() => {
                saveSamplesToDatabase(samples, effectiveIsSaved);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [samples, isSaved, savedAt, selectedEnsacadora, stowageCount, order?.id, order?.folio]);

    // Bloqueo estricto: solo está bloqueado si TIENE LAS 40 ESTIBAS y fue guardado
    const isLocked = isSaved && samples.length === 40;

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
        const now = new Date().toISOString();
        const isCompleted = samples.length === 40;

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
                html: "Se han guardado las <b>40 estibas</b> en la base de datos con éxito.<br/><br/>Muestreo finalizado y certificado.",
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
                text: `${samples.length} de 40 estibas guardadas en la base de datos. Se sincronizarán en cualquier navegador.`,
                showConfirmButton: false,
                timer: 3000,
            });
            onClose();
        }
    };

    const handleAttemptClose = () => {
        handleSave();
    };

    const handleSelectEnsacadora = (env: 1 | 2) => {
        if (isLocked) return;
        const weightToSave = pendingWeight !== null ? pendingWeight : parseFloat(sampleInput);
        if (weightToSave && !isNaN(weightToSave) && weightToSave > 0) {
            const countForThisEnv = samples.filter((s) => (s.ensacadora || s.envasadora) === env).length;
            if (countForThisEnv >= 20) {
                Swal.fire({
                    icon: "warning",
                    title: `ENS-${env} completada`,
                    text: `La ensacadora ENS-${env} ya cuenta con sus 20 estibas capturadas. Por favor seleccione la otra ensacadora.`,
                    confirmButtonColor: "#4f46e5",
                });
                return;
            }
            if (samples.length >= 40) {
                Swal.fire({
                    icon: "info",
                    title: "40 estibas completadas",
                    text: "Ya se completaron las 40 estibas requeridas en total. Por favor guarde el muestreo.",
                    confirmButtonColor: "#16a34a",
                });
                return;
            }
            const newRecord: SampleRecord = {
                id: Date.now() + Math.random(),
                num: countForThisEnv + 1,
                ensacadora: env,
                envasadora: env,
                weight: weightToSave,
            };
            const updated = [...samples, newRecord];
            setSamples(updated);
            // Guardar inmediatamente en base de datos en tiempo real
            saveSamplesToDatabase(updated, false);
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

        // 3. Determinar el peso del saco (25 kg o 50 kg)
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

        // 4. Calcular a partir de toneladas programadas (ej. 36.00 ton / 25 kg = 1440 sacos)
        const tons = parseFloat(String(o.programmed_tons || "0"));
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

    // Peso Estimado Neto = Peso Estimado Saco (overallAvg) x Cantidad de Sacos (totalSacks)
    const estimatedNetWeightKg = useMemo(() => {
        if (overallAvg === null || totalSacks <= 0) return null;
        return overallAvg * totalSacks;
    }, [overallAvg, totalSacks]);

    const estimatedNetWeightTons = useMemo(() => {
        if (estimatedNetWeightKg === null) return null;
        return estimatedNetWeightKg / 1000;
    }, [estimatedNetWeightKg]);

    // Compliance status
    const isWithinTolerance = useMemo(() => {
        if (overallAvg === null) return null;
        return overallAvg >= limits.inferior && overallAvg <= limits.superior;
    }, [overallAvg, limits]);

    const handleAddSample = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isLocked) return;
        if (samples.length >= 40) {
            Swal.fire({
                icon: "info",
                title: "40 estibas completadas",
                text: "Ya se ha capturado el total de 40 estibas requeridas. Haga clic en 'Guardar Muestreo' para finalizar y bloquear el registro.",
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
        const updated = samples.map((s) => (s.id === id ? { ...s, weight: val } : s));
        setSamples(updated);
        saveSamplesToDatabase(updated, isSaved && updated.length === 40);
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
    const chartTotalPoints = totalSamplesCount || 40;
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
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={() => {}}>
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
                                                        Guardado Finalizado (40/40 estibas)
                                                    </span>
                                                ) : samples.length > 0 ? (
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        title="Su avance se encuentra autoguardado en tiempo real"
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                                        Autoguardado activo ({samples.length}/40 estibas)
                                                    </span>
                                                ) : (
                                                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200">
                                                        40 estibas requeridas (20 por ENS)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                                <span>
                                                    Monitoreo estadístico de peso por saco • Tolva 1 • Presentación {targetBaseWeight} kg
                                                    {totalSacks > 0 && (
                                                        <strong className="text-indigo-700 ml-1.5 font-bold">
                                                            • {totalSacks.toLocaleString("es-MX")} sacos
                                                        </strong>
                                                    )}
                                                </span>
                                                {lastAutosavedAt && !isLocked && (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-mono font-medium bg-indigo-50/70 px-2 py-0.5 rounded-md border border-indigo-100">
                                                        <Cloud className="w-3 h-3 text-indigo-500" />
                                                        Último autoguardado: {lastAutosavedAt}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition transform active:scale-95 ${
                                                samples.length === 40
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20"
                                                    : isLocked
                                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                                            }`}
                                            title={
                                                samples.length === 40
                                                    ? "Guardar y certificar 40 estibas (Muestreo Completo)"
                                                    : isLocked
                                                    ? "Muestreo finalizado y guardado - Salir"
                                                    : `Guardar avance (${samples.length}/40 estibas) y salir`
                                            }
                                        >
                                            {isLocked || samples.length === 40 ? (
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            ) : (
                                                <Save className="w-4 h-4 text-white" />
                                            )}
                                            <span>
                                                {isLocked
                                                    ? "Guardado (40/40)"
                                                    : samples.length === 40
                                                    ? "Guardar (40/40)"
                                                    : `Guardar (${samples.length}/40)`}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => (onOpenPrintDocuments ? onOpenPrintDocuments(samples) : window.print())}
                                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition shadow-sm"
                                            title="Imprimir"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* KPI Metrics Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5">
                                    {/* ENS-1 Metric Card */}
                                    <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-2xl p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between text-indigo-700 mb-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                AVG ENS-1
                                            </span>
                                            <span className="text-[10px] font-semibold bg-indigo-100/80 px-2 py-0.5 rounded-md text-indigo-800">
                                                {samplesEnv1.length} / 20 mstr.
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
                                                {samplesEnv2.length} / 20 mstr.
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-gray-900 font-mono">
                                            {statsEnv2.avg !== null ? `${statsEnv2.avg.toFixed(3)} kg` : "--"}
                                        </div>
                                        <div className="text-[11px] text-gray-500 font-mono mt-1">
                                            σ: {statsEnv2.std !== null ? (isNaN(statsEnv2.std) ? "0.000" : statsEnv2.std.toFixed(3)) : "--"}
                                        </div>
                                    </div>

                                    {/* Overall Average */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-gray-200/90 rounded-2xl p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between text-gray-600 mb-1.5">
                                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                                Promedio General
                                            </span>
                                            {isWithinTolerance !== null && (
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                        isWithinTolerance
                                                            ? "bg-emerald-100 text-emerald-800"
                                                            : "bg-rose-100 text-rose-800"
                                                    }`}
                                                >
                                                    {isWithinTolerance ? "Conforme" : "Fuera Rango"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xl font-black text-gray-900 font-mono">
                                            {overallAvg !== null ? `${overallAvg.toFixed(3)} kg` : "--"}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-1">
                                            Control: <span className="font-semibold text-gray-700 font-mono">{limits.ideal.toFixed(3)} kg</span>
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

                                {/* Formulario de Captura de Muestra o Estado Bloqueado */}
                                {isLocked ? (
                                    <div className="mt-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                                    Muestreo Guardado y Bloqueado
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                                                        40 / 40 Estibas Completadas
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-emerald-700 mt-0.5">
                                                    Este registro se guardó exitosamente y se encuentra certificado en solo lectura.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {savedAt && (
                                                <div className="text-right text-[11px] font-mono text-emerald-700 bg-white/70 border border-emerald-200/80 rounded-xl px-3 py-1.5 shadow-xs">
                                                    <span className="font-semibold text-emerald-800">Guardado:</span>{" "}
                                                    {new Date(savedAt).toLocaleString("es-MX", {
                                                        dateStyle: "short",
                                                        timeStyle: "short",
                                                    })}
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    Swal.fire({
                                                        title: "¿Desbloquear para corregir?",
                                                        text: "Se habilitará nuevamente la edición y captura de estibas.",
                                                        icon: "question",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Sí, desbloquear",
                                                        cancelButtonText: "Cancelar",
                                                        confirmButtonColor: "#4f46e5",
                                                    }).then((res) => {
                                                        if (res.isConfirmed) {
                                                            setIsSaved(false);
                                                            saveSamplesToDatabase(samples, false);
                                                        }
                                                    });
                                                }}
                                                className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                                                title="Habilitar edición para corregir estibas"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                <span>Desbloquear</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : samples.length >= 40 ? (
                                    <div className="mt-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 animate-fade-in">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                                                    ¡Las 40 estibas han sido completadas!
                                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                                                        40 / 40 estibas (20 en ENS-1 y 20 en ENS-2)
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-emerald-700 mt-0.5">
                                                    Todas las estibas han sido registradas y autoguardadas. Haga clic en <b>"Guardar Muestreo"</b> para finalizar.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition transform active:scale-95 shrink-0 flex items-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Guardar Muestreo (40/40)
                                        </button>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleAddSample}
                                        className="mt-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-indigo-100/90 rounded-2xl p-4 shadow-sm"
                                    >
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 whitespace-nowrap">
                                                <Scale className="w-4 h-4 text-indigo-600" />
                                                <span>Capturar estiba (#{samples.length + 1} de 40):</span>
                                            </div>

                                            <div className="relative flex-1">
                                                <input
                                                    ref={sampleInputRef}
                                                    type="number"
                                                    step="0.001"
                                                    value={sampleInput}
                                                    onChange={(e) => {
                                                        setSampleInput(e.target.value);
                                                        if (inputError) setInputError("");
                                                    }}
                                                    placeholder={`Ingrese peso del saco en kg (ej. ${limits.ideal.toFixed(2)})`}
                                                    className={`w-full rounded-xl px-4 py-2.5 pr-14 text-sm font-bold font-mono transition shadow-sm ${
                                                        inputError
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
                                                className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 ${
                                                    selectedEnsacadora === 1
                                                        ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                                                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                                }`}
                                            >
                                                <Check className="w-4 h-4 stroke-[3]" />
                                                Capturar Muestra
                                            </button>
                                        </div>
                                        {inputError && (
                                            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {inputError}
                                            </div>
                                        )}
                                    </form>
                                )}

                                {/* Tables Grid: ENS-1 and ENS-2 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* ENS-1 Table */}
                                    <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                                        <div className="bg-gradient-to-r from-indigo-50 to-white px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                                Últimos Muestreos ENS-1
                                            </span>
                                            <span className="text-[11px] font-semibold text-indigo-600 font-mono">
                                                {samplesEnv1.length} / 20 estibas
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto max-h-40 overflow-y-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-100">
                                                    <tr>
                                                        <th className="py-2 px-3 w-16 text-center">N°</th>
                                                        <th className="py-2 px-3">Peso Registrado</th>
                                                        <th className="py-2 px-3 w-24 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {samplesEnv1.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="py-5 px-3 text-gray-400 italic text-center">
                                                                Sin muestras capturadas en ENS-1
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        samplesEnv1.map((sample, idx) => (
                                                            <tr key={sample.id} className="hover:bg-indigo-50/30 transition">
                                                                <td className="py-2 px-3 font-bold text-gray-600 text-center font-mono">
                                                                    #{idx + 1}
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
                                            <span className="text-[11px] font-semibold text-emerald-600 font-mono">
                                                {samplesEnv2.length} / 20 estibas
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto max-h-40 overflow-y-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-gray-700 font-bold border-b border-gray-100">
                                                    <tr>
                                                        <th className="py-2 px-3 w-16 text-center">N°</th>
                                                        <th className="py-2 px-3">Peso Registrado</th>
                                                        <th className="py-2 px-3 w-24 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {samplesEnv2.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="py-5 px-3 text-gray-400 italic text-center">
                                                                Sin muestras capturadas en ENS-2
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        samplesEnv2.map((sample, idx) => (
                                                            <tr key={sample.id} className="hover:bg-emerald-50/30 transition">
                                                                <td className="py-2 px-3 font-bold text-gray-600 text-center font-mono">
                                                                    #{idx + 1}
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
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                                        <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                                            Límite Inferior
                                        </div>
                                        <div className="text-sm font-black text-rose-950 font-mono mt-0.5">
                                            {limits.inferior.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                                        <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                                            Límite de Control
                                        </div>
                                        <div className="text-sm font-black text-sky-950 font-mono mt-0.5">
                                            {limits.ideal.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                            Límite Superior
                                        </div>
                                        <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                                            {limits.superior.toFixed(3)} kg
                                        </div>
                                    </div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                            Peso Estimado Saco
                                        </div>
                                        <div className="text-sm font-black text-emerald-950 font-mono mt-0.5">
                                            {overallAvg !== null ? `${overallAvg.toFixed(3)} kg` : "---"}
                                        </div>
                                        <div className="text-[10px] text-emerald-700 font-medium">
                                            Promedio actual
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-2.5 col-span-2 sm:col-span-1 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                                                Peso Estimado Neto
                                            </div>
                                            {totalSacks > 0 && (
                                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                                                    {totalSacks.toLocaleString("es-MX")} sacos
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="text-sm font-black text-indigo-950 font-mono mt-0.5"
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
                                                            {`Muestra #${sample.num} (${(sample.ensacadora || sample.envasadora) === 1 ? "ENS-1" : "ENS-2"}): ${sample.weight.toFixed(3)} kg`}
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
                                                samples.length === 40
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-95 ring-2 ring-emerald-400/40"
                                                    : isLocked
                                                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/30 active:scale-95"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 active:scale-95"
                                            }`}
                                            title={
                                                samples.length === 40
                                                    ? "Guardar y certificar las 40 estibas en historial"
                                                    : isLocked
                                                    ? "Muestreo finalizado y guardado - Salir"
                                                    : `Guardar avance (${samples.length}/40 estibas) y salir`
                                            }
                                        >
                                            {isLocked ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                    <span>Guardado (40/40) - Salir</span>
                                                </>
                                            ) : samples.length === 40 ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                    <span>Guardar Muestreo Final (40/40)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 text-white" />
                                                    <span>Guardar Avance ({samples.length}/40) y Salir</span>
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
                                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
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
                                                        disabled={samplesEnv1.length >= 20}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectEnsacadora(1);
                                                        }}
                                                        className={`group p-5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between ${
                                                            samplesEnv1.length >= 20
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
                                                                            samplesEnv1.length >= 20
                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                : "bg-indigo-100/70 text-indigo-700"
                                                                        }`}
                                                                    >
                                                                        {samplesEnv1.length} / 20 estibas {samplesEnv1.length >= 20 && "✓"}
                                                                    </span>
                                                                </div>
                                                                {selectedEnsacadora === 1 && samplesEnv1.length < 20 && (
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
                                                                {samplesEnv1.length >= 20
                                                                    ? "Límite de 20 completado"
                                                                    : "Guardar en ENS-1"}
                                                            </span>
                                                            {samplesEnv1.length < 20 && (
                                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Botón ENS-2 */}
                                                    <button
                                                        type="button"
                                                        disabled={samplesEnv2.length >= 20}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectEnsacadora(2);
                                                        }}
                                                        className={`group p-5 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col justify-between ${
                                                            samplesEnv2.length >= 20
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
                                                                            samplesEnv2.length >= 20
                                                                                ? "bg-emerald-100 text-emerald-800"
                                                                                : "bg-emerald-100/70 text-emerald-700"
                                                                        }`}
                                                                    >
                                                                        {samplesEnv2.length} / 20 estibas {samplesEnv2.length >= 20 && "✓"}
                                                                    </span>
                                                                </div>
                                                                {selectedEnsacadora === 2 && samplesEnv2.length < 20 && (
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
                                                                {samplesEnv2.length >= 20
                                                                    ? "Límite de 20 completado"
                                                                    : "Guardar en ENS-2"}
                                                            </span>
                                                            {samplesEnv2.length < 20 && (
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
    );
}
