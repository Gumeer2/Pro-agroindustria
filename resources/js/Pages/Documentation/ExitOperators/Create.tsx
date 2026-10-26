import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link, usePage, router } from "@inertiajs/react";
import {
    UserPlus,
    ArrowLeft,
    Save,
    Truck,
    FileText,
    Calendar,
    User,
    Hash,
    CreditCard,
    Box,
    CheckCircle,
    CheckCircle2,
    Shield,
    Scale,
    Package,
    Building2,
    ShoppingCart,
    AlertTriangle,
    Scan,
    Camera,
    RefreshCw,
    QrCode,
    Plus,
    Search,
    X,
    Edit3,
    Trash2,
    Clock,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import QrScannerModal from "@/Components/QrScannerModal";
import TransportLineDropdown from "@/Components/TransportLineDropdown";
import ClientMultiSelect, { ClientItem } from "@/Components/ClientMultiSelect";

export interface OperatorItem {
    id: number;
    name: string;
    transport_line: string;
    real_transport_line?: string;
    tractor_plate: string;
    trailer_plate?: string;
    economic_number?: string;
    license?: string;
    unit_type?: string;
    presentation?: string;
    tm?: number | string;
    sack?: string;
    status?: string;
    clients?: Array<{ id: number; business_name: string }>;
    client_ids?: number[];
}

export interface SalesOrderItem {
    id: string;
    folio: string;
    client_id: number;
    total_quantity: number | string;
    loaded_quantity: number | string;
    programmed_quantity?: number | string;
    available_balance?: number | string;
    balance: number | string;
    status: string;
    client?: {
        id: number;
        business_name: string;
    };
    product?: {
        id: number;
        name: string;
    };
}

export interface ClientOperatorRecord {
    id: number;
    assignment_id?: number;
    operator_id?: number;
    name: string;
    transport_line: string;
    real_transport_line?: string;
    tractor_plate: string;
    trailer_plate?: string;
    economic_number?: string;
    unit_type?: string;
    presentation?: string;
    tm?: number | string;
    sack?: string;
    sales_order_id?: string;
    sales_order?: {
        id: string;
        folio: string;
        total_quantity: number | string;
        balance: number | string;
        product?: {
            id: number;
            name: string;
        };
        client?: {
            id: number;
            business_name: string;
        };
    };
    clients?: Array<{ id: number; business_name: string }>;
    programmed_quantity?: number | string;
    available_balance?: number | string;
    updated_balance?: number | string;
    updated_at?: string;
    operational_date?: string;
    formatted_updated_at?: string;
}

export default function Create({
    auth,
    clients = [],
    operators = [],
    sales_orders = [],
    client_operators = [],
    current_operational_date = "",
    from,
}: {
    auth: any;
    clients?: ClientItem[];
    operators?: OperatorItem[];
    sales_orders?: SalesOrderItem[];
    client_operators?: ClientOperatorRecord[];
    current_operational_date?: string;
    from?: string;
}) {
    const { flash } = usePage<any>().props;
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const userRoles: any[] = auth?.user?.roles || [];
    const isClientOnlyUser = userRoles.some((r: any) => (typeof r === 'string' ? r : r.name || '').toLowerCase() === 'clientes') && !userRoles.some((r: any) => (typeof r === 'string' ? r : r.name || '').toLowerCase() === 'admin');
    const isFromClients = isClientOnlyUser || from === "clients" || urlParams?.get("from") === "clients";

    // Helper para determinar la fecha operativa con corte a las 5:00 AM (05:00 a 04:59 del día siguiente)
    const getClientOperationalDate = (dateString?: string) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return "";
        if (d.getHours() < 5) {
            d.setDate(d.getDate() - 1);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const todayOpDate = current_operational_date || getClientOperationalDate(new Date().toISOString());
    const [selectedDate, setSelectedDate] = useState<string>(urlParams?.get("date") || "");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tableSearch, setTableSearch] = useState("");
    const [qrInput, setQrInput] = useState("");
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    // Form for Clientes module (Operador vía QR, OV, Presentación, TM, Saco)
    const clientForm = useForm({
        assignment_id: "" as number | string,
        operator_id: "" as number | string,
        sales_order_id: "",
        presentation: "GRANEL",
        tm: "",
        sack: "",
        from: "clients",
    });

    const selectedOp = operators.find((op) => op.id === Number(clientForm.data.operator_id));

    // Para el rol Clientes se muestran únicamente las OVs de su cliente; para otros roles (Admin, etc.) se permite asignar cualquier OV
    const operatorOVs = isClientOnlyUser
        ? (selectedOp?.clients && selectedOp.clients.length > 0
            ? sales_orders.filter((so) => selectedOp.clients!.some((c) => c.id === so.client_id))
            : [])
        : (selectedOp?.clients && selectedOp.clients.length > 0
            ? sales_orders.filter((so) => selectedOp.clients!.some((c) => c.id === so.client_id))
            : sales_orders);

    // Mapa con la suma total de TM programados para cada Orden de Venta en este módulo
    const totalProgrammedByOv = useMemo(() => {
        const map: Record<string, number> = {};
        (client_operators || []).forEach((item) => {
            const soId = String(item.sales_order_id || item.sales_order?.id || "");
            if (soId) {
                map[soId] = (map[soId] || 0) + Number(item.tm || 0);
            }
        });
        return map;
    }, [client_operators]);

    const currentEditingAssignment = clientForm.data.assignment_id
        ? client_operators?.find((co) => String(co.id) === String(clientForm.data.assignment_id))
        : null;
    const existingTm = currentEditingAssignment && String(currentEditingAssignment.sales_order_id) === String(clientForm.data.sales_order_id)
        ? Number(currentEditingAssignment.tm || 0)
        : 0;

    const selectedOv = operatorOVs.find((so) => so.id === clientForm.data.sales_order_id);
    const currentOvId = String(clientForm.data.sales_order_id || "");
    const alreadyProgForSelectedOv = totalProgrammedByOv[currentOvId] !== undefined
        ? totalProgrammedByOv[currentOvId]
        : Number(selectedOv?.programmed_quantity || 0);
    const otherOperatorsProgrammed = Math.max(0, alreadyProgForSelectedOv - existingTm);
    // Saldo disponible en este módulo: saldo de la OV menos lo ya programado por otros operadores
    const ovBalance = selectedOv
        ? Math.max(0, Number(selectedOv.balance || 0) - otherOperatorsProgrammed)
        : null;
    const isTmExceeded = ovBalance !== null && Boolean(clientForm.data.tm) && parseFloat(clientForm.data.tm) > ovBalance;

    // Foco automático en el lector al abrir el modal si no hay operador
    useEffect(() => {
        if (isFromClients && isModalOpen && !clientForm.data.operator_id) {
            setTimeout(() => {
                qrInputRef.current?.focus();
            }, 100);
        }
    }, [isFromClients, isModalOpen, clientForm.data.operator_id]);

    // Procesar lectura de QR (pistola o cámara)
    const handleQrScan = (text: string | null) => {
        if (!text) return;
        setScanError(null);
        let raw = text.trim();

        // 1. Limpieza de prefijos comunes de pistola lectora o formato QR
        let clean = raw.replace(/^OP[_\?'\-\s]*EXIT\s*/i, "").replace(/^OP\s*/i, "").trim();

        // 2. Si contiene pipes (ej. ID|NOMBRE|PLACA), tomar el primer token
        if (clean.includes("|")) {
            clean = clean.split("|")[0].trim();
        }

        // 3. Buscar en la lista de operadores cargados
        let found = operators.find((op) => String(op.id) === clean);

        if (!found && /^\d+$/.test(clean)) {
            const numId = parseInt(clean, 10);
            found = operators.find((op) => op.id === numId);
        }

        if (!found) {
            found = operators.find((op) => op.name.trim().toLowerCase() === raw.toLowerCase());
        }

        if (!found) {
            found = operators.find((op) => op.tractor_plate?.trim().toLowerCase() === clean.toLowerCase());
        }

        if (!found) {
            const errorMsg = `No se encontró ningún operador con el código escaneado: "${raw}". Verifique el código QR.`;
            setScanError(errorMsg);
            setShowCameraModal(false);
            Swal.fire({
                icon: "error",
                title: "Operador no encontrado",
                text: errorMsg,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#4f46e5",
                background: "#ffffff",
                color: "#1e1b4b",
                backdrop: "rgba(15, 23, 42, 0.45)",
            }).then(() => {
                setQrInput("");
                setTimeout(() => {
                    qrInputRef.current?.focus();
                }, 100);
            });
            return;
        }

        if (found.status === "vetoed") {
            const errorMsg = `El operador "${found.name}" se encuentra VETADO y no puede ser seleccionado.`;
            setScanError(`⛔ ${errorMsg}`);
            setShowCameraModal(false);
            Swal.fire({
                icon: "error",
                title: "Operador Vetado",
                text: errorMsg,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#ef4444",
                background: "#ffffff",
                color: "#1e1b4b",
                backdrop: "rgba(15, 23, 42, 0.45)",
            }).then(() => {
                setQrInput("");
                setTimeout(() => {
                    qrInputRef.current?.focus();
                }, 100);
            });
            return;
        }

        // Validar que el operador tenga algún cliente asignado para permitir su escaneo
        const hasAnyClient =
            (found.clients && found.clients.length > 0) ||
            (Array.isArray(found.client_ids) && found.client_ids.length > 0);

        if (!hasAnyClient) {
            const errorMsg = `El operador "${found.name}" no tiene ningún cliente asignado y no puede ser escaneado. Debe tener al menos un cliente asignado.`;
            setScanError(`⛔ ${errorMsg}`);
            setShowCameraModal(false);
            Swal.fire({
                icon: "warning",
                title: "Sin Cliente Asignado",
                text: errorMsg,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#4f46e5",
                background: "#ffffff",
                color: "#1e1b4b",
                backdrop: "rgba(15, 23, 42, 0.45)",
            }).then(() => {
                setQrInput("");
                setTimeout(() => {
                    qrInputRef.current?.focus();
                }, 100);
            });
            return;
        }

        // Validar que el operador esté asignado al cliente únicamente para usuarios del rol Clientes
        if (isFromClients && isClientOnlyUser) {
            if (clients && clients.length === 1) {
                const currentClient = clients[0];
                const isAssigned =
                    found.clients?.some((c) => c.id === currentClient.id) ||
                    (Array.isArray(found.client_ids) && found.client_ids.includes(currentClient.id));
                if (!isAssigned) {
                    const errorMsg = `El operador "${found.name}" no está asignado a su empresa (${currentClient.business_name}). Solo se pueden validar operadores asignados a su cliente.`;
                    setScanError(`⛔ ${errorMsg}`);
                    setShowCameraModal(false);
                    Swal.fire({
                        icon: "warning",
                        title: "Operador no Asignado",
                        text: errorMsg,
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#4f46e5",
                        background: "#ffffff",
                        color: "#1e1b4b",
                        backdrop: "rgba(15, 23, 42, 0.45)",
                    }).then(() => {
                        setQrInput("");
                        setTimeout(() => {
                            qrInputRef.current?.focus();
                        }, 100);
                    });
                    return;
                }
            }
        }

        // Operador válido: seleccionar y reiniciar campos dependientes
        clientForm.clearErrors();
        clientForm.setData({
            assignment_id: "",
            operator_id: found.id,
            sales_order_id: "",
            presentation: "GRANEL",
            tm: "",
            sack: "",
            from: "clients",
        });
        setQrInput("");
        setShowCameraModal(false);
    };

    const handleClearOperator = () => {
        clientForm.clearErrors();
        clientForm.setData({
            assignment_id: "",
            operator_id: "",
            sales_order_id: "",
            presentation: "GRANEL",
            tm: "",
            sack: "",
            from: "clients",
        });
        setQrInput("");
        setScanError(null);
        setTimeout(() => {
            qrInputRef.current?.focus();
        }, 50);
    };

    const handleSalesOrderChange = (soId: string) => {
        clientForm.clearErrors("sales_order_id");
        clientForm.clearErrors("tm");
        clientForm.setData((prev) => ({
            ...prev,
            sales_order_id: soId,
            tm: "",
        }));
    };

    const handlePresentationChange = (newPres: string) => {
        clientForm.clearErrors("presentation");
        clientForm.clearErrors("sack");
        clientForm.setData((prev) => ({
            ...prev,
            presentation: newPres,
            // Si es GRANEL no lleva saco; si es ENVASADO se inicializa en 25 KG
            sack: newPres === "GRANEL" ? "" : (prev.sack || "25 KG"),
        }));
    };

    const handleTmChange = (value: string) => {
        clientForm.setData("tm", value);
        if (!value) {
            clientForm.clearErrors("tm");
            return;
        }

        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal <= 0) {
            clientForm.setError("tm", "El tonelaje debe ser mayor a 0.");
            return;
        }

        if (ovBalance !== null && numVal > ovBalance) {
            clientForm.setError(
                "tm",
                `El tonelaje ingresado (${numVal.toFixed(2)} TM) supera el saldo disponible (${ovBalance.toFixed(2)} TM). Solo puede programar lo que queda.`
            );
        } else {
            clientForm.clearErrors("tm");
        }
    };

    const submitClientForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientForm.data.operator_id) {
            clientForm.setError("operator_id", "Debe escanear el código QR del operador.");
            return;
        }
        const op = operators.find((o) => o.id === Number(clientForm.data.operator_id));
        if (op?.status === "vetoed") {
            clientForm.setError("operator_id", "Este operador se encuentra vetado y no puede ser seleccionado.");
            return;
        }
        const hasAnyClient =
            (op?.clients && op.clients.length > 0) ||
            (Array.isArray(op?.client_ids) && op.client_ids.length > 0);
        if (!hasAnyClient) {
            clientForm.setError("operator_id", "El operador no tiene ningún cliente asignado y no puede ser asignado.");
            return;
        }
        if (!clientForm.data.sales_order_id) {
            clientForm.setError("sales_order_id", "Debe seleccionar una Orden de Venta (OV).");
            return;
        }

        const numVal = parseFloat(clientForm.data.tm);
        if (isNaN(numVal) || numVal <= 0) {
            clientForm.setError("tm", "Debe ingresar un tonelaje válido mayor a 0.");
            return;
        }

        if (ovBalance !== null && numVal > ovBalance) {
            clientForm.setError(
                "tm",
                `El tonelaje ingresado (${numVal.toFixed(2)} TM) excede el saldo restante de la OV (${ovBalance.toFixed(2)} TM). Solo puede programar lo que queda.`
            );
            return;
        }

        if (clientForm.data.presentation === "ENVASADO" && !clientForm.data.sack) {
            clientForm.setError("sack", "Debe seleccionar el tipo de saco para presentación envasado.");
            return;
        }

        clientForm.post(route("documentation.exit-operators.store"), {
            onSuccess: () => {
                clientForm.reset();
                setQrInput("");
                setIsModalOpen(false);
            },
        });
    };

    const handleEditOperator = (op: ClientOperatorRecord) => {
        clientForm.clearErrors();
        clientForm.setData({
            assignment_id: op.id,
            operator_id: op.operator_id || op.id,
            sales_order_id: op.sales_order_id || "",
            presentation: op.presentation || "GRANEL",
            tm: op.tm ? String(op.tm) : "",
            sack: op.sack || (op.presentation === "ENVASADO" ? "25 KG" : ""),
            from: "clients",
        });
        setScanError(null);
        setIsModalOpen(true);
    };

    const handleDeleteOperator = (op: ClientOperatorRecord) => {
        const ovInfo = op.sales_order?.folio ? ` de la OV ${op.sales_order.folio}` : "";
        Swal.fire({
            title: '¿Eliminar operador?',
            text: `¿Está seguro de que desea eliminar la asignación del operador "${op.name}"${ovInfo}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("documentation.exit-operators.destroy", op.id), {
                    data: { from: "clients" },
                    preserveScroll: true,
                });
            }
        });
    };

    const filteredClientOperators = client_operators.filter((op) => {
        // 1. Filtro por Fecha Operativa con corte a las 5:00 AM
        if (selectedDate) {
            const opDate = op.operational_date || getClientOperationalDate(op.updated_at);
            if (opDate !== selectedDate) {
                return false;
            }
        }

        // 2. Filtro por Búsqueda de Texto
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase();
        const ovFolio = op.sales_order?.folio?.toLowerCase() || "";
        const opName = op.name?.toLowerCase() || "";
        const line = (op.transport_line || op.real_transport_line || "").toLowerCase();
        const tracto = op.tractor_plate?.toLowerCase() || "";
        const remolque = op.trailer_plate?.toLowerCase() || "";
        const prod = op.sales_order?.product?.name?.toLowerCase() || "";
        const pres = op.presentation?.toLowerCase() || "";
        const sack = op.sack?.toLowerCase() || "";
        return (
            ovFolio.includes(q) ||
            opName.includes(q) ||
            line.includes(q) ||
            tracto.includes(q) ||
            remolque.includes(q) ||
            prod.includes(q) ||
            pres.includes(q) ||
            sack.includes(q)
        );
    });

    const totalProgrammedTm = client_operators.reduce((acc, curr) => acc + (Number(curr.tm) || 0), 0);
    const uniqueOVsCount = new Set(client_operators.map((o) => o.sales_order_id).filter(Boolean)).size;

    const filteredProgrammedTm = filteredClientOperators.reduce((acc, curr) => acc + (Number(curr.tm) || 0), 0);
    const filteredUniqueOVsCount = new Set(filteredClientOperators.map((o) => o.sales_order_id).filter(Boolean)).size;

    // Standard form for Documentación module (12 fields)
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        license: "",
        transport_line: "",
        economic_number: "",
        real_transport_line: "",
        policy: "",
        unit_type: "VOLTEO",
        validity: "",
        brand_model: "",
        tractor_plate: "",
        trailer_plate: "",
        clients: [] as number[],
        from: isFromClients ? "clients" : "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("documentation.exit-operators.store"), {
            onSuccess: () => reset(),
        });
    };

    return (
        <DashboardLayout user={auth.user} header={isFromClients ? "Asignación Operador - Cliente" : "Registro Operadores Salida"}>
            <Head title={isFromClients ? "Asignación Operador - Cliente" : "Alta Operador Salida"} />

            {isFromClients ? (
                /* VISTA CLIENTES: Tabla de Operadores con botón ASIGNACIÓN OPERADOR - CLIENTE arriba y Modal */
                <div className="w-full max-w-[1700px] mx-auto py-6 px-3 sm:px-5 lg:px-6 pb-28 space-y-5">
                    {/* Barra de navegación superior */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Link
                            href={route("clients.index")}
                            className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Volver a Clientes
                        </Link>
                    </div>

                    {/* Mensaje Flash de éxito */}
                    {flash?.success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm animate-in fade-in">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* Encabezado y Métricas */}
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
                            <Truck className="w-64 h-64 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <UserPlus className="w-7 h-7 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                                        Asignación Operador - Cliente
                                    </h1>
                                    <p className="text-indigo-200 text-sm flex items-center gap-2">
                                        <span>Control de unidades, órdenes de venta, presentación y tonelaje asignado</span>
                                        <span className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-0.5 rounded text-xs font-semibold">
                                            <Clock className="w-3 h-3 text-indigo-200" />
                                            Corte: 5:00 AM
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Tarjetas de Métricas (dinámicas según el filtro de fecha) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
                                        {selectedDate ? "Operadores en Jornada" : "Operadores Programados"}
                                    </span>
                                    <span className="text-2xl font-black text-white mt-1 block">
                                        {filteredClientOperators.length}
                                        {selectedDate && (
                                            <span className="text-xs font-medium text-indigo-300 ml-2">
                                                (de {client_operators.length} total)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
                                        {selectedDate ? "TM en Jornada (Corte 5 AM)" : "Tonelaje Total Programado"}
                                    </span>
                                    <span className="text-2xl font-black text-emerald-300 mt-1 block">
                                        {filteredProgrammedTm.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                    </span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
                                        {selectedDate ? "Órdenes de Venta en Jornada" : "Órdenes de Venta Asignadas"}
                                    </span>
                                    <span className="text-2xl font-black text-amber-300 mt-1 block">
                                        {filteredUniqueOVsCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barra de herramientas justo ARRIBA de la tabla: Botón ALTA-OPERADOR-CLIENTE + Filtro por Fecha (Corte 5:00 AM) + Buscador */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-2">
                        {/* Botón Solicitado: asignacion-operador-cliente */}
                        <button
                            type="button"
                            onClick={() => {
                                handleClearOperator();
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-extrabold text-sm uppercase tracking-wide rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-indigo-300 active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5 text-indigo-200" />
                            <span>ASIGNACIÓN OPERADOR - CLIENTE</span>
                        </button>

                        {/* Controles de Filtros: Filtro Fecha con Corte 5:00 AM + Buscador de texto */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Filtro por Fecha con corte a las 5:00 AM */}
                            <div className="flex items-center bg-white p-1.5 rounded-xl border border-gray-300 shadow-sm gap-2">
                                <div className="flex items-center pl-2 text-gray-500">
                                    <Calendar className="w-4 h-4 text-indigo-600 mr-1.5 flex-shrink-0" />
                                    <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                        Fecha:
                                    </span>
                                </div>

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="py-1 px-2 border-0 focus:ring-0 text-xs font-bold text-indigo-950 bg-transparent cursor-pointer"
                                    title="Filtrar por jornada operativa (corte 5:00 AM)"
                                />

                                {/* Botón rápido "Hoy (Corte 5:00 AM)" */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(todayOpDate)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                        selectedDate === todayOpDate
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                    }`}
                                    title="Filtrar jornada operativa de hoy (05:00 AM a 04:59 AM del día siguiente)"
                                >
                                    Hoy
                                </button>

                                {/* Botón "Todas" / Limpiar filtro de fecha */}
                                {selectedDate && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDate("")}
                                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                        title="Ver todas las fechas"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Buscador de texto */}
                            <div className="relative w-full sm:w-72">
                                <input
                                    type="text"
                                    value={tableSearch}
                                    onChange={(e) => setTableSearch(e.target.value)}
                                    placeholder="Buscar por OV, operador, placa..."
                                    className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 py-2.5 pl-10 pr-9 text-xs font-medium text-gray-900 bg-white"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
                                {tableSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setTableSearch("")}
                                        className="p-1 text-gray-400 hover:text-gray-600 absolute right-2.5 top-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Banner informativo cuando el filtro de fecha está activo */}
                    {selectedDate && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200/90 rounded-xl text-xs text-indigo-900 animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                <span>
                                    Mostrando jornada operativa del <strong>{selectedDate}</strong>{" "}
                                    <span className="text-indigo-600 font-semibold">
                                        (Corte 5:00 AM: abarca desde las 05:00 AM del {selectedDate} hasta las 04:59:59 AM del día siguiente)
                                    </span>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDate("")}
                                className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 self-end sm:self-auto"
                            >
                                <span>Mostrar todas las fechas</span>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* TABLA PRINCIPAL con las columnas solicitadas */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full divide-y divide-gray-200 text-xs table-auto">
                                <thead className="bg-slate-50 text-slate-700 uppercase font-black tracking-wider text-[11px]">
                                    <tr>
                                        <th className="px-3 py-3 text-left whitespace-nowrap">Orden de Venta</th>
                                        <th className="px-3 py-3 text-left">Operador</th>
                                        <th className="px-2.5 py-3 text-left">Línea Transportista</th>
                                        <th className="px-2 py-3 text-center whitespace-nowrap">Tracto</th>
                                        <th className="px-2 py-3 text-center whitespace-nowrap">Remolque</th>
                                        <th className="px-2.5 py-3 text-left">Producto</th>
                                        <th className="px-2 py-3 text-center whitespace-nowrap">Presentación</th>
                                        <th className="px-2 py-3 text-center whitespace-nowrap">Envase</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">TM</th>
                                        <th className="px-3 py-3 text-right whitespace-nowrap">Saldo Actualizado</th>
                                        <th className="px-2.5 py-3 text-center whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredClientOperators.length > 0 ? (
                                        filteredClientOperators.map((op) => {
                                            const presUpper = (op.presentation || "").toUpperCase();
                                            const isGranel = presUpper === "GRANEL";
                                            const envaseText = isGranel ? "A GRANEL" : (op.sack || "25 KG");
                                            const tmNum = Number(op.tm || 0);

                                            const soId = String(op.sales_order_id || op.sales_order?.id || "");
                                            const soMatch = sales_orders.find(
                                                (s) => String(s.id) === soId
                                            );

                                            // Saldo Disponible original de la Orden de Venta (ej. 14,936.75 TM)
                                            const saldoDisponible = op.available_balance !== undefined
                                                ? Number(op.available_balance)
                                                : (op.sales_order?.balance !== undefined
                                                    ? Number(op.sales_order.balance)
                                                    : (soMatch?.balance !== undefined ? Number(soMatch.balance) : null));

                                            // Suma de todas las programaciones para esta misma Orden de Venta
                                            const totalProgForOv = totalProgrammedByOv[soId] !== undefined
                                                ? totalProgrammedByOv[soId]
                                                : Number(op.programmed_quantity || 0);

                                            // Saldo Actualizado: Saldo Disponible menos la suma acumulada de todos los operadores de esta misma OV
                                            const saldoActualizado = saldoDisponible !== null
                                                ? Math.max(0, saldoDisponible - totalProgForOv)
                                                : (op.updated_balance !== undefined ? Number(op.updated_balance) : null);

                                            return (
                                                <tr key={op.id} className="hover:bg-indigo-50/40 transition-colors">
                                                    {/* 1. Orden de Venta */}
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        {op.sales_order?.folio ? (
                                                             <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-indigo-50 text-indigo-900 border border-indigo-200/80 font-mono">
                                                                <ShoppingCart className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                                                                {op.sales_order.folio}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-[11px]">Sin OV</span>
                                                        )}
                                                    </td>

                                                    {/* 2. Operador */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-bold text-gray-900 uppercase text-xs leading-tight">
                                                            {op.name}
                                                        </div>
                                                        {op.clients && op.clients.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                                {op.clients.map((c) => (
                                                                    <span
                                                                        key={c.id}
                                                                        className="text-[10px] text-gray-500 font-medium truncate max-w-[160px] block"
                                                                        title={c.business_name}
                                                                    >
                                                                        {c.business_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* Fecha/Hora y Jornada operativa con corte a las 5:00 AM */}
                                                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                                                            <Clock className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                                            <span>
                                                                {op.formatted_updated_at || "Fecha N/A"} • Jornada:{" "}
                                                                <strong className="text-gray-600">{op.operational_date || "N/A"}</strong>
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* 3. Línea Transportista */}
                                                    <td className="px-2.5 py-2.5">
                                                        <span className="font-semibold text-gray-700 uppercase block max-w-[150px] truncate text-[11px]" title={op.transport_line || op.real_transport_line || "N/A"}>
                                                            {op.transport_line || op.real_transport_line || "N/A"}
                                                        </span>
                                                    </td>

                                                    {/* 4. Tracto */}
                                                    <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                        <span className="font-mono font-bold text-indigo-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                                            {op.tractor_plate || "-"}
                                                        </span>
                                                    </td>

                                                    {/* 5. Remolque */}
                                                    <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                        <span className="font-mono font-medium text-gray-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                                                            {op.trailer_plate || "S/R"}
                                                        </span>
                                                    </td>

                                                    {/* 6. Producto */}
                                                    <td className="px-2.5 py-2.5">
                                                        <span className="font-bold text-indigo-950 uppercase block max-w-[160px] truncate text-[11px]" title={op.sales_order?.product?.name || "N/A"}>
                                                            {op.sales_order?.product?.name || "N/A"}
                                                        </span>
                                                    </td>

                                                    {/* 7. Presentación */}
                                                    <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                isGranel
                                                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                                            }`}
                                                        >
                                                            {presUpper || "GRANEL"}
                                                        </span>
                                                    </td>

                                                    {/* 8. Envase */}
                                                    <td className="px-2 py-2.5 whitespace-nowrap text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-800">
                                                            {envaseText}
                                                        </span>
                                                    </td>

                                                    {/* 9. TM */}
                                                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                                                        <span className="font-black text-xs text-indigo-900 font-mono">
                                                            {tmNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                                        </span>
                                                    </td>

                                                    {/* 10. Saldo Actualizado */}
                                                    <td className="px-3 py-2.5 whitespace-nowrap text-right">
                                                        <span className="font-bold text-xs text-emerald-700 font-mono">
                                                            {saldoActualizado !== null
                                                                ? `${saldoActualizado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM`
                                                                : "-"}
                                                        </span>
                                                    </td>

                                                    {/* 12. Acciones */}
                                                    <td className="px-2.5 py-2.5 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditOperator(op)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 transition-colors shadow-xs"
                                                                title="Editar o reprogramar operador"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                <span>Editar</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteOperator(op)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 transition-colors shadow-xs"
                                                                title="Eliminar asignación del operador"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                <span>Eliminar</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <Truck className="w-12 h-12 text-gray-300" />
                                                    <p className="text-sm font-semibold text-gray-600">
                                                        {selectedDate
                                                            ? `No se encontraron operadores programados para la jornada del ${selectedDate} (corte 5:00 AM).`
                                                            : tableSearch
                                                            ? `No se encontraron resultados para "${tableSearch}".`
                                                            : "Aún no hay operadores dados de alta en este módulo."}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {selectedDate && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedDate("")}
                                                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                                                            >
                                                                Ver todas las fechas
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleClearOperator();
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            ASIGNACIÓN OPERADOR - CLIENTE
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pie de tabla con total de registros */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 font-medium gap-2">
                            <span>
                                Mostrando <strong>{filteredClientOperators.length}</strong> de{" "}
                                <strong>{client_operators.length}</strong> operador(es)
                                {selectedDate && (
                                    <span className="ml-2 text-indigo-700 font-bold">
                                        • Jornada: {selectedDate} (Corte 5:00 AM)
                                    </span>
                                )}
                            </span>
                            <span>
                                Total Toneladas:{" "}
                                <strong className="text-emerald-700 font-bold font-mono">
                                    {filteredProgrammedTm.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                </strong>
                            </span>
                        </div>
                    </div>

                    {/* MODAL CON EL FORMULARIO DE ALTA OPERADOR - CLIENTE */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                {/* Encabezado del Modal */}
                                <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                            <UserPlus className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black text-lg uppercase tracking-tight">
                                                {clientForm.data.assignment_id ? "EDITAR ASIGNACIÓN DE OPERADOR" : "ASIGNACIÓN OPERADOR - CLIENTE"}
                                            </h3>
                                            <p className="text-indigo-200 text-xs">
                                                {clientForm.data.assignment_id
                                                    ? "Modifique la orden de venta, presentación, tonelaje o saco de la asignación"
                                                    : "Seleccione el operador y configure presentación, TM y saco"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Cerrar ventana"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Cuerpo del Formulario */}
                                <form onSubmit={submitClientForm} className="overflow-y-auto p-6 md:p-8 space-y-6 flex-1">
                                    {/* Sección 1: Escaneo de Código QR del Operador */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Operador: <span className="text-red-500">*</span>
                                            <span className="text-xs font-normal text-indigo-600 ml-2">
                                                (Escaneo obligatorio de Código QR con pistola lectora o cámara)
                                            </span>
                                        </label>

                                        {!selectedOp ? (
                                            /* Caja para escanear QR */
                                            <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 transition-all">
                                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                                    <div className="relative flex-1 w-full">
                                                        <input
                                                            ref={qrInputRef}
                                                            type="text"
                                                            value={qrInput}
                                                            onChange={(e) => {
                                                                setQrInput(e.target.value);
                                                                if (scanError) setScanError(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleQrScan(qrInput);
                                                                }
                                                            }}
                                                            placeholder="Escanee el código QR con la pistola lectora o escriba y presione Enter..."
                                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 py-3 pl-11 pr-24 text-sm font-bold uppercase tracking-wider text-gray-900 bg-white"
                                                            autoFocus
                                                        />
                                                        <Scan className="w-5 h-5 text-indigo-600 absolute left-3.5 top-3 pointer-events-none" />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQrScan(qrInput)}
                                                            disabled={!qrInput.trim()}
                                                            className={`absolute right-2 top-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                qrInput.trim()
                                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            }`}
                                                        >
                                                            Escanear
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCameraModal(true)}
                                                        className="w-full sm:w-auto px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                                                    >
                                                        <Camera className="w-5 h-5 text-indigo-200" />
                                                        <span>Escanear con Cámara</span>
                                                    </button>
                                                </div>

                                                <p className="text-xs text-gray-500 mt-2.5 flex items-center gap-1.5">
                                                    <QrCode className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                    <span>
                                                        Pase la pistola lectora sobre el código QR de la Ficha del Operador o use la cámara web.
                                                    </span>
                                                </p>

                                                {scanError && (
                                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-bold animate-in fade-in">
                                                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                                        <span>{scanError}</span>
                                                    </div>
                                                )}
                                                {clientForm.errors.operator_id && !scanError && (
                                                    <p className="text-red-500 text-xs mt-2 font-semibold">{clientForm.errors.operator_id}</p>
                                                )}
                                            </div>
                                        ) : (
                                            /* Operador Escaneado y Validado */
                                            <div className="p-5 bg-gradient-to-r from-emerald-50/80 via-indigo-50/40 to-blue-50/50 rounded-2xl border-2 border-emerald-400/80 shadow-sm animate-in fade-in duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-100 gap-3">
                                                    <div>
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm mb-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            OPERADOR ESCANEADO Y AUTORIZADO
                                                        </span>
                                                        <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                                            {selectedOp.name}
                                                        </h4>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleClearOperator}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm transition-all"
                                                        title="Escanear otro operador"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        Cambiar / Escanear otro
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Línea Transportista:</span>
                                                        <p className="font-bold text-gray-900 uppercase truncate" title={selectedOp.transport_line}>
                                                            {selectedOp.transport_line}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Placa Tracto:</span>
                                                        <p className="font-bold text-indigo-700 font-mono uppercase">{selectedOp.tractor_plate}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Remolque:</span>
                                                        <p className="font-bold text-gray-900 font-mono uppercase">{selectedOp.trailer_plate || "S/R"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Tipo Unidad:</span>
                                                        <p className="font-bold text-gray-900 uppercase">{selectedOp.unit_type || "N/A"}</p>
                                                    </div>
                                                </div>

                                                {/* Clientes autorizados */}
                                                <div className="pt-3 mt-3 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-gray-600 font-semibold flex items-center">
                                                            <Building2 className="w-3.5 h-3.5 mr-1 text-indigo-600 flex-shrink-0" />
                                                            Cliente(s) Autorizado(s):
                                                        </span>
                                                        {selectedOp.clients && selectedOp.clients.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {selectedOp.clients.map((c) => (
                                                                    <span
                                                                        key={c.id}
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-sm"
                                                                    >
                                                                        {c.business_name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic font-medium bg-gray-100 px-2 py-0.5 rounded">
                                                                Sin cliente asignado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-indigo-800 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                                                        {operatorOVs.length} OV(s) disponible(s)
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Campo 2: Orden de Venta (OV) */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Orden de Venta (OV): <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={clientForm.data.sales_order_id}
                                                onChange={(e) => handleSalesOrderChange(e.target.value)}
                                                disabled={!selectedOp || operatorOVs.length === 0}
                                                className={`w-full rounded-lg border-gray-300 shadow-sm py-2.5 pl-10 pr-10 uppercase font-semibold text-gray-900 bg-white ${
                                                    !selectedOp || operatorOVs.length === 0
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "focus:border-indigo-500 focus:ring-indigo-500"
                                                }`}
                                                required
                                            >
                                                <option value="">
                                                    {!selectedOp
                                                        ? "-- ESCANEE PRIMERO EL CÓDIGO QR DEL OPERADOR --"
                                                        : operatorOVs.length === 0
                                                        ? "-- NO HAY ÓRDENES DE VENTA DISPONIBLES PARA ESTE OPERADOR --"
                                                        : "-- SELECCIONE ORDEN DE VENTA (OV) --"}
                                                </option>
                                                {operatorOVs.map((so) => {
                                                    const hasBalance = Number(so.balance) > 0;
                                                    return (
                                                        <option
                                                            key={so.id}
                                                            value={so.id}
                                                            disabled={!hasBalance}
                                                            className={!hasBalance ? "text-gray-400 bg-gray-100 italic" : "text-gray-900 font-semibold"}
                                                        >
                                                            {so.folio} — {so.product?.name || "PRODUCTO"} | Saldo: {Number(so.balance).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM {!hasBalance ? "⛔ (SIN SALDO)" : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <ShoppingCart className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                                        </div>
                                        {clientForm.errors.sales_order_id && (
                                            <p className="text-red-500 text-xs mt-1 font-semibold">{clientForm.errors.sales_order_id}</p>
                                        )}

                                        {/* Detalles de la OV seleccionada */}
                                        {selectedOv && (
                                            <div className="mt-2.5 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingCart className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Orden de Venta:</span>
                                                        <p className="font-extrabold text-indigo-950">{selectedOv.folio}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                                    <div>
                                                        <span className="text-gray-500 font-medium">Producto:</span>
                                                        <p className="font-extrabold text-indigo-900 uppercase">
                                                            {selectedOv.product?.name || "UREA INDUSTRIAL"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-gray-500 font-medium">Saldo Disponible:</span>
                                                    <p className="font-extrabold text-emerald-700 text-sm">
                                                        {Number(selectedOv.balance).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sección 3: Presentación, TM y Saco */}
                                    <div className={`grid gap-6 pt-2 ${
                                        clientForm.data.presentation === "GRANEL"
                                            ? "grid-cols-1 md:grid-cols-2"
                                            : "grid-cols-1 md:grid-cols-3"
                                    }`}>
                                        {/* Presentación */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                                Presentación: <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={clientForm.data.presentation}
                                                    onChange={(e) => handlePresentationChange(e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 uppercase font-semibold bg-white"
                                                    required
                                                >
                                                    <option value="GRANEL">GRANEL</option>
                                                    <option value="ENVASADO">ENVASADO</option>
                                                </select>
                                                <Box className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                                            </div>
                                            {clientForm.errors.presentation && (
                                                <p className="text-red-500 text-xs mt-1">{clientForm.errors.presentation}</p>
                                            )}
                                        </div>

                                        {/* TM con validación de saldo */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-sm font-bold text-gray-700">
                                                    TM: <span className="text-red-500">*</span>
                                                </label>
                                                {ovBalance !== null && (
                                                    <span className="text-[11px] font-bold text-emerald-700">
                                                        Saldo Máx: {ovBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={ovBalance !== null ? ovBalance : undefined}
                                                    value={clientForm.data.tm}
                                                    onChange={(e) => handleTmChange(e.target.value)}
                                                    placeholder={ovBalance !== null ? `Máx. ${ovBalance.toFixed(2)}` : "0.00"}
                                                    className={`w-full rounded-lg shadow-sm py-2.5 pl-10 pr-12 font-bold text-gray-900 ${
                                                        isTmExceeded
                                                            ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/50"
                                                            : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                                    }`}
                                                    required
                                                />
                                                <Scale className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">TM</span>
                                            </div>
                                            {clientForm.errors.tm && (
                                                <p className="text-red-500 text-xs mt-1 font-semibold">{clientForm.errors.tm}</p>
                                            )}

                                            {/* Indicador de saldo restante */}
                                            {selectedOv && ovBalance !== null && !isTmExceeded && clientForm.data.tm && parseFloat(clientForm.data.tm) > 0 && (
                                                <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                                    Quedarán tras programar:{" "}
                                                    <strong className="text-indigo-900 font-bold">
                                                        {(ovBalance - parseFloat(clientForm.data.tm)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TM
                                                    </strong>
                                                </p>
                                            )}
                                        </div>

                                        {/* Saco — Solo visible si presentación es ENVASADO */}
                                        {clientForm.data.presentation === "ENVASADO" && (
                                            <div className="animate-in fade-in duration-200">
                                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                                    Saco: <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={clientForm.data.sack}
                                                        onChange={(e) => clientForm.setData("sack", e.target.value)}
                                                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 pl-10 font-bold text-indigo-900 bg-white"
                                                        required
                                                    >
                                                        <option value="25 KG">25 KG</option>
                                                        <option value="50 KG">50 KG</option>
                                                    </select>
                                                    <Package className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                                                </div>
                                                {clientForm.errors.sack && (
                                                    <p className="text-red-500 text-xs mt-1">{clientForm.errors.sack}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tabla de saldo acumulado (solo consulta) */}
                                    {selectedOp && operatorOVs.length > 0 && (
                                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase">
                                                Saldo acumulado por Orden de Venta
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs">
                                                    <thead className="bg-gray-50 text-gray-500 uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">Programado TM</th>
                                                            <th className="px-3 py-2 text-right">Saldo Disponible</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(clientForm.data.sales_order_id
                                                            ? operatorOVs.filter((so) => so.id === clientForm.data.sales_order_id)
                                                            : operatorOVs
                                                        ).map((so) => {
                                                            const fmt = (v: number | string | undefined) =>
                                                                Number(v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                                            const isSelected = so.id === clientForm.data.sales_order_id;
                                                            const baseBalance = Number(so.balance || 0);
                                                            const baseProgrammed = Number(so.programmed_quantity || 0);
                                                            const inputTm = isSelected ? (parseFloat(clientForm.data.tm) || 0) : 0;

                                                            // El saldo programado se actualiza en tiempo real con el tonelaje que se va ingresando
                                                            const liveProgrammed = isSelected
                                                                ? Math.max(0, baseProgrammed - existingTm + inputTm)
                                                                : baseProgrammed;

                                                            // El saldo disponible se va descontando en tiempo real según el saldo programado
                                                            const liveAvailable = isSelected
                                                                ? Math.max(0, baseBalance - liveProgrammed)
                                                                : (so.available_balance !== undefined ? Number(so.available_balance) : Math.max(0, baseBalance - baseProgrammed));

                                                            return (
                                                                <tr key={so.id} className={isSelected ? "bg-indigo-50 font-bold" : ""}>
                                                                    <td className="px-3 py-2 text-left font-bold text-gray-900">{fmt(liveProgrammed)}</td>
                                                                    <td className={`px-3 py-2 text-right font-bold ${isSelected && isTmExceeded ? "text-red-600" : "text-emerald-700"}`}>
                                                                        {fmt(liveAvailable)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Alerta de saldo excedido */}
                                    {isTmExceeded && (
                                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 font-bold animate-in fade-in duration-150">
                                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            <span>
                                                ❌ El tonelaje ingresado ({parseFloat(clientForm.data.tm).toFixed(2)} TM) excede el saldo restante de la OV ({ovBalance?.toFixed(2)} TM). Solo se permite programar hasta lo que queda disponible.
                                            </span>
                                        </div>
                                    )}

                                    {/* Cálculo de equivalencia: Solo para ENVASADO con saco */}
                                    {clientForm.data.presentation === "ENVASADO" && !isTmExceeded && clientForm.data.tm && parseFloat(clientForm.data.tm) > 0 && clientForm.data.sack && (
                                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in duration-150">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span>
                                                Equivalencia calculada:{" "}
                                                <strong>
                                                    {Math.round(
                                                        (parseFloat(clientForm.data.tm) * 1000) /
                                                            (clientForm.data.sack.includes("50") ? 50 : 25)
                                                    ).toLocaleString()}
                                                </strong>{" "}
                                                sacos de {clientForm.data.sack} para {parseFloat(clientForm.data.tm).toFixed(2)} TM.
                                            </span>
                                        </div>
                                    )}

                                    {/* Pie del Modal con Botones */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={clientForm.processing || isTmExceeded || !clientForm.data.sales_order_id || !clientForm.data.operator_id}
                                            className={`inline-flex items-center px-7 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg text-white transition-all transform ${
                                                isTmExceeded || !clientForm.data.sales_order_id || !clientForm.data.operator_id
                                                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                                                    : "bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-green-200"
                                            }`}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {clientForm.processing ? "Guardando..." : "GUARDAR OPERADOR"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* VISTA DOCUMENTACIÓN ESTÁNDAR (12 campos, sin cambios) */
                <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-36">
                    <div className="mb-6">
                        <Link
                            href={route("documentation.exit-operators.index")}
                            className="text-gray-500 hover:text-gray-900 flex items-center text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Volver a Lista
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                        <div className="bg-gradient-to-r from-indigo-800 to-indigo-900 px-8 py-6 flex items-center justify-between rounded-t-2xl">
                            <div className="flex items-center">
                                <div className="p-2 bg-indigo-700 rounded-lg mr-3 shadow-inner">
                                    <UserPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl uppercase">
                                        Alta de Operador de Salida
                                    </h3>
                                    <p className="text-indigo-200 text-sm">
                                        Ingrese los datos correspondientes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                {/* Column 1 */}
                                <div className="space-y-6">
                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData("name", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <User className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    {/* Linea transportista */}
                                    <TransportLineDropdown
                                        value={data.transport_line}
                                        onChange={(val) => setData("transport_line", val)}
                                        label="Linea transportista:"
                                        error={errors.transport_line}
                                    />

                                    {/* Linea real */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Linea real:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.real_transport_line}
                                                onChange={(e) => setData("real_transport_line", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.real_transport_line && <p className="text-red-500 text-xs mt-1">{errors.real_transport_line}</p>}
                                    </div>

                                    {/* Poliza */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Poliza:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.policy}
                                                onChange={(e) => setData("policy", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <Shield className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.policy && <p className="text-red-500 text-xs mt-1">{errors.policy}</p>}
                                    </div>

                                    {/* Vigencia */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Vigencia:</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={data.validity}
                                                onChange={(e) => setData("validity", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10"
                                                required
                                            />
                                            <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.validity && <p className="text-red-500 text-xs mt-1">{errors.validity}</p>}
                                    </div>

                                    {/* Licencia */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Licencia:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.license}
                                                onChange={(e) => setData("license", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.license && <p className="text-red-500 text-xs mt-1">{errors.license}</p>}
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-6">
                                    {/* Numero economico */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Numero economico:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.economic_number}
                                                onChange={(e) => setData("economic_number", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <Hash className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.economic_number && <p className="text-red-500 text-xs mt-1">{errors.economic_number}</p>}
                                    </div>

                                    {/* Tipo de unidad */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de unidad:</label>
                                        <div className="relative">
                                            <select
                                                value={data.unit_type}
                                                onChange={(e) => setData("unit_type", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            >
                                                <option value="VOLTEO">VOLTEO</option>
                                                <option value="TORTON">TORTON</option>
                                                <option value="CAMIONETA">CAMIONETA</option>
                                                <option value="TRACTOCAMION">TRACTOCAMION</option>
                                                <option value="FULL">FULL</option>
                                            </select>
                                            <Truck className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.unit_type && <p className="text-red-500 text-xs mt-1">{errors.unit_type}</p>}
                                    </div>

                                    {/* Marca y modelo */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Marca y modelo:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.brand_model}
                                                onChange={(e) => setData("brand_model", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <Truck className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.brand_model && <p className="text-red-500 text-xs mt-1">{errors.brand_model}</p>}
                                    </div>

                                    {/* Placa tracto */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Placa tracto:</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.tractor_plate}
                                                onChange={(e) => setData("tractor_plate", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required
                                            />
                                            <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.tractor_plate && <p className="text-red-500 text-xs mt-1">{errors.tractor_plate}</p>}
                                    </div>

                                    {/* Placa remolque */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Placa remolque:{" "}
                                            {["VOLTEO", "TORTON", "CAMIONETA"].includes(data.unit_type) && (
                                                <span className="text-xs text-gray-400 font-normal">(Opcional para esta unidad)</span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={data.trailer_plate}
                                                onChange={(e) => setData("trailer_plate", e.target.value)}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 pl-10 uppercase"
                                                required={!["VOLTEO", "TORTON", "CAMIONETA"].includes(data.unit_type)}
                                            />
                                            <FileText className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                                        </div>
                                        {errors.trailer_plate && <p className="text-red-500 text-xs mt-1">{errors.trailer_plate}</p>}
                                    </div>

                                    {/* Clientes */}
                                    <ClientMultiSelect
                                        clients={clients}
                                        selectedIds={data.clients}
                                        onChange={(ids) => setData("clients", ids)}
                                        error={errors.clients}
                                    />
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-6 h-6 mr-2" />
                                    {processing ? "Guardando..." : "GUARDAR OPERADOR"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Escáner QR con Cámara */}
            <QrScannerModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onScan={handleQrScan}
                title="Escanear QR del Operador"
            />
        </DashboardLayout>
    );
}
