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
        'product_type',
        'packaging',
        'quantity_tons',
        'sacks_count',
        'lot_folio',
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

    public function scopeAutomotriz($query)
    {
        return $query->where('product_type', 'automotriz');
    }

    public function scopeImportada($query)
    {
        return $query->where('product_type', 'importada');
    }

    public function scopeDap($query)
    {
        return $query->where('product_type', 'dap');
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
