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
        Schema::create('lots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('folio')->unique(); // Name of the Lot
            $table->string('warehouse'); // Almacen 1-5
            $table->string('cubicle')->nullable(); // Cubiculo 1-8 (only for WH 4/5)
            $table->enum('plant_origin', ['UREA 1', 'UREA 2']);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->foreignId('user_id')->constrained(); // User who created it
            $table->timestamps(); // created_at (editable), updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lots');
    }
};
