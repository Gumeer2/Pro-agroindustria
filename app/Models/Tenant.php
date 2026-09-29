<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'domain',
        'logo',
        'favicon',
        'primary_color',
        'secondary_color',
        'copyright_text',
        'is_active',
    ];
}
