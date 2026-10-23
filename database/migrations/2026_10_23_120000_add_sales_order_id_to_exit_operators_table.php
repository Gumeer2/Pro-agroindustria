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
        if (Schema::hasTable('exit_operators') && !Schema::hasColumn('exit_operators', 'sales_order_id')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $table->uuid('sales_order_id')->nullable()->after('sack');
            });
        }

        if (Schema::hasTable('client_exit_operator') && !Schema::hasColumn('client_exit_operator', 'sales_order_id')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                $table->uuid('sales_order_id')->nullable()->after('sack');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('exit_operators') && Schema::hasColumn('exit_operators', 'sales_order_id')) {
            Schema::table('exit_operators', function (Blueprint $table) {
                $table->dropColumn('sales_order_id');
            });
        }

        if (Schema::hasTable('client_exit_operator') && Schema::hasColumn('client_exit_operator', 'sales_order_id')) {
            Schema::table('client_exit_operator', function (Blueprint $table) {
                $table->dropColumn('sales_order_id');
            });
        }
    }
};
