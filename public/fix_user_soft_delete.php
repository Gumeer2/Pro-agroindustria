<?php

/**
 * Emergency script to add deleted_at to users table.
 * Access via: https://pro-agroindustria.com/fix_user_soft_delete.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

try {
    echo "Starting Soft Delete Fix...\n";

    if (!Schema::hasColumn('users', 'deleted_at')) {
        echo "Adding deleted_at column to users table...\n";
        DB::statement('ALTER TABLE users ADD deleted_at TIMESTAMP NULL DEFAULT NULL');
        echo "Column added successfully.\n";
    } else {
        echo "Column 'deleted_at' already exists in users table.\n";
    }

    echo "\nVerification:\n";
    $hasColumn = Schema::hasColumn('users', 'deleted_at');
    echo "users.deleted_at exists: " . ($hasColumn ? "YES" : "NO") . "\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
