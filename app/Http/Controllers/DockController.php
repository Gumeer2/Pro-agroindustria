<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrder;
use App\Models\LoadingOrder;
use App\Models\Vessel;
use App\Models\VesselOperator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Helpers\OperationalTimeHelper;
use App\Exports\VesselStatusExport;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class DockController extends Controller
{
    public function index(Request $request)
    {
        // Strict filter: Only show Blue Commander and Nordorinoco
        $query = Vessel::with('product')
            ->orderBy('created_at', 'desc');

        if ($request->has('start_date') && $request->has('end_date') && $request->start_date && $request->end_date) {
            $query->whereBetween('docking_date', [$request->start_date, $request->end_date]);
        }

        return Inertia::render('Dock/Index', [
            'operators' => VesselOperator::orderBy('operator_name')->get(),
            'vessels' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function createVessel()
    {
        return Inertia::render('Dock/CreateVessel', [
            'products' => \App\Models\Product::all(),
            'clients' => \App\Models\Client::all(),
        ]);
    }

    public function storeVessel(Request $request)
    {
        $rules = [
            'vessel_type' => 'required|string',
            'name' => 'required|string|max:255',
            'eta' => 'required|date',
            'external_dock_arrival_date' => 'nullable|date',
            'external_dock_arrival_time' => 'nullable',
            'external_dock_departure_date' => 'nullable|date',
            'external_dock_departure_time' => 'nullable',
            'docking_date' => 'nullable|date',
            'docking_time' => 'nullable',
            'operation_type' => 'required|string',
            'dock' => 'nullable|string',
            'stay_days' => 'nullable|numeric',
            'etc' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'observations' => 'nullable|string',
            'length' => 'nullable|numeric|min:0',
            'beam' => 'nullable|numeric|min:0',
            'draft' => 'nullable|numeric|min:0',
            'nationality' => 'nullable|string|max:255',
            'imo_number' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'importer' => 'nullable|string|max:255',
            'consignee_agency' => 'nullable|string|max:255',
            'customs_agency' => 'nullable|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'apt_operation_type' => 'nullable|string|in:scale,burreo',
            'product_id' => 'required_if:operation_type,Descarga,Carga|nullable|exists:products,id',
            'programmed_tonnage' => 'required_if:operation_type,Descarga,Carga|nullable|numeric|min:0',
            'destination_port' => 'required_if:operation_type,Carga|nullable|string|max:255',
            'origin_port' => 'required_if:operation_type,Descarga|nullable|string|max:255',
            'loading_port' => 'required_if:operation_type,Descarga|nullable|string|max:255',
            'holds' => 'nullable|array',
            'has_chief_foreman' => 'nullable|boolean',
            'is_external_warehouse' => 'nullable|boolean',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'required_if' => 'El campo :attribute es obligatorio para este tipo de operación.',
            'exists' => 'El :attribute seleccionado no es válido.',
            'numeric' => 'El campo :attribute debe ser un número.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
        ];

        $attributes = [
            'name' => 'nombre del buque',
            'client_id' => 'cliente',
            'product_id' => 'producto',
            'operation_type' => 'tipo de operación',
            'origin_port' => 'puerto de origen',
            'loading_port' => 'puerto de carga',
            'destination_port' => 'puerto de destino',
            'programmed_tonnage' => 'tonelaje programado',
            'eta' => 'ETA (Fecha y Hora)',
            'dock' => 'muelle',
        ];

        $validated = $request->validate($rules, $messages, $attributes);

        // Fix for legacy service_type column if migration didn't run
        $validated['service_type'] = $validated['operation_type'];

        // Default stay_days if not provided
        if (!isset($validated['stay_days']) || $validated['stay_days'] === null || $validated['stay_days'] === '') {
            $validated['stay_days'] = 0;
        }

        // Parsing dates
        if ($request->filled('docking_date')) {
            try {
                $timeString = $request->docking_time ?? '00:00:00';
                $etb = \Carbon\Carbon::parse($request->docking_date . ' ' . $timeString);
                $validated['berthal_datetime'] = $etb;
                $validated['etb'] = $etb;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Error parsing docking date/time: ' . $e->getMessage());
            }
        }

        // Validation for Dock Occupancy (Time Overlap)
        if (!empty($validated['dock']) && !empty($validated['berthal_datetime'])) {
            $newStart = $validated['berthal_datetime'];
            $newEnd = $validated['departure_date'] ?? null;

            $existingCollision = Vessel::where('dock', $validated['dock'])
                ->whereNotNull('berthal_datetime')
                ->where(function ($query) use ($newStart, $newEnd) {
                    // Condition 1: Existing Start < New End (if New End defined)
                    if ($newEnd) {
                        $query->where('berthal_datetime', '<', $newEnd);
                    }
                    // Condition 2: Existing End > New Start (or Infinite End)
                    $query->where(function ($q) use ($newStart) {
                        $q->whereNull('departure_date')
                            ->orWhere('departure_date', '>', $newStart);
                    });
                })
                ->first();

            if ($existingCollision) {
                return back()->withErrors([
                    'dock' => "El muelle {$validated['dock']} está ocupado por el buque {$existingCollision->name} en las fechas seleccionadas."
                ])->withInput();
            }
        }

        if (in_array($request->operation_type, ['Carga', 'Descarga']) && !empty($request->holds)) {
            $totalHoldTonnage = collect($request->holds)->sum(function ($hold) {
                return (float) ($hold['tonnage'] ?? 0);
            });

            if (abs($totalHoldTonnage - (float) ($request->programmed_tonnage ?? 0)) > 0.1) {
                return back()->withErrors([
                    'error' => "La suma de las toneladas de las bodegas ($totalHoldTonnage TM) debe ser igual al tonelaje programado ({$request->programmed_tonnage} TM)."
                ])->withInput();
            }
        }

        try {
            Vessel::create($validated);
            return redirect()->route('dock.index')->with('success', 'Barco registrado correctamente.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Vessel Create Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al guardar barco: ' . $e->getMessage()])->withInput();
        }
    }

    public function editVessel($id)
    {
        $vessel = Vessel::findOrFail($id);
        return Inertia::render('Dock/EditVessel', [
            'vessel' => $vessel,
            'products' => \App\Models\Product::all(),
            'clients' => \App\Models\Client::all(),
        ]);
    }

    public function updateVessel(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);

        $rules = [
            'vessel_type' => 'required|string',
            'name' => 'required|string|max:255',
            'eta' => 'required|date',
            'external_dock_arrival_date' => 'nullable|date',
            'external_dock_arrival_time' => 'nullable',
            'external_dock_departure_date' => 'nullable|date',
            'external_dock_departure_time' => 'nullable',
            'docking_date' => 'nullable|date',
            'docking_time' => 'nullable',
            'operation_type' => 'required|string',
            'dock' => 'nullable|string',
            'stay_days' => 'nullable|numeric',
            'etc' => 'nullable|date',
            'departure_date' => 'nullable|date',
            'observations' => 'nullable|string',
            'length' => 'nullable|numeric|min:0',
            'beam' => 'nullable|numeric|min:0',
            'draft' => 'nullable|numeric|min:0',
            'nationality' => 'nullable|string|max:255',
            'imo_number' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'importer' => 'nullable|string|max:255',
            'consignee_agency' => 'nullable|string|max:255',
            'customs_agency' => 'nullable|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'apt_operation_type' => 'nullable|string|in:scale,burreo',
            'product_id' => 'required_if:operation_type,Descarga,Carga|nullable|exists:products,id',
            'programmed_tonnage' => 'required_if:operation_type,Descarga,Carga|nullable|numeric|min:0',
            'destination_port' => 'required_if:operation_type,Carga|nullable|string|max:255',
            'origin_port' => 'required_if:operation_type,Descarga|nullable|string|max:255',
            'loading_port' => 'required_if:operation_type,Descarga|nullable|string|max:255',
            'holds' => 'nullable|array',
            'has_chief_foreman' => 'nullable|boolean',
            'is_external_warehouse' => 'nullable|boolean',
        ];

        $messages = [
            'required' => 'El campo :attribute es obligatorio.',
            'required_if' => 'El campo :attribute es obligatorio para este tipo de operación.',
            'exists' => 'El :attribute seleccionado no es válido.',
            'numeric' => 'El campo :attribute debe ser un número.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
        ];

        $attributes = [
            'name' => 'nombre del buque',
            'client_id' => 'cliente',
            'product_id' => 'producto',
            'operation_type' => 'tipo de operación',
            'origin_port' => 'puerto de origen',
            'loading_port' => 'puerto de carga',
            'destination_port' => 'puerto de destino',
            'programmed_tonnage' => 'tonelaje programado',
            'eta' => 'ETA (Fecha y Hora)',
            'dock' => 'muelle',
        ];

        $validated = $request->validate($rules, $messages, $attributes);

        // Fix for legacy service_type column if migration didn't run
        $validated['service_type'] = $validated['operation_type'];

        // Create valid ETB Timestamp using Carbon to handle time formats
        $etb = null;
        if ($request->filled('docking_date')) {
            $timeString = $request->docking_time ?? '00:00:00';
            try {
                // Combine date and time, let Carbon parse whatever format comes in (e.g. 1:00 p.m., 13:00)
                $etb = \Carbon\Carbon::parse($request->docking_date . ' ' . $timeString);
            } catch (\Exception $e) {
                // Fallback if parsing fails
                $etb = \Carbon\Carbon::parse($request->docking_date);
            }
        }
        $validated['etb'] = $etb;
        $validated['berthal_datetime'] = $etb;

        if (isset($validated['stay_days']) && $validated['stay_days'] === null) {
            $validated['stay_days'] = 0;
        }

        // Validation for Dock Occupancy (Time Overlap)
        if (!empty($validated['dock']) && !empty($validated['berthal_datetime'])) {
            $newStart = $validated['berthal_datetime'];
            $newEnd = $validated['departure_date'] ?? null;

            $existingCollision = Vessel::where('dock', $validated['dock'])
                ->whereNotNull('berthal_datetime')
                ->where('id', '!=', $id) // Exclude self
                ->where(function ($query) use ($newStart, $newEnd) {
                    // Condition 1: Existing Start < New End (if New End defined)
                    if ($newEnd) {
                        $query->where('berthal_datetime', '<', $newEnd);
                    }
                    // Condition 2: Existing End > New Start (or Infinite End)
                    $query->where(function ($q) use ($newStart) {
                        $q->whereNull('departure_date')
                            ->orWhere('departure_date', '>', $newStart);
                    });
                })
                ->first();

            if ($existingCollision) {
                return back()->withErrors([
                    'dock' => "El muelle {$validated['dock']} está ocupado por el buque {$existingCollision->name} en las fechas seleccionadas. Ajuste las fechas o asigne una salida al buque activo."
                ])->withInput();
            }
        }
        if (in_array($request->operation_type, ['Carga', 'Descarga']) && !empty($request->holds)) {
            $totalHoldTonnage = collect($request->holds)->sum(function ($hold) {
                return (float) ($hold['tonnage'] ?? 0);
            });

            if (abs($totalHoldTonnage - (float) ($request->programmed_tonnage ?? 0)) > 0.1) {
                return back()->withErrors([
                    'error' => "La suma de las toneladas de las bodegas ($totalHoldTonnage TM) debe ser igual al tonelaje programado ({$request->programmed_tonnage} TM)."
                ])->withInput();
            }
        }

        $vessel->update($validated);

        return redirect()->route('dock.index')->with('success', 'Buque actualizado exitosamente.');
    }

    public function markArrival(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);
        $type = $request->input('type', 'internal'); // internal or external
        $now = now();

        if ($type === 'external') {
            // Validation: Prevent if already has arrival or departure
            if ($vessel->external_dock_arrival_date || $vessel->external_dock_departure_date) {
                return back()->with('error', 'Este buque ya tiene registros de entrada o salida en el Muelle Externo.');
            }

            $vessel->update([
                'external_dock_arrival_date' => $now->toDateString(),
                'external_dock_arrival_time' => $now,
            ]);
        } else {
            // Validation: Prevent if the assigned dock is already occupied
            $dock = $vessel->dock;
            if (!$dock || $dock === 'Por Asignar') {
                return back()->with('error', 'El buque debe tener un muelle asignado (ECO/WHISKY) para marcar llegada.');
            }

            $isOccupied = Vessel::where('dock', $dock)
                ->whereNotNull('berthal_datetime')
                ->where('berthal_datetime', '<=', $now)
                ->where(function ($query) use ($now) {
                    $query->whereNull('departure_date')
                        ->orWhere('departure_date', '>', $now);
                })
                ->where('id', '!=', $vessel->id)
                ->exists();

            if ($isOccupied) {
                return back()->with('error', "El Muelle $dock ya se encuentra ocupado por otro buque.");
            }

            $vessel->update([
                'berthal_datetime' => $now,
            ]);
        }

        return back()->with('success', 'Llegada marcada exitosamente.');
    }

    public function markDeparture(Request $request, $id)
    {
        $vessel = Vessel::findOrFail($id);
        $type = $request->input('type', 'internal'); // internal or external

        if ($type === 'external') {
            $vessel->update([
                'external_dock_departure_date' => now()->toDateString(),
                'external_dock_departure_time' => now(),
            ]);
        } else {
            $vessel->update([
                'departure_date' => now(),
            ]);
        }

        return back()->with('success', 'Salida marcada exitosamente.');
    }

    public function status()
    {
        $now = now(); // Use Carbon::now()

        // Active Vessels (Atracados y sin zarpar) - Logic: ETB passed and no departure
        $activeQuery = Vessel::whereNotNull('berthal_datetime')
            ->where('berthal_datetime', '<=', $now)
            ->where(function ($query) use ($now) {
                $query->whereNull('departure_date')
                    ->orWhere('departure_date', '>', $now);
            });

        $activeVessels = $activeQuery->get();

        // Categorize by dock
        $eco = $activeVessels->firstWhere('dock', 'ECO');
        $whisky = $activeVessels->firstWhere('dock', 'WHISKY');

        // External Dock Vessel (Has arrival but no departure yet, or departure in future)
        // And has not yet arrived at Proagro (ETB is null or in future)
        $external = Vessel::whereNotNull('external_dock_arrival_date')
            ->where(function ($query) use ($now) {
                $query->whereNull('external_dock_departure_date')
                    ->orWhere(function ($q) use ($now) {
                        $q->where('external_dock_departure_date', '>', $now->toDateString())
                            ->orWhere(function ($sub) use ($now) {
                                $sub->where('external_dock_departure_date', $now->toDateString())
                                    ->where('external_dock_departure_time', '>', $now->toTimeString());
                            });
                    });
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('berthal_datetime')
                    ->orWhere('berthal_datetime', '>', $now);
            })
            ->first();

        // Arrivals (No atracados aún, o fondeados) - Logic: No ETB OR ETB is in future
        $arrivals = Vessel::with('product') // Eager load
            ->whereNull('departure_date')
            ->where(function ($query) use ($now) {
                $query->whereNull('berthal_datetime')
                    ->orWhere('berthal_datetime', '>', $now);
            })
            ->orderBy('eta', 'asc')
            ->get()
            ->map(function ($vessel) {
                return [
                    'id' => $vessel->id,
                    'name' => $vessel->name,
                    'type' => $vessel->vessel_type ?? 'M/V',
                    'eta' => $vessel->is_anchored ? 'Fondeado' : ($vessel->eta ? (is_string($vessel->eta) ? date('d/m/Y', strtotime($vessel->eta)) : $vessel->eta->format('d/m/Y')) : 'Pendiente'),
                    'etb' => $vessel->etb ? (is_string($vessel->etb) ? date('d/m/Y H:i', strtotime($vessel->etb)) : $vessel->etb->format('d/m/Y H:i')) : '-',
                    'operation_type' => $vessel->operation_type,
                    'dock' => $vessel->dock ?? 'Por Asignar',
                    'est_stay' => $vessel->stay_days,
                    'product' => $vessel->product?->name, // Nullsafe
                    'is_anchored' => (bool) $vessel->is_anchored
                ];
            });

        // Format Active Vessels
        $formatVessel = function ($v) use ($now) {
            if (!$v)
                return ['name' => '-'];

            // 1. Fetch Tonnage using Dashboard Logic (Source of Truth)
            // Logic: SUM net_weight where status = 'completed' OR type = 'burreo'
            $totalTonnageKg = LoadingOrder::join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
                ->where('loading_orders.vessel_id', $v->id)
                ->where(function ($q) {
                    $q->where('loading_orders.status', 'completed')
                        ->orWhere('loading_orders.operation_type', 'burreo');
                })
                ->sum('weight_tickets.net_weight');

            $totalProcessedMt = (float) ($totalTonnageKg / 1000);

            // 2. Fetch Trip-based counts (source for hold breakdown and counts)
            $tripStats = \App\Models\VesselOperatorTrip::where('vessel_operator_trips.vessel_id', $v->id)
                ->leftJoin('loading_orders', 'vessel_operator_trips.id', '=', 'loading_orders.vessel_operator_trip_id')
                ->leftJoin('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
                ->where('vessel_operator_trips.status', '!=', 'cancelled')
                ->selectRaw('
                    SUM(COALESCE(weight_tickets.net_weight / 1000, vessel_operator_trips.weight, 0)) as total_mt, 
                    COUNT(DISTINCT vessel_operator_trips.id) as trip_count, 
                    vessel_operator_trips.hold_number
                ')
                ->groupBy('vessel_operator_trips.hold_number')
                ->get();
            $programmedMt = $v->programmed_tonnage ?: 0;

            // Progress calculation varies by operation type
            $isDischarge = strtolower($v->operation_type) === 'descarga';

            if ($isDischarge) {
                // For Discharge:
                // - progress: % of what has been removed
                // - pending_mt: what still needs to be removed (remaining on board)
                // - processed_mt: what has already been discharged
                $progressPercent = $programmedMt > 0
                    ? min(100, round(($totalProcessedMt / $programmedMt) * 100, 1))
                    : 0;
                $onBoardMt = max(0, $programmedMt - $totalProcessedMt);
                $dischargedMt = $totalProcessedMt;
            } else {
                // For Loading:
                // - progress: % of what has been loaded onto the ship
                // - pending_mt: what still needs to be loaded
                // - processed_mt: what is already on the ship
                $progressPercent = $programmedMt > 0
                    ? min(100, round(($totalProcessedMt / $programmedMt) * 100, 1))
                    : 0;
                $onBoardMt = $totalProcessedMt;
                $dischargedMt = 0; // Not applicable
            }

            $pendingMt = $isDischarge ? $onBoardMt : max(0, $programmedMt - $totalProcessedMt);

            // Prepare Hatch Breakdown
            $hatches = [];
            if ($v->holds && is_array($v->holds)) {
                foreach ($v->holds as $hIndex => $holdData) {
                    $hNumber = $holdData['hold_number'] ?? ($hIndex + 1);
                    $hProgrammedMt = (float) ($holdData['tonnage'] ?? 0);
                    $hStat = $tripStats->where('hold_number', $hNumber)->first();
                    $hWeightMt = $hStat->total_mt ?? 0;
                    $hTripCount = (int) ($hStat->trip_count ?? 0);

                    if ($isDischarge) {
                        $processedHatchMt = $hWeightMt;
                        $pendingHatchMt = max(0, $hProgrammedMt - $hWeightMt);
                        $hatchPercent = $hProgrammedMt > 0 ? round(($pendingHatchMt / $hProgrammedMt) * 100, 1) : 0;
                        $hatchDisplayWeight = round($pendingHatchMt, 2);
                    } else {
                        $processedHatchMt = $hWeightMt;
                        $pendingHatchMt = max(0, $hProgrammedMt - $hWeightMt);
                        $hatchPercent = $hProgrammedMt > 0 ? round(($hWeightMt / $hProgrammedMt) * 100, 1) : 0;
                        $hatchDisplayWeight = round($hWeightMt, 2);
                    }

                    $hatches[] = [
                        'id' => $hNumber,
                        'name' => $holdData['hold_number_label'] ?? "Bodega $hNumber",
                        'total_mt' => round($hProgrammedMt, 2),
                        'processed_mt' => round($processedHatchMt, 2),
                        'pending_mt' => round($pendingHatchMt, 2),
                        'loaded_mt' => $hatchDisplayWeight,
                        'percent' => $hatchPercent,
                        'trip_count' => $hTripCount
                    ];
                }
            }

            // Dynamic calculation: Day 1 starts on arrival date
            $actualStay = 0;
            $arrivalDate = $v->berthal_datetime ?? $v->external_dock_arrival_date;
            if ($arrivalDate && is_object($arrivalDate)) {
                $actualStay = (int) $arrivalDate->diffInDays($now) + 1;
            }

            // 3. Detailed Trip Statistics (For Modal breakdown)
            $tripsData = \App\Models\LoadingOrder::where('vessel_id', $v->id)
                ->where('status', 'completed')
                ->selectRaw("
                    SUM(CASE WHEN operation_type = 'burreo' THEN 1 ELSE 0 END) as burreo_trips,
                    SUM(CASE WHEN operation_type != 'burreo' THEN 1 ELSE 0 END) as scale_trips,
                    SUM(CASE WHEN operation_type = 'burreo' THEN (SELECT net_weight FROM weight_tickets WHERE loading_order_id = loading_orders.id LIMIT 1) ELSE 0 END) as burreo_weight,
                    SUM(CASE WHEN operation_type != 'burreo' THEN (SELECT net_weight FROM weight_tickets WHERE loading_order_id = loading_orders.id LIMIT 1) ELSE 0 END) as scale_weight
                ")
                ->first();

            // Harmonize modal weights with totalProcessedMt (max between official and trips)
            $modalScaleWeightMt = ($tripsData->scale_weight ?? 0) / 1000;
            $modalBurreoWeightMt = max(($tripsData->burreo_weight ?? 0) / 1000, $totalProcessedMt - $modalScaleWeightMt);
            return [
                'id' => $v->id,
                'name' => $v->name,
                'type' => $v->vessel_type ?? 'B/T',
                'operation_type' => $v->operation_type,
                'is_discharge' => $isDischarge,
                'has_chief_foreman' => (bool) $v->has_chief_foreman,
                'stay_days' => $actualStay,
                'programmed_days' => $v->stay_days,
                'etb' => $v->berthal_datetime ? (is_string($v->berthal_datetime) ? date('d/m/Y H:i', strtotime($v->berthal_datetime)) : $v->berthal_datetime->format('d/m/Y H:i')) : '-',
                'external_arrival' => $v->external_dock_arrival_date ? (is_string($v->external_dock_arrival_date) ? date('d/m/Y', strtotime($v->external_dock_arrival_date)) : $v->external_dock_arrival_date->format('d/m/Y')) : '-',
                'stats' => [
                    'total_mt' => round($programmedMt, 2),
                    'processed_mt' => round($totalProcessedMt, 2), // What has been moved (Loaded or Discharged)
                    'on_board_mt' => round($onBoardMt, 2),        // Current state on ship
                    'pending_mt' => round($pendingMt, 2),         // What is missing to finish
                    'progress' => $progressPercent,
                    'total_trips' => (int) (($tripsData->scale_trips ?? 0) + ($tripsData->burreo_trips ?? 0)),
                    'scale_trips' => (int) ($tripsData->scale_trips ?? 0),
                    'burreo_trips' => (int) ($tripsData->burreo_trips ?? 0),
                    'scale_weight_mt' => round($modalScaleWeightMt, 2),
                    'burreo_weight_mt' => round($modalBurreoWeightMt, 2),
                ],
                'hatches' => $hatches,
                'product' => $v->product ? $v->product->name : 'N/A'
            ];
        };

        return Inertia::render('Dock/Status', [
            'active_vessels' => [
                'eco' => $formatVessel($eco),
                'whisky' => $formatVessel($whisky),
                'external' => $formatVessel($external),
            ],
            'arrivals' => $arrivals
        ]);
    }

    public function destroy($id)
    {
        $vessel = Vessel::findOrFail($id);

        // Check for dependencies
        if (ShipmentOrder::where('vessel_id', $id)->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: El barco tiene Órdenes de Embarque asociadas.']);
        }

        if (LoadingOrder::where('vessel_id', $id)->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: El barco tiene Órdenes de Carga (Operativas) asociadas.']);
        }

        if (VesselOperator::where('vessel_id', $id)->exists()) {
            return back()->withErrors(['error' => 'No se puede eliminar: El barco tiene Operadores registrados.']);
        }

        // Optional: Check specific other relations if necessary, e.g., WeighTickets if they link directly to vessels not via orders
        // if (WeightTicket::where('vessel_id', $id)->exists()) { ... }

        try {
            $vessel->delete();
            return redirect()->route('dock.index')->with('success', 'Barco eliminado correctamente.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Vessel Delete Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al eliminar barco: ' . $e->getMessage()]);
        }
    }

    public function purge($id)
    {
        $vessel = Vessel::findOrFail($id);

        try {
            DB::transaction(function () use ($vessel, $id) {
                // Temporarily disable foreign key checks for a clean purge
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');

                // 1. Get related IDs for manual cleanup (extra safety)
                $shipmentOrderIds = ShipmentOrder::where('vessel_id', $id)->pluck('id');
                $loadingOrderIds = LoadingOrder::where('vessel_id', $id)->pluck('id');
                $operatorIds = VesselOperator::where('vessel_id', $id)->pluck('id');

                // 2. Delete trips and scans
                // Trips must be deleted before operators to avoid orphaned history if checks were on
                \App\Models\VesselOperatorTrip::whereIn('vessel_operator_id', $operatorIds)
                    ->orWhere('vessel_id', $id)
                    ->delete();

                // Note: AptScan now links to loading_order_id too
                \App\Models\AptScan::whereIn('shipment_order_id', $shipmentOrderIds)
                    ->orWhereIn('loading_order_id', $loadingOrderIds)
                    ->orWhereIn('operator_id', $operatorIds)
                    ->delete();

                // 3. Delete other order-related data
                if ($loadingOrderIds->isNotEmpty()) {
                    \App\Models\WeightTicket::whereIn('loading_order_id', $loadingOrderIds)->delete();
                    \App\Models\LoadingOperation::whereIn('loading_order_id', $loadingOrderIds)->delete();
                }

                // Legacy cleanup for ShipmentOrders
                if ($shipmentOrderIds->isNotEmpty()) {
                    \App\Models\WeightTicket::whereIn('shipment_order_id', $shipmentOrderIds)->delete(); // legacy link
                    \App\Models\ShipmentItem::whereIn('shipment_order_id', $shipmentOrderIds)->delete();
                }

                // 4. Delete Orders
                LoadingOrder::where('vessel_id', $id)->delete();
                ShipmentOrder::where('vessel_id', $id)->delete();

                // 5. Delete VesselOperators
                VesselOperator::where('vessel_id', $id)->delete();

                // 6. Delete the Vessel
                $vessel->delete();

                // Re-enable foreign key checks
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            });

            return redirect()->route('dock.index')->with('success', 'Barco y todos sus registros asociados han sido purgados correctamente.');
        } catch (\Exception $e) {
            // Ensure checks are re-enabled even on failure
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            \Illuminate\Support\Facades\Log::error('Vessel Purge Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al purgar barco: ' . $e->getMessage()]);
        }
    }

    public function exportVessel(Vessel $vessel)
    {
        // 1. Base Query for the specific vessel (Completed Scale or any Burreo)
        $baseQuery = LoadingOrder::query()
            ->join('weight_tickets', 'loading_orders.id', '=', 'weight_tickets.loading_order_id')
            ->where('loading_orders.vessel_id', $vessel->id)
            ->where(function ($q) {
                $q->where('loading_orders.status', 'completed')
                    ->orWhere('loading_orders.operation_type', 'burreo');
            });

        // 2. Calculate Stats
        $stats = [
            'total_weight' => (clone $baseQuery)->sum('weight_tickets.net_weight'),
            'total_trips' => (clone $baseQuery)->count(),
            'stay_days' => $vessel->berthal_datetime ? Carbon::parse($vessel->berthal_datetime)->diffInDays(Carbon::now()) : 0,
        ];

        // 3. Daily Tonnage for Chart
        $dailyTonnage = (clone $baseQuery)
            ->select([
                DB::raw(OperationalTimeHelper::getSqlDateOffset('weight_tickets.weigh_out_at') . ' as date'),
                DB::raw('SUM(weight_tickets.net_weight) as total'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type = "burreo" THEN weight_tickets.net_weight ELSE 0 END) as burreo'),
                DB::raw('SUM(CASE WHEN loading_orders.operation_type != "burreo" OR loading_orders.operation_type IS NULL THEN weight_tickets.net_weight ELSE 0 END) as scale')
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $charts = [
            'daily_tonnage' => $dailyTonnage
        ];

        $fileName = 'Reporte_' . str_replace(' ', '', $vessel->name) . '_' . Carbon::now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new VesselStatusExport($vessel, $stats, $charts), $fileName);
    }
}
