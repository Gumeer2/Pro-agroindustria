import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import {
    UserX,
    Search,
    QrCode,
    ArrowLeft,
    ShieldAlert,
    Truck,
    CreditCard,
    AlertCircle,
    User,
    Hash,
    Scan,
    LogOut,
} from "lucide-react";
import axios from "axios";
// @ts-ignore
import { debounce } from "lodash";

interface Operator {
    id: number;
    name: string;
    license: string; // Added
    transport_line: string;
    real_transport_line: string; // Added
    economic_number: string; // Added
    unit_type: string;
    brand_model: string; // Added
    tractor_plate: string;
    trailer_plate: string;
    policy: string; // Added
    validity: string; // Added
    status: string;
}

export default function VetoOperator({ auth }: { auth: any }) {
    const [search, setSearch] = useState("");
    const [operator, setOperator] = useState<Operator | null>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchRef = useRef<HTMLInputElement>(null);

    const fetchOperators = async (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setOperator(null);
            return;
        }

        // Normalize input for common scanner keyboard layout issues
        const normalizedQuery = trimmedQuery.replace(/\?/g, '_').replace(/\]/g, '|').replace(/\[/g, '|').replace(/\}/g, '|').replace(/\{/g, '|');

        setSearching(true);
        setError(null);
        try {
            const response = await axios.get(route('surveillance.operators.search'), {
                params: { q: normalizedQuery }
            });

            if (response.data.length > 0) {
                setOperator(response.data[0]);
            } else {
                setOperator(null);
                setError("No se encontró ningún operador con esos datos.");
            }
        } catch (err) {
            console.error(err);
            setError("Error al buscar el operador.");
        } finally {
            setSearching(false);
        }
    };

    const debouncedSearch = useRef(
        debounce((query: string) => fetchOperators(query), 500)
    ).current;

    useEffect(() => {
        // Handle QR input directly or search by text
        // Normalize search term check for QR prefix using a flexible regex
        // Match "OP_EXIT", "OP?EXIT", "OP-EXIT", etc. followed by space
        const normalizedSearch = search.replace(/\?/g, '_').replace(/\]/g, '|');

        if (normalizedSearch.match(/^OP[_\-? \.]?EXIT\s/i)) {
            fetchOperators(search);
        } else {
            debouncedSearch(search);
        }
    }, [search]);

    const handleVeto = () => {
        if (!operator) return;

        if (confirm(`¿Está seguro que desea VETAR al operador ${operator.name}? Esta acción restringirá su acceso a la planta.`)) {
            setLoading(true);
            router.post(route('surveillance.operators.veto', operator.id), {}, {
                onSuccess: () => {
                    setLoading(false);
                    // Refresh operator data
                    fetchOperators(search);
                },
                onError: () => setLoading(false)
            });
        }
    };

    return (
        <DashboardLayout user={auth.user} header="Veto de Operadores">
            <Head title="Vigilancia - Vetar Operador" />

            <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Submodules Navigation Bar */}
                <div className="bg-white rounded-3xl p-3 shadow-md border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                        <Link
                            href={route("surveillance.index")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all border border-slate-200"
                        >
                            <Scan className="w-5 h-5 text-indigo-500" />
                            <span>Control de Accesos</span>
                        </Link>

                        <Link
                            href={route("surveillance.exits.index")}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all border border-slate-200"
                        >
                            <LogOut className="w-5 h-5 text-red-500" />
                            <span>Salidas de Operadores</span>
                        </Link>
                    </div>

                    <Link
                        href={route("surveillance.veto")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wide bg-red-600 text-white shadow-sm transition-colors"
                    >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Operadores Vetados</span>
                    </Link>
                </div>

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center">
                        <div className="bg-red-100 p-3 rounded-xl mr-4 shadow-sm">
                            <UserX className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Veto de Operadores</h2>
                            <p className="text-gray-500 text-sm font-medium">Escanee el QR o busque al operador para verificar o cambiar su estatus de veto</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-8 overflow-hidden relative group">
                    <div className="bg-indigo-600 absolute bottom-0 left-0 h-1 w-full scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {searching ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                            ) : (
                                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            )}
                        </div>
                        <input
                            ref={searchRef}
                            type="text"
                            autoFocus
                            className="block w-full pl-14 pr-12 py-5 bg-gray-50 border-none rounded-2xl focus:ring-0 text-xl font-black placeholder-gray-400 transition-all uppercase tracking-wide"
                            placeholder="ESCRIBIR ID, NOMBRE O ESCANEAR CÓDIGO QR..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-indigo-600 transition-colors animate-pulse">
                            <QrCode className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-2xl flex items-center shadow-md animate-fade-in-down">
                        <AlertCircle className="w-8 h-8 text-amber-500 mr-4 shrink-0" />
                        <div>
                            <p className="text-amber-900 font-black text-lg">SIN RESULTADOS</p>
                            <p className="text-amber-700 font-bold text-sm tracking-wide">{error}</p>
                        </div>
                    </div>
                )}

                {/* Operator Details Card */}
                {operator ? (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-fade-in-up">
                        {/* Status Header */}
                        <div className={`px-10 py-8 flex items-center justify-between ${operator.status === 'active' ? 'bg-gradient-to-r from-indigo-900 to-indigo-800 text-white' : 'bg-gradient-to-r from-red-900 to-red-800 text-white'}`}>
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6 backdrop-blur-md border border-white/20 shadow-inner">
                                    <User className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-3xl uppercase tracking-tighter leading-none">{operator.name}</h3>
                                    <div className="flex items-center mt-2">
                                        <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-black mr-3 tracking-widest border border-white/10 shadow-sm">ID: {operator.id}</span>
                                        <span className="text-indigo-200 text-xs font-black uppercase tracking-widest flex items-center">
                                            <CreditCard className="w-4 h-4 mr-1.5 opacity-70" />
                                            LIC: {operator.license}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border-2 ${operator.status === 'active' ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-red-500/10 text-red-200 border-red-500/30 ring-4 ring-red-500/10'}`}>
                                {operator.status === 'active' ? '● ESTATUS: ACTIVO' : '● ESTATUS: VETADO'}
                            </div>
                        </div>

                        <div className="p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
                                {/* Informacción de la Unidad */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-5 text-indigo-600 shadow-sm">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Línea Transportista</p>
                                                <p className="text-lg font-black text-gray-800 uppercase leading-none">{operator.transport_line}</p>
                                                <p className="text-[10px] font-bold text-indigo-400 mt-2 italic">Real: {operator.real_transport_line}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-5 text-indigo-600 shadow-sm">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tipo y Modelo</p>
                                                <p className="text-lg font-black text-gray-800 uppercase leading-none">{operator.unit_type}</p>
                                                <p className="text-[10px] font-bold text-indigo-400 mt-2 uppercase">{operator.brand_model}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div className="bg-amber-100 p-3 rounded-xl mr-5 text-amber-600 shadow-sm">
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Póliza de Seguro</p>
                                                <p className="text-lg font-black text-gray-800 uppercase leading-none">{operator.policy}</p>
                                                <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase">Vigencia: {operator.validity?.split('T')[0]}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                                            <div className="bg-indigo-100 p-3 rounded-xl mr-5 text-indigo-600 shadow-sm">
                                                <Hash className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Número Económico</p>
                                                <p className="text-2xl font-black text-gray-800 uppercase leading-none">{operator.economic_number}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Placas Section */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-[2rem] border-2 border-indigo-100/50 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
                                        <CreditCard className="w-16 h-16 text-indigo-100 absolute -right-4 -top-4 -rotate-12 group-hover:scale-125 transition-transform duration-500" />
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Placa Tracto</p>
                                        <p className="text-3xl font-black text-indigo-900 font-mono tracking-tighter leading-none">{operator.tractor_plate}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-[2rem] border-2 border-gray-200/50 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-xl">
                                        <CreditCard className="w-16 h-16 text-gray-100 absolute -right-4 -top-4 -rotate-12 group-hover:scale-125 transition-transform duration-500" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Placa Remolque</p>
                                        <p className="text-3xl font-black text-gray-800 font-mono tracking-tighter leading-none">{operator.trailer_plate || 'SIN REMOLQUE'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100">
                                {operator.status === 'active' ? (
                                    <button
                                        onClick={handleVeto}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xl shadow-xl shadow-red-200 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                                    >
                                        <ShieldAlert className="w-7 h-7 mr-3" />
                                        {loading ? 'PROCESANDO...' : 'VETAR OPERADOR'}
                                    </button>
                                ) : (
                                    <div className="bg-red-50 p-6 rounded-2xl flex items-center justify-center border-2 border-dashed border-red-200">
                                        <div className="text-center">
                                            <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-3" />
                                            <p className="text-xl font-black text-red-900 uppercase italic">ESTE OPERADOR YA SE ENCUENTRA VETADO</p>
                                            <p className="text-red-600 text-sm mt-1 font-bold">ACCESO RESTRINGIDO POR ADMINISTRACIÓN</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : !searching && !error && search && (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Esperando identificación...</h3>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
