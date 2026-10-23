<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$rows = Illuminate\Support\Facades\DB::table('client_exit_operator')->get();
echo "Total rows in client_exit_operator: " . count($rows) . PHP_EOL;
foreach ($rows as $r) {
    print_r($r);
}
