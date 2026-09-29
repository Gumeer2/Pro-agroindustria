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
            $table->index('folio');
            $table->index('sale_order');
            $table->index('status');
            $table->index('created_at');
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->index('sales_order_id');
            $table->index('folio');
            $table->index('status');
            $table->index('vessel_id');
            $table->index('operation_type');
            $table->index('client_id');
            $table->index('product_id');
        });

        Schema::table('loading_orders', function (Blueprint $table) {
            $table->index('shipment_order_id');
            $table->index('sales_order_id');
            $table->index('status');
            $table->index('vessel_id');
        });

        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->index('loading_order_id');
            $table->index('shipment_order_id');
            $table->index('weighing_status');
            $table->index('is_burreo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropIndex(['folio']);
            $table->dropIndex(['sale_order']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropIndex(['sales_order_id']);
            $table->dropIndex(['folio']);
            $table->dropIndex(['status']);
            $table->dropIndex(['vessel_id']);
            $table->dropIndex(['operation_type']);
            $table->dropIndex(['client_id']);
            $table->dropIndex(['product_id']);
        });

        Schema::table('loading_orders', function (Blueprint $table) {
            $table->dropIndex(['shipment_order_id']);
            $table->dropIndex(['sales_order_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['vessel_id']);
        });

        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropIndex(['loading_order_id']);
            $table->dropIndex(['shipment_order_id']);
            $table->dropIndex(['weighing_status']);
            $table->dropIndex(['is_burreo']);
        });
    }
};
