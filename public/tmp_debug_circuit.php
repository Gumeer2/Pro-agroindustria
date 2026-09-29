<?php

/**
 * Debug script to check Loading Order statuses and circuit counts.
 * Access via: https://pro-agroindustria.com/tmp_debug_circuit.php
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\LoadingOrder;
use App\Models\Vessel;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

try {
    $activeVessels = Vessel::active()->get(['id', 'name']);
    echo "--- ACTIVE VESSELS ---\n";
    foreach ($activeVessels as $v) {
        echo "ID: {$v->id} | Name: {$v->name}\n";
    }

    echo "\n--- LOADING ORDERS BY STATUS ---\n";
    $stats = LoadingOrder::select('status', 'operation_type', DB::raw('count(*) as total'))
        ->groupBy('status', 'operation_type')
        ->get();

    foreach ($stats as $s) {
        echo "Status: " . str_pad($s->status, 15) . " | Process: " . str_pad($s->operation_type ?? 'scale', 10) . " | Count: {$s->total}\n";
    }

    echo "\n--- CIRCUIT CALCULATION TEST ---\n";
    if ($v = $activeVessels->first()) {
        $vesselId = $v->id;
        echo "Checking for Vessel: {$v->name} ({$vesselId})\n";

        $scaleInCircuit = LoadingOrder::where('vessel_id', $vesselId)
            ->where(function ($q) {
                $q->whereNull('operation_type')->orWhere('operation_type', 'scale');
            })
            ->whereIn('status', ['authorized', 'weighing_in', 'loading', 'weighing_out'])
            ->count();

        $burreoInCircuit = LoadingOrder::where('vessel_id', $vesselId)
            ->where('operation_type', 'burreo')
            ->whereNotNull('economic_number')
            ->where('economic_number', '!=', '')
            ->whereIn('status', ['weighing_in', 'loading', 'weighing_out']) // Current problematic logic
            ->distinct()
            ->count('economic_number');

        $burreoInCircuitFixed = LoadingOrder::where('vessel_id', $vesselId)
            ->where('operation_type', 'burreo')
            ->whereNotNull('economic_number')
            ->where('economic_number', '!=', '')
            ->whereIn('status', ['authorized', 'weighing_in', 'loading', 'weighing_out']) // Proposed fixed logic
            ->distinct()
            ->count('economic_number');

        echo "Scale in Circuit (Static): {$scaleInCircuit}\n";
        echo "Burreo in Circuit (Current Logic): {$burreoInCircuit}\n";
        echo "Burreo in Circuit (Fixed Logic - with authorized): {$burreoInCircuitFixed}\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
