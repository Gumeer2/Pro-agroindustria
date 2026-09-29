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
        Schema::create('supply_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('type_id'); // 1 to 9
            $table->string('type_name'); // e.g. MATERIALES, MANO DE OBRA
            $table->string('type_slug')->index(); // e.g. materiales, mano-de-obra
            $table->unsignedInteger('group_number'); // e.g. 1, 2, 3...
            $table->string('group_name'); // e.g. ACCESORIOS, ACEROS
            $table->string('code')->nullable()->index(); // SKU / Clave interna
            $table->string('name'); // Nombre o descripción del producto / insumo
            $table->text('description')->nullable();
            $table->string('unit', 50)->default('PZA'); // PZA, KG, M, L, TON, M2, M3, PAQ, JGO, SRV, HRS
            $table->decimal('stock', 14, 2)->default(0); // Cantidad disponible
            $table->decimal('min_stock', 14, 2)->default(0); // Stock mínimo para alertas
            $table->decimal('unit_cost', 14, 2)->default(0); // Costo unitario
            $table->string('location')->nullable(); // Almacén / Pasillo / Estante
            $table->string('kontrol_type', 50)->default('Normal'); // Normal
            $table->boolean('is_inventoried')->default(true); // Inventariado / No inventariado
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['type_id', 'group_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supply_inventory_items');
    }
};
