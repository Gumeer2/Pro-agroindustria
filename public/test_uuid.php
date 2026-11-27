<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$uuid = '540e8ebf-8fd1-44a3-9ca9-cd8322313bcb';
$lo = \App\Models\LoadingOrder::find($uuid);
echo "LoadingOrder by find: " . ($lo ? "FOUND ({$lo->folio})" : "NOT FOUND") . "\n";
if (!$lo) {
    $lo = \App\Models\LoadingOrder::where('id', $uuid)->first();
    echo "LoadingOrder by where: " . ($lo ? "FOUND ({$lo->folio})" : "NOT FOUND") . "\n";
}
$so = \App\Models\ShipmentOrder::find($uuid);
echo "ShipmentOrder by find: " . ($so ? "FOUND ({$so->folio})" : "NOT FOUND") . "\n";

if ($lo) {
    echo "Shipment order rel: " . ($lo->shipment_order ? "FOUND ({$lo->shipment_order->folio})" : "NULL") . "\n";
    echo "Shipment order id: " . ($lo->shipment_order_id ?? "NULL") . "\n";
}