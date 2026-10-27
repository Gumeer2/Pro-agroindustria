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
        'original_tm',
        'destared_tm',
        'destare_status',
        'destared_at',
        'loading_order_id',
        'sack',
    ];

    protected $casts = [
        'tm' => 'decimal:2',
        'original_tm' => 'decimal:2',
        'destared_tm' => 'decimal:2',
        'destared_at' => 'datetime',
    ];

    public function operator()
    {
        return $this->belongsTo(ExitOperator::class, 'operator_id');
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function loadingOrder()
    {
        return $this->belongsTo(LoadingOrder::class, 'loading_order_id');
    }
}

