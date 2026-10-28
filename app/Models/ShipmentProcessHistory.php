<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasAuditTrail;

class ShipmentProcessHistory extends Model
{
    use HasAuditTrail;

    protected $guarded = [];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'stowage_count' => 'integer',
        'stowage_plan' => 'array',
        'stowage_plan_saved_at' => 'datetime',
        'samples' => 'array',
        'sampling_completed_at' => 'datetime',
        'sampling_avg' => 'float',
    ];

    /**
     * Shipment order related to this process history record.
     */
    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class, 'shipment_order_id');
    }

    /**
     * Lot assigned during loading.
     */
    public function lot()
    {
        return $this->belongsTo(Lot::class, 'lot_id');
    }
}
