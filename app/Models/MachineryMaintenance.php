<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MachineryMaintenance extends Model
{
    use HasFactory;

    protected $table = 'machinery_maintenances';

    protected $fillable = [
        'folio',
        'machinery_name',
        'economic_number',
        'machinery_code',
        'type',
        'current_step',
        'status',
        'status_color',
        'hours_worked',
        'operator_name',
        'failure_description',
        'reported_at',
        'supervisor_name',
        'logged_at',
        'mechanic_name',
        'diagnostic_notes',
        'part_number',
        'parts_requested',
        'diagnostic_at',
        'work_order_folio',
        'root_cause',
        'estimated_cost',
        'work_permit_number',
        'work_permit_issued',
        'ot_generated_at',
        'authorized_by',
        'purchase_order_number',
        'authorized_at',
        'authorization_notes',
        'parts_delivered_by',
        'parts_delivered_at',
        'parts_delivery_notes',
        'loto_applied',
        'loto_tag_number',
        'executed_at',
        'execution_notes',
        'activities_performed',
        'parts_actually_used',
        'report_signed_at',
        'operational_test_passed',
        'delivered_by',
        'received_by',
        'tested_at',
        'closed_by',
        'closed_at',
        'closure_notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'current_step' => 'integer',
        'hours_worked' => 'decimal:2',
        'estimated_cost' => 'decimal:2',
        'work_permit_issued' => 'boolean',
        'loto_applied' => 'boolean',
        'operational_test_passed' => 'boolean',
        'reported_at' => 'datetime',
        'logged_at' => 'datetime',
        'diagnostic_at' => 'datetime',
        'ot_generated_at' => 'datetime',
        'authorized_at' => 'datetime',
        'parts_delivered_at' => 'datetime',
        'executed_at' => 'datetime',
        'report_signed_at' => 'datetime',
        'tested_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
