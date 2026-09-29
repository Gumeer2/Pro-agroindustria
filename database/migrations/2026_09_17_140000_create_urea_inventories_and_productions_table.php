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
        Schema::create('urea_initial_inventories', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('warehouse'); // Almacen 1-5, etc.
            $table->string('cubicle')->nullable(); // Cubiculo 1-8
            $table->string('plant_origin')->default('UREA 1'); // UREA 1, UREA 2
            $table->string('packaging')->default('Granel'); // Granel, Sacos 25 Kg, Sacos 50 Kg, Big Bag 1000 Kg
            $table->decimal('quantity_tons', 12, 3)->default(0);
            $table->integer('sacks_count')->nullable()->default(0);
            $table->string('lot_folio')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('urea_daily_productions', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('shift')->default('Turno 1 (07:00 - 15:00)'); // Turno 1, 2, 3, etc.
            $table->string('warehouse'); // Almacen 1-5
            $table->string('cubicle')->nullable(); // Cubiculo 1-8
            $table->string('plant_origin')->default('UREA 1'); // UREA 1, UREA 2
            $table->string('packaging')->default('Granel'); // Granel, Sacos 25 Kg, Sacos 50 Kg, Big Bag 1000 Kg
            $table->decimal('quantity_tons', 12, 3)->default(0);
            $table->integer('sacks_count')->nullable()->default(0);
            $table->string('lot_folio')->nullable();
            $table->string('supervisor_name')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('urea_daily_productions');
        Schema::dropIfExists('urea_initial_inventories');
    }
};
