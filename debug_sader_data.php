<?php

use App\Models\ShipmentOrder;
use App\Models\WeightTicket;
use Carbon\Carbon;
use App\Helpers\OperationalTimeHelper;

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$filters = ['date' => Carbon::yesterday()->format('Y-m-d')];
$range = OperationalTimeHelper::getOperationalRange($filters['date']);

echo "Investigando rango: {$range[0]} - {$range[1]}\n";

$consignatarios = ShipmentOrder::distinct()->pluck('consigned_to');
echo "Consignatarios únicos en DB:\n";
foreach ($consignatarios as $c) {
    echo "- '" . ($c ?? 'NULL') . "'\n";
}
echo "\n";

$orders = ShipmentOrder::where('consigned_to', 'like', '%SADER%')
    ->with(['weight_ticket'])
    ->get();

echo "Total órdenes que contienen 'SADER': " . $orders->count() . "\n\n";

foreach ($orders as $order) {
    $ticket = $order->weight_ticket;
    $weighedOut = $ticket ? $ticket->weigh_out_at : 'SIN TICKET';
    $status = $order->status;
    $folio = $order->folio;

    $inRange = ($weighedOut >= $range[0] && $weighedOut <= $range[1]);

    echo "Folio: $folio | Status: $status | Weigh Out: $weighedOut | En Rango: " . ($inRange ? 'SI' : 'NO') . "\n";
}
