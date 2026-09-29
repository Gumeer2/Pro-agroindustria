import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Camera, Check, ChevronDown, Plus, Save } from "lucide-react";

export default function ProductionActivity({ auth, registration }: { auth: any; registration: any }) {
    if (!registration) {
        return (
            <DashboardLayout user={auth.user} header="Gestión de la Producción">
                <Head title="Gestión de la Producción" />
                <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-lg font-bold text-slate-800">Todavía no hay un inicio de turno registrado.</p>
                    <Link href={route("apt.management")} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:text-sky-800">
                        <ArrowLeft className="h-4 w-4" /> Volver a Gestión de la producción
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const lot = registration.lot || {};
    const user = registration.user || {};
    const startedAt = new Date(registration.started_at);

    return (
        <DashboardLayout user={auth.user} header="Gestión de la Producción">
            <Head title="Gestión de la Producción" />
            <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Link href={route("apt.production.hub")} className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-sky-700 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition hover:bg-sky-50 hover:border-sky-200">
                            <ArrowLeft className="h-4 w-4" /> Volver a Gestión de la producción
                        </Link>
                    </div>
                    <header className="mb-4 bg-gradient-to-r from-slate-900 to-blue-900 px-5 py-2 text-2xl font-black uppercase tracking-wide text-white shadow-lg">
                        Gestión de la producción
                    </header>
                    <nav className="mb-6 grid max-w-sm grid-cols-1 gap-2">
                        <span className="rounded-xl bg-sky-600 px-4 py-3 text-center font-black uppercase text-white shadow">Generación de lote</span>
                    </nav>
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,780px)_330px]">
                        <section className="space-y-3 rounded-[3rem] bg-slate-200 p-5">
                            <DataSection title="Personal a cargo">
                                <DataField label="Usuario asignado" value={user.name || "Usuario actual"} />
                                <DataField label="Puesto" value={registration.position || "Automático"} />
                                <DataField label="Turno" value={registration.shift} />
                                <DataField label="Fecha" value={startedAt.toLocaleDateString("es-MX")} />
                            </DataSection>
                            <DataSection title="Información de lote de producción en proceso">
                                <DataField label="No. de lote" value={lot.folio || "Automático"} wide />
                                <DataField label="Producto" value="Pendiente de asignar" />
                                <DataField label="Origen" value={lot.plant_origin || "Automático"} />
                                <DataField label="Disposición" value={lot.warehouse || "Automático"} />
                                <DataField label="Inicio" value={startedAt.toLocaleDateString("es-MX")} />
                                <DataField label="Final" value="En proceso" />
                                <DataField label="Cierre de lote" value="Seleccionar" />
                            </DataSection>
                            <DataSection title="Registro de actividades del turno">
                                <div className="col-span-full flex flex-wrap items-center gap-5 text-sm font-bold text-sky-700"><span><Check className="mr-1 inline h-4 w-4 rounded-full bg-sky-700 text-white" /> Incidencias</span><span>◯ Relevancias</span><span className="ml-auto">Hora <select className="ml-2 rounded border border-sky-500 px-3 py-1 font-normal"><option>Seleccionar</option></select></span></div>
                                <textarea className="min-h-24 rounded-2xl border-0 px-4 py-3 lg:col-span-2" placeholder="Captura" />
                                <div className="flex items-center justify-center gap-2 rounded-xl border border-sky-500 bg-white px-3 py-2 text-sm font-bold text-sky-700">Ubicación <span className="text-slate-400">Automático</span></div>
                                <button type="button" className="flex items-center justify-center gap-2 font-black text-sky-700"><Plus className="h-7 w-7 text-green-600" /><Camera className="h-7 w-7" /> Evidencia fotográfica</button>
                                <button type="button" className="inline-flex items-center justify-center gap-2 rounded border border-sky-600 bg-sky-50 px-5 py-2 font-bold text-slate-700"><Save className="h-4 w-4" /> Guardar</button>
                            </DataSection>
                            <DataSection title="Historial de incidencias y/o relevancias del día">
                                <div className="col-span-full overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="text-slate-700"><th>Fecha</th><th>Hora</th><th>No. de lote</th><th>Disposición</th><th>Ubicación</th><th>Producto</th><th>Descripción</th><th>Usuario</th></tr></thead><tbody><tr className="bg-slate-400 font-bold text-white"><td>{startedAt.toLocaleDateString("es-MX")}</td><td>{startedAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</td><td>{lot.folio}</td><td>{lot.warehouse || "Automático"}</td><td>Automático</td><td>Pendiente</td><td>Inicio de turno</td><td>{user.name}</td></tr></tbody></table></div>
                            </DataSection>
                        </section>
                        <aside className="min-h-[420px] border border-slate-700 bg-white" aria-label="Vista de proceso" />
                    </div>
                </div>
            </main>
        </DashboardLayout>
    );
}

function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="grid grid-cols-2 gap-3 rounded-[2rem] border-2 border-slate-800 p-4 sm:grid-cols-4"><h2 className="col-span-full text-sm font-black uppercase text-sky-700">{title}</h2>{children}</section>;
}
function DataField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return <label className={`${wide ? "sm:col-span-2" : ""} text-xs font-bold uppercase text-sky-700`}>{label}<input readOnly value={value} className="mt-1 w-full border border-sky-500 bg-white px-2 py-1 text-sm font-normal text-slate-800" /></label>;
}
