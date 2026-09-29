import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Box,
    ShieldCheck,
} from "lucide-react";

export default function Index({ auth }: { auth: any }) {
    const menuItems = [
        {
            name: "Gestión Pesos Burreo",
            icon: ShieldCheck,
            href: route("traffic.burreo.index"),
            description: "Administrar pesos provisionales y de calado.",
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-500",
        },
        {
            name: "Productos",
            icon: Box,
            href: route("traffic.products.index"),
            description: "Alta y lista de productos.",
            color: "bg-amber-50 text-amber-600",
            hover: "hover:border-amber-500",
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Tráfico y Logística">
            <Head title="Tráfico" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group bg-white rounded-xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl ${item.hover || item.color.includes("green") ? "hover:border-green-500" : item.color.includes("purple") ? "hover:border-purple-500" : "hover:border-indigo-500"}`} // Fallback logic for hover if not present, though Traffic has hover property.
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
