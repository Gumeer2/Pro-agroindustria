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
        // This is a REPEAT of the cleanup logic because the Seeder might have re-populated junk data in previous deployments.
        DB::transaction(function () {
            // Arrays of authorized names
            $allowedNames = ['Blue Commander', 'Nordorinoco'];

            // 1. Unify Blue Commander
            $this->keepOneAndMerge('Blue Commander');
            // 2. Unify Nordorinoco
            $this->keepOneAndMerge('Nordorinoco');

            // 3. Delete everything else
            // Get valid IDs (after merge)
            $keptIds = Vessel::whereIn('name', $allowedNames)->pluck('id')->toArray();

            // Safety check: if we have 0 kept IDs, don't delete everything blindly.
            if (!empty($keptIds)) {
                $vesselsToDelete = Vessel::whereNotIn('id', $keptIds)->get();

                foreach ($vesselsToDelete as $vessel) {
                    // Delete dependencies
                    VesselOperator::where('vessel_id', $vessel->id)->delete();
                    ShipmentOrder::where('vessel_id', $vessel->id)->delete();

                    $vessel->delete();
                }
            }
        });
    }

    protected function keepOneAndMerge($name)
    {
        $candidates = Vessel::where('name', 'LIKE', "%{$name}%")->orderBy('created_at', 'desc')->get();

        if ($candidates->isEmpty()) {
            return;
        }

        $master = $candidates->first();
        if ($master->name !== $name) {
            $master->update(['name' => $name]);
        }
        $masterId = $master->id;

        foreach ($candidates as $duplicate) {
            if ($duplicate->id === $masterId) {
                continue;
            }

            // Handle Vessel Operators collisions
            $duplicateOperators = VesselOperator::where('vessel_id', $duplicate->id)->get();
            foreach ($duplicateOperators as $dupOp) {
                // Check if this operator already exists on the Master
                $masterOp = VesselOperator::where('vessel_id', $masterId)
                    ->where('operator_name', $dupOp->operator_name)
                    ->first();

                if ($masterOp) {
                    // Update dependencies of the duplicate operator to point to the master operator (e.g. scans)
                    if (Schema::hasTable('apt_scans')) {
                        DB::table('apt_scans')->where('operator_id', $dupOp->id)->update(['operator_id' => $masterOp->id]);
                    }
                    $dupOp->delete();
                } else {
                    $dupOp->update(['vessel_id' => $masterId]);
                }
            }

            // Move ShipmentOrders
            ShipmentOrder::where('vessel_id', $duplicate->id)->update(['vessel_id' => $masterId]);

            // Delete Duplicate Vessel
            $duplicate->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down
    }
};
