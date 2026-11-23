import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import { UserCheck, ClipboardList, ArrowLeft } from "lucide-react";

export default function ProductionHub({ auth }: { auth: any }) {
    const submodules = [
        {
            id: 1,
            name: "Asignación Lote Empleado",
            description: "Completar datos para iniciar el turno y asignar el lote.",
            icon: UserCheck,
            href: route("apt.management"),
            color: "bg-blue-50 text-blue-600",
            hover: "hover:border-blue-500",
        },
        {
            id: 2,
            name: "Reporte de Lotes",
            description: "Consulta e historial de reportes de lotes registrados.",
            icon: ClipboardList,
            href: route("apt.management.lots.report"),
            color: "bg-emerald-50 text-emerald-600",
            hover: "hover:border-emerald-500",
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Gestión de la Producción">
            <Head title="Gestión de la Producción" />

            <div className="py-6 sm:py-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 sm:mb-8">
                        <Link
                            href={route("apt.production")}
                            className="inline-flex items-center text-gray-500 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-4 sm:mb-5"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver a Gestión de almacenes
                        </Link>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            Gestión de la producción
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Selecciona una opción para continuar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                        {submodules.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className={`group bg-white rounded-2xl shadow-md border-2 border-transparent p-6 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl ${item.hover}`}
                            >
                                <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-110 ${item.color}`}>
                                    <item.icon className="w-8 h-8 sm:w-12 sm:h-12" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words w-full">{item.name}</h3>
                                <p className="text-gray-500 mt-2 sm:mt-3 text-xs sm:text-sm max-w-xs">{item.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
