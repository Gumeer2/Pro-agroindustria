<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\HasAuditTrail;

class Transporter extends Model
{
    use HasAuditTrail;
    protected $fillable = ['name', 'rfc', 'address', 'contact_info'];

    public function drivers()
    {
        return $this->hasMany(Driver::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
