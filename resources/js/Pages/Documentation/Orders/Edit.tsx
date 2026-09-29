import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    Save,
    ArrowLeft,
    Check,
    ChevronsUpDown,
    Ship,
    Calendar,
    Hash,
    FileText,
    User,
    Truck,
    Box,
    ShoppingCart,
    Search,
    AlertTriangle,
} from "lucide-react";
import { FormEventHandler, useState, Fragment, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";
import axios from "axios";
import Swal from "sweetalert2";
import OriginDropdown from "@/Components/OriginDropdown";
import DestinationDropdown from "@/Components/DestinationDropdown";

interface Client {
    id: number;
    business_name: string;
    rfc: string;
    address: string;
}
interface Product {
    id: number;
    name: string;
    code: string;
}

interface Operator {
    id: number;
    operator_name: string;
    transporter_line: string;
    unit_type: string;
    tractor_plate: string;
    trailer_plate: string;
    economic_number: string;
    license: string;
    brand_model: string;
    is_authorized_in_plant?: boolean;
    surveillance_status?: string;
    surveillance_notes?: string;
    access_denied?: boolean;
}

export default function Edit({
    auth,
    order,
    clients,
    products,
    sales_orders,
    origins,
    destinations,
    scale_operators,
    queryParams,
}: {
    auth: any;
    order: any;
    clients: Client[];
    products: Product[];
    sales_orders: any[];
    origins?: { id: number; name: string }[];
    destinations?: { id: number; name: string }[];
    scale_operators?: { id: number; name: string }[];
    queryParams?: any;
}) {
    // Helper to find partial match for product
    const findProduct = () => {
        // Priority: product_text (from column), then product.name (relation), then product (if string)
        let pName = order.product_text || order.product?.name || order.product || "";
        if (!pName) return "";

        // Remove the sack size suffix if present (e.g. "UREA AGRICOLA - 50 KG" -> "UREA AGRICOLA")
        pName = pName.replace(/\s*-\s*\d+\s*KG\s*$/i, "").trim();

        // Try exact match
        if (products.some(p => p.name === pName)) return pName;
        // Try trimmed match
        const found = products.find(p => p.name.trim() === pName.trim());
        if (found) return found.name;
        // Return original
        return pName;
    };

    const { data, setData, put, processing, errors } = useForm({
        folio: order.folio,
        sales_order_id: order.sales_order_id?.toString() || "",
        date: order.date || order.created_at.split("T")[0],

        client_id: order.client_id?.toString() || "",
        client_name: order.client?.business_name || "",
        // Snapshot or fallback to relation
        consigned_to: order.consigned_to || order.client?.business_name || "",

        // Transporter Data
        operator_id: order.operator_id?.toString() || "",
        transport_company: order.transport_company || "",
        operator_name: order.operator_name || "",
        unit_number: order.unit_number || "",
        unit_type: order.unit_type || "",
        tractor_plate: order.tractor_plate || "",
        trailer_plate: order.trailer_plate || "",
        carta_porte: order.carta_porte || "",
        origin_id: (order.origin_id || order.origin || "") as string | number,
        license_number: order.license_number || "",
        economic_number: order.economic_number || "",

        // Product Data
        product: findProduct(),
        presentation: order.presentation || "GRANEL",
        sack_type: (() => {
            const rawSacks = (order.sacks_count_raw || order.sacks_count || "").toString();
            const fromSacks = rawSacks.match(/(\d+)\s*KG/i);
            if (fromSacks) return fromSacks[1];

            const pName = order.product_text || order.product?.name || order.product || "";
            const fromProduct = pName.match(/\s*-\s*(\d+)\s*KG\s*$/i);
            if (fromProduct) return fromProduct[1];

            return "";
        })(),
        sacks_count: (() => {
            const raw = (order.sacks_count_raw || order.sacks_count || "").toString().toUpperCase();
            if (order.presentation === "ENVASADO") {
                // If it's just a size like "50 KG", calculate the default count
                if (raw.includes("KG") && !raw.includes("SACO") && order.programmed_tons) {
                    const size = parseInt(raw.replace(/\D/g, ''));
                    const tons = parseFloat(order.programmed_tons);
                    if (!isNaN(size) && size > 0 && !isNaN(tons)) {
                        return ((tons * 1000) / size).toFixed(0) + " SACOS";
                    }
                }
            }
            return raw;
        })(),
        programmed_tons: order.programmed_tons || "",
        balance: order.shortage_balance || "", // Using shortage_balance as 'snapshot balance' for display? OR fetch current? Review controller logic
        destination_id: order.destination_id || "",
        destination: order.destination || "",
        state: order.state || "",

        observations: order.observations || "",
        documenter_name: order.documenter_name || auth.user.name,
        scale_name: order.scale_name || "",
        scale_operator_id: order.scale_operator_id?.toString() || "",
        qr_fertinal: order.qr_fertinal || "",
        queryParams: queryParams || {},
    });

    const [queryClient, setQueryClient] = useState("");
    const [queryProduct, setQueryProduct] = useState(""); // Not used much if simple select
    const [queryOperator, setQueryOperator] = useState("");
    const [foundOperators, setFoundOperators] = useState<Operator[]>([]);
    const [cartaPorteWarning, setCartaPorteWarning] = useState<string | null>(null);

    // Determine current OV Balance for validation
    // If editing, we need to know the *current* available balance of the OV 
    // PLUS the amount previously allocated to *this* order (to allow keeping it same).
    const currentOV = sales_orders.find(so => so.id.toString() === data.sales_order_id);
    // If switching OV, use that OV's balance. If same OV, add back current order's tons.
    const availableBalance = currentOV
        ? (Number(currentOV.balance) + (order.sales_order_id == data.sales_order_id ? Number(order.programmed_tons || 0) : 0))
        : 0;

    // Initialize balance display
    useEffect(() => {
        if (currentOV && !data.balance) {
            setData('balance', availableBalance.toString());
        }
    }, [currentOV]);


    // Filter Clients
    const filteredClients =
        queryClient === ""
            ? clients
            : clients.filter((client) =>
                client.business_name
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .includes(queryClient.toLowerCase().replace(/\s+/g, "")),
            );

    // Search Operators Effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (queryOperator.length > 1) {
                axios
                    .get(route("documentation.operators.search"), {
                        params: { q: queryOperator },
                    })
                    .then((response) => {
                        setFoundOperators(response.data);
                    })
                    .catch((error) => console.error(error));
            } else {
                setFoundOperators([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [queryOperator]);

    const handleClientSelect = (client: Client | null) => {
        if (!client) return;
        setData((data) => ({
            ...data,
            client_id: client.id.toString(),
            client_name: client.business_name,
        }));
    };

    const handleOperatorSelect = (operator: Operator | null) => {
        if (!operator) return;

        if (operator.access_denied || operator.surveillance_status === 'rejected') {
            const reason = operator.surveillance_notes ? `\n\nMotivo: ${operator.surveillance_notes}` : "";
            Swal.fire({
                icon: "error",
                title: "Acceso Denegado en Vigilancia",
                text: `Este operador fue rechazado por el personal de vigilancia y control de acceso.${reason}`,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#ef4444",
                background: "#ffffff",
                color: "#172554",
                backdrop: "rgba(15, 23, 42, 0.45)",
            });
            return;
        }

        if (!operator.is_authorized_in_plant) {
            const isPending = operator.surveillance_status === 'pending';
            const message = isPending
                ? `El operador está en estado PENDIENTE. Motivo: ${operator.surveillance_notes || 'Sin especificar'}. Por favor verifique con vigilancia antes de continuar.`
                : "El operador debe autorizarse primero en el módulo de Vigilancia y Control de Acceso para permitir escanear el código QR. Por favor pase a escanear a Vigilancia.";

            Swal.fire({
                icon: "warning",
                title: isPending ? "PENDIENTE" : "Pase a escanear a Vigilancia",
                text: message,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#f59e0b",
                background: "#ffffff",
                color: "#172554",
                backdrop: "rgba(15, 23, 42, 0.45)",
            });
            return;
        }

        setData((data) => ({
            ...data,
            operator_id: operator.id.toString(),
            operator_name: operator.operator_name,
            transport_company: operator.transporter_line,
            unit_type: operator.unit_type,
            tractor_plate: operator.tractor_plate,
            trailer_plate: operator.trailer_plate,
            economic_number: operator.economic_number,
            unit_number: operator.brand_model,
            license_number: operator.license,
        }));
        setQueryOperator(""); // Clear search after selection
    };

    const handleSalesOrderSelect = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const soId = e.target.value;
        const so = sales_orders.find((s) => s.id.toString() === soId);

        if (so) {
            setData((data) => ({
                ...data,
                sales_order_id: soId,
                client_id: so.client_id.toString(),
                client_name: so.client?.business_name || "",
                product: so.product?.name || "",
                balance: so.balance ? so.balance.toString() : "0",
                // programmed_tons: "", // Keep existing if editing? No, maybe reset if changing OV
            }));
        }
    };

    // Alerta de Folio Duplicado
    useEffect(() => {
        if (errors.carta_porte) {
            alert(errors.carta_porte);
        }
    }, [errors.carta_porte]);

    // Validate Carta Porte Uniqueness
    useEffect(() => {
        const checkCartaPorte = async () => {
            if (!data.carta_porte || !data.transport_company) {
                setCartaPorteWarning(null);
                return;
            }

            try {
                const response = await axios.get(route('documentation.check-carta-porte'), {
                    params: {
                        carta_porte: data.carta_porte,
                        transport_company: data.transport_company,
                        exclude_id: order.id
                    }
                });

                if (response.data.exists) {
                    setCartaPorteWarning(`⚠️ La Carta Porte "${data.carta_porte}" ya está en uso por ${data.transport_company}.`);
                } else {
                    setCartaPorteWarning(null);
                }
            } catch (error) {
                console.error("Error checking Carta Porte:", error);
            }
        };

        const timeoutId = setTimeout(() => {
            checkCartaPorte();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [data.carta_porte, data.transport_company]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Strict Block: Do not allow submission if there's a duplicate Carta Porte warning
        if (cartaPorteWarning) {
            alert("❌ Error: " + cartaPorteWarning + "\n\nDebe corregir la Carta Porte antes de guardar.");
            return;
        }

        put(route("documentation.update", order.id));
    };

    return (
        <DashboardLayout user={auth.user} header={`Editar Orden: ${order.folio}`}>
            <Head title={`Editar OE - ${order.folio}`} />

            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        href={route("documentation.orders.index", queryParams || {})}
                        className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Volver al historial
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">
                                    Editando Orden de Embarque
                                </h3>
                                <p className="text-indigo-200 text-sm">
                                    Modificando datos de folio: {order.folio}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold uppercase backdrop-blur-sm">
                            Estatus: {order.status}
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* SECTION: Información General */}
                            <div className="md:col-span-2">
                                <h4 className="text-gray-900 font-bold mb-4 flex items-center text-lg border-b pb-2">
                                    <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                    Información General
                                </h4>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Folio O.E.
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.folio}
                                        onChange={(e) => setData("folio", e.target.value)}
                                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 font-bold ${errors.folio ? 'border-red-500 bg-red-50 text-red-900' : 'text-gray-700'}`}
                                    />
                                    <Hash className={`w-5 h-5 absolute left-3 top-2.5 ${errors.folio ? 'text-red-400' : 'text-gray-400'}`} />
                                </div>
                                {errors.folio && <span className="text-xs text-red-500 mt-1 block font-bold">{errors.folio}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Fecha
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData("date", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10"
                                    />
                                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Vincular a Orden de Venta (OV) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        value={data.sales_order_id}
                                        onChange={handleSalesOrderSelect}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-white font-bold"
                                    >
                                        <option value="">-- Seleccionar OV Obligatorio --</option>
                                        {sales_orders.map((so) => (
                                            <option key={so.id} value={so.id}>
                                                {so.folio} {order.sales_order_id === so.id ? '(Actual)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ShoppingCart className="w-5 h-5 text-indigo-400 absolute left-3 top-2.5" />
                                </div>
                                {errors.sales_order_id && <span className="text-xs text-red-500 mt-1 block">{errors.sales_order_id}</span>}
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Cliente
                                </label>
                                {data.sales_order_id ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.client_name}
                                            readOnly
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-gray-100 font-bold text-gray-700 cursor-not-allowed"
                                        />
                                        <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                ) : ( // Fallback Search
                                    <Combobox onChange={handleClientSelect}>
                                        <div className="relative">
                                            <Combobox.Input
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10"
                                                onChange={(event) => setQueryClient(event.target.value)}
                                                displayValue={() => data.client_name}
                                                placeholder="Buscar Cliente..."
                                            />
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <User className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQueryClient("")}>
                                                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {filteredClients.map((client) => (
                                                        <Combobox.Option key={client.id} value={client} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-900"}`}>
                                                            {client.business_name}
                                                        </Combobox.Option>
                                                    ))}
                                                </Combobox.Options>
                                            </Transition>
                                        </div>
                                    </Combobox>
                                )}
                            </div>

                            <div className="md:col-span-1">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Consignar a <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.consigned_to}
                                    onChange={(e) => setData("consigned_to", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase"
                                />
                            </div>

                            {/* SECTION: Datos del Transportista */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4 flex items-center">
                                    <Truck className="w-5 h-5 mr-2 text-indigo-600" />
                                    Datos del Transportista
                                </h4>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Buscar Operador (Nombre o ID)
                                </label>
                                <Combobox onChange={handleOperatorSelect}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={queryOperator || data.operator_name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setQueryOperator(val);
                                                if (!data.operator_id) {
                                                    setData("operator_name", val);
                                                } else {
                                                    if (val === "") {
                                                        setData(d => ({
                                                            ...d,
                                                            operator_id: "",
                                                            operator_name: "",
                                                            transport_company: "",
                                                            unit_type: "",
                                                            tractor_plate: "",
                                                            trailer_plate: "",
                                                            economic_number: "",
                                                            unit_number: "",
                                                            license_number: "",
                                                        }));
                                                    }
                                                }
                                            }}
                                            className={`w-full rounded-lg border-2 shadow-sm py-2.5 pl-10 pr-10 outline-none transition-all ${data.operator_id
                                                ? "border-green-500 bg-green-50 text-green-800 font-bold focus:border-green-500 focus:ring-green-200"
                                                : "border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
                                                }`}
                                            placeholder={data.operator_id ? "Busque nuevo para cambiar..." : "Escriba nombre o seleccione de la lista..."}
                                            autoComplete="off"
                                        />
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <Search className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {foundOperators.map((operator) => (
                                                    <Combobox.Option key={operator.id} value={operator} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-900"}`}>
                                                        {operator.operator_name} - {operator.transporter_line}
                                                    </Combobox.Option>
                                                ))}
                                            </Combobox.Options>
                                        </Transition>
                                    </div>
                                </Combobox>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Nombre del Operador <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={data.operator_name}
                                        placeholder="Nombre completo del chofer"
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-bold transition-all bg-gray-100 cursor-not-allowed text-gray-700"
                                    />
                                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                </div>
                                {errors.operator_name && <span className="text-xs text-red-500 mt-1 block font-bold">{errors.operator_name}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Empresa Transportista
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.transport_company}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Carta Porte <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.carta_porte}
                                    onChange={(e) => setData("carta_porte", e.target.value)}
                                    className={`w-full rounded-lg shadow-sm py-2.5 px-3 uppercase ${cartaPorteWarning
                                        ? 'border-yellow-400 focus:border-yellow-500 bg-yellow-50'
                                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                                        }`}
                                />
                                {cartaPorteWarning && (
                                    <p className="text-yellow-700 text-xs mt-1 font-bold animate-pulse">
                                        {cartaPorteWarning}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Tipo de Unidad
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.unit_type}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Placas Tractor
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.tractor_plate}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Placas Remolque
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.trailer_plate}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Económico
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.economic_number}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Licencia
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={data.license_number}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase bg-gray-100 cursor-not-allowed font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Unidad / Marca
                                </label>
                                <input
                                    type="text"
                                    value={data.unit_number}
                                    readOnly={!!data.operator_id}
                                    onChange={(e) => setData("unit_number", e.target.value.toUpperCase())}
                                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase ${data.operator_id ? 'bg-gray-100 cursor-not-allowed font-medium' : ''}`}
                                />
                            </div>

                            {/* SECTION: Detalle del Embarque */}
                            <div className="md:col-span-2 mt-4">
                                <h4 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4 flex items-center">
                                    <Box className="w-5 h-5 mr-2 text-indigo-600" />
                                    Detalle del Embarque
                                </h4>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Producto
                                </label>
                                {data.sales_order_id ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={data.product}
                                            readOnly
                                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 bg-gray-100 font-bold text-gray-700 cursor-not-allowed"
                                        />
                                        <Box className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                                    </div>
                                ) : (
                                    <select
                                        value={data.product}
                                        onChange={(e) => setData("product", e.target.value)}
                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3"
                                    >
                                        <option value="">Seleccione...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.name}>
                                                {p.code} - {p.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Saldo Disponible OV (TM)
                                </label>
                                <div className="text-xs text-gray-500 mb-1">Incluye tonelaje de esta orden ({order.programmed_tons} TM)</div>
                                <input
                                    type="text"
                                    value={Number(availableBalance).toFixed(3)}
                                    readOnly
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 bg-indigo-50 font-black text-indigo-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Presentación
                                </label>
                                <select
                                    value={data.presentation}
                                    onChange={(e) => setData("presentation", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase"
                                >
                                    <option value="GRANEL">GRANEL</option>
                                    <option value="ENVASADO">ENVASADO</option>
                                </select>
                            </div>

                            {data.presentation === "ENVASADO" && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                                Tamaño de Saco
                                            </label>
                                            <select
                                                value={data.sack_type}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    let suggestion = "";
                                                    if (val && data.programmed_tons) {
                                                        const tons = parseFloat(data.programmed_tons.toString());
                                                        const size = parseInt(val);
                                                        if (!isNaN(tons) && !isNaN(size) && size > 0) {
                                                            suggestion = ((tons * 1000) / size).toFixed(0) + " SACOS";
                                                        }
                                                    }

                                                    setData(prev => ({
                                                        ...prev,
                                                        sack_type: val,
                                                        sacks_count: suggestion
                                                    }));
                                                }}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 font-bold text-blue-800"
                                            >
                                                <option value="">Mantener actual ({data.sacks_count})</option>
                                                <option value="25">25 KG</option>
                                                <option value="50">50 KG</option>
                                                <option value="200">200 KG</option>
                                                <option value="500">500 KG</option>
                                                <option value="1000">1000 KG</option>
                                            </select>
                                        </div>
                                        {data.sack_type && (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                                    Número de Sacos (Manual)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.sacks_count}
                                                    onChange={(e) => setData("sacks_count", e.target.value.toUpperCase())}
                                                    placeholder="Ej: 20 SACOS"
                                                    className="w-full rounded-lg border-2 border-blue-400 shadow-sm focus:border-blue-600 focus:ring-blue-200 py-2.5 px-3 font-black text-blue-900 bg-blue-50"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {data.client_name?.toUpperCase().includes("AGROINDUSTRIAS DEL BALSAS") && (
                                        <div className="md:col-span-2 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                                            <label className="block text-sm font-bold text-green-800 mb-1 flex items-center">
                                                <Search className="w-4 h-4 mr-1" />
                                                QR Fertinal (Opcional)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.qr_fertinal}
                                                onChange={(e) => setData("qr_fertinal", e.target.value)}
                                                placeholder="Ingrese Folio QR Fertinal..."
                                                className="w-full rounded-lg border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 py-2.5 px-3 uppercase font-black text-green-900 bg-white"
                                            />
                                            <p className="text-[10px] text-green-600 mt-1 italic">
                                                * Este campo solo es visible para Fertinal en presentación Envasado.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <OriginDropdown
                                value={data.origin_id}
                                initialOrigins={origins}
                                onChange={(id) => setData("origin_id", id)}
                                error={errors.origin_id}
                            />

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Ton. Programadas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    min="0.01"
                                    value={data.programmed_tons}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    onChange={(e) => setData("programmed_tons", e.target.value)}
                                    className={`w-full rounded-lg shadow-sm focus:ring-indigo-500 py-2.5 px-3 font-bold ${(Number(data.programmed_tons) > Number(availableBalance) || (data.programmed_tons !== "" && Number(data.programmed_tons) <= 0))
                                        ? 'border-red-500 focus:border-red-500 bg-red-50'
                                        : 'border-gray-300 focus:border-indigo-500'
                                        }`}
                                    placeholder="0.00"
                                />
                                {Number(data.programmed_tons) > Number(availableBalance) && (
                                    <p className="text-red-600 text-[10px] mt-1 font-bold animate-pulse">
                                        ❌ Excede el saldo disponible ({availableBalance.toFixed(2)} TM)
                                    </p>
                                )}
                                {data.programmed_tons !== "" && Number(data.programmed_tons) <= 0 && (
                                    <p className="text-red-600 text-[10px] mt-1 font-bold">
                                        ❌ El tonelaje debe ser mayor a 0
                                    </p>
                                )}
                                {errors.programmed_tons && (
                                    <p className="text-red-500 text-xs mt-1">{errors.programmed_tons}</p>
                                )}
                            </div>

                            <DestinationDropdown
                                value={data.destination_id}
                                initialDestinations={destinations}
                                onChange={(id) => setData("destination_id", id)}
                                error={errors.destination_id}
                            />

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={data.state}
                                    onChange={(e) => setData("state", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 uppercase"
                                >
                                    <option value="">Seleccione...</option>
                                    <option value="AGUASCALIENTES">AGUASCALIENTES</option>
                                    <option value="BAJA CALIFORNIA">BAJA CALIFORNIA</option>
                                    <option value="BAJA CALIFORNIA SUR">BAJA CALIFORNIA SUR</option>
                                    <option value="CAMPECHE">CAMPECHE</option>
                                    <option value="CHIAPAS">CHIAPAS</option>
                                    <option value="CHIHUAHUA">CHIHUAHUA</option>
                                    <option value="CIUDAD DE MEXICO">CIUDAD DE MÉXICO</option>
                                    <option value="COAHUILA">COAHUILA</option>
                                    <option value="COLIMA">COLIMA</option>
                                    <option value="DURANGO">DURANGO</option>
                                    <option value="ESTADO DE MEXICO">ESTADO DE MÉXICO</option>
                                    <option value="GUANAJUATO">GUANAJUATO</option>
                                    <option value="GUERRERO">GUERRERO</option>
                                    <option value="HIDALGO">HIDALGO</option>
                                    <option value="JALISCO">JALISCO</option>
                                    <option value="MICHOACAN">MICHOACÁN</option>
                                    <option value="MORELOS">MORELOS</option>
                                    <option value="NAYARIT">NAYARIT</option>
                                    <option value="NUEVO LEON">NUEVO LEÓN</option>
                                    <option value="OAXACA">OAXACA</option>
                                    <option value="PUEBLA">PUEBLA</option>
                                    <option value="QUERETARO">QUERÉTARO</option>
                                    <option value="QUINTANA ROO">QUINTANA ROO</option>
                                    <option value="SAN LUIS POTOSI">SAN LUIS POTOSÍ</option>
                                    <option value="SINALOA">SINALOA</option>
                                    <option value="SONORA">SONORA</option>
                                    <option value="TABASCO">TABASCO</option>
                                    <option value="TAMAULIPAS">TAMAULIPAS</option>
                                    <option value="TLAXCALA">TLAXCALA</option>
                                    <option value="VERACRUZ">VERACRUZ</option>
                                    <option value="YUCATAN">YUCATÁN</option>
                                    <option value="ZACATECAS">ZACATECAS</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Observaciones
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.observations}
                                    onChange={(e) => setData("observations", e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3"
                                    placeholder="Comentarios adicionales..."
                                ></textarea>
                            </div>

                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="text-gray-500 text-sm italic whitespace-nowrap">
                                    Documentador Original: <span className="font-bold text-indigo-600">{data.documenter_name}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 w-full sm:w-auto">
                                    <label className="text-gray-600 text-xs font-bold uppercase tracking-wider whitespace-nowrap">BÁSCULA:</label>
                                    <select
                                        value={data.scale_operator_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const selectedOp = scale_operators?.find((op: { id: number; name: string }) => op.id.toString() === val);
                                            setData((prev) => ({
                                                ...prev,
                                                scale_operator_id: val,
                                                scale_name: selectedOp ? selectedOp.name : "",
                                            }));
                                        }}
                                        className="text-xs p-1.5 border-none bg-transparent focus:ring-0 font-bold text-indigo-700 cursor-pointer min-w-[150px] flex-1"
                                    >
                                        <option value="">-- SELECCIONAR --</option>
                                        {scale_operators?.map((op: { id: number; name: string }) => (
                                            <option key={op.id} value={op.id}>{op.name.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="w-full md:w-auto flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full md:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-md shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {processing ? "Guardando..." : "GUARDAR CAMBIOS"}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
