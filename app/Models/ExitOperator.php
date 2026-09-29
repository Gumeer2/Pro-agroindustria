<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class ExitOperator extends Model
{
    use HasAuditTrail;
    protected $fillable = [
        'name',
        'license',
        'transport_line',
        'economic_number',
        'real_transport_line',
        'policy',
        'unit_type',
        'validity',
        'brand_model',
        'tractor_plate',
        'trailer_plate',
        'status',
    ];

    protected $casts = [
        'validity' => 'date',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
