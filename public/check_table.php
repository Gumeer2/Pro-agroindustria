<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

header('Content-Type: application/json');

if (Schema::hasTable('loading_order_references')) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Table loading_order_references exists.',
        'columns' => Schema::getColumnListing('loading_order_references')
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Table loading_order_references DOES NOT exist.'
    ]);
}
