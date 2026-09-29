<?php

namespace App\Http\Controllers;

use App\Models\SupplyInventoryItem;
use App\Models\SupplyInventoryMovement;
use App\Services\SupplyInventoryCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplyInventoryController extends Controller
{
    /**
     * Display the 4 Main Submodules Hub for Gestión de Inventarios:
     * 1. Productos
     * 2. Entrada
     * 3. Salida
     * 4. Urea Agrícola
     */
    public function hub(Request $request)
    {
        $types = SupplyInventoryCatalog::getTypes();

        // Summaries for supply items
        $totalProducts = SupplyInventoryItem::count();
        $totalStock = (float) SupplyInventoryItem::sum('stock');
        $totalValue = (float) SupplyInventoryItem::sum(DB::raw('stock * unit_cost'));
        $lowStockCount = SupplyInventoryItem::where('stock', '>', 0)->whereColumn('stock', '<=', 'min_stock')->count();
        $outOfStockCount = SupplyInventoryItem::where('stock', '<=', 0)->count();

        // Summaries for movements
        $totalEntriesMonth = SupplyInventoryMovement::where('movement_type', 'entry')
            ->whereMonth('movement_date', now()->month)
            ->whereYear('movement_date', now()->year)
            ->sum('quantity');

        $totalExitsMonth = SupplyInventoryMovement::where('movement_type', 'exit')
            ->whereMonth('movement_date', now()->month)
            ->whereYear('movement_date', now()->year)
            ->sum('quantity');

        $mainModules = [
            [
                'id' => 'products',
                'name' => 'Productos',
                'slug' => 'products',
                'description' => 'Catálogo general de insumos y materiales clasificados en 9 grupos con altas, bajas y control de existencias.',
                'icon' => 'Boxes',
                'color' => 'bg-blue-50 text-blue-600',
                'border' => 'border-blue-200',
                'hover' => 'hover:border-blue-500 hover:shadow-blue-100',
                'accent' => 'blue',
                'href' => route('apt.inventory.products.index'),
                'badge' => '9 Submódulos',
                'stats_label' => 'Total Productos',
                'stats_value' => $totalProducts,
                'secondary_label' => 'Stock total:',
                'secondary_value' => number_format($totalStock, 0) . ' unidades',
            ],
            [
                'id' => 'entries',
                'name' => 'Entrada',
                'slug' => 'entries',
                'description' => 'Registro de recepción de insumos, compras, traspasos y entradas al almacén con actualización automática de stock.',
                'icon' => 'ArrowDownToLine',
                'color' => 'bg-emerald-50 text-emerald-600',
                'border' => 'border-emerald-200',
                'hover' => 'hover:border-emerald-500 hover:shadow-emerald-100',
                'accent' => 'emerald',
                'href' => route('apt.inventory.entries.index'),
                'badge' => 'Recepción',
                'stats_label' => 'Entradas este mes',
                'stats_value' => number_format($totalEntriesMonth, 0) . ' u',
                'secondary_label' => 'Recepción activa',
                'secondary_value' => 'Almacén general',
            ],
            [
                'id' => 'exits',
                'name' => 'Salida',
                'slug' => 'exits',
                'description' => 'Despacho de materiales, entregas para producción, mantenimiento y control de vales de salida con validación de existencia.',
                'icon' => 'ArrowUpFromLine',
                'color' => 'bg-amber-50 text-amber-600',
                'border' => 'border-amber-200',
                'hover' => 'hover:border-amber-500 hover:shadow-amber-100',
                'accent' => 'amber',
                'href' => route('apt.inventory.exits.index'),
                'badge' => 'Despacho',
                'stats_label' => 'Salidas este mes',
                'stats_value' => number_format($totalExitsMonth, 0) . ' u',
                'secondary_label' => 'Consumo operativo',
                'secondary_value' => 'Control de vales',
            ],
            [
                'id' => 'urea',
                'name' => 'Urea Agrícola',
                'slug' => 'urea',
                'description' => 'Módulo especializado de producción diaria por turno, planta de origen (Urea 1 y 2) e inventario inicial balanceado.',
                'icon' => 'TrendingUp',
                'color' => 'bg-teal-50 text-teal-600',
                'border' => 'border-teal-200',
                'hover' => 'hover:border-teal-500 hover:shadow-teal-100',
                'accent' => 'teal',
                'href' => route('apt.inventory.urea.index') . '?tab=production',
                'badge' => 'Producción',
                'stats_label' => 'Módulo especial',
                'stats_value' => 'Producción e Inicial',
                'secondary_label' => 'Plantas:',
                'secondary_value' => 'UREA 1 / UREA 2',
            ],
        ];

        return Inertia::render('APT/Inventory/Index', [
            'mainModules' => $mainModules,
            'metrics' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
                'total_value' => $totalValue,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
            ],
        ]);
    }

    /**
     * Display the 1st Submodule: "Productos"
     * Contains all 9 Types / Categories in a unified, filtered table with clickable groups.
     */
    public function products(Request $request)
    {
        $types = SupplyInventoryCatalog::getTypes();
        $selectedTypeSlug = $request->input('type', '');

        if (!empty($selectedTypeSlug)) {
            $query = SupplyInventoryItem::with('user');

            if ($selectedTypeSlug !== 'all') {
                $query->where('type_slug', $selectedTypeSlug);
            }

            if ($request->filled('search')) {
                $search = trim($request->input('search'));
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('group_name', 'like', "%{$search}%")
                      ->orWhere('type_name', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%");
                });
            }

            if ($request->filled('group_number')) {
                $query->where('group_number', (int) $request->input('group_number'));
            }

            if ($request->filled('is_inventoried')) {
                $query->where('is_inventoried', $request->input('is_inventoried') === '1');
            }

            if ($request->filled('stock_status')) {
                $stockStatus = $request->input('stock_status');
                if ($stockStatus === 'in_stock') {
                    $query->where('stock', '>', 0);
                } elseif ($stockStatus === 'out_of_stock') {
                    $query->where('stock', '<=', 0);
                } elseif ($stockStatus === 'low_stock') {
                    $query->where('stock', '>', 0)->whereColumn('stock', '<=', 'min_stock');
                }
            }

            $items = $query->orderBy('type_id')->orderBy('group_number')->orderBy('name')->paginate(15)->withQueryString();
        } else {
            $items = new \Illuminate\Pagination\LengthAwarePaginator(
                collect([]),
                0,
                15,
                1,
                ['path' => route('apt.inventory.products.index'), 'query' => $request->query()]
            );
        }

        // Metrics for products
        $allItems = SupplyInventoryItem::all();
        $metrics = [
            'total_products' => $allItems->count(),
            'total_stock' => (float) $allItems->sum('stock'),
            'total_value' => (float) $allItems->sum(fn($i) => $i->stock * $i->unit_cost),
            'low_stock_count' => $allItems->filter(fn($i) => $i->stock > 0 && $i->stock <= $i->min_stock)->count(),
            'out_of_stock_count' => $allItems->filter(fn($i) => $i->stock <= 0)->count(),
        ];

        // All distinct locations
        $locations = SupplyInventoryItem::whereNotNull('location')
            ->where('location', '!=', '')
            ->distinct()
            ->pluck('location')
            ->sort()
            ->values();

        // Type summaries
        $typeSummaries = SupplyInventoryItem::select(
            'type_slug',
            DB::raw('COUNT(*) as total_items'),
            DB::raw('SUM(stock) as total_stock'),
            DB::raw('SUM(stock * unit_cost) as total_value')
        )
            ->groupBy('type_slug')
            ->get()
            ->keyBy('type_slug');

        $typesWithStats = array_map(function ($t) use ($typeSummaries) {
            $sum = $typeSummaries->get($t['slug']);
            return array_merge($t, [
                'total_items' => (int) ($sum->total_items ?? 0),
                'total_stock' => (float) ($sum->total_stock ?? 0),
                'total_value' => (float) ($sum->total_value ?? 0),
            ]);
        }, array_values($types));

        return Inertia::render('APT/Inventory/Products/Index', [
            'items' => $items,
            'metrics' => $metrics,
            'locations' => $locations,
            'allItemsSummary' => $allItems->map(fn($i) => [
                'id' => $i->id,
                'type_slug' => $i->type_slug,
                'stock' => (float) $i->stock,
                'min_stock' => (float) $i->min_stock,
                'unit_cost' => (float) $i->unit_cost,
                'location' => $i->location ?: 'Almacén General',
            ]),
            'types' => $typesWithStats,
            'selectedTypeSlug' => $selectedTypeSlug,
            'filters' => $request->only(['search', 'type', 'group_number', 'is_inventoried', 'stock_status']),
        ]);
    }

    /**
     * Display a specific Group of Insumo interface (e.g. Aceros, Concretos, Plomería, etc.)
     */
    public function groupView(Request $request, string $type_slug, int $group_number)
    {
        $type = SupplyInventoryCatalog::findType($type_slug);

        if (!$type) {
            return redirect()->route('apt.inventory.products.index')->withErrors(['error' => 'Submódulo no encontrado.']);
        }

        $group = null;
        foreach ($type['groups'] as $g) {
            if ($g['number'] === $group_number) {
                $group = $g;
                break;
            }
        }

        if (!$group) {
            return redirect()->route('apt.inventory.products.index')->withErrors(['error' => 'Grupo de insumo no encontrado.']);
        }

        $query = SupplyInventoryItem::with('user')
            ->where('type_slug', $type['slug'])
            ->where('group_number', $group_number);

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('name')->paginate(15)->withQueryString();

        $allGroupItems = SupplyInventoryItem::where('type_slug', $type['slug'])->where('group_number', $group_number)->get();
        $metrics = [
            'total_products' => $allGroupItems->count(),
            'total_stock' => (float) $allGroupItems->sum('stock'),
            'total_value' => (float) $allGroupItems->sum(fn($i) => $i->stock * $i->unit_cost),
            'low_stock_count' => $allGroupItems->filter(fn($i) => $i->stock > 0 && $i->stock <= $i->min_stock)->count(),
            'out_of_stock_count' => $allGroupItems->filter(fn($i) => $i->stock <= 0)->count(),
        ];

        return Inertia::render('APT/Inventory/Products/GroupView', [
            'type' => $type,
            'group' => $group,
            'items' => $items,
            'metrics' => $metrics,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display a specific inventory submodule (Legacy redirect or Type view).
     */
    public function index(Request $request, string $type_slug)
    {
        return redirect()->route('apt.inventory.products.index', ['type' => $type_slug]);
    }

    /**
     * Display the 2nd Submodule: "Entrada" (Recepción de Insumos)
     */
    public function entries(Request $request)
    {
        $query = SupplyInventoryMovement::with(['item', 'user'])
            ->where('movement_type', 'entry');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                  ->orWhere('item_code', 'like', "%{$search}%")
                  ->orWhere('reference_document', 'like', "%{$search}%")
                  ->orWhere('responsible_person', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type_slug')) {
            $query->where('type_slug', $request->input('type_slug'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->input('date_to'));
        }

        $movements = $query->orderBy('movement_date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        // Calculate summary metrics for entries
        $allEntries = SupplyInventoryMovement::where('movement_type', 'entry')->get();
        $metrics = [
            'total_entries' => $allEntries->count(),
            'total_quantity' => (float) $allEntries->sum('quantity'),
            'total_cost' => (float) $allEntries->sum('total_cost'),
            'entries_this_month' => (float) $allEntries->filter(fn($m) => $m->movement_date && $m->movement_date->format('Y-m') === now()->format('Y-m'))->sum('quantity'),
        ];

        // All active products for dropdown
        $availableProducts = SupplyInventoryItem::orderBy('type_id')->orderBy('name')->get([
            'id', 'name', 'code', 'type_name', 'type_slug', 'group_name', 'group_number', 'unit', 'stock', 'unit_cost', 'location'
        ]);

        $types = SupplyInventoryCatalog::getTypes();

        return Inertia::render('APT/Inventory/Movements/Entries', [
            'movements' => $movements,
            'metrics' => $metrics,
            'availableProducts' => $availableProducts,
            'types' => array_values($types),
            'filters' => $request->only(['search', 'type_slug', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Store an Inventory Entry movement.
     */
    public function storeEntry(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:supply_inventory_items,id',
            'quantity' => 'required|numeric|min:0.01',
            'movement_date' => 'nullable|date',
            'entry_date' => 'nullable|date',
            'exit_date' => 'nullable|date',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference_document' => 'nullable|string|max:255',
            'responsible_person' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $item = SupplyInventoryItem::findOrFail($validated['item_id']);
        $quantity = (float) $validated['quantity'];
        $unitCost = isset($validated['unit_cost']) && $validated['unit_cost'] > 0 ? (float) $validated['unit_cost'] : (float) $item->unit_cost;
        $totalCost = $quantity * $unitCost;

        $movementDate = $validated['movement_date'] ?? ($validated['entry_date'] ?? now()->toDateString());
        $entryDate = $validated['entry_date'] ?? $movementDate;
        $exitDate = $validated['exit_date'] ?? null;

        DB::transaction(function () use ($item, $quantity, $unitCost, $totalCost, $movementDate, $entryDate, $exitDate, $validated) {
            // 1. Create movement record
            SupplyInventoryMovement::create([
                'movement_type' => 'entry',
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'type_id' => $item->type_id,
                'type_name' => $item->type_name,
                'type_slug' => $item->type_slug,
                'group_number' => $item->group_number,
                'group_name' => $item->group_name,
                'quantity' => $quantity,
                'unit' => $item->unit,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_document' => $validated['reference_document'] ?? null,
                'responsible_person' => $validated['responsible_person'] ?? null,
                'location' => $validated['location'] ?? $item->location,
                'user_id' => auth()->id(),
                'notes' => $validated['notes'] ?? null,
                'movement_date' => $movementDate,
                'entry_date' => $entryDate,
                'exit_date' => $exitDate,
            ]);

            // 2. Increment stock and update cost if provided (do NOT overwrite product location)
            $item->increment('stock', $quantity);
            if ($unitCost > 0) {
                $item->update(['unit_cost' => $unitCost]);
            }
        });

        return redirect()->back()->with('success', "Entrada de {$quantity} {$item->unit} de \"{$item->name}\" registrada correctamente.");
    }

    /**
     * Display the 3rd Submodule: "Salida" (Despacho de Insumos)
     */
    public function exits(Request $request)
    {
        $query = SupplyInventoryMovement::with(['item', 'user'])
            ->where('movement_type', 'exit');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                  ->orWhere('item_code', 'like', "%{$search}%")
                  ->orWhere('reference_document', 'like', "%{$search}%")
                  ->orWhere('responsible_person', 'like', "%{$search}%")
                  ->orWhere('destination_area', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type_slug')) {
            $query->where('type_slug', $request->input('type_slug'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('movement_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('movement_date', '<=', $request->input('date_to'));
        }

        $movements = $query->orderBy('movement_date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        $allExits = SupplyInventoryMovement::where('movement_type', 'exit')->get();
        $metrics = [
            'total_exits' => $allExits->count(),
            'total_quantity' => (float) $allExits->sum('quantity'),
            'total_cost' => (float) $allExits->sum('total_cost'),
            'exits_this_month' => (float) $allExits->filter(fn($m) => $m->movement_date && $m->movement_date->format('Y-m') === now()->format('Y-m'))->sum('quantity'),
        ];

        $availableProducts = SupplyInventoryItem::where('stock', '>', 0)
            ->orderBy('type_id')->orderBy('name')->get([
                'id', 'name', 'code', 'type_name', 'type_slug', 'group_name', 'group_number', 'unit', 'stock', 'unit_cost', 'location'
            ]);

        $types = SupplyInventoryCatalog::getTypes();

        return Inertia::render('APT/Inventory/Movements/Exits', [
            'movements' => $movements,
            'metrics' => $metrics,
            'availableProducts' => $availableProducts,
            'types' => array_values($types),
            'filters' => $request->only(['search', 'type_slug', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Store an Inventory Exit movement.
     */
    public function storeExit(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:supply_inventory_items,id',
            'quantity' => 'required|numeric|min:0.01',
            'movement_date' => 'required|date',
            'destination_area' => 'nullable|string|max:255',
            'responsible_person' => 'nullable|string|max:255',
            'reference_document' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $item = SupplyInventoryItem::findOrFail($validated['item_id']);
        $quantity = (float) $validated['quantity'];

        if ($item->stock < $quantity) {
            return back()->withErrors(['quantity' => "Existencia insuficiente. Stock disponible: {$item->stock} {$item->unit}."]);
        }

        $unitCost = (float) $item->unit_cost;
        $totalCost = $quantity * $unitCost;
        $locationVal = $validated['location'] ?? ($validated['destination_area'] ?? 'Área Operativa');

        DB::transaction(function () use ($item, $quantity, $unitCost, $totalCost, $locationVal, $validated) {
            SupplyInventoryMovement::create([
                'movement_type' => 'exit',
                'item_id' => $item->id,
                'item_code' => $item->code,
                'item_name' => $item->name,
                'type_id' => $item->type_id,
                'type_name' => $item->type_name,
                'type_slug' => $item->type_slug,
                'group_number' => $item->group_number,
                'group_name' => $item->group_name,
                'quantity' => $quantity,
                'unit' => $item->unit,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_document' => $validated['reference_document'] ?? null,
                'responsible_person' => $validated['responsible_person'] ?? null,
                'destination_area' => $validated['destination_area'] ?? $locationVal,
                'location' => $locationVal,
                'user_id' => auth()->id(),
                'notes' => $validated['notes'] ?? null,
                'movement_date' => $validated['movement_date'],
            ]);

            $item->decrement('stock', $quantity);
        });

        return redirect()->back()->with('success', "Salida de {$quantity} {$item->unit} de \"{$item->name}\" registrada correctamente.");
    }

    /**
     * Store a new inventory product (Dar de alta producto).
     */
    public function store(Request $request, string $type_slug = null)
    {
        $typeSlug = $type_slug ?: $request->input('type_slug');
        $type = SupplyInventoryCatalog::findType($typeSlug);

        if (!$type) {
            return back()->withErrors(['error' => 'Submódulo no válido.']);
        }

        $validated = $request->validate([
            'group_number' => 'required|integer',
            'code' => 'nullable|string|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'unit' => 'required|string|max:50',
            'stock' => 'required|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'is_inventoried' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $groupName = 'GENERAL';
        $isInventoriedDefault = true;
        foreach ($type['groups'] as $grp) {
            if ($grp['number'] === (int) $validated['group_number']) {
                $groupName = $grp['name'];
                $isInventoriedDefault = $grp['is_inventoried'];
                break;
            }
        }

        $code = $validated['code'];
        if (empty($code)) {
            $prefix = strtoupper(substr($type['slug'], 0, 3)) . '-' . str_pad($validated['group_number'], 2, '0', STR_PAD_LEFT);
            $lastCount = SupplyInventoryItem::where('type_id', $type['id'])
                ->where('group_number', $validated['group_number'])
                ->count() + 1;
            $code = $prefix . '-' . str_pad($lastCount, 3, '0', STR_PAD_LEFT);
        }

        SupplyInventoryItem::create([
            'type_id' => $type['id'],
            'type_name' => $type['name'],
            'type_slug' => $type['slug'],
            'group_number' => (int) $validated['group_number'],
            'group_name' => $groupName,
            'code' => $code,
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
            'unit' => strtoupper(trim($validated['unit'])),
            'stock' => (float) $validated['stock'],
            'min_stock' => (float) ($validated['min_stock'] ?? 0),
            'unit_cost' => (float) ($validated['unit_cost'] ?? 0),
            'location' => $validated['location'] ?? null,
            'kontrol_type' => 'Normal',
            'is_inventoried' => $validated['is_inventoried'] ?? $isInventoriedDefault,
            'user_id' => auth()->id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Producto dado de alta correctamente en ' . $type['name'] . '.');
    }

    /**
     * Update an existing product.
     */
    public function update(Request $request, string $type_slug, $id)
    {
        $type = SupplyInventoryCatalog::findType($type_slug);

        if (!$type) {
            return back()->withErrors(['error' => 'Submódulo no válido.']);
        }

        $item = SupplyInventoryItem::where('type_slug', $type['slug'])->findOrFail($id);

        $validated = $request->validate([
            'group_number' => 'required|integer',
            'code' => 'nullable|string|max:100',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'unit' => 'required|string|max:50',
            'stock' => 'required|numeric|min:0',
            'min_stock' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'is_inventoried' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        $groupName = $item->group_name;
        foreach ($type['groups'] as $grp) {
            if ($grp['number'] === (int) $validated['group_number']) {
                $groupName = $grp['name'];
                break;
            }
        }

        $item->update([
            'group_number' => (int) $validated['group_number'],
            'group_name' => $groupName,
            'code' => $validated['code'] ?? $item->code,
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
            'unit' => strtoupper(trim($validated['unit'])),
            'stock' => (float) $validated['stock'],
            'min_stock' => (float) ($validated['min_stock'] ?? 0),
            'unit_cost' => (float) ($validated['unit_cost'] ?? 0),
            'location' => $validated['location'] ?? null,
            'is_inventoried' => isset($validated['is_inventoried']) ? (bool) $validated['is_inventoried'] : $item->is_inventoried,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Producto actualizado correctamente.');
    }

    /**
     * Delete a product (Eliminar producto).
     */
    public function destroy(string $type_slug, $id)
    {
        $type = SupplyInventoryCatalog::findType($type_slug);

        if (!$type) {
            return back()->withErrors(['error' => 'Submódulo no válido.']);
        }

        $item = SupplyInventoryItem::where('type_slug', $type['slug'])->findOrFail($id);
        $itemName = $item->name;
        $item->delete();

        return redirect()->back()->with('success', "Producto \"{$itemName}\" eliminado correctamente del inventario.");
    }

    /**
     * Print entry voucher format (GLS-ALM-FO-001 / Batch).
     */
    public function printEntry(Request $request, $id = null)
    {
        $ids = [];
        if ($request->filled('ids')) {
            $ids = array_filter(explode(',', $request->input('ids')));
        } elseif ($id) {
            $ids = [$id];
        }

        $query = SupplyInventoryMovement::with(['item', 'user'])
            ->where('movement_type', 'entry');

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('item_code', 'like', "%{$search}%")
                    ->orWhere('reference_document', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type_slug')) {
            $query->where('type_slug', $request->input('type_slug'));
        }

        $movements = $query->orderBy('movement_date', 'desc')->orderBy('id', 'desc')->get();

        if ($movements->isEmpty()) {
            return redirect()->route('apt.inventory.entries.index')->withErrors(['error' => 'No se encontraron registros de entrada para imprimir.']);
        }

        return Inertia::render('APT/Inventory/Movements/PrintEntry', [
            'movements' => $movements,
            'movement' => $movements->first(),
            'users' => \App\Models\User::where('is_blocked', false)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Print exit voucher format (GLS-ALM-FO-002 / Batch).
     */
    public function printExit(Request $request, $id = null)
    {
        $ids = [];
        if ($request->filled('ids')) {
            $ids = array_filter(explode(',', $request->input('ids')));
        } elseif ($id) {
            $ids = [$id];
        }

        $query = SupplyInventoryMovement::with(['item', 'user'])
            ->where('movement_type', 'exit');

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('item_code', 'like', "%{$search}%")
                    ->orWhere('reference_document', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type_slug')) {
            $query->where('type_slug', $request->input('type_slug'));
        }

        $movements = $query->orderBy('movement_date', 'desc')->orderBy('id', 'desc')->get();

        if ($movements->isEmpty()) {
            return redirect()->route('apt.inventory.exits.index')->withErrors(['error' => 'No se encontraron vales de salida para imprimir.']);
        }

        return Inertia::render('APT/Inventory/Movements/PrintExit', [
            'movements' => $movements,
            'movement' => $movements->first(),
        ]);
    }

    /**
     * Print multiple products catalog / inventory report.
     */
    public function printProducts(Request $request)
    {
        $ids = [];
        if ($request->filled('ids')) {
            $ids = array_filter(explode(',', $request->input('ids')));
        }

        $query = SupplyInventoryItem::with('user');

        if (!empty($ids)) {
            $query->whereIn('id', $ids);
        }

        if ($request->filled('type_slug')) {
            $query->where('type_slug', $request->input('type_slug'));
        }

        if ($request->filled('group_number')) {
            $query->where('group_number', (int) $request->input('group_number'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('group_name', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('type_slug')->orderBy('group_number')->orderBy('code')->get();

        if ($items->isEmpty()) {
            return redirect()->route('apt.inventory.products.index')->withErrors(['error' => 'No se encontraron productos para imprimir.']);
        }

        $mode = $request->input('mode');
        if (!$mode) {
            $mode = !empty($ids) ? 'inventory' : 'catalog';
        }

        return Inertia::render('APT/Inventory/Products/PrintProducts', [
            'items' => $items,
            'mode' => $mode,
        ]);
    }
}
