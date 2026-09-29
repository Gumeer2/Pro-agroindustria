<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\ShipmentOrder;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $this->keepOneAndMerge('Blue Commander');
            $this->keepOneAndMerge('Nordorinoco');

            // Delete all others
            $allowedNames = ['Blue Commander', 'Nordorinoco'];

            // Get IDs of vessels that are NOT in the allowed list (searching by fuzzy match first to be safe, but ultimately we want to keep specific IDs)
            // Actually, we've already standardized the names of the ones we kept to exactly "Blue Commander" and "Nordorinoco" (or just kept their IDs).

            // Let's find IDs to keep.
            $keptIds = Vessel::whereIn('name', $allowedNames)->pluck('id')->toArray();

            // Find vessels to delete (those not in keptIds)
            $vesselsToDelete = Vessel::whereNotIn('id', $keptIds)->get();

            foreach ($vesselsToDelete as $vessel) {
                // Delete dependencies to maintain integrity (no orphans)
                VesselOperator::where('vessel_id', $vessel->id)->delete();
                ShipmentOrder::where('vessel_id', $vessel->id)->delete();
                // Add other potential dependencies here if any

                $vessel->delete();
            }
        });
    }

    protected function keepOneAndMerge($name)
    {
        // Find all vessels matching the name (case insensitive or partial)
        $candidates = Vessel::where('name', 'LIKE', "%{$name}%")->orderBy('created_at', 'desc')->get();

        if ($candidates->isEmpty()) {
            return;
        }

        // Keep the most recent one (or could be oldest, depending on preference. effectively arbitrary if duplicates).
        // Let's keep the first one in the list (desc created_at = newest).
        $master = $candidates->first();

        // Ensure exact name
        if ($master->name !== $name) {
            $master->update(['name' => $name]);
        }

        $masterId = $master->id;

        // Process duplicates
        foreach ($candidates as $duplicate) {
            if ($duplicate->id === $masterId) {
                continue;
            }

            // Handle Vessel Operators collisions (Avoid Duplicate entry error)
            $duplicateOperators = VesselOperator::where('vessel_id', $duplicate->id)->get();
            foreach ($duplicateOperators as $dupOp) {
                // Check if this operator already exists on the Master vessel
                $masterOp = VesselOperator::where('vessel_id', $masterId)
                    ->where('operator_name', $dupOp->operator_name)
                    ->first();

                if ($masterOp) {
                    // Collision! Master already has this operator.
                    // 1. Move any children of $dupOp to $masterOp (e.g. AptScans)
                    if (Schema::hasTable('apt_scans')) {
                        DB::table('apt_scans')->where('operator_id', $dupOp->id)->update(['operator_id' => $masterOp->id]);
                    }

                    // 2. Delete the duplicate operator since we merged its data
                    $dupOp->delete();
                } else {
                    // No collision, just move it to master
                    $dupOp->update(['vessel_id' => $masterId]);
                }
            }

            // Move ShipmentOrders
            ShipmentOrder::where('vessel_id', $duplicate->id)->update(['vessel_id' => $masterId]);

            // Delete Duplicate
            $duplicate->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot recover deleted data.
    }
};
