<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PackagingEquipment extends Model
{
    use HasFactory;

    protected $table = 'packaging_equipments';

    protected $fillable = [
        'company',
        'category_number',
        'description',
        'tag',
        'brand',
        'model',
        'serial_number',
        'status',
        'observations',
    ];

    protected $casts = [
        'category_number' => 'integer',
    ];
}
