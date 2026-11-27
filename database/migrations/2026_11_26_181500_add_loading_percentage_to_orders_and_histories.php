<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('shipment_orders') && !Schema::hasColumn('shipment_orders', 'loading_percentage')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->unsignedTinyInteger('loading_percentage')->default(0);
            });
        }

        if (Schema::hasTable('shipment_process_histories') && !Schema::hasColumn('shipment_process_histories', 'loading_percentage')) {
            Schema::table('shipment_process_histories', function (Blueprint $table) {
                $table->unsignedTinyInteger('loading_percentage')->default(0);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('shipment_orders') && Schema::hasColumn('shipment_orders', 'loading_percentage')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->dropColumn('loading_percentage');
            });
        }

        if (Schema::hasTable('shipment_process_histories') && Schema::hasColumn('shipment_process_histories', 'loading_percentage')) {
            Schema::table('shipment_process_histories', function (Blueprint $table) {
                $table->dropColumn('loading_percentage');
            });
        }
    }
};
