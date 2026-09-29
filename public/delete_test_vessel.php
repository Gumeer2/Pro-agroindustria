<?php

use Illuminate\Contracts\Console\Kernel;
use App\Models\Vessel;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

// Bootstrap the application safely by calling a lightweight command
// This initializes the container, facades, and database connections
ob_start();
$kernel->call('about');
ob_end_clean();

echo "<html><body style='font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px;'>";
echo "<h1>🚀 Vessel Cleanup 'HOLA'</h1>";
echo "<pre>";

try {
    DB::transaction(function () {
        // Disable FK checks to force deletion of stubborn records
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 1. Find Vessel
        $vessel = Vessel::where('name', 'HOLA')->first();

        if (!$vessel) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            echo "<span style='color: #fbbf24;'>⚠️ Vessel 'HOLA' not found. Nothing to delete.</span>";
            return;
        }

        echo "Found Vessel ID: " . $vessel->id . "\n";

        // 2. Delete Vessel Operators
        $countOps = DB::table('vessel_operators')->where('vessel_id', $vessel->id)->delete();
        echo "Deleted $countOps Vessel Operators.\n";

        // 3. Find Shipment Orders linked to this vessel
        $orderIds = DB::table('shipment_orders')->where('vessel_id', $vessel->id)->pluck('id');
        echo "Found " . $orderIds->count() . " linked Shipment Orders.\n";

        if ($orderIds->count() > 0) {
            // 4. Delete APT Scans linked to these orders
            $countScans = DB::table('apt_scans')->whereIn('shipment_order_id', $orderIds)->delete();
            echo "Deleted $countScans APT Scans.\n";

            // 5. Delete Weight Tickets linked to these orders
            $countTickets = DB::table('weight_tickets')->whereIn('shipment_order_id', $orderIds)->delete();
            echo "Deleted $countTickets Weight Tickets.\n";

            // 6. Delete Shipment Orders
            $countOrders = DB::table('shipment_orders')->whereIn('id', $orderIds)->delete();
            echo "Deleted $countOrders Shipment Orders.\n";
        }

        // 7. Delete Vessel
        // Force delete via DB builder to bypass any model events or soft delete issues
        DB::table('vessels')->where('id', $vessel->id)->delete();
        echo "<span style='color: #4ade80;'>✅ Vessel 'HOLA' and all dependencies deleted successfully.</span>\n";

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    });

} catch (\Exception $e) {
    echo "<span style='color: #ef4444;'>❌ ERROR: " . $e->getMessage() . "</span>";
    echo "\n" . $e->getTraceAsString();
}

echo "</pre>";
echo "<p>⚠️ Please delete this file after use for security.</p>";
echo "</body></html>";
