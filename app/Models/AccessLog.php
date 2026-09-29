<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccessLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'subject_type', // 'App\Models\VesselOperator' or 'App\Models\ExitOperator'
        'entry_at',
        'exit_at',
        'status', // 'in_plant', 'completed', 'rejected'
        'checklist_passed',
        'checklist_data',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'entry_at' => 'datetime',
        'exit_at' => 'datetime',
        'checklist_passed' => 'boolean',
        'checklist_data' => 'array',
    ];

    /**
     * Get the parent subject model (VesselOperator or ExitOperator).
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who authorized the entry.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the shipment orders associated with this access.
     */
    public function shipmentOrders()
    {
        return $this->belongsToMany(
            ShipmentOrder::class,
            'access_log_shipment_order',
            'access_log_id',
            'shipment_order_id'
        )->withTimestamps();
    }
}
