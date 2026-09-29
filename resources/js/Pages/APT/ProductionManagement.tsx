import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Factory,
    Save,
    UserRound,
    CalendarDays,
    MapPin,
    PackageOpen,
} from "lucide-react";
import { useState } from "react";

type ShiftRegistration = {
    id?: number;
    user?: { id: number; name: string };
    position: string;
    date: string;
    shift: string;
    lot?: { id: string; folio: string };
    evidence: string | null;
};

const shifts = ["Turno 1", "Turno 2", "Turno 3", "Turno 1A", "Turno 1B"];

export default function ProductionManagement({ auth, users = [], lots = [], latestRegistration = null, flash = {}, canManageShift = true }: { auth: any; users?: any[]; lots?: any[]; latestRegistration?: ShiftRegistration | null; flash?: any; canManageShift?: boolean }) {
    const { base_url: baseUrl = "" } = usePage().props as { base_url?: string };
    const userRoles = (auth?.user?.roles as string[]) || [];
    const isAlmacenOnly = userRoles.includes("Almacen") && !userRoles.includes("Admin") && !userRoles.includes("Jefe de Almacen");
    const today = new Date().toISOString().split("T")[0];
    const [user, setUser] = useState(latestRegistration?.user?.id?.toString() || "");
    const [shift, setShift] = useState(latestRegistration?.shift || "");
    const [lot, setLot] = useState(latestRegistration?.lot?.id?.toString() || "");
    const { data, setData, post, processing, errors } = useForm({
        user_id: user,
        position: latestRegistration?.position || "Automático",
        shift,
        lot_id: lot,
        evidence: null as File | null,
    });
    const saved = latestRegistration || (flash.success ? { id: 1 } : null);
    const selectedUser = users.find((item: any) => item.id.toString() === data.user_id);


    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route("apt.management.shift.store"), { forceFormData: true });
    };

    return (
        <DashboardLayout user={auth.user} header="Gestión de la Producción">
            <Head title="Gestión de la Producción" />

            <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Link
                            href={isAlmacenOnly ? route("apt.production.hub") : route("apt.production")}
                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-700"
                        >
                            ← {isAlmacenOnly ? "Volver a Gestión de la producción" : "Volver a Gestión de almacenes"}
                        </Link>
                        {saved && (
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                                <CheckCircle2 className="h-5 w-5" /> Registro guardado
                            </div>
                        )}
                    </div>

                    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
                        <div className="flex flex-col gap-4 bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 px-6 py-6 text-white sm:px-8 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={`${window.location.origin}${baseUrl}/Proagro.png`}
                                    alt="Proagroindustria"
                                    className="h-[52px] w-[52px] rounded-[14px] bg-white object-contain p-1"
                                />
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-100">Módulo operativo · APT</p>
                                    <h1 className="text-3xl font-black tracking-tight">Gestión de la producción</h1>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-sky-700">Lote en recepción</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                            {!canManageShift && (
                                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                                    <div>
                                        <p className="text-sm font-extrabold text-blue-900">
                                            {saved ? 'Lote asignado por el Jefe de Almacén' : 'Sin lote asignado'}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-blue-600">
                                            {saved
                                                ? 'Solo puedes consultar el lote que te asignaron. El inicio de turno lo registra el Jefe de Almacén.'
                                                : 'El lote permanece vacío hasta que el Jefe de Almacén te asigne uno.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="mb-7 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <p className="text-sm font-semibold text-slate-500">{canManageShift ? 'Completa los datos para iniciar el turno.' : 'Información del turno y lote en recepción.'}</p>
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400">{canManageShift ? '* Campos obligatorios' : 'Solo lectura'}</span>
                            </div>
                            <div className="grid gap-8 lg:grid-cols-[1fr_1fr_0.85fr]">
                                <div className="space-y-6">
                                    <FieldLabel icon={<UserRound className="h-4 w-4" />} label="Usuario asignado">
                                        <select value={data.user_id} onChange={(event) => { const selected = users.find((item: any) => item.id.toString() === event.target.value); setUser(event.target.value); setData("user_id", event.target.value); setData("position", selected?.position || selected?.level || "Almacén"); }} required disabled={!canManageShift} className="field-control">
                                            <option value="">Seleccionar usuario</option>
                                            {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                        </select>
                                        {errors.user_id && <p className="mt-1 text-xs font-semibold text-red-600">{errors.user_id}</p>}
                                    </FieldLabel>
                                    <FieldLabel icon={<ClipboardList className="h-4 w-4" />} label="Turno">
                                        <select value={data.shift} onChange={(event) => { setShift(event.target.value); setData("shift", event.target.value); }} required disabled={!canManageShift} className="field-control">
                                            <option value="">Seleccionar turno</option>
                                            {shifts.map((item) => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </FieldLabel>
                                </div>

                                <div className="space-y-6">
                                    <FieldLabel icon={<MapPin className="h-4 w-4" />} label="Puesto">
                                        <input value={selectedUser?.position || selectedUser?.level || data.position || "Almacén"} readOnly className="field-control cursor-not-allowed bg-slate-50 text-slate-500" />
                                    </FieldLabel>
                                    <FieldLabel icon={<PackageOpen className="h-4 w-4" />} label="Lote en recepción">
                                        <select value={data.lot_id} onChange={(event) => { setLot(event.target.value); setData("lot_id", event.target.value); }} required disabled={!canManageShift} className="field-control">
                                            <option value="">Seleccionar lote</option>
                                            {lots.map((item) => <option key={item.id} value={item.id}>{item.folio}</option>)}
                                        </select>
                                        {errors.lot_id && <p className="mt-1 text-xs font-semibold text-red-600">{errors.lot_id}</p>}
                                    </FieldLabel>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div>
                                        <span className="field-label"><CalendarDays className="h-4 w-4" /> Fecha</span>
                                        <div className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-slate-600">
                                            <CalendarDays className="h-5 w-5 text-sky-600" />
                                            {new Date(`${today}T00:00:00`).toLocaleDateString("es-MX")}
                                        </div>
                                    </div>
                                    {canManageShift && (
                                    <button type="submit" disabled={processing || !data.user_id || !data.shift || !data.lot_id} className="inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 font-black text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                                        <Save className="h-5 w-5" /> {processing ? "Guardando..." : "Guardar registro"}
                                    </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </section>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <InfoCard icon={<Factory />} title="Producción" text="Control del inicio de operación." />
                        <InfoCard icon={<PackageOpen />} title="Lote" text="Identificación del lote en recepción." />
                        <InfoCard icon={<CheckCircle2 />} title="Registro" text="Inicio de turno preparado." />
                    </div>
                </div>
            </main>
            <style>{`.field-control{margin-top:.5rem;width:100%;border-radius:.75rem;border:1px solid #bae6fd;background:#fff;padding:.75rem 1rem;font-weight:600;color:#334155;box-shadow:0 1px 2px rgb(15 23 42 / .05);outline:none}.field-control:focus{border-color:#0284c7;box-shadow:0 0 0 3px rgb(14 165 233 / .15)}.field-label{display:flex;align-items:center;gap:.5rem;font-size:.75rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#0369a1}`}</style>
        </DashboardLayout>
    );
}

function FieldLabel({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return <label className="block"><span className="field-label">{icon}{label}</span>{children}</label>;
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
    return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="rounded-xl bg-sky-50 p-3 text-sky-600">{icon}</div><div><p className="font-black text-slate-800">{title}</p><p className="text-sm text-slate-500">{text}</p></div></div>;
}
