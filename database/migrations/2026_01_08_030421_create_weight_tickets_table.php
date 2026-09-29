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
        Schema::create('weight_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('shipment_order_id')->constrained('shipment_orders')->onDelete('cascade');
            $table->string('ticket_number')->nullable();
            $table->decimal('tare_weight', 10, 2)->nullable();
            $table->decimal('gross_weight', 10, 2)->nullable();
            $table->decimal('net_weight', 10, 2)->nullable();
            $table->timestamp('weigh_in_at')->nullable();
            $table->timestamp('weigh_out_at')->nullable();
            $table->foreignId('weighmaster_id')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weight_tickets');
    }
};
