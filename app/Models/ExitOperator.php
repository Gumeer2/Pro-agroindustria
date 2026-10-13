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
        'veto_reason',
        'vetoed_at',
        'vetoed_by',
        'unveto_reason',
        'unvetoed_at',
        'unvetoed_by',
    ];

    protected $casts = [
        'validity' => 'date',
        'vetoed_at' => 'datetime',
        'unvetoed_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
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
