<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientOperatorAssignment extends Model
{
    protected $table = 'client_operator_assignments';

    protected $fillable = [
        'operator_id',
        'sales_order_id',
        'presentation',
        'tm',
        'sack',
    ];

    protected $casts = [
        'tm' => 'decimal:2',
    ];

    public function operator()
    {
        return $this->belongsTo(ExitOperator::class, 'operator_id');
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
}
