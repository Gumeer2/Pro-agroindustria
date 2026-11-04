<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShipmentSamplingIncident extends Model
{
    protected $guarded = [];

    protected $casts = [
        'unlocked_at' => 'datetime',
        'unlock_count' => 'integer',
    ];

    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class, 'shipment_order_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'unlocked_by_user_id');
    }
}

