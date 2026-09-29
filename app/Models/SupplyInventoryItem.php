<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SupplyInventoryItem extends Model
{
    use HasFactory;

    protected $table = 'supply_inventory_items';

    protected $guarded = [];

    protected $casts = [
        'type_id' => 'integer',
        'group_number' => 'integer',
        'stock' => 'float',
        'min_stock' => 'float',
        'unit_cost' => 'float',
        'is_inventoried' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
