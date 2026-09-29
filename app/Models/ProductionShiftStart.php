<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionShiftStart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'position',
        'started_at',
        'shift',
        'lot_id',
        'evidence_path',
    ];

    protected $casts = [
        'started_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lot()
    {
        return $this->belongsTo(Lot::class);
    }

    public function lots()
    {
        return $this->belongsToMany(Lot::class, 'production_shift_start_lot')
            ->withPivot(['status', 'closed_at', 'closed_by']);
    }

    public function activities()
    {
        return $this->hasMany(ProductionShiftActivity::class);
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
