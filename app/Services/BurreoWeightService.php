<?php

namespace App\Services;

use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\VesselOperatorTrip;
use App\Models\WeightTicket;
use App\Models\LoadingOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BurreoWeightService
{
    /**
     * Get statistics and unit-type averages for a specific vessel in burreo mode.
     */
    public static function getVesselBurreoStats(string $vesselId): array
    {
        $vessel = Vessel::with(['client', 'product'])->find($vesselId);
        if (!$vessel) {
            return [];
        }

        // Get all unique unit types defined in operators or orders for this vessel
        $operatorUnitTypes = VesselOperator::where('vessel_id', $vesselId)
            ->whereNotNull('unit_type')
            ->where('unit_type', '!=', '')
            ->distinct()
            ->pluck('unit_type')
            ->toArray();

        $orderUnitTypes = LoadingOrder::where('vessel_id', $vesselId)
            ->whereNotNull('unit_type')
            ->where('unit_type', '!=', '')
            ->distinct()
            ->pluck('unit_type')
            ->toArray();

        $unitTypes = array_values(array_unique(array_filter(array_merge($operatorUnitTypes, $orderUnitTypes))));
        sort($unitTypes);

        $breakdown = [];
        $totalWeighedAll = 0;
        $totalWeightKgAll = 0;
        $totalTripsAll = 0;

        foreach ($unitTypes as $unitType) {
            // Find completed tickets with weighed scale net_weight > 0
            $weighedTickets = WeightTicket::whereHas('loadingOrder', function ($q) use ($vesselId, $unitType) {
                $q->where('vessel_id', $vesselId)
                    ->where(function ($sq) use ($unitType) {
                        $sq->where('unit_type', $unitType)
                            ->orWhereHas('vessel_operator', function ($opQ) use ($unitType) {
                                $opQ->where('unit_type', $unitType);
                            });
                    });
            })
                ->where('weighing_status', 'completed')
                ->where('net_weight', '>', 0)
                ->get(['id', 'net_weight', 'tare_weight', 'gross_weight']);

            $weighedCount = $weighedTickets->count();
            $totalKg = (float) $weighedTickets->sum('net_weight');
            $avgKg = $weighedCount > 0 ? round($totalKg / $weighedCount, 2) : 0;
            $avgTm = $avgKg > 0 ? round($avgKg / 1000, 3) : 0;

            // Total trips registered in muelle for this unit type
            $tripsCount = VesselOperatorTrip::where('vessel_id', $vesselId)
                ->where('status', '!=', 'cancelled')
                ->whereHas('operator', function ($q) use ($unitType) {
                    $q->where('unit_type', $unitType);
                })
                ->count();

            // Check current applied average on trips
            $appliedSample = VesselOperatorTrip::where('vessel_id', $vesselId)
                ->where('status', '!=', 'cancelled')
                ->whereHas('operator', function ($q) use ($unitType) {
                    $q->where('unit_type', $unitType);
                })
                ->whereNotNull('weight')
                ->latest()
                ->value('weight');

            $totalWeighedAll += $weighedCount;
            $totalWeightKgAll += $totalKg;
            $totalTripsAll += $tripsCount;

            $breakdown[] = [
                'unit_type' => $unitType,
                'weighed_count' => $weighedCount,
                'total_weight_kg' => $totalKg,
                'total_weight_tm' => round($totalKg / 1000, 3),
                'average_weight_kg' => $avgKg,
                'average_weight_tm' => $avgTm,
                'total_trips' => $tripsCount,
                'applied_weight_tm' => $appliedSample ? (float) $appliedSample : null,
                'is_applied' => $avgTm > 0 && $appliedSample && abs($appliedSample - $avgTm) < 0.001,
            ];
        }

        return [
            'vessel_id' => $vessel->id,
            'vessel_name' => $vessel->name,
            'client_name' => $vessel->client->business_name ?? ($vessel->client->name ?? 'N/A'),
            'product_name' => $vessel->product->name ?? 'N/A',
            'apt_operation_type' => $vessel->apt_operation_type,
            'is_burreo' => $vessel->apt_operation_type === 'burreo',
            'total_weighed' => $totalWeighedAll,
            'total_weight_tm' => round($totalWeightKgAll / 1000, 3),
            'total_trips' => $totalTripsAll,
            'unit_types' => $breakdown,
        ];
    }

    /**
     * Calculate and apply unit averages for a given vessel and unit type.
     */
    public static function applyUnitAverage(string $vesselId, string $unitType): array
    {
        $weighedTickets = WeightTicket::whereHas('loadingOrder', function ($q) use ($vesselId, $unitType) {
            $q->where('vessel_id', $vesselId)
                ->where(function ($sq) use ($unitType) {
                    $sq->where('unit_type', $unitType)
                        ->orWhereHas('vessel_operator', function ($opQ) use ($unitType) {
                            $opQ->where('unit_type', $unitType);
                        });
                });
        })
            ->where('weighing_status', 'completed')
            ->where('net_weight', '>', 0)
            ->get(['id', 'net_weight']);

        $count = $weighedTickets->count();
        if ($count === 0) {
            return [
                'success' => false,
                'message' => "No hay unidades pesadas en báscula para el tipo {$unitType}."
            ];
        }

        $totalKg = (float) $weighedTickets->sum('net_weight');
        $avgKg = round($totalKg / $count, 2);
        $avgTm = round($avgKg / 1000, 3);

        DB::transaction(function () use ($vesselId, $unitType, $avgKg, $avgTm) {
            // 1. Update VesselOperatorTrip for this unit type
            VesselOperatorTrip::where('vessel_id', $vesselId)
                ->where('status', '!=', 'cancelled')
                ->whereHas('operator', function ($q) use ($unitType) {
                    $q->where('unit_type', $unitType);
                })
                ->update([
                    'weight' => $avgTm,
                    'status' => 'completed'
                ]);

            // 2. Update auto-generated burreo WeightTickets of this unit type
            WeightTicket::where('is_burreo', true)
                ->whereHas('loadingOrder', function ($q) use ($vesselId, $unitType) {
                    $q->where('vessel_id', $vesselId)
                        ->where(function ($sq) use ($unitType) {
                            $sq->where('unit_type', $unitType)
                                ->orWhereHas('vessel_operator', function ($opQ) use ($unitType) {
                                    $opQ->where('unit_type', $unitType);
                                });
                        });
                })
                ->update([
                    'tare_weight' => $avgKg,
                    'net_weight' => $avgKg,
                    'gross_weight' => $avgKg,
                ]);
        });

        Log::info("Burreo average applied for Vessel {$vesselId} - Unit Type {$unitType}: {$avgTm} TM ({$avgKg} kg) across {$count} weighed units.");

        return [
            'success' => true,
            'unit_type' => $unitType,
            'average_kg' => $avgKg,
            'average_tm' => $avgTm,
            'weighed_count' => $count,
        ];
    }

    /**
     * Calculate and apply averages for all unit types for a vessel.
     */
    public static function calculateAndApplyAll(string $vesselId): array
    {
        $stats = self::getVesselBurreoStats($vesselId);
        $results = [];

        foreach ($stats['unit_types'] ?? [] as $ut) {
            if ($ut['weighed_count'] > 0) {
                $res = self::applyUnitAverage($vesselId, $ut['unit_type']);
                $results[] = $res;
            }
        }

        return [
            'success' => true,
            'applied' => $results,
            'stats' => self::getVesselBurreoStats($vesselId),
        ];
    }

    /**
     * Get the latest average weight in kg for an operator's unit type on their vessel.
     */
    public static function getAverageWeightKgForOperator(int $vesselOperatorId): ?float
    {
        $operator = VesselOperator::find($vesselOperatorId);
        if (!$operator || !$operator->vessel_id || !$operator->unit_type) {
            return null;
        }

        $weighedTickets = WeightTicket::whereHas('loadingOrder', function ($q) use ($operator) {
            $q->where('vessel_id', $operator->vessel_id)
                ->where(function ($sq) use ($operator) {
                    $sq->where('unit_type', $operator->unit_type)
                        ->orWhereHas('vessel_operator', function ($opQ) use ($operator) {
                            $opQ->where('unit_type', $operator->unit_type);
                        });
                });
        })
            ->where('weighing_status', 'completed')
            ->where('net_weight', '>', 0)
            ->get(['id', 'net_weight']);

        if ($weighedTickets->count() === 0) {
            return null;
        }

        return round($weighedTickets->sum('net_weight') / $weighedTickets->count(), 2);
    }
}
