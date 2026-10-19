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
        if (!Schema::hasTable('sales_order_adjustments')) {
            Schema::create('sales_order_adjustments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('folio')->unique();
                $table->foreignUuid('shipment_order_id')->constrained('shipment_orders')->cascadeOnDelete();
                $table->foreignUuid('origin_sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
                $table->string('presentation')->default('GRANEL');
                $table->string('weight_type')->default('PESO_NETO'); // PESO_NETO or PROGRAMADO
                $table->decimal('base_weight', 12, 3);
                $table->decimal('total_assigned_weight', 12, 3);
                $table->string('status')->default('applied'); // applied, reverted
                $table->text('notes')->nullable();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reverted_at')->nullable();
                $table->foreignId('reverted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('shipment_order_id');
                $table->index('origin_sales_order_id');
                $table->index('status');
            });
        }

        if (!Schema::hasTable('sales_order_adjustment_items')) {
            Schema::create('sales_order_adjustment_items', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('adjustment_id')->constrained('sales_order_adjustments')->cascadeOnDelete();
                $table->foreignUuid('sales_order_id')->constrained('sales_orders')->cascadeOnDelete();
                $table->string('order_type')->default('origin'); // origin, destination
                $table->decimal('assigned_weight', 12, 3);
                $table->decimal('previous_balance', 12, 3)->nullable();
                $table->string('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('adjustment_id');
                $table->index('sales_order_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_adjustment_items');
        Schema::dropIfExists('sales_order_adjustments');
    }
};
