import React, { useEffect, useState } from "react";
import { Head, router, Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Calendar, RefreshCw, Filter, Search, X } from "lucide-react";

interface ReportRow {
    order_id: string;
    tons: string;
    tons_raw: number;
    order_folio: string;
    ticket_folio: string;
    exit_date: string;
    caseta_time: string;
    product: string;
    operator_name: string;
    transport_line: string;
    client: string;
    consignee: string;
    unit_type: string;
    plates: string;
}

interface SummaryData {
    total_tons: string;
    total_units: number;
    average: string;
}

interface FiltersData {
    start_date: string;
    end_date: string;
    program?: string;
    client?: string;
    consignee?: string;
}

interface Props {
    date?: string;
    start_date: string;
    end_date: string;
    filters: FiltersData;
    programs_list?: string[];
    clients_list?: string[];
    consignees_list?: string[];
    rows: ReportRow[];
    summary: SummaryData;
    supervisor: string;
    position: string;
    company: string;
}

export default function ExitsReport({
    start_date,
    end_date,
    filters = { start_date: "", end_date: "" },
    programs_list = [],
    clients_list = [],
    consignees_list = [],
    rows = [],
    summary,
    supervisor = "C. José Alfredo Fernández Jiadan",
    position = "Jefe de Vigilancia Física",
    company = "Pro- Agroindustria",
}: Props) {
    const { props } = usePage<any>();
    const tenant = props.tenant;

    const [startDate, setStartDate] = useState(filters.start_date || start_date);
    const [endDate, setEndDate] = useState(filters.end_date || end_date || start_date);
    const [program, setProgram] = useState(filters.program || "");
    const [client, setClient] = useState(filters.client || "");
    const [consignee, setConsignee] = useState(filters.consignee || "");

    const applyFilters = (override?: Partial<FiltersData>) => {
        const payload: any = {
            start_date: override?.start_date !== undefined ? override.start_date : startDate,
            end_date: override?.end_date !== undefined ? override.end_date : endDate,
            program: override?.program !== undefined ? override.program : program,
            client: override?.client !== undefined ? override.client : client,
            consignee: override?.consignee !== undefined ? override.consignee : consignee,
        };

        // Remove empty keys
        Object.keys(payload).forEach((k) => {
            if (!payload[k]) delete payload[k];
        });

        router.get(route("surveillance.exits.report"), payload, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearFilters = () => {
        const today = new Date().toISOString().split("T")[0];
        setStartDate(today);
        setEndDate(today);
        setProgram("");
        setClient("");
        setConsignee("");

        router.get(
            route("surveillance.exits.report"),
            { start_date: today, end_date: today },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const hasActiveFilters = !!(
        program ||
        client ||
        consignee ||
        startDate !== endDate
    );

    // Format date display for print header
    const formatPrintDate = () => {
        if (startDate === endDate) {
            const parts = startDate.split("-");
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return startDate;
        }
        const p1 = startDate.split("-");
        const p2 = endDate.split("-");
        const f1 = p1.length === 3 ? `${p1[2]}/${p1[1]}/${p1[0]}` : startDate;
        const f2 = p2.length === 3 ? `${p2[2]}/${p2[1]}/${p2[0]}` : endDate;
        return `DEL ${f1} AL ${f2}`;
    };

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-black font-sans">
            <Head title="Reporte de Salidas - Vigilancia Física" />

            {/* Top Toolbar (Hidden on Print) */}
            <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-3 space-y-3">
                <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route("surveillance.exits.index")}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Regresar</span>
                        </Link>
                        <div>
                            <h1 className="text-sm sm:text-base font-black text-gray-900 uppercase">
                                Reporte de Control de Salidas
                            </h1>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Vigilancia Física • Base de Datos de Salidas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button
                                onClick={handleClearFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold uppercase transition-colors"
                                title="Restablecer todos los filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Limpiar Filtros</span>
                            </button>
                        )}

                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Imprimir Reporte</span>
                        </button>
                    </div>
                </div>

                {/* Filter Controls Row */}
                <div className="max-w-[1700px] mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-end gap-3">
                    {/* Fecha Inicial */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Fecha Inicial
                        </label>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Fecha Final */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Fecha Final
                        </label>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 shadow-sm">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Programa / Producto Filter */}
                    <div className="flex-1 min-w-[190px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Programa / Producto
                        </label>
                        <select
                            value={program}
                            onChange={(e) => setProgram(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 shadow-sm"
                        >
                            <option value="">-- Todos los programas --</option>
                            {programs_list.map((prog, i) => (
                                <option key={i} value={prog}>
                                    {prog}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cliente Filter */}
                    <div className="flex-1 min-w-[190px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Cliente
                        </label>
                        <select
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 shadow-sm"
                        >
                            <option value="">-- Todos los clientes --</option>
                            {clients_list.map((cli, i) => (
                                <option key={i} value={cli}>
                                    {cli}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Consignado Filter */}
                    <div className="flex-1 min-w-[170px]">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Consignado
                        </label>
                        <select
                            value={consignee}
                            onChange={(e) => setConsignee(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:ring-0 shadow-sm"
                        >
                            <option value="">-- Todos los consignados --</option>
                            {consignees_list.map((cons, i) => (
                                <option key={i} value={cons}>
                                    {cons}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Action Button */}
                    <button
                        onClick={() => applyFilters()}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filtrar</span>
                    </button>
                </div>
            </div>

            {/* Printable Report Sheet */}
            <div className="py-6 print:py-0 px-2 sm:px-4">
                <div className="w-full max-w-[1450px] mx-auto bg-white p-6 print:p-2 border print:border-none shadow-md print:shadow-none min-h-[800px]">
                    
                    {/* RED HEADER BANNER */}
                    <div className="bg-[#990000] text-white flex items-center justify-between px-4 py-3 border border-[#990000] relative">
                        {/* Logo Container */}
                        <div className="w-32 h-14 bg-white/95 rounded p-1 flex items-center justify-center flex-shrink-0">
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

                        {/* Title Texts */}
                        <div className="flex-1 text-center pr-4 sm:pr-16">
                            <h1 className="text-xs sm:text-sm md:text-base font-black tracking-wider uppercase">
                                DEPARTAMENTO DE VIGILANCIA FÍSICA
                            </h1>
                            <h2 className="text-[11px] sm:text-xs font-black tracking-wider uppercase mt-0.5">
                                CONTROL DE SALIDAS
                            </h2>
                            <h3 className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mt-0.5">
                                BASE DE DATOS
                            </h3>
                            <div className="text-[9.5px] font-black uppercase tracking-wider mt-1 text-yellow-200">
                                {formatPrintDate()}
                                {client && ` • CLIENTE: ${client}`}
                                {program && ` • PROGRAMA: ${program}`}
                                {consignee && ` • CONSIGNADO: ${consignee}`}
                            </div>
                        </div>
                    </div>

                    {/* MAIN DATA TABLE */}
                    <div className="w-full overflow-x-auto mt-0 border-t-0">
                        <table className="w-full border-collapse border border-black text-[9px] leading-tight text-center">
                            <thead>
                                <tr className="bg-[#dcdcdc] text-black uppercase font-black text-[8.5px]">
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-16">
                                        TONELADAS CARGADAS
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-24">
                                        No. DE ORDEN ASIGNADO
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-24">
                                        FOLIO TICKET
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-20">
                                        FECHA DE SALIDA
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-20">
                                        HORA DE REGISTRO EN CASETA
                                    </th>
                                    <th className="border border-black px-2 py-2 whitespace-normal min-w-[140px]">
                                        PRODUCTO
                                    </th>
                                    <th className="border border-black px-2 py-2 whitespace-normal min-w-[130px]">
                                        NOMBRE DE OPERADOR
                                    </th>
                                    <th className="border border-black px-2 py-2 whitespace-normal min-w-[120px]">
                                        LINEA TRANSPORTISTA
                                    </th>
                                    <th className="border border-black px-2 py-2 whitespace-normal min-w-[120px]">
                                        CLIENTE
                                    </th>
                                    <th className="border border-black px-2 py-2 whitespace-normal min-w-[120px]">
                                        CONSIGNADO
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-24">
                                        TIPO DE UNIDAD
                                    </th>
                                    <th className="border border-black px-1.5 py-2 whitespace-normal w-20">
                                        PLACAS
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="border border-black py-8 text-center text-gray-500 font-bold text-xs uppercase">
                                            No se encontraron registros de salidas con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="border border-black px-1.5 py-2 font-black text-black">
                                                {row.tons}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 font-bold font-mono text-black">
                                                {row.order_folio}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 font-bold font-mono text-black">
                                                {row.ticket_folio}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 whitespace-nowrap">
                                                {row.exit_date}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 whitespace-nowrap">
                                                {row.caseta_time}
                                            </td>
                                            <td className="border border-black px-2 py-2 uppercase font-medium">
                                                {row.product}
                                            </td>
                                            <td className="border border-black px-2 py-2 uppercase font-bold text-gray-900">
                                                {row.operator_name}
                                            </td>
                                            <td className="border border-black px-2 py-2 uppercase font-medium">
                                                {row.transport_line}
                                            </td>
                                            <td className="border border-black px-2 py-2 uppercase font-medium">
                                                {row.client}
                                            </td>
                                            <td className="border border-black px-2 py-2 uppercase font-medium">
                                                {row.consignee}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 uppercase font-medium">
                                                {row.unit_type}
                                            </td>
                                            <td className="border border-black px-1.5 py-2 font-mono font-bold uppercase">
                                                {row.plates}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TOTALS SUMMARY TABLE */}
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
                        <div className="w-56">
                            <table className="w-full border-collapse border border-black text-[10px]">
                                <tbody>
                                    <tr>
                                        <td className="border border-black bg-[#dcdcdc] px-3 py-1.5 font-black uppercase text-black w-28">
                                            TONELADAS
                                        </td>
                                        <td className="border border-black bg-[#990000] text-white px-3 py-1.5 font-black text-center text-xs">
                                            {summary.total_tons}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black bg-[#dcdcdc] px-3 py-1.5 font-black uppercase text-black">
                                            UNIDADES
                                        </td>
                                        <td className="border border-black bg-[#990000] text-white px-3 py-1.5 font-black text-center text-xs">
                                            {summary.total_units}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black bg-[#dcdcdc] px-3 py-1.5 font-black uppercase text-black">
                                            PROMEDIO
                                        </td>
                                        <td className="border border-black bg-[#990000] text-white px-3 py-1.5 font-black text-center text-xs">
                                            {summary.average}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* STAMP (SELLO OFICIAL) */}
                        <div className="flex-1 flex justify-center py-2">
                            <div className="w-36 h-36 rounded-full border-2 border-black flex flex-col items-center justify-center p-2 text-center text-black relative select-none shadow-inner bg-white">
                                <div className="absolute inset-1 rounded-full border border-black pointer-events-none"></div>
                                <span className="text-[7.5px] font-black uppercase tracking-widest text-[#990000]">
                                    PRO AGROINDUSTRIA
                                </span>
                                <div className="my-1 py-0.5 px-2 bg-black text-white text-[9px] font-black uppercase tracking-wider rounded-sm">
                                    SALIDA AUTORIZADA
                                </div>
                                <span className="text-[8px] font-black tracking-widest">
                                    DJDH
                                </span>
                                <span className="text-[7.5px] font-black uppercase tracking-wider text-black mt-0.5">
                                    VIGILANCIA FÍSICA
                                </span>
                            </div>
                        </div>

                        <div className="w-72"></div>
                    </div>

                    {/* SIGNATURE SECTION */}
                    <div className="mt-14 pt-4">
                        <div className="w-80">
                            <div className="border-t-2 border-black pt-1.5">
                                <p className="font-bold text-xs text-black">
                                    {supervisor}
                                </p>
                                <p className="text-[11px] text-gray-700">
                                    {position}
                                </p>
                                <p className="text-[11px] text-gray-700">
                                    {company}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 8mm 6mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
