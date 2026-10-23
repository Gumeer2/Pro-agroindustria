<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$ov3 = App\Models\SalesOrder::where('folio', 'OV-2026-3')->first();
$ov4 = App\Models\SalesOrder::where('folio', 'OV-2026-4')->first();
echo "OV3 ID: " . ($ov3 ? $ov3->id : 'not found') . PHP_EOL;
echo "OV4 ID: " . ($ov4 ? $ov4->id : 'not found') . PHP_EOL;
