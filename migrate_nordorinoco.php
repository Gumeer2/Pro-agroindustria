<?php

// Define application base path
define('LARAVEL_START', microtime(true));

// Load Composer's autoloader
require __DIR__ . '/vendor/autoload.php';

// Bootstrap the Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';

// Create Kernel
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "<h1>Running Migration: Delete Nordorinoco</h1>";
echo "<pre>";

try {
    // Run the specific migration using artisan call
    Illuminate\Support\Facades\Artisan::call('migrate', [
        '--force' => true,
        '--path' => 'database/migrations/2026_01_22_124500_delete_data_nordorinoco.php'
    ]);

    echo Illuminate\Support\Facades\Artisan::output();
    echo "\n\n[SUCCESS] Migration completed successfully.";
} catch (\Throwable $e) {
    echo "[ERROR] " . $e->getMessage();
    echo "\n" . $e->getTraceAsString();
}

echo "</pre>";
