import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { BarChart, DonutChart, Legend, Title } from "@tremor/react";
import {
    Activity,
    Truck,
    Scale,
    Filter,
    Calendar,
    Warehouse,
    Box,
    User as UserIcon,
    RefreshCw,
    Anchor,
    ChevronDown,
    ArrowLeft,
    Ship,
} from "lucide-react";
import { Card, CardContent } from "@/Components/ui/card";
import axios from "axios";
import { useState, useEffect } from "react";

export default function Dashboard({
    auth,
    stats,
    charts,
    options,
    filters,
    vessel,
    vessels_list,
}: any) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAllCubicles, setShowAllCubicles] = useState(false);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const resetDrill = () => {
        setDrillLevel(0);
        setDrillData([]);
        setTripsData([]);
        setSelectedDate(null);
        setSelectedWarehouse(null);
        setSelectedUnit(null);
    };

    const handleFilterChange = (key: string, value: string) => {
        resetDrill();
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        router.get(route("dashboard"), newFilters, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const handleViewModeChange = (mode: "all" | "scale" | "burreo") => {
        resetDrill();
        const newFilters = { ...localFilters, operation_type: mode };
        setLocalFilters(newFilters);
        router.get(route("dashboard"), newFilters, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const refreshData = () => {
        setIsRefreshing(true);
        router.reload({ onFinish: () => setIsRefreshing(false) });
    };

    // --- HELPERS ---
    const formatTonnes = (val: number | any) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format((val || 0) / 1000);

    const formatMT = (val: number | any) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(val || 0);

    const formatNumber = (val: number | any) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val || 0);

    const viewMode = localFilters.operation_type || "all";

    // Calculate effective total for the sidebar/visuals
    const effectiveTotal =
        viewMode === "scale"
            ? stats.total_scale || 0
            : viewMode === "burreo"
                ? stats.total_burreo || 0
                : stats.total_tonnage || 0;

    // --- DRILL-DOWN LOGIC ---
    const [drillLevel, setDrillLevel] = useState<0 | 1 | 2 | 3>(0); // 0: Main, 1: Warehouses, 2: Units, 3: Trips
    const [drillData, setDrillData] = useState<any>([]); // For level 2 this will be the paginated object
    const [tripsData, setTripsData] = useState<any[]>([]);
    const [drillLoading, setDrillLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
        null,
    );
    const [selectedUnit, setSelectedUnit] = useState<{
        operator_name: string;
        economic_number: string;
    } | null>(null);

    const handleBarClick = async (data: any) => {
        if (!data || !data.date) return;
        const date = data.date;
        setSelectedDate(date);
        setDrillLevel(1);
        setDrillLoading(true);

        try {
            const response = await axios.get(
                route("dashboard.drilldown.warehouses"),
                {
                    params: {
                        vessel_id: vessel?.id,
                        date,
                        operation_type: viewMode,
                    },
                },
            );
            setDrillData(response.data);
        } catch (error) {
            console.error("Drill-down error:", error);
        } finally {
            setDrillLoading(false);
        }
    };

    const handleWarehouseClick = async (
        warehouse: string,
        page: number = 1,
    ) => {
        setSelectedWarehouse(warehouse);
        setDrillLevel(2);
        setDrillLoading(true);

        try {
            const response = await axios.get(
                route("dashboard.drilldown.units"),
                {
                    params: {
                        vessel_id: vessel?.id,
                        date: selectedDate,
                        warehouse,
                        operation_type: viewMode,
                        page,
                    },
                },
            );
            setDrillData(response.data);
        } catch (error) {
            console.error("Drill-down error:", error);
        } finally {
            setDrillLoading(false);
        }
    };

    const handleUnitClick = async (unit: any) => {
        setSelectedUnit({
            operator_name: unit.operator_name,
            economic_number: unit.economic_number,
        });
        setDrillLevel(3);
        setDrillLoading(true);

        try {
            const response = await axios.get(
                route("dashboard.drilldown.unit-trips"),
                {
                    params: {
                        vessel_id: vessel?.id,
                        date: selectedDate,
                        warehouse: selectedWarehouse,
                        operator_name: unit.operator_name,
                        economic_number: unit.economic_number,
                        operation_type: viewMode,
                    },
                },
            );
            setTripsData(response.data);
        } catch (error) {
            console.error("Trips drill-down error:", error);
        } finally {
            setDrillLoading(false);
        }
    };

    const backToWarehouses = () => {
        setDrillLevel(1);
        setSelectedWarehouse(null);
        setTripsData([]);
        if (selectedDate) handleBarClick({ date: selectedDate });
    };

    const backToUnits = () => {
        setDrillLevel(2);
        setSelectedUnit(null);
        setTripsData([]);
        // We don't need to re-fetch if we preserve state, but drillData Level 2 is the paginated object
    };

    const categories =
        viewMode === "scale"
            ? ["scale"]
            : viewMode === "burreo"
                ? ["burreo"]
                : ["total"];

    const colors =
        viewMode === "scale"
            ? ["blue"]
            : viewMode === "burreo"
                ? ["amber"]
                : ["blue"]; // Let's use blue for total as well or indigo

    return (
        <DashboardLayout user={auth.user} header="Centro de Mando Operativo">
            <Head title="Dashboard" />

            <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
                {/* Top Bar: Title & Selectors */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1e3a8a] text-white p-6 rounded-3xl shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Anchor className="w-8 h-8 text-blue-200" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                                Resumen-{vessel?.operation_type || "Descarga"} de barco{" "}
                                <span className="text-blue-300">
                                    {vessel?.name || "---"}
                                </span>
                            </h1>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">
                                {vessel?.dock
                                    ? `Muelle ${vessel.dock}`
                                    : "Sin muelle asignado"}{" "}
                                • ETA:{" "}
                                {vessel?.eta
                                    ? String(vessel.eta).substring(0, 10)
                                    : "--"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* ... buttons ... */}
                        {/* Unicorn Mode Toggle */}
                        <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
                            <button
                                onClick={() => handleViewModeChange("all")}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === "all"
                                    ? "bg-white text-[#1e3a8a] shadow-lg scale-105"
                                    : "text-blue-200 hover:text-white"
                                    }`}
                            >
                                Total
                            </button>
                            <button
                                onClick={() => handleViewModeChange("scale")}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === "scale"
                                    ? "bg-blue-400 text-white shadow-lg scale-105"
                                    : "text-blue-200 hover:text-white"
                                    }`}
                            >
                                Báscula
                            </button>
                            <button
                                onClick={() => handleViewModeChange("burreo")}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === "burreo"
                                    ? "bg-amber-400 text-amber-900 shadow-lg scale-105"
                                    : "text-blue-200 hover:text-white"
                                    }`}
                            >
                                Burreo
                            </button>
                        </div>

                        {/* Export Excel Button */}
                        <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10">
                            <button
                                onClick={() => {
                                    const params = {
                                        ...localFilters,
                                        vessel_id: localFilters.vessel_id || vessel?.id
                                    };
                                    const url = route("dashboard.export", params);
                                    window.location.href = url;
                                }}

                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                            >
                                <span className="hidden md:inline">Exportar</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                        </div>

                        {/* Vessel Selector */}
                        <div className="relative group">
                            <select
                                value={filters.vessel_id || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "vessel_id",
                                        e.target.value,
                                    )
                                }
                                className="appearance-none bg-blue-800/50 hover:bg-blue-700 border border-blue-400/30 text-white font-bold py-2 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all cursor-pointer"
                            >
                                {vessels_list?.map((v: any) => (
                                    <option
                                        key={v.id}
                                        value={v.id}
                                        className="text-gray-900"
                                    >
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none group-hover:text-white transition-colors" />
                        </div>

                        <button
                            onClick={refreshData}
                            className={`p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 ${isRefreshing ? "animate-spin" : ""}`}
                            title="Actualizar datos"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters Row (Light) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date Filter */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center relative group focus-within:ring-2 ring-blue-500/20">
                        <div className="bg-blue-50 p-2 rounded-lg ml-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <input
                            type="date"
                            value={localFilters.date || ""}
                            onChange={(e) =>
                                handleFilterChange("date", e.target.value)
                            }
                            className="w-full border-none text-sm font-bold text-gray-700 focus:ring-0 bg-transparent"
                        />
                    </div>

                    {/* Warehouse Filter */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center relative group">
                        <div className="bg-indigo-50 p-2 rounded-lg ml-1">
                            <Warehouse className="w-4 h-4 text-indigo-600" />
                        </div>
                        <select
                            value={localFilters.warehouse || ""}
                            onChange={(e) =>
                                handleFilterChange("warehouse", e.target.value)
                            }
                            className="w-full border-none text-sm font-bold text-gray-700 focus:ring-0 bg-transparent pr-8"
                        >
                            <option value="">Todos Almacenes</option>
                            {options.warehouses.map((w: string) => (
                                <option key={w} value={w}>
                                    {w}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cubicle Filter */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center relative group">
                        <div className="bg-violet-50 p-2 rounded-lg ml-1">
                            <Box className="w-4 h-4 text-violet-600" />
                        </div>
                        <select
                            value={localFilters.cubicle || ""}
                            onChange={(e) =>
                                handleFilterChange("cubicle", e.target.value)
                            }
                            className="w-full border-none text-sm font-bold text-gray-700 focus:ring-0 bg-transparent pr-8"
                        >
                            <option value="">Todos Cubículos</option>
                            {options.cubicles.map((c: string) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Operator Filter */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center relative group">
                        <div className="bg-cyan-50 p-2 rounded-lg ml-1">
                            <UserIcon className="w-4 h-4 text-cyan-600" />
                        </div>
                        <select
                            value={localFilters.operator || ""}
                            onChange={(e) =>
                                handleFilterChange("operator", e.target.value)
                            }
                            className="w-full border-none text-sm font-bold text-gray-700 focus:ring-0 bg-transparent pr-8 font-mono"
                        >
                            <option value="">Todos Operadores</option>
                            {options.operators.map((o: string) => (
                                <option key={o} value={o}>
                                    {o}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1 & 2: KPIs + Main Chart + Bottom Cards */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-600 flex flex-col items-center justify-center text-center">
                                <h3 className="text-4xl font-black text-gray-800 tracking-tight">
                                    {formatNumber(stats.trips_completed)}
                                </h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mt-1">
                                    Total de Viajes
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-indigo-600 flex flex-col items-center justify-center text-center">
                                <h3 className="text-4xl font-black text-gray-800 tracking-tight">
                                    {formatNumber(stats.units_in_circuit)}
                                </h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mt-1">
                                    Unidades en Circuito
                                </p>
                            </div>
                        </div>

                        {/* Main Chart Area */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 min-h-[500px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    {drillLevel === 0 ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
                                                    Total:{" "}
                                                    {formatMT(
                                                        effectiveTotal / 1000,
                                                    )}
                                                </h2>
                                                {viewMode !== "all" && (
                                                    <span
                                                        className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${viewMode === "scale"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-amber-100 text-amber-700"
                                                            }`}
                                                    >
                                                        {viewMode === "scale"
                                                            ? "Vía Báscula"
                                                            : "Vía Burreo"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                                                Toneladas Métricas {vessel?.operation_type === "Carga" ? "Cargadas" : "Descargadas"}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={
                                                    drillLevel === 3
                                                        ? backToUnits
                                                        : drillLevel === 2
                                                            ? backToWarehouses
                                                            : resetDrill
                                                }
                                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                                            </button>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                                    {drillLevel === 1
                                                        ? `Detalle por Almacén - ${selectedDate}`
                                                        : drillLevel === 2
                                                            ? `Detalle Unidades - ${selectedWarehouse}`
                                                            : `Detalle Viajes - ${selectedUnit?.operator_name}`}
                                                </h2>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                                    {selectedUnit
                                                        ? `Económico: ${selectedUnit.economic_number}`
                                                        : selectedDate}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-gray-400 uppercase block mb-1">
                                        Última actualización
                                    </span>
                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                {drillLevel === 0 ? (
                                    <div className="h-full">
                                        <BarChart
                                            className="h-80"
                                            data={charts.daily_tonnage}
                                            index="date"
                                            categories={categories}
                                            colors={colors}
                                            valueFormatter={(val: any) =>
                                                `${formatMT(val / 1000)} TM`
                                            }
                                            showAnimation={true}
                                            showLegend={false}
                                            yAxisWidth={80}
                                            onValueChange={(v: any) =>
                                                handleBarClick(v)
                                            }
                                        />
                                        <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4 animate-pulse">
                                            💡 Haz clic en una barra para ver
                                            detalles
                                        </p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {drillLoading ? (
                                            <div className="flex items-center justify-center h-80">
                                                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                                            </div>
                                        ) : drillLevel === 1 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                {drillData.map(
                                                    (
                                                        item: any,
                                                        idx: number,
                                                    ) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() =>
                                                                handleWarehouseClick(
                                                                    item.warehouse,
                                                                )
                                                            }
                                                            className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all group relative overflow-hidden"
                                                        >
                                                            <div className="flex justify-between items-center relative z-10">
                                                                <div>
                                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                                        Almacén
                                                                    </h4>
                                                                    <p className="text-2xl font-black text-slate-800">
                                                                        {
                                                                            item.warehouse
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xl font-black text-blue-600">
                                                                        {formatMT(
                                                                            item.total /
                                                                            1000,
                                                                        )}{" "}
                                                                        TM
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                                                                        {vessel?.operation_type === "Carga" ? "Cargado" : "Descargado"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-0 right-0 h-full w-1 bg-blue-500 transform translate-x-full group-hover:translate-x-0 transition-transform"></div>
                                                        </div>
                                                    ),
                                                )}
                                                {drillData.length === 0 && (
                                                    <div className="col-span-2 text-center py-20 text-gray-400 font-bold">
                                                        No hay datos para esta
                                                        fecha
                                                    </div>
                                                )}
                                            </div>
                                        ) : drillLevel === 2 ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="overflow-x-auto mt-4 rounded-2xl border border-gray-100 shadow-inner bg-gray-50/50">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr className="bg-slate-800 text-white">
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Económico
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Conductor
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Placas
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-center">
                                                                    Viajes
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-center">
                                                                    Cubículo
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">
                                                                    Total TM
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {drillData.data?.map(
                                                                (
                                                                    unit: any,
                                                                    idx: number,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                        onClick={() =>
                                                                            handleUnitClick(
                                                                                unit,
                                                                            )
                                                                        }
                                                                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                                                    >
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-black text-blue-700">
                                                                            {
                                                                                unit.economic_number
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                                                                            {
                                                                                unit.operator_name
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                                            {
                                                                                unit.tractor_plate
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-slate-500">
                                                                            <span className="bg-slate-200 px-2 py-0.5 rounded-full">
                                                                                {
                                                                                    unit.trip_count
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 font-bold">
                                                                            {unit.cubicle ||
                                                                                "---"}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-black text-gray-900">
                                                                            {formatMT(
                                                                                unit.total_net_weight /
                                                                                1000
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Level 2 Pagination */}
                                                {drillData.last_page > 1 && (
                                                    <div className="flex justify-center items-center gap-2 mt-2">
                                                        <button
                                                            disabled={
                                                                drillData.current_page ===
                                                                1
                                                            }
                                                            onClick={() =>
                                                                handleWarehouseClick(
                                                                    selectedWarehouse!,
                                                                    drillData.current_page -
                                                                    1,
                                                                )
                                                            }
                                                            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all font-bold text-xs uppercase"
                                                        >
                                                            Anterior
                                                        </button>
                                                        <span className="text-xs font-black text-slate-500">
                                                            Página{" "}
                                                            {
                                                                drillData.current_page
                                                            }{" "}
                                                            de{" "}
                                                            {
                                                                drillData.last_page
                                                            }
                                                        </span>
                                                        <button
                                                            disabled={
                                                                drillData.current_page ===
                                                                drillData.last_page
                                                            }
                                                            onClick={() =>
                                                                handleWarehouseClick(
                                                                    selectedWarehouse!,
                                                                    drillData.current_page +
                                                                    1,
                                                                )
                                                            }
                                                            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all font-bold text-xs uppercase"
                                                        >
                                                            Siguiente
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="overflow-x-auto mt-4 rounded-2xl border border-gray-100 shadow-inner bg-gray-50/50">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead>
                                                            <tr className="bg-blue-900 text-white">
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Folio
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Fecha / Hora
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Placas
                                                                </th>
                                                                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">
                                                                    Cubículo
                                                                </th>
                                                                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">
                                                                    Peso Neto
                                                                    (TM)
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {tripsData.map(
                                                                (
                                                                    trip: any,
                                                                    idx: number,
                                                                ) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="hover:bg-blue-50/50 transition-colors"
                                                                    >
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-700">
                                                                            {
                                                                                trip.folio
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                                            {new Date(
                                                                                trip.weigh_out_at,
                                                                            ).toLocaleString()}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono font-bold">
                                                                            {trip.tractor_plate ||
                                                                                "---"}
                                                                            {trip.trailer_plate ? (
                                                                                <span className="text-gray-400">
                                                                                    {" "}
                                                                                    /{" "}
                                                                                    {
                                                                                        trip.trailer_plate
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-bold">
                                                                            {trip.cubicle ||
                                                                                "---"}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-black text-gray-900">
                                                                            {formatMT(
                                                                                trip.net_weight /
                                                                                1000
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4">
                                                    * Desglose individual de
                                                    vueltas realizadas el día{" "}
                                                    {selectedDate}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Breakdown by Cubicle (Bottom Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ease-in-out">
                            {charts.by_cubicle
                                .slice(0, showAllCubicles ? undefined : 3)
                                .map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="bg-[#1e40af] text-white p-4 rounded-xl shadow-lg relative overflow-hidden group flex flex-col justify-between h-32 animate-in fade-in zoom-in duration-300"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-5 -mt-5 blur-xl group-hover:bg-white/10 transition-colors"></div>
                                        <p className="text-3xl font-black font-mono tracking-tight group-hover:scale-105 transition-transform origin-left mt-2">
                                            {formatTonnes(item.total)} TM
                                        </p>
                                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mt-auto pt-2 border-t border-white/10">
                                            {item.label}
                                        </h4>
                                    </div>
                                ))}

                            {/* Toggle Card */}
                            {charts.by_cubicle.length > 3 && (
                                <button
                                    onClick={() => setShowAllCubicles(!showAllCubicles)}
                                    className="bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-blue-600 p-4 rounded-xl flex flex-col items-center justify-center font-bold text-xs uppercase tracking-widest border border-dashed border-gray-300 hover:border-blue-300 h-32 transition-all duration-300 group"
                                >
                                    <div className="mb-2 p-2 rounded-full bg-gray-200 group-hover:bg-blue-100 transition-colors">
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showAllCubicles ? 'rotate-180' : ''}`} />
                                    </div>
                                    {showAllCubicles ? "Ver menos" : `+ ${charts.by_cubicle.length - 3} más...`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Stats & Visuals */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center text-center h-full relative overflow-hidden">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2 z-10">
                            Porcentaje de {vessel?.operation_type === "Carga" ? "Carga" : "Descarga"}
                        </h3>

                        <div className="text-5xl font-black text-green-600 tracking-tighter mb-4 z-10">
                            {stats.progress_percent || 0}%
                        </div>

                        {/* Ship Graphic Container */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                            <div className="animate-float my-4">
                                <Ship className="w-48 h-48 text-[#1e3a8a] drop-shadow-2xl" strokeWidth={0.8} />
                            </div>
                        </div>

                        {/* Stats Footer: Programmed vs Downloaded vs Pending */}
                        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 z-10 mt-auto">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-base font-black text-slate-900 uppercase tracking-widest">
                                    Progreso
                                </span>
                                <span className="text-base font-black text-slate-900">
                                    {formatNumber(effectiveTotal / 1000)} / {formatNumber(vessel?.programmed_tonnage || 0)} TM
                                </span>
                            </div>
                            {/* Simple Progress Bar */}
                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, stats.progress_percent || 0)}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200 gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">
                                        {vessel?.operation_type === "Carga" ? "Cargado" : "Descargado"}
                                    </p>
                                    <p className="text-2xl font-black text-slate-800 truncate">{formatNumber(effectiveTotal / 1000)} <span className="text-sm font-bold text-slate-500">TM</span></p>
                                </div>
                                <div className="w-px h-10 bg-slate-200 self-center" />
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-0.5">Pendiente</p>
                                    <p className="text-2xl font-black text-blue-700 truncate">
                                        {vessel?.programmed_tonnage ? formatNumber(Math.max(0, parseFloat(vessel.programmed_tonnage) - (effectiveTotal / 1000))) : 0} <span className="text-sm font-bold text-blue-500">TM</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
        </DashboardLayout>
    );
}
