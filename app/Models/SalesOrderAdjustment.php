<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasAuditTrail;

class SalesOrderAdjustment extends Model
{
    use HasUuids, HasAuditTrail;

    protected $guarded = [];

    protected $casts = [
        'base_weight' => 'float',
        'total_assigned_weight' => 'float',
        'reverted_at' => 'datetime',
    ];

    public function shipmentOrder()
    {
        return $this->belongsTo(ShipmentOrder::class, 'shipment_order_id');
    }

    public function originSalesOrder()
    {
        return $this->belongsTo(SalesOrder::class, 'origin_sales_order_id');
    }

    public function items()
    {
        return $this->hasMany(SalesOrderAdjustmentItem::class, 'adjustment_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reverter()
    {
        return $this->belongsTo(User::class, 'reverted_by');
    }
}
