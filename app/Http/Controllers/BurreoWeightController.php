<?php

namespace App\Http\Controllers;

use App\Models\Vessel;
use App\Models\WeightTicket;
use App\Models\ShipmentOrder;
use App\Models\VesselOperatorTrip;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class BurreoWeightController extends Controller
{
    public function index()
    {
        $vessels = Vessel::with(['client', 'product'])
            ->where('status', 'active')
            ->orWhereNotNull('provisional_burreo_weight')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Traffic/BurreoWeightManager', [
            'vessels' => $vessels
        ]);
    }

    public function updateProvisional(Request $request, Vessel $vessel)
    {
        $validated = $request->validate([
            'provisional_burreo_weight' => 'required|numeric|min:0',
        ]);

        $weightKg = $validated['provisional_burreo_weight'] * 1000;

        try {
            DB::transaction(function () use ($vessel, $weightKg, $validated) {
                // 1. Update vessel
                $vessel->update([
                    'provisional_burreo_weight' => $weightKg
                ]);

                // 2. Update all associated Burreo tickets that are NOT finalized by a draft
                // (If draft_weight is null, we are still in provisional phase)
                if ($vessel->draft_weight === null) {
                    // Update tickets linked via ShipmentOrder OR LoadingOrder
                    $tickets = WeightTicket::where(function ($query) use ($vessel) {
                        // Case A: Linked via ShipmentOrder (Legacy / Traffic)
                        $query->whereHas('shipmentOrder', function ($q) use ($vessel) {
                            $q->where('vessel_id', $vessel->id)
                                ->where('operation_type', 'burreo');
                        })
                            // Case B: Linked via LoadingOrder (APT Scans / Direct)
                            ->orWhereHas('loadingOrder', function ($q) use ($vessel) {
                                $q->where('vessel_id', $vessel->id)
                                    ->where('operation_type', 'burreo');
                            });
                    })
                        ->where('is_burreo', true)
                        ->update([
                            'tare_weight' => $weightKg,
                            'net_weight' => $weightKg
                        ]);

                    // Update Muelle Trips (VesselOperatorTrip)
                    // ONLY for Burreo operations or pending trips on Burreo vessels
                    VesselOperatorTrip::where('vessel_id', $vessel->id)
                        ->where('status', '!=', 'cancelled')
                        ->where(function ($q) {
                            $q->whereHas('loading_order', function ($sq) {
                                $sq->where('operation_type', 'burreo');
                            })
                            ->orWhere(function ($sq) {
                                $sq->whereDoesntHave('loading_order')
                                   ->whereHas('vessel', function ($v) {
                                       $v->where('apt_operation_type', 'burreo');
                                   });
                            });
                        })
                        ->update([
                            'weight' => $validated['provisional_burreo_weight'],
                            'status' => 'completed'
                        ]);
                }
            });

            return back()->with('success', 'Peso provisional actualizado y aplicado a todos los tickets.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al actualizar peso provisional: ' . $e->getMessage()]);
        }
    }

    public function applyDraft(Request $request, Vessel $vessel)
    {
        $validated = $request->validate([
            'draft_weight' => 'required|numeric|min:0',
        ]);

        $weightKg = $validated['draft_weight'] * 1000;

        try {
            DB::transaction(function () use ($vessel, $weightKg, $validated) {
                // 1. Update the vessel with the draft weight (stored in KG)
                $vessel->update([
                    'draft_weight' => $weightKg
                ]);

                // 2. Find all "Burreo" tickets for this vessel (From ShipmentOrder AND LoadingOrder)
                // We need to count unique TRIPS. 
                // A WeightTicket represents a Trip.
                $ticketsQuery = WeightTicket::where('is_burreo', true)
                    ->where(function ($query) use ($vessel) {
                        $query->whereHas('shipmentOrder', function ($q) use ($vessel) {
                            $q->where('vessel_id', $vessel->id)
                                ->where('operation_type', 'burreo');
                        })
                            ->orWhereHas('loadingOrder', function ($q) use ($vessel) {
                                $q->where('vessel_id', $vessel->id)
                                    ->where('operation_type', 'burreo');
                            });
                    });

                $burreoCount = $ticketsQuery->count();

                if ($burreoCount > 0) {
                    // 3. Update all these tickets
                    // LOGIC CHANGE: User requested DIRECT ASSIGNMENT, not division.
                    // The input 'draft_weight' is now treated as "Final Weight Per Trip", not "Total Ship Draft".
                    // (Or rather, user enters the calculated average directly).
                    $ticketsQuery->update([
                        'tare_weight' => $weightKg,
                        'net_weight' => $weightKg, // Assign directly without dividing
                    ]);

                    // Update Muelle Trips (VesselOperatorTrip)
                    VesselOperatorTrip::where('vessel_id', $vessel->id)
                        ->where('status', '!=', 'cancelled')
                        ->where(function ($q) {
                            $q->whereHas('loading_order', function ($sq) {
                                $sq->where('operation_type', 'burreo');
                            })
                            ->orWhere(function ($sq) {
                                $sq->whereDoesntHave('loading_order')
                                   ->whereHas('vessel', function ($v) {
                                       $v->where('apt_operation_type', 'burreo');
                                   });
                            });
                        })
                        ->update([
                            'weight' => $validated['draft_weight'],
                            'status' => 'completed'
                        ]);
                }
            });

            return back()->with('success', 'Peso real (Draft) recalculado y tickets actualizados.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al aplicar peso de calado: ' . $e->getMessage()]);
        }
    }
}
