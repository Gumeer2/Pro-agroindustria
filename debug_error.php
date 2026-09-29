<?php
// debug_error.php
// Script to catch boot errors or class loading errors

define('LARAVEL_START', microtime(true));

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

use Illuminate\Contracts\Console\Kernel;

try {
    $app->make(Kernel::class)->bootstrap();
    echo "<h1>✅ Laravel Bootstrap Start Successful (Core is loading)</h1>";

    // Test Model Loading
    if (class_exists(\App\Models\AptScan::class)) {
        echo "<p>✅ Class App\Models\AptScan FOUND.</p>";
    } else {
        echo "<p>❌ Class App\Models\AptScan NOT FOUND. Run 'composer dump-autoload'.</p>";
    }

    // Test Database Access for new table
    try {
        $count = \Illuminate\Support\Facades\DB::table('apt_scans')->count();
        echo "<p>✅ Table 'apt_scans' access OK. Rows: $count</p>";
    } catch (\Exception $e) {
        echo "<p>❌ Database Error: " . $e->getMessage() . "</p>";
    }

} catch (\Throwable $e) {
    echo "<h1>❌ CRITICAL ERROR</h1>";
    echo "<pre>" . $e->getMessage() . "\n" . $e->getTraceAsString() . "</pre>";
}
