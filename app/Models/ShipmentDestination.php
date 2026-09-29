<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasAuditTrail;

class ShipmentDestination extends Model
{
    use HasAuditTrail;

    protected $fillable = ['name'];

    public function shipmentOrders()
    {
        return $this->hasMany(ShipmentOrder::class, 'destination_id');
    }
}
