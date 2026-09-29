<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

try {
    echo "Iniciando ejecución de migraciones...\n";

    // Run migrations
    Artisan::call('migrate', ['--force' => true]);
    echo Artisan::output();

    echo "\nMigraciones terminadas correctamente.\n";

    // Check if columns exist
    $hasProvisional = DB::getSchemaBuilder()->hasColumn('vessels', 'provisional_burreo_weight');
    $hasDraft = DB::getSchemaBuilder()->hasColumn('vessels', 'draft_weight');
    $hasIsBurreo = DB::getSchemaBuilder()->hasColumn('weight_tickets', 'is_burreo');
    $hasDeletedAt = DB::getSchemaBuilder()->hasColumn('users', 'deleted_at');

    echo "\nVerificación de Columnas:\n";
    echo "vessels.provisional_burreo_weight: " . ($hasProvisional ? "OK" : "NO ENCONTRADA") . "\n";
    echo "vessels.draft_weight: " . ($hasDraft ? "OK" : "NO ENCONTRADA") . "\n";
    echo "weight_tickets.is_burreo: " . ($hasIsBurreo ? "OK" : "NO ENCONTRADA") . "\n";
    echo "users.deleted_at: " . ($hasDeletedAt ? "OK" : "NO ENCONTRADA") . "\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
