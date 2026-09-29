<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasAuditTrail;

class Vessel extends Model
{
    use HasUuids, HasAuditTrail;

    protected $guarded = [];

    protected $casts = [
        'eta' => 'datetime',
        'etb' => 'datetime',
        'berthal_datetime' => 'datetime',
        'external_dock_arrival_date' => 'date',
        'external_dock_arrival_time' => 'datetime',
        'external_dock_departure_date' => 'date',
        'external_dock_departure_time' => 'datetime',
        'departure_date' => 'datetime',
        'is_anchored' => 'boolean',
        'has_chief_foreman' => 'boolean',
        'is_external_warehouse' => 'boolean',
        'provisional_burreo_weight' => 'decimal:2',
        'draft_weight' => 'decimal:2',
        'holds' => 'array',
    ];

    protected $appends = ['is_active'];

    public function getIsActiveAttribute()
    {
        if (!$this->departure_date) {
            return true;
        }
        return $this->departure_date->isFuture();
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('departure_date')
                ->orWhere('departure_date', '>', now());
        });
    }

    public function scopeInactive($query)
    {
        return $query->whereNotNull('departure_date')
            ->where('departure_date', '<=', now());
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function shipments()
    {
        return $this->hasMany(ShipmentOrder::class);
    }

    public function loadingOrders()
    {
        return $this->hasMany(LoadingOrder::class);
    }
}
