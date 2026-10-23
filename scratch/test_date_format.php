<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$op = App\Models\ExitOperator::whereNotNull('sales_order_id')->first();
echo "Raw updated_at: " . $op->updated_at . PHP_EOL;
echo "JSON updated_at: " . json_encode($op->updated_at) . PHP_EOL;
echo "Full JSON: " . json_encode(['updated_at' => $op->updated_at]) . PHP_EOL;
