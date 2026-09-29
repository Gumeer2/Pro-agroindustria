<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->uuid('companion_shipment_order_id')->nullable()->after('shipment_order_id');
            $table->string('full_part', 20)->nullable()->after('companion_shipment_order_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropColumn(['companion_shipment_order_id', 'full_part']);
        });
    }
};
