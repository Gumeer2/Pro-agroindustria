import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Clock,
    FileSpreadsheet,
    Plus,
    Printer,
    Save,
    Trash2,
    UserCheck,
    UserCog,
    Users,
    Wrench,
    Copy,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import ServiceProviderDropdown from "@/Components/ServiceProviderDropdown";

interface PersonnelRow {
    num: string;
    name: string;
    signature: string;
    entry_time: string;
    exit_time: string;
}

interface Props {
    auth: any;
    serviceProviders?: { id: number; name: string }[];
    defaults: {
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
    };
}

export default function Create({ auth = {}, defaults = {} as any, serviceProviders = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        format_code: defaults?.format_code || "GLS-AP-FO-005",
        service_provider: defaults?.service_provider || "",
        shift: defaults?.shift || "",
        work_area: defaults?.work_area || "",
        date: defaults?.date || new Date().toISOString().split("T")[0],
        activity: defaults?.activity || "",
        loading_line: defaults?.loading_line || "GLS-APT-ENV (   )",
        personnel: Array.isArray(defaults?.personnel) ? defaults.personnel : [],
        squad_leader: Array.isArray(defaults?.squad_leader) ? defaults.squad_leader : [{ num: "01", name: "", signature: "", entry_time: "07:00", exit_time: "19:00" }],
        safety_supervisor: Array.isArray(defaults?.safety_supervisor) ? defaults.safety_supervisor : [{ num: "01", name: "", signature: "", entry_time: "07:00", exit_time: "19:00" }],
        observations: defaults?.observations || "",
        supervision_name: defaults?.supervision_name || "PRO-AGROINDUSTRIA, S.A. DE C.V.",
    });

    const [bulkEntry, setBulkEntry] = useState("07:00");
    const [bulkExit, setBulkExit] = useState("19:00");
    const [showBulkModal, setShowBulkModal] = useState(false);

    const shiftOptions = ["1A", "1B", "Turno 1", "Turno 2", "Turno 3", "2A", "2B", "3A", "3B"];
    const workAreaOptions = ["APT 2", "APT 1", "APT 3", "APT 4", "APT 5", "Muelle APT", "Área de Envasado"];
    const activityPresets = [
        "ENVASADO DE UREA EN SACO DE 25 Y ESTIBADO CAMION",
        "ENVASADO DE UREA EN SACO DE 50 Y ESTIBADO CAMION",
        "CARGA DE UREA A GRANEL EN CAMION",
        "DESCARGA Y ESTIBADO DE PRODUCTO TERMINADO",
        "RECEPCION Y ACOMODO DE SACOS EN ALMACEN",
        "LIMPIEZA, ORDEN Y MANTENIMIENTO EN AREA APT",
    ];

    // Add personnel row
    const handleAddPersonnelRow = () => {
        const nextNum = String(data.personnel.length + 1).padStart(2, "0");
        setData("personnel", [
            ...data.personnel,
            {
                num: nextNum,
                name: "",
                signature: "",
                entry_time: bulkEntry || "07:00",
                exit_time: bulkExit || "19:00",
            },
        ]);
    };

    // Remove personnel row
    const handleRemovePersonnelRow = (index: number) => {
        const updated = data.personnel.filter((_, i) => i !== index).map((row, i) => ({
            ...row,
            num: String(i + 1).padStart(2, "0"),
        }));
        setData("personnel", updated);
    };

    // Update personnel row
    const handlePersonnelChange = (index: number, field: keyof PersonnelRow, value: string) => {
        const updated = [...data.personnel];
        updated[index] = { ...updated[index], [field]: value };
        setData("personnel", updated);
    };

    // Update squad leader row
    const handleSquadLeaderChange = (index: number, field: keyof PersonnelRow, value: string) => {
        const updated = [...data.squad_leader];
        updated[index] = { ...updated[index], [field]: value };
        setData("squad_leader", updated);
    };

    // Update safety supervisor row
    const handleSafetySupervisorChange = (index: number, field: keyof PersonnelRow, value: string) => {
        const updated = [...data.safety_supervisor];
        updated[index] = { ...updated[index], [field]: value };
        setData("safety_supervisor", updated);
    };

    // Apply bulk schedule to all personnel rows
    const handleApplyBulkSchedule = () => {
        const updated = data.personnel.map((row) => ({
            ...row,
            entry_time: bulkEntry,
            exit_time: bulkExit,
        }));
        setData("personnel", updated);
        setShowBulkModal(false);
    };

    // Auto sync squad leader as first worker if empty
    const handleSyncSquadLeader = () => {
        if (data.personnel.length > 0 && data.personnel[0].name) {
            const firstWorker = data.personnel[0];
            setData("squad_leader", [
                {
                    num: "01",
                    name: firstWorker.name,
                    signature: firstWorker.signature,
                    entry_time: firstWorker.entry_time,
                    exit_time: firstWorker.exit_time,
                },
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("apt.attendance.store"));
    };

    return (
        <DashboardLayout user={auth?.user} header="Gestión de Prestadores de Servicios">
            <Head title="Nuevo Control de Asistencias - GLS-AP-FO-005" />

            <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Navigation Bar */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("apt.attendance.index")}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Prestadores de Servicios
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                                Formato Oficial {data.format_code}
                            </span>
                        </div>
                    </div>

                    {/* Main Form Shell */}
                    <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-blue-900 px-6 py-7 text-white sm:px-10">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-inner">
                                        <img src="/Proagro.png" alt="Proagroindustria" className="h-full w-full object-contain" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-sky-200">
                                                APT · Formato {data.format_code}
                                            </span>
                                        </div>
                                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                                            Control de Asistencias de Personal
                                        </h1>
                                        <p className="text-xs font-semibold text-sky-100/90">
                                            Almacén de Producto Terminado · Registro operativo de turno y prestadores de servicio
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-black text-white shadow-lg shadow-emerald-700/30 transition hover:bg-emerald-500 disabled:opacity-50"
                                    >
                                        <Save className="h-5 w-5" />
                                        {processing ? "Guardando..." : "Guardar e Imprimir"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6 sm:p-10 space-y-8">
                            {/* Section 1: Datos Generales */}
                            <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                                <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-sky-900">
                                    <Building2 className="h-4 w-4 text-sky-600" />
                                    1. Datos Generales del Servicio y Turno
                                </h2>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {/* Prestador de Servicio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Prestador de Servicios *
                                        </label>
                                        <ServiceProviderDropdown
                                            value={data.service_provider}
                                            initialProviders={serviceProviders}
                                            onChange={(name) => setData("service_provider", name)}
                                            error={errors.service_provider}
                                        />
                                    </div>

                                    {/* Turno */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Turno *
                                        </label>
                                        <select
                                            value={data.shift}
                                            onChange={(e) => setData("shift", e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        >
                                            <option value="">Seleccione un turno...</option>
                                            {shiftOptions.map((s, idx) => (
                                                <option key={idx} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        {errors.shift && (
                                            <p className="mt-1 text-xs font-bold text-red-600">{errors.shift}</p>
                                        )}
                                    </div>

                                    {/* Área de Trabajo */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Área de Trabajo *
                                        </label>
                                        <select
                                            value={data.work_area}
                                            onChange={(e) => setData("work_area", e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        >
                                            <option value="">Seleccione un área...</option>
                                            {workAreaOptions.map((w, idx) => (
                                                <option key={idx} value={w}>{w}</option>
                                            ))}
                                        </select>
                                        {errors.work_area && (
                                            <p className="mt-1 text-xs font-bold text-red-600">{errors.work_area}</p>
                                        )}
                                    </div>

                                    {/* Fecha */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Fecha de Registro *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={data.date}
                                                onChange={(e) => setData("date", e.target.value)}
                                                required
                                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                            />
                                        </div>
                                        {errors.date && (
                                            <p className="mt-1 text-xs font-bold text-red-600">{errors.date}</p>
                                        )}
                                    </div>

                                    {/* Actividad que se va a realizar */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Actividad que se va a Realizar *
                                        </label>
                                        <select
                                            value={data.activity}
                                            onChange={(e) => setData("activity", e.target.value)}
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        >
                                            <option value="">Seleccione una actividad...</option>
                                            {activityPresets.map((a, idx) => (
                                                <option key={idx} value={a}>{a}</option>
                                            ))}
                                        </select>
                                        {errors.activity && (
                                            <p className="mt-1 text-xs font-bold text-red-600">{errors.activity}</p>
                                        )}
                                    </div>

                                    {/* Línea de Carga */}
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                                            Línea de Carga
                                        </label>
                                        <input
                                            type="text"
                                            value={data.loading_line}
                                            onChange={(e) => setData("loading_line", e.target.value)}
                                            placeholder="ej. GLS-APT-ENV (   )"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 shadow-sm transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Personal que Realiza la Actividad */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-sky-900">
                                            <Users className="h-4 w-4 text-sky-600" />
                                            2. Personal que Realiza la Actividad ({data.personnel.length} Registrados)
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Registra el listado de trabajadores, hora de entrada (H.E) y hora de salida (H.S).
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowBulkModal(true)}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
                                        >
                                            <Clock className="h-3.5 w-3.5" />
                                            Copiar Horarios a Todos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddPersonnelRow}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-sky-700"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Agregar Fila
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#bbf7d0] text-emerald-950 font-black uppercase tracking-wider border-b border-emerald-300">
                                            <tr>
                                                <th className="py-3 px-3 text-center w-16">Num.</th>
                                                <th className="py-3 px-4 min-w-[280px]">Nombre Completo del Trabajador</th>
                                                <th className="py-3 px-3 text-center w-28">Firma / Estado</th>
                                                <th className="py-3 px-3 text-center w-28">H.E (Entrada)</th>
                                                <th className="py-3 px-3 text-center w-28">H.S (Salida)</th>
                                                <th className="py-3 px-2 text-center w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {data.personnel.map((row, index) => (
                                                <tr key={index} className="transition hover:bg-slate-50/80">
                                                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                                                        <input
                                                            type="text"
                                                            value={row.num}
                                                            onChange={(e) => handlePersonnelChange(index, "num", e.target.value)}
                                                            className="w-12 text-center rounded-lg border border-slate-200 py-1 font-bold text-slate-700 focus:border-sky-500 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-4">
                                                        <input
                                                            type="text"
                                                            value={row.name}
                                                            onChange={(e) => handlePersonnelChange(index, "name", e.target.value)}
                                                            placeholder={`Nombre trabajador #${row.num}`}
                                                            className="w-full uppercase rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="text"
                                                            value={row.signature || ""}
                                                            onChange={(e) => handlePersonnelChange(index, "signature", e.target.value)}
                                                            placeholder="Firma física"
                                                            className="w-full text-center rounded-lg border border-slate-200 py-1.5 text-xs text-slate-600 focus:border-sky-500 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="text"
                                                            value={row.entry_time}
                                                            onChange={(e) => handlePersonnelChange(index, "entry_time", e.target.value)}
                                                            placeholder="07:00"
                                                            className="w-full text-center font-bold rounded-lg border border-slate-200 py-1.5 text-slate-700 focus:border-sky-500 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="text"
                                                            value={row.exit_time}
                                                            onChange={(e) => handlePersonnelChange(index, "exit_time", e.target.value)}
                                                            placeholder="19:00"
                                                            className="w-full text-center font-bold rounded-lg border border-slate-200 py-1.5 text-slate-700 focus:border-sky-500 focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePersonnelRow(index)}
                                                            title="Eliminar fila"
                                                            className="text-slate-300 hover:text-red-500 p-1 transition"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            {/* Section 3: Responsables y Supervisión */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Líder de Cuadrilla */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-lg">
                                            Líder de Cuadrilla Responsable
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={handleSyncSquadLeader}
                                            className="text-[11px] font-bold text-sky-600 hover:text-sky-800"
                                        >
                                            Copiar trabajador #1
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                Nombre Completo del Líder
                                            </label>
                                            <input
                                                type="text"
                                                value={data.squad_leader[0]?.name || ""}
                                                onChange={(e) => handleSquadLeaderChange(0, "name", e.target.value)}
                                                placeholder="ej. NAHUM ANTONIO MORALES MONTEJO"
                                                className="w-full uppercase rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                    H.E (Entrada)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.squad_leader[0]?.entry_time || "07:00"}
                                                    onChange={(e) => handleSquadLeaderChange(0, "entry_time", e.target.value)}
                                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                    H.S (Salida)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.squad_leader[0]?.exit_time || "19:00"}
                                                    onChange={(e) => handleSquadLeaderChange(0, "exit_time", e.target.value)}
                                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Supervisor de Seguridad del Prestador */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-3">
                                        <h2 className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-lg">
                                            Supervisor Responsable de Seguridad del Prestador
                                        </h2>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                Nombre Completo del Supervisor
                                            </label>
                                            <input
                                                type="text"
                                                value={data.safety_supervisor[0]?.name || ""}
                                                onChange={(e) => handleSafetySupervisorChange(0, "name", e.target.value)}
                                                placeholder="ej. ING. MARIA JOSE MARTINEZ SALINAS"
                                                className="w-full uppercase rounded-xl border border-slate-300 px-4 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                    H.E (Entrada)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.safety_supervisor[0]?.entry_time || "07:00"}
                                                    onChange={(e) => handleSafetySupervisorChange(0, "entry_time", e.target.value)}
                                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                                                    H.S (Salida)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.safety_supervisor[0]?.exit_time || "19:00"}
                                                    onChange={(e) => handleSafetySupervisorChange(0, "exit_time", e.target.value)}
                                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Section 4: Observaciones y Supervisión */}
                            <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                                <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-700">
                                    Observaciones Adicionales
                                </h2>
                                <textarea
                                    rows={3}
                                    value={data.observations}
                                    onChange={(e) => setData("observations", e.target.value)}
                                    placeholder="Escribe aquí cualquier incidencia, nota relevante o condición operativa especial del turno..."
                                    className="w-full rounded-xl border border-slate-300 bg-white p-4 font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />

                                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
                                    <div className="text-xs text-slate-500 font-semibold">
                                        Supervisión: <span className="font-bold text-slate-700">{data.supervision_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={route("apt.attendance.index")}
                                            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            Cancelar
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <Save className="h-4 w-4" />
                                            {processing ? "Guardando..." : "Guardar y Ver Documento Imprimible"}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>
                </div>
            </main>

            {/* Modal para Copiar Horarios a Todos */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-3 text-sky-700">
                            <Clock className="h-6 w-6" />
                            <h3 className="text-lg font-black">Asignar Horario Masivo</h3>
                        </div>
                        <p className="mb-4 text-xs text-slate-600">
                            Indica la hora de entrada y salida para aplicarlas automáticamente a todos los trabajadores de la lista.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                                    Hora Entrada (H.E)
                                </label>
                                <input
                                    type="text"
                                    value={bulkEntry}
                                    onChange={(e) => setBulkEntry(e.target.value)}
                                    placeholder="07:00"
                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                                    Hora Salida (H.S)
                                </label>
                                <input
                                    type="text"
                                    value={bulkExit}
                                    onChange={(e) => setBulkExit(e.target.value)}
                                    placeholder="19:00"
                                    className="w-full text-center rounded-xl border border-slate-300 py-2 font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowBulkModal(false)}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyBulkSchedule}
                                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-sky-700"
                            >
                                Aplicar a Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
