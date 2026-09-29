<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class Product extends Model
{
    use HasAuditTrail;
    protected $fillable = ['name', 'code', 'default_packaging'];
}
