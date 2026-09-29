<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SupplyInventoryMovement extends Model
{
    use HasFactory;

    protected $table = 'supply_inventory_movements';

    protected $guarded = [];

    protected $casts = [
        'type_id' => 'integer',
        'group_number' => 'integer',
        'quantity' => 'float',
        'unit_cost' => 'float',
        'total_cost' => 'float',
        'movement_date' => 'date',
        'entry_date' => 'date',
        'exit_date' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(SupplyInventoryItem::class, 'item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
