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
        if (config('database.default') === 'mysql') {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // Check if index exists before dropping (MySQL specific safe check)
        $indexName = 'vessel_operators_vessel_id_operator_name_unique';
        $tableName = 'vessel_operators';

        if (config('database.default') === 'mysql') {
            $indexExists = \Illuminate\Support\Facades\DB::select(
                "SELECT COUNT(1) as count FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE table_schema=DATABASE() AND table_name='$tableName' AND index_name='$indexName'"
            )[0]->count > 0;

            if ($indexExists) {
                Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                    $table->dropUnique($indexName);
                });
            }
        } else {
            // For SQLite/Other, just try-catch (SQLite ignores dropIndex errors usually or handles them differently)
            try {
                Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                    $table->dropUnique($indexName);
                });
            } catch (\Throwable $e) {
                // Ignore
            }
        }

        if (config('database.default') === 'mysql') {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessel_operators', function (Blueprint $table) {
            $table->unique(['vessel_id', 'operator_name']);
        });
    }
};
