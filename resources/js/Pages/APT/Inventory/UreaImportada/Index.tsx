import React, { useState, useEffect, useMemo, FormEventHandler } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage, useForm } from "@inertiajs/react";
import axios from "axios";
import {
    Search,
    ArrowLeft,
    Plus,
    X,
    Database,
    Ship,
    Clock,
    TrendingUp,
    BarChart3,
    Boxes,
    Save,
    RotateCcw,
    ShieldCheck,
    Edit,
    Trash2,
    Filter,
    Scale,
    QrCode,
    Truck,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

interface DailyProduction {
    id: number;
    date: string;
    shift: string;
    warehouse: string;
    cubicle?: string;
    destination_warehouses?: string;
    cubicles_list?: string;
    total_entries?: number;
    total_trips?: number;
    plant_origin: string;
    packaging: string;
    quantity_tons: string | number;
    sacks_count?: number;
    lot_folio?: string;
    supervisor_name?: string;
    notes?: string;
    user?: {
        name: string;
    };
    created_at: string;
}

interface InitialInventory {
    id: number;
    date: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
    packaging: string;
    quantity_tons: string | number;
    sacks_count?: number;
    lot_folio?: string;
    notes?: string;
    user?: {
        name: string;
    };
    created_at: string;
}

interface Metrics {
    operationalDate?: string;
    totalInitialTons: number;
    totalInitialSacks: number;
    totalDailyTons: number;
    totalDailySacks: number;
    todayProductionTons: number;
    todayProductionSacks: number;
    totalShippedTons?: number;
    totalStockTons: number;
    totalStockSacks: number;
    byPlant: {
        [key: string]: {
            initial_tons: number;
            daily_tons: number;
            total_tons: number;
        };
    };
    byWarehouse: {
        [key: string]: {
            name: string;
            initial_tons: number;
            daily_tons: number;
            shipped_tons?: number;
            total_inflow_tons?: number;
            total_tons: number;
            available_tons?: number;
        };
    };
}

interface LotOption {
    id: string;
    folio: string;
    warehouse: string;
    cubicle?: string;
    plant_origin: string;
}

interface VesselDraftStat {
    id: string;
    name: string;
    status: string;
    draft_weight_tons: number;
    total_trips: number;
    apt_scans_count: number;
    unit_draft_tons: number;
    breakdown: Array<{
        warehouse: string;
        cubicle: string;
        trips_count: number;
    }>;
    created_at?: string;
}

interface PageProps {
    auth: any;
    tab?: "production" | "initial" | "summary";
    operationalDate?: string;
    dailyProductions: {
        data: DailyProduction[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    initialInventories: {
        data: InitialInventory[];
        links: any[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
    };
    metrics: Metrics;
    lots: LotOption[];
    vesselsWithDraftStats?: VesselDraftStat[];
    filters: {
        search?: string;
        warehouse?: string;
        plant_origin?: string;
        date_from?: string;
        date_to?: string;
        shift?: string;
        tab?: string;
    };
}

const PACKAGING_OPTIONS = [
    "Granel",
    "Sacos 25 Kg",
    "Sacos 50 Kg",
    "Big Bag 1000 Kg",
    "Jumbo 1.5 TM",
];

const SHIFT_OPTIONS = [
    "Turno 1 (07:00 - 15:00)",
    "Turno 2 (15:00 - 23:00)",
    "Turno 3 (23:00 - 07:00)",
    "Turno Especial / Mixto",
];

const ORIGIN_OPTIONS = [
    "BUQUE / MUELLE",
    "UREA 1",
    "UREA 2",
    "IMPORTACIÓN",
];

export default function UreaImportadaInventoryIndex({
    auth,
    tab: initialTab = "production",
    operationalDate,
    dailyProductions,
    initialInventories,
    metrics,
    lots = [],
    vesselsWithDraftStats = [],
    filters = {},
}: PageProps) {
    const requestedTab = typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("tab") as "production" | "initial" | "summary" | null)
        : null;
    const [activeTab, setActiveTab] = useState<"production" | "initial" | "summary">(
        requestedTab || initialTab || (filters?.tab as any) || "production"
    );

    // Search and filter state
    const [search, setSearch] = useState(filters?.search || "");
    const [warehouseFilter, setWarehouseFilter] = useState(filters?.warehouse || "");
    const [plantFilter, setPlantFilter] = useState(filters?.plant_origin || "");
    const [shiftFilter, setShiftFilter] = useState(filters?.shift || "");
    const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
    const [dateTo, setDateTo] = useState(filters?.date_to || "");

    // Modal States
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
    const [editingDaily, setEditingDaily] = useState<DailyProduction | null>(null);

    const [isInitialModalOpen, setIsInitialModalOpen] = useState(false);
    const [editingInitial, setEditingInitial] = useState<InitialInventory | null>(null);

    // Scale QR Entry Modal States
    const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
    const [scaleQrInput, setScaleQrInput] = useState("");
    const [isSearchingTicket, setIsSearchingTicket] = useState(false);
    const [ticketData, setTicketData] = useState<any | null>(null);
    const [scaleWarehouse, setScaleWarehouse] = useState("Almacen 1");
    const [scaleCubicle, setScaleCubicle] = useState("");
    const [scaleNotes, setScaleNotes] = useState("");
    const [scaleDate, setScaleDate] = useState("");
    const [scaleQuantityTons, setScaleQuantityTons] = useState("");
    const [isSubmittingScale, setIsSubmittingScale] = useState(false);

    // Draft (Calado) Modal States
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
    const [draftVesselId, setDraftVesselId] = useState("");
    const [draftTotalWeight, setDraftTotalWeight] = useState<string | number>("");
    const [draftTotalTrips, setDraftTotalTrips] = useState<string | number>("");
    const [draftDate, setDraftDate] = useState("");
    const [draftShift, setDraftShift] = useState("Turno 1");
    const [draftWarehouse, setDraftWarehouse] = useState("Almacen 1");
    const [draftCubicle, setDraftCubicle] = useState("");
    const [draftOriginName, setDraftOriginName] = useState("BUQUE / MUELLE");
    const [draftNotes, setDraftNotes] = useState("");
    const [draftLotFolio, setDraftLotFolio] = useState("");
    const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
    const [draftMode, setDraftMode] = useState<"auto" | "manual">("auto");

    // Helper: Determinar la fecha operativa con corte a las 5:00 AM
    const getOperationalDate = () => {
        if (operationalDate) return operationalDate;
        if (metrics?.operationalDate) return metrics.operationalDate;
        const now = new Date();
        if (now.getHours() < 5) {
            now.setDate(now.getDate() - 1);
        }
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Daily Reception / Production Form
    const dailyForm = useForm({
        date: getOperationalDate(),
        shift: "Turno 1",
        warehouse: "Almacen 1",
        cubicle: "",
        plant_origin: "BUQUE / MUELLE",
        packaging: "Granel",
        quantity_tons: "",
        sacks_count: "",
        lot_folio: "",
        supervisor_name: auth?.user?.name || "",
        notes: "",
    });

    // Initial Inventory Form
    const initialForm = useForm({
        date: getOperationalDate(),
        warehouse: "Almacen 1",
        cubicle: "",
        plant_origin: "BUQUE / MUELLE",
        packaging: "Granel",
        quantity_tons: "",
        sacks_count: "",
        lot_folio: "",
        notes: "",
    });

    const cleanParams = (params: Record<string, any>) => {
        const result: Record<string, any> = {};
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== "") {
                result[key] = val;
            }
        });
        return result;
    };

    // Handle filter application
    const applyFilters = (overrides = {}) => {
        const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
        const query = cleanParams({
            tab: activeTab,
            search,
            warehouse: warehouseFilter,
            plant_origin: plantFilter,
            shift: shiftFilter,
            date_from: dateFrom,
            date_to: dateTo,
            from,
            ...overrides,
        });

        router.get(route("apt.inventory.urea-importada.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearch("");
        setWarehouseFilter("");
        setPlantFilter("");
        setShiftFilter("");
        setDateFrom("");
        setDateTo("");

        const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
        router.get(route("apt.inventory.urea-importada.index"), cleanParams({ tab: activeTab, from }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleTabChange = (newTab: "production" | "initial" | "summary") => {
        setActiveTab(newTab);
        const from = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;
        const query = cleanParams({
            tab: newTab,
            search,
            warehouse: warehouseFilter,
            plant_origin: plantFilter,
            shift: shiftFilter,
            date_from: dateFrom,
            date_to: dateTo,
            from,
        });

        router.get(route("apt.inventory.urea-importada.index"), query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Open & Edit Modal Handlers for Daily Production
    const openDailyModal = (item?: DailyProduction) => {
        if (item) {
            setEditingDaily(item);
            const destination = item.destination_warehouses || item.warehouse || "Almacen 1";
            const ubicacion = item.cubicles_list || item.cubicle || "";
            const trips = item.total_trips ?? item.total_entries ?? item.sacks_count ?? "";
            dailyForm.setData({
                date: item.date ? item.date.split("T")[0] : getOperationalDate(),
                shift: item.shift || "Turno 1",
                warehouse: destination,
                cubicle: ubicacion,
                plant_origin: item.plant_origin || "BUQUE / MUELLE",
                packaging: item.packaging || "Granel",
                quantity_tons: String(item.quantity_tons),
                sacks_count: String(trips),
                lot_folio: "",
                supervisor_name: "",
                notes: item.notes || "",
            });
        } else {
            setEditingDaily(null);
            dailyForm.reset();
            dailyForm.setData({
                date: getOperationalDate(),
                shift: "Turno 1",
                warehouse: "Almacen 1",
                cubicle: "",
                plant_origin: "BUQUE / MUELLE",
                packaging: "Granel",
                quantity_tons: "",
                sacks_count: "",
                lot_folio: "",
                supervisor_name: "",
                notes: "",
            });
        }
        setIsDailyModalOpen(true);
    };

    const handleDailySubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingDaily) {
            dailyForm.put(route("apt.inventory.urea-importada.daily.update", editingDaily.id), {
                onSuccess: () => {
                    setIsDailyModalOpen(false);
                    Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: "Registro diario de Urea Importada actualizado correctamente.",
                        timer: 1800,
                        showConfirmButton: false,
                    });
                },
            });
        } else {
            dailyForm.post(route("apt.inventory.urea-importada.daily.store"), {
                onSuccess: () => {
                    setIsDailyModalOpen(false);
                    dailyForm.reset();
                    Swal.fire({
                        icon: "success",
                        title: "Registrado",
                        text: "Registro diario de Urea Importada guardado exitosamente.",
                        timer: 1800,
                        showConfirmButton: false,
                    });
                },
            });
        }
    };

    // Scale QR Entry Modal Handlers
    const openScaleModal = () => {
        setScaleQrInput("");
        setTicketData(null);
        setScaleWarehouse("Almacen 1");
        setScaleCubicle("");
        setScaleNotes("");
        setScaleDate(getOperationalDate());
        setScaleQuantityTons("");
        setIsScaleModalOpen(true);
        // Automatically fetch latest completed scale ticket without waiting for manual input
        handleSearchTicket(undefined, "latest");
    };

    const handleSearchTicket = async (e?: React.FormEvent, customQuery?: string) => {
        if (e) e.preventDefault();
        const queryToSearch = customQuery !== undefined ? customQuery : scaleQrInput.trim();
        if (!queryToSearch) return;

        setIsSearchingTicket(true);
        try {
            const response = await axios.post(route("apt.inventory.scan-ticket-info"), {
                qr: queryToSearch,
            });

            if (response.data && response.data.success && response.data.ticket) {
                const t = response.data.ticket;
                setTicketData(t);
                if (t.folio) {
                    setScaleQrInput(t.folio);
                }
                if (t.suggested_warehouse) {
                    setScaleWarehouse(t.suggested_warehouse);
                }
                if (t.suggested_cubicle) {
                    setScaleCubicle(t.suggested_cubicle);
                }
                // Use current operational date so entry counts for today's reception
                setScaleDate(getOperationalDate());
                setScaleQuantityTons(String(t.net_weight_tons ?? ""));
                setScaleNotes(`Entrada por Báscula - Ticket: ${t.folio} | Buque: ${t.vessel_name} | Chofer: ${t.driver_name} (${t.plates})`);
            } else if (!customQuery) {
                Swal.fire({
                    icon: "warning",
                    title: "Ticket no encontrado",
                    text: "No se encontró ningún ticket de báscula con ese folio o código QR.",
                });
            }
        } catch (error: any) {
            if (!customQuery) {
                Swal.fire({
                    icon: "error",
                    title: "Error al buscar",
                    text: error?.response?.data?.message || "Ocurrió un error al buscar el ticket de báscula.",
                });
            }
        } finally {
            setIsSearchingTicket(false);
        }
    };

    const handleScaleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketData) return;

        setIsSubmittingScale(true);
        const finalTons = parseFloat(scaleQuantityTons) > 0 ? parseFloat(scaleQuantityTons) : (ticketData.net_weight_tons || 0);

        router.post(
            route("apt.inventory.urea-importada.daily.store"),
            {
                date: scaleDate || getOperationalDate(),
                shift: "Turno 1",
                warehouse: scaleWarehouse,
                cubicle: scaleCubicle || null,
                plant_origin: ticketData.vessel_name || "BUQUE / MUELLE",
                packaging: "Granel",
                quantity_tons: finalTons,
                sacks_count: 1, // 1 ticket de báscula = 1 viaje
                notes: scaleNotes,
                supervisor_name: auth?.user?.name || "Báscula",
            },
            {
                onSuccess: () => {
                    setIsScaleModalOpen(false);
                    setTicketData(null);
                    setScaleQrInput("");
                    setScaleQuantityTons("");
                    Swal.fire({
                        icon: "success",
                        title: "¡Entrada Registrada por Báscula!",
                        html: `<b>${finalTons} TM</b> registradas en <b>${scaleWarehouse}</b>${scaleCubicle ? ` (Cubículo ${scaleCubicle})` : ""}.`,
                        timer: 2200,
                        showConfirmButton: false,
                    });
                },
                onError: (errors) => {
                    Swal.fire({
                        icon: "error",
                        title: "Error al registrar",
                        text: Object.values(errors).join("\n") || "No se pudo guardar la entrada por báscula.",
                    });
                },
                onFinish: () => {
                    setIsSubmittingScale(false);
                },
            }
        );
    };

    // Draft (Calado) Handlers & Dynamic Calculation
    const openDraftModal = () => {
        setDraftDate(getOperationalDate());
        setDraftShift("Turno 1");
        setDraftWarehouse("Almacen 1");
        setDraftCubicle("");
        setDraftLotFolio("");
        setDraftNotes("Recepción por Calado de Buque (Draft)");

        if (vesselsWithDraftStats && vesselsWithDraftStats.length > 0) {
            const firstActive = vesselsWithDraftStats.find((v) => v.status === "active" || v.total_trips > 0) || vesselsWithDraftStats[0];
            setDraftVesselId(firstActive.id);
            setDraftOriginName(firstActive.name);
            setDraftTotalWeight(firstActive.draft_weight_tons > 0 ? firstActive.draft_weight_tons : "");
            setDraftTotalTrips(firstActive.total_trips > 0 ? firstActive.total_trips : "");
            setDraftMode("auto");
        } else {
            setDraftVesselId("");
            setDraftOriginName("BUQUE / MUELLE");
            setDraftTotalWeight("");
            setDraftTotalTrips("");
            setDraftMode("manual");
        }
        setIsDraftModalOpen(true);
    };

    const handleSelectDraftVessel = (vId: string) => {
        setDraftVesselId(vId);
        const found = vesselsWithDraftStats?.find((v) => String(v.id) === String(vId));
        if (found) {
            setDraftOriginName(found.name);
            setDraftTotalWeight(found.draft_weight_tons > 0 ? found.draft_weight_tons : "");
            setDraftTotalTrips(found.total_trips > 0 ? found.total_trips : "");
        } else {
            setDraftOriginName("BUQUE / MUELLE");
        }
    };

    const selectedDraftVessel = useMemo(() => {
        return vesselsWithDraftStats?.find((v) => String(v.id) === String(draftVesselId));
    }, [vesselsWithDraftStats, draftVesselId]);

    const calculatedUnitDraft = useMemo(() => {
        const weight = parseFloat(String(draftTotalWeight)) || 0;
        return weight;
    }, [draftTotalWeight]);

    const handleDraftBatchSubmit = () => {
        if (!selectedDraftVessel || !selectedDraftVessel.breakdown || selectedDraftVessel.breakdown.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Sin desgloses escaneados",
                text: "El buque seleccionado no tiene viajes escaneados por almacén en APT.",
            });
            return;
        }

        const unitDraft = calculatedUnitDraft;
        if (unitDraft <= 0) {
            Swal.fire({
                icon: "warning",
                title: "Cálculo incompleto",
                text: "El buque seleccionado no tiene un peso promedio de calado válido mayor a 0 TM.",
            });
            return;
        }

        const totalTripsCount = selectedDraftVessel.breakdown.reduce((acc, curr) => acc + curr.trips_count, 0);
        const totalDraftTons = Number((totalTripsCount * unitDraft).toFixed(3));

        const entries = selectedDraftVessel.breakdown.map((b) => ({
            date: draftDate || getOperationalDate(),
            shift: draftShift || "Turno 1",
            warehouse: b.warehouse || "Almacen 1",
            cubicle: b.cubicle || null,
            plant_origin: draftOriginName || selectedDraftVessel.name,
            quantity_tons: Number((b.trips_count * unitDraft).toFixed(3)),
            trips_count: b.trips_count,
            notes: `${draftNotes || "Recepción por Calado (Draft)"} | Buque: ${draftOriginName} | ${b.trips_count} viajes escaneados × ${unitDraft} TM/vje = ${(b.trips_count * unitDraft).toFixed(3)} TM (Total Calado: ${totalDraftTons} TM)`,
        }));

        setIsSubmittingDraft(true);
        router.post(
            route("apt.inventory.urea-importada.batch-draft"),
            { entries },
            {
                onSuccess: () => {
                    setIsDraftModalOpen(false);
                    setIsSubmittingDraft(false);
                    Swal.fire({
                        icon: "success",
                        title: "¡Entradas por Draft Registradas!",
                        text: `Se registraron exitosamente ${entries.length} desgloses en el historial por un total de ${totalDraftTons.toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM.`,
                        timer: 2500,
                        showConfirmButton: false,
                    });
                },
                onError: () => {
                    setIsSubmittingDraft(false);
                    Swal.fire({
                        icon: "error",
                        title: "Error al guardar",
                        text: "Ocurrió un error al registrar las entradas de calado.",
                    });
                },
            }
        );
    };

    const handleDraftSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(String(draftTotalWeight)) || 0;
        const trips = parseFloat(String(draftTotalTrips)) || 0;

        let tonsToRegister = weight;
        if (trips > 0 && calculatedUnitDraft > 0 && (!weight || weight === 0)) {
            tonsToRegister = trips * calculatedUnitDraft;
        }

        if (tonsToRegister <= 0) {
            Swal.fire({
                icon: "warning",
                title: "Cantidad requerida",
                text: "Debe ingresar una cantidad o peso de calado mayor a 0 TM.",
            });
            return;
        }

        setIsSubmittingDraft(true);
        router.post(
            route("apt.inventory.urea-importada.daily.store"),
            {
                date: draftDate || getOperationalDate(),
                shift: draftShift || "Turno 1",
                warehouse: draftWarehouse,
                cubicle: draftCubicle || null,
                plant_origin: draftOriginName || "BUQUE / MUELLE",
                packaging: "Granel",
                quantity_tons: tonsToRegister,
                lot_folio: draftLotFolio || null,
                notes: `${draftNotes || "Recepción por Calado (Draft)"}${trips > 0 && calculatedUnitDraft > 0 ? ` | (${trips} viajes × ${calculatedUnitDraft.toFixed(4)} TM/vje)` : ""}`,
            },
            {
                onSuccess: () => {
                    setIsDraftModalOpen(false);
                    setIsSubmittingDraft(false);
                    Swal.fire({
                        icon: "success",
                        title: "Entrada por Draft Registrada",
                        text: `Se registró la entrada de ${tonsToRegister.toFixed(3)} TM correctamente en el historial de Urea Importada.`,
                        timer: 2000,
                        showConfirmButton: false,
                    });
                },
                onError: () => {
                    setIsSubmittingDraft(false);
                    Swal.fire({
                        icon: "error",
                        title: "Error al registrar",
                        text: "Verifique los datos e intente nuevamente.",
                    });
                },
            }
        );
    };

    const handleDeleteDaily = (itemOrId: DailyProduction | number) => {
        const id = typeof itemOrId === "object" ? itemOrId.id : itemOrId;
        const plantOrigin = typeof itemOrId === "object" ? itemOrId.plant_origin : "";

        Swal.fire({
            title: "¿Eliminar del historial?",
            text: plantOrigin
                ? `¿Está seguro de eliminar los registros de recepción del buque "${plantOrigin}"?`
                : "Esta acción eliminará el registro diario de recepción de Urea Importada.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-5 py-2.5 font-bold",
                cancelButton: "rounded-xl px-5 py-2.5 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.inventory.urea-importada.daily.destroy", id), {
                    data: { plant_origin: plantOrigin },
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "Registro eliminado exitosamente del historial.",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    },
                    onError: (errors) => {
                        Swal.fire({
                            icon: "error",
                            title: "Error al eliminar",
                            text: Object.values(errors).join("\n") || "No se pudo eliminar el registro.",
                        });
                    },
                });
            }
        });
    };

    // Open & Edit Modal Handlers for Initial Inventory
    const openInitialModal = (item?: InitialInventory) => {
        if (item) {
            setEditingInitial(item);
            initialForm.setData({
                date: item.date ? item.date.split("T")[0] : getOperationalDate(),
                warehouse: item.warehouse || "Almacen 1",
                cubicle: item.cubicle || "",
                plant_origin: item.plant_origin || "BUQUE / MUELLE",
                packaging: item.packaging || "Granel",
                quantity_tons: String(item.quantity_tons),
                sacks_count: item.sacks_count ? String(item.sacks_count) : "",
                lot_folio: item.lot_folio || "",
                notes: item.notes || "",
            });
        } else {
            setEditingInitial(null);
            initialForm.reset();
            initialForm.setData({
                date: getOperationalDate(),
                warehouse: "Almacen 1",
                cubicle: "",
                plant_origin: "BUQUE / MUELLE",
                packaging: "Granel",
                quantity_tons: "",
                sacks_count: "",
                lot_folio: "",
                notes: "",
            });
        }
        setIsInitialModalOpen(true);
    };

    const handleInitialSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingInitial) {
            initialForm.put(route("apt.inventory.urea-importada.initial.update", editingInitial.id), {
                onSuccess: () => {
                    setIsInitialModalOpen(false);
                    Swal.fire({
                        icon: "success",
                        title: "Actualizado",
                        text: "Inventario inicial de Urea Importada actualizado correctamente.",
                        timer: 1800,
                        showConfirmButton: false,
                    });
                },
            });
        } else {
            initialForm.post(route("apt.inventory.urea-importada.initial.store"), {
                onSuccess: () => {
                    setIsInitialModalOpen(false);
                    initialForm.reset();
                    Swal.fire({
                        icon: "success",
                        title: "Registrado",
                        text: "Inventario inicial de Urea Importada guardado exitosamente.",
                        timer: 1800,
                        showConfirmButton: false,
                    });
                },
            });
        }
    };

    const handleDeleteInitial = (id: number) => {
        Swal.fire({
            title: "¿Eliminar inventario inicial?",
            text: "Esta acción eliminará el registro base de inventario inicial de Urea Importada.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#9333ea",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "rounded-2xl",
                confirmButton: "rounded-xl px-5 py-2.5 font-bold",
                cancelButton: "rounded-xl px-5 py-2.5 font-bold",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("apt.inventory.urea-importada.initial.destroy", id), {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Eliminado",
                            text: "Registro eliminado exitosamente",
                            timer: 1500,
                            showConfirmButton: false,
                        });
                    },
                });
            }
        });
    };

    // Helper to format numbers
    const formatNumber = (num: number, decimals: number = 2) => {
        return Number(num || 0).toLocaleString("es-MX", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    // Helper to format dates
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const parts = dateStr.split("T")[0].split("-");
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return new Date(dateStr).toLocaleDateString("es-MX");
        } catch {
            return dateStr;
        }
    };

    const fromParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") : null;

    const pageTitle =
        activeTab === "production"
            ? "Urea Importada: Recepción / Producción Diaria"
            : activeTab === "initial"
            ? "Urea Importada: Inventario Inicial"
            : "Urea Importada: Balance y Desglose";

    return (
        <DashboardLayout user={auth.user} header={pageTitle}>
            <Head title={pageTitle} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <Link
                            href={typeof route === "function" ? `${route("apt.inventory.production-hub")}${fromParam ? `?from=${fromParam}` : ""}` : `/apt/inventory/production-hub${fromParam ? `?from=${fromParam}` : ""}`}
                            className="inline-flex items-center text-purple-700 hover:text-purple-900 transition-colors bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs text-sm font-semibold"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Volver a Producción
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 shadow-xs">
                            <Ship className="w-3.5 h-3.5 mr-1" />
                            Urea Importada
                        </span>
                    </div>
                </div>

                {/* Hero Header */}
                <div
                    className={`rounded-2xl shadow-xl p-6 sm:p-8 text-white mb-8 relative overflow-hidden ${
                        activeTab === "initial"
                            ? "bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950"
                            : activeTab === "production"
                            ? "bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900"
                            : "bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900"
                    }`}
                >
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div
                                    className={`p-2.5 rounded-xl backdrop-blur-sm border ${
                                        activeTab === "initial"
                                            ? "bg-purple-600/40 border-purple-400/30"
                                            : activeTab === "production"
                                            ? "bg-purple-600/40 border-purple-400/30"
                                            : "bg-indigo-600/40 border-indigo-400/30"
                                    }`}
                                >
                                    {activeTab === "production" ? (
                                        <Ship className="w-7 h-7 text-purple-200" />
                                    ) : activeTab === "initial" ? (
                                        <Boxes className="w-7 h-7 text-purple-200" />
                                    ) : (
                                        <BarChart3 className="w-7 h-7 text-indigo-200" />
                                    )}
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    {pageTitle}
                                </h1>
                            </div>
                            <p
                                className={`text-sm sm:text-base max-w-2xl ${
                                    activeTab === "initial" ? "text-purple-100" : "text-purple-100"
                                }`}
                            >
                                {activeTab === "production"
                                    ? "Captura y seguimiento de la recepción y balance diario por turno, origen/buque y almacén de Urea Importada."
                                    : activeTab === "initial"
                                    ? "Captura y balance inicial de existencias base de Urea Importada."
                                    : "Consolidado de stock total, inventario inicial y recepción acumulada de Urea Importada."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {/* Card 1: Stock Total Disponible Urea Importada */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Stock Neto Disponible
                            </p>
                            <h3 className="text-2xl font-black text-purple-700">
                                {formatNumber(metrics?.totalStockTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-purple-600">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {(metrics?.totalStockSacks ?? 0) > 0 ? `${formatNumber(metrics.totalStockSacks, 0)} sacos aprox.` : "Disponible en almacenes"}
                            </p>
                        </div>
                        <div className="p-3.5 bg-purple-50 rounded-2xl text-purple-600">
                            <Ship className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Recepción / Producción Hoy */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Recepción / Prod. Hoy
                            </p>
                            <h3 className="text-2xl font-black text-purple-700">
                                {formatNumber(metrics?.todayProductionTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-purple-600">TM</span>
                            </h3>
                            <p className="text-xs text-purple-600 font-medium mt-1">
                                {formatDate(metrics?.operationalDate || getOperationalDate())}
                                <span className="ml-1 text-[11px] text-gray-400 font-normal">(Corte 5:00 AM)</span>
                            </p>
                        </div>
                        <div className="p-3.5 bg-purple-50 rounded-2xl text-purple-600">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3: Embarques Despachados */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Embarques Despachados
                            </p>
                            <h3 className="text-2xl font-black text-rose-700">
                                {formatNumber(metrics?.totalShippedTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-rose-600">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Salidas completadas (O.E.)
                            </p>
                        </div>
                        <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4: Inventario Inicial */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Inventario Inicial
                            </p>
                            <h3 className="text-2xl font-black text-indigo-900">
                                {formatNumber(metrics?.totalInitialTons ?? 0, 2)}{" "}
                                <span className="text-sm font-semibold text-gray-500">TM</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Balance base configurado
                            </p>
                        </div>
                        <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600">
                            <Boxes className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Submodule Tab Selector */}
                <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl shadow-xs px-2 pt-2">
                    <button
                        onClick={() => handleTabChange("production")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "production"
                                ? "border-purple-600 text-purple-700 bg-purple-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <Ship className="w-4 h-4 mr-2 text-purple-600" />
                        Recepción / Producción Diaria
                        <span className="ml-2.5 py-0.5 px-2 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                            {dailyProductions?.total ?? 0}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange("initial")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "initial"
                                ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <Boxes className="w-4 h-4 mr-2 text-indigo-600" />
                        Inventario Inicial
                        <span className="ml-2.5 py-0.5 px-2 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                            {initialInventories?.total ?? 0}
                        </span>
                    </button>

                    <button
                        onClick={() => handleTabChange("summary")}
                        className={`flex items-center py-3 px-5 border-b-2 font-bold text-sm transition-all rounded-t-lg ${
                            activeTab === "summary"
                                ? "border-violet-600 text-violet-700 bg-violet-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        <BarChart3 className="w-4 h-4 mr-2 text-violet-600" />
                        Balance y Desglose
                    </button>
                </div>

                {/* Filters Section (For production & initial tabs) */}
                {activeTab !== "summary" && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Search */}
                            <div className="lg:col-span-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Buscar folio, almacén, notas..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                />
                            </div>

                            {/* Warehouse Filter */}
                            <div>
                                <select
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    value={warehouseFilter}
                                    onChange={(e) => setWarehouseFilter(e.target.value)}
                                >
                                    <option value="">Todos los Almacenes</option>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={`Almacen ${n}`}>
                                            Almacén {n}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Plant / Origin Filter */}
                            <div>
                                <select
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    value={plantFilter}
                                    onChange={(e) => setPlantFilter(e.target.value)}
                                >
                                    <option value="">Todos los Orígenes</option>
                                    {ORIGIN_OPTIONS.map((orig) => (
                                        <option key={orig} value={orig}>
                                            {orig}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <input
                                    type="date"
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-xl text-sm focus:ring-purple-500 focus:border-purple-500"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    placeholder="Fecha Desde"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyFilters()}
                                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-xl shadow-xs text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                >
                                    <Filter className="w-3.5 h-3.5 mr-1" />
                                    Filtrar
                                </button>
                                <button
                                    onClick={resetFilters}
                                    title="Limpiar filtros"
                                    className="px-2.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 1 Content: Daily Reception / Production Table */}
                {activeTab === "production" && (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-purple-50/30 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Ship className="w-5 h-5 mr-2 text-purple-600" />
                                    Historial de Recepción y Producción de Urea Importada
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Registros diarios por turno, buque/origen y almacén
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <button
                                    onClick={() => openDraftModal()}
                                    className="inline-flex items-center px-3.5 py-2 rounded-xl shadow-xs text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300/80 transition-all hover:shadow"
                                    title="Entrada global o calado de buque"
                                >
                                    <span className="mr-1.5 text-sm">🚢</span>
                                    Entrada por Draft
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Origen / Buque</th>
                                        <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider">Viajes</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Destino</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Ubicación</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Cantidad (TM)</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {dailyProductions?.data && dailyProductions.data.length > 0 ? (
                                        dailyProductions.data.map((item) => {
                                            const destination = item.destination_warehouses || item.warehouse || "-";
                                            const ubicacion = item.cubicles_list
                                                ? (item.cubicles_list.toLowerCase().includes("cubículo")
                                                    ? item.cubicles_list
                                                    : `Cubículo ${item.cubicles_list}`)
                                                : (item.cubicle ? `Cubículo ${item.cubicle}` : "General");
                                            return (
                                                <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                        {item.date ? item.date.split("T")[0] : "-"}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold">
                                                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                                                            {item.plant_origin}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-center text-xs font-bold">
                                                        {((item.total_trips ?? 0) > 0 || (item.total_entries ?? 0) > 0) ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                                                {(item.total_trips || item.total_entries)?.toLocaleString("es-MX")} viajes
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 font-normal">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-gray-900">
                                                        {destination}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                                                        {ubicacion}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-purple-700">
                                                        {formatNumber(Number(item.quantity_tons), 3)} TM
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={() => openDailyModal(item)}
                                                                className="text-purple-600 hover:text-purple-900 p-1.5 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                                                title="Editar registro"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDaily(item)}
                                                                className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                                title="Eliminar registro"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Ship className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="text-base font-medium text-gray-600">
                                                        No hay registros de recepción de Urea Importada
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Haga clic en "Nuevo Registro de Recepción" para comenzar a capturar.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {dailyProductions?.links && dailyProductions.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Mostrando {dailyProductions.from || 0} a {dailyProductions.to || 0} de {dailyProductions.total} registros
                                </p>
                                <div className="flex space-x-1">
                                    {dailyProductions.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                link.active
                                                    ? "bg-purple-600 text-white font-bold"
                                                    : link.url
                                                    ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2 Content: Initial Inventory Table */}
                {activeTab === "initial" && (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-indigo-50/30 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Boxes className="w-5 h-5 mr-2 text-indigo-600" />
                                    Registros de Inventario Inicial de Urea Importada
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Balance y stock inicial base por almacén y origen
                                </p>
                            </div>
                            <button
                                onClick={() => openInitialModal()}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Capturar Inventario Inicial
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Fecha Inicial</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Origen</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Almacén / Ubicación</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Cantidad Inicial (TM)</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Observaciones</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Registrado Por</th>
                                        <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {initialInventories?.data && initialInventories.data.length > 0 ? (
                                        initialInventories.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-indigo-50/40 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {item.date}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs font-bold">
                                                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                                                        {item.plant_origin}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-700">
                                                    <div className="font-bold text-gray-900">{item.warehouse}</div>
                                                    {item.cubicle && (
                                                        <div className="text-[11px] text-gray-500">
                                                            Cubículo: {item.cubicle}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-indigo-700">
                                                    {formatNumber(Number(item.quantity_tons), 3)} TM
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-xs truncate">
                                                    {item.notes || "-"}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    <div className="font-medium text-gray-800">
                                                        {item.user?.name || "Sistema"}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => openInitialModal(item)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                            title="Editar inventario inicial"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteInitial(item.id)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Eliminar inventario inicial"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Boxes className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="text-base font-medium text-gray-600">
                                                        No hay registros de inventario inicial de Urea Importada
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Haga clic en "Capturar Inventario Inicial" para establecer el balance de partida.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {initialInventories?.links && initialInventories.links.length > 3 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    Mostrando {initialInventories.from || 0} a {initialInventories.to || 0} de {initialInventories.total} registros
                                </p>
                                <div className="flex space-x-1">
                                    {initialInventories.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                link.active
                                                    ? "bg-indigo-600 text-white font-bold"
                                                    : link.url
                                                    ? "text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                    : "text-gray-300 cursor-not-allowed"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3 Content: Balance & Breakdown */}
                {activeTab === "summary" && (
                    <div className="space-y-6">
                        {/* Summary by Origin */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {ORIGIN_OPTIONS.map((origin) => {
                                const plantData = metrics?.byPlant?.[origin] || {
                                    initial_tons: 0,
                                    daily_tons: 0,
                                    total_tons: 0,
                                };
                                return (
                                    <div
                                        key={origin}
                                        className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-3 rounded-xl bg-purple-100 text-purple-700">
                                                    <Ship className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-extrabold text-gray-900">
                                                        {origin}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">
                                                        Urea Importada
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-2xl font-black text-gray-900">
                                                    {formatNumber(plantData.total_tons, 2)}
                                                </span>{" "}
                                                <span className="text-xs font-bold text-gray-500">TM</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-3 border-t border-gray-100 text-sm">
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span className="flex items-center">
                                                    <Boxes className="w-4 h-4 mr-2 text-indigo-500" />
                                                    Inventario Inicial:
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    {formatNumber(plantData.initial_tons, 3)} TM
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-600">
                                                <span className="flex items-center">
                                                    <Ship className="w-4 h-4 mr-2 text-purple-500" />
                                                    Recepción / Prod. Acumulada:
                                                </span>
                                                <span className="font-bold text-gray-800">
                                                    {formatNumber(plantData.daily_tons, 3)} TM
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Warehouse Breakdown Table */}
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                        <Database className="w-5 h-5 mr-2 text-purple-600" />
                                        Balance y Existencias de Urea Importada por Almacén
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Fórmula: (Inventario Inicial + Recepción Diaria) − Embarques Despachados = Stock Neto Disponible
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-800 text-white">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider">Almacén</th>
                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">Inv. Inicial (TM)</th>
                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">Recepción (TM)</th>
                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-rose-300">Embarques (TM)</th>
                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-purple-300">Stock Disponible (TM)</th>
                                            <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider">% Distribución</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {metrics?.byWarehouse && Object.entries(metrics.byWarehouse).map(([key, wh]) => {
                                            const totalStock = metrics?.totalStockTons ?? 0;
                                            const pct = totalStock > 0 ? (wh.total_tons / totalStock) * 100 : 0;
                                            return (
                                                <tr key={key} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900 flex items-center">
                                                        <Database className="w-4 h-4 mr-2 text-gray-400" />
                                                        {wh.name}
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-indigo-700">
                                                        {formatNumber(wh.initial_tons, 3)} TM
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium text-purple-700">
                                                        {formatNumber(wh.daily_tons, 3)} TM
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600">
                                                        {formatNumber(wh.shipped_tons ?? 0, 3)} TM
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-black text-purple-700 bg-purple-50/40">
                                                        {formatNumber(wh.total_tons, 3)} TM
                                                    </td>
                                                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-bold text-gray-600">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className="bg-purple-600 h-2 rounded-full"
                                                                    style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                                                                />
                                                            </div>
                                                            <span>{formatNumber(pct, 1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-gray-100 font-black border-t-2 border-gray-300">
                                            <td className="px-5 py-4 text-sm text-gray-900">TOTAL GENERAL</td>
                                            <td className="px-5 py-4 text-right text-sm text-indigo-900">
                                                {formatNumber(metrics?.totalInitialTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-purple-900">
                                                {formatNumber(metrics?.totalDailyTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-5 py-4 text-right text-sm text-rose-800">
                                                {formatNumber(metrics?.totalShippedTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-5 py-4 text-right text-base text-purple-900 bg-purple-100/60">
                                                {formatNumber(metrics?.totalStockTons ?? 0, 3)} TM
                                            </td>
                                            <td className="px-5 py-4 text-right text-xs text-gray-900">100.0%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Entrada por Báscula (QR) */}
            {isScaleModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-purple-100 animate-fade-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-6 py-5 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-purple-600/40 rounded-xl border border-purple-400/30">
                                    <Scale className="w-6 h-6 text-purple-200" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg">
                                        Entrada por Báscula con QR
                                    </h3>
                                    <p className="text-purple-200 text-xs">
                                        Urea Importada — Recepción con Ticket de Báscula
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsScaleModalOpen(false)}
                                className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Step 1: Scanner / Ticket input */}
                            <div className="bg-purple-50/60 border border-purple-200/70 rounded-2xl p-4.5">
                                <label className="block text-xs font-black uppercase tracking-wider text-purple-900 mb-2 flex items-center">
                                    <QrCode className="w-4 h-4 mr-1.5 text-purple-700" />
                                    Escanear Código QR o Ingresar Folio de Ticket
                                </label>
                                <form onSubmit={handleSearchTicket} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Escanee QR o escriba folio (ej: TKT-1001, OP 123...)"
                                            value={scaleQrInput}
                                            onChange={(e) => setScaleQrInput(e.target.value)}
                                            className="w-full pl-4 pr-10 py-2.5 rounded-xl border-purple-300 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono shadow-xs bg-white"
                                        />
                                        {scaleQrInput && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScaleQrInput("");
                                                    setTicketData(null);
                                                }}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSearchingTicket || !scaleQrInput.trim()}
                                        className="inline-flex items-center px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                                    >
                                        {isSearchingTicket ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                        ) : (
                                            <Search className="w-4 h-4 mr-1" />
                                        )}
                                        Buscar Ticket
                                    </button>
                                </form>
                                <p className="text-[11px] text-purple-700/80 mt-1.5 flex items-center">
                                    <span className="font-semibold mr-1">💡 Tip:</span> Conecte su lector de código de barras / QR USB o inalámbrico para captura instantánea al presionar Enter.
                                </p>
                            </div>

                            {/* Ticket Details & Confirmation Form */}
                            {ticketData ? (
                                <form onSubmit={handleScaleSubmit} className="space-y-5">
                                    {/* Ticket info summary card */}
                                    <div className="bg-gradient-to-br from-gray-900 to-purple-950 text-white rounded-2xl p-5 shadow-md border border-purple-800/40">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/50 pb-3 mb-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
                                                    Ticket: {ticketData.folio}
                                                </span>
                                                <span className="text-xs text-purple-200">
                                                    {ticketData.vessel_name}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-purple-300">
                                                Fecha Ticket: {ticketData.date}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                                            <div>
                                                <span className="text-purple-300 text-[11px] block">Chofer / Operador</span>
                                                <span className="font-bold text-white truncate block">{ticketData.driver_name}</span>
                                            </div>
                                            <div>
                                                <span className="text-purple-300 text-[11px] block">Placas</span>
                                                <span className="font-bold text-white font-mono">{ticketData.plates}</span>
                                            </div>
                                            <div>
                                                <span className="text-purple-300 text-[11px] block">Peso Bruto</span>
                                                <span className="font-semibold text-gray-300">{ticketData.gross_weight_tons} TM</span>
                                            </div>
                                            <div>
                                                <span className="text-purple-300 text-[11px] block">Tara</span>
                                                <span className="font-semibold text-gray-300">{ticketData.tare_weight_tons} TM</span>
                                            </div>
                                        </div>

                                        {/* Highlighted Net Weight & Quantity Input */}
                                        <div className="bg-purple-600/30 border border-purple-400/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center space-x-2">
                                                <Scale className="w-5 h-5 text-purple-300" />
                                                <div>
                                                    <span className="text-xs font-bold text-purple-200 block">
                                                        PESO BÁSCULA (PESO NETO)
                                                    </span>
                                                    <span className="text-[11px] text-purple-200">
                                                        {ticketData.net_weight_kg ? Number(ticketData.net_weight_kg).toLocaleString("es-MX") : (Number(ticketData.net_weight_tons) * 1000).toLocaleString("es-MX")} kg = {ticketData.net_weight_tons} TM
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1.5 border border-purple-400/30">
                                                <label className="text-xs font-bold text-purple-200 whitespace-nowrap pl-1">Cantidad a Ingresar:</label>
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0.001"
                                                    required
                                                    value={scaleQuantityTons}
                                                    onChange={(e) => setScaleQuantityTons(e.target.value)}
                                                    className="w-32 py-1 px-2.5 rounded-lg bg-white text-gray-900 font-black text-right text-sm focus:ring-purple-500 focus:border-purple-500 border-0"
                                                />
                                                <span className="text-xs font-black text-purple-200 pr-1">TM</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warehouse, Date & Cubicle Form */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Fecha de Recepción <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={scaleDate}
                                                onChange={(e) => setScaleDate(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 text-sm bg-white font-medium text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-0.5">Corte recepción (5:00 AM)</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Almacén Destino <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                value={scaleWarehouse}
                                                onChange={(e) => setScaleWarehouse(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 text-sm bg-white font-semibold text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                    <option key={n} value={`Almacen ${n}`}>
                                                        Almacén {n}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Cubículo Asignado {(scaleWarehouse === "Almacen 4" || scaleWarehouse === "Almacen 5") && <span className="text-purple-600 font-semibold">(Recomendado)</span>}
                                            </label>
                                            <select
                                                value={scaleCubicle}
                                                onChange={(e) => setScaleCubicle(e.target.value)}
                                                className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="">Seleccione cubículo (opcional)...</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                    <option key={n} value={`${n}`}>
                                                        Cubículo {n}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                                Notas / Observaciones
                                            </label>
                                            <input
                                                type="text"
                                                value={scaleNotes}
                                                onChange={(e) => setScaleNotes(e.target.value)}
                                                placeholder="Detalles adicionales..."
                                                className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTicketData(null);
                                                setScaleQrInput("");
                                            }}
                                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            Escanear Otro
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingScale}
                                            className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all transform hover:-translate-y-0.5"
                                        >
                                            {isSubmittingScale ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                                    Guardando Entrada...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                                    Confirmar Entrada al Almacén
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <Scale className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-gray-600">
                                        Esperando escaneo de ticket...
                                    </p>
                                    <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                                        Escanee el código QR del ticket de báscula para obtener de inmediato el peso neto, camión y buque de origen.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Draft (Calado de Barco) Calculation & Entry */}
            {isDraftModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-purple-100 animate-fade-in my-auto">
                        {/* Header */}
                        <div className="flex-shrink-0 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 px-6 py-3.5 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center space-x-3 relative z-10">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-inner">
                                    <Ship className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-base text-white tracking-tight">
                                            Entrada por Calado de Barco (Draft)
                                        </h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30">
                                            Urea Importada
                                        </span>
                                    </div>
                                    <p className="text-purple-200 text-xs">
                                        Cálculo automático: Peso Promedio × Viajes Escaneados (Barco + APT)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDraftModalOpen(false)}
                                className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors relative z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Workflow Explanatory Steps */}
                        <div className="flex-shrink-0 bg-purple-50/60 border-b border-purple-100/80 px-6 py-2">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="flex items-center justify-center space-x-1.5 text-purple-900 font-semibold bg-white py-1 px-2 rounded-lg border border-purple-200/60 shadow-2xs">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold">1</span>
                                    <span className="truncate">Escaneo Barco</span>
                                </div>
                                <div className="flex items-center justify-center space-x-1.5 text-purple-900 font-semibold bg-white py-1 px-2 rounded-lg border border-purple-200/60 shadow-2xs">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold">2</span>
                                    <span className="truncate">Escaneo APT</span>
                                </div>
                                <div className="flex items-center justify-center space-x-1.5 text-purple-900 font-semibold bg-white py-1 px-2 rounded-lg border border-purple-200/60 shadow-2xs">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold">3</span>
                                    <span className="truncate">Draft = Peso Promedio × Viajes</span>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Seleccionar Buque con Operaciones Registradas <span className="text-purple-600">*</span>
                                    </label>
                                    <select
                                        value={draftVesselId}
                                        onChange={(e) => handleSelectDraftVessel(e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-semibold bg-white focus:ring-purple-500 focus:border-purple-500 py-1.5"
                                    >
                                        <option value="">-- Seleccionar Buque --</option>
                                        {vesselsWithDraftStats?.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.total_trips} viajes escaneados, Calado: {v.draft_weight_tons > 0 ? `${v.draft_weight_tons} TM` : "Por asignar"}) - {v.status === "active" ? "Activo" : v.status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Real-time Draft Calculation Dashboard */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 p-2.5 rounded-xl border border-purple-100">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <label className="block text-[11px] font-bold text-purple-900">
                                                Peso Promedio (TM)
                                            </label>
                                            <span className="text-[10px] text-purple-600 font-semibold bg-purple-100/80 px-1.5 py-0.5 rounded">🔒 Solo lectura</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="any"
                                                readOnly
                                                disabled
                                                value={draftTotalWeight}
                                                placeholder="Ej: 15.80158"
                                                className="w-full rounded-lg border-purple-200 text-sm font-bold text-purple-950 focus:ring-0 focus:border-purple-200 bg-purple-100/50 cursor-not-allowed select-none py-1.5"
                                            />
                                            <span className="absolute right-3 top-2 text-xs text-purple-400 font-semibold">TM</span>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-2.5 rounded-xl border border-indigo-100">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <label className="block text-[11px] font-bold text-indigo-900">
                                                Total de Viajes Escaneados
                                            </label>
                                            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/80 px-1.5 py-0.5 rounded">🔒 Solo lectura</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="1"
                                                readOnly
                                                disabled
                                                value={draftTotalTrips}
                                                placeholder="Ej: 1301"
                                                className="w-full rounded-lg border-indigo-200 text-sm font-bold text-indigo-950 focus:ring-0 focus:border-indigo-200 bg-indigo-100/50 cursor-not-allowed select-none py-1.5"
                                            />
                                            <span className="absolute right-3 top-2 text-xs text-indigo-400 font-semibold">Viajes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Breakdown per Warehouse and Cubicle from APT Scans */}
                                {selectedDraftVessel && selectedDraftVessel.breakdown && selectedDraftVessel.breakdown.length > 0 ? (
                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                                        <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-gray-800 flex items-center">
                                                <Database className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                                                Desglose Escaneado en APT ({selectedDraftVessel.breakdown.length} ubicaciones)
                                            </h4>
                                            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                                Total: {selectedDraftVessel.breakdown.reduce((acc, curr) => acc + curr.trips_count, 0)} viajes
                                            </span>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                                            <thead className="bg-gray-100 font-bold text-gray-700">
                                                <tr>
                                                    <th className="px-3.5 py-2 text-left">Almacén</th>
                                                    <th className="px-3.5 py-2 text-left">Cubículo</th>
                                                    <th className="px-3.5 py-2 text-center">Viajes</th>
                                                    <th className="px-3.5 py-2 text-right font-extrabold text-purple-900">Cantidad (TM)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedDraftVessel.breakdown.map((row, idx) => {
                                                    const rowTons = calculatedUnitDraft > 0 ? row.trips_count * calculatedUnitDraft : 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                                                            <td className="px-3.5 py-1.5 font-bold text-gray-900">{row.warehouse}</td>
                                                            <td className="px-3.5 py-1.5 text-gray-600 font-medium">
                                                                {row.cubicle ? `Cubículo ${row.cubicle}` : "General"}
                                                            </td>
                                                            <td className="px-3.5 py-1.5 text-center font-semibold text-gray-700">
                                                                <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                                                    {row.trips_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-3.5 py-1.5 text-right font-extrabold text-purple-700">
                                                                {rowTons.toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-purple-50/60 font-bold border-t border-purple-100">
                                                <tr>
                                                    <td colSpan={2} className="px-3.5 py-2 text-purple-950 font-bold">Total a Registrar por Draft:</td>
                                                    <td className="px-3.5 py-2 text-center text-purple-950">
                                                        {selectedDraftVessel.breakdown.reduce((acc, curr) => acc + curr.trips_count, 0)} viajes
                                                    </td>
                                                    <td className="px-3.5 py-2 text-right text-purple-900 font-extrabold text-sm">
                                                        {(selectedDraftVessel.breakdown.reduce((acc, curr) => acc + curr.trips_count, 0) * calculatedUnitDraft).toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 text-center">
                                        <AlertCircle className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                        <p className="text-xs font-bold text-amber-900">
                                            No se encontraron escaneos de entrada APT desglosados para este buque.
                                        </p>
                                        <p className="text-[11px] text-amber-700 mt-0.5 max-w-md mx-auto">
                                            Verifique que los escaneos de entrada en APT correspondientes a este buque se hayan registrado correctamente.
                                        </p>
                                    </div>
                                )}

                                {/* Date, Shift, and Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Fecha de Operación <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={draftDate || getOperationalDate()}
                                            onChange={(e) => setDraftDate(e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500 py-1.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Turno
                                        </label>
                                        <select
                                            value={draftShift}
                                            onChange={(e) => setDraftShift(e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500 py-1.5"
                                        >
                                            {SHIFT_OPTIONS.map((sh) => (
                                                <option key={sh} value={sh}>{sh}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer for Batch submit - Always pinned at bottom */}
                        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
                            <span className="text-xs text-gray-600 font-medium">
                                {calculatedUnitDraft > 0
                                    ? `Fórmula: ${draftTotalWeight} TM (Peso Promedio) × ${draftTotalTrips} viajes = ${(Number(draftTotalWeight) * Number(draftTotalTrips)).toLocaleString('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} TM`
                                    : "Seleccione un buque con calado y viajes registrados para procesar el desglose."}
                            </span>
                            <div className="flex space-x-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsDraftModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmittingDraft || calculatedUnitDraft <= 0 || !selectedDraftVessel || !selectedDraftVessel.breakdown || selectedDraftVessel.breakdown.length === 0}
                                    onClick={handleDraftBatchSubmit}
                                    className="inline-flex items-center px-5 py-2 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Ship className="w-4 h-4 mr-1.5" />
                                    {isSubmittingDraft ? "Registrando en Historial..." : "🚢 Sincronizar y Registrar Calado en Historial"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Daily Reception / Production Form */}
            {isDailyModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-fade-in">
                        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-700/50 rounded-lg">
                                    <Ship className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {editingDaily ? "Editar Registro de Recepción" : "Capturar Recepción Diaria"}
                                    </h3>
                                    <p className="text-purple-200 text-xs">
                                        Urea Importada
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDailyModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDailySubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Fecha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={dailyForm.data.date}
                                        onChange={(e) => dailyForm.setData("date", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {dailyForm.errors.date && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.date}</p>
                                    )}
                                </div>

                                {/* Origen / Buque */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Origen / Buque <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: BUBBA BOOSH"
                                        value={dailyForm.data.plant_origin}
                                        onChange={(e) => dailyForm.setData("plant_origin", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-semibold text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {dailyForm.errors.plant_origin && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.plant_origin}</p>
                                    )}
                                </div>

                                {/* Total de Viajes */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Total de Viajes
                                    </label>
                                    <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="Ej: 1301"
                                        value={dailyForm.data.sacks_count}
                                        onChange={(e) => dailyForm.setData("sacks_count", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-semibold text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Cantidad en Toneladas */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Cantidad Recibida (TM) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        required
                                        placeholder="Ej: 20557.857"
                                        value={dailyForm.data.quantity_tons}
                                        onChange={(e) => dailyForm.setData("quantity_tons", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-bold text-purple-700 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {dailyForm.errors.quantity_tons && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.quantity_tons}</p>
                                    )}
                                </div>

                                {/* Destino (Almacén) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Destino (Almacén) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Almacén 3, Almacén 4"
                                        value={dailyForm.data.warehouse}
                                        onChange={(e) => dailyForm.setData("warehouse", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {dailyForm.errors.warehouse && (
                                        <p className="text-xs text-red-500 mt-1">{dailyForm.errors.warehouse}</p>
                                    )}
                                </div>

                                {/* Ubicación (Cubículo) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Ubicación (Cubículo)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Cubículo 3, 4, 5, 6 o General"
                                        value={dailyForm.data.cubicle}
                                        onChange={(e) => dailyForm.setData("cubicle", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Observaciones / Notas
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Detalles adicionales sobre la recepción..."
                                        value={dailyForm.data.notes}
                                        onChange={(e) => dailyForm.setData("notes", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDailyModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={dailyForm.processing}
                                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    {dailyForm.processing ? "Guardando..." : editingDaily ? "Actualizar Registro" : "Guardar Recepción"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Initial Inventory Form */}
            {isInitialModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-fade-in">
                        <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-6 py-5 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-700/50 rounded-lg">
                                    <Boxes className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {editingInitial ? "Editar Inventario Inicial" : "Capturar Inventario Inicial"}
                                    </h3>
                                    <p className="text-purple-200 text-xs">
                                        Urea Importada
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsInitialModalOpen(false)}
                                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Fecha de Inventario Inicial <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={initialForm.data.date}
                                        onChange={(e) => initialForm.setData("date", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {initialForm.errors.date && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.date}</p>
                                    )}
                                </div>

                                {/* Origen */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Origen <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={initialForm.data.plant_origin}
                                        onChange={(e) => initialForm.setData("plant_origin", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {ORIGIN_OPTIONS.map((orig) => (
                                            <option key={orig} value={orig}>
                                                {orig}
                                            </option>
                                        ))}
                                    </select>
                                    {initialForm.errors.plant_origin && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.plant_origin}</p>
                                    )}
                                </div>

                                {/* Almacén */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Almacén <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={initialForm.data.warehouse}
                                        onChange={(e) => initialForm.setData("warehouse", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={`Almacen ${n}`}>
                                                Almacén {n}
                                            </option>
                                        ))}
                                    </select>
                                    {initialForm.errors.warehouse && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.warehouse}</p>
                                    )}
                                </div>

                                {/* Cubículo (if Almacen 4/5) */}
                                {(initialForm.data.warehouse === "Almacen 4" || initialForm.data.warehouse === "Almacen 5") && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">
                                            Cubículo
                                        </label>
                                        <select
                                            value={initialForm.data.cubicle}
                                            onChange={(e) => initialForm.setData("cubicle", e.target.value)}
                                            className="w-full rounded-xl border-gray-300 text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Seleccione cubículo...</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                                <option key={n} value={`${n}`}>
                                                    Cubículo {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Cantidad en Toneladas */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Cantidad Inicial (TM) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        required
                                        placeholder="Ej: 5000.000"
                                        value={initialForm.data.quantity_tons}
                                        onChange={(e) => initialForm.setData("quantity_tons", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm font-bold text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                    {initialForm.errors.quantity_tons && (
                                        <p className="text-xs text-red-500 mt-1">{initialForm.errors.quantity_tons}</p>
                                    )}
                                </div>

                                {/* Observaciones */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Observaciones / Notas
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Detalles sobre el inventario inicial..."
                                        value={initialForm.data.notes}
                                        onChange={(e) => initialForm.setData("notes", e.target.value)}
                                        className="w-full rounded-xl border-gray-300 text-sm focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsInitialModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={initialForm.processing}
                                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Save className="w-4 h-4 mr-1.5" />
                                    {initialForm.processing ? "Guardando..." : editingInitial ? "Actualizar Inventario" : "Guardar Inventario Inicial"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
