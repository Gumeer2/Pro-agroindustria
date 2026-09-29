<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('access_log_shipment_order', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_log_id')->constrained('access_logs')->onDelete('cascade');
            // ShipmentOrder uses UUID, so we use string/uuid
            $table->string('shipment_order_id', 36);
            $table->foreign('shipment_order_id')->references('id')->on('shipment_orders')->onDelete('cascade');
            $table->timestamps();

            // Prevent duplicates
            $table->unique(['access_log_id', 'shipment_order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_log_shipment_order');
    }
};
