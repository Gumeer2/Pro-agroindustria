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
            $table->uuid('lot_id')->nullable()->after('weighmaster_id');
            $table->string('packaging_type')->nullable()->after('lot_id');

            $table->foreign('lot_id')->references('id')->on('lots')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropForeign(['lot_id']);
            $table->dropColumn(['lot_id', 'packaging_type']);
        });
    }
};
