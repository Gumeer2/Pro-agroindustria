<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Invert current values for all vessels
        DB::table('vessels')->get()->each(function ($vessel) {
            DB::table('vessels')
                ->where('id', $vessel->id)
                ->update(['has_chief_foreman' => !$vessel->has_chief_foreman]);
            Log::info("Inverting Chief Foreman for Vessel ID: {$vessel->id} ({$vessel->name})");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Invert back
        DB::table('vessels')->get()->each(function ($vessel) {
            DB::table('vessels')
                ->where('id', $vessel->id)
                ->update(['has_chief_foreman' => !$vessel->has_chief_foreman]);
        });
    }
};
