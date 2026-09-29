<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $orphans = DB::table('production_shift_starts as ps')
            ->leftJoin('production_shift_start_lot as psl', function ($join) {
                $join->on('ps.id', '=', 'psl.production_shift_start_id')
                    ->on('ps.lot_id', '=', 'psl.lot_id');
            })
            ->whereNull('psl.production_shift_start_id')
            ->whereNotNull('ps.lot_id')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('lots')
                    ->whereColumn('lots.id', 'ps.lot_id');
            })
            ->select('ps.id', 'ps.lot_id')
            ->get();

        foreach ($orphans as $orphan) {
            DB::table('production_shift_start_lot')->insertOrIgnore([
                'production_shift_start_id' => $orphan->id,
                'lot_id' => $orphan->lot_id,
                'status' => 'open',
            ]);
        }
    }

    public function down(): void
    {
        // No down action needed for data backfill
    }
};
