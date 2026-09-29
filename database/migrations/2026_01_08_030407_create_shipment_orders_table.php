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
        Schema::create('shipment_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('folio')->unique();
            $table->string('sale_order')->nullable(); // OV
            $table->enum('status', ['created', 'authorized', 'weighing_in', 'loading', 'weighing_out', 'completed', 'cancelled'])->default('created');
            
            $table->timestamp('entry_at')->nullable(); // Hora de entrada a planta (Vigilancia)

            $table->foreignId('client_id')->constrained();
            $table->foreignId('transporter_id')->nullable()->constrained();
            $table->foreignId('driver_id')->nullable()->constrained();
            $table->foreignId('vehicle_id')->nullable()->constrained();
            // Optional: Trailer ID separate
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_orders');
    }
};
