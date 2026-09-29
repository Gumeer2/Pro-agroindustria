<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_orders', 'lot_id')) {
                $table->foreignUuid('lot_id')->nullable()->after('warehouse')->constrained('lots')->nullOnDelete();
            }
            if (!Schema::hasColumn('shipment_orders', 'loading_administrator')) {
                $table->string('loading_administrator')->nullable()->after('lot_id');
            }
            if (!Schema::hasColumn('shipment_orders', 'loaded_at')) {
                $table->timestamp('loaded_at')->nullable()->after('loading_administrator');
            }
        });
    }

    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $columns = [];
            foreach (['lot_id', 'loading_administrator', 'loaded_at'] as $column) {
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
