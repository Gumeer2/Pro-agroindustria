<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class WeightTicket extends Model
{
    use HasAuditTrail;
    protected $guarded = [];

    protected $casts = [
        'weigh_in_at' => 'datetime',
        'weigh_out_at' => 'datetime',
        'is_burreo' => 'boolean',
    ];

    public function loadingOrder()
    {
        return $this->belongsTo(LoadingOrder::class);
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class);
    }

    public function weighmaster()
    {
        return $this->belongsTo(User::class, 'weighmaster_id');
    }

    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class);
    }

    public function documenter()
    {
        return $this->belongsTo(User::class, 'documenter_id');
    }

    public function companionShipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class, 'companion_shipment_order_id');
    }
}
