<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class VesselOperator extends Model
{
    use HasAuditTrail;
    protected $guarded = [];

    protected $casts = [
        'validity' => 'date',
        'vetoed_at' => 'datetime',
        'unvetoed_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function vessel()
    {
        return $this->belongsTo(Vessel::class);
    }

    public function vetoLogs()
    {
        return $this->morphMany(OperatorVetoLog::class, 'operator');
    }

    public function vetoedByUser()
    {
        return $this->belongsTo(User::class, 'vetoed_by');
    }

    public function unvetoedByUser()
    {
        return $this->belongsTo(User::class, 'unvetoed_by');
    }
}
