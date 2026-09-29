<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Vessel;
use App\Models\WeightTicket;

$vessels = Vessel::all();
echo "TOTAL VESSELS: " . count($vessels) . "\n";
foreach ($vessels as $v) {
    $count = WeightTicket::whereHas('loadingOrder', function ($q) use ($v) {
        $q->where('vessel_id', $v->id);
    })->count();
    echo "- BARCO: {$v->name} (ID: {$v->id}) | Tickets: $count\n";
}
