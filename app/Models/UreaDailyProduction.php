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
        'packaging',
        'quantity_tons',
        'sacks_count',
        'lot_folio',
        'supervisor_name',
        'notes',
        'user_id',
    ];

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
