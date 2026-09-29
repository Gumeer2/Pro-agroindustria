<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AptAttendance extends Model
{
    use HasFactory;

    protected $table = 'apt_attendances';

    protected $fillable = [
        'folio',
        'format_code',
        'service_provider',
        'shift',
        'work_area',
        'date',
        'activity',
        'loading_line',
        'personnel',
        'squad_leader',
        'safety_supervisor',
        'observations',
        'supervision_name',
        'user_id',
    ];

    protected $casts = [
        'date' => 'date',
        'personnel' => 'array',
        'squad_leader' => 'array',
        'safety_supervisor' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
