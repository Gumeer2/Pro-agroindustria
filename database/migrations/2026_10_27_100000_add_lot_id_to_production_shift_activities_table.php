<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('production_shift_activities') && !Schema::hasColumn('production_shift_activities', 'lot_id')) {
            Schema::table('production_shift_activities', function (Blueprint $table) {
                $table->uuid('lot_id')->nullable()->after('production_shift_start_id')->index();
            });

            // Backfill existing activities with the shift start's main lot_id
            try {
                DB::table('production_shift_activities')
                    ->whereNull('lot_id')
                    ->join('production_shift_starts', 'production_shift_activities.production_shift_start_id', '=', 'production_shift_starts.id')
                    ->update(['production_shift_activities.lot_id' => DB::raw('production_shift_starts.lot_id')]);
            } catch (\Throwable $e) {
                // Ignore if backfill fails
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('production_shift_activities') && Schema::hasColumn('production_shift_activities', 'lot_id')) {
            Schema::table('production_shift_activities', function (Blueprint $table) {
                $table->dropColumn('lot_id');
            });
        }
    }
};
