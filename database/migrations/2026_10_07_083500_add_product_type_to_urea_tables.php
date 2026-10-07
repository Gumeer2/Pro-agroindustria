<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('urea_daily_productions') && !Schema::hasColumn('urea_daily_productions', 'product_type')) {
            Schema::table('urea_daily_productions', function (Blueprint $table) {
                $table->string('product_type', 50)->default('agricola')->after('plant_origin');
            });
        }

        if (Schema::hasTable('urea_initial_inventories') && !Schema::hasColumn('urea_initial_inventories', 'product_type')) {
            Schema::table('urea_initial_inventories', function (Blueprint $table) {
                $table->string('product_type', 50)->default('agricola')->after('plant_origin');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('urea_daily_productions') && Schema::hasColumn('urea_daily_productions', 'product_type')) {
            Schema::table('urea_daily_productions', function (Blueprint $table) {
                $table->dropColumn('product_type');
            });
        }

        if (Schema::hasTable('urea_initial_inventories') && Schema::hasColumn('urea_initial_inventories', 'product_type')) {
            Schema::table('urea_initial_inventories', function (Blueprint $table) {
                $table->dropColumn('product_type');
            });
        }
    }
};
