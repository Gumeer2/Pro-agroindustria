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
        Schema::create('vessel_operators', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('vessel_id')->constrained()->onDelete('cascade');
            $table->string('operator_name');
            $table->string('unit_type');
            $table->string('economic_number');
            $table->string('tractor_plate');
            $table->string('trailer_plate')->nullable();
            $table->string('transporter_line');
            $table->timestamps();

            // Unique constraint per vessel
            $table->unique(['vessel_id', 'operator_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vessel_operators');
    }
};
