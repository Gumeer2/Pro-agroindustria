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
            ->with(['weight_ticket'])
            ->where('status', '!=', 'cancelled');

        if ($cutOff) {
            $tripsQuery->where('created_at', '<=', $cutOff);
        }

        $trips = $tripsQuery->get();

        // Sum net weight for trips that have completed weighing (Destare)
        foreach ($trips as $trip) {
            if ($trip->weight_ticket) {
                $ticket = $trip->weight_ticket;
                $isCompletedAtTime = ($ticket->weighing_status === 'completed' && (!$cutOff || ($ticket->weigh_out_at ? $ticket->weigh_out_at <= $cutOff : $ticket->created_at <= $cutOff)));

                if ($isCompletedAtTime) {
                    $total += ((float) $ticket->net_weight / 1000);
                }
            }
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
