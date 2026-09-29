<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UreaInitialInventory extends Model
{
    use HasFactory;

    protected $table = 'urea_initial_inventories';

    protected $fillable = [
        'date',
        'warehouse',
        'cubicle',
        'plant_origin',
        'packaging',
        'quantity_tons',
        'sacks_count',
        'lot_folio',
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
