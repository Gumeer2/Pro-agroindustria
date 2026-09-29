<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class AptScan extends Model
{
    use HasFactory, HasAuditTrail;

    protected $fillable = [
        'shipment_order_id',
        'operator_id',
        'warehouse',
        'cubicle',
        'user_id',
        'loading_order_id',
        'created_by',
        'updated_by',
    ];

    public function operator()
    {
        // Fallback for Burreo logs if operator_id was nullified to avoid DB FK errors
        if ($this->operator_id === null && $this->loading_order_id) {
            return $this->belongsTo(VesselOperator::class, 'id', 'id')
                ->whereIn('id', function ($q) {
                    $q->select('vessel_operator_id')->from('loading_orders')->where('id', $this->loading_order_id);
                });
        }
        return $this->belongsTo(VesselOperator::class, 'operator_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function loadingOrder()
    {
        return $this->belongsTo(LoadingOrder::class);
    }

    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class);
    }
}
