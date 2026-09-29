<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('production_shift_activities')) {
            return;
        }

        Schema::create('production_shift_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_shift_start_id')->constrained('production_shift_starts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->string('type', 20);
            $table->text('description');
            $table->string('location')->nullable();
            $table->string('evidence_path')->nullable();
            $table->dateTime('occurred_at');
            $table->timestamps();
            $table->index(['production_shift_start_id', 'occurred_at'], 'psa_shift_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_shift_activities');
    }
};
