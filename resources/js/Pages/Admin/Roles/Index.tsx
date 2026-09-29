import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Plus, Pencil, Trash2, ShieldCheck, Shield } from "lucide-react";

export default function Index({ auth, roles }: { auth: any; roles: any[] }) {
    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este rol?")) {
            router.delete(route("admin.roles.destroy", id));
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Administración de Roles">
            <Head title="Roles" />

            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 text-gray-900">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Listado de Roles
                        </h3>
                        <Link
                            href={route("admin.roles.create")}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Nuevo Rol
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre del Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Permisos
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {roles.map((role) => (
                                    <tr
                                        key={role.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                                                {role.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions &&
                                                role.permissions.length > 0 ? (
                                                    role.permissions.map(
                                                        (perm: any) => (
                                                            <span
                                                                key={perm.id}
                                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                            >
                                                                {perm.name}
                                                            </span>
                                                        ),
                                                    )
                                                ) : (
                                                    <span className="text-gray-400 italic">
                                                        Sin permisos asignados
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route(
                                                        "admin.roles.edit",
                                                        role.id,
                                                    )}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                {role.name !== "Admin" && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                role.id,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
