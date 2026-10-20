import React, { useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Calendar, Search, X, ShieldAlert, Filter, UserX } from "lucide-react";

interface VetoedOperator {
    id: number;
    type?: string;
    name: string;
    license?: string;
    transport_line?: string;
    real_transport_line?: string;
    economic_number?: string;
    unit_type?: string;
    brand_model?: string;
    tractor_plate?: string;
    trailer_plate?: string;
    policy?: string;
    validity?: string;
    status?: string;
    veto_reason?: string;
    vetoed_at?: string;
    vetoed_by_name?: string;
}

interface FiltersData {
    search?: string;
    date_from?: string;
    date_to?: string;
}

interface Props {
    operators: VetoedOperator[];
    filters: FiltersData;
    auto_print?: boolean;
    generated_at: string;
    supervisor: string;
    position: string;
    company: string;
}

export default function VetoReport({
    operators = [],
    filters = { search: "", date_from: "", date_to: "" },
    auto_print = false,
    generated_at,
    supervisor = "C. José Alfredo Fernández Jiadan",
    position = "Jefe de Vigilancia Física",
    company = "Pro-Agroindustria, S.A. de C.V.",
}: Props) {
    const { props } = usePage<any>();
    const tenant = props?.tenant;

    const [search, setSearch] = useState(filters.search || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");

    useEffect(() => {
        if (auto_print) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [auto_print]);

    const handleApplyFilters = () => {
        const payload: any = {};
        if (search.trim()) payload.search = search.trim();
        if (dateFrom) payload.date_from = dateFrom;
        if (dateTo) payload.date_to = dateTo;

        router.get(route("surveillance.veto.report"), payload, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        router.get(route("surveillance.veto.report"), {}, { preserveState: true, preserveScroll: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            return d.toLocaleString("es-MX", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const hasActiveFilters = Boolean(search || dateFrom || dateTo);

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-black font-sans">
            <Head title="Reporte Oficial de Operadores Vetados - Vigilancia Física" />

            {/* Top Toolbar (Hidden on Print) */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-3 space-y-3">
                <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("surveillance.veto")}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Regresar al Módulo de Veto</span>
                        </Link>
                        <div>
                            <h1 className="text-sm sm:text-base font-black text-gray-900 uppercase flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                Reporte de Operadores Vetados
                            </h1>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Padrón de Sanciones y Restricciones de Acceso • Vigilancia Física
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase transition-colors"
                                title="Limpiar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Limpiar Filtros</span>
                            </button>
                        )}

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-red-200 transition-all cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Imprimir Reporte</span>
                        </button>
                    </div>
                </div>

                {/* Filter Controls Row */}
                <div className="max-w-[1700px] mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-end gap-3">
                    {/* Search Input */}
                    <div className="flex-1 min-w-[220px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Buscar Operador, Placa, Línea o Motivo
                        </label>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-red-500 shadow-sm">
                            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                                placeholder="Escriba nombre, placas, motivo..."
                                className="w-full border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 placeholder:font-normal placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Date From */}
                    <div className="w-44">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Fecha Desde
                        </label>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-red-500 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Date To */}
                    <div className="w-44">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Fecha Hasta
                        </label>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-red-500 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={handleApplyFilters}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filtrar</span>
                    </button>
                </div>
            </div>

            {/* Printable Report Sheet */}
            <div className="py-6 print:py-0 px-2 sm:px-4">
                <div className="w-full max-w-[1550px] mx-auto bg-white p-6 print:p-2 border print:border-none shadow-md print:shadow-none min-h-[800px]">

                    {/* RED HEADER BANNER (Official Company Format) */}
                    <div className="bg-[#990000] text-white flex items-center justify-between px-4 py-3 border border-[#990000] relative">
                        {/* Logo Container */}
                        <div className="w-36 h-14 bg-white/95 rounded p-1 flex items-center justify-center flex-shrink-0">
                            <img
                                src={tenant?.logo || "/images/logo_proagro.png"}
                                alt="Logo"
                                className="max-h-full max-w-full object-contain"
                                onError={(e: any) => {
                                    e.target.onerror = null;
                                    e.target.src = "/images/LOG.png";
                                }}
                            />
                        </div>

                        {/* Title text */}
                        <div className="flex-1 text-center px-4">
                            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase leading-tight font-serif">
                                PRO-AGROINDUSTRIA, S.A. DE C.V.
                            </h2>
                            <p className="text-[11px] font-bold tracking-widest uppercase mt-0.5 text-red-100">
                                DEPARTAMENTO DE VIGILANCIA FÍSICA Y SEGURIDAD PATRIMONIAL
                            </p>
                            <p className="text-xs font-black tracking-widest uppercase mt-1 text-yellow-300">
                                PADRÓN OFICIAL DE OPERADORES VETADOS Y RESTRINGIDOS
                            </p>
                        </div>

                        {/* Metadata Box */}
                        <div className="w-40 text-right text-[10px] space-y-0.5 flex-shrink-0 font-mono">
                            <p className="text-red-200">FECHA DE EMISIÓN:</p>
                            <p className="font-bold text-white text-[11px]">{generated_at}</p>
                            <p className="text-yellow-300 font-bold uppercase mt-1">
                                TOTAL VETADOS: {operators.length}
                            </p>
                        </div>
                    </div>

                    {/* Report Information Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-x border-b border-slate-300 text-[11px] text-slate-700">
                        <div>
                            <span className="font-bold text-slate-900 uppercase">DOCUMENTO:</span> REGISTRO OFICIAL DE SANCIONES DE ACCESO VEHICULAR Y PEATONAL
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 uppercase">ESTATUS:</span>{" "}
                            <span className="bg-red-100 text-red-800 font-black px-2 py-0.5 rounded border border-red-300">
                                ACCESO DENEGADO / VETO VIGENTE
                            </span>
                        </div>
                    </div>

                    {/* Operators Table */}
                    <div className="mt-4 border border-slate-300 overflow-x-auto">
                        <table className="w-full border-collapse text-[11px]">
                            <thead>
                                <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-300 font-black uppercase text-[10px]">
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-10">No.</th>
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-16">ID Gafete</th>
                                    <th className="py-2.5 px-3 border-r border-slate-300 text-left w-52">Nombre del Operador</th>
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-28">Licencia</th>
                                    <th className="py-2.5 px-3 border-r border-slate-300 text-left w-48">Línea Transportista</th>
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-24">Placa Tracto</th>
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-24">Placa Remolque</th>
                                    <th className="py-2.5 px-2 border-r border-slate-300 text-center w-16">Econ.</th>
                                    <th className="py-2.5 px-2.5 border-r border-slate-300 text-center w-32">Fecha de Veto</th>
                                    <th className="py-2.5 px-3 border-r border-slate-300 text-left">Motivo / Causa de la Sanción</th>
                                    <th className="py-2.5 px-2.5 border-r border-slate-300 text-left w-36">Sancionado Por</th>
                                    <th className="py-2.5 px-2 text-center w-20">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {operators.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="py-12 text-center text-slate-500 bg-slate-50/50">
                                            <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                            <p className="font-bold text-sm text-slate-700 uppercase">
                                                No se encontraron operadores vetados {hasActiveFilters ? "que coincidan con los filtros aplicados." : "registrados en el sistema."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    operators.map((op, idx) => (
                                        <tr
                                            key={op.id || idx}
                                            className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"} hover:bg-red-50/40 transition-colors`}
                                        >
                                            {/* Consecutivo */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-bold text-slate-600">
                                                {idx + 1}
                                            </td>

                                            {/* ID */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black text-red-700">
                                                #{op.id}
                                            </td>

                                            {/* Operador */}
                                            <td className="py-2 px-3 border-r border-slate-300 font-black text-slate-900 uppercase">
                                                {op.name}
                                                {op.type && (
                                                    <span className="block text-[9px] font-bold text-slate-400 normal-case">
                                                        ({op.type === "vessel" ? "Operador de Muelle / Barco" : "Operador de Salidas"})
                                                    </span>
                                                )}
                                            </td>

                                            {/* Licencia */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                                                {op.license || "N/A"}
                                            </td>

                                            {/* Línea */}
                                            <td className="py-2 px-3 border-r border-slate-300 font-bold text-slate-800 uppercase">
                                                <div>{op.transport_line || "SIN LÍNEA"}</div>
                                                {op.real_transport_line && op.real_transport_line !== op.transport_line && (
                                                    <div className="text-[9px] text-slate-500 italic">
                                                        Real: {op.real_transport_line}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Placa Tracto */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-black text-slate-900">
                                                {op.tractor_plate || "S/P"}
                                            </td>

                                            {/* Placa Remolque */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-700">
                                                {op.trailer_plate || "S/P"}
                                            </td>

                                            {/* Económico */}
                                            <td className="py-2 px-2 border-r border-slate-300 text-center font-mono text-slate-700">
                                                {op.economic_number || "S/N"}
                                            </td>

                                            {/* Fecha de Veto */}
                                            <td className="py-2 px-2.5 border-r border-slate-300 text-center font-medium text-slate-700 text-[10px] whitespace-nowrap">
                                                {formatDate(op.vetoed_at)}
                                            </td>

                                            {/* Motivo */}
                                            <td className="py-2 px-3 border-r border-slate-300 font-medium text-red-950 text-[10.5px]">
                                                {op.veto_reason ? `"${op.veto_reason}"` : "Veto administrativo general"}
                                            </td>

                                            {/* Sancionado Por */}
                                            <td className="py-2 px-2.5 border-r border-slate-300 font-bold text-slate-700 text-[10px]">
                                                {op.vetoed_by_name || "Vigilancia Física"}
                                            </td>

                                            {/* Estatus */}
                                            <td className="py-2 px-2 text-center font-black">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 uppercase">
                                                    VETADO
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Section */}
                    <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-6">
                            <div>
                                <span className="font-bold text-slate-600 uppercase text-[10px] block">Total de Operadores Sancionados:</span>
                                <span className="text-base font-black text-red-700">{operators.length}</span>
                            </div>
                            <div>
                                <span className="font-bold text-slate-600 uppercase text-[10px] block">Condición:</span>
                                <span className="font-black text-slate-800 uppercase">Acceso Restringido en Todas las Plantas</span>
                            </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-medium">
                            <p>Pro-Agroindustria, S.A. de C.V. • Sistema de Vigilancia y Control de Accesos</p>
                            <p>Generado el {generated_at}</p>
                        </div>
                    </div>

                    {/* Signatures Block (Corporate / Official) */}
                    <div className="mt-12 pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
                        <div className="space-y-1">
                            <div className="h-14 border-b border-slate-400 w-3/4 mx-auto mb-2" />
                            <p className="font-black text-slate-900 uppercase">Personal de Guardia en Turno</p>
                            <p className="text-[11px] text-slate-500 font-medium uppercase">Caseta de Vigilancia Principal</p>
                        </div>
                        <div className="space-y-1">
                            <div className="h-14 border-b border-slate-400 w-3/4 mx-auto mb-2" />
                            <p className="font-black text-slate-900 uppercase">{supervisor}</p>
                            <p className="text-[11px] text-slate-500 font-medium uppercase">{position}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{company}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
