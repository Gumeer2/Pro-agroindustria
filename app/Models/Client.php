<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class Client extends Model
{
    use HasAuditTrail;
    protected $fillable = [
        'business_name',
        'rfc',
        'address',
        'contact_info',
        'bag_types',
    ];

    protected $casts = [
        'bag_types' => 'array',
    ];
}
