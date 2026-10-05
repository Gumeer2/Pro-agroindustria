<?php

namespace App\Http\Controllers;

use App\Models\LoadingOrder;
use App\Models\WeightTicket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Vessel; // Assuming we need this for origin/destination if related
use App\Models\VesselOperator; // Legacy fallback?
use App\Models\ShipmentOrder;
use App\Helpers\OperationalTimeHelper;






class WeightTicketController extends Controller
{
    public function index(Request $request)
    {
        $activeTab = $request->input('tab', 'sale');

        // 2. Pending Exit (Ticket In Progress OR Status Loading)
        $query = LoadingOrder::with([
            'client',
            'driver',
            'vehicle',
            'product',
            'weight_ticket',
            'exit_operator',
            'vessel_operator',
            'shipment_order.items.product',
            'shipment_order.client',
            'vessel'
        ])
            ->whereHas('weight_ticket', function ($q) {
                $q->where('weighing_status', 'in_progress')
                    ->where('is_burreo', false);
            })
            // VALIDATION: Hide units for Vessels with Foreman + External Warehouse until they register Dock Trip
            ->whereNot(function ($q) {
                $q->whereNotNull('vessel_id')
                    ->whereHas('vessel', function ($v) {
                        $v->where('has_chief_foreman', true)
                            ->where('is_external_warehouse', true);
                    })
                    ->whereNull('vessel_operator_trip_id');
            });

        if ($request->filled('client_id')) {
            $clientId = $request->client_id;
            if ($activeTab === 'sale') {
                $query->whereHas('shipment_order', function ($sub) use ($clientId) {
                    $sub->where('client_id', $clientId);
                });
            } else {
                $query->where(function ($q) use ($clientId) {
                    $q->where('client_id', $clientId)
                        ->orWhereHas('vessel', function ($v) use ($clientId) {
                            $v->where('client_id', $clientId);
                        });
                });
            }
        }

        if ($request->filled('product_id')) {
            // Check direct, shipment order items, and sales order product
            $query->where(function ($q) use ($request) {
                $q->where('product_id', $request->product_id)
                    ->orWhereHas('shipment_order.items', function ($sub) use ($request) {
                        $sub->where('product_id', $request->product_id);
                    })
                    ->orWhereHas('shipment_order.sales_order', function ($sub) use ($request) {
                        $sub->where('product_id', $request->product_id);
                    });
            });
        }

        if ($request->filled('warehouse')) {
            $query->where('warehouse', $request->warehouse);
        }

        if ($request->filled('presentation')) {
            $query->whereHas('shipment_order', function ($sub) use ($request) {
                $sub->where('presentation', $request->presentation);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhere('tractor_plate', 'like', "%{$search}%")
                    ->orWhere('trailer_plate', 'like', "%{$search}%")
                    ->orWhereHas('shipment_order', function ($sub) use ($search) {
                        $sub->where('folio', 'like', "%{$search}%")
                            ->orWhere('operator_name', 'like', "%{$search}%")
                            ->orWhere('tractor_plate', 'like', "%{$search}%")
                            ->orWhere('trailer_plate', 'like', "%{$search}%");
                    });
            });
        }

        // NEW: Calculate Total Active Units across all tabs (sale + vessel)
        // This ignores the 'tab' filter but respects all other filters (search, client, product, etc)
        $total_active_units = (clone $query)->count();

        if ($activeTab === 'sale') {
            $query->whereNotNull('shipment_order_id');
        } else {
            $query->whereNull('shipment_order_id');
        }

        if ($request->filled('scale_id')) {
            $scaleId = $request->scale_id;
            $query->whereHas('weight_ticket', function ($q) use ($scaleId) {
                $q->where('scale_id', $scaleId);
            });
        }



        // Clone query BEFORE pagination to get dynamic filter options
        $all_pending = (clone $query)->get();

        // Restore Filter Options (Nested relations for dynamic selection)
        // Dynamic Filter Options (Only what is in the table after ALL filters)
        $warehouses = $all_pending->pluck('warehouse')->unique()->filter()->values();

        // Products: ONLY those present in the current filtered list
        $productIds = $all_pending->flatMap(function ($order) {
            $ids = [];
            if ($order->product_id)
                $ids[] = $order->product_id;
            if ($order->shipment_order?->product_id)
                $ids[] = $order->shipment_order->product_id;
            if ($order->shipment_order?->sales_order?->product_id)
                $ids[] = $order->shipment_order->sales_order->product_id;
            return $ids;
        })->unique()->filter()->values();

        $products = \App\Models\Product::whereIn('id', $productIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        $clientIds = $all_pending->flatMap(function ($order) use ($activeTab) {
            $ids = [];
            if ($activeTab === 'sale') {
                if ($order->shipment_order?->client_id) {
                    $ids[] = $order->shipment_order->client_id;
                }
            } else {
                if ($order->client_id) {
                    $ids[] = $order->client_id;
                }
                if ($order->vessel?->client_id) {
                    $ids[] = $order->vessel->client_id;
                }
            }
            return $ids;
        })->unique()->filter()->values();

        $clients = \App\Models\Client::whereIn('id', $clientIds)
            ->orderBy('business_name')
            ->get(['id', 'business_name']);

        $pending_exit_paginated = $query->orderBy('entry_at', 'asc')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($order) {
                // Prioritize active (in_progress) ticket over cancelled ones
                $ticket = $order->weight_ticket;
                if ($ticket && $ticket->weighing_status === 'cancelled') {
                    // This logic is mostly for safety as the query filters in_progress, 
                    // but sometimes primary weight_ticket relation might catch an older one first.
                    $activeTicket = \App\Models\WeightTicket::where('loading_order_id', $order->id)
                        ->where('weighing_status', 'in_progress')
                        ->first();
                    $ticket = $activeTicket ?: $ticket;
                }

                $operatorName = $order->operator_name ?? $order->driver->name ?? 'N/A';
                $tractorPlate = $order->tractor_plate;
                $trailerPlate = $order->trailer_plate ?? 'N/A';

                if ($order->shipment_order_id && $order->shipment_order) {
                    $operatorName = $order->shipment_order->operator_name ?? $operatorName;
                    $tractorPlate = $order->shipment_order->tractor_plate ?? $tractorPlate;
                    $trailerPlate = $order->shipment_order->trailer_plate ?? $trailerPlate;
                }

                $programmedWeight = $order->shipment_order?->programmed_tons ?? $order->programmed_tons ?? 'N/A';
                $presentation = $order->shipment_order?->presentation ?? 'GRANEL';
                $productName = $order->product?->name ?? $order->shipment_order?->product?->name ?? $order->shipment_order?->product ?? 'N/A';

                // If it's Envasado, ensure we show the bag size
                if (strtoupper($presentation) === 'ENVASADO') {
                    $sacksCount = $order->shipment_order?->sacks_count;
                    // If productName doesn't contain the size but sacksCount looks like it has it (e.g. "25 KG")
                    if (!preg_match('/\d+\s*KG/i', $productName) && $sacksCount && preg_match('/\d+\s*KG/i', $sacksCount)) {
                        $productName .= " - " . $sacksCount;
                    }
                }

                $canDestare = true;
                if ($order->shipment_order_id && $order->shipment_order) {
                    $canDestare = !empty($order->shipment_order->loading_finished_at) || $order->shipment_order->status === 'loaded';
                }

                return [
                    'id' => $order->id,
                    'folio' => $order->folio,
                    'provider' => $order->shipment_order?->client?->business_name ?? $order->shipment_order?->client?->name ?? $order->client_name,
                    'product' => $productName,
                    'entry_weight' => $ticket->tare_weight,
                    'vehicle_plate' => $tractorPlate,
                    'trailer_plate' => $trailerPlate,
                    'driver' => $operatorName,
                    'transport_line' => $order->transport_company,
                    'economic_number' => $order->economic_number ?? 'N/A',
                    'warehouse' => $order->warehouse ?? 'N/A',
                    'cubicle' => $order->cubicle ?? 'N/A',
                    'reference' => $order->reference ?? ($order->shipment_order?->customer_reference ?? 'N/A'),
                    'consignee' => $order->consignee ?? ($order->shipment_order?->consignee ?? 'N/A'),
                    'programmed_weight' => $programmedWeight,
                    'entry_at' => $order->entry_at,
                    'type' => $order->shipment_order_id ? 'sale' : 'vessel',
                    'oe_folio' => $order->shipment_order?->folio ?? 'N/A',
                    'can_destare' => $canDestare,
                    'has_loaded_finished' => $canDestare,
                    'real_transport_line' => $order->shipment_order_id
                        ? ($order->exit_operator->real_transport_line ?? (\App\Models\ExitOperator::where('name', $order->operator_name)->where('tractor_plate', $order->tractor_plate)->value('real_transport_line') ?? $order->transport_company))
                        : ($order->vessel_operator->transporter_line ?? (\App\Models\VesselOperator::where('operator_name', $order->operator_name)->where('tractor_plate', $order->tractor_plate)->value('transporter_line') ?? $order->transport_company)),
                    'vessel_name' => $order->vessel->name ?? 'N/A',
                    'unit_type' => $order->shipment_order_id
                        ? ($order->exit_operator->unit_type ?? (\App\Models\ExitOperator::where('name', $order->operator_name)->where('tractor_plate', $order->tractor_plate)->value('unit_type') ?? ($order->shipment_order->unit_type ?? 'N/A')))
                        : 'N/A',
                ];
            });

        return Inertia::render('Scale/Index', [
            'pending_entry' => [], // Removed submodule mapping as requested
            'pending_exit' => $pending_exit_paginated,
            'total_active_units' => $total_active_units, // Added specifically for the menu button count
            'clients' => $clients,
            'products' => $products,
            'warehouses' => $warehouses,
            'filters' => $request->only(['client_id', 'product_id', 'warehouse', 'presentation', 'search', 'tab']),
        ]);
    }

