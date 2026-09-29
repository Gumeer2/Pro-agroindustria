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
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->string('lot')->nullable()->after('ticket_number'); // Lote
            $table->string('seal')->nullable()->after('lot'); // Sello
            $table->string('container_type')->nullable()->after('seal'); // Envase (PROAGRO, FERTINAL, N/A)
            $table->enum('weighing_status', ['pending', 'in_progress', 'completed'])->default('pending')->after('net_weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropColumn(['lot', 'seal', 'container_type', 'weighing_status']);
        });
    }
};
