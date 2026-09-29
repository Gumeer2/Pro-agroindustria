<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasAuditTrail;

class VesselOperatorTrip extends Model
{
    use HasAuditTrail;

    protected $guarded = [];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'weight' => 'decimal:2',
    ];

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function operator()
    {
        return $this->belongsTo(VesselOperator::class, 'vessel_operator_id');
    }

    public function registrar()
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function loading_order()
    {
        return $this->hasOne(LoadingOrder::class);
    }
}
