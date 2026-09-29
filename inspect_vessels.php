<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vessels = \App\Models\Vessel::all();

foreach ($vessels as $vessel) {
    echo "ID: {$vessel->id} | Name: {$vessel->name} | Status: {$vessel->status}\n";
}
