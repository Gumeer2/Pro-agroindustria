import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Scan,
    LogOut,
    Truck,
    Clock,
    ShieldAlert,
    ArrowRight,
    ShieldCheck,
    FileText
} from "lucide-react";

export default function Index({
    auth,
    pending_count = 0,
    in_plant_count = 0,
    vetoed_count = 0,
}: {
    auth: any;
    pending_count?: number;
    in_plant_count?: number;
    vetoed_count?: number;
}) {
    const modules = [
        {
            title: "Control de Accesos",
            subtitle: "Entradas y Verificación",
            description:
                "Escaneo de gafete/QR de operadores (Barco y Salidas), lista de espera, registro de motivos de retención y autorización de ingreso a planta.",
            icon: Scan,
            href: route("surveillance.access.index"),
            gradient: "from-indigo-600 to-blue-600",
            bgLight: "bg-indigo-50/70 hover:bg-indigo-50",
            borderColor: "border-indigo-100 hover:border-indigo-400",
            shadowColor: "hover:shadow-indigo-500/10",
            iconBg: "bg-indigo-600 text-white shadow-lg shadow-indigo-200",
            badgeText: `${pending_count} Pendiente${pending_count === 1 ? "" : "s"}`,
            badgeColor: pending_count > 0 ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-100 text-emerald-800 border-emerald-200",
        },
        {
            title: "Salidas de Operadores",
            subtitle: "Gestión en Planta y Despacho",
            description:
                "Control de unidades dentro de planta, vinculación de órdenes de embarque activas / destaradas (1 a 3 órdenes) y confirmación de salida.",
            icon: LogOut,
            href: route("surveillance.exits.index"),
            gradient: "from-rose-600 to-red-600",
            bgLight: "bg-rose-50/70 hover:bg-rose-50",
            borderColor: "border-rose-100 hover:border-rose-400",
            shadowColor: "hover:shadow-rose-500/10",
            iconBg: "bg-rose-600 text-white shadow-lg shadow-rose-200",
            badgeText: `${in_plant_count} en Planta`,
            badgeColor: in_plant_count > 0 ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-slate-100 text-slate-700 border-slate-200",
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Vigilancia y Control de Acceso">
            <Head title="Vigilancia - Módulo Principal" />

            <div className="py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

                    {/* Header Banner */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            Módulo de Seguridad y Operaciones
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
                            Vigilancia y Control de Acceso
                        </h1>
                        <p className="text-slate-500 text-base max-w-2xl mx-auto font-medium">
                            Selecciona el submódulo de trabajo para gestionar las entradas o las salidas de operadores en planta.
                        </p>
                    </div>

                    {/* 2 Main Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {modules.map((item, idx) => (
                            <Link
                                key={idx}
                                href={item.href}
                                className={`group relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${item.borderColor} ${item.shadowColor} flex flex-col justify-between overflow-hidden`}
                            >
                                {/* Top Glow Accent */}
                                <div
                                    className={`absolute top-0 right-0 w-44 h-44 bg-gradient-to-br ${item.gradient} opacity-5 rounded-full blur-3xl group-hover:opacity-15 transition-opacity`}
                                />

                                <div className="space-y-6 relative z-10">
                                    {/* Card Header: Icon & Badge */}
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}
                                        >
                                            <item.icon className="w-8 h-8" />
                                        </div>

                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${item.badgeColor}`}
                                        >
                                            {item.badgeText}
                                        </span>
                                    </div>

                                    {/* Titles & Descriptions */}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                            {item.subtitle}
                                        </p>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium mt-3 leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Action CTA */}
                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end text-sm font-black uppercase tracking-wider text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Secondary Option: Operadores Vetados */}
                    <div className="pt-4 flex justify-center">
                        <Link
                            href={route("surveillance.veto")}
                            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 font-bold text-xs uppercase tracking-wider transition-all shadow-sm group"
                        >
                            <div className="p-1.5 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span>Consulta y Registro de Operadores Vetados</span>
                            {vetoed_count > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                                    {vetoed_count}
                                </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
