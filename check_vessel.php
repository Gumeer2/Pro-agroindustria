<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Vessel;
use App\Models\WeightTicket;

$allVessels = Vessel::pluck('name')->toArray();
echo "Vessels in DB: " . implode(', ', $allVessels) . "\n\n";

$vesselName = 'YASA';
$v = Vessel::where('name', 'like', "%$vesselName%")->first();

if (!$v) {
    echo "Vessel containing '$vesselName' not found.\n";

    echo "\nLatest 10 Tickets overall:\n";
    $latest = WeightTicket::latest()->take(10)->get();
    foreach ($latest as $t) {
        $vName = $t->loadingOrder->vessel->name ?? 'NO VESSEL';
        echo "- Ticket #{$t->ticket_number} | Vessel: $vName | Operation: " . ($t->loadingOrder ? 'LOADING' : 'SHIPMENT') . " | Date: {$t->created_at}\n";
    }
    exit;
}

echo "Found Vessel: {$v->name} (ID: {$v->id})\n";

$ticketCount = WeightTicket::whereHas('loadingOrder', function ($q) use ($v) {
    $q->where('vessel_id', $v->id);
})->count();

echo "Tickets linked to this vessel: $ticketCount\n";

$latestTickets = WeightTicket::whereHas('loadingOrder', function ($q) use ($v) {
    $q->where('vessel_id', $v->id);
})->latest()->take(3)->get();

foreach ($latestTickets as $t) {
    echo "- Ticket #{$t->ticket_number} (ID: {$t->id}, Status: {$t->weighing_status}, Created: {$t->created_at})\n";
}
