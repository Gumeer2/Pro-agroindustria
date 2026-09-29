<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasAuditTrail;

class TransportLine extends Model
{
    use HasAuditTrail;

    protected $fillable = ['name'];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if (isset($model->name)) {
                $model->name = mb_strtoupper(trim($model->name), 'UTF-8');
            }
        });
    }
}
