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
        Schema::table('lots', function (Blueprint $table) {
            if (!Schema::hasColumn('lots', 'product')) {
                $table->string('product')->nullable()->after('plant_origin');
            }
            if (!Schema::hasColumn('lots', 'celdas')) {
                $table->string('celdas')->nullable()->after('product');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lots', function (Blueprint $table) {
            if (Schema::hasColumn('lots', 'product')) {
                $table->dropColumn('product');
            }
            if (Schema::hasColumn('lots', 'celdas')) {
                $table->dropColumn('celdas');
            }
        });
    }
};
