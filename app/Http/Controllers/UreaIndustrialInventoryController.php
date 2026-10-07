<?php

namespace App\Http\Controllers;

use App\Models\Lot;
use App\Models\UreaDailyProduction;
use App\Models\UreaInitialInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class UreaIndustrialInventoryController extends Controller
{
    /**
     * Display the Urea Industrial Inventory Management Module (Daily Production & Initial Inventory).
     */
    public function index(Request $request)
    {
        if (!$request->has('tab')) {
            return redirect()->route('apt.inventory.urea-industrial.index', array_merge(['tab' => 'production'], $request->query()));
        }

        $tab = $request->input('tab', 'production'); // 'production' | 'initial' | 'summary'

        // Base queries scoped to Urea Industrial
        $dailyQuery = UreaDailyProduction::industrial()->with('user');
        $initialQuery = UreaInitialInventory::industrial()->with('user');

        // Filters for Daily Production & Initial Inventory
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
        $metrics = \App\Services\UreaStockService::getMetrics('industrial');
        $operationalDate = $metrics['operationalDate'];

        // Available lots for folio helper / reference
        $lots = Lot::where('status', 'open')->orderBy('created_at', 'desc')->get(['id', 'folio', 'warehouse', 'cubicle', 'plant_origin']);

        return Inertia::render('APT/Inventory/UreaIndustrial/Index', [
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
     * Store a new daily production record for Urea Industrial.
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
            'product_type' => 'industrial',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'supervisor_name' => auth()->user()->name ?? ($validated['supervisor_name'] ?? null),
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Producción diaria de Urea Industrial registrada exitosamente.');
    }

    /**
     * Update an existing daily production record for Urea Industrial.
     */
    public function updateDaily(Request $request, $id)
    {
        $production = UreaDailyProduction::industrial()->findOrFail($id);

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

        return redirect()->back()->with('success', 'Registro de producción diaria de Urea Industrial actualizado correctamente.');
    }

    /**
     * Delete a daily production record for Urea Industrial.
     */
    public function destroyDaily($id)
    {
        $production = UreaDailyProduction::industrial()->findOrFail($id);
        $production->delete();

        return redirect()->back()->with('success', 'Registro de producción diaria de Urea Industrial eliminado correctamente.');
    }

    /**
     * Store a new initial inventory record for Urea Industrial.
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
            'product_type' => 'industrial',
            'packaging' => $validated['packaging'] ?? 'Granel',
            'quantity_tons' => $validated['quantity_tons'],
            'sacks_count' => $validated['sacks_count'] ?? 0,
            'lot_folio' => $validated['lot_folio'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Inventario inicial de Urea Industrial registrado exitosamente.');
    }

    /**
     * Update an existing initial inventory record for Urea Industrial.
     */
    public function updateInitial(Request $request, $id)
    {
        $inventory = UreaInitialInventory::industrial()->findOrFail($id);

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

        return redirect()->back()->with('success', 'Registro de inventario inicial de Urea Industrial actualizado correctamente.');
    }

    /**
     * Delete an initial inventory record for Urea Industrial.
     */
    public function destroyInitial($id)
    {
        $inventory = UreaInitialInventory::industrial()->findOrFail($id);
        $inventory->delete();

        return redirect()->back()->with('success', 'Registro de inventario inicial de Urea Industrial eliminado correctamente.');
    }
}
