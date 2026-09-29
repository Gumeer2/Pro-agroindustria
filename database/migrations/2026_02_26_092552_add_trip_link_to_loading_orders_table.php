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
            $table->foreignId('vessel_operator_trip_id')->nullable()->after('vessel_id')->constrained('vessel_operator_trips')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loading_orders', function (Blueprint $table) {
            $table->dropForeign(['vessel_operator_trip_id']);
            $table->dropColumn('vessel_operator_trip_id');
        });
    }
};
