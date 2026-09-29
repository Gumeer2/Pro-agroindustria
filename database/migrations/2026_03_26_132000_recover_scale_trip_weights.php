<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\VesselOperatorTrip;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration performs a ONE-TIME data recovery for VesselOperatorTrips 
     * where the weight was incorrectly overwritten by the Burreo provisional weights.
     */
    public function up(): void
    {
        // Identify trips linked to Scale operations (which should match their WeightTicket)
        $trips = VesselOperatorTrip::whereHas('loading_order', function($q) {
            $q->where('operation_type', 'scale');
        })->with(['loading_order.weight_ticket'])->get();

        $count = 0;
        foreach($trips as $trip) {
            $ticket = $trip->loading_order->weight_ticket;
            
            // If the ticket exists and has a real net weight
            if ($ticket && $ticket->net_weight > 0) {
                $realWeightMt = $ticket->net_weight / 1000;
                
                // If the trip weight is currently different (overwritten by Burreo logic)
                if (abs($trip->weight - $realWeightMt) > 0.001) {
                    $trip->update(['weight' => $realWeightMt]);
                    $count++;
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Non-reversible data restoration
    }
};
