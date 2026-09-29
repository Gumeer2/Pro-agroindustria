<?php

namespace App\Http\Controllers;

use App\Models\LoadingOrder;
use App\Models\WeightTicket;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Exports\DashboardExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Helpers\OperationalTimeHelper;

class DashboardController extends Controller
{
    /**
     * Export the Dashboard to Excel (Premium Report)
     */
    public function export(Request $request)
    {
        // 1. Fetch params
        $vesselId = $request->input('vessel_id');
        $dateStart = $request->input('start_date');
        $dateEnd = $request->input('end_date');
        $warehouse = $request->input('warehouse');
        $operator = $request->input('operator');
        $operationType = $request->input('operation_type', 'all');

        $vesselName = 'Todos';

        // 2. Resolve Vessel
        if (!$vesselId) {
            $vesselsList = \App\Models\Vessel::active()
                ->withCount([
                    'loadingOrders as active_loading_count' => function ($q) {
                        $q->where('status', 'loading');
                    }
                ])
                ->orderByDesc('active_loading_count')->orderByDesc('created_at')->take(1)->get(['id', 'name']);

            $vessel = $vesselsList->first();
            $vesselId = $vessel?->id;
            $vesselName = $vessel?->name ?? '---';
        } else {
            $vessel = \App\Models\Vessel::find($vesselId);
            $vesselName = $vessel ? $vessel->name : 'Desconocido';
        }

        // 3. Build Query
        $baseQuery = LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id');

        if ($vesselId) {
            $baseQuery->where('loading_orders.vessel_id', $vesselId);
        }

        if ($dateStart && $dateEnd) {
            $baseQuery->whereBetween('weight_tickets.weigh_out_at', [
                $dateStart . ' 00:00:00',
                Carbon::parse($dateEnd)->format('Y-m-d') . ' 23:59:59'
            ]);
        } elseif ($request->filled('date')) {
            $range = OperationalTimeHelper::getStandardRange($request->date);
            $baseQuery->whereBetween('weight_tickets.weigh_out_at', $range);
        }

        if ($warehouse) {
            $baseQuery->where('loading_orders.warehouse', $warehouse);
        }
        if ($operator) {
            $baseQuery->where('loading_orders.operator_name', $operator);
        }

        if ($operationType === 'scale') {
            $baseQuery->where(function ($q) {
                $q->where('loading_orders.operation_type', 'scale')->orWhereNull('loading_orders.operation_type');
            });
        } elseif ($operationType === 'burreo') {
            $baseQuery->where('loading_orders.operation_type', 'burreo');
        }

        // 4. Calculate Stats for Export
        // Units in Circuit: Count unique units with activity in the last 4 hours (Resilient Fallback)
        $unitsInCircuit = LoadingOrder::where('vessel_id', $vesselId)
            ->where('created_at', '>', now()->subHours(4));

        if ($operator) {
            $unitsInCircuit->where('operator_name', $operator);
        }
        if ($operationType !== 'all') {
            if ($operationType === 'scale') {
                $unitsInCircuit->where(function ($q) {
                    $q->where('operation_type', 'scale')->orWhereNull('operation_type');
                });
            } else {
                $unitsInCircuit->where('operation_type', $operationType);
            }
        }
        $unitsInCircuit = $unitsInCircuit->distinct()->count('economic_number');

        $stats = [
            'total_tonnage' => (clone $baseQuery)->sum('weight_tickets.net_weight'),
            'trips_completed' => (clone $baseQuery)->count(),
            'units_in_circuit' => $unitsInCircuit,
            'total_scale' => (clone $baseQuery)->where(function ($q) {
                $q->where('loading_orders.operation_type', 'scale')->orWhereNull('loading_orders.operation_type');
            })->sum('weight_tickets.net_weight'),
            'total_burreo' => (clone $baseQuery)->where('loading_orders.operation_type', 'burreo')->sum('weight_tickets.net_weight'),
        ];

        // 5. Calculate Charts Data
        $dailyTonnage = (clone $baseQuery)
            ->select([
                DB::raw(OperationalTimeHelper::getSqlDateStandard('weight_tickets.weigh_out_at') . ' as date'),
                DB::raw('SUM(weight_tickets.net_weight) as total'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type = "burreo" THEN weight_tickets.net_weight ELSE 0 END) as burreo'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type != "burreo" OR loading_orders.operation_type IS NULL THEN weight_tickets.net_weight ELSE 0 END) as scale')
            ])
            ->groupBy('date')->orderBy('date')->get();

