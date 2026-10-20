<?php

namespace App\Http\Controllers;

use App\Models\Lot;
use App\Models\UreaDailyProduction;
use App\Models\UreaInitialInventory;
use App\Services\UreaStockService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class UreaInventoryController extends Controller
{
    /**
     * Display the Submodule Hub for Gestión de Inventarios.
     */
    public function hub(Request $request)
    {
        return Inertia::render('APT/Inventory/Index');
    }

    /**
     * Display the Urea Agricola Inventory Management Module (Daily Production & Initial Inventory).
     */
    public function index(Request $request)
    {
        if (!$request->has('tab')) {
            return redirect()->route('apt.inventory.urea.index', array_merge(['tab' => 'production'], $request->query()));
        }

        $tab = $request->input('tab', 'production'); // 'production' | 'initial' | 'summary'

        // Base queries
        $dailyQuery = UreaDailyProduction::agricola()->with('user');
        $initialQuery = UreaInitialInventory::agricola()->with('user');

        // Filters for Daily Production
        if ($request->filled('search')) {
            $search = $request->input('search');
            $dailyQuery->where(function ($q) use ($search) {
                $q->where('warehouse', 'like', "%{$search}%")
                  ->orWhere('cubicle', 'like', "%{$search}%")
                  ->orWhere('lot_folio', 'like', "%{$search}%")
                  ->orWhere('supervisor_name', 'like', "%{$search}%")
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
        $dailyProductions = $dailyQuery->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();
        $initialInventories = $initialQuery->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        // Calculate Totals & Summary Metrics using UreaStockService (subtracts completed shipment orders)
        $metrics = \App\Services\UreaStockService::getMetrics('agricola');
        $operationalDate = $metrics['operationalDate'];

        // Available lots for folio helper / reference
        $lots = Lot::where('status', 'open')->orderBy('created_at', 'desc')->get(['id', 'folio', 'warehouse', 'cubicle', 'plant_origin']);

        return Inertia::render('APT/Inventory/Urea/Index', [
            'tab' => $tab,
            'operationalDate' => $operationalDate,
            'dailyProductions' => $dailyProductions,
            'initialInventories' => $initialInventories,
            'metrics' => $metrics,
            'lots' => $lots,
            'filters' => $request->only(['search', 'warehouse', 'plant_origin', 'date_from', 'date_to', 'shift', 'tab']),
        ]);
    }

    /**
     * Store a new daily production record.
     */
    public function storeDaily(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'shift' => 'nullable|string',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
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
            'product_type' => 'agricola',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'supervisor_name' => auth()->user()->name ?? ($validated['supervisor_name'] ?? null),
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Producción diaria de Urea Agrícola registrada exitosamente.');
    }

    /**
     * Update an existing daily production record.
     */
    public function updateDaily(Request $request, $id)
    {
        $production = UreaDailyProduction::findOrFail($id);

        $validated = $request->validate([
            'date' => 'required|date',
            'shift' => 'nullable|string',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'supervisor_name' => 'nullable|string|max:150',
            'notes' => 'nullable|string|max:1000',
        ]);

        $production->update([
            'date' => $validated['date'],
            'shift' => $validated['shift'] ?? ($production->shift ?? 'Turno 1'),
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'] ?? null,
            'plant_origin' => $validated['plant_origin'],
            'packaging' => $validated['packaging'] ?? ($production->packaging ?? 'Granel'),
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? ($production->sacks_count ?? 0),
            'lot_folio' => $validated['lot_folio'] ?? ($production->lot_folio ?? null),
            'supervisor_name' => $validated['supervisor_name'] ?? ($production->supervisor_name ?? auth()->user()->name),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Registro de producción diaria actualizado correctamente.');
    }

    /**
     * Delete a daily production record.
     */
    public function destroyDaily($id)
    {
        $production = UreaDailyProduction::findOrFail($id);
        $production->delete();

        return redirect()->back()->with('success', 'Registro de producción diaria eliminado correctamente.');
    }

    /**
     * Store a new initial inventory record.
     */
    public function storeInitial(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
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
            'product_type' => 'agricola',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Inventario inicial de Urea Agrícola registrado exitosamente.');
    }

    /**
     * Update an existing initial inventory record.
     */
    public function updateInitial(Request $request, $id)
    {
        $inventory = UreaInitialInventory::findOrFail($id);

        $validated = $request->validate([
            'date' => 'required|date',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
            'packaging' => 'nullable|string',
            'quantity_tons' => 'required|numeric|min:0.001',
            'sacks_count' => 'nullable|integer|min:0',
            'lot_folio' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $inventory->update([
            'date' => $validated['date'],
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'] ?? null,
            'plant_origin' => $validated['plant_origin'],
            'packaging' => $validated['packaging'] ?? ($inventory->packaging ?? 'Granel'),
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? ($inventory->sacks_count ?? 0),
            'lot_folio' => $validated['lot_folio'] ?? ($inventory->lot_folio ?? null),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Inventario inicial actualizado correctamente.');
    }

    /**
     * Delete an initial inventory record.
     */
    public function destroyInitial($id)
    {
        $inventory = UreaInitialInventory::findOrFail($id);
        $inventory->delete();

        return redirect()->back()->with('success', 'Inventario inicial eliminado correctamente.');
    }

    /**
     * Display the Urea Agrícola Shipments/Exits report page with date and warehouse filtering.
     */
    public function shipments(Request $request)
    {
        $allExits = UreaStockService::getCompletedExitsList('agricola');

        $filtered = $allExits;

        // Filter by warehouse
        if ($request->filled('warehouse') && $request->warehouse !== 'all') {
            $warehouseFilter = UreaStockService::normalizeWarehouse($request->input('warehouse')) ?: trim($request->input('warehouse'));
            $filtered = $filtered->filter(function ($item) use ($warehouseFilter) {
                $itemWh = UreaStockService::normalizeWarehouse($item['warehouse']) ?: trim($item['warehouse']);
                return strcasecmp($itemWh, $warehouseFilter) === 0;
            });
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $dateFrom = $request->input('date_from');
            $filtered = $filtered->filter(function ($item) use ($dateFrom) {
                return !empty($item['date_only']) && $item['date_only'] >= $dateFrom;
            });
        }

        if ($request->filled('date_to')) {
            $dateTo = $request->input('date_to');
            $filtered = $filtered->filter(function ($item) use ($dateTo) {
                return !empty($item['date_only']) && $item['date_only'] <= $dateTo;
            });
        }

        // Filter by search query
        if ($request->filled('search')) {
            $search = mb_strtolower(trim($request->input('search')));
            $filtered = $filtered->filter(function ($item) use ($search) {
                return str_contains(mb_strtolower($item['ticket_number'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['shipment_folio'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['lot_folio'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['client'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['operator_name'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['transport_company'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['tractor_plate'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['trailer_plate'] ?? ''), $search)
                    || str_contains(mb_strtolower($item['warehouse'] ?? ''), $search);
            });
        }

        // Calculate totals for the filtered subset and overall
        $filteredCount = $filtered->count();
        $filteredTons = round($filtered->sum('net_tons'), 3);

        $allCount = $allExits->count();
        $allTons = round($allExits->sum('net_tons'), 3);

        // Standard list of warehouses
        $warehouses = ['Almacén 1', 'Almacén 2', 'Almacén 3', 'Almacén 4', 'Almacén 5'];

        // Pagination
        $perPage = 15;
        $page = LengthAwarePaginator::resolveCurrentPage();
        $results = $filtered->forPage($page, $perPage)->values();
        $paginated = new LengthAwarePaginator($results, $filteredCount, $perPage, $page, [
            'path' => $request->url(),
            'query' => $request->query(),
        ]);

        return Inertia::render('APT/Inventory/Urea/Shipments', [
            'shipments' => $paginated,
            'metrics' => [
                'filtered_count' => $filteredCount,
                'filtered_tons' => $filteredTons,
                'total_count' => $allCount,
                'total_tons' => $allTons,
            ],
            'warehouses' => $warehouses,
            'filters' => $request->only(['warehouse', 'date_from', 'date_to', 'search']),
        ]);
    }
}
