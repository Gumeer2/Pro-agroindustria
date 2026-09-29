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
        if (!Schema::hasColumn('shipment_orders', 'operation_type')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->string('operation_type')->default('scale')->after('status')->comment('scale, burreo');
                $table->index('operation_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropColumn('operation_type');
        });
    }
};
