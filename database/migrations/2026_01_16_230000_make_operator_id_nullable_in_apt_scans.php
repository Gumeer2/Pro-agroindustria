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
        // Use raw SQL to bypass doctrine/dbal requirement for column modification
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE apt_scans MODIFY operator_id BIGINT UNSIGNED NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE apt_scans MODIFY operator_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
