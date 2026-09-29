import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Save,
    ArrowLeft,
    Check,
    ChevronsUpDown,
    FileText,
    User,
    Box,
    Hash,
    Truck,
    ShoppingCart,
    AlertCircle,
    Ship,
} from "lucide-react";
import { FormEventHandler, useState, Fragment } from "react";
import { Combobox, Transition } from "@headlessui/react";
import Swal from "sweetalert2";

interface Client {
    id: number;
    business_name: string;
    rfc?: string;
    address?: string;
    contact_info?: string;
}
interface Product {
    id: number;
    name: string;
    code: string;
}
interface Vessel {
    id: string;
    name: string;
}

export default function Edit({
    auth,
    order,
    clients,
    products,
    vessels,
    context_module,
}: {
    auth: any;
    order: any;
    clients: Client[];
    products: Product[];
    vessels: Vessel[];
    context_module?: string;
}) {
    const isSalesReport = context_module === "sales_report";
    const backLink = isSalesReport
        ? route("sales.index", { view: "report" })
        : route("sales.orders.index");

    const { data, setData, put, processing, errors } = useForm({
        folio: order.folio || "",
        sale_order: order.sale_order || "",
        sale_conditions: order.sale_conditions || "",
        delivery_conditions: order.delivery_conditions || "",
        client_id: order.client_id?.toString() || "",
        product_id: order.product_id?.toString() || "",
        quantity: order.total_quantity || "",
        vessel_id: order.vessel_id || "",
        destination: order.destination || "",
    });

    const [query, setQuery] = useState("");

    const filteredClients =
        query === ""
            ? clients
            : clients.filter(
                (client) =>
                    client.business_name
                        .toLowerCase()
                        .replace(/\s+/g, "")
                        .includes(query.toLowerCase().replace(/\s+/g, "")) ||
                    client.id.toString().includes(query),
            );

    const selectedClient =
        clients.find((c) => c.id.toString() === data.client_id) || null;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route("sales.update", order.id), {
            onSuccess: () => {
                Swal.fire({
                    title: '<span style="color: #4f46e5; font-weight: 500;">¡Cambios Guardados!</span>',
                    html: `<p style="color: #6b7280;">La Orden de Venta <b>${data.folio}</b> ha sido actualizada exitosamente.</p>`,
                    icon: "success",
                    iconColor: "#10b981",
                    background: "#ffffff",
                    showConfirmButton: true,
                    confirmButtonText: "Continuar",
                    confirmButtonColor: "#4f46e5",
                    timer: 5000,
                    timerProgressBar: true,
                    showClass: {
                        popup: "animate__animated animate__fadeInUp animate__faster",
                    },
                    hideClass: {
                        popup: "animate__animated animate__fadeOutDown animate__faster",
                    },
                    customClass: {
                        popup: "rounded-2xl shadow-2xl border border-gray-100",
                        confirmButton:
                            "rounded-xl px-8 py-3 font-medium transition-all hover:scale-105 active:scale-95",
                    },
                });
            },
        });
    };

    return (
        <DashboardLayout
            user={auth.user}
            header={`Editar Orden: ${order.folio}`}
        >
            <Head title="Editar Orden" />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={backLink}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al listado
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-normal text-xl">
                                    Editar Orden de Venta
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Modifique los detalles de la venta y cliente
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Restricted Status Warning */}
                    <div className="mx-8 mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-normal text-amber-800 uppercase tracking-tight">
                                Aviso de Edición
                            </h4>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                Solo puede editar campos si la orden está{" "}
                                <span className="font-bold">ABIERTA</span>. Al
                                guardar, se mantendrá la trazabilidad del folio
                                actual.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        {/* Section: Orden de Venta */}
                        <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                            <h4 className="text-indigo-800 font-normal mb-4 flex items-center text-lg">
                                <FileText className="w-5 h-5 mr-2" />
                                Datos Generales
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Folio{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.folio}
                                            onChange={(e) =>
                                                setData("folio", e.target.value)
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-gray-50"
                                            placeholder="Ej. OV-2025-01"
                                            required
                                            readOnly // Folio is usually not editable if it's already set, but user original had it as input. Keeping readOnly or not?
                                        // User original code for Edit had it as input. I'll make it normal input but with normal font.
                                        />
                                        <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.folio && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.folio}
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Orden de Compra / Referencia
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.sale_order}
                                            onChange={(e) =>
                                                setData(
                                                    "sale_order",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10"
                                            placeholder="Referencia del cliente"
                                            required
                                        />
                                        <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.sale_order && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.sale_order}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Datos del Cliente */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <h4 className="text-gray-800 font-normal text-lg border-b pb-2 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                                    Información del Cliente
                                </h4>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Cliente{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Combobox
                                        value={selectedClient}
                                        onChange={(client: Client | null) =>
                                            setData(
                                                "client_id",
                                                client?.id.toString() || "",
                                            )
                                        }
                                    >
                                        <div className="relative mt-1">
                                            <div className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                                                <Combobox.Input
                                                    className="w-full border-none py-2.5 pl-10 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                                                    displayValue={(
                                                        client: Client | null,
                                                    ) =>
                                                        client
                                                            ? `${client.id} - ${client.business_name}`
                                                            : ""
                                                    }
                                                    onChange={(event) =>
                                                        setQuery(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Buscar por ID o Nombre..."
                                                    autoComplete="off"
                                                />
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <User className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronsUpDown
                                                        className="h-5 w-5 text-gray-400"
                                                        aria-hidden="true"
                                                    />
                                                </Combobox.Button>
                                            </div>
                                            <Transition
                                                as={Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                                afterLeave={() => setQuery("")}
                                            >
                                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {filteredClients.length ===
                                                        0 && query !== "" ? (
                                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                            No se encontraron
                                                            resultados.
                                                        </div>
                                                    ) : (
                                                        filteredClients.map(
                                                            (client) => (
                                                                <Combobox.Option
                                                                    key={
                                                                        client.id
                                                                    }
                                                                    className={({
                                                                        active,
                                                                    }) =>
                                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active
                                                                            ? "bg-indigo-600 text-white"
                                                                            : "text-gray-900"
                                                                        }`
                                                                    }
                                                                    value={
                                                                        client
                                                                    }
                                                                >
                                                                    {({
                                                                        selected,
                                                                        active,
                                                                    }) => (
                                                                        <>
                                                                            <span
                                                                                className={`block truncate ${selected
                                                                                    ? "font-normal"
                                                                                    : "font-normal"
                                                                                    }`}
                                                                            >
                                                                                <span className="font-normal mr-2">
                                                                                    {
                                                                                        client.id
                                                                                    }
                                                                                </span>

                                                                                -{" "}
                                                                                {
                                                                                    client.business_name
                                                                                }
                                                                            </span>
                                                                            {selected ? (
                                                                                <span
                                                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active
                                                                                        ? "text-white"
                                                                                        : "text-indigo-600"
                                                                                        }`}
                                                                                >
                                                                                    <Check
                                                                                        className="h-5 w-5"
                                                                                        aria-hidden="true"
                                                                                    />
                                                                                </span>
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Combobox.Option>
                                                            ),
                                                        )
                                                    )}
                                                </Combobox.Options>
                                            </Transition>
                                        </div>
                                    </Combobox>
                                    {errors.client_id && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.client_id}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Condiciones de Venta
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.sale_conditions}
                                            onChange={(e) =>
                                                setData(
                                                    "sale_conditions",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 appearance-none bg-white text-sm"
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="CONTADO">CONTADO</option>
                                            <option value="CREDITO">CREDITO</option>
                                        </select>
                                        <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Condiciones de Entrega
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.delivery_conditions}
                                            onChange={(e) =>
                                                setData(
                                                    "delivery_conditions",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 appearance-none bg-white text-sm"
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="GRANEL">GRANEL</option>
                                            <option value="ENVASADO">ENVASADO</option>
                                            <option value="GRANEL/ENVASADO">GRANEL/ENVASADO</option>
                                        </select>
                                        <Truck className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Detalle */}
                            <div className="space-y-6">
                                <h4 className="text-gray-800 font-normal text-lg border-b pb-2 mb-4 flex items-center">
                                    <Box className="w-5 h-5 mr-2 text-indigo-600" />
                                    Detalle del Producto
                                </h4>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Producto{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.product_id}
                                            onChange={(e) =>
                                                setData(
                                                    "product_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 appearance-none bg-white font-normal"
                                            required
                                        >
                                            <option value="">
                                                Seleccione producto...
                                            </option>
                                            {products.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    <Box className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.product_id && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.product_id}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Barco (Opcional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={data.vessel_id}
                                            onChange={(e) =>
                                                setData(
                                                    "vessel_id",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 appearance-none bg-white font-normal"
                                        >
                                            <option value="">
                                                Seleccione barco...
                                            </option>
                                            {vessels.map((vessel) => (
                                                <option
                                                    key={vessel.id}
                                                    value={vessel.id}
                                                >
                                                    {vessel.name}
                                                </option>
                                            ))}
                                        </select>
                                        <Ship className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                    {errors.vessel_id && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.vessel_id}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Cantidad (Toneladas){" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={data.quantity}
                                            onChange={(e) =>
                                                setData(
                                                    "quantity",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-14 font-normal"
                                            placeholder="0.00"
                                            required
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                TON
                                            </span>
                                        </div>
                                    </div>
                                    {errors.quantity && (
                                        <div className="text-red-500 text-xs mt-1">
                                            {errors.quantity}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={data.destination}
                                        onChange={(e) =>
                                            setData(
                                                "destination",
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                                        placeholder="Destino, instrucciones especiales, etc."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
                            <Link
                                href={backLink}
                                className="inline-flex items-center px-8 py-3.5 border border-gray-300 text-lg font-normal rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all transform hover:-translate-y-0.5"
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-normal rounded-xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all transform hover:-translate-y-0.5"
                            >
                                <Save className="w-6 h-6 mr-2" />
                                {processing
                                    ? "Guardando..."
                                    : "GUARDAR CAMBIOS"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
