<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Sales/Index');
    }

    /**
     * Display the Sales Orders History (Consistent with Documentation/Orders/Index)
     */
    public function ordersIndex(Request $request)
    {
        $historicalDate = $request->input('historical_date');
        $cutOff = null;

        if ($historicalDate) {
            // Get the operational range and pick the end of that day as T
            $range = \App\Helpers\OperationalTimeHelper::getOperationalRange($historicalDate);
            $cutOff = $range[1]; // The end of the operational day (e.g., 06:59:59 of the next day)
        }

        $query = \App\Models\SalesOrder::with([
            'client',
            'product',
        ]);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('sale_order', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($cq) use ($search) {
                        $cq->where('business_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($cutOff) {
            // Filter orders created at or before the cut-off 
            // AND ONLY show orders that are currently active (matches user request "en el momento activas")
            $query->where('created_at', '<=', $cutOff)
                  ->whereIn('status', ['created', 'open', 'in_progress']);
        } else {
            // Default status to 'created' if not specified and NOT viewing history
            $statusFilter = $request->input('status', 'created');
            $query->where('status', $statusFilter);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate(100) // Large page for history
            ->withQueryString();

        if ($cutOff) {
            // Transform and filter results to show only open historical data
            $filteredItems = $orders->getCollection()->transform(function ($order) use ($cutOff) {
                // Use the refined model method that counts all trips (direct and indirect)
                $historicalLoaded = $order->calculateLoadedQuantity($cutOff);

                $order->loaded_quantity = $historicalLoaded;
                
                // Set virtual status (Use epsilon 0.001 to avoid floating point 'open' state on full orders)
                if ($historicalLoaded < ($order->total_quantity - 0.001)) {
                    $order->status = 'created'; // "ABIERTA"
                } else {
                    $order->status = 'closed';  // "CERRADA"
                }

                return $order;
            })->filter(function($order) {
                // Show as open in the historical view only if it was indeed open at that time
                return $order->status === 'created';
            })->values();

            $orders->setCollection($filteredItems);
        }

        return Inertia::render('Sales/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $request->input('search'),
                'status' => $cutOff ? 'historical' : ($request->input('status') ?? 'created'),
                'historical_date' => $historicalDate,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ]);
    }

    /**
     * Get detailed trip breakdown for a specific Sales Order (AJAX)
     */
    public function breakdown(Request $request, string $id)
    {
        $order = \App\Models\SalesOrder::findOrFail($id);

        $loading_orders = $order->loading_orders()
            ->with(['weight_ticket', 'shipment_order', 'driver', 'transporter'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($loading_orders);
    }

    public function create()
    {
        // Get all existing folios from SalesOrder
        $folios = \App\Models\SalesOrder::pluck('folio')->toArray();
        $suggestedFolios = [];
        $patterns = [];

        foreach ($folios as $folio) {
            // Match pattern: ends with -NUMBER (e.g., OV-AMO-25-1)
            // Use - separator specifically based on user request "OV-AMO-25-2"
            if (preg_match('/^(.*)-(\d+)$/', $folio, $matches)) {
                $prefix = $matches[1];
                $number = intval($matches[2]);

                if (!isset($patterns[$prefix]) || $number > $patterns[$prefix]) {
                    $patterns[$prefix] = $number;
                }
            }
        }

        foreach ($patterns as $prefix => $maxNumber) {
            $suggestedFolios[] = $prefix . '-' . ($maxNumber + 1);
        }

        // Default if empty
        if (empty($suggestedFolios)) {
            $suggestedFolios[] = 'OV-' . date('Y') . '-1';
        }

        // Sort descending
        rsort($suggestedFolios);

        return Inertia::render('Sales/Create', [
            'clients' => \App\Models\Client::all(),
            'products' => \App\Models\Product::all(),
            'vessels' => \App\Models\Vessel::active()->get(),
            'suggested_folios' => array_values($suggestedFolios),
            'default_folio' => ''
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'folio' => 'required|string',
                'sale_order' => 'required|string',
                'sale_conditions' => 'nullable|string',
                'delivery_conditions' => 'nullable|string',
                'client_id' => 'required|exists:clients,id',
                'product_id' => 'required|exists:products,id',
                'vessel_id' => 'nullable|exists:vessels,id',
                'quantity' => 'required|numeric|min:0.1',
                'destination' => 'nullable|string',
            ]);

            $order = \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
                $order = \App\Models\SalesOrder::create([
                    'folio' => $validated['folio'],
                    'sale_order' => $validated['sale_order'],
                    'sale_conditions' => $validated['sale_conditions'] ?? null,
                    'delivery_conditions' => $validated['delivery_conditions'] ?? null,
                    'client_id' => $validated['client_id'],
                    'product_id' => $validated['product_id'],
                    'vessel_id' => $validated['vessel_id'] ?? null,
                    'total_quantity' => $validated['quantity'],
                    'status' => 'created',
                    'destination' => $validated['destination'] ?? null,
                ]);

                return $order;
            });

            // Redirect to print view
            return redirect()->route('sales.print', $order->id);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Sales Store Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al guardar la orden: ' . $e->getMessage()]);
        }
    }

    public function show(Request $request, string $id)
    {
        $order = \App\Models\SalesOrder::with(['client', 'product', 'shipments.weight_ticket'])
            ->findOrFail($id);

        return Inertia::render('Sales/Show', [
            'order' => $order,
            'context_module' => $request->input('module', 'sales')
        ]);
    }

    public function print(string $id)
    {
        $order = \App\Models\SalesOrder::with(['client', 'product'])
            ->findOrFail($id);

        return Inertia::render('Sales/Print', [
            'order' => $order
        ]);
    }

    public function edit(Request $request, string $id)
    {
        $order = \App\Models\SalesOrder::with(['client', 'product'])->findOrFail($id);

        if ($order->status !== 'created') {
            return redirect()->route('sales.orders.index')->withErrors(['message' => 'Solo se pueden editar órdenes en estatus CREADO.']);
        }

        return Inertia::render('Sales/Edit', [
            'order' => $order,
            'clients' => \App\Models\Client::all(),
            'products' => \App\Models\Product::all(),
            'vessels' => \App\Models\Vessel::active()->get(),
            'context_module' => $request->input('module', 'sales')
        ]);
    }

    public function update(Request $request, string $id)
    {
        $order = \App\Models\SalesOrder::findOrFail($id);

        if ($order->status !== 'created') {
            return redirect()->back()->withErrors(['message' => 'No se puede editar una orden en proceso.']);
        }

        $validated = $request->validate([
            'folio' => 'required|string',
            'sale_order' => 'required|string',
            'sale_conditions' => 'nullable|string',
            'delivery_conditions' => 'nullable|string',
            'client_id' => 'required|exists:clients,id',
            'product_id' => 'required|exists:products,id',
            'vessel_id' => 'nullable|exists:vessels,id',
            'quantity' => 'required|numeric|min:0.1',
            'destination' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $order) {
            $order->update([
                'folio' => $validated['folio'],
                'sale_order' => $validated['sale_order'],
                'sale_conditions' => $validated['sale_conditions'] ?? null,
                'delivery_conditions' => $validated['delivery_conditions'] ?? null,
                'client_id' => $validated['client_id'],
                'product_id' => $validated['product_id'],
                'vessel_id' => $validated['vessel_id'] ?? null,
                'total_quantity' => $validated['quantity'],
                'destination' => $validated['destination'] ?? null,
            ]);
        });

        return redirect()->route('sales.orders.index')->with('success', 'Orden actualizada correctamente.');
    }

    public function destroy(string $id)
    {
        $order = \App\Models\SalesOrder::findOrFail($id);

        if ($order->status !== 'created') {
            return redirect()->back()->withErrors(['message' => 'Solo se pueden cancelar órdenes en estatus CREADO.']);
        }

        $order->delete();

        return redirect()->route('sales.orders.index')->with('success', 'Orden eliminada (cancelada) correctamente.');
    }

    public function toggleStatus(string $id)
    {
        $order = \App\Models\SalesOrder::findOrFail($id);

        if ($order->status === 'created') {
            $order->update(['status' => 'closed']);
            $message = 'Orden CERRADA correctamente.';
        } elseif ($order->status === 'closed') {
            $order->update(['status' => 'created']);
            $message = 'Orden ABIERTA correctamente.';
        } else {
            return redirect()->back()->withErrors(['message' => 'No se puede cambiar el estatus de esta orden.']);
        }

        return redirect()->back()->with('success', $message);
    }
}
