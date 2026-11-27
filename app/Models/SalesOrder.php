<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasAuditTrail;

class SalesOrder extends Model
{
    use HasUuids, HasAuditTrail;

    protected $guarded = [];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function shipments()
    {
        return $this->hasMany(ShipmentOrder::class);
    }

    public function loading_orders()
    {
        return $this->hasManyThrough(
            LoadingOrder::class,
            ShipmentOrder::class,
            'sales_order_id', // Foreign key on shipment_orders table
            'shipment_order_id', // Foreign key on loading_orders table
            'id', // Local key on sales_orders table
            'id' // Local key on shipment_orders table
        );
    }

    public function trips()
    {
        return $this->hasMany(LoadingOrder::class, 'sales_order_id');
    }


    public function weight_tickets()
    {
        return $this->hasManyThrough(
            WeightTicket::class,
            ShipmentOrder::class,
            'sales_order_id', // Foreign key on shipment_orders table
            'shipment_order_id', // Foreign key on weight_tickets table
            'id', // Local key on sales_orders table
            'id' // Local key on shipment_orders table
        );
    }

    public function getLoadedQuantityAttribute()
    {
        // Safety: If the column doesn't exist in the query result or is 0,
        // we fallback to real-time calculation to ensure data integrity during transition.
        if (!array_key_exists('loaded_quantity', $this->attributes) || (float) $this->attributes['loaded_quantity'] === 0.0) {
            return $this->calculateLoadedQuantity();
        }

        return (float) $this->attributes['loaded_quantity'];
    }

    public function adjustmentItems()
    {
        return $this->hasMany(SalesOrderAdjustmentItem::class, 'sales_order_id');
    }