    // --- Ticket Management Section ---

    public function tickets(Request $request)
    {
        // Auto-sync any existing cancelled vessel orders in loading_orders
        LoadingOrder::where(function ($q) {
            $q->whereNotNull('vessel_id')->orWhereNull('shipment_order_id');
        })
            ->whereHas('weight_ticket', function ($q) {
                $q->where('weighing_status', 'cancelled');
            })
            ->where(function ($q) {
                $q->where('status', '!=', 'cancelled')
                    ->orWhere('destare_status', '!=', 'completed');
            })
            ->update([
                'status' => 'cancelled',
                'destare_status' => 'completed',
            ]);

        $filters = $request->only(['search', 'date', 'tab', 'status', 'scale_id']);
        $activeTab = $request->input('tab', 'sale');
        $status = $request->input('status', 'active'); // Default to active (pending + completed)

        $query = WeightTicket::with([
            'loadingOrder' => function ($q) {
                // Vessel / Import
                $q->with(['client', 'product', 'driver', 'vehicle', 'vessel.client', 'vessel.product', 'sales_order', 'shipment_order.client', 'shipment_order.items.product']);
            },
            'shipmentOrder' => function ($q) {
                // Sales / Export
                $q->with(['client', 'product', 'driver', 'vehicle', 'sales_order.product', 'items.product']);
            },
            'weighmaster',
            'documenter'
        ])
            ->where('is_burreo', false) // EXCLUDE BURREO
            ->where(function ($q) {
                // EXCLUDE ORPHANED TICKETS: Must have at least one valid link
                $q->has('loadingOrder')->orHas('shipmentOrder');
            });

        // Status Filtering
        if ($status === 'active') {
            $query->whereIn('weighing_status', ['in_progress', 'completed']);
        } elseif ($status === 'pending') {
            $query->where('weighing_status', 'in_progress');
        } elseif ($status === 'completed') {
            $query->where('weighing_status', 'completed');
        } elseif ($status === 'cancelled') {
            $query->where('weighing_status', 'cancelled');
        }

        // Tab Filtering
        if ($activeTab === 'sale') {
            // "Ventas" (SALIDA) must have a Shipment Order AND NOT be linked to a Vessel
            $query->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNotNull('shipment_order_id')
                        ->whereHas('loadingOrder', function ($lo) {
                            $lo->whereNull('vessel_id');
                        });
                })->orWhere(function ($sub) {
                    $sub->whereHas('loadingOrder', function ($lo) {
                        $lo->whereNotNull('shipment_order_id')
                            ->whereNull('vessel_id');
                    });
                })->orWhere(function ($sub) {
                    // Legacy ShipmentOrder tickets without loadingOrder
                    $sub->whereNotNull('shipment_order_id')
                        ->whereDoesntHave('loadingOrder');
                });
            });
        } elseif ($activeTab === 'vessel') {
            // "Barcos/Descarga" (DESCARGA) is everything else:
            // 1. Has a Vessel linked
            // 2. OR Does not have a Shipment Order linked
            $query->where(function ($q) {
                $q->whereHas('loadingOrder', function ($lo) {
                    $lo->whereNotNull('vessel_id')
                        ->orWhereNull('shipment_order_id');
                })->orWhere(function ($sub) {
                    $sub->whereNull('shipment_order_id')
                        ->whereDoesntHave('loadingOrder');
                });
            });
        }

        $query->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                    ->orWhereHas('loadingOrder', function ($lo) use ($search) {
                        $lo->where('folio', 'like', "%{$search}%")
                            ->orWhere('operator_name', 'like', "%{$search}%")
                            ->orWhere('tractor_plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('shipmentOrder', function ($so) use ($search) {
                        $so->where('folio', 'like', "%{$search}%")
                            ->orWhere('operator_name', 'like', "%{$search}%")
                            ->orWhere('tractor_plate', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('date')) {
            $range = OperationalTimeHelper::getOperationalRange($request->date);
            $query->whereBetween('created_at', $range);
        }

        $tickets = $query->paginate(10)
            ->withQueryString()
            ->through(function ($ticket) {
                // Robust Resolution for Client and Product
                $loadingOrder = $ticket->loadingOrder;
                $shipmentOrder = $ticket->shipmentOrder ?? $loadingOrder?->shipment_order;

                // Determine if it's a Sale-related operation (O.E.)
                $isSale = $shipmentOrder && (!$loadingOrder || empty($loadingOrder->vessel_id));

                // Folio resolution
                $folio = $shipmentOrder->folio ?? ($loadingOrder->folio ?? ($ticket->folio ?? 'N/A'));

                // Driver/Vehicle resolution
                $driver = $loadingOrder->operator_name ?? ($shipmentOrder->operator_name ?? 'N/A');
                $plate = $loadingOrder->tractor_plate ?? ($shipmentOrder->tractor_plate ?? 'N/A');

                if ($isSale) {
                    $driver = $shipmentOrder->operator_name ?? $driver;
                    $plate = $shipmentOrder->tractor_plate ?? $plate;
                }

                // 1. Resolve Product Name
                $productName = 'N/A';
                if ($isSale && $shipmentOrder) {
                    // Try items first
                    $productName = $shipmentOrder->items->first()?->product?->name
                        ?? (is_string($shipmentOrder->product) ? $shipmentOrder->product : ($shipmentOrder->product->name ?? 'N/A'));
                } elseif ($loadingOrder && $loadingOrder->vessel) {
                    $productName = $loadingOrder->vessel->product->name ?? 'N/A';
                }

                if ($productName === 'N/A' && $loadingOrder) {
                    $productName = $loadingOrder->product?->name
                        ?? (is_string($loadingOrder->product) ? $loadingOrder->product : 'N/A');
                }

                // 2. Resolve Provider Name (Client / Vessel)
                $providerName = 'N/A';
                if ($isSale && $shipmentOrder) {
                    // Priority for Sales: Use OE commercial client
                    $providerName = $shipmentOrder->client->business_name ?? $shipmentOrder->client->name ?? 'N/A';
                } elseif ($loadingOrder && $loadingOrder->vessel) {
                    // Priority for Discharges: Use Vessel NAME (User's specific request)
                    $providerName = $loadingOrder->vessel->name ?? 'N/A';

                    // If name is missing, fallback to client
                    if ($providerName === 'N/A') {
                        $providerName = $loadingOrder->vessel->client->business_name ?? $loadingOrder->vessel->client->name ?? 'N/A';
                    }
                }

                // Final fallbacks for Provider (Scale entries might have a generic client 1)
                if ($providerName === 'N/A' || $providerName === 'PROAGRO') {
                    $providerName = $loadingOrder?->client_name
                        ?? ($loadingOrder?->client?->business_name
                            ?? ($shipmentOrder?->client?->business_name ?? 'N/A'));
                }

                $saleOrder = $shipmentOrder->sale_order_folio ?? ($loadingOrder->sale_order_folio ?? 'S/A');

                return [
                    'id' => $loadingOrder->id ?? ($shipmentOrder->id ?? $ticket->id),
                    'ticket_id' => $ticket->id,
                    'folio' => $folio,
                    'ticket_number' => $ticket->ticket_number,
                    'operation' => $isSale ? 'SALIDA' : 'DESCARGA',
                    'driver' => $driver,
                    'vehicle_plate' => $plate,
                    'product' => $productName,
                    'provider' => $providerName,
                    'sale_order' => $saleOrder,
                    'status' => $ticket->weighing_status,
                    'entry_at' => $ticket->weigh_in_at,
                    'exit_at' => $ticket->weigh_out_at,
                    'tare_weight' => $ticket->tare_weight,
                    'gross_weight' => $ticket->gross_weight,
                    'net_weight' => $ticket->net_weight,
                    'is_shipment_order' => !!$shipmentOrder,
                    'documenter' => $ticket->documenter?->name ?? 'N/A',
                    'weighmaster' => $ticket->weighmaster?->name ?? 'N/A',
                ];
            });

        return Inertia::render('Scale/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters
        ]);
    }

    public function editTicket($id)
    {
        // Try LoadingOrder first
        $order = LoadingOrder::with(['weight_ticket', 'client', 'vessel.client', 'product', 'shipment_order.client'])->find($id);

        if (!$order) {
            $order = \App\Models\ShipmentOrder::with(['weight_ticket', 'client', 'product', 'items.product'])->find($id);
        }

        if (!$order || !$order->weight_ticket) {
            return back()->withErrors(['error' => 'Ticket no encontrado.']);
        }

        $activeLots = \App\Models\Lot::where('status', 'open')->orderBy('created_at', 'desc')->get(['id', 'folio', 'observations']);
        $documenters = \App\Models\User::role('Documentador')->where('is_blocked', false)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Scale/Tickets/Edit', [
            'ticket' => $order->weight_ticket,
            'order' => $order,
            'active_lots' => $activeLots,
            'documenters' => $documenters
        ]);
    }

    public function updateTicket(Request $request, $id)
    {
        // $id is Order ID (logic from edit link)
        $order = LoadingOrder::with('weight_ticket')->find($id);
        if (!$order)
            $order = \App\Models\ShipmentOrder::with(['weight_ticket'])->find($id);

        if (!$order)
            abort(404, 'Orden no encontrada');

        $ticket = $order->weight_ticket;

        $validated = $request->validate([
            'tare_weight' => 'required|numeric|min:0',
            'gross_weight' => 'required|numeric|min:0',
            'net_weight' => 'required|numeric|min:0', // calculated usually, but allowed to edit?
            'lot_id' => 'nullable|exists:lots,id',
            'packaging_type' => 'nullable|string',
            'warehouse' => 'nullable|string',
            'observations' => 'nullable|string',
            'documenter_id' => 'required|exists:users,id',
        ]);

        $ticket->update([
            'tare_weight' => $validated['tare_weight'],
            'gross_weight' => $validated['gross_weight'],
            'net_weight' => $validated['net_weight'],
            'lot_id' => $validated['lot_id'],
            'packaging_type' => $validated['packaging_type'],
            'documenter_id' => $validated['documenter_id'],
        ]);

        // Sync Sales Order if linked
        if ($order->sales_order_id) {
            $order->sales_order?->syncLoadedQuantity();
        } elseif ($order instanceof \App\Models\ShipmentOrder && $order->sales_order_id) {
            $order->sales_order?->syncLoadedQuantity();
        }

        // Determine Warehouse to update in LoadingOrder and ShipmentOrder
        $finalWarehouse = null; // Default to null for cleanup
        if (!empty($validated['lot_id'])) {
            $lot = \App\Models\Lot::find($validated['lot_id']);
            if ($lot && $lot->warehouse) {
                $finalWarehouse = $lot->warehouse;
            }
        } elseif (!empty($validated['warehouse']) && $validated['warehouse'] !== 'N/A') {
            $finalWarehouse = $validated['warehouse'];
        }

        // Always ensure both the OE and the linked LoadingOrder reflect the correct warehouse
        // This update will now correctly set 'warehouse' to NULL if $finalWarehouse is null
        $order->update(['warehouse' => $finalWarehouse]);
        if ($order instanceof \App\Models\ShipmentOrder) {
            // Also update the first loading order to ensure data consistency for queries
            $order->loadingOrders()->first()?->update(['warehouse' => $finalWarehouse]);
        }

        // Also update Order observations if needed
        if ($request->has('observations')) {
            $order->update(['observations' => $validated['observations']]);
        }

        return redirect()->route('scale.tickets.index')->with('success', 'Ticket actualizado correctamente.');
    }

    public function destroyTicket($id)
    {
        try {
            DB::transaction(function () use ($id) {
                // $id is Order ID
                $order = LoadingOrder::with('weight_ticket')->findOrFail($id);

                if ($order->weight_ticket) {
                    $order->weight_ticket->delete();
                }

                // Sync Sales Order if linked
                if ($order->sales_order_id) {
                    $order->sales_order?->syncLoadedQuantity();
                }

                // Reset Order
                // "Authorized" allows creating a new ticket (Entry).
                $order->update([
                    'status' => 'authorized', // Revert to pre-scale status
                    'destare_status' => 'pending', // Reset to default (cannot be null)
                ]);
            });

            return redirect()->back()->with('success', 'Ticket eliminado permanentemente. La orden ha vuelto a estado "Autorizado".');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error deleting ticket: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al eliminar ticket: ' . $e->getMessage()]);
        }
    }

    public function cancelTicket($id)
    {
        try {
            DB::transaction(function () use ($id) {
                // $id can be LoadingOrder ID (UUID) or WeightTicket ID (int)
                $ticket = WeightTicket::find($id);
                $order = null;

                if ($ticket) {
                    $order = $ticket->loadingOrder;
                } else {
                    $order = LoadingOrder::find($id);
                    if ($order) {
                        $ticket = $order->weight_ticket ?? WeightTicket::where('loading_order_id', $order->id)->first();
                    }
                }

                if (!$ticket && !$order) {
                    throw new \Exception("Ticket u Orden no encontrada.");
                }

                // 1. Mark ticket as cancelled
                if ($ticket) {
                    $ticket->update(['weighing_status' => 'cancelled']);
                }

                // 2. Revert Loading Order status to allow re-processing if it was linked
                if ($order) {
                    $isVessel = $order->vessel_id || !$order->shipment_order_id;

                    if ($isVessel) {
                        $order->update([
                            'status' => 'cancelled',
                            'destare_status' => 'completed',
                        ]);
                    } else {
                        $order->update([
                            'status' => 'authorized',
                            'destare_status' => 'pending'
                        ]);

                        // Revert Shipment Order status if linked
                        if ($order->shipment_order_id) {
                            $order->shipment_order?->update(['status' => 'authorized']);
                        }

                        // Sync Sales Order if linked
                        if ($order->sales_order_id) {
                            $order->sales_order?->syncLoadedQuantity();
                        }
                    }
                }
            });

            return redirect()->back()->with('success', 'Ticket cancelado correctamente. El registro permanece en el historial.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error cancelling ticket: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al cancelar ticket: ' . $e->getMessage()]);
        }
    }

    // --- New Methods for Entry MI / MP ---

    public function createEntry(Request $request)
    {
        $scaleId = $request->query('scale_id', 1); // Default to 1 if not provided

        $burreoVessels = Vessel::with(['client', 'product'])
            ->where('status', 'active')
            ->where('apt_operation_type', 'burreo')
            ->orderBy('created_at', 'desc')
            ->get();

        $burreoStats = [];
        foreach ($burreoVessels as $bv) {
            $burreoStats[] = \App\Services\BurreoWeightService::getVesselBurreoStats($bv->id);
        }

        return Inertia::render('Scale/EntryMP', [
            'active_scale_id' => (int) $scaleId,
            'burreo_vessels' => $burreoStats,
        ]);
    }

    public function createEntrySale(Request $request)
    {
        $scaleId = $request->query('scale_id', 1);

        $pendingShipmentOrders = \App\Models\ShipmentOrder::whereDoesntHave('weight_ticket', function ($q) {
            $q->where('weighing_status', '!=', 'cancelled');
        })
            ->where('status', '!=', 'cancelled')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'folio', 'operator_name']);

        return Inertia::render('Scale/EntrySale', [
            'active_scale_id' => (int) $scaleId,
            'pending_shipment_orders' => $pendingShipmentOrders
        ]);
    }

    public function createExit(Request $request, $id = null)
    {
        $orderData = null;
        $order = null;
        $assignedLotId = null;

        if ($id) {
            $order = LoadingOrder::with(['client', 'product', 'driver', 'vehicle', 'transporter', 'weight_ticket', 'shipment_order.lot', 'vessel', 'lot'])
                ->findOrFail($id);

            // VALIDATION: For Sales / Shipment Orders, block destare if not finalized in Shipment Process module
            if ($order->shipment_order_id && $order->shipment_order) {
                $hasLoadedFinished = !empty($order->shipment_order->loading_finished_at) || $order->shipment_order->status === 'loaded';
                if (!$hasLoadedFinished) {
                    return redirect()->route('scale.index', [
                        'scale_id' => $request->input('scale_id', 1),
                        'view' => 'table',
                        'tab' => 'sale',
                    ])->with('error', 'ALERTA: Operación Bloqueada. La orden de embarque (' . ($order->shipment_order->folio ?? $order->folio) . ') no ha finalizado su proceso en el módulo de Gestión de Proceso de Embarques.');
                }
            }

            $assignedLotId = $order->shipment_order?->lot_id ?? $order->lot_id ?? null;

            $productName = 'N/A';
            if ($order->product_id) {
                $productName = $order->product->name ?? 'N/A';
            }
            if ($productName === 'N/A' && $order->shipment_order_id && $order->shipment_order) {
                $productName = $order->shipment_order->product ?? 'N/A'; // snapshot
                if ($productName === 'N/A') {
                    $productName = $order->shipment_order->items->first()?->product->name ?? 'N/A';
                }
            }

            // Programmed weight logic (In Tons for Sales/Salida as requested)
            $progWeight = 0;
            if ($order->shipment_order_id && $order->shipment_order) {
                if ($order->shipment_order->programmed_tons > 0) {
                    $progWeight = $order->shipment_order->programmed_tons; // Already in Tons
                } else {
                    $totalKg = $order->shipment_order->items->sum('requested_quantity') ?? 0;
                    $progWeight = $totalKg > 0 ? ($totalKg / 1000) : 0; // Convert to Tons
                }
            }

            $driver = $order->operator_name ?? ($order->driver->name ?? 'N/A');
            $tractorPlate = $order->tractor_plate ?? ($order->vehicle->plate ?? 'N/A');
            $trailerPlate = $order->trailer_plate ?? ($order->vehicle->trailer_plate ?? 'N/A');

            // SALES PRIORITY
            if ($order->shipment_order_id && $order->shipment_order) {
                $driver = $order->shipment_order->operator_name ?? $driver;
                $tractorPlate = $order->shipment_order->tractor_plate ?? $tractorPlate;
                $trailerPlate = $order->shipment_order->trailer_plate ?? $trailerPlate;
            }

            $assignedWarehouse = $order->shipment_order?->warehouse
                ?? $order->warehouse
                ?? $order->shipment_order?->lot?->warehouse
                ?? $order->lot?->warehouse
                ?? 'N/A';

            $orderData = [
                'id' => $order->id,
                'folio' => $order->folio,
                'provider' => $order->shipment_order?->client?->business_name
                    ?? $order->shipment_order?->client?->name
                    ?? ($order->client_name ?? ($order->client->business_name ?? 'N/A')),
                'product' => $productName,
                'driver' => $driver,
                'vehicle_plate' => $tractorPlate,
                'trailer_plate' => $trailerPlate,
                'transport_line' => $order->transport_company ?? ($order->transporter->name ?? 'N/A'),
                'entry_weight' => $order->weight_ticket->tare_weight ?? 0,
                'warehouse' => $assignedWarehouse,
                'cubicle' => $order->shipment_order?->lot?->cubicle ?? $order->cubicle ?? 'N/A',
                'lot_id' => $assignedLotId,
                'lot_folio' => $order->shipment_order?->lot?->folio ?? $order->lot?->folio ?? null,
                'lot_observations' => $order->shipment_order?->lot?->observations ?? $order->weight_ticket?->lot?->observations ?? null,
                'reference' => $order->reference ?? ($order->request_id ?? ''),
                'consignee' => $order->consignee ?? ($order->consigned_to ?? ''),
                'programmed_weight' => $progWeight,
                'type' => $order->shipment_order_id ? 'sale' : 'vessel',
                'presentation' => $order->shipment_order?->presentation ?? 'GRANEL', // Crucial for dynamic validation
                'programmed_tons' => $order->shipment_order->programmed_tons ?? 0,
                'oe_folio' => $order->shipment_order?->folio ?? null,
                'observations' => $order->observations ?? '',
                'is_external_warehouse' => (bool) ($order->vessel?->is_external_warehouse ?? false),
                'has_chief_foreman' => (bool) ($order->vessel?->has_chief_foreman ?? false),
            ];
        }

        $activeLots = \App\Models\Lot::where(function ($q) use ($assignedLotId) {
            $q->where('status', 'open');
            if ($assignedLotId) {
                $q->orWhere('id', $assignedLotId);
            }
        })->orderBy('created_at', 'desc')->get(['id', 'folio', 'warehouse', 'observations']);

        $documenters = \App\Models\User::role('Documentador')->where('is_blocked', false)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Scale/ExitMP', [
            'order' => $orderData,
            'active_scale_id' => (int) $request->input('scale_id', 1),
            'active_lots' => $activeLots,
            'documenters' => $documenters,
        ]);
    }

    public function searchFolio(Request $request)
    {
        $folio = $request->input('folio');

        if (!$folio) {
            return response()->json(['error' => 'Por favor ingrese un folio.'], 400);
        }

        // Search in ShipmentOrders (Ordenes de Embarque) for Sales/Exit
        $order = \App\Models\ShipmentOrder::with(['client', 'items.product', 'driver', 'vehicle', 'transporter', 'sales_order'])
            ->where('folio', $folio)
            ->first();

        if (!$order) {
            return response()->json(['error' => 'Orden de Embarque no encontrada.'], 404);
        }

        // Check if ticket exists via weight_ticket relation
        // Only block if there is an ACTIVE (non-cancelled) ticket
        if ($order->weight_ticket && $order->weight_ticket->weighing_status !== 'cancelled') {
            return response()->json(['error' => 'Esta orden ya tiene un ticket de báscula activo generado.'], 403);
        }

        // Calculate Programmed Weight and Product from Items or Direct Columns
        $programmedWeight = 0;

        // Priority to programmed_tons (already in Tons)
        if (isset($order->programmed_tons) && $order->programmed_tons > 0) {
            $programmedWeight = (float) $order->programmed_tons;
        } else {
            // Fallback to items sum (usually in KG) -> convert to Tons
            $totalKg = $order->items->sum('requested_quantity') ?? 0;
            $programmedWeight = $totalKg > 0 ? ($totalKg / 1000) : 0;
        }

        $productName = $order->items->first()?->product->name ?? 'N/A';
        // Priority if product column exists directly
        if (!empty($order->product) && is_string($order->product)) {
            $productName = $order->product;
        }

        $productId = $order->items->first()?->product_id;

        // Flexible matching for ExitOperator
        $operatorName = trim($order->operator_name);
        $tractorPlate = preg_replace('/[^A-Za-z0-9]/', '', $order->tractor_plate);

        $exitOperator = \App\Models\ExitOperator::where('name', 'like', "%{$operatorName}%")
            ->get()
            ->filter(function ($op) use ($tractorPlate) {
                $opPlate = preg_replace('/[^A-Za-z0-9]/', '', $op->tractor_plate);
                return $opPlate === $tractorPlate;
            })
            ->first();

        $operatorId = $exitOperator?->id;
        $transportLine = $exitOperator?->real_transport_line ?? ($order->transport_company ?? ($order->transporter->name ?? 'N/A'));

        return response()->json([
            'id' => $order->id,
            'folio' => $order->folio,
            'provider' => $order->client->business_name ?? ($order->client->name ?? 'N/A'),
            'driver' => $order->operator_name ?? 'N/A',
            'vehicle_plate' => $order->tractor_plate ?? 'N/A',
            'trailer_plate' => $order->trailer_plate ?? 'N/A',
            'vehicle_type' => $order->unit_type ?? 'N/A',
            'transport_line' => $transportLine,
            'economic_number' => $order->economic_number ?? 'N/A',
            'product' => $productName,
            'product_id' => $productId,
            'exit_operator_id' => $operatorId,
            'origin' => $order->origin,
            'reference' => $order->customer_reference,
            'consignee' => $order->consigned_to ?? ($order->consignee ?? ''),
            'destination' => $order->destination,
            'bill_of_lading' => $order->carta_porte ?? ($order->bill_of_lading ?? ''),
            'withdrawal_letter' => $order->sale_order_folio ?? '',
            'presentation' => $order->presentation ?? 'GRANEL', // Crucial for dynamic validation
            'programmed_weight' => $programmedWeight,
            'unit_type' => $order->unit_type ?? 'N/A', // Unified for frontend
            'linked_full_info' => \App\Models\WeightTicket::where('companion_shipment_order_id', $order->id)
                ->where('weighing_status', '!=', 'cancelled')
                ->latest()
                ->first()?->only(['full_part', 'shipment_order_id']) ?? null,
        ]);
    }



    public function searchQr(Request $request)
    {
        $qr = trim($request->input('qr', ''));

        if (!$qr) {
            return response()->json(['error' => 'Por favor ingrese un folio o código QR.'], 400);
        }

        $operator = null;

        // 1. Check for Vessel Operator QR format: OP {id}|{name} or OP:{id} or OP-{id} or OP{id}
        if (preg_match('/^OP[\s:\-]?(\d+)/i', $qr, $matches)) {
            $operatorId = $matches[1];
            $operator = VesselOperator::with(['vessel.client', 'vessel.product'])->find($operatorId);
        }

        // 2. Search by numeric ID in VesselOperator
        if (!$operator && is_numeric($qr)) {
            $operator = VesselOperator::with(['vessel.client', 'vessel.product'])->find($qr);
        }

        // 3. Search by Folio of LoadingOrder (e.g. 31034, TK-31034, etc.)
        if (!$operator) {
            $loadingOrder = LoadingOrder::with([
                'vessel_operator.vessel.client',
                'vessel_operator.vessel.product',
                'vessel.client',
                'vessel.product',
                'weight_ticket'
            ])
                ->where(function ($q) use ($qr) {
                    $q->where('folio', $qr)
                        ->orWhereHas('weight_ticket', fn($w) => $w->where('ticket_number', $qr)->orWhere('ticket_number', 'TK-' . $qr));
                })
                ->latest()
                ->first();

            if ($loadingOrder) {
                if ($loadingOrder->vessel_operator) {
                    $operator = $loadingOrder->vessel_operator;
                } elseif ($loadingOrder->vessel_operator_id) {
                    $operator = VesselOperator::with(['vessel.client', 'vessel.product'])->find($loadingOrder->vessel_operator_id);
                } elseif ($loadingOrder->vessel_id) {
                    $cleanPlate = preg_replace('/[^A-Za-z0-9]/', '', $loadingOrder->tractor_plate ?? '');
                    $operator = VesselOperator::with(['vessel.client', 'vessel.product'])
                        ->where('vessel_id', $loadingOrder->vessel_id)
                        ->where(function ($q) use ($loadingOrder, $cleanPlate) {
                            $q->where('operator_name', $loadingOrder->operator_name);
                            if (!empty($cleanPlate)) {
                                $q->orWhereRaw("REPLACE(REPLACE(tractor_plate, '-', ''), ' ', '') = ?", [$cleanPlate]);
                            }
                        })
                        ->latest()
                        ->first();
                }
            }
        }

        // 4. Search by Tractor Plate in VesselOperator
        if (!$operator) {
            $cleanPlate = preg_replace('/[^A-Za-z0-9]/', '', $qr);
            if (!empty($cleanPlate)) {
                $operator = VesselOperator::with(['vessel.client', 'vessel.product'])
                    ->whereRaw("REPLACE(REPLACE(tractor_plate, '-', ''), ' ', '') = ?", [$cleanPlate])
                    ->latest()
                    ->first();
            }
        }

        // 5. If found as VesselOperator, execute full check and return
        if ($operator) {
            // ARCHIVE CHECK: If vessel is inactive or already departed, block ALL operations immediately
            // requested message: "ALERTA: El barco asociado a este operador no está en operación"
            if (!$operator->vessel || !$operator->vessel->is_active) {
                return response()->json([
                    'error' => 'ALERTA: El barco asociado a este operador no está en operación.',
                    'blocked' => true
                ], 403);
            }

            // BEFORE suggesting a new entry, check if this operator already has an active order "In Plant"
            $activeOrder = LoadingOrder::with(['client', 'product', 'vessel', 'shipment_order.client'])
                ->where(function ($q) {
                    $q->where('status', 'loading')
                        ->orWhere('status', 'authorized')
                        ->orWhere('destare_status', 'pending');
                })
                ->where('status', '!=', 'completed')
                ->where('status', '!=', 'closed')
                ->where('status', '!=', 'cancelled')
                ->where('destare_status', '!=', 'completed')
                ->where('tractor_plate', $operator->tractor_plate)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($activeOrder) {
                // ALERT LOGIC:
                // 1. If in APT context, only block if it already has a warehouse
                if ($request->input('context') === 'apt' && $activeOrder->warehouse !== null) {
                    return response()->json([
                        'error' => 'ALERTA: El operador no termina su proceso aún o está esperando destare. Ya cuenta con el almacén ' . $activeOrder->warehouse . ' asignado.',
                        'blocked' => true
                    ], 403);
                }

                // 2. If in Scale context (Entry), always block
                if ($request->input('context') !== 'apt') {
                    return response()->json([
                        'error' => 'ALERTA: El operador no termina su proceso aún o está esperando destare.',
                        'blocked' => true
                    ], 403);
                }

                // 3. Otherwise (In APT and NO warehouse yet), return the active order for assignment
                return response()->json([
                    'type' => 'loading_order',
                    'id' => $activeOrder->id,
                    'provider' => $activeOrder->shipment_order?->client?->business_name
                        ?? $activeOrder->shipment_order?->client?->name
                        ?? ($activeOrder->client_name ?? ($activeOrder->client->name ?? ($operator->vessel->client->name ?? 'N/A'))),
                    'driver' => $activeOrder->operator_name ?? 'N/A',
                    'vehicle_plate' => $activeOrder->tractor_plate ?? 'N/A',
                    'product' => $activeOrder->product?->name ?? ($operator->vessel->product->name ?? 'N/A'),
                    'origin' => $activeOrder->origin ?? ($operator->vessel->origin ?? 'N/A'),
                    'status' => $activeOrder->status,
                    'warehouse' => $activeOrder->warehouse,
                    'cubicle' => $activeOrder->cubicle,
                    'vessel_etb' => $operator->vessel->etb,
                    'force_burreo' => false,
                    'apt_operation_type' => $operator->vessel->apt_operation_type ?? 'scale',
                    'has_chief_foreman' => (bool) ($operator->vessel->has_chief_foreman ?? false),
                    'is_external_warehouse' => (bool) ($operator->vessel->is_external_warehouse ?? false),
                ]);
            }

            // Suggest Withdrawal Letter ID logic
            $lastOrder = ShipmentOrder::latest()->first();
            $nextFolio = 1;
            if ($lastOrder && $lastOrder->withdrawal_letter) {
                $nums = preg_replace('/[^0-9]/', '', $lastOrder->withdrawal_letter);
                if (is_numeric($nums)) {
                    $nextFolio = intval($nums) + 1;
                }
            }
            $suggestedWithdrawal = str_pad($nextFolio, 5, '0', STR_PAD_LEFT);

            $isBurreoVessel = $operator->vessel->apt_operation_type === 'burreo';
            $burreoAvgWeightKg = $isBurreoVessel ? \App\Services\BurreoWeightService::getAverageWeightKgForOperator($operator->id) : null;

            return response()->json([
                'type' => 'vessel_operator',
                'id' => null, // No Order ID yet
                'vessel_operator_id' => $operator->id,
                'vessel_id' => $operator->vessel_id,
                'provider' => $operator->vessel->client->business_name ?? ($operator->vessel->client->name ?? 'N/A'),
                'client_id' => $operator->vessel->client_id ?? null,
                'product' => $operator->vessel->product->name ?? 'N/A',
                'product_id' => $operator->vessel->product_id ?? null,
                'reference' => 'Barco: ' . $operator->vessel->name,
                'transport_line' => $operator->transporter_line,
                'driver' => $operator->operator_name,
                'vehicle_type' => $operator->unit_type,
                'vehicle_plate' => $operator->tractor_plate,
                'trailer_plate' => $operator->trailer_plate,
                'economic_number' => $operator->economic_number,
                'origin' => $operator->vessel->origin ?? 'Puerto',
                'suggested_withdrawal_letter' => $suggestedWithdrawal,
                'status' => 'new_entry',
                'vessel_etb' => $operator->vessel->etb,
                'force_burreo' => false,
                'is_burreo' => $isBurreoVessel,
                'burreo_avg_weight_tm' => $burreoAvgWeightKg ? round($burreoAvgWeightKg / 1000, 3) : null,
                'apt_operation_type' => $operator->vessel->apt_operation_type ?? 'scale',
                'vessel_operator_id_val' => $operator->id, // Added this to be explicit
                'has_chief_foreman' => (bool) ($operator->vessel->has_chief_foreman ?? false),
                'is_external_warehouse' => (bool) ($operator->vessel->is_external_warehouse ?? false),
            ]);
        }

        return response()->json(['error' => 'Orden o QR no encontrado'], 404);
    }

    public function storeEntry(Request $request)
    {
        $validated = $request->validate([
            'shipment_order_id' => 'nullable|uuid', // Sales Order ID (ShipmentOrder)
            'vessel_id' => 'nullable|exists:vessels,id',
            // Manual / Derived Fields
            'client_id' => 'nullable|exists:clients,id',
            'product_id' => 'nullable|exists:products,id',

            // Text Fallbacks for Snapshot
            'provider' => 'nullable|string',
            'product' => 'nullable|string',

            'withdrawal_letter' => 'nullable|string',
            'reference' => 'nullable|string',
            'consignee' => 'nullable|string',
            'destination' => 'nullable|string',
            'origin' => 'nullable|string',
            'bill_of_lading' => 'nullable|string',

            // Transport info (Snapshot)
            'driver' => 'required|string',
            'vehicle_plate' => 'required|string',
            'trailer_plate' => 'nullable|string',
            'vehicle_type' => 'nullable|string',
            'transport_line' => 'required|string',
            'economic_number' => 'nullable|string',

            // Scale info
            'tare_weight' => 'required|numeric|min:1',
            'container_type' => 'nullable|string',
            'container_id' => 'nullable|string',
            'observations' => 'nullable|string',
            'scale_id' => 'nullable|integer',
            'exit_operator_id' => 'nullable|exists:exit_operators,id',
            'vessel_operator_id' => 'nullable|exists:vessel_operators,id',
            // Full Support
            'companion_shipment_order_id' => 'nullable|uuid',
            'full_part' => 'nullable|string|in:primera,segunda',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                $shipmentOrderId = !empty($validated['shipment_order_id']) ? $validated['shipment_order_id'] : null;

                // Retrieve Sales Order ID from Shipment Order if possible
                $salesOrderId = null;
                if ($shipmentOrderId) {
                    $salesOrderId = \App\Models\ShipmentOrder::where('id', $shipmentOrderId)->value('sales_order_id');
                }

                // Ensure nullable integer fields are strictly NULL if empty
                $vesselId = !empty($validated['vessel_id']) ? $validated['vessel_id'] : null;
                $productId = !empty($validated['product_id']) ? $validated['product_id'] : null;
                $clientId = !empty($validated['client_id']) ? $validated['client_id'] : 1;
                $scaleId = !empty($validated['scale_id']) ? $validated['scale_id'] : null;
                $exitOperatorId = !empty($validated['exit_operator_id']) ? $validated['exit_operator_id'] : null;
                $vesselOperatorId = !empty($validated['vessel_operator_id']) ? $validated['vessel_operator_id'] : null;

                $vessel = $vesselId ? Vessel::find($vesselId) : null;
                $isBurreo = $vessel && $vessel->apt_operation_type === 'burreo';

                if ($isBurreo) {
                    // Burreo Logic if needed
                }

                $vesselOperatorTripId = null;

                // [MOD] Preventive Check: Avoid duplicate entries for external warehouses
                if ($vessel && $vessel->is_external_warehouse) {
                    $existingOrder = LoadingOrder::where('vessel_id', $vesselId)
                        ->where('vessel_operator_id', $vesselOperatorId)
                        ->where('status', 'weighing_in')
                        ->exists();

                    if ($existingOrder) {
                        return back()->withErrors(['error' => 'OPERACIÓN BLOQUEADA: Esta unidad ya tiene una entrada activa en Báscula. Debe completar su ciclo (Muelle/Salida).']);
                    }
                }

                // [MOD] In the MI -> Muelle -> MP sequence, the trip doesn't exist yet at MI entry time.
                // Linking is now handled in DockTripController@store.

                // UNIFIED LOGIC: ALWAYS CREATE LOADING ORDER
                // Whether it came from a Vessel (Import) or ShipmentOrder (Export/Sales),
                // we create a specific operational "Trip" record (LoadingOrder).

                // Generate Folio
                $lastFolio = LoadingOrder::where('folio', 'REGEXP', '^[0-9]+$')
                    ->lockForUpdate()
                    ->max('folio');

                $nextFolioNum = max(intval($lastFolio) + 1, 30001);
                $folio = str_pad($nextFolioNum, 5, '0', STR_PAD_LEFT);

                $order = LoadingOrder::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'folio' => $folio,
                    'client_id' => $clientId,
                    'product_id' => $productId,
                    'vessel_id' => $vesselId,
                    'status' => 'loading', // or 'weighing_in'
                    'entry_at' => now(),

                    // Link to Commercial Orders
                    'sales_order_id' => $salesOrderId,
                    'shipment_order_id' => $shipmentOrderId,

                    // Snapshot Fields
                    'operator_name' => $validated['driver'],
                    'tractor_plate' => $validated['vehicle_plate'],
                    'trailer_plate' => $validated['trailer_plate'],
                    'unit_type' => $validated['vehicle_type'] ?? 'N/A',
                    'transport_company' => $validated['transport_line'],
                    'economic_number' => $validated['economic_number'] ?? null,
                    'bill_of_lading' => $validated['bill_of_lading'] ?? null,
                    'withdrawal_letter' => $validated['withdrawal_letter'] ?? null,
                    'reference' => $validated['reference'] ?? null,
                    'consignee' => $validated['consignee'] ?? null,
                    'destination' => $validated['destination'] ?? null,
                    'origin' => $validated['origin'] ?? null,
                    'exit_operator_id' => $exitOperatorId,
                    'vessel_operator_id' => $vesselOperatorId,
                    'vessel_operator_trip_id' => $vesselOperatorTripId,
                    'operation_type' => $isBurreo ? 'burreo' : 'scale',
                    'warehouse' => ($vessel && $vessel->is_external_warehouse) ? 'ALMACÉN CLIENTE' : null,
                    'observations' => $validated['observations'] ?? null,
                ]);

                $loadingOrderId = $order->id;

                // Create Ticket linked to this Loading Order
                WeightTicket::create([
                    'loading_order_id' => $loadingOrderId,
                    'shipment_order_id' => $shipmentOrderId, // Legacy redundancy, safe to keep or null
                    'weighmaster_id' => auth()->id(),
                    'ticket_number' => 'TK-' . $folio,
                    'tare_weight' => $validated['tare_weight'], // First Weight
                    'gross_weight' => 0,
                    'net_weight' => 0,
                    'weighing_status' => 'in_progress',
                    'weigh_in_at' => now(),
                    'container_type' => $validated['container_type'] ?? 'N/A',
                    'scale_id' => $scaleId,
                    'is_burreo' => $isBurreo,
                    // Full Support
                    'companion_shipment_order_id' => $validated['companion_shipment_order_id'] ?? null,
                    'full_part' => $validated['full_part'] ?? null,
                ]);
            });

            return redirect()->route('scale.index')->with('success', 'Entrada registrada correctamente.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Scale Entry Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al registrar entrada: ' . $e->getMessage()]);
        }
    }

    public function storeExit(Request $request)
    {
        $validated = $request->validate([
            'shipment_order_id' => 'required|exists:loading_orders,id', // Input is actually LoadingOrder ID
            'weight' => 'required|numeric|min:0',
            'lot_id' => 'nullable|exists:lots,id',
            'packaging_type' => 'nullable|string',
            'warehouse' => 'nullable|string',
            'observations' => 'nullable|string|max:1000',
            'reference' => 'nullable|string|max:255',
            'documenter_id' => 'required|exists:users,id',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // Find LoadingOrder (Unified Flow)
                $order = LoadingOrder::with('weight_ticket')->findOrFail($validated['shipment_order_id']);
                $ticket = $order->weight_ticket;

                if (!$ticket) {
                    throw new \Exception("Esta orden no tiene ticket de entrada.");
                }

                // VALIDATION: For Sales / Shipment Orders, block destare if not finalized in Shipment Process module
                if ($order->shipment_order_id && $order->shipment_order) {
                    $hasLoadedFinished = !empty($order->shipment_order->loading_finished_at) || $order->shipment_order->status === 'loaded';
                    if (!$hasLoadedFinished) {
                        throw new \Exception("ALERTA: Operación Bloqueada. La orden de embarque (" . ($order->shipment_order->folio ?? $order->folio) . ") no ha finalizado su proceso en el módulo de Gestión de Proceso de Embarques.");
                    }
                }

                // Validate Warehouse assignment if needed (mostly for Imports)
                if (!$order->shipment_order_id && empty($order->warehouse)) {
                    // Bypass for external warehouse vessels
                    if (!$order->vessel || !$order->vessel->is_external_warehouse) {
                        throw new \Exception("ALERTA: No se puede destarar sin haber asignado Almacén en el módulo APT.");
                    }
                }

                // Mandatory Dock Trip check for ANY vessel with Chief Foreman (MI -> Muelle -> MP)
                if ($order->vessel && $order->vessel->has_chief_foreman) {
                    if (!$order->vessel_operator_trip_id) {
                        throw new \Exception("ALERTA: Operación Bloqueada. Esta unidad no ha registrado su vuelta en muelle (Jefe de Cuadrilla).");
                    }
                }

                $firstWeight = $ticket->tare_weight;
                $secondWeight = $validated['weight'];
                $net = abs($secondWeight - $firstWeight);

                $assignedLotId = $validated['lot_id'] ?? $order->shipment_order?->lot_id ?? $ticket->lot_id ?? null;

                // Update Ticket
                $ticket->update([
                    'gross_weight' => $secondWeight,
                    'net_weight' => $net,
                    'weighing_status' => 'completed',
                    'weigh_out_at' => now(),
                    'lot_id' => $assignedLotId,
                    'packaging_type' => $validated['packaging_type'] ?? null,
                    'weighmaster_id' => auth()->id(),
                    'documenter_id' => $validated['documenter_id'] ?? null,
                ]);

                // Determine Warehouse to update in LoadingOrder
                $finalWarehouse = $order->warehouse;
                if (!empty($validated['lot_id'])) {
                    $lot = \App\Models\Lot::find($validated['lot_id']);
                    if ($lot && $lot->warehouse) {
                        $finalWarehouse = $lot->warehouse;
                    }
                } elseif (!empty($validated['warehouse'])) {
                    $finalWarehouse = $validated['warehouse'];
                }

                // Update Order Status and Warehouse
                // Ensure reference is updated for Special Vessels
                $updateData = [
                    'status' => 'completed',
                    'destare_status' => 'completed',
                    'warehouse' => $finalWarehouse,
                    'observations' => $validated['observations'] ?? $order->observations,
                ];

                // If reference is provided and is not 'N/A' (or if we have the special flags), update it
                if (!empty($validated['reference'])) {
                    $updateData['reference'] = $validated['reference'];
                }

                $order->update($updateData);


                // Mark linked trip as completed if applicable
                if ($order->vessel_operator_trip_id) {
                    \App\Models\VesselOperatorTrip::where('id', $order->vessel_operator_trip_id)->update(['status' => 'completed']);
                }

                // Sync Sales Order if linked
                if ($order->sales_order_id) {
                    $order->sales_order?->syncLoadedQuantity();
                } elseif ($order->shipment_order && $order->shipment_order->sales_order_id) {
                    $order->shipment_order->sales_order?->syncLoadedQuantity();
                }

                // Automatic Burreo Unit Average Recalculation & Application
                if ($order->vessel_id && ($order->vessel?->apt_operation_type === 'burreo' || $order->operation_type === 'burreo' || $ticket->is_burreo)) {
                    if (!empty($order->unit_type)) {
                        \App\Services\BurreoWeightService::applyUnitAverage($order->vessel_id, $order->unit_type);
                    }
                }
            });

            return redirect()->route('scale.ticket.print', ['id' => $validated['shipment_order_id']])->with('success', 'Salida registrada correctamente.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Scale Exit Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al registrar salida: ' . $e->getMessage()]);
        }
    }

    public function printTicket($id)
    {
        $order = LoadingOrder::with([
            'client',
            'product',
            'driver',
            'vehicle',
            'transporter',
            'weight_ticket.weighmaster',
            'weight_ticket.documenter',
            'weight_ticket.lot',
            'vessel.client',
            'vessel.product',
            'shipment_order.client',
            'shipment_order.product',
            'shipment_order.creator',
            'shipment_order.lot',
            'vessel_operator.creator',
            'sales_order',
            'shipment_order.sales_order'
        ])->findOrFail($id);

        $ticket = $order->weight_ticket;

        if (!$ticket) {
            return back()->withErrors(['error' => 'Ticket no encontrado.']);
        }

        // Format dates
        $entryDate = $transactionEntryDate = \Carbon\Carbon::parse($ticket->weigh_in_at ?? $order->entry_at);
        $exitDate = \Carbon\Carbon::parse($ticket->weigh_out_at ?? now());
        $operativeDate = OperationalTimeHelper::getOperativeDate($exitDate);

        // Robust Sale detection
        $isSale = empty($order->vessel_id) && !empty($order->shipment_order_id);

        // Map Data
        $clientName = $order->client_name ?? ($order->client->name ?? 'N/A');
        // Product Logic with Vessel fallback
        $productName = is_string($order->product) ? $order->product : ($order->product->name ?? 'N/A');
        if ($productName === 'N/A' && !empty($order->vessel->product)) {
            $productName = $order->vessel->product->name;
        }

        $programmedWeight = 0;

        // Sales Specific Overrides (Eager loaded via $order->shipment_order)
        if ($isSale) {
            $clientName = $order->shipment_order->client->business_name ?? ($order->shipment_order->client->name ?? $clientName);
            $productName = $order->shipment_order->product->name ?? ($order->shipment_order->product ?? $productName);
            $programmedWeight = $order->shipment_order->programmed_tons ?? 0;
        } else {
            // Vessel Fallback
            $clientName = $order->vessel->client->name ?? $clientName;
        }

        // Observations Logic
        $observations = $order->observations ?? '';
        if (!$isSale && $order->vessel) {
            $observations = 'DESCARGA DE BARCO ' . $order->vessel->name . ' ' . $observations;
        }

        // Full Unit Part (Primera Parte / Segunda Parte) from Tara
        $fullPart = $ticket->full_part ?? ($order->full_part ?? ($order->shipment_order->full_part ?? null));
        $fullPartText = '';
        if (!empty($fullPart)) {
            $fpLower = strtolower(trim($fullPart));
            if ($fpLower === 'primera') {
                $fullPartText = 'PRIMERA PARTE';
            } elseif ($fpLower === 'segunda') {
                $fullPartText = 'SEGUNDA PARTE';
            } else {
                $fullPartText = strtoupper($fullPart);
            }
        }

        if ($fullPartText) {
            $cleanObs = trim(str_ireplace(['primera parte', 'segunda parte'], '', $observations), " -,\t\n\r\0\x0B");
            $observations = $cleanObs ? "{$fullPartText} - {$cleanObs}" : $fullPartText;
        }

        // Lot Observations Logic
        $lot = $ticket->lot ?? $order->shipment_order?->lot ?? null;
        if (!$lot) {
            $lotId = $ticket->lot_id ?? $order->shipment_order?->lot_id ?? null;
            if ($lotId) {
                $lot = \App\Models\Lot::find($lotId);
            }
        }

        $lotObservations = trim($lot?->observations ?? '');
        if ($lotObservations !== '') {
            $currentObs = trim($observations);
            if ($currentObs !== '') {
                if (!str_contains(mb_strtoupper($currentObs, 'UTF-8'), mb_strtoupper($lotObservations, 'UTF-8'))) {
                    $observations = "{$currentObs} - {$lotObservations}";
                }
            } else {
                $observations = $lotObservations;
            }
        }

        // Destination Logic
        $destination = trim(($order->warehouse ?? '') . ($order->cubicle && $order->cubicle !== 'N/A' ? " - Cubículo {$order->cubicle}" : '')) ?: 'N/A';
        if ($isSale) {
            $dest = $order->shipment_order->shipment_destination?->name ?? ($order->shipment_order->destination ?? ($order->destination ?? 'N/A'));
            $state = $order->shipment_order->state ?? '';
            $destination = $state ? "$dest, $state" : $dest;
        }

        // Economic Number Logic
        $economicNumber = $order->economic_number ?? 'N/A';

        $isSpecialVesselWorkflow = (!$isSale && $order->vessel && $order->vessel->has_chief_foreman && $order->vessel->is_external_warehouse);

        $data = [
            'folio' => $order->folio,
            'ticket_number' => $ticket->ticket_number,
            'date' => \Carbon\Carbon::parse($operativeDate)->format('d/m/Y'),
            'time' => $exitDate->format('H:i:s'),

            'reference' => $isSpecialVesselWorkflow ? 'N/A' : ($isSale ? ($order->shipment_order->folio ?? 'N/A') : ($order->reference ?? 'N/A')),
            'operation' => $isSale ? 'SALIDA' : 'DESCARGA',
            'scale_number' => $ticket->scale_id ?? 2,
            'product' => $productName,
            'presentation' => $isSale
                ? ($order->shipment_order->presentation . ($order->shipment_order->presentation === 'ENVASADO' && $order->shipment_order->sacks_count ? ' ' . $order->shipment_order->sacks_count : ''))
                : 'N/A', // Remove GRANEL/ENVASADO for Barcos

            // Weights
            'entry_weight' => $ticket->tare_weight,
            'exit_weight' => $ticket->gross_weight,
            'gross_weight' => max($ticket->tare_weight, $ticket->gross_weight),
            'tare_weight' => min($ticket->tare_weight, $ticket->gross_weight),
            'net_weight' => $ticket->net_weight,
            'programmed_weight' => number_format($programmedWeight, 2),

            'client' => $clientName,
            'sale_order' => $order->sale_order_folio,
            'sale_order_reference' => $order->customer_reference,
            'withdrawal_letter' => $order->bill_of_lading ?? ($order->withdrawal_letter ?? 'N/A'),

            'driver' => $isSale && $order->shipment_order
                ? ($order->shipment_order->operator_name ?? $order->operator_name ?? 'N/A')
                : ($order->operator_name ?? 'N/A'),
            'tractor_plate' => $isSale && $order->shipment_order
                ? ($order->shipment_order->tractor_plate ?? $order->tractor_plate ?? 'N/A')
                : ($order->tractor_plate ?? 'N/A'),
            'trailer_plate' => $isSale && $order->shipment_order
                ? ($order->shipment_order->trailer_plate ?? $order->trailer_plate ?? 'N/A')
                : ($order->trailer_plate ?? 'N/A'),
            'economic_number' => $economicNumber,
            'full_part' => $fullPartText,

            // Special logic: The "Reference" captured during destare becomes the "Destination" on the ticket
            'destination' => $isSpecialVesselWorkflow ? ($ticket->reference ?? ($order->reference ?? 'N/A')) : $destination,

            'transporter' => $order->transport_company ?? ($order->transporter->name ?? 'N/A'),
            'consignee' => $order->consignee ?? 'N/A',

            'observations' => trim($observations),

            'entry_at' => $entryDate->format('d/m/Y H:i'),
            'exit_at' => $exitDate->format('d/m/Y H:i'),

            'weighmaster' => $ticket->weighmaster?->name ?? 'BASCULA',
            'documenter' => $ticket->documenter?->name ?? ($isSale
                ? ($order->shipment_order->creator->name ?? 'DOCUMENTACIÓN')
                : ($order->vessel_operator->creator->name ?? 'DOCUMENTACIÓN')),
            'is_vessel' => !$isSale,
        ];

        return Inertia::render('Scale/Ticket', [
            'ticket' => $data
        ]);
    }

    public function reopenTicket($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $ticket = WeightTicket::findOrFail($id);
                $order = $ticket->loadingOrder;

                // 1. Determine new weighing status based on weights
                // If it has gross weight, it was completed
                $newStatus = ($ticket->gross_weight > 0) ? 'completed' : 'in_progress';

                // 2. Mark ticket as re-opened
                $ticket->update(['weighing_status' => $newStatus]);

                // 3. Sync Loading Order status
                if ($order) {
                    $orderStatus = ($newStatus === 'completed') ? 'completed' : 'weighing_out';
                    $order->update([
                        'status' => $orderStatus,
                        'destare_status' => ($ticket->tare_weight > 0) ? 'completed' : 'pending'
                    ]);

                    // Sync Sales Order if linked
                    if ($order->sales_order_id) {
                        $order->sales_order?->syncLoadedQuantity();
                    }
                }
            });

            return redirect()->back()->with('success', 'Ticket re-abierto correctamente.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error reopening ticket: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al re-abrir ticket: ' . $e->getMessage()]);
        }
    }

    public function getBurreoAverages(Request $request)
    {
        $vesselId = $request->query('vessel_id');
        if ($vesselId) {
            $stats = \App\Services\BurreoWeightService::getVesselBurreoStats($vesselId);
            return response()->json($stats);
        }

        $burreoVessels = Vessel::with(['client', 'product'])
            ->where('status', 'active')
            ->where('apt_operation_type', 'burreo')
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [];
        foreach ($burreoVessels as $bv) {
            $stats[] = \App\Services\BurreoWeightService::getVesselBurreoStats($bv->id);
        }

        return response()->json($stats);
    }

    public function applyBurreoAverages(Request $request)
    {
        $validated = $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'unit_type' => 'nullable|string',
        ]);

        if (!empty($validated['unit_type'])) {
            $res = \App\Services\BurreoWeightService::applyUnitAverage($validated['vessel_id'], $validated['unit_type']);
        } else {
            $res = \App\Services\BurreoWeightService::calculateAndApplyAll($validated['vessel_id']);
        }

        return response()->json($res);
    }
}
