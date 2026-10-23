<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
print_r(Illuminate\Support\Facades\Schema::getColumnListing('exit_operators'));
$op = App\Models\ExitOperator::whereNotNull('sales_order_id')->first();
if ($op) {
    echo "ID: " . $op->id . " | created_at: " . $op->created_at . " | updated_at: " . $op->updated_at . PHP_EOL;
}
