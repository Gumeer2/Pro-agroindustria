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
        Schema::table('vessels', function (Blueprint $table) {
            $table->date('external_dock_arrival_date')->nullable()->after('eta');
            $table->time('external_dock_arrival_time')->nullable()->after('external_dock_arrival_date');
            $table->date('external_dock_departure_date')->nullable()->after('external_dock_arrival_time');
            $table->time('external_dock_departure_time')->nullable()->after('external_dock_departure_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn([
                'external_dock_arrival_date',
                'external_dock_arrival_time',
                'external_dock_departure_date',
                'external_dock_departure_time'
            ]);
        });
    }
};
