<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ShipmentOrder;

// Search for the specific folio from the screenshot
$folio = 'PA2026-0008';
$order = ShipmentOrder::with(['items.product', 'product'])->where('folio', $folio)->first();

if (!$order) {
    echo "Order not found.\n";
    exit;
}

echo "Order Folio: {$order->folio}\n";
echo "Direct Product Relation: " . ($order->product ? $order->product->name : 'NULL') . "\n";
echo "Items Count: " . $order->items->count() . "\n";

foreach ($order->items as $item) {
    echo "Item ID: {$item->id}\n";
    echo "  Product ID: {$item->product_id}\n";
    echo "  Product Name: " . ($item->product ? $item->product->name : 'NULL') . "\n";
    echo "  Attributes: " . json_encode($item->toArray()) . "\n";
}