    /**
     * The original heavy calculation logic, now available as a helper.
     * $cutOff allows calculating state at a specific point in time.
     */
    public function calculateLoadedQuantity($cutOff = null): float
    {
        $total = 0;

        // Traverse all trips linked to this Sales Order (directly or via shipment orders)
        $tripsQuery = LoadingOrder::where(function ($q) {
                $q->where('sales_order_id', $this->id)
                  ->orWhereHas('shipment_order', function ($sq) {
                      $sq->where('sales_order_id', $this->id);
                  });
            })
            ->with(['weight_ticket', 'shipment_order.activeAdjustment.items'])
            ->where('status', '!=', 'cancelled');

        if ($cutOff) {
            $tripsQuery->where('created_at', '<=', $cutOff);
        }

        $trips = $tripsQuery->get();

        // Track shipment orders that have active adjustments so we only count their assigned weight once
        $adjustedShipmentIds = [];
        // Track envasado shipment orders with multiple tickets (split lots) so we don't double-count programmed_tons
        $envasadoShipmentTons = [];
        $envasadoShipmentNetSum = [];

        // Sum net weight for trips that have completed weighing (Destare)
        foreach ($trips as $trip) {
            $shipmentOrder = $trip->shipment_order;
            $activeAdj = $shipmentOrder?->activeAdjustment;

            if ($activeAdj) {
                $soId = $shipmentOrder->id;
                if (!in_array($soId, $adjustedShipmentIds)) {
                    $adjustedShipmentIds[] = $soId;
                    // Find the assigned weight item for THIS SalesOrder
                    $item = $activeAdj->items->firstWhere('sales_order_id', $this->id);
                    if ($item) {
                        $total += (float) $item->assigned_weight;
                    }
                }
                continue;
            }

            if ($trip->weight_ticket) {
                $ticket = $trip->weight_ticket;
                $isCompletedAtTime = ($ticket->weighing_status === 'completed' && (!$cutOff || ($ticket->weigh_out_at ? $ticket->weigh_out_at <= $cutOff : $ticket->created_at <= $cutOff)));

                if ($isCompletedAtTime) {
                    $shipmentOrder = $trip->shipment_order;
                    $presUpper = strtoupper(trim($shipmentOrder?->presentation ?? $trip->presentation ?? ''));

                    $linkedAssignment = null;
                    if ($trip->id) {
                        $linkedAssignment = \App\Models\ClientOperatorAssignment::where('loading_order_id', $trip->id)->first();
                        if (!$presUpper && $linkedAssignment) {
                            $presUpper = strtoupper(trim($linkedAssignment->presentation ?? ''));
                        }
                    }

                    $isEnvasado = str_contains($presUpper, 'ENVAS') || str_contains($presUpper, 'SACO');

                    if ($isEnvasado) {
                        // REGLA: Para envasado se considera el peso programado de la OE (sin duplicarlo si la OE tuvo 2 tickets por cambio de lote)
                        $prog = 0;
                        if ($shipmentOrder && (float) ($shipmentOrder->programmed_tons ?? 0) > 0) {
                            $prog = (float) $shipmentOrder->programmed_tons;
                        } elseif ($shipmentOrder && (float) ($shipmentOrder->programmed_weight ?? 0) > 0) {
                            $prog = (float) $shipmentOrder->programmed_weight;
                        } elseif ((float) ($trip->programmed_tons ?? 0) > 0) {
                            $prog = (float) $trip->programmed_tons;
                        } elseif ($linkedAssignment && (float) ($linkedAssignment->original_tm ?? $linkedAssignment->tm ?? 0) > 0) {
                            $prog = (float) ($linkedAssignment->original_tm ?? $linkedAssignment->tm);
                        }

                        $progTons = $prog > 0 ? ($prog >= 100 ? ($prog / 1000) : $prog) : 0;
                        $ticketNetTons = ((float) $ticket->net_weight / 1000);

                        if ($shipmentOrder && $progTons > 0) {
                            $soKey = (string) $shipmentOrder->id;
                            $rawPlan = $shipmentOrder->stowage_plan;
                            $planArr = is_string($rawPlan) ? (json_decode($rawPlan, true) ?: []) : (is_array($rawPlan) ? $rawPlan : []);
                            $isSplitPending = !empty($planArr['second_lot_status']) && $planArr['second_lot_status'] !== 'completed';

                            $envasadoShipmentTons[$soKey] = $progTons;
                            $envasadoShipmentNetSum[$soKey] = ($envasadoShipmentNetSum[$soKey] ?? 0.0) + $ticketNetTons;
                            if ($isSplitPending) {
                                // Si aún falta el 2do lote, contar solo lo destarado hasta ahora
                                $envasadoShipmentTons[$soKey] = min($progTons, $envasadoShipmentNetSum[$soKey]);
                            }
                        } else {
                            $total += ($progTons > 0 ? $progTons : $ticketNetTons);
                        }
                    } else {
                        $total += ((float) $ticket->net_weight / 1000);
                    }
                }
            }
        }

        foreach ($envasadoShipmentTons as $soTons) {
            $total += (float) $soTons;
        }

        // Also check if THIS SalesOrder was assigned weight as DESTINATION in any active adjustments
        $destinationAdjustments = SalesOrderAdjustmentItem::where('sales_order_id', $this->id)
            ->where('order_type', 'destination')
            ->whereHas('adjustment', function ($q) use ($cutOff) {
                $q->where('status', 'applied');
                if ($cutOff) {
                    $q->where('created_at', '<=', $cutOff);
                }
            })
            ->get();

        foreach ($destinationAdjustments as $adjItem) {
            $total += (float) $adjItem->assigned_weight;
        }

        // Origin adjustments on shipment orders that had no loading orders / trips yet
        $originAdjustmentsWithoutTrips = SalesOrderAdjustmentItem::where('sales_order_id', $this->id)
            ->where('order_type', 'origin')
            ->whereHas('adjustment', function ($q) use ($cutOff, $adjustedShipmentIds) {
                $q->where('status', 'applied');
                if (!empty($adjustedShipmentIds)) {
                    $q->whereNotIn('shipment_order_id', $adjustedShipmentIds);
                }
                if ($cutOff) {
                    $q->where('created_at', '<=', $cutOff);
                }
            })
            ->get();

        foreach ($originAdjustmentsWithoutTrips as $origItem) {
            $total += (float) $origItem->assigned_weight;
        }

        return (float) $total;
    }

    /**
     * Force a synchronization of the denormalized column.
     * This should be called whenever a weight ticket is completed or a shipment is modified.
     */
    public function syncLoadedQuantity(): void
    {
        $this->updateQuietly([
            'loaded_quantity' => $this->calculateLoadedQuantity()
        ]);
    }

    public function getBalanceAttribute()
    {
        return max(0, $this->total_quantity - $this->loaded_quantity);
    }

    protected $appends = ['balance']; // 'loaded_quantity' is now a real attribute
}
