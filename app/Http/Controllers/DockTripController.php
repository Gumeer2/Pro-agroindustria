<?php

namespace App\Http\Controllers;

use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\VesselOperatorTrip;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DockTripController extends Controller
{
    public function index(Request $request)
    {
        $vessels = Vessel::active()->get();

        $recentTrips = VesselOperatorTrip::with(['operator', 'vessel', 'registrar'])
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Dock/Trips', [
            'vessels' => $vessels,
            'recentTrips' => $recentTrips,
            'filters' => $request->only(['date', 'vessel_id']),
        ]);
    }

    public function searchOperator(Request $request)
    {
        $request->validate([
            'qr' => 'required|string',
        ]);

        // QR Format: "OP {id}|{name}"
        $qr = $request->qr;
        if (!str_contains($qr, 'OP')) {
            return response()->json(['error' => 'Formato de QR no válido para Muelle.'], 422);
        }

        $parts = explode('|', $qr);
        $idPart = trim(str_replace('OP', '', $parts[0]));

        $operator = VesselOperator::with(['vessel'])->find($idPart);

        if (!$operator) {
            return response()->json(['error' => 'Operador no encontrado.'], 404);
        }

        // Check if vessel is active
        if (!$operator->vessel->is_active) {
            return response()->json(['error' => 'El barco vinculado a este operador ya no está activo.'], 422);
        }

        return response()->json([
            'id' => $operator->id,
            'name' => $operator->operator_name,
            'economic_number' => $operator->economic_number,
            'tractor_plate' => $operator->tractor_plate,
            'transporter_line' => $operator->transporter_line,
            'vessel' => [
                'id' => $operator->vessel->id,
                'name' => $operator->vessel->name,
                'holds' => $operator->vessel->holds,
                'operation_type' => $operator->vessel->apt_operation_type, // General operation type (scale/burreo)
                'has_chief_foreman' => $operator->vessel->has_chief_foreman,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'vessel_operator_id' => 'required|exists:vessel_operators,id',
            'hold_number' => 'required|integer',
            'operation_type' => 'required|in:Carga,Descarga',
            'notes' => 'nullable|string',
        ]);

        $vessel = Vessel::findOrFail($validated['vessel_id']);

        // STRICT CHECK 1: Only allow dock trips for vessels in 'burreo' mode 
        // OR 'scale' mode if they are marked as 'is_external_warehouse'
        if ($vessel->apt_operation_type !== 'burreo' && !$vessel->is_external_warehouse) {
            return back()->withErrors(['vessel_id' => 'ALERTA: Este barco no está configurado para registrar vueltas en muelle (Requiere Burreo o Almacén Externo).']);
        }

        // 1. Search for a pending LoadingOrder (Scale Entry MI)
        $pendingOrder = \App\Models\LoadingOrder::where('vessel_id', $vessel->id)
            ->where('vessel_operator_id', $validated['vessel_operator_id'])
            ->where('status', 'loading')
            ->orderBy('created_at', 'desc')
            ->first();

        // 2. STRICT CHECK: For external warehouse in SCALE mode, MI is mandatory
        if (!$pendingOrder && $vessel->is_external_warehouse && $vessel->apt_operation_type === 'scale') {
            return back()->withErrors([
                'vessel_operator_id' => 'OPERACIÓN BLOQUEADA: Esta unidad no ha registrado su entrada en Báscula (Ticket MI). Debe pasar a Báscula primero.'
            ]);
        }

        // 3. WEIGHT VALIDATION: If Burreo Auto-creation is likely, check weights
        $automaticWeightKg = $vessel->draft_weight ?? $vessel->provisional_burreo_weight;
        if (!$pendingOrder && $vessel->apt_operation_type === 'burreo' && $vessel->is_external_warehouse) {
            if (!$automaticWeightKg || $automaticWeightKg <= 0) {
                return back()->withErrors([
                    'vessel_id' => 'ALERTA: El barco no tiene "Pesos de Burreo" configurados. Ingrese el peso en el módulo de Tráfico primero.'
                ]);
            }
        }

        // 4. PREVENT DUPLICATES (Existing logic)
        if ($pendingOrder && $pendingOrder->vessel_operator_trip_id) {
            return back()->withErrors([
                'vessel_operator_id' => 'OPERACIÓN BLOQUEADA: Esta unidad ya tiene registrada su vuelta en muelle para esta entrada de báscula.'
            ]);
        }

        $activeTrip = VesselOperatorTrip::where('vessel_operator_id', $validated['vessel_operator_id'])
            ->where('vessel_id', $validated['vessel_id'])
            ->whereDoesntHave('loading_order')
            ->first();

        if ($activeTrip) {
            return back()->withErrors([
                'vessel_operator_id' => 'OPERACIÓN BLOQUEADA: El operador ya tiene un viaje activo registrado en muelle. Debe completar su proceso actual antes de iniciar una nueva vuelta.'
            ]);
        }

        // 5. ATOMIC EXECUTION
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($vessel, $validated, $pendingOrder, $automaticWeightKg) {
                // Determine if we should auto-complete (Only if Burreo + External AND no Scale Order)
                $isBurreoExternal = ($vessel->apt_operation_type === 'burreo' && $vessel->is_external_warehouse && !$pendingOrder);
                
                $trip = VesselOperatorTrip::create([
                    ...$validated,
                    'registered_by' => Auth::id(),
                    'start_time' => now(),
                    'weight' => $automaticWeightKg ? ($automaticWeightKg / 1000) : null,
                    'status' => $isBurreoExternal ? 'completed' : 'pending',
                ]);

                if ($pendingOrder) {
                    // Link to existing Scale Order
                    $pendingOrder->update(['vessel_operator_trip_id' => $trip->id]);
                } elseif ($isBurreoExternal) {
                    // AUTO-CREATE LoadingOrder + WeightTicket
                    $operator = VesselOperator::find($validated['vessel_operator_id']);
                    
                    $order = \App\Models\LoadingOrder::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'folio' => 'BUR-EXT-' . date('Ymd-His') . '-' . rand(100, 999),
                        'entry_at' => now(),
                        'vessel_id' => $vessel->id,
                        'client_id' => $vessel->client_id,
                        'product_id' => $vessel->product_id,
                        'vessel_operator_id' => $operator->id,
                        'status' => 'completed',
                        'operator_name' => $operator->operator_name,
                        'economic_number' => $operator->economic_number,
                        'tractor_plate' => $operator->tractor_plate,
                        'trailer_plate' => $operator->trailer_plate,
                        'unit_type' => $operator->unit_type,
                        'transport_company' => $operator->transporter_line,
                        'operation_type' => 'burreo',
                        'warehouse' => 'ALMACÉN CLIENTE',
                        'cubicle' => 'EXTERNO',
                        'vessel_operator_trip_id' => $trip->id,
                    ]);

                    \App\Models\WeightTicket::create([
                        'loading_order_id' => $order->id,
                        'ticket_number' => 'B-' . $order->folio,
                        'weighing_status' => 'completed',
                        'weighmaster_id' => auth()->id(),
                        'is_burreo' => true,
                        'tare_weight' => $automaticWeightKg,
                        'net_weight' => $automaticWeightKg,
                        'weigh_in_at' => now(),
                        'weigh_out_at' => now(),
                    ]);
                }
            });

            return redirect()->back()->with('success', 'Viaje registrado correctamente.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Error al procesar el viaje: ' . $e->getMessage()]);
        }

        return redirect()->back()->with('success', 'Viaje registrado correctamente.');
    }

    public function destroy($id)
    {
        $trip = VesselOperatorTrip::findOrFail($id);
        $trip->delete();

        return redirect()->back()->with('success', 'Registro eliminado.');
    }
}
