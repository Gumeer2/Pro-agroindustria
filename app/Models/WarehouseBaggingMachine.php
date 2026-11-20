<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseBaggingMachine extends Model
{
    use HasFactory;

    protected $table = 'warehouse_bagging_machines';

    protected $fillable = [
        'warehouse',
        'cubicle',
        'warehouse_number',
        'company',
        'left_tag',
        'left_brand',
        'left_model',
        'left_serial',
        'right_tag',
        'right_brand',
        'right_model',
        'right_serial',
        'hopper_tag',
        'assistant_name',
        'assistant_id',
        'status',
        'notes',
    ];
}
