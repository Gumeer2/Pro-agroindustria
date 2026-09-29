<?php
// migrate.php - Run only via explicit call, protected if possible
// Ideally this should be protected by a key or deleted after use, but for this setup:

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "Running Migrations...\n";
try {
    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo nl2br(\Illuminate\Support\Facades\Artisan::output());

    // Also run seeders if needed (roles)
    // Warning: Running seeders multiple times might duplicate data if not idempotent. 
    // Spatie roles are idempotent (firstOrCreate).
    echo "\nRunning Seeder (Roles)...\n";
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'RolesAndPermissionsSeeder', '--force' => true]);
    echo nl2br(\Illuminate\Support\Facades\Artisan::output());

    echo "\nRunning Seeder (Legacy Shipment Migration)...\n";
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'MigrateLegacyShipmentsSeeder', '--force' => true]);
    echo nl2br(\Illuminate\Support\Facades\Artisan::output());

    echo "\nRunning Seeder (Dock Status)...\n";
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'DockStatusSeeder', '--force' => true]);
    echo nl2br(\Illuminate\Support\Facades\Artisan::output());

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}