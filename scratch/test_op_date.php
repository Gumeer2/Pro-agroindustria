<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$ops = App\Models\ExitOperator::with(['salesOrder.product', 'salesOrder.client', 'clients'])
    ->whereNotNull('sales_order_id')
    ->orderBy('updated_at', 'desc')
    ->get();

$now = now()->timezone('America/Mexico_City');
$currentOperationalDate = $now->hour < 5 ? $now->subDay()->toDateString() : $now->toDateString();

$ops->each(function ($op) {
    $updated = $op->updated_at ? $op->updated_at->copy()->timezone('America/Mexico_City') : null;
    if ($updated) {
        $opDate = $updated->hour < 5 ? $updated->copy()->subDay()->toDateString() : $updated->toDateString();
        $op->setAttribute('operational_date', $opDate);
        $op->setAttribute('formatted_updated_at', $updated->format('d/m/Y H:i'));
    }
});

echo "Current Operational Date (Corte 5:00 AM): " . $currentOperationalDate . PHP_EOL;
foreach ($ops as $o) {
    echo "ID: " . $o->id . " | Name: " . $o->name . " | Updated: " . $o->formatted_updated_at . " | Operational Date: " . $o->operational_date . PHP_EOL;
}
