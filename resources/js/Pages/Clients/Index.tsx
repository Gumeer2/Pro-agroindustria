import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { UserPlus, CheckCircle, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Index({ auth }: { auth: any }) {
    const { flash } = usePage<any>().props;
    const [showAlert, setShowAlert] = useState(!!flash?.success);

    useEffect(() => {
        if (flash?.success) {
            setShowAlert(true);
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    const menuItems = [
        {
            name: "Asignacion Operador - Cliente",
            icon: UserPlus,
            href: route("documentation.exit-operators.create", { from: "clients" }),
            description: "Registro y alta de operadores con asignación a clientes autorizados.",
            color: "bg-indigo-50 text-indigo-600",
            hover: "hover:border-indigo-500",
        },
    ];

    return (
        <DashboardLayout user={auth.user} header="Clientes">
            <Head title="Clientes" />

            <div className="py-12 relative">
                {/* Dynamic Alert */}
                {showAlert && flash?.success && (
                    <div className="fixed top-24 right-8 z-50 animate-fade-in-right">
                        <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-center max-w-md">
                            <div className="bg-green-100 p-2 rounded-full mr-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 mr-4">
                                <h4 className="text-green-900 font-bold text-sm">Operación Exitosa</h4>
                                <p className="text-green-700 text-xs font-medium">{flash.success}</p>
                            </div>
                            <button
                                onClick={() => setShowAlert(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto">
                        {menuItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group bg-white rounded-2xl shadow-md border-2 border-transparent p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${item.hover}`}
                            >
                                <div
                                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform transform group-hover:scale-110 shadow-sm ${item.color}`}
                                >
                                    <item.icon className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 break-words w-full">
                                    {item.name}
                                </h3>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
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
