<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class VesselOperator extends Model
{
    use HasAuditTrail;
    protected $guarded = [];

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }
}
