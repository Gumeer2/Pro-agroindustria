import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Warehouse,
    Box,
    Truck,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Package,
    ArrowLeft,
    X,
    FileText,
    User as UserIcon,
    Scale,
    Calendar,
    Camera,
    Save,
    Check,
} from "lucide-react";
import { useState } from "react";

// --- Unicorn Components ---

const WarehouseCard = ({
    wh,
    onViewDetails,
}: {
    wh: any;
    onViewDetails: (location: any) => void;
}) => {
    // Almacén 1-3 (Flat)
    const isOccupied = wh.occupied;
    const unitCount = wh.orders?.length || 0;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 group h-full
            ${isOccupied
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-900 to-slate-900 shadow-[0_0_30px_-1px_rgba(99,102,241,0.4)]"
                    : "border-slate-200 bg-white/50 border-dashed hover:border-indigo-300 hover:bg-white"
                }`}
        >
            {/* Background Effects */}
            {isOccupied && (
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
            )}

            <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3
                            className={`text-sm font-bold uppercase tracking-wider ${isOccupied ? "text-indigo-200" : "text-slate-500"}`}
                        >
                            Ubicación
                        </h3>
                        <h2
                            className={`text-2xl font-extrabold ${isOccupied ? "text-white" : "text-slate-700"}`}
                        >
                            {wh.name}
                        </h2>
                    </div>
                    <div
                        className={`p-2 rounded-xl ${isOccupied ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-100 text-slate-400"}`}
                    >
                        <Warehouse className="w-8 h-8" />
                    </div>
                </div>

                {/* Status Content */}
                {isOccupied ? (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                    <span className="text-white font-black text-sm">
                                        {unitCount}{" "}
                                        {unitCount === 1
                                            ? "Unidad"
                                            : "Unidades"}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                                        Peso Total
                                    </span>
                                    <span className="text-white font-black text-lg">
                                        {(wh.total_net / 1000).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => onViewDetails(wh)}
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                Ver Detalle Unidades
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            Operación Activa
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <CheckCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <span className="font-medium">Disponible</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const CubicleGrid = ({
    wh,
    onViewDetails,
}: {
    wh: any;
    onViewDetails: (location: any) => void;
}) => {
    // Almacén 4-5 (Cubicles)
    const occupancyRate = wh.occupancy_percentage;

    // Explicit Color Maps for Tailwind
    const getBadgeStyle = (rate: number) => {
        if (rate > 80) return "bg-red-100 text-red-700 border-red-200";
        if (rate > 40) return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-green-100 text-green-700 border-green-200";
    };

    const getProgressStyle = (rate: number) => {
        // Gradient logic is fine as inline style or explicit classes
        // We'll keep the inline gradient style used below, but ensure the badge uses the function above.
        return {};
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        {wh.name}
                        <span
                            className={`text-xs px-2 py-1 rounded-full border ${getBadgeStyle(occupancyRate)}`}
                        >
                            {occupancyRate}% Ocupado
                        </span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Capacidad: 8 Cubículos (Divisiones Internas)
                    </p>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                    <Box className="w-6 h-6 text-indigo-600" />
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 bg-slate-50/50">
                {wh.cubicles.map((cubicle: any) => (
                    <div
                        key={cubicle.id}
                        className={`relative rounded-xl p-4 border transition-all duration-300 group
                            ${cubicle.occupied
                                ? "bg-white border-indigo-200 shadow-md ring-2 ring-indigo-500/20"
                                : "bg-slate-50 border-slate-200 border-dashed hover:border-slate-300 hover:bg-white"
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span
                                className={`text-xs font-bold px-2 py-1 rounded-md ${cubicle.occupied ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}
                            >
                                C-{cubicle.id}
                            </span>
                            {cubicle.occupied ? (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            ) : (
                                <div className="w-2 h-2 bg-slate-300 rounded-full" />
                            )}
                        </div>

                        {cubicle.occupied ? (
                            <div className="space-y-3 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-indigo-600">
                                        <Truck className="w-3.5 h-3.5" />
                                        <span className="text-xs font-black">
                                            {cubicle.orders?.length}{" "}
                                            {cubicle.orders?.length === 1
                                                ? "Unidad"
                                                : "Unidades"}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[9px] font-black text-gray-400 uppercase">
                                            Peso
                                        </span>
                                        <span className="text-xs font-black text-gray-800">
                                            {(cubicle.total_net / 1000).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                                            T
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onViewDetails(cubicle)}
                                    className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-slate-200 hover:border-indigo-200 transition-all"
                                >
                                    Detalle
                                </button>
                            </div>
                        ) : (
                            <div className="h-16 flex items-center justify-center text-slate-300 text-xs font-medium">
                                Libre
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer Bar */}
            <div className="h-2 w-full bg-slate-100">
                <div
                    className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r from-green-400 via-amber-400 to-red-500`}
                    style={{ width: `${occupancyRate}%` }}
                />
            </div>
        </div>
    );
};

import { router } from "@inertiajs/react";

// ... (imports remain)

export default function Status({
    auth,
    warehouses,
    filters,
}: {
    auth: any;
    warehouses?: any[];
    filters?: any;
}) {
    const [viewingLocation, setViewingLocation] = useState<any>(null);
    const productionMode = filters?.from === "production" || new URLSearchParams(window.location.search).get("from") === "production";
    const [assignedUser, setAssignedUser] = useState("");
    const [shift, setShift] = useState("");
    const [receptionLot, setReceptionLot] = useState("");
    const [evidence, setEvidence] = useState<string | null>(null);
    const [savedShift, setSavedShift] = useState<any>(() => {
        try {
            return JSON.parse(localStorage.getItem("apt-production-shift") || "null");
        } catch {
            return null;
        }
    });
    const [date, setDate] = useState(
        filters?.date || new Date().toISOString().split("T")[0],
    );

    const today = new Date().toISOString().split("T")[0];

    const handleEvidenceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => setEvidence(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleShiftSave = (event: React.FormEvent) => {
        event.preventDefault();
        if (!assignedUser || !shift || !receptionLot) return;

        const registration = {
            assignedUser,
            position: "Automático",
            date: today,
            shift,
            receptionLot,
            evidence,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem("apt-production-shift", JSON.stringify(registration));
        setSavedShift(registration);
    };

    const flatWarehouses = (warehouses || []).filter((w) => w.type === "flat");
    const cubicledWarehouses = (warehouses || []).filter((w) => w.type === "cubicles");

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get(
            route("apt.status"),
            {
                date: newDate,
                ...(new URLSearchParams(window.location.search).get("from") === "production"
                    ? { from: "production" }
                    : {}),
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <DashboardLayout user={auth.user} header="Status APT">
            <Head title="Status APT" />

            <div className={`max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in ${productionMode ? "production-only" : ""}`}>
                <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-xl">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-100">Gestión de la producción</p>
                            <h2 className="mt-1 text-2xl font-black">Registro de inicio de turno</h2>
                        </div>
                        {savedShift && <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-100 sm:self-auto"><Check className="h-4 w-4" /> Guardado</span>}
                    </div>

                    <form onSubmit={handleShiftSave} className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr_0.9fr]">
                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-black uppercase tracking-wide text-sky-700">Usuario asignado</label>
                                <select value={assignedUser} onChange={(event) => setAssignedUser(event.target.value)} className="w-full rounded-xl border-sky-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm focus:border-sky-500 focus:ring-sky-500" required>
                                    <option value="">Seleccionar</option>
                                    <option value={auth.user?.name || "Usuario actual"}>{auth.user?.name || "Usuario actual"}</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-black uppercase tracking-wide text-sky-700">Turno</label>
                                <select value={shift} onChange={(event) => setShift(event.target.value)} className="w-full rounded-xl border-sky-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm focus:border-sky-500 focus:ring-sky-500" required>
                                    <option value="">Seleccionar</option>
                                    <option value="Turno 1">Turno 1</option>
                                    <option value="Turno 2">Turno 2</option>
                                    <option value="Turno 3">Turno 3</option>
                                    <option value="Turno 1A">Turno 1A</option>
                                    <option value="Turno 1B">Turno 1B</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-black uppercase tracking-wide text-sky-700">Puesto</label>
                                <input value="Automático" readOnly className="w-full rounded-xl border-sky-200 bg-slate-50 px-4 py-3 font-semibold text-slate-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-black uppercase tracking-wide text-sky-700">Lote en recepción</label>
                                <select value={receptionLot} onChange={(event) => setReceptionLot(event.target.value)} className="w-full rounded-xl border-sky-200 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm focus:border-sky-500 focus:ring-sky-500" required>
                                    <option value="">Seleccionar</option>
                                    <option value="Lote 1">Lote 1</option>
                                    <option value="Lote 2">Lote 2</option>
                                    <option value="Lote 3">Lote 3</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-5">
                            <div>
                                <label className="mb-2 block text-sm font-black uppercase tracking-wide text-sky-700">Fecha</label>
                                <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-slate-50 px-4 py-3 font-semibold text-slate-500"><Calendar className="h-5 w-5 text-sky-600" />{new Date(today + "T00:00:00").toLocaleDateString("es-MX")}</div>
                            </div>
                            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-bold text-slate-600 transition hover:border-sky-500 hover:bg-sky-50">
                                {evidence ? <img src={evidence} alt="Evidencia seleccionada" className="h-12 w-12 rounded-lg object-cover" /> : <Camera className="h-7 w-7 text-sky-600" />}
                                <span>{evidence ? "Cambiar evidencia" : "Evidencia fotográfica"}</span>
                                <input type="file" accept="image/*" capture="environment" onChange={handleEvidenceChange} className="hidden" />
                            </label>
                            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-black text-white shadow-lg transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={!assignedUser || !shift || !receptionLot}>
                                <Save className="h-5 w-5" /> Guardar
                            </button>
                        </div>
                    </form>
                </section>

                <style>{productionMode ? `.production-only > :not(:first-child) { display: none; }` : ""}</style>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="mb-4">
                            <Link
                                href={new URLSearchParams(window.location.search).get("from") === "production" ? route("apt.production") : route("apt.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {new URLSearchParams(window.location.search).get("from") === "production" ? "Volver al menú de submódulos" : "Volver al menú"}
                            </Link>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Celdas y Almacenes
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Gestión de unidades y pesajes acumulados por día.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Date Filter */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) =>
                                    handleDateChange(e.target.value)
                                }
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="hidden md:flex flex-col items-end">
                            <div
                                className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full border mb-2 ${date === new Date().toISOString().split("T")[0] ? "text-slate-400 bg-slate-50" : "text-indigo-500 bg-indigo-50 border-indigo-100"}`}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full ${date === new Date().toISOString().split("T")[0] ? "bg-green-500 animate-pulse" : "bg-indigo-500"}`}
                                />
                                {date === new Date().toISOString().split("T")[0]
                                    ? "LIVE"
                                    : "HISTÓRICO"}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {new Date(
                                    date + "T00:00:00",
                                ).toLocaleDateString("es-MX", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Row 1: Flat Warehouses (1-3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {flatWarehouses.map((wh, idx) => (
                        <div key={idx} className="h-64">
                            <WarehouseCard
                                wh={wh}
                                onViewDetails={setViewingLocation}
                            />
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 text-slate-300">
                    <div className="h-px bg-slate-200 flex-1" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                        Almacenes Divisionados
                    </span>
                    <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Row 2: Cubicled Warehouses (4-5) */}
                <div className="space-y-8">
                    {cubicledWarehouses.map((wh, idx) => (
                        <CubicleGrid
                            key={idx}
                            wh={wh}
                            onViewDetails={(cub) =>
                                setViewingLocation({
                                    ...cub,
                                    name: `${wh.name} - Cubículo ${cub.id}`,
                                })
                            }
                        />
                    ))}
                </div>
            </div>

            {/* MODAL: Detalle de Ubicación Multi-Unidad */}
            {viewingLocation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
                        {/* Modal Header */}
                        <div className="p-8 bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10">
                                <h3 className="text-white text-3xl font-black tracking-tight">
                                    {viewingLocation.name}
                                </h3>
                                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mt-1">
                                    Unidades en ubicación
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingLocation(null)}
                                className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:rotate-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Metrics Bar */}
                        <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex flex-wrap gap-8 items-center justify-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Total Unidades
                                    </span>
                                    <span className="text-lg font-black text-slate-800">
                                        {viewingLocation.orders?.length}
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Tonelaje Neto Acumulado
                                    </span>
                                    <span className="text-lg font-black text-blue-900">
                                        {(
                                            viewingLocation.total_net / 1000
                                        ).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                                        T
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Tonelaje Programado
                                    </span>
                                    <span className="text-lg font-black text-amber-900">
                                        {(
                                            viewingLocation.total_programmed /
                                            1000
                                        ).toLocaleString()}{" "}
                                        TM
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Table Body */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <table className="w-full text-left border-separate border-spacing-y-3">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Orden / Folio
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Operador / Línea
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            Unidad
                                        </th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                                            Peso Neto
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingLocation.orders?.map(
                                        (order: any) => (
                                            <tr
                                                key={order.id}
                                                className="group hover:scale-[1.01] transition-all"
                                            >
                                                <td className="bg-slate-50 group-hover:bg-white group-hover:shadow-md px-6 py-4 rounded-l-2xl border-y border-l border-slate-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg border border-slate-100 text-indigo-600">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-black text-slate-800 text-sm">
                                                                {order.folio}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">
                                                                {order.product}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="bg-slate-50 group-hover:bg-white group-hover:shadow-md px-6 py-4 border-y border-slate-100 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                                        <div>
                                                            <span className="block font-bold text-slate-700 text-sm">
                                                                {
                                                                    order.operator_name
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {
                                                                    order.transport_company
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="bg-slate-50 group-hover:bg-white group-hover:shadow-md px-6 py-4 border-y border-slate-100 transition-colors">
                                                    <span className="inline-flex items-center px-2 py-1 bg-white border rounded-md text-xs font-black text-slate-600">
                                                        {order.unit_number ||
                                                            order.tractor_plate}
                                                    </span>
                                                </td>
                                                <td className="bg-slate-50 group-hover:bg-white group-hover:shadow-md px-6 py-4 rounded-r-2xl border-y border-r border-slate-100 text-right transition-colors">
                                                    <span className="text-sm font-black text-indigo-600">
                                                        {(
                                                            ((order.weight_ticket
                                                                ?.net_weight ||
                                                                0) / 1000)
                                                        ).toLocaleString("es-MX", {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })}{" "}
                                                        T
                                                    </span>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                            {(!viewingLocation.orders ||
                                viewingLocation.orders.length === 0) && (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold">
                                            No hay unidades activas en esta
                                            ubicación.
                                        </p>
                                    </div>
                                )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setViewingLocation(null)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
                            >
                                Cerrar Detalles
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
            `}</style>
        </DashboardLayout>
    );
}
