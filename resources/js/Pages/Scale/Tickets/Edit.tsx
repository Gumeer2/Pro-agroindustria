import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Edit({
    auth,
    ticket,
    order,
    active_lots = [],
    documenters = [],
}: {
    auth: any;
    ticket: any;
    order: any;
    active_lots: any[];
    documenters: any[];
}) {
    const isSale = !!order.shipment_order_id || !order.vessel_id;

    const { data, setData, put, processing, errors, reset } = useForm({
        tare_weight: ticket.tare_weight || 0,
        gross_weight: ticket.gross_weight || 0,
        net_weight: ticket.net_weight || 0,
        lot_id: ticket.lot_id || "",
        packaging_type: ticket.packaging_type || "N/A",
        warehouse: order.warehouse || "",
        observations: order.observation || "",
        documenter_id: ticket.documenter_id || "",
    });

    // Auto-calculate Net Weight when Tare or Gross changes
    useEffect(() => {
        const net = Math.abs(
            (parseFloat(data.gross_weight) || 0) -
            (parseFloat(data.tare_weight) || 0),
        );
        setData("net_weight", net);
    }, [data.gross_weight, data.tare_weight]);

    // --- Dynamic Envase Logic ---
    useEffect(() => {
        const presentation = ticket.presentation || order.presentation;
        if (presentation === 'GRANEL') {
            setData("packaging_type", "N/A");
        }
    }, [ticket.presentation, order.presentation]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const presentation = ticket.presentation || order.presentation;

        // --- VALIDATION: Packaging Type for Envasado ---
        if (presentation === 'ENVASADO' && data.packaging_type === 'N/A') {
            import("sweetalert2").then((Swal) => {
                Swal.default.fire({
                    icon: 'error',
                    title: 'Envase Obligatorio',
                    text: 'Para productos ENVASADOS, debe seleccionar un tipo de envase diferente a N/A.',
                    confirmButtonColor: '#3085d6',
                });
            });
            return;
        }

        // Use order.id because the route expects the "id" which I mapped to Order ID in controller logic (or ticket ID? Wait.)
        // In controller: destroyTicket($id) -> find Order($id).
        // updateTicket($id) -> find Order($id).
        // So I must pass Order ID.
        put(route("scale.tickets.update", order.id));
    };

    return (
        <DashboardLayout
            user={auth.user}
            header={`Editar Ticket #${ticket.ticket_number}`}
        >
            <Head title={`Editar Ticket ${ticket.ticket_number}`} />

            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-6">
                    <Link
                        href={route("scale.tickets.index")}
                        className="inline-flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5 mr-1" />
                        Volver al Historial
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header Info */}
                    <div className="bg-gray-50 p-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                                Folio Orden
                            </span>
                            <div className="text-2xl font-black text-gray-900">
                                {order.folio}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                <span className="font-bold">Cliente:</span>{" "}
                                {order.client_name ||
                                    order.client?.name ||
                                    order.vessel?.client?.name ||
                                    "N/A"}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
                                Estatus
                            </span>
                            <div className="text-lg font-bold text-gray-800 uppercase">
                                {ticket.weighing_status === "completed"
                                    ? "Completado"
                                    : "En Progreso"}
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                <span className="font-bold">Chofer:</span>{" "}
                                {order.operator_name || "N/A"}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8 space-y-6">
                        {/* Weights Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                                Ajuste de Pesos (kg)
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                                {/* Tare */}
                                <div>
                                    <InputLabel
                                        htmlFor="tare_weight"
                                        value="Peso Tara (Entrada)"
                                        className="text-indigo-900"
                                    />
                                    <TextInput
                                        id="tare_weight"
                                        type="number"
                                        className="mt-1 block w-full font-mono text-lg font-bold text-center border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.tare_weight}
                                        onChange={(e) =>
                                            setData(
                                                "tare_weight",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.tare_weight}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Gross */}
                                <div>
                                    <InputLabel
                                        htmlFor="gross_weight"
                                        value="Peso Bruto (Salida)"
                                        className="text-indigo-900"
                                    />
                                    <TextInput
                                        id="gross_weight"
                                        type="number"
                                        className="mt-1 block w-full font-mono text-lg font-bold text-center border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.gross_weight}
                                        onChange={(e) =>
                                            setData(
                                                "gross_weight",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.gross_weight}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Net (Read Only usually, but editable if needed? logic says auto-calc) */}
                                <div>
                                    <InputLabel
                                        htmlFor="net_weight"
                                        value="Peso Neto (Calculado)"
                                        className="text-green-700"
                                    />
                                    <TextInput
                                        id="net_weight"
                                        type="number"
                                        className="mt-1 block w-full font-mono text-xl font-black text-center border-green-200 bg-green-50 text-green-800 pointer-events-none"
                                        value={data.net_weight}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>
                                    Advertencia: Modificar los pesos manualmente
                                    afectará los reportes y el inventario.
                                    Asegúrese de tener autorización.
                                </p>
                            </div>
                        </div>

                        {/* Manual Fields Section */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                                Campos Manuales de Destare
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                                {/* Lot */}
                                <div>
                                    <InputLabel
                                        htmlFor="lot_id"
                                        value="LOTE"
                                        className="text-indigo-900 font-bold"
                                    />
                                    <select
                                        id="lot_id"
                                        value={data.lot_id}
                                        onChange={(e) => setData("lot_id", e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm font-bold"
                                    >
                                        <option value="">N/A</option>
                                        {active_lots.map((lot: any) => (
                                            <option key={lot.id} value={lot.id}>
                                                {lot.folio}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.lot_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Warehouse */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <InputLabel value="ALMACÉN" className="text-indigo-900 font-bold" />
                                        {data.lot_id && (
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Auto por Lote</span>
                                        )}
                                    </div>
                                    <select
                                        value={data.lot_id ? (active_lots.find((l: any) => l.id === data.lot_id)?.warehouse || "") : data.warehouse}
                                        onChange={e => setData("warehouse", e.target.value)}
                                        disabled={!!data.lot_id}
                                        className={`mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm font-bold ${!!data.lot_id ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700'}`}
                                    >
                                        <option value="">N/A</option>
                                        <option value="Almacen 1">Almacen 1</option>
                                        <option value="Almacen 2">Almacen 2</option>
                                        <option value="Almacen 3">Almacen 3</option>
                                        <option value="Almacen 4">Almacen 4</option>
                                        <option value="Almacen 5">Almacen 5</option>
                                    </select>
                                    <InputError
                                        message={errors.warehouse}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Packaging Type (Only for Sales) */}
                                {isSale && (
                                    <div>
                                        <InputLabel
                                            htmlFor="packaging_type"
                                            value="ENVASE"
                                            className="text-indigo-900 font-bold"
                                        />
                                        <select
                                            id="packaging_type"
                                            value={data.packaging_type}
                                            onChange={(e) => setData("packaging_type", e.target.value)}
                                            disabled={(ticket.presentation || order.presentation) === 'GRANEL'}
                                            className={`mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm font-bold ${(ticket.presentation || order.presentation) === 'GRANEL' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white'}`}
                                        >
                                            <option value="N/A">N/A</option>
                                            <option value="PRO-AGRO">PRO-AGRO</option>
                                            <option value="FERTINAL">FERTINAL</option>
                                        </select>
                                        <InputError
                                            message={errors.packaging_type}
                                            className="mt-2"
                                        />
                                    </div>
                                )}

                                {/* Documentador Section */}
                                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                                    <InputLabel
                                        htmlFor="documenter_id"
                                        value="DOCUMENTADOR (FIRMA)"
                                        className="text-indigo-900 font-bold"
                                    />
                                    <select
                                        id="documenter_id"
                                        value={data.documenter_id}
                                        onChange={(e) => setData("documenter_id", e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm font-bold"
                                        required
                                    >
                                        <option value="">Seleccione Documentador...</option>
                                        {documenters.map((doc: any) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={errors.documenter_id}
                                        className="mt-2"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-500 italic">
                                        Personal que firmará el remanente/ticket en sitio.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Observations */}
                        <div>
                            <InputLabel
                                htmlFor="observations"
                                value="Observaciones / Motivo de Edición"
                            />
                            <textarea
                                id="observations"
                                value={data.observations}
                                onChange={(e) =>
                                    setData("observations", e.target.value)
                                }
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm h-24"
                                placeholder="Especifique por qué se está modificando el ticket..."
                            ></textarea>
                            <InputError
                                message={errors.observations}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-end pt-6 border-t border-gray-100">
                            <Link
                                href={route("scale.tickets.index")}
                                className="mr-4 text-gray-500 hover:text-gray-700 font-medium text-sm underline"
                            >
                                Cancelar
                            </Link>

                            <PrimaryButton
                                disabled={processing}
                                className="px-6 py-3 text-base"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Guardar Cambios
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
