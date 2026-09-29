<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

echo "Columnas en vessels:\n";
print_r(DB::getSchemaBuilder()->getColumnListing('vessels'));

echo "\nBarcos en la tabla vessels:\n";
$vessels = DB::table('vessels')->select('id', 'name', 'status', 'is_anchored', 'apt_operation_type')->get();
foreach ($vessels as $v) {
    echo "ID: {$v->id} | Name: {$v->name} | Status: {$v->status} | IsAnchored: " . ($v->is_anchored ? 'Yes' : 'No') . " | Type: {$v->apt_operation_type}\n";
}

echo "\nÚltimos Weight Tickets:\n";
$tickets = DB::table('weight_tickets')->orderBy('created_at', 'desc')->limit(5)->get();
foreach ($tickets as $t) {
    echo "ID: {$t->id} | VesselID: {$t->vessel_id} | Status: {$t->weighing_status} | IsBurreo: " . ($t->is_burreo ? 'Yes' : 'No') . "\n";
}
