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
        Schema::create('shipment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('shipment_order_id')->constrained('shipment_orders')->onDelete('cascade');
            $table->foreignId('product_id')->constrained();
            $table->decimal('requested_quantity', 10, 2);
            $table->string('packaging_type')->default('Saco 25kg');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_items');
    }
};
