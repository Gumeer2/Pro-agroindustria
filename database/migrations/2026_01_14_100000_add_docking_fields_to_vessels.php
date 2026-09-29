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
            if (!Schema::hasColumn('vessels', 'docking_date')) {
                $table->date('docking_date')->nullable()->after('eta');
            }
            if (!Schema::hasColumn('vessels', 'docking_time')) {
                $table->time('docking_time')->nullable()->after('docking_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn(['docking_date', 'docking_time']);
        });
    }
};
