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
        Schema::table('access_logs', function (Blueprint $table) {
            $table->timestamp('entry_at')->nullable()->change();
        });

        // Add 'pending' to Enum using raw SQL only if and only if we are in MySQL
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE access_logs MODIFY COLUMN status ENUM('in_plant', 'completed', 'rejected', 'authorized', 'pending') NOT NULL DEFAULT 'in_plant'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('access_logs', function (Blueprint $table) {
            $table->timestamp('entry_at')->useCurrent()->change();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE access_logs MODIFY COLUMN status ENUM('in_plant', 'completed', 'rejected', 'authorized') NOT NULL DEFAULT 'in_plant'");
        }
    }
};