        $charts = [
            'daily_tonnage' => $dailyTonnage
        ];

        $filters = [
            'vessel_id' => $vesselId,
            'vessel_name' => $vesselName,
            'start_date' => $dateStart,
            'end_date' => $dateEnd,
            'specific_date' => $request->filled('date') ? $request->date : null,
            'warehouse' => $warehouse,
            'operator' => $operator,
            'operation_type' => $operationType
        ];

        return Excel::download(new DashboardExport($filters, $stats, $charts), 'Reporte_' . str_replace(' ', '', $vesselName) . '_' . Carbon::now()->format('Ymd_His') . '.xlsx');
    }


    public function index(Request $request)
    {
        $vesselId = $request->input('vessel_id');
        $dateStart = $request->input('start_date');
        $dateEnd = $request->input('end_date');

        $warehouse = $request->input('warehouse');
        $cubicle = $request->input('cubicle');
        $operator = $request->input('operator');
        $operationType = $request->input('operation_type', 'all'); // 'all', 'scale', 'burreo'

        // 1. Fetch prioritized vessel list
        // Prioritize vessels with:
        // - shipments in 'loading' status (active descarga)
        // - most recent shipment activity
        // STRICT FILTER: Only show ACTIVE vessels (not departed)
        $vesselsList = \App\Models\Vessel::active()
            ->withCount([
                'loadingOrders as recent_activity_count' => function ($q) {
                    $q->where('created_at', '>', now()->subHours(12));
                }
            ])
            ->orderByDesc('recent_activity_count')
            ->orderByDesc('created_at')
            ->take(15)
            ->get(['id', 'name']);

        // 2. Resolve Vessel (Default to top of prioritized list if not provided)
        if (!$vesselId) {
            $vesselId = $vesselsList->first()?->id;
        }

        $selectedVessel = $vesselId ? \App\Models\Vessel::find($vesselId) : null;

        // Base query linked to the specific vessel and ALWAYS joined with weight_tickets
        // since the dashboard focuses on tonnages and operational dates (weigh_out_at).
        $baseQuery = LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id');

        if ($vesselId) {
            $baseQuery->where('loading_orders.vessel_id', $vesselId);
        }

        // Apply filters
        if ($dateStart && $dateEnd) {
            $baseQuery->whereBetween('weight_tickets.weigh_out_at', [
                $dateStart . ' 00:00:00',
                Carbon::parse($dateEnd)->format('Y-m-d') . ' 23:59:59'
            ]);
        } elseif ($request->filled('date')) {
            $range = OperationalTimeHelper::getStandardRange($request->date);
            $baseQuery->whereBetween('weight_tickets.weigh_out_at', $range);
        }

        if ($warehouse)
            $baseQuery->where('loading_orders.warehouse', $warehouse);
        if ($cubicle)
            $baseQuery->where('loading_orders.cubicle', $cubicle);
        if ($operator)
            $baseQuery->where('loading_orders.operator_name', $operator);

        if ($operationType === 'scale') {
            $baseQuery->where(function ($q) {
                $q->where('loading_orders.operation_type', 'scale')
                    ->orWhereNull('loading_orders.operation_type');
            });
        } elseif ($operationType === 'burreo') {
            $baseQuery->where('loading_orders.operation_type', 'burreo');
        }

        // --- KPIS ---

        // Trips Completed:
        // For Scale: only 'completed' (standard flow)
        // For Burreo: any status that has a weight ticket should count if operation_type is filtered, 
        // but for total charts we stick to completed OR we show everything that has net weight.
        // Let's count anything with status 'completed' OR 'weighing_out' if it's Burreo.
        $tripsCompleted = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere(function ($sq) {
                        $sq->where('loading_orders.operation_type', 'burreo')
                            ->whereIn('loading_orders.status', ['weighing_out', 'loading']);
                    });
            })
            ->count();

        // Units in Circuit: Count unique units with activity in the last 4 hours (Resilient Fallback)
        // This handles cases where AccessLog might not be updated or Burreo units stay active.
        $recentCircuitQuery = LoadingOrder::where('vessel_id', $vesselId)
            ->where('created_at', '>', now()->subHours(4));

        if ($warehouse) {
            $recentCircuitQuery->where('warehouse', $warehouse);
        }
        if ($operator) {
            $recentCircuitQuery->where('operator_name', $operator);
        }
        if ($operationType !== 'all') {
            if ($operationType === 'scale') {
                $recentCircuitQuery->where(function ($q) {
                    $q->where('operation_type', 'scale')->orWhereNull('operation_type');
                });
            } else {
                $recentCircuitQuery->where('operation_type', $operationType);
            }
        }

        $unitsInCircuit = $recentCircuitQuery->distinct()->count('economic_number');

        $unitsInCircuit = (int) $unitsInCircuit;
        // $unitsDischarging removed as per request

        // Total Tonnes (Net Weight from Tickets in Kg)
        $totalTonnage = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            })
            ->sum('weight_tickets.net_weight');

        // Stats for the toggle buttons (always independent of the global operation_type filter)
        $totalScale = (clone $baseQuery)
            ->where('loading_orders.status', 'completed')
            ->where(function ($q) {
                $q->where('loading_orders.operation_type', 'scale')
                    ->orWhereNull('loading_orders.operation_type');
            })
            ->sum('weight_tickets.net_weight');

        $totalBurreo = (clone $baseQuery)
            ->where('loading_orders.operation_type', 'burreo')
            ->sum('weight_tickets.net_weight');

        $totalTonnage = (float) $totalTonnage;
        $totalScale = (float) $totalScale;
        $totalBurreo = (float) $totalBurreo;

        // --- CHARTS ---

        // 1. Daily Tonnage (Split keys)
        $dailyTonnage = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            })
            ->select([
                DB::raw('COALESCE(' . OperationalTimeHelper::getSqlDateStandard('weight_tickets.weigh_out_at') . ', ' . OperationalTimeHelper::getSqlDateStandard('loading_orders.entry_at') . ') as date'),
                DB::raw('SUM(weight_tickets.net_weight) as total'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type = "burreo" THEN weight_tickets.net_weight ELSE 0 END) as burreo'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type != "burreo" OR loading_orders.operation_type IS NULL THEN weight_tickets.net_weight ELSE 0 END) as scale')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'total' => (float) $item->total,
                    'burreo' => (float) $item->burreo,
                    'scale' => (float) $item->scale,
                ];
            });

        // 2. Storage Breakdown (By Warehouse/Cubicle)
        $subQuery = (clone $baseQuery)
            ->leftJoin('vessels', 'loading_orders.vessel_id', '=', 'vessels.id')
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            })
            ->selectRaw('
                CASE 
                    WHEN vessels.has_chief_foreman = 1 AND vessels.is_external_warehouse = 1 
                    THEN COALESCE(NULLIF(loading_orders.reference, "N/A"), COALESCE(loading_orders.warehouse, "ALMACÉN CLIENTE"))
                    ELSE CONCAT(COALESCE(loading_orders.warehouse, "Almacén ??"), " - ", COALESCE(loading_orders.cubicle, "General"))
                END as label, 
                weight_tickets.net_weight
            ')
            ->whereNotNull('loading_orders.warehouse');

        $byCubicle = DB::table(DB::raw("({$subQuery->toSql()}) as nested"))
            ->mergeBindings($subQuery->getQuery())
            ->selectRaw('label, SUM(net_weight) as total')
            ->groupBy('label')
            ->orderByDesc('total')
            ->get();

        // 3. Operator Breakdown
        $byOperator = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            })
            ->selectRaw('loading_orders.operator_name as label, SUM(weight_tickets.net_weight) as total')
            ->groupBy('loading_orders.operator_name')
            ->orderByDesc('total')
            ->get();


        // Options for Selectors
        // Send the prioritized list to the frontend
        $vessels = $vesselsList;

        // Filter options based on the CURRENT vessel context
        $filterOptions = [
            'warehouses' => LoadingOrder::where('vessel_id', $vesselId)->whereNotNull('warehouse')->distinct()->pluck('warehouse'),
            'cubicles' => LoadingOrder::where('vessel_id', $vesselId)->whereNotNull('cubicle')->distinct()->pluck('cubicle'),
            'operators' => LoadingOrder::where('vessel_id', $vesselId)->whereNotNull('operator_name')->distinct()->pluck('operator_name'),
        ];

        return Inertia::render('Dashboard', [
            'vessel' => $selectedVessel,
            'vessels_list' => $vessels,
            'stats' => [
                'trips_completed' => $tripsCompleted,
                'units_in_circuit' => $unitsInCircuit,
                // 'units_discharging' => $unitsDischarging, // Removed
                'total_tonnage' => $totalTonnage,
                'total_scale' => $totalScale,
                'total_burreo' => $totalBurreo,
                // Fix: programmed_tonnage is in MT, totalTonnage is in KG. Convert KG to MT for percentage.
                'progress_percent' => ($selectedVessel && $selectedVessel->programmed_tonnage > 0)
                    ? round((($totalTonnage / 1000) / $selectedVessel->programmed_tonnage) * 100, 1)
                    : 0
            ],
            'charts' => [
                'daily_tonnage' => $dailyTonnage,
                'by_cubicle' => $byCubicle,
                'by_operator' => $byOperator
            ],
            'filters' => $request->all(),
            'options' => $filterOptions
        ]);
    }

    /**
     * Drill-down Level 1: Get tonnage by warehouse for a specific date
     */
    public function drillDownWarehouses(Request $request)
    {
        $vesselId = $request->input('vessel_id');
        $date = $request->input('date');
        $operationType = $request->input('operation_type', 'all');

        $query = LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
            ->where('loading_orders.vessel_id', $vesselId)
            ->where(function ($q) use ($date) {
                $range = OperationalTimeHelper::getStandardRange($date);
                $q->whereBetween('weight_tickets.weigh_out_at', $range)
                    ->orWhere(function ($sq) use ($range) {
                        $sq->whereNull('weight_tickets.weigh_out_at')
                            ->whereBetween('loading_orders.entry_at', $range);
                    });
            });

        if ($operationType === 'scale') {
            $query->whereIn('loading_orders.operation_type', ['scale', null])
                ->where('loading_orders.status', 'completed');
        } elseif ($operationType === 'burreo') {
            $query->where('loading_orders.operation_type', 'burreo');
        } else {
            $query->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            });
        }

        $subQuery = $query->leftJoin('vessels', 'loading_orders.vessel_id', '=', 'vessels.id')
            ->selectRaw('
                CASE 
                    WHEN vessels.has_chief_foreman = 1 AND vessels.is_external_warehouse = 1 
                    THEN COALESCE(NULLIF(loading_orders.reference, "N/A"), COALESCE(loading_orders.warehouse, "ALMACÉN CLIENTE"))
                    ELSE COALESCE(loading_orders.warehouse, "S/A")
                END as warehouse_label, 
                weight_tickets.net_weight
            ');

        $data = DB::table(DB::raw("({$subQuery->toSql()}) as nested"))
            ->mergeBindings($subQuery->getQuery())
            ->selectRaw('warehouse_label as warehouse, SUM(net_weight) as total')
            ->groupBy('warehouse_label')
            ->orderByDesc('total')
            ->get();


        return response()->json($data);
    }

    /**
     * Drill-down Level 2: Get aggregated units for a warehouse/date
     */
    public function drillDownUnits(Request $request)
    {
        try {
            $vesselId = $request->input('vessel_id');
            $date = $request->input('date');
            $warehouse = $request->input('warehouse');
            $operationType = $request->input('operation_type', 'all');

            $query = LoadingOrder::query()
                ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
                ->leftJoin('vehicles', 'loading_orders.vehicle_id', '=', 'vehicles.id')
                ->where('loading_orders.vessel_id', $vesselId)
                ->where(function ($q) use ($date) {
                    $range = OperationalTimeHelper::getStandardRange($date);
                    $q->whereBetween('weight_tickets.weigh_out_at', $range)
                        ->orWhere(function ($sq) use ($range) {
                            $sq->whereNull('weight_tickets.weigh_out_at')
                                ->whereBetween('loading_orders.entry_at', $range);
                        });
                });

            // Robust Warehouse Filter
            if ($warehouse === 'S/A' || $warehouse === 'Sin Asignar' || empty($warehouse)) {
                $query->where(function ($q) {
                    $q->whereNull('loading_orders.warehouse')
                        ->orWhere('loading_orders.warehouse', '')
                        ->orWhere('loading_orders.warehouse', 'S/A');
                });
            } else {
                // If it's a special vessel, the 'warehouse' parameter might actually be a 'reference' name
                $query->where(function ($q) use ($warehouse) {
                    $q->where('loading_orders.warehouse', $warehouse)
                        ->orWhere('loading_orders.reference', $warehouse);
                });
            }


            if ($operationType === 'scale') {
                $query->whereIn('loading_orders.operation_type', ['scale', null])
                    ->where('loading_orders.status', 'completed');
            } elseif ($operationType === 'burreo') {
                $query->where('loading_orders.operation_type', 'burreo');
            } else {
                $query->where(function ($q) {
                    $q->where('loading_orders.status', 'completed')
                        ->orWhere('loading_orders.operation_type', 'burreo');
                });
            }

            // Aggregate by Unit (Operator + Economic Number)
            // Use subquery to ensure the "warehouse" label is correctly filtered if it's a reference
            $subQuery = $query->leftJoin('vessels', 'loading_orders.vessel_id', '=', 'vessels.id')
                ->selectRaw("
                    loading_orders.operator_name,
                    COALESCE(NULLIF(loading_orders.economic_number, ''), 'S/N') as economic_number,
                    loading_orders.tractor_plate as snap_tractor_plate,
                    vehicles.plate_number as veh_tractor_plate,
                    loading_orders.cubicle as snap_cubicle,
                    loading_orders.reference as snap_reference,
                    vessels.has_chief_foreman,
                    vessels.is_external_warehouse,
                    weight_tickets.net_weight
                ");

            $data = DB::table(DB::raw("({$subQuery->toSql()}) as nested"))
                ->mergeBindings($subQuery->getQuery())
                ->selectRaw("
                    operator_name,
                    economic_number,
                    COALESCE(snap_tractor_plate, veh_tractor_plate, '---') as tractor_plate,
                    CASE 
                        WHEN has_chief_foreman = 1 AND is_external_warehouse = 1 
                        THEN COALESCE(NULLIF(snap_reference, 'N/A'), 'ALMACÉN CLIENTE')
                        ELSE snap_cubicle
                    END as cubicle,
                    SUM(net_weight) as total_net_weight,
                    COUNT(*) as trip_count
                ")
                ->groupBy('operator_name', 'economic_number')
                ->orderByDesc('total_net_weight')
                ->get();


            // Manual Pagination
            $page = (int) $request->input('page', 1);
            $perPage = 10;
            $total = $data->count();
            $items = $data->skip(($page - 1) * $perPage)->take($perPage)->values();

            return response()->json([
                'current_page' => $page,
                'data' => $items,
                'total' => $total,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage)
            ]);

        } catch (Exception $e) {
            Log::error('DrillDownUnits Critical Error: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 200);
        }
    }

    /**
     * Drill-down Level 3: Get individual trips for a specific unit/warehouse/date
     */
    /**
     * Drill-down Level 3: Get individual trips for a specific unit/warehouse/date
     */
    public function drillDownUnitTrips(Request $request)
    {
        try {
            // Level 3: Trips for a specific Unit (Unit ID or Plate/Economic)
            // We receive 'unit_id' which is likely 'economic_number' from Level 2 grouping.
            // FRONTEND FIX: The frontend sends 'economic_number', not 'unit_id'.
            $unitId = $request->input('unit_id') ?? $request->input('economic_number');
            $operator = $request->input('operator');
            $vesselId = $request->input('vessel_id');

            $query = LoadingOrder::query()
                ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
                ->leftJoin('vehicles', 'loading_orders.vehicle_id', '=', 'vehicles.id') // Fallback for plates
                ->where('weight_tickets.weighing_status', 'completed') // Only completed trips
                ->where('loading_orders.vessel_id', $vesselId); // Filter by vessel_id

            // Filter by Unit (Economic Number)
            if ($unitId && $unitId !== 'S/N') {
                $query->where('loading_orders.economic_number', $unitId);
            } else {
                // Handle 'S/N' case for units without economic_number
                $query->where(function ($q) {
                    $q->whereNull('loading_orders.economic_number')->orWhere('loading_orders.economic_number', '');
                });
            }

            if ($operator) {
                $query->where('loading_orders.operator_name', $operator);
            }

            // Warehouse Filter
            $warehouse = $request->input('warehouse');
            if ($warehouse) {
                if ($warehouse === 'S/A' || $warehouse === 'Sin Asignar') {
                    $query->where(function ($q) {
                        $q->whereNull('loading_orders.warehouse')
                            ->orWhere('loading_orders.warehouse', '')
                            ->orWhere('loading_orders.warehouse', 'S/A');
                    });
                } else {
                    // Support both Warehouse and Reference for Special Vessels
                    $query->where(function ($q) use ($warehouse) {
                        $q->where('loading_orders.warehouse', $warehouse)
                            ->orWhere('loading_orders.reference', $warehouse);
                    });
                }
            }


            // Date Filter (Global)
            if ($request->has('date') && $request->date) {
                $range = OperationalTimeHelper::getStandardRange($request->date);
                $query->whereBetween('weight_tickets.weigh_out_at', $range);
            }

            // Operation filters
            $operationType = $request->input('operation_type', 'all');
            if ($operationType === 'scale') {
                $query->whereIn('loading_orders.operation_type', ['scale', null])
                    ->where('loading_orders.status', 'completed');
            } elseif ($operationType === 'burreo') {
                $query->where('loading_orders.operation_type', 'burreo');
            } else {
                $query->where(function ($q) {
                    $q->where('loading_orders.status', 'completed')
                        ->orWhere('loading_orders.operation_type', 'burreo');
                });
            }

            $subQuery = $query->leftJoin('vessels', 'loading_orders.vessel_id', '=', 'vessels.id')
                ->select([
                    'loading_orders.id',
                    'loading_orders.folio',
                    'loading_orders.cubicle as snap_cubicle',
                    'loading_orders.reference as snap_reference',
                    'vessels.has_chief_foreman',
                    'vessels.is_external_warehouse',
                    'weight_tickets.net_weight',
                    'weight_tickets.weigh_out_at',
                    DB::raw('COALESCE(loading_orders.tractor_plate, vehicles.plate_number, "---") as tractor_plate'),
                    'loading_orders.trailer_plate'
                ]);

            $data = DB::table(DB::raw("({$subQuery->toSql()}) as nested"))
                ->mergeBindings($subQuery->getQuery())
                ->select([
                    'id',
                    'folio',
                    DB::raw('
                        CASE 
                            WHEN has_chief_foreman = 1 AND is_external_warehouse = 1 
                            THEN COALESCE(NULLIF(snap_reference, "N/A"), "ALMACÉN CLIENTE")
                            ELSE snap_cubicle
                        END as cubicle
                    '),
                    'net_weight',
                    'weigh_out_at',
                    'tractor_plate',
                    'trailer_plate'
                ])
                ->orderBy('weigh_out_at', 'asc')
                ->get();


            return response()->json($data);
        } catch (Exception $e) {
            Log::error('DrillDownUnitTrips Critical Error: ' . $e->getMessage());
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 200);
        }
    }
}
