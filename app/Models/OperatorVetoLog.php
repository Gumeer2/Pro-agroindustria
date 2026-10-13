<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OperatorVetoLog extends Model
{
    protected $fillable = [
        'operator_id',
        'operator_type',
        'operator_name',
        'license',
        'tractor_plate',
        'trailer_plate',
        'transport_line',
        'economic_number',
        'action',
        'reason',
        'user_id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function operator(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'operator_type', 'operator_id');
    }
}
