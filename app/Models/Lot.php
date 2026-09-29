<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\HasAuditTrail;

class Lot extends Model
{
    use HasFactory, HasUuids, HasAuditTrail;

    protected $fillable = [
        'folio',
        'warehouse',
        'cubicle',
        'plant_origin',
        'status',
        'user_id',
        'created_at', // Allow mass assignment for editing date
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
