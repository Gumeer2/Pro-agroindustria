<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            // Denormalized column for instant performance
            $table->decimal('loaded_quantity', 14, 3)->default(0)->after('total_quantity');

            // Strategic indexes for sorting and filtering
            $table->index(['status', 'created_at']);
        });

        Schema::table('loading_orders', function (Blueprint $table) {
            // Optimize relationship lookups
            $table->index(['sales_order_id', 'status']);
        });

        // Initial data sync will be handled in a follow-up step or a separate script if large
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropColumn('loaded_quantity');
        });

        Schema::table('loading_orders', function (Blueprint $table) {
            $table->dropIndex(['sales_order_id', 'status']);
        });
    }
};
