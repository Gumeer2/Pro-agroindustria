<?php

// Cleanup Script
// Place this in the 'public' folder and run via browser: https://domain.com/cleanup_data.php

define("LARAVEL_START", microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "<h1>Starting Shipment Orders Cleanup...</h1>";

try {
    // 1. Safety Check: Ensure loading_orders has data
    $countLoading = DB::table('loading_orders')->count();
    if ($countLoading == 0) {
        throw new Exception("Loading Orders table is EMPTY. Aborting cleanup to prevent data loss.");
    }
    echo "Verified: loading_orders has $countLoading records.<br>";

    // 2. Count Shipment Orders before
    $countShipmentBefore = DB::table('shipment_orders')->count();
    echo "Shipment Orders Count (Before): $countShipmentBefore<br>";

    // 3. Delete records from shipment_orders that exist in loading_orders (Safe Delete)
    // using ID match since we migrated with same UUIDs
    // Disable Foreign Key Checks temporarily to prevent constraint errors (though we have ON DELETE SET NULL usually)
    DB::statement('SET FOREIGN_KEY_CHECKS=0;');

    $deleted = DB::delete("DELETE FROM shipment_orders WHERE id IN (SELECT id FROM loading_orders)");

    DB::statement('SET FOREIGN_KEY_CHECKS=1;');

    echo "<strong>Deleted $deleted redundant records from shipment_orders.</strong><br>";

    // 4. Count Shipment Orders after
    $countShipmentAfter = DB::table('shipment_orders')->count();
    echo "Shipment Orders Count (After): $countShipmentAfter<br>";

    echo "<h2 style='color: green;'>SUCCESS: Cleanup Completed.</h2>";
    echo "<p>You may now delete this file.</p>";

} catch (\Exception $e) {
    echo "<h2 style='color: red;'>ERROR: " . $e->getMessage() . "</h2>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
