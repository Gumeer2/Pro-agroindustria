import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Edit3, Plus, Printer, List, CheckCircle2 } from "lucide-react";

interface PersonnelRow {
    num: string;
    name: string;
    signature?: string;
    entry_time?: string;
    exit_time?: string;
}

interface Attendance {
    id: number;
    folio: string;
    format_code: string;
    service_provider: string;
    shift: string;
    work_area: string;
    date: string;
    activity: string;
    loading_line: string;
    personnel: PersonnelRow[];
    squad_leader: PersonnelRow[];
    safety_supervisor: PersonnelRow[];
    observations: string;
    supervision_name: string;
    created_at: string;
}

interface Props {
    attendance: Attendance;
}

export default function Print({ attendance = {} as any }: Props) {
    useEffect(() => {
        // Optional quick print trigger on load if needed
    }, []);

    // Format date in DD/MM/YYYY
    const formatDate = (dateVal: any) => {
        if (!dateVal) return "";
        try {
            const str = String(dateVal);
            const datePart = str.split("T")[0];
            const parts = datePart.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return datePart;
        } catch (e) {
            return "";
        }
    };

    const formattedDate = formatDate(attendance?.date);

    // Ensure at least 12 rows for personnel table to maintain exact PDF sheet proportion
    const rawPersonnel = Array.isArray(attendance?.personnel) ? attendance.personnel : [];
    const personnelRows: PersonnelRow[] = [...rawPersonnel];
    while (personnelRows.length < 12) {
        personnelRows.push({
            num: String(personnelRows.length + 1).padStart(2, "0"),
            name: "",
            signature: "",
            entry_time: personnelRows[0]?.entry_time || "7:00",
            exit_time: personnelRows[0]?.exit_time || "19.00",
        });
    }

    const squadLeader = (Array.isArray(attendance?.squad_leader) && attendance.squad_leader[0]) ? attendance.squad_leader[0] : {
        num: "01",
        name: "",
        signature: "",
        entry_time: "7:00",
        exit_time: "19.00",
    };

    const safetySupervisor = (Array.isArray(attendance?.safety_supervisor) && attendance.safety_supervisor[0]) ? attendance.safety_supervisor[0] : {
        num: "01",
        name: "",
        signature: "",
        entry_time: "7:00",
        exit_time: "19.00",
    };

    return (
        <div className="min-h-screen bg-slate-200/70 p-0 sm:p-6 print:p-0 print:bg-white text-slate-900 font-sans">
            <Head title={`Formato GLS-AP-FO-005 - ${attendance?.folio || "Control de Asistencias"}`} />

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body, html {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .printable-document {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 auto !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    @page {
                        size: letter portrait;
                        margin: 8mm 10mm;
                    }
                }
                .pdf-border {
                    border: 1.5px solid #000000;
                }
                .pdf-cell-border {
                    border: 1px solid #000000;
                }
                .pdf-green-banner {
                    background-color: #c4ecc9;
                }
                .pdf-green-header {
                    background-color: #c4ecc9;
                }
            `}</style>

            {/* Interactive Screen Toolbar (Hidden on Print) */}
            <header className="no-print sticky top-0 z-50 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900/95 px-6 py-4 text-white shadow-2xl backdrop-blur-md max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <Link
                        href={route("apt.attendance.index")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Prestadores de Servicios
                    </Link>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-sky-400">
                            Documento Imprimible Oficial
                        </p>
                        <h1 className="text-sm font-bold text-white">
                            Formato {attendance.format_code || "GLS-AP-FO-005"} · Folio: {attendance.folio || "S/F"}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route("apt.attendance.create")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Registro
                    </Link>
                    <Link
                        href={route("apt.attendance.edit", attendance.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-500 shadow"
                    >
                        <Edit3 className="h-4 w-4" />
                        Editar
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white shadow-lg shadow-emerald-700/30 transition hover:bg-emerald-500"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir / Guardar PDF
                    </button>
                </div>
            </header>

            {/* Official Printable Sheet (Matching 1:1 PDF layout) */}
            <div className="printable-document mx-auto max-w-[820px] bg-white p-6 sm:p-10 shadow-2xl rounded-2xl border border-slate-200">
                {/* 1. Header Box */}
                <div className="pdf-border mb-3 p-2.5">
                    <div className="grid grid-cols-[110px_1fr_110px] items-center gap-2">
                        {/* Left Logo */}
                        <div className="flex items-center justify-start">
                            <img
                                src="/Proagro.png"
                                alt="Pro-Agroindustria Logo"
                                className="h-[62px] w-[80px] object-contain"
                            />
                        </div>

                        {/* Center Title */}
                        <div className="text-center">
                            <h1 className="text-[17px] font-black tracking-tight text-black leading-tight">
                                PRO-AGROINDUSTRIA S.A. DE C.V.
                            </h1>
                            <div className="mx-auto my-1 h-[2.5px] w-48 bg-red-600"></div>
                            <h2 className="text-[13px] font-black tracking-normal text-black leading-tight">
                                ALMACEN DE PRODUCTO TERMINADO
                            </h2>
                            <p className="text-[11px] font-bold tracking-wider text-black">
                                {attendance.format_code || "GLS-AP-FO-005"}
                            </p>
                        </div>

                        {/* Right Truck Illustration */}
                        <div className="flex items-center justify-end pr-1">
                            <svg
                                viewBox="0 0 120 70"
                                className="h-[52px] w-[95px]"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Truck Cab */}
                                <path
                                    d="M75 18H94C96.5 18 98.8 19.3 100 21.5L108 36.5C108.7 37.7 109 39.1 109 40.5V52C109 53.7 107.7 55 106 55H102C102 49.5 97.5 45 92 45C86.5 45 82 49.5 82 55H75V18Z"
                                    fill="#1e293b"
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                {/* Windshield */}
                                <path
                                    d="M78 22H92L99 35H78V22Z"
                                    fill="#93c5fd"
                                    stroke="#0f172a"
                                    strokeWidth="1"
                                />
                                {/* Trailer Body */}
                                <rect
                                    x="10"
                                    y="12"
                                    width="64"
                                    height="43"
                                    rx="2"
                                    fill="#e2e8f0"
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                {/* Trailer Lines & Decals */}
                                <line x1="10" y1="20" x2="74" y2="20" stroke="#94a3b8" strokeWidth="1" />
                                <line x1="10" y1="28" x2="74" y2="28" stroke="#ef4444" strokeWidth="2.5" />
                                <line x1="10" y1="36" x2="74" y2="36" stroke="#94a3b8" strokeWidth="1" />
                                {/* Wheels Trailer */}
                                <circle cx="24" cy="55" r="7" fill="#0f172a" />
                                <circle cx="24" cy="55" r="3.5" fill="#cbd5e1" />
                                <circle cx="40" cy="55" r="7" fill="#0f172a" />
                                <circle cx="40" cy="55" r="3.5" fill="#cbd5e1" />
                                {/* Wheel Cab */}
                                <circle cx="92" cy="55" r="7" fill="#0f172a" />
                                <circle cx="92" cy="55" r="3.5" fill="#cbd5e1" />
                                {/* Headlight */}
                                <rect x="107" y="44" width="3" height="4" rx="1" fill="#facc15" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. Green Pill Banner */}
                <div className="pdf-green-banner pdf-border mb-2.5 rounded-full py-1.5 text-center">
                    <span className="text-[13px] font-black uppercase tracking-wide text-black">
                        CONTROL DE ASISTENCIAS DE PERSONAL
                    </span>
                </div>

                {/* 3. Prestador de Servicio Bar */}
                <div className="pdf-border mb-2.5 px-3 py-1 bg-white">
                    <p className="text-[10.5px] font-black uppercase text-black leading-tight">
                        PRESTADOR DE SERVICIO:{" "}
                        <span className="font-extrabold tracking-tight">
                            {attendance.service_provider || "OBRAS Y SERVICIOS INDUSTRIALES SAN MARTIN, SA DE CV"}
                        </span>
                    </p>
                </div>

                {/* 4. Turno / Area / Fecha Grid */}
                <div className="grid grid-cols-3 gap-5 mb-2.5">
                    {/* Turno */}
                    <div className="pdf-border text-center overflow-hidden">
                        <div className="pdf-green-header pdf-cell-border border-t-0 border-x-0 py-0.5 font-black text-[10px] uppercase text-black">
                            TURNO
                        </div>
                        <div className="py-1 text-[11px] font-black text-black">
                            {attendance.shift || "1A"}
                        </div>
                    </div>

                    {/* Area de Trabajo */}
                    <div className="pdf-border text-center overflow-hidden">
                        <div className="pdf-green-header pdf-cell-border border-t-0 border-x-0 py-0.5 font-black text-[10px] uppercase text-black">
                            AREA DE TRABAJO
                        </div>
                        <div className="py-1 text-[11px] font-black text-black">
                            {attendance.work_area || "APT 2"}
                        </div>
                    </div>

                    {/* Fecha */}
                    <div className="pdf-border text-center overflow-hidden">
                        <div className="pdf-green-header pdf-cell-border border-t-0 border-x-0 py-0.5 font-black text-[10px] uppercase text-black">
                            FECHA:
                        </div>
                        <div className="py-1 text-[11px] font-black text-black">
                            {formattedDate || "08/09/2026"}
                        </div>
                    </div>
                </div>

                {/* 5. Actividad que se va a Realizar / Linea de Carga */}
                <div className="pdf-border mb-2.5 overflow-hidden">
                    <div className="grid grid-cols-[1fr_180px] pdf-green-header font-black text-[9.5px] uppercase text-black text-center">
                        <div className="pdf-cell-border border-t-0 border-l-0 border-b-0 py-0.5">
                            ACTIVIDAD QUE SE VA REALIZAR:
                        </div>
                        <div className="py-0.5">
                            LINEA DE CARGA
                        </div>
                    </div>
                    <div className="grid grid-cols-[1fr_180px] text-[10px] font-black uppercase text-black text-center divide-x divide-black border-t border-black">
                        <div className="py-1 px-2">
                            {attendance.activity || "ENVASADO DE UREA EN SACO DE 25 Y ESTIBADO CAMION"}
                        </div>
                        <div className="py-1 px-2">
                            {attendance.loading_line || "GLS-APT-ENV (   )"}
                        </div>
                    </div>
                </div>

                {/* 6. Tabla: Personal que Realiza la Actividad */}
                <div className="pdf-border mb-2.5 overflow-hidden">
                    <div className="pdf-green-header font-black text-[10px] uppercase text-black text-center py-0.5 pdf-cell-border border-t-0 border-x-0">
                        PERSONAL QUE REALIZA LA ACTIVIDAD:
                    </div>
                    <table className="w-full text-[9.5px] border-collapse">
                        <thead>
                            <tr className="font-black text-black uppercase text-center border-b border-black">
                                <th className="pdf-cell-border border-t-0 border-l-0 py-0.5 w-[50px]">Num.</th>
                                <th className="pdf-cell-border border-t-0 py-0.5">NOMBRE</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[140px]">FIRMA</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[65px]">H.E</th>
                                <th className="pdf-cell-border border-t-0 border-r-0 py-0.5 w-[65px]">H.S</th>
                            </tr>
                        </thead>
                        <tbody>
                            {personnelRows.map((row, index) => (
                                <tr key={index} className="border-b border-black last:border-b-0 h-[21px]">
                                    <td className="pdf-cell-border border-l-0 text-center font-bold text-black py-0.5">
                                        {row.num || String(index + 1).padStart(2, "0")}
                                    </td>
                                    <td className="pdf-cell-border px-3 font-black text-black uppercase py-0.5">
                                        {row.name || ""}
                                    </td>
                                    <td className="pdf-cell-border text-center text-[8.5px] text-slate-600 py-0.5">
                                        {row.signature || ""}
                                    </td>
                                    <td className="pdf-cell-border text-center font-black text-black py-0.5">
                                        {row.entry_time || "7:00"}
                                    </td>
                                    <td className="pdf-cell-border border-r-0 text-center font-black text-black py-0.5">
                                        {row.exit_time || "19.00"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 7. Tabla: Líder de Cuadrilla Responsable */}
                <div className="pdf-border mb-2.5 overflow-hidden">
                    <div className="pdf-green-header font-black text-[10px] uppercase text-black text-center py-0.5 pdf-cell-border border-t-0 border-x-0">
                        LIDER DE CUADRILLA RESPONSABLE
                    </div>
                    <table className="w-full text-[9.5px] border-collapse">
                        <thead>
                            <tr className="font-black text-black uppercase text-center border-b border-black">
                                <th className="pdf-cell-border border-t-0 border-l-0 py-0.5 w-[50px]">Num.</th>
                                <th className="pdf-cell-border border-t-0 py-0.5">NOMBRE</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[140px]">FIRMA</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[65px]">H.E</th>
                                <th className="pdf-cell-border border-t-0 border-r-0 py-0.5 w-[65px]">H.S</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-[21px]">
                                <td className="pdf-cell-border border-l-0 text-center font-bold text-black py-0.5">
                                    {squadLeader.num || "01"}
                                </td>
                                <td className="pdf-cell-border px-3 font-black text-black uppercase py-0.5">
                                    {squadLeader.name || ""}
                                </td>
                                <td className="pdf-cell-border text-center text-[8.5px] text-slate-600 py-0.5">
                                    {squadLeader.signature || ""}
                                </td>
                                <td className="pdf-cell-border text-center font-black text-black py-0.5">
                                    {squadLeader.entry_time || "7:00"}
                                </td>
                                <td className="pdf-cell-border border-r-0 text-center font-black text-black py-0.5">
                                    {squadLeader.exit_time || "19.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 8. Tabla: Supervisor Responsable de Seguridad del Prestador */}
                <div className="pdf-border mb-3 overflow-hidden">
                    <div className="pdf-green-header font-black text-[10px] uppercase text-black text-center py-0.5 pdf-cell-border border-t-0 border-x-0">
                        SUPERVISOR RESPONSABLE DE SEGURIDAD DEL PRESTADOR DE SERVICIO
                    </div>
                    <table className="w-full text-[9.5px] border-collapse">
                        <thead>
                            <tr className="font-black text-black uppercase text-center border-b border-black">
                                <th className="pdf-cell-border border-t-0 border-l-0 py-0.5 w-[50px]">Num.</th>
                                <th className="pdf-cell-border border-t-0 py-0.5">NOMBRE</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[140px]">FIRMA</th>
                                <th className="pdf-cell-border border-t-0 py-0.5 w-[65px]">H.E</th>
                                <th className="pdf-cell-border border-t-0 border-r-0 py-0.5 w-[65px]">H.S</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-[21px]">
                                <td className="pdf-cell-border border-l-0 text-center font-bold text-black py-0.5">
                                    {safetySupervisor.num || "01"}
                                </td>
                                <td className="pdf-cell-border px-3 font-black text-black uppercase py-0.5">
                                    {safetySupervisor.name || ""}
                                </td>
                                <td className="pdf-cell-border text-center text-[8.5px] text-slate-600 py-0.5">
                                    {safetySupervisor.signature || ""}
                                </td>
                                <td className="pdf-cell-border text-center font-black text-black py-0.5">
                                    {safetySupervisor.entry_time || "7:00"}
                                </td>
                                <td className="pdf-cell-border border-r-0 text-center font-black text-black py-0.5">
                                    {safetySupervisor.exit_time || "19.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 9. Observaciones Box */}
                <div className="pdf-border mb-6 p-2 min-h-[50px]">
                    <p className="text-[10px] font-black uppercase text-black mb-1">
                        OBSERVACIONES:
                    </p>
                    <p className="text-[9.5px] font-medium text-black whitespace-pre-wrap pl-2">
                        {attendance.observations || ""}
                    </p>
                </div>

                {/* 10. Footer Signature Block */}
                <div className="mt-8 pt-4 text-center">
                    <div className="mx-auto w-64 border-t border-black mb-1"></div>
                    <p className="text-[10.5px] font-black tracking-tight text-black uppercase">
                        {attendance.supervision_name || "PRO-AGROINDUSTRIA, S.A. DE C.V."}
                    </p>
                    <p className="text-[10px] font-black tracking-widest text-black uppercase">
                        SUPERVISIÓN
                    </p>
                </div>
            </div>
        </div>
    );
}
