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
        Schema::table('shipment_process_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_process_histories', 'stowage_plan')) {
                $table->json('stowage_plan')->nullable()->after('stowage_count');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'stowage_plan_status')) {
                $table->string('stowage_plan_status')->default('pending')->after('stowage_plan');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'stowage_plan_saved_at')) {
                $table->timestamp('stowage_plan_saved_at')->nullable()->after('stowage_plan_status');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'stowage_plan_saved_by')) {
                $table->unsignedBigInteger('stowage_plan_saved_by')->nullable()->after('stowage_plan_saved_at');
            }
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_orders', 'stowage_plan')) {
                $table->json('stowage_plan')->nullable()->after('cubicle');
            }
            if (!Schema::hasColumn('shipment_orders', 'stowage_plan_status')) {
                $table->string('stowage_plan_status')->default('pending')->after('stowage_plan');
            }
            if (!Schema::hasColumn('shipment_orders', 'stowage_plan_saved_at')) {
                $table->timestamp('stowage_plan_saved_at')->nullable()->after('stowage_plan_status');
            }
            if (!Schema::hasColumn('shipment_orders', 'stowage_plan_saved_by')) {
                $table->unsignedBigInteger('stowage_plan_saved_by')->nullable()->after('stowage_plan_saved_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_process_histories', function (Blueprint $table) {
            $cols = ['stowage_plan', 'stowage_plan_status', 'stowage_plan_saved_at', 'stowage_plan_saved_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('shipment_process_histories', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            $cols = ['stowage_plan', 'stowage_plan_status', 'stowage_plan_saved_at', 'stowage_plan_saved_by'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('shipment_orders', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};

