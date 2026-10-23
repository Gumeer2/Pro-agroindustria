<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$name = '2026_10_23_160000_create_client_operator_assignments_table';
if (!Illuminate\Support\Facades\DB::table('migrations')->where('migration', $name)->exists()) {
    $batch = (int) Illuminate\Support\Facades\DB::table('migrations')->max('batch') + 1;
    Illuminate\Support\Facades\DB::table('migrations')->insert([
        'migration' => $name,
        'batch' => $batch
    ]);
    echo "Recorded migration in migrations table: " . $name . PHP_EOL;
} else {
    echo "Migration already recorded." . PHP_EOL;
}
