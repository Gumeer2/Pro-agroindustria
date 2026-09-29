import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Building2,
    Calendar,
    Clock,
    Edit3,
    FileSpreadsheet,
    FileText,
    Plus,
    Printer,
    Search,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";

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
    personnel: any;
    user?: { id: number; name: string };
    created_at: string;
}

interface PaginatedData {
    data?: Attendance[];
    current_page?: number;
    last_page?: number;
    total?: number;
    links?: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    auth?: any;
    attendances?: PaginatedData;
    filters?: {
        search?: string;
        date?: string;
        shift?: string;
    };
}

export default function Index({ auth = {}, attendances = {}, filters = {} }: Props) {
    const activeFilters = Array.isArray(filters) ? {} : filters || {};
    const [searchTerm, setSearchTerm] = useState(activeFilters.search || "");
    const [dateFilter, setDateFilter] = useState(activeFilters.date || "");
    const [shiftFilter, setShiftFilter] = useState(activeFilters.shift || "all");

    const items: Attendance[] = Array.isArray(attendances?.data) ? attendances.data : [];
    const paginationLinks = Array.isArray(attendances?.links) ? attendances.links : [];
    const totalCount = attendances?.total ?? items.length;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route("apt.attendance.index"),
            {
                search: searchTerm,
                date: dateFilter,
                shift: shiftFilter,
            },
            { preserveState: true }
        );
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setShiftFilter("all");
        router.get(route("apt.attendance.index"));
    };

    const handleDelete = (id: number, folio: string) => {
        if (confirm(`¿Estás seguro de eliminar el registro ${folio || `#${id}`}?`)) {
            router.delete(route("apt.attendance.destroy", id));
        }
    };

    const formatDate = (dateVal: any) => {
        if (!dateVal) return "—";
        try {
            const str = String(dateVal);
            const datePart = str.split("T")[0];
            const parts = datePart.split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return datePart;
        } catch (e) {
            return "—";
        }
    };

    const getPersonnelCount = (personnel: any): number => {
        if (Array.isArray(personnel)) return personnel.length;
        if (typeof personnel === "string") {
            try {
                const parsed = JSON.parse(personnel);
                return Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) {
                return 0;
            }
        }
        return 0;
    };

    return (
        <DashboardLayout user={auth?.user} header="Gestión de Prestadores de Servicios">
            <Head title="Gestión Prestadores de Servicios - Control de Asistencias" />

            <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Navigation bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("apt.production")}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver a Gestión de Almacenes
                            </Link>
                        </div>
                        <Link
                            href={route("apt.attendance.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-700/25 transition hover:bg-emerald-500"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Registro (GLS-AP-FO-005)
                        </Link>
                    </div>

                    {/* Banner header */}
                    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-sky-800 via-sky-700 to-blue-900 p-6 text-white shadow-xl sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-inner">
                                    <Users className="h-8 w-8 text-sky-700" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-sky-600/60 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-sky-100">
                                            Submódulo APT · Formato Oficial
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                                        Gestión de Prestadores de Servicios
                                    </h1>
                                    <p className="text-xs font-semibold text-sky-100/90">
                                        Control de asistencias de personal y prestadores de servicios operativos (Formato GLS-AP-FO-005)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                                    Buscar (Prestador, Actividad, Folio)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar..."
                                        className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2 font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                                    Filtrar por Fecha
                                </label>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                                    Turno
                                </label>
                                <select
                                    value={shiftFilter}
                                    onChange={(e) => setShiftFilter(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 font-medium text-slate-800 focus:border-sky-500 focus:bg-white focus:outline-none"
                                >
                                    <option value="all">Todos los turnos</option>
                                    <option value="1A">1A</option>
                                    <option value="1B">1B</option>
                                    <option value="Turno 1">Turno 1</option>
                                    <option value="Turno 2">Turno 2</option>
                                    <option value="Turno 3">Turno 3</option>
                                    <option value="2A">2A</option>
                                    <option value="2B">2B</option>
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow hover:bg-sky-700 transition"
                                >
                                    Filtrar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table of Records */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-black uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-4">Folio / Formato</th>
                                        <th className="py-3.5 px-4">Fecha</th>
                                        <th className="py-3.5 px-4">Turno / Área</th>
                                        <th className="py-3.5 px-4">Prestador de Servicio</th>
                                        <th className="py-3.5 px-4">Actividad Realizada</th>
                                        <th className="py-3.5 px-4 text-center">Personal</th>
                                        <th className="py-3.5 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                <UserCheck className="mx-auto h-12 w-12 text-slate-300 mb-2" />
                                                <p className="font-bold text-sm text-slate-600">No hay registros de asistencias disponibles.</p>
                                                <p className="text-xs text-slate-400 mt-1">Haz clic en "Nuevo Registro" para crear el primero.</p>
                                                <Link
                                                    href={route("apt.attendance.create")}
                                                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-sky-700"
                                                >
                                                    <Plus className="h-4 w-4" /> Crear Nuevo Registro
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.id} className="transition hover:bg-sky-50/50">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-black text-sky-900">{item.folio || `CAP-${item.id}`}</div>
                                                    <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                                                        {item.format_code}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-700">
                                                    {formatDate(item.date)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-black text-slate-800">{item.shift}</div>
                                                    <div className="text-[11px] text-slate-500 font-semibold">{item.work_area}</div>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[220px] truncate" title={item.service_provider}>
                                                    {item.service_provider}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600 max-w-[240px] truncate" title={item.activity}>
                                                    {item.activity}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-black text-sky-800">
                                                        <Users className="h-3 w-3" />
                                                        {getPersonnelCount(item.personnel)}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={route("apt.attendance.print", item.id)}
                                                            title="Ver e Imprimir Formato"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-700 transition hover:bg-emerald-100 shadow-sm"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Link>
                                                        <Link
                                                            href={route("apt.attendance.edit", item.id)}
                                                            title="Editar Registro"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 p-2 text-sky-700 transition hover:bg-sky-100 shadow-sm"
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item.id, item.folio)}
                                                            title="Eliminar"
                                                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 p-2 text-red-600 transition hover:bg-red-100 shadow-sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {paginationLinks.length > 3 && (
                            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
                                <div className="text-xs text-slate-500">
                                    Mostrando {items.length} de {totalCount} registros
                                </div>
                                <div className="flex gap-1">
                                    {paginationLinks.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                link.active
                                                    ? "bg-sky-600 text-white shadow"
                                                    : link.url
                                                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                                    : "cursor-not-allowed text-slate-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}
