import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    Search,
    Clock,
    CheckCircle2,
    Hourglass,
    Package,
    Warehouse,
    Printer,
    RefreshCw,
    X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProcessStatus {
    stage: 'pending_entry' | 'in_plant' | 'loading' | 'loaded' | 'completed';
    label: string;
    detail: string;
    color: 'red' | 'amber' | 'indigo' | 'blue' | 'emerald';
}

interface OeRow {
    id: string;
    num: number;
    folio: string;
    tractor_plate: string;
    operator_name: string;
    unit_type: string;
    transport_company: string;
    client: string;
    warehouse: string;
    product: string;
    presentation: string;
    programmed_tons: number;
    is_pending: boolean;
    created_at: string;          // ISO8601
    completed_at: string | null;    // ISO8601 or null
    status: string;
    ticket_status: 'checkmark' | 'x' | null;
    in_plant: boolean;
    process_status?: ProcessStatus;
}

interface PageProps {
    auth: any;
    envasado: OeRow[];
    granel: OeRow[];
    saderEnvasado: OeRow[];
    saderGranel: OeRow[];
    context_module?: string;
    filters: {
        search: string;
        module?: string;
        from?: string;
        in_plant: string;
        client_id?: string;
        product_id?: string;
    };
    clients?: { id: number; business_name: string; name: string }[];
    products?: { id: number; name: string }[];
    envasadoClients: { id: number; business_name: string; name: string }[];
    envasadoProducts: { id: number; name: string }[];
    granelClients: { id: number; business_name: string; name: string }[];
    granelProducts: { id: number; name: string }[];
    saderEnvasadoProducts: { id: number; name: string }[];
    saderGranelProducts: { id: number; name: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Timer Cell ──────────────────────────────────────────────────────────────

function TimerCell({ row }: { row: OeRow }) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (row.is_pending) {
            const startMs = new Date(row.created_at).getTime();
            const tick = () => {
                const secs = Math.floor((Date.now() - startMs) / 1000);
                setElapsed(Math.max(0, secs));
            };
            tick();
            intervalRef.current = setInterval(tick, 1000);
        } else {
            if (row.completed_at) {
                const startMs = new Date(row.created_at).getTime();
                const endMs = new Date(row.completed_at).getTime();
                setElapsed(Math.floor((endMs - startMs) / 1000));
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [row.is_pending, row.created_at, row.completed_at]);

    const isPending = row.is_pending;

    return (
        <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${
                isPending
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
            }`}
        >
            {isPending ? (
                <Hourglass className="w-2.5 h-2.5 flex-shrink-0" />
            ) : (
                <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />
            )}
            {formatDuration(elapsed)}
        </span>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ row }: { row: OeRow }) {
    const ps = row.process_status;

    if (ps) {
        const colorClasses: Record<string, string> = {
            red: "bg-red-50 text-red-700 border-red-200",
            amber: "bg-amber-50 text-amber-800 border-amber-200",
            indigo: "bg-orange-50 text-orange-700 border-orange-200",
            blue: "bg-blue-50 text-blue-700 border-blue-200",
            emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
        const cls = colorClasses[ps.color] || "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls} whitespace-nowrap`}
                title={ps.detail}
            >
                {ps.label}
            </span>
        );
    }

