import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Plus,
    Pencil,
    Trash2,
    UserPlus,
    Search,
    Users,
    ShieldCheck,
    UserCheck,
    Calendar,
    Mail,
    User as UserIcon,
    AlertCircle,
    Lock,
    Unlock,
    ShieldAlert
} from "lucide-react";
import Pagination from "@/Components/Pagination";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";

// Simple Debounce Hook
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

// Helper for Avatar Background colors
const getAvatarColor = (name: string) => {
    const colors = [
        "bg-indigo-500", "bg-emerald-500", "bg-sky-500",
        "bg-amber-500", "bg-rose-500", "bg-violet-500",
        "bg-fuchsia-500", "bg-cyan-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const getRoleBadgeStyle = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('admin')) return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10";
    if (lowerRole.includes('bascula')) return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10";
    if (lowerRole.includes('almacen')) return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10";
    if (lowerRole.includes('muelle')) return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10";
    return "bg-gray-50 text-gray-700 border-gray-200 ring-gray-500/10";
};

export default function Index({
    auth,
    users,
    filters,
}: {
    auth: any;
    users: any;
    filters: any;
}) {
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Trigger search when debounced value changes
    useEffect(() => {
        const currentSearch = filters.search || "";
        if (debouncedSearch !== currentSearch) {
            router.get(
                route("admin.users.index"),
                { search: debouncedSearch || undefined },
                { preserveState: true, replace: true },
            );
        }
    }, [debouncedSearch]);

    const handleDelete = (user: any) => {
        Swal.fire({
            title: "¿Estás seguro?",
            text: `¿Deseas eliminar al usuario ${user.name}? Esta acción no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5',
                cancelButton: 'rounded-xl px-5 py-2.5'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("admin.users.destroy", user.id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: "Eliminado",
                            text: "El usuario ha sido eliminado correctamente.",
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' }
                        });
                    }
                });
            }
        });
    };

    const handleToggleBlock = (user: any) => {
        const action = user.is_blocked ? "desbloquear" : "bloquear";
        const icon = user.is_blocked ? "question" : "warning";
        const confirmButtonColor = user.is_blocked ? "#10b981" : "#ef4444";

        Swal.fire({
            title: `¿Deseas ${action} al usuario?`,
            text: `El usuario ${user.name} ${user.is_blocked ? "recuperará" : "perderá"} el acceso al sistema.`,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: "#6b7280",
            confirmButtonText: `Sí, ${action}`,
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5',
                cancelButton: 'rounded-xl px-5 py-2.5'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(route("admin.users.toggle-block", user.id), {}, {
                    onSuccess: () => {
                        Swal.fire({
                            title: user.is_blocked ? "Desbloqueado" : "Bloqueado",
                            text: `El usuario ha sido ${action} correctamente.`,
                            icon: "success",
                            timer: 2000,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' }
                        });
                    }
                });
            }
        });
    };

    // Quick Stats Calculation (from current page data)
    const stats = useMemo(() => {
        return {
            total: users.total || 0,
            admins: users.data.filter((u: any) =>
                u.roles?.some((r: string) => r.toLowerCase().includes('admin'))
            ).length,
            recent: users.data.filter((u: any) => {
                const date = new Date(u.created_at);
                const now = new Date();
                return (now.getTime() - date.getTime()) < (7 * 24 * 60 * 60 * 1000); // last 7 days
            }).length
        };
    }, [users.data]);

    return (
        <DashboardLayout user={auth.user} header="Administración de Usuarios">
            <Head title="Gestión de Usuarios" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                            <Users className="w-8 h-8 mr-3 text-indigo-600" />
                            Control de Usuarios
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Gestione los accesos, roles y perfiles del personal en el sistema.
                        </p>
                    </div>
                    <Link
                        href={route("admin.users.create")}
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 border border-transparent rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        NUEVO USUARIO
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-shadow">
                        <div className="p-3 bg-indigo-50 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Usuarios</p>
                            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-shadow">
                        <div className="p-3 bg-emerald-50 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administradores</p>
                            <p className="text-2xl font-black text-slate-800">{stats.admins}</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center group hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nuevos (7d)</p>
                            <p className="text-2xl font-black text-slate-800">{stats.recent}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

                    {/* Filters Header */}
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="relative w-full sm:w-96 group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2.5 border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                                placeholder="Buscar por nombre, usuario o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-xs text-slate-400 font-medium italic">
                            Mostrando {users.data.length} de {users.total} registros
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Usuario</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Contacto</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Roles</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Registrado</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.data.length > 0 ? (
                                    users.data.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-xl ${getAvatarColor(user.name)} flex items-center justify-center text-white font-bold shadow-inner ring-4 ring-white`}>
                                                        {user.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{user.name}</div>
                                                        <div className="text-xs text-slate-400 flex items-center mt-0.5">
                                                            <UserIcon className="w-3 h-3 mr-1" />
                                                            @{user.username}
                                                            {user.is_blocked && (
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-tighter">
                                                                    <ShieldAlert className="w-2.5 h-2.5 mr-1" />
                                                                    Bloqueado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Array.isArray(user.roles) && user.roles.map((role: string) => (
                                                        <span key={role} className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ring-1 ring-inset ${getRoleBadgeStyle(role)} transition-all`}>
                                                            {role.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                                    {new Date(user.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleBlock(user)}
                                                        className={`p-2 rounded-lg transition-all ${user.is_blocked
                                                            ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                                                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                            }`}
                                                        title={user.is_blocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
                                                    >
                                                        {user.is_blocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                    </button>
                                                    <Link
                                                        href={route("admin.users.edit", user.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Editar Usuario"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Eliminar Usuario"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 uppercase text-xs font-bold tracking-widest">
                                            <div className="flex flex-col items-center justify-center opacity-50">
                                                <AlertCircle className="w-10 h-10 mb-3" />
                                                No se encontraron usuarios
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                        <Pagination links={users.links} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
