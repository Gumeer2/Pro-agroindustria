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
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('folio')->unique(); // Internal OV-2026-001
            $table->string('sale_order')->nullable(); // Customer reference

            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');

            $table->decimal('total_quantity', 14, 3)->default(0); // TM
            $table->enum('status', ['created', 'open', 'closed', 'cancelled'])->default('created');

            $table->string('sale_conditions')->nullable();
            $table->string('delivery_conditions')->nullable();
            $table->text('destination')->nullable();
            $table->text('observations')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