    if (!row.is_pending) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                Destarado
            </span>
        );
    }

    const label = row.in_plant ? "En Planta (Espera)" : "Por Ingresar";
    const cls = row.in_plant
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${cls} whitespace-nowrap`}
        >
            {label}
        </span>
    );
}

// ─── Table ───────────────────────────────────────────────────────────────────

function OeTable({
    rows,
    showWarehouse,
    showPrint = true,
}: {
    rows: OeRow[];
    showWarehouse: boolean;
    showPrint?: boolean;
}) {
    if (rows.length === 0) {
        return (
            <div className="py-12 text-center text-gray-400">
                <Package className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p className="text-sm font-medium">No hay registros en esta sección</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full table-auto divide-y divide-gray-100 text-xs">
                <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white">
                    <tr>
                        <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] w-12">Ticket</th>
                        <th className="px-1 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] w-8">#</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">OE</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Placa Tracto</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Operador</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Tipo Unidad</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Línea Transp.</th>
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Cliente</th>
                        {showWarehouse && (
                            <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Almacén</th>
                        )}
                        <th className="px-2 py-2.5 text-left font-bold uppercase tracking-wider text-[11px]">Producto</th>
                        <th className="px-2 py-2.5 text-right font-bold uppercase tracking-wider text-[11px]">Tons. Prog.</th>
                        <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] w-28 sm:w-32">EN PROCESO</th>
                        <th className="px-2 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] w-24">Cronómetro</th>
                        {showPrint && <th className="px-1 py-2.5 text-center font-bold uppercase tracking-wider text-[11px] w-10">Reimp.</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className={`transition-colors duration-100 ${
                                row.is_pending
                                    ? "hover:bg-amber-50/70"
                                    : "hover:bg-emerald-50/70"
                            }`}
                        >
                            <td className="px-2 py-2 text-center">
                                {row.ticket_status === 'checkmark' && (
                                    <div className="flex justify-center" title="Ticket generado (Pendiente de carga)">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                )}
                                {row.ticket_status === 'x' && (
                                    <div className="flex justify-center" title="Sin ticket generado">
                                        <X className="w-4 h-4 text-red-500" />
                                    </div>
                                )}
                                {!row.ticket_status && <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-1 py-2 text-center text-gray-400 font-semibold">{row.num}</td>
                            <td className="px-2 py-2 font-bold text-indigo-700 uppercase whitespace-nowrap">
                                {row.folio}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap font-mono text-gray-700 uppercase text-[11px]">
                                {row.tractor_plate}
                            </td>
                            <td className="px-2 py-2 text-gray-800 font-medium uppercase max-w-[150px] truncate" title={row.operator_name}>
                                {row.operator_name}
                            </td>
                            <td className="px-2 py-2 text-gray-600 max-w-[130px] truncate" title={row.unit_type}>
                                {row.unit_type}
                            </td>
                            <td className="px-2 py-2 text-gray-600 max-w-[140px] truncate" title={row.transport_company}>
                                {row.transport_company}
                            </td>
                            <td className="px-2 py-2 text-gray-800 font-medium max-w-[150px] truncate" title={row.client}>
                                {row.client}
                            </td>
                            {showWarehouse && (
                                <td className="px-2 py-2 text-gray-600 whitespace-nowrap">
                                    {row.warehouse !== "N/A" ? (
                                        <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                                            <Warehouse className="w-3 h-3" />
                                            {row.warehouse}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                            )}
                            <td className="px-2 py-2 text-gray-700 max-w-[160px] truncate" title={row.product}>
                                {row.product}
                            </td>
                            <td className="px-2 py-2 text-right font-bold text-indigo-900 whitespace-nowrap">
                                {row.programmed_tons.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                TM
                            </td>
                            <td className="px-2 py-2 text-center">
                                <StatusBadge row={row} />
                            </td>
                            <td className="px-2 py-2 text-center">
                                <TimerCell row={row} />
                            </td>
                            {showPrint && (
                                <td className="px-1 py-2 text-center">
                                    <a
                                        href={row.id ? `/documentation/shipment-orders/${row.id}/print` : "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        title="Reimprimir OE"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                    </a>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ rows, label, showPrint = true }: { rows: OeRow[]; label: string, showPrint?: boolean }) {
    const [subTab, setSubTab] = useState<"pending" | "completed">("pending");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    const pending = rows.filter((r) => r.is_pending);
    const completed = rows.filter((r) => !r.is_pending);
    const currentItems = subTab === "pending" ? pending : completed;

    const totalPages = Math.ceil(currentItems.length / pageSize);
    const paginatedItems = currentItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [subTab]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
            {/* Sub-tab bar */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setSubTab("pending")}
                    className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        subTab === "pending"
                            ? "bg-amber-50 text-amber-700 border-b-2 border-amber-500"
                            : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    <Hourglass className="w-3.5 h-3.5" />
                    Pendientes
                    <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            subTab === "pending"
                                ? "bg-amber-200 text-amber-800"
                                : "bg-gray-200 text-gray-600"
                        }`}
                    >
                        {pending.length}
                    </span>
                </button>
                <button
                    onClick={() => setSubTab("completed")}
                    className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        subTab === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                            : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completadas
                    <span
                        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            subTab === "completed"
                                ? "bg-emerald-200 text-emerald-800"
                                : "bg-gray-200 text-gray-600"
                        }`}
                    >
                        {completed.length}
                    </span>
                </button>
            </div>

            {/* Table */}
            <OeTable rows={paginatedItems} showWarehouse={subTab === "completed"} showPrint={showPrint} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Mostrando <span className="font-bold">{(currentPage - 1) * pageSize + 1}</span> a <span className="font-bold">{Math.min(currentPage * pageSize, currentItems.length)}</span> de <span className="font-bold">{currentItems.length}</span> registros
                    </p>
                    <div className="flex gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-2.5 py-1 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-2.5 py-1 rounded border border-gray-300 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {/* Totals footer */}
            {currentItems.length > 0 && (
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
                    <span>
                        <strong className="text-gray-800">{currentItems.length}</strong> registros totales
                    </span>
                    <span>
                        Tons. Programadas:{" "}
                        <strong className="text-indigo-800">
                            {currentItems
                                .reduce((s, r) => s + r.programmed_tons, 0)
                                .toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            {" "}TM
                        </strong>
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
    { key: "envasado", label: "Envasado", color: "indigo" },
    { key: "granel", label: "Granel", color: "blue" },
    { key: "saderEnvasado", label: "Envasado SADER", color: "green" },
    { key: "saderGranel", label: "Granel SADER", color: "amber" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function OeTrackerIndex({
    auth,
    envasado,
    granel,
    saderEnvasado,
    saderGranel,
    filters,
    envasadoClients = [],
    envasadoProducts = [],
    granelClients = [],
    granelProducts = [],
    saderEnvasadoProducts = [],
    saderGranelProducts = [],
}: PageProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("envasado");
    const [search, setSearch] = useState(filters.search || "");
    const [inPlant, setInPlant] = useState(filters.in_plant || "all");
    const [selectedClient, setSelectedClient] = useState(filters.client_id || "");
    const [selectedProduct, setSelectedProduct] = useState(filters.product_id || "");

    const currentClients = activeTab === 'envasado' ? envasadoClients :
        activeTab === 'granel' ? granelClients : [];

    const currentProducts = activeTab === 'envasado' ? envasadoProducts :
        activeTab === 'granel' ? granelProducts :
            activeTab === 'saderEnvasado' ? saderEnvasadoProducts :
                activeTab === 'saderGranel' ? saderGranelProducts : [];

    const data: Record<TabKey, OeRow[]> = { envasado, granel, saderEnvasado, saderGranel };

    const applyFilters = (params: {
        search?: string,
        in_plant?: string,
        client_id?: string,
        product_id?: string
    } = {}) => {
        const fromParam = new URLSearchParams(window.location.search).get("from") || filters.from;
        router.get(
            route("documentation.oe-tracker"),
            {
                search: params.search !== undefined ? params.search : search,
                in_plant: params.in_plant !== undefined ? params.in_plant : inPlant,
                client_id: params.client_id !== undefined ? params.client_id : selectedClient,
                product_id: params.product_id !== undefined ? params.product_id : selectedProduct,
                module: filters.module,
                ...(fromParam ? { from: fromParam } : {})
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") applyFilters({ search });
    };

    const tabColorMap: Record<string, string> = {
        indigo: "border-indigo-500 text-indigo-700 bg-indigo-50",
        blue: "border-blue-500 text-blue-700 bg-blue-50",
        green: "border-green-600 text-green-700 bg-green-50",
        amber: "border-amber-500 text-amber-700 bg-amber-50",
    };

    const tabIdleMap: Record<string, string> = {
        indigo: "hover:text-indigo-700 hover:bg-indigo-50",
        blue: "hover:text-blue-700 hover:bg-blue-50",
        green: "hover:text-green-700 hover:bg-green-50",
        amber: "hover:text-amber-700 hover:bg-amber-50",
    };

    const fromParam = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get("from") || filters.from) : filters.from;
    const isFromProduction = filters.module === 'apt' && fromParam === 'production';

    return (
        <DashboardLayout user={auth.user} header="Seguimiento de OE del Dia">
            <Head title="Seguimiento de OE" />

            <div className="w-full space-y-4">
                {/* Back Link */}
                <div>
                    <Link
                        href={
                            filters.module === 'scale'
                                ? route('scale.index')
                                : isFromProduction
                                    ? route('apt.production')
                                    : filters.module === 'apt'
                                        ? route('apt.index')
                                        : route('documentation.index')
                        }
                        className="text-gray-500 hover:text-indigo-700 inline-flex items-center text-xs sm:text-sm font-bold transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        {
                            filters.module === 'scale'
                                ? "Volver a Báscula"
                                : isFromProduction
                                    ? "Volver a Gestión de almacenes"
                                    : filters.module === 'apt'
                                        ? "Volver a APT"
                                        : "Volver a Documentación"
                        }
                    </Link>
                </div>

                {/* Top Header & Filters Bar */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-indigo-900 uppercase tracking-tight flex items-center">
                            <Clock className="mr-2.5 h-6 w-6 sm:h-7 sm:w-7 text-indigo-600 shrink-0" />
                            Monitoreo Global de OE
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium ml-8.5 sm:ml-9.5 mt-0.5">
                            Listado de todas las órdenes pendientes y completadas (Sin corte operativo)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Buscar folio, operador..."
                                className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs sm:text-sm font-medium shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <select
                            value={selectedClient}
                            onChange={(event) => { setSelectedClient(event.target.value); applyFilters({ client_id: event.target.value }); }}
                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-semibold shadow-sm focus:border-indigo-500"
                        >
                            <option value="">Todos los Clientes</option>
                            {currentClients.map((client) => (
                                <option key={client.id} value={client.id}>{client.business_name || client.name}</option>
                            ))}
                        </select>
                        <select
                            value={selectedProduct}
                            onChange={(event) => { setSelectedProduct(event.target.value); applyFilters({ product_id: event.target.value }); }}
                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-semibold shadow-sm focus:border-indigo-500"
                        >
                            <option value="">Todos los Productos</option>
                            {currentProducts.map((product) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </select>
                        <select
                            value={inPlant}
                            onChange={(event) => { setInPlant(event.target.value); applyFilters({ in_plant: event.target.value }); }}
                            className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-semibold shadow-sm focus:border-indigo-500"
                        >
                            <option value="all">Filtro: En Proceso (Todos)</option>
                            <option value="si">En Planta / Cargando</option>
                            <option value="no">Por Ingresar</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => applyFilters()}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 shrink-0"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Vista Actual Indicator */}
                <div className="flex justify-center pt-1 pb-1">
                    <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/80 border border-indigo-100/80 px-6 py-2 shadow-sm">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-400">Vista actual:</span>
                            <span className="block text-base sm:text-lg font-black text-indigo-900 leading-none">{TABS.find((tab) => tab.key === activeTab)?.label}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto rounded-t-2xl border-b border-gray-200 bg-white shadow-sm">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-4 px-6 py-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${
                                activeTab === tab.key
                                    ? tabColorMap[tab.color]
                                    : `border-transparent text-gray-500 ${tabIdleMap[tab.color]}`
                            }`}
                        >
                            {tab.label}
                            <span
                                className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    activeTab === tab.key ? "bg-white/70 text-indigo-900" : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {data[tab.key].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Tab Content Section */}
                <div>
                    <Section rows={data[activeTab]} label={TABS.find((tab) => tab.key === activeTab)?.label || ""} />
                </div>
            </div>
        </DashboardLayout>
    );
}
