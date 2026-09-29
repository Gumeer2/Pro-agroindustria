<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_shift_starts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('position')->default('Automático');
            $table->dateTime('started_at');
            $table->string('shift');
            $table->uuid('lot_id');
            $table->string('evidence_path')->nullable();
            $table->timestamps();

            $table->foreign('lot_id')->references('id')->on('lots');
            $table->index(['started_at', 'shift']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_shift_starts');
    }
};
