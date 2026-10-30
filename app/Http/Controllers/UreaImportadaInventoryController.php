<?php

namespace App\Http\Controllers;

use App\Models\Lot;
use App\Models\UreaDailyProduction;
use App\Models\UreaInitialInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UreaImportadaInventoryController extends Controller
{
    /**
     * Display the Urea Importada Inventory Management Module (Daily Reception & Initial Inventory).
     */
    public function index(Request $request)
    {
        if (!$request->has('tab')) {
            return redirect()->route('apt.inventory.urea-importada.index', array_merge(['tab' => 'production'], $request->query()));
        }

        $tab = $request->input('tab', 'production'); // 'production' | 'initial' | 'summary'

        // Base queries scoped to Urea Importada - Grouped by vessel/origin so each vessel appears only once
        $dailyQuery = UreaDailyProduction::importada()
            ->select(
                'plant_origin',
                \DB::raw('MAX(id) as id'),
                \DB::raw('MAX(date) as date'),
                \DB::raw('GROUP_CONCAT(DISTINCT warehouse ORDER BY warehouse ASC SEPARATOR ", ") as destination_warehouses'),
                \DB::raw('GROUP_CONCAT(DISTINCT NULLIF(cubicle, "") ORDER BY cubicle ASC SEPARATOR ", ") as cubicles_list'),
                \DB::raw('SUM(quantity_tons) as quantity_tons'),
                \DB::raw('MAX(supervisor_name) as supervisor_name'),
                \DB::raw('MAX(notes) as notes'),
                \DB::raw('COUNT(*) as total_entries'),
                \DB::raw('SUM(sacks_count) as total_sacks')
            )
            ->groupBy('plant_origin');
        $initialQuery = UreaInitialInventory::importada()->with('user');

        // Filters for Daily Reception & Initial Inventory
        if ($request->filled('search')) {
            $search = $request->input('search');
            $dailyQuery->where(function ($q) use ($search) {
                $q->where('warehouse', 'like', "%{$search}%")
                  ->orWhere('cubicle', 'like', "%{$search}%")
                  ->orWhere('plant_origin', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });

            $initialQuery->where(function ($q) use ($search) {
                $q->where('warehouse', 'like', "%{$search}%")
                  ->orWhere('cubicle', 'like', "%{$search}%")
                  ->orWhere('lot_folio', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('warehouse')) {
            $dailyQuery->where('warehouse', $request->input('warehouse'));
            $initialQuery->where('warehouse', $request->input('warehouse'));
        }

        if ($request->filled('plant_origin')) {
            $dailyQuery->where('plant_origin', $request->input('plant_origin'));
            $initialQuery->where('plant_origin', $request->input('plant_origin'));
        }

        if ($request->filled('date_from')) {
            $dailyQuery->whereDate('date', '>=', $request->input('date_from'));
            $initialQuery->whereDate('date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $dailyQuery->whereDate('date', '<=', $request->input('date_to'));
            $initialQuery->whereDate('date', '<=', $request->input('date_to'));
        }

        if ($request->filled('shift')) {
            $dailyQuery->where('shift', $request->input('shift'));
        }

        // Get paginated results
        $dailyProductions = $dailyQuery->orderBy('date', 'desc')->paginate(15)->withQueryString();
        $initialInventories = $initialQuery->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        // Calculate Totals & Summary Metrics using UreaStockService (subtracts completed shipment orders)
        $metrics = \App\Services\UreaStockService::getMetrics('importada');
        $operationalDate = $metrics['operationalDate'];

        // Available lots for folio helper / reference
        $lots = Lot::where('status', 'open')->orderBy('created_at', 'desc')->get(['id', 'folio', 'warehouse', 'cubicle', 'plant_origin']);

        // Fetch active and recent vessels with their trip and draft stats (for automatic Draft calculation)
        $vesselsWithDraftStats = \App\Models\Vessel::with('product')
            ->orderBy('created_at', 'desc')
            ->limit(25)
            ->get()
            ->map(function ($vessel) {
                // Count scans in APT
                $aptScansCount = \App\Models\AptScan::whereHas('loadingOrder', fn($q) => $q->where('vessel_id', $vessel->id))->count();
                $tripsCount = \App\Models\VesselOperatorTrip::where('vessel_id', $vessel->id)->count();

                // Group by warehouse & cubicle from APT Scans
                $whBreakdown = \App\Models\AptScan::whereHas('loadingOrder', fn($q) => $q->where('vessel_id', $vessel->id))
                    ->select('warehouse', 'cubicle', \DB::raw('count(*) as count'))
                    ->groupBy('warehouse', 'cubicle')
                    ->get()
                    ->map(fn($item) => [
                        'warehouse' => $item->warehouse ?: 'Almacen 1',
                        'cubicle' => $item->cubicle ?: '',
                        'trips_count' => (int) $item->count,
                    ]);

                $whBreakdownTotal = $whBreakdown->sum('trips_count');
                $totalTrips = $whBreakdownTotal > 0 ? $whBreakdownTotal : ($aptScansCount > 0 ? $aptScansCount : $tripsCount);

                $draftKg = (float) ($vessel->draft_weight ?? 0);
                $draftTons = $draftKg >= 100 ? ($draftKg / 1000) : $draftKg;

                return [
                    'id' => $vessel->id,
                    'name' => $vessel->name,
                    'status' => $vessel->status,
                    'draft_weight_tons' => (float) $draftTons,
                    'total_trips' => $totalTrips,
                    'apt_scans_count' => $aptScansCount,
                    'unit_draft_tons' => (float) $draftTons,
                    'breakdown' => $whBreakdown,
                    'created_at' => $vessel->created_at ? $vessel->created_at->toDateString() : null,
                ];
            });

        $vesselsTripsMap = $vesselsWithDraftStats->pluck('total_trips', 'name')->toArray();
        $dailyProductions->getCollection()->transform(function ($item) use ($vesselsTripsMap) {
            $matchedTrips = null;
            foreach ($vesselsTripsMap as $vName => $trips) {
                if (strcasecmp(trim($vName), trim($item->plant_origin)) === 0) {
                    $matchedTrips = $trips;
                    break;
                }
            }
            $item->total_trips = $matchedTrips ?: ($item->total_sacks > 0 ? (int) $item->total_sacks : (int) $item->total_entries);
            return $item;
        });

        return Inertia::render('APT/Inventory/UreaImportada/Index', [
            'tab' => $tab,
            'operationalDate' => $operationalDate,
            'dailyProductions' => $dailyProductions,
            'initialInventories' => $initialInventories,
            'metrics' => $metrics,
            'lots' => $lots,
            'vesselsWithDraftStats' => $vesselsWithDraftStats,
            'filters' => $request->only(['search', 'warehouse', 'plant_origin', 'date_from', 'date_to', 'shift', 'tab']),
        ]);
    }

    /**
     * Store draft reception entries calculated from vessel calado and APT trips in batch.
     */
    public function storeBatchDraft(Request $request)
    {
        $validated = $request->validate([
            'entries' => 'required|array|min:1',
            'entries.*.date' => 'required|date',
            'entries.*.shift' => 'nullable|string',
            'entries.*.warehouse' => 'required|string',
            'entries.*.cubicle' => 'nullable|string',
            'entries.*.plant_origin' => 'required|string',
            'entries.*.quantity_tons' => 'required|numeric|min:0.001',
            'entries.*.trips_count' => 'nullable|integer',
            'entries.*.notes' => 'nullable|string|max:1000',
        ]);

        \DB::transaction(function () use ($validated) {
            foreach ($validated['entries'] as $item) {
                UreaDailyProduction::create([
                    'date' => $item['date'],
                    'shift' => $item['shift'] ?? 'Turno 1',
                    'warehouse' => $item['warehouse'],
                    'cubicle' => $item['cubicle'] ?? null,
                    'plant_origin' => $item['plant_origin'],
                    'product_type' => 'importada',
                    'packaging' => 'Granel',
                    'quantity_tons' => $item['quantity_tons'],
                    'sacks_count' => $item['trips_count'] ?? 0,
                    'lot_folio' => null,
                    'supervisor_name' => auth()->user()->name ?? 'Báscula / Draft',
                    'notes' => $item['notes'] ?? 'Recepción por Calado de Buque (Draft)',
                    'user_id' => auth()->id(),
                ]);
            }
        });

        return redirect()->back()->with('success', 'Entradas por Calado (Draft) registradas exitosamente en el historial.');
    }

    /**
     * Store a new daily reception / production record for Urea Importada.
     */
    public function storeDaily(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'shift' => 'nullable|string',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => 'required|string',
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'supervisor_name' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:1000',
        ]);

        UreaDailyProduction::create([
            'date' => $validated['date'],
            'shift' => $validated['shift'] ?? 'Turno 1',
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'] ?? null,
            'plant_origin' => $validated['plant_origin'],
            'product_type' => 'importada',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'supervisor_name' => auth()->user()->name ?? ($validated['supervisor_name'] ?? null),
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Registro diario de Urea Importada guardado exitosamente.');
    }

    /**
     * Update an existing daily reception / production record for Urea Importada.
     */
    public function updateDaily(Request $request, $id)
    {
        $production = UreaDailyProduction::importada()->findOrFail($id);

        $validated = $request->validate([
            'date' => 'required|date',
            'shift' => 'nullable|string',
            'warehouse' => 'nullable|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => 'required|string',
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'supervisor_name' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:1000',
        ]);

        $oldPlantOrigin = $production->plant_origin;
        $matching = UreaDailyProduction::importada()->where('plant_origin', $oldPlantOrigin)->get();

        if ($matching->count() > 1) {
            $oldTotalTons = (float) $matching->sum('quantity_tons');
            $newTotalTons = (float) $validated['quantity_tons'];
            $oldTotalTrips = (int) $matching->sum('sacks_count');
            $newTotalTrips = isset($validated['sacks_count']) ? (int) $validated['sacks_count'] : null;

            foreach ($matching as $entry) {
                $ratioTons = $oldTotalTons > 0 ? ($entry->quantity_tons / $oldTotalTons) : (1 / $matching->count());
                $updatedTons = round($newTotalTons * $ratioTons, 3);
                $updatedTrips = ($newTotalTrips !== null && $oldTotalTrips > 0)
                    ? round($newTotalTrips * ($entry->sacks_count / $oldTotalTrips))
                    : $entry->sacks_count;

                $entry->update([
                    'date' => $validated['date'],
                    'shift' => $validated['shift'] ?? $entry->shift,
                    'plant_origin' => $validated['plant_origin'],
                    'quantity_tons' => $updatedTons,
                    'sacks_count' => $updatedTrips,
                    'notes' => $validated['notes'] ?? $entry->notes,
                ]);
            }
        } else {
            $production->update([
                'date' => $validated['date'],
                'shift' => $validated['shift'] ?? ($production->shift ?? 'Turno 1'),
                'warehouse' => $validated['warehouse'] ?? $production->warehouse,
                'cubicle' => $validated['cubicle'] ?? $production->cubicle,
                'plant_origin' => $validated['plant_origin'],
                'packaging' => $validated['packaging'] ?? ($production->packaging ?? 'Granel'),
                'quantity_tons' => $validated['quantity_tons'],
                'sacks_count' => $validated['sacks_count'] ?? 0,
                'lot_folio' => $validated['lot_folio'] ?? null,
                'supervisor_name' => $validated['supervisor_name'] ?? $production->supervisor_name,
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        return redirect()->back()->with('success', 'Registro diario de Urea Importada actualizado correctamente.');
    }

    /**
     * Delete a daily reception / production record for Urea Importada.
     */
    public function destroyDaily(Request $request, $id)
    {
        $plant = $request->input('plant_origin');

        if (!$plant || trim($plant) === '') {
            $production = UreaDailyProduction::importada()->find($id);
            if ($production) {
                $plant = $production->plant_origin;
            }
        }

        if ($plant && trim($plant) !== '') {
            UreaDailyProduction::importada()->where(function ($q) use ($plant) {
                $q->where('plant_origin', $plant)
                  ->orWhere('plant_origin', trim($plant));
            })->delete();
        } else {
            UreaDailyProduction::importada()->where('id', $id)->delete();
        }

        return redirect()->back()->with('success', 'Registro(s) de recepción del buque eliminados correctamente.');
    }

    /**
     * Store a new Initial Inventory base record for Urea Importada.
     */
    public function storeInitial(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => 'required|string',
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        UreaInitialInventory::create([
            'date' => $validated['date'],
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'] ?? null,
            'plant_origin' => $validated['plant_origin'],
            'product_type' => 'importada',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Inventario inicial de Urea Importada registrado exitosamente.');
    }

    /**
     * Update an Initial Inventory base record for Urea Importada.
     */
    public function updateInitial(Request $request, $id)
    {
        $initial = UreaInitialInventory::importada()->findOrFail($id);

        $validated = $request->validate([
            'date' => 'required|date',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => 'required|string',
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $initial->update([
            'date' => $validated['date'],
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'] ?? null,
            'plant_origin' => $validated['plant_origin'],
            'packaging' => $validated['packaging'] ?? ($initial->packaging ?? 'Granel'),
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Inventario inicial de Urea Importada actualizado correctamente.');
    }

    /**
     * Delete an Initial Inventory base record for Urea Importada.
     */
    public function destroyInitial($id)
    {
        $initial = UreaInitialInventory::importada()->findOrFail($id);
        $initial->delete();

        return redirect()->back()->with('success', 'Inventario inicial de Urea Importada eliminado correctamente.');
    }
}
