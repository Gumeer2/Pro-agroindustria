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
        // Fix for "Integrity constraint violation: 1048 Column 'shipment_order_id' cannot be null"
        // Since doctrine/dbal might be missing or failed to change the column, we force it with raw SQL.

        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });

        Schema::table('apt_scans', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });

        Schema::table('loading_operations', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting to NOT NULL is risky if nulls exist, but technically:
        // DB::statement("ALTER TABLE weight_tickets MODIFY shipment_order_id CHAR(36) NOT NULL");
    }
};
