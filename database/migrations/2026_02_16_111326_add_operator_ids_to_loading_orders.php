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
        Schema::table('loading_orders', function (Blueprint $table) {
            $table->foreignId('exit_operator_id')->nullable()->constrained('exit_operators')->onDelete('set null');
            $table->foreignId('vessel_operator_id')->nullable()->constrained('vessel_operators')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loading_orders', function (Blueprint $table) {
            $table->dropForeign(['exit_operator_id']);
            $table->dropForeign(['vessel_operator_id']);
            $table->dropColumn(['exit_operator_id', 'vessel_operator_id']);
        });
    }
};
