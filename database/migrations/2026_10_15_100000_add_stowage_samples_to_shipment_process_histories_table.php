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
            if (!Schema::hasColumn('shipment_process_histories', 'stowage_count')) {
                $table->integer('stowage_count')->nullable()->after('loading_assistant');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'samples')) {
                $table->json('samples')->nullable()->after('stowage_count');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'sampling_status')) {
                $table->string('sampling_status')->default('pending')->after('samples');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'sampling_completed_at')) {
                $table->timestamp('sampling_completed_at')->nullable()->after('sampling_status');
            }
            if (!Schema::hasColumn('shipment_process_histories', 'sampling_avg')) {
                $table->decimal('sampling_avg', 8, 3)->nullable()->after('sampling_completed_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_process_histories', function (Blueprint $table) {
            $cols = ['samples', 'sampling_status', 'sampling_completed_at', 'sampling_avg'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('shipment_process_histories', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
