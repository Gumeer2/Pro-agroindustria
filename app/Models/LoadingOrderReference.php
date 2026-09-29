<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasAuditTrail;

class LoadingOrderReference extends Model
{
    use HasAuditTrail;
    protected $fillable = ['name', 'created_by', 'updated_by'];
}
