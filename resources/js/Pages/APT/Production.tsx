import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Factory,
    Clock,
    Truck,
    Package,
    Boxes,
    TrendingUp,
    Wrench,
    Box,
    Shield,
    Users,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";

export default function Production({ auth }: { auth: any }) {
    const submodules = [
        {
            id: 1,
            name: "Gestión de la producción",
            description: "Control y seguimiento de la producción.",
            icon: Factory,
            href: route("apt.production.hub"),
        },
        {
            id: 2,
            name: "Gestión de proceso de embarques",
            description: "Seguimiento de órdenes y procesos de embarque.",
            icon: Truck,
            href: route("apt.shipment-process"),
        },
        {
            id: 3,
            name: "Gestión de inventarios",
            description: "Control de existencias, producción diaria e inventario inicial de Urea Agrícola.",
            icon: Package,
            href: `${route("apt.inventory.index")}?from=production`,
        },
        {
            id: 4,
            name: "Gestión de maquinarias",
            description: "Registro y mantenimiento de maquinaria operativa.",
            icon: Wrench,
            href: `${route("apt.status")}?from=production`,
        },
        {
            id: 5,
            name: "Gestión de equipos envasado",
            description: "Control de equipos y unidades de envasado.",
            icon: Box,
            href: `${route("apt.unit-status")}?from=production`,
        },
        {
            id: 7,
            name: "Gestión de equipos de seguridad",
            description: "Administración y control de equipos de seguridad.",
            icon: Shield,
            href: route("apt.scanner"),
        },
        {
            id: 8,
            name: "Gestión prestadores de servicios",
            description: "Control de asistencias de personal y contratistas (GLS-AP-FO-005).",
            icon: Users,
            href: route("apt.attendance.index"),
        },
        {
            id: 9,
            name: "Gestión de requerimientos",
            description: "Registro y seguimiento de solicitudes operativas.",
            icon: AlertCircle,
            href: `${route("apt.status")}?from=production`,
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Gestión de almacenes">
            <Head title="Gestión de almacenes" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6">
                            <Link
                                href={route("apt.index")}
                                className="inline-flex items-center text-gray-500 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-2"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al menú principal APT
                            </Link>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Submódulos
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {submodules.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:border-emerald-500"
                                >
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                                        <item.icon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 break-words w-full">
                                        {item.name}
                                    </h3>
                                    <p className="text-gray-500 mt-2 text-sm">
                                        {item.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
