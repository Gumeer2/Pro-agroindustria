<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_orders', 'loading_squad_leader')) {
                $table->string('loading_squad_leader')->nullable()->after('loading_administrator');
            }
            if (!Schema::hasColumn('shipment_orders', 'loading_finished_at')) {
                $table->timestamp('loading_finished_at')->nullable()->after('loaded_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $columns = [];
            foreach (['loading_squad_leader', 'loading_finished_at'] as $column) {
                if (Schema::hasColumn('shipment_orders', $column)) {
                    $columns[] = $column;
                }
            }
            if ($columns) {
                $table->dropColumn($columns);
            }
        });
    }
};