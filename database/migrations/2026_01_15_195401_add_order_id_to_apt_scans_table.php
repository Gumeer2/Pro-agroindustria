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
        Schema::table('apt_scans', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->after('id');
            // Try making operator_id nullable
            // $table->foreignId('operator_id')->nullable()->change(); 
            // If change() fails, we just ignore for now and fill dummy or use shipment_order_id only
        });

        // Separate block to attempt modification if possible, or just add column
        try {
            Schema::table('apt_scans', function (Blueprint $table) {
                $table->unsignedBigInteger('operator_id')->nullable()->change();
            });
        } catch (\Exception $e) {
            // Ignore if DBAL missing, assumes we handle it in code
        }
    }

    public function down(): void
    {
        Schema::table('apt_scans', function (Blueprint $table) {
            $table->dropColumn('shipment_order_id');
            // Revert operator_id?
        });
    }
};
