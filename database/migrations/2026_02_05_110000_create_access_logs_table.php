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
        Schema::create('access_logs', function (Blueprint $table) {
            $table->id();
            // Polymorphic relation
            $table->unsignedBigInteger('subject_id');
            $table->string('subject_type'); // 'App\Models\VesselOperator' or 'App\Models\ExitOperator'

            $table->timestamp('entry_at')->useCurrent();
            $table->timestamp('exit_at')->nullable();

            // Status linked to the visit
            $table->enum('status', ['in_plant', 'completed', 'rejected', 'authorized'])->default('in_plant');

            // Checklist info
            $table->boolean('checklist_passed')->default(false);
            $table->json('checklist_data')->nullable(); // Questions and answers

            $table->text('notes')->nullable();

            // Authorization
            $table->foreignId('user_id')->constrained(); // Who handled the entry

            $table->timestamps();

            // Index for fast lookup of active visits
            $table->index(['subject_id', 'subject_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('access_logs');
    }
};
