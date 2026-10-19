<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Models\ShipmentOrder;
use App\Models\SalesOrderAdjustment;
use App\Models\SalesOrderAdjustmentItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesOrderAdjustmentController extends Controller
{
    /**
     * Display a listing of adjustments, creation form data and KPIs.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $statusFilter = (string) $request->input('status', 'all');

        $query = SalesOrderAdjustment::with([
            'shipmentOrder.client',
            'shipmentOrder.items.product',
            'originSalesOrder.client',
            'originSalesOrder.product',
            'items.salesOrder.client',
            'items.salesOrder.product',
            'user',
            'reverter',
        ])->orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('shipmentOrder', function ($q2) use ($search) {
                        $q2->where('folio', 'like', "%{$search}%")
                            ->orWhere('tractor_plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('originSalesOrder', function ($q2) use ($search) {
                        $q2->where('folio', 'like', "%{$search}%")
                            ->orWhere('sale_order', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items.salesOrder', function ($q2) use ($search) {
                        $q2->where('folio', 'like', "%{$search}%");
                    });
            });
        }

        if ($statusFilter === 'applied') {
            $query->where('status', 'applied');
        } elseif ($statusFilter === 'reverted') {
            $query->where('status', 'reverted');
        }

        $adjustments = $query->paginate(20)->withQueryString();

        // Overall KPIs
        $totalAdjustments = SalesOrderAdjustment::count();
        $appliedAdjustments = SalesOrderAdjustment::where('status', 'applied')->count();
        $revertedAdjustments = SalesOrderAdjustment::where('status', 'reverted')->count();
        $totalAdjustedTons = (float) SalesOrderAdjustment::where('status', 'applied')->sum('base_weight');

        // Candidate Shipment Orders available to be adjusted (with linked sales order)
        $candidateShipments = ShipmentOrder::with([
            'sales_order.client',
            'sales_order.product',
            'weight_ticket',
            'client',
            'activeAdjustment.items.salesOrder',
        ])
            ->whereNotNull('sales_order_id')
            ->whereNotIn('status', ['cancelled'])
            ->orderBy('created_at', 'desc')
            ->take(150)
            ->get()
            ->map(function ($oe) {
                $pres = strtoupper(trim($oe->presentation ?? ''));
                $isGranel = strpos($pres, 'GRANEL') !== false;

                // Ticket net weight in TM:
                $ticketWeight = $oe->weight_ticket?->net_weight ? round((float)$oe->weight_ticket->net_weight / 1000, 3) : null;
                $progWeight = round((float)($oe->programmed_tons ?: (($oe->programmed_weight ?: 0) / 1000)), 3);

                $baseWeight = $isGranel ? ($ticketWeight ?? $progWeight) : $progWeight;
                $weightType = $isGranel ? ($ticketWeight !== null ? 'PESO_NETO' : 'PROGRAMADO') : 'PROGRAMADO';

                $originSO = $oe->sales_order;

                // Calculate how much available capacity originSO has for THIS specific shipment $oe
                // by excluding trips and adjustments belonging to $oe itself.
                $originAvailableBalance = 0;
                if ($originSO) {
                    $tripsQuery = \App\Models\LoadingOrder::where(function ($q) use ($originSO) {
                            $q->where('sales_order_id', $originSO->id)
                              ->orWhereHas('shipment_order', function ($sq) use ($originSO) {
                                  $sq->where('sales_order_id', $originSO->id);
                              });
                        })
                        ->where('status', '!=', 'cancelled')
                        ->where(function ($q) use ($oe) {
                            $q->where('shipment_order_id', '!=', $oe->id)
                              ->orWhereNull('shipment_order_id');
                        })
                        ->with(['weight_ticket', 'shipment_order.activeAdjustment.items']);

                    $trips = $tripsQuery->get();
                    $otherLoaded = 0;
                    $adjustedShipmentIds = [$oe->id];

                    foreach ($trips as $trip) {
                        $sOrder = $trip->shipment_order;
                        $activeAdj = $sOrder?->activeAdjustment;

                        if ($activeAdj) {
                            $sId = $sOrder->id;
                            if (!in_array($sId, $adjustedShipmentIds)) {
                                $adjustedShipmentIds[] = $sId;
                                $item = $activeAdj->items->firstWhere('sales_order_id', $originSO->id);
                                if ($item) {
                                    $otherLoaded += (float) $item->assigned_weight;
                                }
                            }
                            continue;
                        }

                        if ($trip->weight_ticket && $trip->weight_ticket->weighing_status === 'completed') {
                            $otherLoaded += ((float)$trip->weight_ticket->net_weight / 1000);
                        }
                    }

                    $destAdjustments = \App\Models\SalesOrderAdjustmentItem::where('sales_order_id', $originSO->id)
                        ->where('order_type', 'destination')
                        ->whereHas('adjustment', function ($q) use ($oe) {
                            $q->where('status', 'applied')
                              ->where('shipment_order_id', '!=', $oe->id);
                        })
                        ->sum('assigned_weight');

                    $totalLoadedOther = $otherLoaded + (float)$destAdjustments;
                    $originAvailableBalance = max(0, (float)$originSO->total_quantity - $totalLoadedOther);
                }

                return [
                    'id' => $oe->id,
                    'folio' => $oe->folio,
                    'client_id' => $oe->client_id ?? $originSO?->client_id,
                    'client' => $oe->client?->business_name ?? $oe->client_name ?? $originSO?->client?->business_name ?? 'N/A',
                    'product_id' => $originSO?->product_id,
                    'product' => $oe->product ?? ($originSO?->product?->name ?? 'N/A'),
                    'presentation' => $pres ?: 'GRANEL',
                    'is_granel' => $isGranel,
                    'ticket_net_weight' => $ticketWeight,
                    'programmed_tons' => $progWeight,
                    'base_weight' => $baseWeight,
                    'weight_type' => $weightType,
                    'sales_order_id' => $oe->sales_order_id,
                    'sales_order_folio' => $originSO?->folio ?? 'N/A',
                    'sales_order_total' => (float)($originSO?->total_quantity ?? 0),
                    'sales_order_loaded' => (float)($originSO?->loaded_quantity ?? 0),
                    'sales_order_balance' => round($originAvailableBalance, 3),
                    'has_active_adjustment' => $oe->activeAdjustment !== null,
                    'active_adjustment_folio' => $oe->activeAdjustment?->folio,
                    'active_adjustment_id' => $oe->activeAdjustment?->id,
                    'tractor_plate' => $oe->tractor_plate ?? 'N/A',
                    'operator_name' => $oe->operator_name ?? 'N/A',
                    'date' => $oe->created_at->format('d/m/Y'),
                ];
            });

        // Open Sales Orders (potential destination OVs)
        $openSalesOrders = SalesOrder::with(['client', 'product'])
            ->whereIn('status', ['created', 'open', 'in_progress', 'partially_loaded'])
            ->orWhere(function ($q) {
                $q->whereColumn('loaded_quantity', '<', 'total_quantity');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($so) {
                return [
                    'id' => $so->id,
                    'folio' => $so->folio,
                    'client_id' => $so->client_id,
                    'client_name' => $so->client?->business_name ?? 'N/A',
                    'product_id' => $so->product_id,
                    'product_name' => $so->product?->name ?? 'N/A',
                    'total_quantity' => (float)$so->total_quantity,
                    'loaded_quantity' => (float)$so->loaded_quantity,
                    'balance' => (float)$so->balance,
                    'status' => $so->status,
                ];
            });

        return Inertia::render('Documentation/Adjustments/Index', [
            'adjustments' => $adjustments,
            'candidateShipments' => $candidateShipments,
            'openSalesOrders' => $openSalesOrders,
            'kpis' => [
                'total' => $totalAdjustments,
                'applied' => $appliedAdjustments,
                'reverted' => $revertedAdjustments,
                'total_tons' => $totalAdjustedTons,
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Store a newly created adjustment and redistribute weight.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shipment_order_id' => 'required|exists:shipment_orders,id',
            'origin_sales_order_id' => 'required|exists:sales_orders,id',
            'presentation' => 'required|string',
            'weight_type' => 'required|string',
            'base_weight' => 'required|numeric|min:0.001',
            'notes' => 'nullable|string|max:500',
            'allocations' => 'required|array|min:2',
            'allocations.*.sales_order_id' => 'required|exists:sales_orders,id',
            'allocations.*.order_type' => 'required|in:origin,destination',
            'allocations.*.assigned_weight' => 'required|numeric|min:0.001',
            'allocations.*.notes' => 'nullable|string|max:255',
        ], [
            'allocations.min' => 'Se requiere al menos la orden original y una orden destino para realizar el ajuste.',
            'allocations.*.assigned_weight.min' => 'El peso asignado debe ser mayor a 0.',
        ]);

        $shipment = ShipmentOrder::with(['activeAdjustment', 'sales_order'])->findOrFail($validated['shipment_order_id']);

        if ($shipment->activeAdjustment) {
            return redirect()->back()->withErrors([
                'shipment_order_id' => "La orden de embarque {$shipment->folio} ya cuenta con un ajuste activo ({$shipment->activeAdjustment->folio}). Debes revertirlo primero.",
            ]);
        }

        // Validate that assigned weights sum up to base weight within 0.005 TM tolerance
        $totalAssigned = array_sum(array_column($validated['allocations'], 'assigned_weight'));
        $baseWeight = (float) $validated['base_weight'];

        if (abs($totalAssigned - $baseWeight) > 0.005) {
            return redirect()->back()->withErrors([
                'base_weight' => "La suma de los pesos asignados ({$totalAssigned} TM) no coincide con el peso base del embarque ({$baseWeight} TM). Diferencia: " . round($baseWeight - $totalAssigned, 3) . " TM.",
            ]);
        }

        // Validate compatibility: destination OVs should have the same client and product
        $originSO = SalesOrder::findOrFail($validated['origin_sales_order_id']);

        foreach ($validated['allocations'] as $alloc) {
            if ($alloc['order_type'] === 'destination') {
                $destSO = SalesOrder::find($alloc['sales_order_id']);
                if ($destSO && $destSO->client_id != $originSO->client_id) {
                    return redirect()->back()->withErrors([
                        'allocations' => "La orden de venta destino {$destSO->folio} pertenece a un cliente distinto ({$destSO->client?->business_name}). Debe ser del mismo cliente.",
                    ]);
                }
            }
        }

        DB::beginTransaction();
        try {
            // Generate next Folio AJ-YYYY-####
            $year = now()->year;
            $countThisYear = SalesOrderAdjustment::whereYear('created_at', $year)->count() + 1;
            $folio = sprintf('AJ-%d-%04d', $year, $countThisYear);

            // Ensure uniqueness
            while (SalesOrderAdjustment::where('folio', $folio)->exists()) {
                $countThisYear++;
                $folio = sprintf('AJ-%d-%04d', $year, $countThisYear);
            }

            $adjustment = SalesOrderAdjustment::create([
                'folio' => $folio,
                'shipment_order_id' => $shipment->id,
                'origin_sales_order_id' => $originSO->id,
                'presentation' => strtoupper(trim($validated['presentation'])),
                'weight_type' => strtoupper(trim($validated['weight_type'])),
                'base_weight' => $baseWeight,
                'total_assigned_weight' => $totalAssigned,
                'status' => 'applied',
                'notes' => $validated['notes'] ?? 'Ajuste de distribución de peso por saldo de orden de venta',
                'user_id' => $request->user()?->id,
            ]);

            $affectedSalesOrderIds = [$originSO->id];

            foreach ($validated['allocations'] as $alloc) {
                $targetSO = SalesOrder::find($alloc['sales_order_id']);
                $affectedSalesOrderIds[] = $alloc['sales_order_id'];

                SalesOrderAdjustmentItem::create([
                    'adjustment_id' => $adjustment->id,
                    'sales_order_id' => $alloc['sales_order_id'],
                    'order_type' => $alloc['order_type'],
                    'assigned_weight' => (float)$alloc['assigned_weight'],
                    'previous_balance' => $targetSO?->balance,
                    'notes' => $alloc['notes'] ?? null,
                ]);
            }

            // Sync loaded quantity on all affected sales orders
            $uniqueSOIds = array_unique($affectedSalesOrderIds);
            foreach ($uniqueSOIds as $soId) {
                $so = SalesOrder::find($soId);
                $so?->syncLoadedQuantity();
            }

            DB::commit();

            return redirect()->route('documentation.sales-order-adjustments.index')
                ->with('success', "Ajuste {$adjustment->folio} guardado y aplicado correctamente.");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors([
                'general' => 'Error al guardar el ajuste: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Revert an active adjustment and restore original balances.
     */
    public function revert(Request $request, string $id)
    {
        $adjustment = SalesOrderAdjustment::with(['items', 'shipmentOrder'])->findOrFail($id);

        if ($adjustment->status === 'reverted') {
            return redirect()->back()->withErrors([
                'general' => "El ajuste {$adjustment->folio} ya se encuentra revertido.",
            ]);
        }

        $reason = $request->input('reason', 'Reversión autorizada por usuario');

        DB::beginTransaction();
        try {
            $adjustment->update([
                'status' => 'reverted',
                'reverted_at' => now(),
                'reverted_by' => $request->user()?->id,
                'revert_reason' => $reason,
            ]);

            // Sync all affected sales orders back to their natural state
            $affectedSalesOrderIds = $adjustment->items->pluck('sales_order_id')->unique()->toArray();
            $affectedSalesOrderIds[] = $adjustment->origin_sales_order_id;

            foreach (array_unique($affectedSalesOrderIds) as $soId) {
                $so = SalesOrder::find($soId);
                $so?->syncLoadedQuantity();
            }

            DB::commit();

            return redirect()->back()
                ->with('success', "Ajuste {$adjustment->folio} revertido con éxito. Saldos restaurados.");

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors([
                'general' => 'Error al revertir el ajuste: ' . $e->getMessage(),
            ]);
        }
    }
}
