<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('llenaderas_histories')) {
            Schema::create('llenaderas_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('shipment_order_id')->constrained('shipment_orders')->cascadeOnDelete();
                $table->string('folio', 100)->nullable()->index();
                $table->string('warehouse', 100)->nullable()->default('Almacen 01');
                $table->foreignUuid('lot_id')->nullable()->constrained('lots')->nullOnDelete();
                $table->string('operator')->nullable();
                $table->string('product')->nullable();
                $table->string('presentation', 100)->nullable()->default('GRANEL');
                $table->string('stowage_text', 100)->nullable()->default('GRANEL');
                $table->string('plates', 100)->nullable();
                $table->timestamp('started_at')->nullable()->index();
                $table->timestamp('finished_at')->nullable();
                $table->unsignedTinyInteger('loading_percentage')->default(0);
                $table->string('status', 50)->default('loading')->index();
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('llenaderas_histories');
    }
};
