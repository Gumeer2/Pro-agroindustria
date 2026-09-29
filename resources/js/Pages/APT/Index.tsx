import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import {
    Printer,
    UserPlus,
    Search,
    Ship,
    Anchor,
    Scan,
    LayoutDashboard,
    Database,
    Truck,
    ArrowLeft,
    Factory,
    Package,
    Wrench,
    Box,
    Shield,
    Users,
    AlertCircle,
    UserCheck,
    Settings,
    Clock,
    TrendingUp,
    Boxes,
} from "lucide-react";

export default function Index({ auth, productionMode = false }: { auth: any; productionMode?: boolean }) {
    const userRoles = (auth?.user?.roles as string[]) || [];
    const isJefeOrAdmin = userRoles.includes("Jefe de Almacen") || userRoles.includes("Admin");
    const isAlmacenOnly = userRoles.includes("Almacen") && !isJefeOrAdmin;

    const allProductionSubmodules = [
        { name: "Gestión de la producción", description: "Control y seguimiento de la producción.", icon: Factory, href: route("apt.production.hub"), color: "bg-green-50 text-green-600", hover: "hover:border-green-500" },
        { name: "Gestión de proceso de embarques", description: "Seguimiento de órdenes y procesos de embarque.", icon: Truck, href: route("apt.shipment-process"), color: "bg-blue-50 text-blue-600", hover: "hover:border-blue-500" },
        { name: "Gestión de inventarios", description: "Control de existencias, producción diaria e inventario inicial de Urea Agrícola.", icon: Package, href: `${route("apt.inventory.index")}?from=production`, color: "bg-purple-50 text-purple-600", hover: "hover:border-purple-500" },
        { name: "Gestión de maquinarias", description: "Registro y mantenimiento de maquinaria operativa.", icon: Wrench, href: `${route("apt.status")}?from=production`, color: "bg-orange-50 text-orange-600", hover: "hover:border-orange-500" },
        { name: "Gestión de equipos envasado", description: "Control de equipos y unidades de envasado.", icon: Box, href: `${route("apt.unit-status")}?from=production`, color: "bg-yellow-50 text-yellow-600", hover: "hover:border-yellow-500" },
        { name: "Gestión de equipos de seguridad", description: "Administración y control de equipos de seguridad.", icon: Shield, href: route("apt.scanner"), color: "bg-slate-100 text-slate-600", hover: "hover:border-slate-500" },
        { name: "Gestión prestadores de servicios", description: "Control de asistencias de personal y contratistas (GLS-AP-FO-005).", icon: Users, href: route("apt.attendance.index"), color: "bg-indigo-50 text-indigo-600", hover: "hover:border-indigo-500" },
        { name: "Gestión de requerimientos", description: "Registro y seguimiento de solicitudes operativas.", icon: AlertCircle, href: `${route("apt.status")}?from=production`, color: "bg-cyan-50 text-cyan-600", hover: "hover:border-cyan-500" },
    ];

    const productionSubmodules = allProductionSubmodules;

    if (productionMode) {
        return (
            <DashboardLayout user={auth.user} header="Gestión de almacenes">
                <Head title="Gestión de almacenes" />
                <div data-production-page="true" className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <Link
                                href={route("apt.index")}
                                className="inline-flex items-center text-gray-500 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium mb-5"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Volver al menú
                            </Link>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Gestión de almacenes
                            </h2>
                            <p className="text-gray-600">
                                Selecciona un submódulo para continuar.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {productionSubmodules.map((item) => (
                                <Link key={item.name} href={item.href} className={`group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl ${item.hover}`}>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${item.color}`}>
                                        <item.icon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 break-words w-full">{item.name}</h3>
                                    <p className="text-gray-500 mt-2 text-sm">{item.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const menuItems = [
        {
            name: "Gestión de almacenes",
            icon: Settings,
            href: route("apt.production"),
            description: "Consultar y gestionar los almacenes en APT.",
            color: "bg-emerald-50 text-gray-500",
            hover: "hover:border-emerald-500",
        },
        {
            name: "Escanear Entrada",
            icon: Scan,
            href: route("apt.scanner"),
            description: "Escanear código QR para registrar entrada/salida.",
            color: "bg-purple-50 text-purple-600",
            hover: "hover:border-purple-500",
        },
        {
            name: "Status Unidades",
            icon: Truck,
            href: route("apt.unit-status"),
            description: "Unidades en planta esperando destare.",
            color: "bg-blue-50 text-blue-600",
            hover: "hover:border-blue-500",
        },
        {
            name: "Seguimiento de OE del Día",
            icon: Clock,
            href: route("apt.oe-tracker"),
            description: "Control en tiempo real de OE por presentación (Envasado, Granel, SADER).",
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-500",
        },
        ...(!isAlmacenOnly
            ? [
                  {
                      name: "Gestión de lotes",
                      icon: Database,
                      href: route("apt.lots.index"),
                      description: "Administración de folios y estados de lotes.",
                      color: "bg-emerald-50 text-emerald-600",
                      hover: "hover:border-emerald-500",
                  },
                  {
                      name: "Status APT",
                      icon: LayoutDashboard,
                      href: route("apt.status"),
                      description: "Visualizar ocupación de almacenes y cubículos.",
                      color: "bg-indigo-50 text-indigo-600",
                      hover: "hover:border-indigo-500",
                  },
              ]
            : []),
    ];

    return (
        <DashboardLayout user={auth.user} header="Administración Portuaria">
            <Head title="APT" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl ${item.hover}`}
                            >
                                <div
                                    className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform transform group-hover:scale-110 ${item.color}`}
                                >
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
        </DashboardLayout>
    );
}
