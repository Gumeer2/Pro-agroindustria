import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    QrCode,
    Camera,
    Search,
    Warehouse,
    Settings,
    MoreHorizontal,
    Play,
    CheckCircle2,
    Clock,
    X,
    ArrowLeft,
    Check,
    Square,
    Edit3,
    Percent,
} from "lucide-react";
import QrScannerModal from "@/Components/QrScannerModal";

interface LlenaderasOrder {
    id: string | number;
    history_id?: number | null;
    shipment_order_id?: string | null;
    folio: string;
    warehouse: string;
    lot_id?: string | null;
    lot_folio: string;
    operator: string;
    squad_leader: string;
    product: string;
    presentation?: string | null;
    stowage_text: string;
    plates: string;
    started_at?: string | null;
    finished_at?: string | null;
    started_at_formatted?: string | null;
    finished_at_formatted?: string | null;
    status: "pending" | "loading" | "finished" | string;
    loading_percentage?: number;
}

interface Props {
    auth: any;
    initialHistory?: LlenaderasOrder[];
    selectedWarehouse?: number;
}

export default function Llenaderas({
    auth,
    initialHistory = [],
    selectedWarehouse = 1,
}: Props) {
    const [history, setHistory] = useState<LlenaderasOrder[]>(initialHistory);
    const [searchQr, setSearchQr] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");
    const [warehouseId, setWarehouseId] = useState<number>(selectedWarehouse || 1);
    const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
    const [activeActionMenu, setActiveActionMenu] = useState<string | number | null>(null);

    // Refresco periódico y tiempo actual para cronómetros
    const [nowTime, setNowTime] = useState<number>(Date.now());
    useEffect(() => {
        const timer = setInterval(() => setNowTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cerrar menú de acciones al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".action-menu-container")) {
                setActiveActionMenu(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Formatear fecha y hora
    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = String(d.getFullYear()).slice(-2);
            let hours = d.getHours();
            const minutes = String(d.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "p.m." : "a.m.";
            hours = hours % 12 || 12;
            return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
        } catch {
            return dateStr;
        }
    };

    // Calcular cronómetro
    const computeTimer = (startedAt?: string | null, finishedAt?: string | null) => {
        if (!startedAt) return "--:--";
        try {
            const start = new Date(startedAt).getTime();
            const end = finishedAt ? new Date(finishedAt).getTime() : nowTime;
            const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));
            const hrs = Math.floor(diffSeconds / 3600);
            const mins = Math.floor((diffSeconds % 3600) / 60);
            const secs = diffSeconds % 60;

            if (hrs > 0) {
                return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
            }
            return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        } catch {
            return "--:--";
        }
    };

    // Filtrar historial (Exclusivo para órdenes de Amoniaco)
    const filteredHistory = useMemo(() => {
        return history.filter((item) => {
            const isAmo = String(item.folio || "").toUpperCase().includes("-AMO-") ||
                          String(item.product || "").toUpperCase().includes("AMON") ||
                          String(item.product || "").toUpperCase().includes("NH3") ||
                          String(item.product || "").toUpperCase().includes("SERVICIO DE CARGA");
            if (!isAmo) {
                return false;
            }

            // Filtro de búsqueda por texto
            if (!filterQuery.trim()) return true;
            const q = filterQuery.toLowerCase();
            return (
                (item.folio || "").toLowerCase().includes(q) ||
                (item.operator || "").toLowerCase().includes(q) ||
                (item.squad_leader || "").toLowerCase().includes(q) ||
                (item.product || "").toLowerCase().includes(q) ||
                (item.plates || "").toLowerCase().includes(q) ||
                (item.lot_folio || "").toLowerCase().includes(q)
            );
        });
    }, [history, warehouseId, filterQuery]);

    // Recargar historial
    const reloadHistory = async () => {
        try {
            const res = await axios.get(route("production.llenaderas.history"));
            if (res.data?.success && Array.isArray(res.data.history)) {
                setHistory(res.data.history);
            }
        } catch (err) {
            console.error("Error al refrescar historial de llenaderas:", err);
        }
    };

    // Iniciar Carga
    const handleStartLoading = async (order: LlenaderasOrder) => {
        setActiveActionMenu(null);
        Swal.fire({
            title: `¿Iniciar Carga?`,
            html: `
                <div class="text-left text-sm space-y-1.5 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <p><b class="text-gray-700">Folio:</b> <span class="font-extrabold text-indigo-700">${order.folio}</span></p>
                    <p><b class="text-gray-700">Operador:</b> ${order.operator || "N/A"}</p>
                    <p><b class="text-gray-700">Producto:</b> ${order.product || "Amoniaco"}</p>
                    <p><b class="text-gray-700">Placas:</b> ${order.plates || "N/A"}</p>
                </div>
                <p class="text-xs text-gray-500 mt-3 text-center">¿Confirmas que deseas dar inicio al cronómetro y proceso de carga?</p>
            `,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, Iniciar Carga",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#059669",
            cancelButtonColor: "#6b7280",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.post(route("production.llenaderas.start-loading"), {
                        folio: order.folio,
                        id: order.id,
                        warehouse: order.warehouse || `Almacén 0${warehouseId}`,
                    });

                    if (res.data?.success) {
                        Swal.fire({
                            icon: "success",
                            title: "¡Carga Iniciada!",
                            text: `La orden ${order.folio} ha comenzado su proceso de carga.`,
                            timer: 1800,
                            showConfirmButton: false,
                        });
                        await reloadHistory();
                    }
                } catch (err: any) {
                    Swal.fire({
                        icon: "error",
                        title: "Error al Iniciar Carga",
                        text: err.response?.data?.message || "No se pudo iniciar la carga.",
                    });
                }
            }
        });
    };

    // Finalizar Carga
    const handleFinishLoading = async (order: LlenaderasOrder) => {
        setActiveActionMenu(null);
        Swal.fire({
            title: `¿Finalizar Carga?`,
            html: `
                <div class="text-left text-sm space-y-1.5 p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                    <p><b class="text-gray-700">Folio:</b> <span class="font-extrabold text-rose-700">${order.folio}</span></p>
                    <p><b class="text-gray-700">Operador:</b> ${order.operator || "N/A"}</p>
                    <p><b class="text-gray-700">Avance actual:</b> <span class="font-extrabold text-gray-800">${order.loading_percentage || 0}%</span></p>
                </div>
                <p class="text-xs text-gray-500 mt-3 text-center">¿Confirmas finalizar la carga? Esto detendrá el cronómetro y habilitará el destare en Báscula.</p>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, Finalizar Carga",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#6b7280",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await axios.post(route("production.llenaderas.finish-loading"), {
                        folio: order.folio,
                        id: order.id,
                    });

                    if (res.data?.success) {
                        Swal.fire({
                            icon: "success",
                            title: "¡Carga Finalizada!",
                            text: `La orden ${order.folio} ha finalizado su proceso de carga exitosamente. El destare en Báscula ha sido habilitado.`,
                            timer: 2200,
                            showConfirmButton: false,
                        });
                        await reloadHistory();
                    }
                } catch (err: any) {
                    Swal.fire({
                        icon: "error",
                        title: "Error al Finalizar Carga",
                        text: err.response?.data?.message || "No se pudo finalizar la carga.",
                    });
                }
            }
        });
    };

    // Guardar Porcentaje de Carga Manualmente
    const savePercentage = async (order: LlenaderasOrder, pct: number) => {
        // Actualización optimista en el estado local
        setHistory((prev) =>
            prev.map((item) =>
                item.folio === order.folio || item.id === order.id
                    ? { ...item, loading_percentage: pct }
                    : item
            )
        );

        try {
            const res = await axios.post(route("production.llenaderas.update-percentage"), {
                folio: order.folio,
                id: order.id,
                percentage: pct,
            });

            if (res.data?.success) {
                Swal.fire({
                    icon: "success",
                    title: `Avance: ${pct}%`,
                    text: `Porcentaje de carga actualizado para la orden ${order.folio}.`,
                    timer: 1600,
                    showConfirmButton: false,
                    toast: true,
                    position: "top-end",
                });
                await reloadHistory();
            }
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Error al Actualizar Avance",
                text: err.response?.data?.message || "No se pudo actualizar el porcentaje.",
            });
            await reloadHistory();
        }
    };

    // Modal para actualizar porcentaje manualmente con botones rápidos y selector
    const handlePromptPercentage = (order: LlenaderasOrder) => {
        // Solo permitido mientras está en proceso de carga (después de iniciar y antes de finalizar)
        if (!order || !order.folio || !order.started_at || order.finished_at) {
            return;
        }

        const currentPct = Number(order.loading_percentage || 0);

        Swal.fire({
            title: `Actualizar Avance de Carga`,
            html: `
                <div class="space-y-4 py-2 text-left">
                    <div class="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-gray-500 font-bold block">ORDEN DE EMBARQUE</span>
                            <span class="text-sm font-black text-indigo-700">${order.folio}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-gray-500 font-bold block">PRODUCTO</span>
                            <span class="text-xs font-bold text-gray-800">${order.product || "Amoniaco"}</span>
                        </div>
                    </div>

                    <div class="text-center py-2">
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                            Porcentaje Actual de Carga
                        </label>
                        <div class="inline-flex items-center justify-center gap-2">
                            <input id="swal-pct-input" type="number" min="0" max="100" value="${currentPct}"
                                class="w-24 text-center text-3xl font-black rounded-2xl border-2 border-indigo-500 py-1.5 px-2 text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            <span class="text-2xl font-black text-gray-600">%</span>
                        </div>
                    </div>

                    <div>
                        <input id="swal-pct-range" type="range" min="0" max="100" value="${currentPct}"
                            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <div class="flex justify-between text-[10px] text-gray-400 font-bold px-1 mt-1">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div class="pt-2">
                        <span class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">
                            Acceso Rápido
                        </span>
                        <div class="grid grid-cols-5 gap-1.5">
                            <button type="button" class="swal-quick-btn py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-100 text-xs font-black text-gray-700 hover:text-indigo-700 border border-gray-200 transition cursor-pointer" data-pct="10">10%</button>
                            <button type="button" class="swal-quick-btn py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-100 text-xs font-black text-gray-700 hover:text-indigo-700 border border-gray-200 transition cursor-pointer" data-pct="25">25%</button>
                            <button type="button" class="swal-quick-btn py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-100 text-xs font-black text-gray-700 hover:text-indigo-700 border border-gray-200 transition cursor-pointer" data-pct="50">50%</button>
                            <button type="button" class="swal-quick-btn py-1.5 rounded-xl bg-gray-100 hover:bg-indigo-100 text-xs font-black text-gray-700 hover:text-indigo-700 border border-gray-200 transition cursor-pointer" data-pct="75">75%</button>
                            <button type="button" class="swal-quick-btn py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-black text-emerald-700 hover:text-emerald-800 border border-emerald-200 transition cursor-pointer" data-pct="100">100%</button>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar Avance",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#4f46e5",
            didOpen: () => {
                const input = document.getElementById("swal-pct-input") as HTMLInputElement;
                const range = document.getElementById("swal-pct-range") as HTMLInputElement;

                if (input && range) {
                    input.addEventListener("input", () => {
                        let val = Math.max(0, Math.min(100, Number(input.value) || 0));
                        range.value = String(val);
                    });
                    range.addEventListener("input", () => {
                        input.value = range.value;
                    });
                }

                document.querySelectorAll(".swal-quick-btn").forEach((btn) => {
                    btn.addEventListener("click", () => {
                        const pct = (btn as HTMLElement).dataset.pct || "0";
                        if (input) input.value = pct;
                        if (range) range.value = pct;
                    });
                });
            },
            preConfirm: () => {
                const input = document.getElementById("swal-pct-input") as HTMLInputElement;
                const val = parseInt(input?.value || "0", 10);
                if (isNaN(val) || val < 0 || val > 100) {
                    Swal.showValidationMessage("El porcentaje debe ser un número entre 0% y 100%");
                    return false;
                }
                return val;
            },
        }).then((result) => {
            if (result.isConfirmed && typeof result.value === "number") {
                savePercentage(order, result.value);
            }
        });
    };

    // Buscar Orden por QR / Input (Registra la OE en el historial sin mostrar cuadros de confirmación para que se inicie/finalice desde las acciones)
    const handleSearchOrder = async (overrideQuery?: string) => {
        const q = (overrideQuery !== undefined ? overrideQuery : searchQr).trim();
        if (!q) {
            Swal.fire({
                icon: "info",
                title: "Folio o QR Requerido",
                text: "Por favor escriba o escanee el folio de la orden de embarque.",
            });
            return;
        }

        setIsSearching(true);
        try {
            const res = await axios.get(route("production.llenaderas.search-order"), {
                params: {
                    q,
                    warehouse: `Almacén 0${warehouseId}`,
                },
            });

            const order: LlenaderasOrder = res.data?.order;
            if (!order) {
                Swal.fire({
                    icon: "error",
                    title: "No Encontrada",
                    text: `No se encontró información para la orden ${q}.`,
                });
                return;
            }

            setSearchQr("");
            await reloadHistory();

            Swal.fire({
                icon: "success",
                title: `Orden ${order.folio}`,
                text: "Orden agregada al historial de la tabla.",
                timer: 1600,
                showConfirmButton: false,
                toast: true,
                position: "top-end",
            });
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Error al Buscar",
                text: err.response?.data?.message || `No se pudo encontrar la orden ${q}.`,
            });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Llenaderas">
            <Head title="Llenaderas - Producción" />

            <div className="py-6 sm:py-8 space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                {/* Botón de regreso */}
                <div>
                    <Link
                        href={route("production.index")}
                        className="inline-flex items-center text-gray-500 hover:text-amber-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Volver a Producción
                    </Link>
                </div>

                {/* 1. TARJETA SUPERIOR: Escanear Código QR de Orden de Embarque */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        Escanear Código QR de Orden de Embarque
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl mx-auto">
                        Utilice el lector óptico, la cámara del dispositivo o escriba el folio para comenzar el proceso de carga.
                    </p>

                    {/* Barra de entrada y botones */}
                    <div className="max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <QrCode className="w-5 h-5 text-indigo-500" />
                            </div>
                            <input
                                type="text"
                                value={searchQr}
                                onChange={(e) => setSearchQr(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSearchOrder();
                                    }
                                }}
                                placeholder="EJ: PA2026-AMO-0001 O ESCANEAR CÓDIGO"
                                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 text-sm font-bold uppercase tracking-wider text-gray-800 placeholder-gray-400 shadow-2xs transition"
                            />
                            {searchQr && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQr("")}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Botón Cámara */}
                        <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-sm border border-indigo-200/80 transition shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                            <Camera className="w-4 h-4 text-indigo-600" />
                            <span>Cámara</span>
                        </button>

                        {/* Botón Siguiente */}
                        <button
                            type="button"
                            onClick={() => handleSearchOrder()}
                            disabled={isSearching}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                            <Search className="w-4 h-4" />
                            <span>{isSearching ? "Buscando..." : "Siguiente"}</span>
                        </button>
                    </div>

                    {/* Indicador de lector óptico */}
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Lector óptico listo para captura automática al presionar Enter</span>
                    </div>
                </div>

                {/* 2. TARJETA INFERIOR: HISTORIAL DE ÓRDENES DE EMBARQUE */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header del Historial */}
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight uppercase">
                                    HISTORIAL DE ÓRDENES DE EMBARQUE
                                </h3>
                                {/* Selector Almacén */}
                                <button
                                    type="button"
                                    onClick={() => setIsWarehouseModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition cursor-pointer"
                                    title="Cambiar almacén"
                                >
                                    <Warehouse className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>
                                        {warehouseId === 0 ? "TODOS LOS ALMACENES" : `ALMACÉN 0${warehouseId}`}
                                    </span>
                                    <Settings className="w-3 h-3 text-indigo-400 ml-0.5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Consulta de órdenes en proceso de carga y finalizadas asignadas a este almacén.
                            </p>
                        </div>

                        {/* Buscador en historial */}
                        <div className="relative w-full md:w-72">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                placeholder="Filtrar folio, operador..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-0 shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Tabla de Historial */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-[#121829] text-white uppercase text-[11px] font-black tracking-wider">
                                <tr>
                                    <th className="px-3 py-3.5">FOLIO</th>
                                    <th className="px-3 py-3.5">OPERADOR</th>
                                    <th className="px-3 py-3.5">PRODUCTO</th>
                                    <th className="px-3 py-3.5">PLACAS</th>
                                    <th className="px-3 py-3.5 whitespace-nowrap">HORA INI.</th>
                                    <th className="px-3 py-3.5 whitespace-nowrap">HORA FIN.</th>
                                    <th className="px-3 py-3.5 text-center whitespace-nowrap">CRONÓMETRO</th>
                                    <th className="px-3 py-3.5 text-center whitespace-nowrap">AVANCE (%)</th>
                                    <th className="px-4 py-3.5 text-center whitespace-nowrap">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((row) => {
                                        const isFinished = Boolean(row.finished_at);
                                        const isLoading = Boolean(row.started_at) && !isFinished;
                                        const isPending = !row.started_at;

                                        return (
                                            <tr
                                                key={row.id || row.folio}
                                                className="hover:bg-indigo-50/40 transition-colors"
                                            >
                                                {/* Folio */}
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className="font-extrabold text-indigo-700 block text-xs">
                                                        {row.folio}
                                                    </span>
                                                </td>

                                                {/* Operador */}
                                                <td className="px-3 py-3 font-bold text-gray-800 whitespace-nowrap">
                                                    {row.operator}
                                                </td>

                                                {/* Producto */}
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className="font-bold text-gray-800 block text-xs">
                                                        {row.product}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-indigo-600 block">
                                                        {row.stowage_text || "5 estibas"}
                                                    </span>
                                                </td>

                                                {/* Placas */}
                                                <td className="px-3 py-3 font-mono text-gray-600 whitespace-nowrap text-[11px]">
                                                    {row.plates}
                                                </td>

                                                {/* Hora Ini */}
                                                <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-700 text-[11px]">
                                                    {formatDateTime(row.started_at) || "--"}
                                                </td>

                                                {/* Hora Fin */}
                                                <td className="px-3 py-3 whitespace-nowrap text-[11px]">
                                                    {row.finished_at ? (
                                                        <span className="font-medium text-gray-700">
                                                            {formatDateTime(row.finished_at)}
                                                        </span>
                                                    ) : (
                                                        <span className="italic text-gray-400 font-medium">
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Cronómetro */}
                                                <td className="px-3 py-3 text-center whitespace-nowrap">
                                                    <span
                                                        className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-md ${
                                                            isLoading
                                                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                                : isFinished
                                                                ? "bg-gray-100 text-gray-800"
                                                                : "text-gray-400"
                                                        }`}
                                                    >
                                                        {computeTimer(row.started_at, row.finished_at)}
                                                    </span>
                                                </td>

                                                {/* Avance (%) */}
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="w-28 sm:w-32 mx-auto">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-black text-xs text-gray-800">
                                                                {row.loading_percentage || 0}%
                                                            </span>
                                                            {isLoading && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePromptPercentage(row)}
                                                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded cursor-pointer transition flex items-center gap-0.5"
                                                                    title="Actualizar porcentaje manualmente"
                                                                >
                                                                    <Edit3 className="w-2.5 h-2.5" />
                                                                    <span>Actualizar</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div
                                                            onClick={() => {
                                                                if (isLoading) handlePromptPercentage(row);
                                                            }}
                                                            className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden transition ${
                                                                isLoading ? "cursor-pointer hover:ring-1 hover:ring-indigo-400" : ""
                                                            }`}
                                                            title={isLoading ? "Click para actualizar avance" : undefined}
                                                        >
                                                            <div
                                                                className={`h-full transition-all duration-300 rounded-full ${
                                                                    isFinished
                                                                        ? "bg-emerald-500"
                                                                        : (row.loading_percentage || 0) >= 80
                                                                        ? "bg-emerald-600"
                                                                        : (row.loading_percentage || 0) >= 40
                                                                        ? "bg-indigo-600"
                                                                        : "bg-amber-500"
                                                                }`}
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(0, row.loading_percentage || 0))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Acciones (Derecha) */}
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartLoading(row)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
                                                            title="Iniciar proceso de carga"
                                                        >
                                                            <Play className="w-3.5 h-3.5 fill-current" />
                                                            <span>Iniciar Carga</span>
                                                        </button>
                                                    )}
                                                    {isLoading && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFinishLoading(row)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer animate-pulse"
                                                            title="Finalizar proceso de carga"
                                                        >
                                                            <Square className="w-3.5 h-3.5 fill-current" />
                                                            <span>Finalizar Carga</span>
                                                        </button>
                                                    )}
                                                    {isFinished && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Carga Completada</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-10 text-center text-gray-400 font-medium"
                                        >
                                            No se encontraron órdenes de embarque registradas para este filtro.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Selector de Almacén */}
            {isWarehouseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <h4 className="text-sm font-black text-gray-900 uppercase">
                                Seleccionar Almacén
                            </h4>
                            <button
                                type="button"
                                onClick={() => setIsWarehouseModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {[1, 2, 3, 4, 5].map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        setWarehouseId(id);
                                        setIsWarehouseModalOpen(false);
                                    }}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                                        warehouseId === id
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    <span>ALMACÉN 0{id}</span>
                                    {warehouseId === id && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    setWarehouseId(0);
                                    setIsWarehouseModalOpen(false);
                                }}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                                    warehouseId === 0
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-50 hover:bg-gray-100 text-gray-800"
                                }`}
                            >
                                <span>TODOS LOS ALMACENES</span>
                                {warehouseId === 0 && <Check className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Escaneo con Cámara */}
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
                title="Escanear Código QR de Orden de Embarque"
            />
        </DashboardLayout>
    );
}
