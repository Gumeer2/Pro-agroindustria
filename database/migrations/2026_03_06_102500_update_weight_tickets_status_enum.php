<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->string('weighing_status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->enum('weighing_status', ['pending', 'in_progress', 'completed'])->default('pending')->change();
        });
    }
};
