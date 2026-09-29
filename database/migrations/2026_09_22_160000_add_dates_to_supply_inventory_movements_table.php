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
        Schema::table('supply_inventory_movements', function (Blueprint $table) {
            if (!Schema::hasColumn('supply_inventory_movements', 'entry_date')) {
                $table->date('entry_date')->nullable()->after('movement_date');
            }
            if (!Schema::hasColumn('supply_inventory_movements', 'exit_date')) {
                $table->date('exit_date')->nullable()->after('entry_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supply_inventory_movements', function (Blueprint $table) {
            if (Schema::hasColumn('supply_inventory_movements', 'exit_date')) {
                $table->dropColumn('exit_date');
            }
            if (Schema::hasColumn('supply_inventory_movements', 'entry_date')) {
                $table->dropColumn('entry_date');
            }
        });
    }
};
