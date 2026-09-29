<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $vesselId = 'a0e2b156-646a-4edd-8f81-22f1b00c7114';

        // Disable foreign key checks to force deletion if any constraint is stuck
        Schema::disableForeignKeyConstraints();

        try {
            // 1. Get all Shipment Orders for this vessel to delete their dependent children
            $orderIds = DB::table('shipment_orders')
                ->where('vessel_id', $vesselId)
                ->pluck('id')
                ->toArray();

            // 2. Delete children of Shipment Orders
            if (!empty($orderIds)) {
                DB::table('weight_tickets')->whereIn('shipment_order_id', $orderIds)->delete();
                DB::table('shipment_items')->whereIn('shipment_order_id', $orderIds)->delete();
                DB::table('apt_scans')->whereIn('shipment_order_id', $orderIds)->delete();
                // Delete the orders themselves
                DB::table('shipment_orders')->whereIn('id', $orderIds)->delete();
            }

            // 3. Delete Vessel Operators
            DB::table('vessel_operators')->where('vessel_id', $vesselId)->delete();

            // 4. Delete the Vessel
            DB::table('vessels')->where('id', $vesselId)->delete();

        } finally {
            // Re-enable foreign key checks
            Schema::enableForeignKeyConstraints();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible data deletion
    }
};
