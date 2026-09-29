<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\VesselOperatorTrip;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Deleting orphaned records to fix the blanc screen issue (operator_name null)
        $count = VesselOperatorTrip::whereDoesntHave('operator')
            ->orWhereDoesntHave('vessel')
            ->count();

        if ($count > 0) {
            VesselOperatorTrip::whereDoesntHave('operator')
                ->orWhereDoesntHave('vessel')
                ->delete();

            \Illuminate\Support\Facades\Log::info("Cleaned up {$count} orphaned dock trips in migration.");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse possible for this cleanup
    }
};