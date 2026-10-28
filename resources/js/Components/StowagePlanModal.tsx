import React, { useState, useEffect, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import {
    X,
    Save,
    Check,
    Lock,
    Unlock,
    RotateCcw,
    CheckSquare,
    Square,
} from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSaved?: (updatedHistory?: any) => void;
}

export default function StowagePlanModal({
    isOpen,
    onClose,
    order,
    onSaved,
}: Props) {
    const safeOrder = order || {};

    const gridCols = useMemo(() => Array.from({ length: 24 }, (_, i) => 24 - i), []);

    // Calculate sacks exactly like StowageNoteTemplate
    const calculateSacks = () => {
        if (!safeOrder.programmed_tons) return "0";
        const tons = parseFloat(safeOrder.programmed_tons);
        if (isNaN(tons)) return "0";

        if (safeOrder.sacks_count && typeof safeOrder.sacks_count === "string" && safeOrder.sacks_count.includes("KG")) {
            const size = parseInt(safeOrder.sacks_count.replace("KG", "").trim());
            if (!isNaN(size) && size > 0) {
                return ((tons * 1000) / size).toFixed(0);
            }
        }

        const pres = String(safeOrder.presentation || "");
        if (pres.includes("25")) return (tons * 40).toFixed(0);
        if (pres.includes("50")) return (tons * 20).toFixed(0);
        if (pres.includes("200")) return (tons * 5).toFixed(0);
        if (pres.includes("500")) return (tons * 2).toFixed(0);
        if (pres.includes("1000")) return (tons * 1).toFixed(0);

        if (safeOrder.sacks_count) return String(safeOrder.sacks_count);
        return "N/A";
    };

    // State for the 24 tachado boxes (boolean for each 1..24)
    const [tachados, setTachados] = useState<boolean[]>(Array(24).fill(false));
    const [shift, setShift] = useState<string>("1");
    const [hour, setHour] = useState<string>("");
    const [supervisor, setSupervisor] = useState<string>("");
    const [adjustment, setAdjustment] = useState<string>("");
    const [justification, setJustification] = useState<string>("");
    const [verifier, setVerifier] = useState<string>("");
    const [line1, setLine1] = useState<string>("");
    const [line2, setLine2] = useState<string>("");
    const [line3, setLine3] = useState<string>("");
    const [line4, setLine4] = useState<string>("");
    const [comments, setComments] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Initialize data from order when opened
    useEffect(() => {
        if (!isOpen || !order) return;

        const plan = order.stowage_plan || {};

        setShift(plan.shift !== undefined ? String(plan.shift) : "1");

        if (plan.hour) {
            setHour(String(plan.hour));
        } else {
            const now = new Date();
            setHour(
                now.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        }

        setSupervisor(
            plan.supervisor ||
            order.loading_assistant ||
            order.assistant ||
            order.loading_administrator ||
            order.squad_leader ||
            ""
        );

        if (Array.isArray(plan.stowages) && plan.stowages.length === 24) {
            setTachados(
                plan.stowages.map((v: any) =>
                    v === "X" || v === "x" || v === true || v === 1 || v === "1" || (typeof v === "number" && v > 0)
                )
            );
        } else {
            // By default blank
            setTachados(Array(24).fill(false));
        }

        setAdjustment(plan.adjustment !== undefined ? String(plan.adjustment) : "");
        setJustification(plan.justification !== undefined ? String(plan.justification) : "");
        setVerifier(plan.verifier !== undefined ? String(plan.verifier) : "");
        setLine1(plan.line_1 !== undefined ? String(plan.line_1) : "");
        setLine2(plan.line_2 !== undefined ? String(plan.line_2) : "");
        setLine3(plan.line_3 !== undefined ? String(plan.line_3) : "");
        setLine4(plan.line_4 !== undefined ? String(plan.line_4) : "");
        setComments(plan.comments !== undefined ? String(plan.comments) : (order.observations || ""));
    }, [isOpen, order]);

    // Toggle individual box tachado
    const toggleTachado = (index: number) => {
        setTachados((prev) => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    // Quick helpers
    const handleTacharTodas = () => {
        setTachados(Array(24).fill(true));
    };

    const handleLimpiarTodas = () => {
        setTachados(Array(24).fill(false));
    };

    const countTachados = useMemo(() => {
        return tachados.filter(Boolean).length;
    }, [tachados]);

    const isPlanCompleted = order?.stowage_plan_status === "completed";

    const borderClass = "border border-green-800";
    const bgColor = "bg-green-200";
    const accentColor = "bg-green-100";

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!order?.id && !order?.shipment_order_id && !order?.history_id) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se encontró el identificador de la orden.",
            });
            return;
        }

        const targetId = order.id || order.shipment_order_id || order.history_id;
        setIsSaving(true);

        const payload = {
            stowage_plan: {
                shift,
                hour,
                supervisor,
                stowages: tachados.map((t) => (t ? "X" : null)),
                adjustment,
                justification,
                verifier,
                line_1: line1,
                line_2: line2,
                line_3: line3,
                line_4: line4,
                comments,
            },
            shipment_order_id: order.shipment_order_id || order.id,
            history_id: order.history_id,
            folio: order.folio,
        };

        try {
            const response = await axios.post(
                route("documentation.shipment-orders.save-stowage-plan", targetId),
                payload
            );

            Swal.fire({
                icon: "success",
                title: "¡Nota de Estiba Guardada!",
                html: `Se ha guardado la <b>Nota de Estiba (GLS-AP-FO-002)</b> con <b>${countTachados} de 24 estibas tachadas</b>.<br/><br/>
                <span class="text-emerald-700 font-bold">Candado liberado</span>: Ahora es posible capturar las muestras de ensacadora.`,
                confirmButtonColor: "#16a34a",
                confirmButtonText: "Entendido",
            });

            if (onSaved) {
                onSaved(response.data?.history);
            }
            onClose();
        } catch (error: any) {
            console.error("Error saving stowage plan:", error);
            const msg = error.response?.data?.message || "Ocurrió un error al guardar la nota de estiba.";
            Swal.fire({
                icon: "error",
                title: "Error al guardar",
                text: msg,
                confirmButtonColor: "#4f46e5",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-6xl border border-slate-300 flex flex-col max-h-[96vh]">
                                {/* --- MODAL TOP BAR --- */}
                                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 px-5 py-3 text-white flex items-center justify-between shrink-0 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-extrabold uppercase tracking-tight">
                                                Nota de Estiba a Camión
                                            </h3>
                                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider">
                                                GLS-AP-FO-002
                                            </span>
                                        </div>
                                        <span className="text-emerald-300 text-xs hidden sm:inline">|</span>
                                        <p className="text-xs text-emerald-100 font-medium hidden sm:inline">
                                            Orden: <span className="font-bold text-white">{safeOrder.folio || "N/A"}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10 text-xs font-bold">
                                            <span>Estibas tachadas:</span>
                                            <span className="text-emerald-300 font-extrabold text-sm">{countTachados}</span>
                                            <span className="text-gray-300">/ 24</span>
                                        </div>

                                        {isPlanCompleted ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                                                <Unlock className="w-3 h-3 text-emerald-300" />
                                                Candado Liberado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 animate-pulse">
                                                <Lock className="w-3 h-3 text-amber-300" />
                                                Candado Activo
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Quick action bar for tachar */}
                                <div className="bg-emerald-50 px-5 py-2 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                                    <div className="flex items-center gap-2 text-xs text-emerald-950 font-semibold">
                                        <span>✍️ Instrucción: <b>Haga clic en los cuadros del 1 al 24</b> para ir tachándolos con una <b>X</b> a medida que se estiba la carga.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleTacharTodas}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold transition shadow-xs"
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            Tachar Todas (1 al 24)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLimpiarTodas}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-md text-xs font-bold transition shadow-xs"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                                            Limpiar marcas
                                        </button>
                                    </div>
                                </div>

                                {/* --- DOCUMENT SHEET BODY (PIXEL-PERFECT GLS-AP-FO-002) --- */}
                                <div className="p-4 sm:p-5 overflow-y-auto bg-slate-100 flex justify-center">
                                    <div className="w-full bg-white font-sans text-[10px] text-black leading-tight p-3 sm:p-4 box-border shadow-md rounded-lg border border-gray-300">
                                        {/* --- HEADER --- */}
                                        <div className="flex w-full mb-1 h-12">
                                            {/* Logo Section */}
                                            <div className="w-[20%] p-0.5 flex flex-col items-center justify-center">
                                                <img
                                                    src="/images/logo_proagro.png"
                                                    alt="Logo"
                                                    className="h-full object-contain scale-105 origin-center"
                                                    onError={(e: any) => {
                                                        e.target.style.display = "none";
                                                    }}
                                                />
                                                <span className="text-[9px] font-black tracking-tight text-emerald-800 leading-none">
                                                    PRO AGROINDUSTRIA
                                                </span>
                                            </div>

                                            {/* Title Section */}
                                            <div className="w-[60%] flex flex-col items-center justify-center py-0.5 text-center">
                                                <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight leading-none text-gray-900">
                                                    PRO-AGROINDUSTRIA S.A. DE C.V.
                                                </h1>
                                                <h2 className="text-[9px] font-bold uppercase leading-none mt-1 text-gray-600">
                                                    GLS-AP-FO-002
                                                </h2>
                                                <h2 className="text-sm sm:text-base font-black uppercase leading-none mt-1 text-gray-900 tracking-tight">
                                                    NOTA DE ESTIBA A CAMIÓN
                                                </h2>
                                            </div>

                                            {/* Meta Data Section (Fecha, Turno, Hora) */}
                                            <div className="w-[20%] flex flex-col text-[8px]">
                                                <div className={`flex-1 flex ${borderClass} border-b`}>
                                                    <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r text-[8px]`}>
                                                        FECHA
                                                    </div>
                                                    <div className="w-[60%] flex items-center justify-center font-bold px-1 text-[8.5px]">
                                                        {safeOrder.created_at
                                                            ? new Date(safeOrder.created_at).toLocaleDateString("es-MX")
                                                            : new Date().toLocaleDateString("es-MX")}
                                                    </div>
                                                </div>
                                                <div className={`flex-1 flex ${borderClass} border-b`}>
                                                    <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r text-[8px]`}>
                                                        TURNO
                                                    </div>
                                                    <div className="w-[60%] flex items-center justify-center px-0.5">
                                                        <select
                                                            value={shift}
                                                            onChange={(e) => setShift(e.target.value)}
                                                            className="w-full h-full p-0 text-center font-bold text-[8.5px] border-0 focus:ring-0 bg-transparent cursor-pointer"
                                                        >
                                                            <option value="1">1</option>
                                                            <option value="2">2</option>
                                                            <option value="3">3</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className={`flex-1 flex ${borderClass}`}>
                                                    <div className={`w-[40%] ${bgColor} font-bold flex items-center justify-center ${borderClass} border-r text-[8px]`}>
                                                        HORA
                                                    </div>
                                                    <div className="w-[60%] flex items-center justify-center px-1">
                                                        <input
                                                            type="text"
                                                            value={hour}
                                                            onChange={(e) => setHour(e.target.value)}
                                                            className="w-full h-full p-0 text-center font-bold text-[8.5px] border-0 focus:ring-0 bg-transparent"
                                                            placeholder="HH:MM"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- DATOS DEL TRANSPORTISTA --- */}
                                        <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[8px] py-0.5 border-b-0`}>
                                            DATOS DEL TRANSPORTISTA
                                        </div>
                                        <div className={`w-full ${borderClass} border-2 mb-1 flex h-10`}>
                                            {/* Col 1: Operator */}
                                            <div className={`w-[25%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>
                                                    NOMBRE Y FIRMA DEL OPERADOR
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-bold uppercase text-[9px] text-center leading-none truncate px-1 text-gray-800">
                                                    {safeOrder.operator_name || safeOrder.operator?.name || safeOrder.operator || "SIN ASIGNAR"}
                                                </div>
                                            </div>
                                            {/* Col 2: Carrier */}
                                            <div className={`w-[35%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>
                                                    NOMBRE DE LA FLETERA
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-bold uppercase text-[9px] text-center leading-none px-1 truncate text-gray-800">
                                                    {safeOrder.transport_company || safeOrder.carrier?.name || "N/A"}
                                                </div>
                                            </div>
                                            {/* Col 3: Unit Type */}
                                            <div className={`w-[20%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>
                                                    TIPO DE UNIDAD
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-bold uppercase text-[9px] text-center leading-none truncate px-1 text-gray-800">
                                                    {safeOrder.is_full ? "FULL" : (safeOrder.unit_type || "SENCILLO")}
                                                </div>
                                            </div>
                                            {/* Col 4: Plates */}
                                            <div className="w-[20%] flex flex-col">
                                                <div className={`${bgColor} ${borderClass} border-b text-center font-bold text-[7px] p-0.5`}>
                                                    PLACAS
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center items-center font-bold text-[8px] leading-tight text-gray-800">
                                                    <div>T: {safeOrder.tractor_plate || "N/A"}</div>
                                                    <div>R: {safeOrder.trailer_plate || "N/A"}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- DATOS GENERALES --- */}
                                        <div className={`w-full ${borderClass} ${bgColor} text-center font-bold text-[8px] py-0.5 border-b-0`}>
                                            DATOS GENERALES
                                        </div>
                                        <div className={`w-full ${borderClass} border-2 mb-1 flex h-10`}>
                                            {/* OV */}
                                            <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} text-[7.5px] text-center font-bold ${borderClass} border-b p-0.5`}>
                                                    ORDEN DE VENTA
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-bold text-[9.5px] text-gray-800">
                                                    {safeOrder.sales_order?.folio || safeOrder.sales_order?.sale_order || safeOrder.order_number || "N/A"}
                                                </div>
                                            </div>
                                            {/* OE */}
                                            <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} text-[7.5px] text-center font-bold ${borderClass} border-b p-0.5`}>
                                                    ORDEN DE EMBARQUE
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-black text-[10.5px] text-indigo-900">
                                                    {safeOrder.folio || "N/A"}
                                                </div>
                                            </div>
                                            {/* Destinatario */}
                                            <div className={`w-[50%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`${bgColor} text-[7.5px] text-center font-bold ${borderClass} border-b p-0.5`}>
                                                    DESTINATARIO
                                                </div>
                                                <div className="flex-1 flex w-full">
                                                    <div className={`w-[60%] ${borderClass} border-r flex flex-col justify-center`}>
                                                        <div className="text-[6px] text-gray-500 text-center leading-none">NOMBRE</div>
                                                        <div className="font-bold uppercase text-[9px] text-center leading-none px-1 truncate text-gray-800">
                                                            {safeOrder.client?.business_name || safeOrder.client?.name || "N/A"}
                                                        </div>
                                                    </div>
                                                    <div className="w-[40%] flex flex-col justify-center">
                                                        <div className="text-[6px] text-gray-500 text-center leading-none">DESTINO</div>
                                                        <div className="font-bold uppercase text-[8.5px] text-center leading-none px-1 truncate text-gray-800">
                                                            {safeOrder.destination || safeOrder.state || "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Supervisor */}
                                            <div className="w-[20%] flex flex-col">
                                                <div className={`${bgColor} text-[7.5px] text-center font-bold ${borderClass} border-b p-0.5`}>
                                                    SUPERVISOR
                                                </div>
                                                <div className="flex-1 flex items-center justify-center px-1">
                                                    <input
                                                        type="text"
                                                        value={supervisor}
                                                        onChange={(e) => setSupervisor(e.target.value)}
                                                        className="w-full text-center font-bold text-[8.5px] uppercase border-0 focus:ring-0 p-0 text-gray-800"
                                                        placeholder="Supervisor..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- GRID E- (24 CUADROS PARA IR TAXANDO/TACHANDO CON X) --- */}
                                        <div className="w-full mb-1 flex items-end">
                                            {/* Table Container */}
                                            <div className="w-[90%] flex flex-col">
                                                <div className="flex items-center justify-between mb-0.5 px-1">
                                                    <span className="text-center font-black text-sm leading-none text-emerald-950">
                                                        E- (ESTIBAS DEL 1 AL 24)
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 font-bold">
                                                        * Toque cada cuadro para tachar con una X
                                                    </span>
                                                </div>
                                                <table className="w-full border-collapse border border-green-800 text-center">
                                                    <thead>
                                                        <tr className="bg-gray-100">
                                                            {gridCols.map((col) => (
                                                                <th
                                                                    key={col}
                                                                    className="border border-green-800 h-4 font-extrabold text-[8.5px] text-gray-900"
                                                                >
                                                                    {col}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr className="h-12 bg-white">
                                                            {gridCols.map((col) => {
                                                                const isTachado = tachados[col - 1];
                                                                return (
                                                                    <td
                                                                        key={`cell-${col}`}
                                                                        onClick={() => toggleTachado(col - 1)}
                                                                        className={`border border-green-800 font-black text-center cursor-pointer select-none transition ${
                                                                            isTachado
                                                                                ? "bg-emerald-100/60 hover:bg-emerald-200/70"
                                                                                : "hover:bg-slate-100"
                                                                        }`}
                                                                        title={`Estiba E-${col}: Haga clic para ${isTachado ? "destachar" : "tachar con X"}`}
                                                                    >
                                                                        {isTachado ? (
                                                                            <span className="text-red-700 font-black text-xl sm:text-2xl leading-none inline-block transform hover:scale-110 transition">
                                                                                X
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-300 text-[9px] font-normal hover:text-gray-500">
                                                                                +
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Box Container on Right with TM Programada */}
                                            <div className="w-[10%] flex flex-col items-center pl-1">
                                                <span className="text-[7px] font-bold text-center leading-none mb-0.5 text-gray-900 whitespace-nowrap">
                                                    TM Programada
                                                </span>
                                                <div className="w-full h-12 border-2 border-black bg-white rounded-xl flex items-center justify-center font-black text-[11px] text-gray-900 shadow-2xs">
                                                    {safeOrder.programmed_tons ? Number(safeOrder.programmed_tons).toFixed(1) : "0.0"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- PRODUCT TABLE / BOXES --- */}
                                        <div className={`w-full ${borderClass} border-2 mb-1 flex h-10`}>
                                            {[
                                                { label: "CÓDIGO", width: "15%", value: safeOrder.product?.code || safeOrder.product_code || "N/A" },
                                                { label: "DESCRIPCIÓN DEL PRODUCTO", width: "40%", value: safeOrder.product_text || safeOrder.product?.name || safeOrder.product || "UREA INDUSTRIAL" },
                                                { label: "NO. DE ALMACEN", width: "15%", value: safeOrder.warehouse ? safeOrder.warehouse.replace("Almacen ", "") : "2" },
                                                { label: "TOTAL DE SACOS", width: "10%", value: calculateSacks() },
                                            ].map((col, idx) => (
                                                <div key={idx} className={`flex flex-col ${borderClass} border-r`} style={{ width: col.width }}>
                                                    <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                        {col.label}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center font-bold text-[9px] text-center p-0.5 leading-none uppercase truncate text-gray-800">
                                                        {col.value}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* AJUSTE input */}
                                            <div className={`flex flex-col ${borderClass} border-r`} style={{ width: "10%" }}>
                                                <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                    AJUSTE
                                                </div>
                                                <div className="flex-1 flex items-center justify-center px-1">
                                                    <input
                                                        type="text"
                                                        value={adjustment}
                                                        onChange={(e) => setAdjustment(e.target.value)}
                                                        className="w-full text-center font-bold text-[9px] border-0 focus:ring-0 p-0 text-gray-800"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            {/* JUSTIFICAR input */}
                                            <div className="flex flex-col" style={{ width: "10%" }}>
                                                <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                    JUSTIFICAR
                                                </div>
                                                <div className="flex-1 flex items-center justify-center px-1">
                                                    <input
                                                        type="text"
                                                        value={justification}
                                                        onChange={(e) => setJustification(e.target.value)}
                                                        className="w-full text-center font-medium text-[8px] border-0 focus:ring-0 p-0 text-gray-800"
                                                        placeholder="Motivo..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- LOT / VERIFICADOR / LINES ROW --- */}
                                        <div className={`w-full ${borderClass} border-2 mb-1 flex h-9`}>
                                            <div className={`w-[15%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                    NO. DE LOTE
                                                </div>
                                                <div className="flex-1 flex items-center justify-center font-bold text-[8px] uppercase text-gray-800 px-1 truncate">
                                                    {safeOrder.lot_folio || safeOrder.lot?.folio || "N/A"}
                                                </div>
                                            </div>

                                            <div className={`w-[20%] ${borderClass} border-r flex flex-col`}>
                                                <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                    VERIFICADOR
                                                </div>
                                                <div className="flex-1 flex items-center justify-center px-1">
                                                    <input
                                                        type="text"
                                                        value={verifier}
                                                        onChange={(e) => setVerifier(e.target.value)}
                                                        className="w-full text-center font-bold text-[8.5px] uppercase border-0 focus:ring-0 p-0 text-gray-800"
                                                        placeholder="Verificador..."
                                                    />
                                                </div>
                                            </div>

                                            {[
                                                { label: "LINEA 1", val: line1, setVal: setLine1 },
                                                { label: "LINEA 2", val: line2, setVal: setLine2 },
                                                { label: "LINEA 3", val: line3, setVal: setLine3 },
                                                { label: "LINEA 4", val: line4, setVal: setLine4 },
                                            ].map((line, idx) => (
                                                <div key={idx} className={`w-[16.25%] ${idx < 3 ? borderClass + " border-r" : ""} flex flex-col`}>
                                                    <div className={`bg-gray-100 ${borderClass} border-b text-center font-bold text-[7px] p-0.5 uppercase h-3.5 flex items-center justify-center`}>
                                                        {line.label}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center px-1">
                                                        <input
                                                            type="text"
                                                            value={line.val}
                                                            onChange={(e) => line.setVal(e.target.value)}
                                                            className="w-full text-center font-medium text-[8.5px] border-0 focus:ring-0 p-0 text-gray-800"
                                                            placeholder="..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* --- FOOTER SECTION (CALIDAD Y COMENTARIOS) --- */}
                                        <div className={`flex w-full ${borderClass} border-2 h-20`}>
                                            {/* Quality & Driver Signature (45%) */}
                                            <div className={`w-[45%] ${borderClass} border-r-2 flex flex-col p-1`}>
                                                <div className={`${accentColor} ${borderClass} text-[7.5px] font-bold text-center mb-0.5`}>
                                                    CALIDAD DE PRODUCTO Y CANTIDAD DE SACOS
                                                </div>
                                                <p className="text-[7.5px] text-justify mb-0.5 px-1 leading-tight text-gray-700">
                                                    Confirmo que el número de sacos cargados corresponden a la cantidad establecida.
                                                </p>

                                                <div className="text-center mt-auto mb-0.5">
                                                    <div className="border-b border-black w-3/4 mx-auto mb-0.5 font-bold text-[8.5px] uppercase truncate text-gray-800">
                                                        {safeOrder.operator_name || safeOrder.operator?.name || safeOrder.operator || "SIN ASIGNAR"}
                                                    </div>
                                                    <div className="text-[6.5px] text-gray-600">Nombre y firma del chofer</div>
                                                </div>
                                            </div>

                                            {/* Comments Section (55%) */}
                                            <div className="w-[55%] flex flex-col p-1">
                                                <div className={`${accentColor} ${borderClass} text-[7.5px] font-bold text-center mb-0.5`}>
                                                    COMENTARIOS
                                                </div>
                                                <div className={`flex-1 ${borderClass} bg-white p-1`}>
                                                    <textarea
                                                        rows={2}
                                                        value={comments}
                                                        onChange={(e) => setComments(e.target.value)}
                                                        className="w-full h-full text-[8.5px] uppercase border-0 focus:ring-0 p-0 resize-none text-gray-800"
                                                        placeholder="Observaciones de estiba o calidad..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- MODAL BOTTOM ACTIONS --- */}
                                <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                                    <div className="text-xs text-gray-600 flex items-center gap-2">
                                        <span className="font-semibold">
                                            Estibas completadas: <b className="text-emerald-700">{countTachados} de 24</b>
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Al guardar se <b>desbloquea el candado</b> de muestreo.
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSaving}
                                            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition text-xs"
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleSave()}
                                            disabled={isSaving}
                                            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md hover:shadow-lg transition flex items-center gap-2 text-xs disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Guardando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Guardar Nota de Estiba</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
