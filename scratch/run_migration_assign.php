<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$migration = require_once 'database/migrations/2026_10_23_160000_create_client_operator_assignments_table.php';
$migration->up();
echo "Migration executed successfully!" . PHP_EOL;

$rows = Illuminate\Support\Facades\DB::table('client_operator_assignments')->get();
echo "Total rows in client_operator_assignments: " . count($rows) . PHP_EOL;
foreach ($rows as $r) {
    print_r($r);
}
