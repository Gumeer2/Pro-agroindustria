<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionShiftActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'production_shift_start_id',
        'user_id',
        'type',
        'description',
        'location',
        'evidence_path',
        'occurred_at',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function shiftStart()
    {
        return $this->belongsTo(ProductionShiftStart::class, 'production_shift_start_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function evidenceUrl(): ?string
    {
        if (!$this->evidence_path) {
            return null;
        }
        if (str_starts_with($this->evidence_path, 'http://') || str_starts_with($this->evidence_path, 'https://') || str_starts_with($this->evidence_path, 'data:')) {
            return $this->evidence_path;
        }
        $path = ltrim($this->evidence_path, '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }
        return asset('storage/' . $path);
    }
}
