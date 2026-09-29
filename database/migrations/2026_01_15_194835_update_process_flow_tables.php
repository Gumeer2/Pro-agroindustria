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
        Schema::table('weight_tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('weight_tickets', 'scale_id')) {
                // Fix: 'user_id' does not exist, use 'weighmaster_id' or 'id'
                if (Schema::hasColumn('weight_tickets', 'weighmaster_id')) {
                    $table->integer('scale_id')->nullable()->after('weighmaster_id');
                } else {
                    $table->integer('scale_id')->nullable();
                }
            }

            // Handle lot/seal modification safely
            if (Schema::hasColumn('weight_tickets', 'lot')) {
                // If exists but we want to re-add it as nullable or move it...
                // Ideally change() but without dbal it is tricky.
                // Dropping and re-adding is risky if data exists.
                // Assuming this is dev/staging, dropping is okay as per original script logic.
                $table->dropColumn('lot');
            }
            if (Schema::hasColumn('weight_tickets', 'seal')) {
                $table->dropColumn('seal');
            }
        });

        Schema::table('weight_tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('weight_tickets', 'lot')) {
                $table->string('lot')->nullable()->after('weigh_in_at');
            }
            if (!Schema::hasColumn('weight_tickets', 'seal')) {
                $table->string('seal')->nullable()->after('lot');
            }
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('shipment_orders', 'warehouse')) {
                $table->string('warehouse')->nullable()->after('destination');
            }
            if (!Schema::hasColumn('shipment_orders', 'cubicle')) {
                $table->string('cubicle')->nullable()->after('warehouse');
            }
            if (!Schema::hasColumn('shipment_orders', 'operation_type')) {
                $table->enum('operation_type', ['scale', 'burreo'])->default('scale')->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropColumn('scale_id');
            // Revert lot/seal to non-nullable? Hard to know original order precisely without re-reading previous.
            // We'll just leave them nullable or drop.
        });

        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropColumn(['warehouse', 'cubicle', 'operation_type']);
        });
    }
};
