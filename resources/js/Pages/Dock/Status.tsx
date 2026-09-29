import { useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";
import {
    Ship,
    Anchor,
    Calendar,
    Clock,
    ArrowRight,
    Wind,
    AlertTriangle,
    CheckCircle,
    Droplets,
    ArrowLeft,
    FileText,
    LogOut,
    MapPin,
    Activity,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

// Unicorn UI Components (Sub-components located here for single-file portability during dev)

import InteractiveVessel from "@/Components/InteractiveVessel";

const VesselCard = ({
    vessel,
    side,
    isExternal = false,
}: {
    vessel: any;
    side: string;
    isExternal?: boolean;
}) => {
    const isOccupied = vessel && vessel.name !== "-";

    const handleDeparture = () => {
        Swal.fire({
            title: '<span class="text-2xl font-black uppercase tracking-tight">Confirmar Salida</span>',
            html: `¿Está seguro de marcar la salida del buque <strong class="text-blue-600">${vessel.name}</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, MARCAR SALIDA',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: isExternal ? '#06b6d4' : '#3b82f6',
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        }).then((result: any) => {
            if (result.isConfirmed) {
                router.post(route('dock.vessel.mark-departure', vessel.id as any), {
                    type: isExternal ? 'external' : 'internal'
                } as any);
            }
        });
    };

    const colorClasses = isExternal
        ? (isOccupied
            ? "border-cyan-400/50 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900/40 shadow-[0_20px_50px_-20px_rgba(34,211,238,0.3)]"
            : "border-slate-200 bg-slate-50 opacity-60")
        : (isOccupied
            ? "border-blue-500/50 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-900 shadow-[0_20px_50px_-20px_rgba(30,58,138,0.7)]"
            : "border-slate-200 bg-slate-50 opacity-60 overflow-hidden");

    if (isExternal && !isOccupied) return null;

    return (
        <div
            className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 group ${colorClasses} ${!isOccupied ? "border-dashed hover:opacity-100 hover:border-slate-300 p-8 min-h-[180px]" : "p-4 md:p-10 min-h-[220px]"}`}
        >
            {/* Background Accent for Occupied */}
            {isOccupied && (
                <div className={`absolute bottom-0 right-0 -mb-24 -mr-24 h-96 w-96 rounded-full blur-[100px] opacity-10 animate-pulse ${isExternal ? "bg-cyan-500" : "bg-blue-500"}`}></div>
            )}

            <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xs font-black uppercase tracking-[0.4em] ${isOccupied ? (isExternal ? "text-cyan-400" : "text-blue-400") : "text-slate-400"}`}>
                        {isExternal ? "Terminal Marítima" : `Muelle ${side}`}
                    </h3>
                    {isOccupied && (
                        <div className="flex gap-2 items-center">
                            <a
                                href={route('dock.vessel.export', vessel.id as any)}
                                className={`flex items-center gap-2 ${isExternal ? 'border-cyan-500/30 text-cyan-200' : 'border-blue-500/30 text-blue-200'} bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-1 font-black text-[10px] tracking-widest uppercase rounded-full border shadow-lg`}
                            >
                                <FileText className="w-3 h-3" />
                                Exportar Excel
                            </a>
                            <Badge
                                variant="outline"
                                className={`${isExternal ? 'border-cyan-500/30 text-cyan-200' : 'border-blue-500/30 text-blue-200'} bg-white/5 backdrop-blur-sm px-4 py-1 font-black text-[10px] tracking-widest uppercase rounded-full`}
                            >
                                EN OPERACIÓN
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {isOccupied ? (
                        <>
                            {/* Vessel Info Sub-Card (Premium Glassmorphism) */}
                            <div className={`flex-shrink-0 w-full lg:w-[380px] xl:w-[420px] ${isExternal ? "bg-cyan-950/40 border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.1)]" : "bg-slate-900/60 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.15)]"} backdrop-blur-2xl border-2 rounded-[3rem] p-6 md:p-10 relative group/card overflow-hidden transition-all duration-700`}>
                                <div className={`absolute top-0 right-0 w-48 h-48 ${isExternal ? 'bg-cyan-400/20' : 'bg-blue-400/20'} blur-[100px] -mr-24 -mt-24 group-hover/card:scale-150 transition-transform duration-1000`}></div>

                                <div className="mb-8 md:mb-10 relative z-10">
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-4 group-hover/card:translate-x-1 transition-transform duration-500 [text-shadow:0_4px_12px_rgba(0,0,0,0.5)] truncate" title={vessel.name}>
                                        {vessel.name}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge
                                            variant="outline"
                                            className={`bg-white/5 backdrop-blur-md font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg border-white/10 ${isExternal ? "text-cyan-300" : "text-blue-300"}`}
                                        >
                                            {vessel.type}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="bg-white/5 backdrop-blur-md font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 rounded-lg border-white/10 text-white/70"
                                        >
                                            {vessel.product || 'CARGA GENERAL'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-4 md:space-y-6 relative z-10">
                                    <div className={`flex items-center justify-between border-b ${isExternal ? "border-cyan-400/20" : "border-white/10"} pb-4`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isExternal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'} shadow-inner`}>
                                                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <span className={`${isExternal ? "text-cyan-400/60" : "text-white/50"} text-[9px] font-black uppercase tracking-[0.2em]`}>Operación</span>
                                        </div>
                                        <span className={`font-black text-lg md:text-2xl tracking-tight uppercase ${vessel.is_discharge ? 'text-amber-400' : 'text-green-400'}`}>
                                            {vessel.operation_type}
                                        </span>
                                    </div>

                                    <div className={`flex items-center justify-between border-b ${isExternal ? "border-cyan-400/20" : "border-white/10"} pb-4`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isExternal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'} shadow-inner`}>
                                                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <span className={`${isExternal ? "text-cyan-400/60" : "text-white/50"} text-[9px] font-black uppercase tracking-[0.2em]`}>Cronología</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-white font-black text-lg md:text-2xl leading-none block">{vessel.stay_days}</span>
                                            <span className="text-white/30 font-black text-[8px] uppercase tracking-widest mt-0.5 block">DÍAS TRANSCURRIDOS</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between border-b ${isExternal ? "border-cyan-400/20" : "border-white/10"} pb-4`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isExternal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'} shadow-inner`}>
                                                <Activity className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <span className={`${isExternal ? "text-cyan-400/60" : "text-white/50"} text-[9px] font-black uppercase tracking-[0.2em]`}>Viajes</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                Swal.fire({
                                                    title: `<span class="text-2xl font-black uppercase tracking-tight ${isExternal ? 'text-cyan-400' : 'text-blue-500'}">Desglose de Viajes</span>`,
                                                    html: `
                                                        <div class="text-left space-y-4 p-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl">
                                                            <div class="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                                                <div class="flex flex-col">
                                                                    <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">OPERACIÓN BÁSCULA</span>
                                                                    <span class="text-white font-black text-xl leading-none mt-1">${vessel.stats.scale_trips || 0} VUELTAS</span>
                                                                </div>
                                                                <div class="text-right">
                                                                    <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">PESO TOTAL</span>
                                                                    <span class="text-blue-400 font-black text-xl leading-none mt-1">${vessel.stats.scale_weight_mt?.toLocaleString('es-MX') || 0} TM</span>
                                                                </div>
                                                            </div>

                                                            <div class="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                                                <div class="flex flex-col">
                                                                    <span class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">OPERACIÓN BURREO</span>
                                                                    <span class="text-white font-black text-xl leading-none mt-1">${vessel.stats.burreo_trips || 0} VUELTAS</span>
                                                                </div>
                                                                <div class="text-right">
                                                                    <span class="text-amber-400 font-black text-xl leading-none mt-1">${vessel.stats.burreo_weight_mt?.toLocaleString('es-MX') || 0} TM</span>
                                                                </div>
                                                            </div>

                                                            <div class="h-px bg-white/10 my-4"></div>

                                                            <div class="flex justify-between items-center px-4 py-2">
                                                                <span class="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">TOTAL ACUMULADO</span>
                                                                <span class="text-2xl font-black text-white tracking-tighter text-right">
                                                                    ${((vessel.stats.scale_weight_mt || 0) + (vessel.stats.burreo_weight_mt || 0)).toLocaleString('es-MX')} 
                                                                    <span class="text-[10px] font-bold text-white/20 ml-1">TM</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    `,
                                                    background: '#0f172a',
                                                    width: '450px',
                                                    showConfirmButton: true,
                                                    confirmButtonText: 'CERRAR',
                                                    confirmButtonColor: isExternal ? '#06b6d4' : '#3b82f6',
                                                    customClass: {
                                                        popup: 'rounded-[3rem] border-2 border-white/10',
                                                        title: 'mt-6',
                                                        confirmButton: 'rounded-2xl px-10 py-4 font-black text-[10px] tracking-widest uppercase mb-6'
                                                    }
                                                });
                                            }}
                                            className="text-right group/trips focus:outline-none"
                                        >
                                            <span className={`font-black text-lg md:text-2xl leading-none block transition-all group-hover/trips:scale-110 ${isExternal ? 'text-cyan-400' : 'text-blue-400'}`}>
                                                {vessel.stats.total_trips || 0}
                                            </span>
                                            <span className="text-white/30 font-black text-[8px] uppercase tracking-widest mt-0.5 block group-hover/trips:text-white/60 transition-colors underline decoration-dotted underline-offset-4">VUELTAS REGISTRADAS</span>
                                        </button>
                                    </div>

                                    <div className={`flex items-center justify-between border-b ${isExternal ? "border-cyan-400/20" : "border-white/10"} pb-4`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isExternal ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'} shadow-inner`}>
                                                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <span className={`${isExternal ? "text-cyan-400/60" : "text-white/50"} text-[9px] font-black uppercase tracking-[0.2em]`}>
                                                {isExternal ? "Entrada" : "Atraco"}
                                            </span>
                                        </div>
                                        <span className="text-white font-mono font-bold text-xs bg-black/20 px-2 py-1 rounded-lg border border-white/5">{isExternal ? vessel.external_arrival : (vessel.etb || vessel.berthal_datetime)}</span>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-2">
                                        <button
                                            onClick={handleDeparture}
                                            className={`w-full py-4 rounded-2xl border-2 font-black text-[10px] tracking-widest flex items-center justify-center gap-3 uppercase transition-all shadow-2xl active:scale-95 ${isExternal
                                                ? "bg-cyan-500 text-cyan-950 border-cyan-400 hover:bg-cyan-400"
                                                : "bg-blue-600 text-white border-blue-400 hover:bg-blue-500"
                                                }`}
                                        >
                                            Marcar Salida de Buque
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Ship Representation */}
                            <div className="flex-grow">
                                <InteractiveVessel vessel={vessel} isExternal={isExternal} />
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex items-center justify-start py-8">
                            <div className="bg-slate-200/50 backdrop-blur-sm px-10 py-8 rounded-[2rem] border-2 border-dashed border-slate-300 group-hover:border-slate-400 transition-colors">
                                <h2 className="text-slate-400 text-3xl font-black uppercase tracking-tighter flex items-center gap-5">
                                    <Anchor className="w-10 h-10 opacity-40 group-hover:rotate-12 transition-transform duration-500" />
                                    Terminal Disponible
                                </h2>
                                <p className="text-slate-400/60 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Esperando asignación de buque</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArrivalsTable = ({ arrivals }: { arrivals: any[] }) => {
    const handleArrival = (vessel: any, type: 'internal' | 'external') => {
        const typeLabel = type === 'external' ? 'al Muelle Externo' : 'a Proagro';
        const color = type === 'external' ? '#06b6d4' : '#4f46e5';

        Swal.fire({
            title: '<span class="text-2xl font-black uppercase tracking-tight">Confirmar Llegada</span>',
            html: `¿Está seguro de marcar la llegada del buque <strong class="text-indigo-600">${vessel.name}</strong> ${typeLabel}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'SÍ, MARCAR LLEGADA',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: color,
            cancelButtonColor: '#64748b',
            reverseButtons: true,
        }).then((result: any) => {
            if (result.isConfirmed) {
                router.post(route('dock.vessel.mark-arrival', vessel.id as any), {
                    type: type
                } as any);
            }
        });
    };

    return (
        <Card className="border shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Próximos Arribos
                </CardTitle>
                <CardDescription>Programación estimada de buques</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Buque</th>
                                <th className="px-6 py-4">ETA / ETB</th>
                                <th className="px-6 py-4">Operación</th>
                                <th className="px-6 py-4">Muelle</th>
                                <th className="px-6 py-4 text-center">Llegada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {arrivals.map((arrival, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{arrival.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-black">{arrival.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">ETA</span>
                                                <span className="font-mono text-xs">{arrival.eta}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">ETB</span>
                                                <span className="font-mono text-xs">{arrival.etb}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="font-bold border-slate-200">
                                            {arrival.operation_type}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600 font-medium">{arrival.dock}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleArrival(arrival, 'internal')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md active:scale-95 uppercase"
                                            >
                                                Marcar Llegada
                                            </button>

                                            <button
                                                onClick={() => handleArrival(arrival, 'external')}
                                                title="Marcar llegada a Muelle Externo"
                                                className="bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md active:scale-95 uppercase flex items-center gap-1.5"
                                            >
                                                <MapPin className="w-3 h-3" />
                                                ME
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-4 space-y-4 bg-slate-50">
                    {arrivals.map((arrival, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-900">{arrival.name}</h4>
                                    <p className="text-[10px] text-slate-400 uppercase font-black">{arrival.type} • {arrival.dock}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-slate-200">
                                    {arrival.operation_type}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ETA</p>
                                    <p className="text-xs font-mono font-bold">{arrival.eta}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ETB</p>
                                    <p className="text-xs font-mono font-bold text-indigo-600">{arrival.etb}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleArrival(arrival, 'internal')}
                                    className="flex-1 bg-indigo-600 text-white text-[10px] font-black py-2 rounded-lg uppercase shadow-sm active:scale-95"
                                >
                                    Llegada
                                </button>
                                <button
                                    onClick={() => handleArrival(arrival, 'external')}
                                    className="flex-1 bg-cyan-500 text-white text-[10px] font-black py-2 rounded-lg uppercase shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <MapPin className="w-3 h-3" />
                                    ME
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default function Status({
    auth,
    active_vessels,
    arrivals,
}: {
    auth: any;
    active_vessels: any;
    arrivals: any[];
}) {
    const { flash }: any = usePage().props;

    useEffect(() => {
        if (flash.success) {
            Swal.fire({
                title: '<span class="text-2xl font-black uppercase tracking-tight text-green-600">Éxito</span>',
                text: flash.success,
                icon: 'success',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false,
            });
        }
        if (flash.error) {
            Swal.fire({
                title: '<span class="text-2xl font-black uppercase tracking-tight text-red-600">Atención</span>',
                text: flash.error,
                icon: 'error',
                confirmButtonText: 'ENTENDIDO',
                confirmButtonColor: '#ef4444',
            });
        }
    }, [flash]);

    const ecoVessel = active_vessels.eco;
    const whiskyVessel = active_vessels.whisky;
    const externalVessel = active_vessels.external;

    return (
        <DashboardLayout user={auth.user} header="Status Muelle">
            <Head title="Status Muelle" />

            <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="mb-4">
                            <Link
                                href={route("dock.index")}
                                className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al menú
                            </Link>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Operación Marítima
                        </h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Terminal Marítima Pro-Agroindustria
                            <span className="text-slate-300">|</span>
                            {new Date().toLocaleDateString("es-MX", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                </div>

                {/* Main Visual: The Docks */}
                <div className="space-y-8">
                    {/* Render external dock only if occupied or relevant */}
                    <VesselCard vessel={externalVessel} side="EXTERNO" isExternal={true} />

                    <VesselCard vessel={ecoVessel} side="ECO" />
                    <VesselCard vessel={whiskyVessel} side="WHISKY" />
                </div>

                {/* Arrivals Section */}
                <div className="pt-4">
                    <ArrivalsTable arrivals={arrivals} />
                </div>

            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
            `}</style>
        </DashboardLayout>
    );
}
