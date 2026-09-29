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
        Schema::create('vessel_operator_trips', function (Blueprint $table) {
            $table->id();
            // Foreign keys
            $table->foreignUuid('vessel_id')->constrained()->onDelete('cascade');
            $table->foreignId('vessel_operator_id')->constrained()->onDelete('cascade');
            $table->foreignId('registered_by')->constrained('users')->onDelete('cascade');

            // Operational data
            $table->integer('hold_number');
            $table->enum('operation_type', ['Carga', 'Descarga']);
            $table->decimal('weight', 12, 2)->nullable(); // Waiting for promedios or destare

            // Timing
            $table->timestamp('start_time')->useCurrent();
            $table->timestamp('end_time')->nullable();

            $table->string('status')->default('pending'); // pending, completed, cancelled
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vessel_operator_trips');
    }
};
