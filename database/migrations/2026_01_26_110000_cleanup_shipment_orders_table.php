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
            // Drop redundant columns that are now managed by SalesOrder
            $table->dropColumn([
                'sale_order',
                'reference',
                'request_id',
                'purchase_order'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->string('sale_order')->nullable();
            $table->string('reference')->nullable();
            $table->string('request_id')->nullable();
            $table->string('purchase_order')->nullable();
        });
    }
};
