<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasAuditTrail;

class SalesOrderAdjustmentItem extends Model
{
    use HasUuids, HasAuditTrail;

    protected $guarded = [];

    protected $casts = [
        'assigned_weight' => 'float',
        'previous_balance' => 'float',
    ];

    public function adjustment()
    {
        return $this->belongsTo(SalesOrderAdjustment::class, 'adjustment_id');
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
}
