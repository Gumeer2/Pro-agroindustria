import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    Truck,
    ArrowLeft,
    Search,
    Clock,
    User,
    Activity,
    Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import Pagination from "@/Components/Pagination";
import { pickBy } from "lodash";

const Timer = ({ entryAt }: { entryAt: string }) => {
    const [time, setTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const start = new Date(entryAt);
            const diff = now.getTime() - start.getTime();

            if (diff < 0) {
                setTime("0m");
                return;
            }

            const diffMinutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            if (hours > 0) {
                setTime(`${hours}h ${minutes}m`);
            } else {
                setTime(`${minutes}m`);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, [entryAt]);

    return (
        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            {time}
        </span>
    );
};

export default function UnitStatus({
    auth,
    pending_exit,
    clients = [],
    products = [],
    warehouses = [],
    filters = { client_id: '', product_id: '', warehouse: '', presentation: '', search: '', tab: 'sale' }
}: {
    auth: any;
    pending_exit: any;
    clients?: any[];
    products?: any[];
    warehouses?: string[];
    filters?: { client_id: string, product_id: string, warehouse: string, presentation: string, search: string, tab: string };
}) {
    const [operationType, setOperationType] = useState<'sale' | 'vessel'>(filters?.tab as 'sale' | 'vessel' || 'sale');
    const [selectedClient, setSelectedClient] = useState(filters?.client_id || '');
    const [selectedProduct, setSelectedProduct] = useState(filters?.product_id || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters?.warehouse || '');
    const [selectedPresentation, setSelectedPresentation] = useState(filters?.presentation || '');
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'client_id') setSelectedClient(value);
        if (key === 'product_id') setSelectedProduct(value);
        if (key === 'warehouse') setSelectedWarehouse(value);
        if (key === 'presentation') setSelectedPresentation(value);
        if (key === 'search') setSearchQuery(value);
        if (key === 'tab') setOperationType(value as 'sale' | 'vessel');

        const from = new URLSearchParams(window.location.search).get("from");
        router.get(route('apt.unit-status'), {
            client_id: key === 'client_id' ? value : selectedClient,
            product_id: key === 'product_id' ? value : selectedProduct,
            warehouse: key === 'warehouse' ? value : selectedWarehouse,
            presentation: key === 'presentation' ? value : selectedPresentation,
            search: key === 'search' ? value : (key === 'tab' ? '' : searchQuery),
            tab: key === 'tab' ? value : operationType,
            ...(from ? { from } : {}),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    return (
        <DashboardLayout user={auth.user} header="APT - Estatus de Unidades">
            <Head title="Estatus de Unidades" />

            <div className="max-w-[98%] mx-auto py-8 px-4 space-y-8">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={new URLSearchParams(window.location.search).get("from") === "production" ? route("apt.production") : route("apt.index")}
                                className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {new URLSearchParams(window.location.search).get("from") === "production" ? "Volver al menú de submódulos" : "Volver"}
                            </Link>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center border-l-4 border-indigo-500 pl-4">
                                <Truck className="w-6 h-6 mr-2 text-indigo-600" />
                                Pendientes de Salida (Destare)
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 pb-4">
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => handleFilterChange('tab', 'sale')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${operationType === 'sale'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                VENTA
                            </button>
                            <button
                                onClick={() => handleFilterChange('tab', 'vessel')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${operationType === 'vessel'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                BARCO
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar por OE, Chofer, Placas..."
                                    className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleFilterChange('search', searchQuery)}
                                />
                            </div>

                            {operationType === 'vessel' && (
                                <select
                                    value={selectedWarehouse}
                                    onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                                    className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-32 font-bold text-gray-700"
                                >
                                    <option value="">Almacén</option>
                                    {warehouses?.map((w) => (
                                        <option key={w} value={w}>{w}</option>
                                    ))}
                                </select>
                            )}

                            {operationType === 'sale' && (
                                <select
                                    value={selectedPresentation}
                                    onChange={(e) => handleFilterChange('presentation', e.target.value)}
                                    className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 w-32 font-bold text-gray-700"
                                >
                                    <option value="">Presentación</option>
                                    <option value="GRANEL">GRANEL</option>
                                    <option value="ENVASADO">ENVASADO</option>
                                </select>
                            )}

                            <select
                                value={selectedProduct}
                                onChange={(e) => handleFilterChange('product_id', e.target.value)}
                                className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px] font-bold text-gray-700"
                            >
                                <option value="">Producto</option>
                                {products?.map((p: any) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>

                            <select
                                value={selectedClient}
                                onChange={(e) => handleFilterChange('client_id', e.target.value)}
                                className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px] font-bold text-gray-700"
                            >
                                <option value="">Cliente</option>
                                {clients?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.business_name || c.name}</option>
                                ))}
                            </select>

                            <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm ml-auto">
                                {pending_exit.total ?? 0} Registros
                            </span>
                        </div>
                    </div>

                    {/* Dynamic Legend for Presentation/Product (Only for Sale) */}
                    {operationType === 'sale' && selectedPresentation && (
                        <div className="flex justify-center animate-fade-in -mt-4">
                            <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <Activity className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-indigo-900 font-bold tracking-tight">
                                    {selectedPresentation}
                                    {selectedProduct && products.find(p => String(p.id) === String(selectedProduct)) && (
                                        <>
                                            <span className="mx-2 text-indigo-300">|</span>
                                            <span className="text-indigo-700">{products.find(p => String(p.id) === String(selectedProduct))?.name}</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gradient-to-r from-indigo-800 to-indigo-900 text-white shadow-lg">
                                    <tr>
                                        {operationType === 'sale' && (
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">OE</th>
                                        )}
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Cliente</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Chofer</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tracto</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">{operationType === 'sale' ? 'Línea Real' : 'Línea de Transporte'}</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Producto</th>
                                        {operationType === 'vessel' && (
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Barco</th>
                                        )}
                                        {operationType === 'sale' && (
                                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Ton. Prog.</th>
                                        )}
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Tiempo en Planta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {pending_exit.data.length > 0 ? (
                                        pending_exit.data.map((order: any) => (
                                            <tr key={order.id} className="hover:bg-indigo-50 transition-all duration-200 group">
                                                {operationType === 'sale' && (
                                                    <td className="px-6 py-4 font-mono font-bold text-indigo-900 border-l border-indigo-100">
                                                        {order.oe_folio || 'N/A'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 text-xs leading-tight uppercase">{order.provider}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800">{order.driver}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xl font-black text-indigo-800 font-mono tracking-wider">{order.vehicle_plate}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-medium text-sm">
                                                    {order.real_transport_line || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-800 font-bold">{order.product}</td>
                                                {operationType === 'vessel' && (
                                                    <td className="px-6 py-4 text-gray-800 font-bold">
                                                        {order.vessel_name}
                                                    </td>
                                                )}
                                                {operationType === 'sale' && (
                                                    <td className="px-6 py-4 font-mono font-bold text-gray-700">
                                                        {order.programmed_weight ? Number(order.programmed_weight).toFixed(2) : '---'} TM
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-center">
                                                    <Timer entryAt={order.entry_at} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={operationType === 'vessel' ? 8 : 9} className="px-6 py-12 text-center text-gray-500">
                                                <Truck className="mx-auto h-12 w-12 text-indigo-200 mb-3" />
                                                <p className="text-lg font-medium text-gray-900">No hay unidades pendientes</p>
                                                <p className="text-sm text-gray-500">En esta categoría.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="lg:hidden p-4 space-y-4">
                            {pending_exit.data.length > 0 ? (
                                pending_exit.data.map((order: any) => (
                                    <div
                                        key={order.id}
                                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col gap-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {operationType === 'sale' && (
                                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black uppercase">
                                                            OE: {order.oe_folio}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-extrabold text-indigo-900 text-xl leading-tight">
                                                    <span className="text-gray-500 font-bold mr-1">Tracto:</span>
                                                    {order.vehicle_plate}
                                                </h3>
                                                <p className="font-bold text-gray-800 text-base">
                                                    {order.driver}
                                                </p>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase mt-1 tracking-widest">
                                                    {order.provider}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Timer entryAt={order.entry_at} />
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Transp.:</span>
                                                <span className="font-medium text-gray-800">{order.real_transport_line || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Producto:</span>
                                                <span className="font-bold text-gray-800">{order.product}</span>
                                            </div>

                                            {operationType === 'vessel' && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Barco:</span>
                                                    <span className="font-bold text-indigo-600">{order.vessel_name}</span>
                                                </div>
                                            )}

                                            {operationType === 'sale' && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Ton. Prog.:</span>
                                                    <span className="font-mono text-gray-800">
                                                        {order.programmed_weight ? Number(order.programmed_weight).toFixed(2) : '---'} TM
                                                    </span>
                                                </div>
                                            )}

                                            {operationType === 'vessel' && (
                                                <div className="flex justify-between text-sm items-center">
                                                    <span className="text-gray-500">Ubicación:</span>
                                                    <span className={order.warehouse === "N/A" ? "text-amber-500 italic text-xs" : "text-blue-600 font-bold text-xs"}>
                                                        {order.warehouse === "N/A" ? "Sin Asignar" : `${order.warehouse} - ${order.cubicle}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No hay unidades en esta lista.
                                </div>
                            )}
                        </div>
                    </div>
                    <Pagination links={pending_exit.links} />
                </div>
            </div>
        </DashboardLayout>
    );
}
