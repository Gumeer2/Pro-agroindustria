<?php

namespace App\Models;

use App\Traits\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;

class ServiceProvider extends Model
{
    use HasAuditTrail;

    protected $fillable = ['name'];
}