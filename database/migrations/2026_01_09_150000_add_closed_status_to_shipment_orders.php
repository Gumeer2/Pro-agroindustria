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
        // Modify the ENUM column to include 'closed'
        // Note: We restate all existing values to preserve them.
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE shipment_orders MODIFY COLUMN status ENUM('created', 'authorized', 'weighing_in', 'loading', 'weighing_out', 'completed', 'cancelled', 'closed') NOT NULL DEFAULT 'created'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum without 'closed'
        if (config('database.default') === 'mysql') {
            DB::statement("ALTER TABLE shipment_orders MODIFY COLUMN status ENUM('created', 'authorized', 'weighing_in', 'loading', 'weighing_out', 'completed', 'cancelled') NOT NULL DEFAULT 'created'");
        }
    }
};
