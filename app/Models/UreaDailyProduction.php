<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UreaDailyProduction extends Model
{
    use HasFactory;

    protected $table = 'urea_daily_productions';

    protected $fillable = [
        'date',
        'shift',
        'warehouse',
        'cubicle',
        'plant_origin',
        'product_type',
        'packaging',
        'quantity_tons',
        'sacks_count',
        'lot_folio',
        'supervisor_name',
        'notes',
        'user_id',
    ];

    public function scopeAgricola($query)
    {
        return $query->where('product_type', 'agricola');
    }

    public function scopeIndustrial($query)
    {
        return $query->where('product_type', 'industrial');
    }

    protected $casts = [
        'date' => 'date:Y-m-d',
        'quantity_tons' => 'decimal:3',
        'sacks_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
