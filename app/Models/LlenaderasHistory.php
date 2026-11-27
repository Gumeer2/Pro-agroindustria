<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LlenaderasHistory extends Model
{
    use HasFactory;

    protected $table = 'llenaderas_histories';

    protected $guarded = [];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'loading_percentage' => 'integer',
    ];

    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class, 'shipment_order_id');
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class, 'lot_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
