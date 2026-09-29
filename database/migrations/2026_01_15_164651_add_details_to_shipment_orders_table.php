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
        Schema::table('shipment_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_orders', 'product_id')) {
                $table->foreignId('product_id')->nullable()->constrained()->after('client_id');
            }
            if (!Schema::hasColumn('shipment_orders', 'vessel_id')) {
                $table->foreignId('vessel_id')->nullable()->constrained()->after('product_id');
            }
            if (!Schema::hasColumn('shipment_orders', 'programmed_weight')) {
                $table->decimal('programmed_weight', 10, 2)->default(0)->after('sacks_count');
            }
            if (!Schema::hasColumn('shipment_orders', 'bill_of_lading')) {
                $table->string('bill_of_lading')->nullable()->after('trailer_plate');
            }
            if (!Schema::hasColumn('shipment_orders', 'withdrawal_letter')) {
                $table->string('withdrawal_letter')->nullable()->after('bill_of_lading');
            }
            if (!Schema::hasColumn('shipment_orders', 'reference')) {
                $table->string('reference')->nullable()->after('sale_order');
            }
            if (!Schema::hasColumn('shipment_orders', 'consignee')) {
                $table->string('consignee')->nullable()->after('client_id');
            }
            if (!Schema::hasColumn('shipment_orders', 'destination')) {
                $table->string('destination')->nullable()->after('origin');
            }
            // Check 'origin' column carefully as it might exist in some contexts
            if (!Schema::hasColumn('shipment_orders', 'origin')) {
                // If 'origin' is meant to be new. If it overrides, we drop/change?
                // Migration says "Origin override", presumably new column.
                $table->string('origin')->nullable()->after('qr_code');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn('product_id');
            $table->dropForeign(['vessel_id']);
            $table->dropColumn('vessel_id');
            $table->dropColumn('programmed_weight');
            $table->dropColumn('bill_of_lading');
            $table->dropColumn('withdrawal_letter');
            $table->dropColumn('reference');
            $table->dropColumn('consignee');
            $table->dropColumn('destination');
            $table->dropColumn('origin');
        });
    }
};
