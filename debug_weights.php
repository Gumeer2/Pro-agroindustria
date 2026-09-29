<?php
use App\Models\LoadingOrder;
use App\Models\ShipmentOrder;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$folio = 'PA2026-0019';
echo "Inspecting Folio: $folio (with LIKE)\n";

$order = LoadingOrder::with(['shipment_order', 'vessel', 'items'])->where('folio', 'LIKE', "%$folio%")->first();

if (!$order) {
    echo "LoadingOrder partially matching '$folio' not found. Searching in ShipmentOrder...\n";
    $sOrder = ShipmentOrder::where('folio', 'LIKE', "%$folio%")->first();
    if ($sOrder) {
        echo "Found in ShipmentOrder:\n";
        print_r($sOrder->toArray());
    } else {
        echo "Listing last 5 LoadingOrders:\n";
        LoadingOrder::latest()->limit(5)->get()->each(function ($o) {
            echo "  Folio: {$o->folio}\n"; });
        echo "Listing last 5 ShipmentOrders:\n";
        ShipmentOrder::latest()->limit(5)->get()->each(function ($o) {
            echo "  Folio: {$o->folio}\n"; });
    }
} else {
    echo "Found in LoadingOrder:\n";
    echo "ID: " . $order->id . "\n";
    echo "Shipment Order ID: " . ($order->shipment_order_id ?? 'NULL') . "\n";
    echo "Vessel ID: " . ($order->vessel_id ?? 'NULL') . "\n";

    if ($order->shipment_order) {
        echo "Linked Shipment Order:\n";
        echo "  Folio: " . $order->shipment_order->folio . "\n";
        echo "  Programmed Tons: " . $order->shipment_order->programmed_tons . "\n";
    }

    if ($order->vessel) {
        echo "Linked Vessel:\n";
        echo "  Draft Weight: " . $order->vessel->draft_weight . "\n";
        echo "  Burreo Weight: " . $order->vessel->provisional_burreo_weight . "\n";
    }
}
