<?php

namespace App\Http\Controllers;

use App\Models\AccessLog;
use App\Models\VesselOperator;
use App\Models\ExitOperator;
use App\Models\ShipmentOrder;
use App\Models\Client;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Helpers\OperationalTimeHelper;

class SurveillanceController extends Controller
{
    /**
     * Main Surveillance Hub with 2 Cards: Control de Accesos y Salidas de Operadores
     */
    public function index()
    {
        $pendingCount = AccessLog::whereIn('status', ['pending', 'rejected'])->count();
        $inPlantCount = AccessLog::where('status', 'in_plant')->whereNull('exit_at')->count();
        $vetoedCount = ExitOperator::where('status', 'vetoed')->count();

        return Inertia::render('Surveillance/Index', [
            'pending_count'  => $pendingCount,
            'in_plant_count' => $inPlantCount,
            'vetoed_count'   => $vetoedCount,
        ]);
    }

    /**
     * Submodule 1: Control de Accesos (Registro Escaneo, Pendientes, Historial)
     */
    public function accessIndex()
    {
        $pending = AccessLog::with(['subject', 'user', 'shipmentOrders'])
            ->whereIn('status', ['pending', 'rejected'])
            ->orderBy('created_at', 'desc')
            ->get();

        $inPlantCount = AccessLog::where('status', 'in_plant')
            ->whereNull('exit_at')
            ->count();

        return Inertia::render('Surveillance/Access', [
            'pending_logs'   => $pending,
            'in_plant_count' => $inPlantCount,
            'history'        => AccessLog::with([
                'subject',
                'user',
                'shipmentOrders.client',
                'shipmentOrders.items.product',
                'shipmentOrders.origin',
            ])
                ->where('status', 'completed')
                ->whereNotNull('exit_at')
                ->orderBy('exit_at', 'desc')
                ->paginate(15)
        ]);
    }

    /**
     * Helper to resolve the active weight ticket for a ShipmentOrder
     */
    private function resolveOrderTicket($order)
    {
        if (!$order) return null;
        if ($order->weight_ticket && $order->weight_ticket->weighing_status !== 'cancelled') {
            return $order->weight_ticket;
        }
        if ($order->relationLoaded('loadingOrders')) {
            foreach ($order->loadingOrders as $lo) {
                if ($lo->weight_ticket && $lo->weight_ticket->weighing_status !== 'cancelled') {
                    return $lo->weight_ticket;
                }
            }
        }
        return $order->weight_ticket;
    }

    /**
     * Helper: Determine if a ShipmentOrder is completed (final destare ticket registered/generated)
     * or exempt from blocking exit (cancelled).
     */
    private function isOrderCompleted($order): bool
    {
        if (!$order) return true;

        // If order is cancelled, it is exempt and does not block exit
        if ($order->status === 'cancelled') {
            return true;
        }

        // Completed / closed order status
        if (in_array($order->status, ['completed', 'closed'])) {
            return true;
        }

        // Scale destare marked completed
        if (($order->destare_status ?? '') === 'completed') {
            return true;
        }

        // Final destare weight ticket registered and generated (weigh_out_at is present and status is completed)
        $ticket = $this->resolveOrderTicket($order);
        if ($ticket) {
            if ($ticket->weighing_status === 'completed' && !empty($ticket->weigh_out_at)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Submodule 2: Salidas de Operadores (En Planta, Vincular Órdenes y Dar Salida)
     */
    public function exitsIndex()
    {
        $logs = AccessLog::with([
            'subject',
            'user',
            'shipmentOrders' => function ($q) {
                $q->whereNotIn('shipment_orders.status', ['closed']);
            },
            'shipmentOrders.items.product',
            'shipmentOrders.client',
            'shipmentOrders.weight_ticket',
            'shipmentOrders.loadingOrders.weight_ticket',
            'shipmentOrders.origin'
        ])
            ->where('status', 'in_plant')
            ->whereNull('exit_at')
            ->orderBy('entry_at', 'desc')
            ->get();

        $inPlant = $logs->map(function ($log) {
            $uncompletedFolios = [];
            $hasSader = false;
            $activeOrders = $log->shipmentOrders->whereNotIn('status', ['closed']);
            $orders = $activeOrders->map(function ($order) use (&$uncompletedFolios, &$hasSader) {
                $isCompleted = $this->isOrderCompleted($order);
                $isCancelled = ($order->status === 'cancelled');
                $hasDestare  = $isCompleted && !$isCancelled;
                $consignedTo = strtoupper(trim($order->consigned_to ?? ''));
                $clientName  = strtoupper(trim($order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? ''));
                $destination = strtoupper(trim($order->destination ?? ''));

                $isSader     = (strpos($consignedTo, 'SADER') !== false) ||
                               (strpos($clientName, 'SADER') !== false) ||
                               (strpos($destination, 'SADER') !== false);

                if ($isSader) {
                    $hasSader = true;
                }

                if (!$isCompleted && !$isCancelled) {
                    $uncompletedFolios[] = $order->folio ?? $order->id;
                }

                return [
                    'id'             => $order->id,
                    'folio'          => $order->folio ?? $order->id,
                    'status'         => $order->status,
                    'destare_status' => $order->destare_status ?? 'pending',
                    'is_completed'   => $isCompleted,
                    'is_cancelled'   => $isCancelled,
                    'has_destare'    => $hasDestare,
                    'is_sader'       => $isSader,
                    'consigned_to'   => $order->consigned_to ?? 'N/A',
                    'client'         => $order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? 'N/A',
                    'client_name'    => $order->client_name ?? $order->client?->business_name ?? $order->client?->name ?? 'N/A',
                    'destination'    => $order->destination ?? 'N/A',
                    'product'        => $order->items->first()?->product?->name ?? $order->product ?? 'N/A',
                    'quantity'       => $order->items->sum('quantity') ?: ($order->programmed_tons ?? 0),
                    'origin'         => $order->origin?->name ?? $order->origin ?? 'N/A',
                ];
            });

            $log->shipment_orders_data = $orders->values()->all();
            $log->shipment_orders = $orders->values()->all();
            $log->setRelation('shipmentOrders', $orders);
            $log->can_exit = empty($uncompletedFolios);
            $log->uncompleted_folios = $uncompletedFolios;
            $log->has_sader_orders = $hasSader;

            return $log;
        });

        $pendingCount = AccessLog::whereIn('status', ['pending', 'rejected'])->count();

        return Inertia::render('Surveillance/Exits', [
            'in_plant'      => $inPlant,
            'pending_count' => $pendingCount,
        ]);
    }

    /**
     * Helper to query active & valid ShipmentOrders for an operator (ExitOperator or VesselOperator)
     * (Takes only orders in pending / destaradas, strictly excluding cancelled, closed, completed,
     * and orders that are ALREADY linked to an active in-plant AccessLog).
     */
    private function queryAvailableOrdersForOperator($subject, $type, array $excludedOrderIds = null)
    {
        if (!$subject) {
            return [];
        }

        if ($excludedOrderIds === null) {
            // Exclude orders that are currently inside the plant with active AccessLogs
            $excludedOrderIds = \DB::table('access_log_shipment_order')
                ->join('access_logs', 'access_logs.id', '=', 'access_log_shipment_order.access_log_id')
                ->where('access_logs.status', 'in_plant')
                ->whereNull('access_logs.exit_at')
                ->pluck('access_log_shipment_order.shipment_order_id')
                ->toArray();
        }

        $operatorName = trim($subject->name ?? $subject->operator_name ?? '');
        $tractorPlate = trim($subject->tractor_plate ?? '');
        $economicNumber = trim($subject->economic_number ?? '');
        $subjectId = $subject->id ?? null;

        $query = ShipmentOrder::whereNotIn('status', ['cancelled', 'closed', 'completed']);

        if (!empty($excludedOrderIds)) {
            $query->whereNotIn('id', $excludedOrderIds);
        }

        return $query->where(function ($q) use ($subject, $type, $operatorName, $tractorPlate, $economicNumber, $subjectId) {
                if ($type === 'App\Models\ExitOperator' && $subjectId) {
                    $q->whereHas('loadingOrders', fn($lq) => $lq->where('exit_operator_id', $subjectId));
                } elseif ($type === 'App\Models\VesselOperator' && $subjectId) {
                    $q->whereHas('loadingOrders', fn($lq) => $lq->where('vessel_operator_id', $subjectId));
                }

                if (!empty($operatorName) && !empty($tractorPlate)) {
                    $q->orWhere(function ($sq) use ($operatorName, $tractorPlate) {
                        $sq->where('operator_name', 'like', "%{$operatorName}%")
                           ->where('tractor_plate', 'like', "%{$tractorPlate}%");
                    });
                }
                if (!empty($tractorPlate)) {
                    $q->orWhere('tractor_plate', $tractorPlate);
                }
                if (!empty($operatorName)) {
                    $q->orWhere('operator_name', 'like', "%{$operatorName}%");
                }
                if (!empty($economicNumber)) {
                    $q->orWhere('economic_number', $economicNumber);
                }
            })
            ->with(['client', 'items.product', 'origin', 'weight_ticket', 'loadingOrders.weight_ticket'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->filter(function ($o) {
                // Filter out already completed / destaradas or cancelled orders
                return !$this->isOrderCompleted($o) && $o->status !== 'cancelled';
            })
            ->values()
            ->map(function ($o) {
                $consignedTo = strtoupper(trim($o->consigned_to ?? ''));
                $clientName  = strtoupper(trim($o->client?->business_name ?? $o->client?->name ?? $o->client_name ?? ''));
                $destination = strtoupper(trim($o->destination ?? ''));

                $isSader = (strpos($consignedTo, 'SADER') !== false) ||
                           (strpos($clientName, 'SADER') !== false) ||
                           (strpos($destination, 'SADER') !== false);

                return [
                    'id'             => $o->id,
                    'folio'          => $o->folio ?? $o->id,
                    'status'         => $o->status,
                    'destare_status' => $o->destare_status ?? 'pending',
                    'is_completed'   => false,
                    'is_cancelled'   => false,
                    'has_destare'    => false,
                    'is_sader'       => $isSader,
                    'consigned_to'   => $o->consigned_to ?? 'N/A',
                    'client'         => $o->client?->business_name ?? $o->client?->name ?? $o->client_name ?? 'N/A',
                    'client_name'    => $o->client_name ?? $o->client?->business_name ?? $o->client?->name ?? 'N/A',
                    'destination'    => $o->destination ?? 'N/A',
                    'product'        => $o->items->first()?->product?->name ?? $o->product ?? 'N/A',
                    'quantity'       => $o->items->sum('quantity') ?: ($o->programmed_tons ?? 0),
                    'origin'         => $o->origin?->name ?? $o->origin ?? 'N/A',
                ];
            });
    }

    /**
     * API to get available orders for an existing AccessLog (used in Salidas submodule)
     */
    public function getAvailableOrders($logId)
    {
        $log = AccessLog::with('subject')->findOrFail($logId);
        $subject = $log->subject;
        $type = $log->subject_type;

        // Exclude orders linked to OTHER active in-plant logs (allow this log's current orders)
        $inPlantOtherOrderIds = \DB::table('access_log_shipment_order')
            ->join('access_logs', 'access_logs.id', '=', 'access_log_shipment_order.access_log_id')
            ->where('access_logs.status', 'in_plant')
            ->where('access_logs.id', '!=', $logId)
            ->whereNull('access_logs.exit_at')
            ->pluck('access_log_shipment_order.shipment_order_id')
            ->toArray();

        $orders = $this->queryAvailableOrdersForOperator($subject, $type, $inPlantOtherOrderIds);
        $linkedOrderIds = $log->shipmentOrders()->pluck('shipment_orders.id')->toArray();

        return response()->json([
            'orders'           => $orders,
            'linked_order_ids' => $linkedOrderIds,
        ]);
    }

    /**
     * API to search/scan operator and create pending log
     */
    public function scan(Request $request)
    {
        $rawQr = $request->input('qr');
        $qr = strtoupper(trim($rawQr));
        $qr = str_replace(['?', "'", '-'], '_', $qr);

        $subject = null;
        $type = null;

        if (str_starts_with($qr, 'OP_EXIT') || str_starts_with($qr, 'OP-EXIT')) {
            $id = (int) filter_var($qr, FILTER_SANITIZE_NUMBER_INT);
            $subject = ExitOperator::find($id);
            $type = 'App\Models\ExitOperator';
        } elseif (str_starts_with($qr, 'OP')) {
            $id = (int) filter_var($qr, FILTER_SANITIZE_NUMBER_INT);
            $subject = VesselOperator::with('vessel')->find($id);
            $type = 'App\Models\VesselOperator';
        } else {
            return response()->json(['error' => "Formato QR no reconocido. Recibido: '{$rawQr}'"], 404);
        }

        if (!$subject) {
            return response()->json(['error' => "Operador no encontrado."], 404);
        }

        if (isset($subject->status) && $subject->status === 'vetoed') {
            return response()->json(['error' => "ESTE OPERADOR SE ENCUENTRA VETADO."], 403);
        }

        // Check if currently inside (In Plant)
        $activeLog = AccessLog::where('subject_id', $subject->id)
            ->where('subject_type', $type)
            ->where('status', 'in_plant')
            ->whereNull('exit_at')
            ->first();

        if ($activeLog) {
            return response()->json(['error' => "El operador ya se encuentra en planta."], 422);
        }

        // Check if already pending
        $pendingLog = AccessLog::where('subject_id', $subject->id)
            ->where('subject_type', $type)
            ->where('status', 'pending')
            ->first();

        if ($pendingLog) {
            return response()->json(['error' => "El operador ya está en la lista de espera (Pendientes)."], 422);
        }

        // Query active ShipmentOrders (excluding cancelled and closed)
        $availableOrders = $this->queryAvailableOrdersForOperator($subject, $type);

        // Create Pending Log
        $pendingAccessLog = AccessLog::create([
            'subject_id'   => $subject->id,
            'subject_type' => $type,
            'status'       => 'pending',
            'user_id'      => auth()->id()
        ]);

        return response()->json([
            'message'          => 'Operador agregado a la lista de pendientes.',
            'subject'          => $subject,
            'log'              => $pendingAccessLog,
            'available_orders' => $availableOrders,
        ]);
    }

    /**
     * Attach selected ShipmentOrders to an AccessLog (1 to 3 orders).
     * POST /surveillance/{logId}/orders
     */
    public function attachOrders(Request $request, $logId)
    {
        $request->validate([
            'order_ids'   => 'required|array|min:1|max:3',
            'order_ids.*' => 'required|string|exists:shipment_orders,id',
        ]);

        $log = AccessLog::findOrFail($logId);
        $log->shipmentOrders()->sync($request->order_ids);

        return back()->with('success', 'Órdenes de embarque vinculadas correctamente.');
    }

    /**
     * Authorize Entry or Hold (from pending)
     */
    public function store(Request $request)
    {
        $request->validate([
            'log_id'     => 'required|exists:access_logs,id',
            'authorized' => 'nullable|boolean',
            'action'     => 'nullable|string',
            'notes'      => 'nullable|string',
        ]);

        $log = AccessLog::findOrFail($request->log_id);

        if ($request->action === 'hold') {
            $log->update([
                'status'  => 'pending',
                'notes'   => $request->notes,
                'user_id' => auth()->id()
            ]);
            return back()->with('success', 'Motivo de espera guardado correctamente.');
        }

        if ($request->authorized) {
            $log->update([
                'status'           => 'in_plant',
                'entry_at'         => Carbon::now(),
                'checklist_passed' => true,
                'user_id'          => auth()->id()
            ]);

            // Auto-link active orders for this operator
            if ($log->shipmentOrders()->count() === 0 && $log->subject) {
                $autoOrders = $this->queryAvailableOrdersForOperator($log->subject, $log->subject_type);
                $orderIds = collect($autoOrders)->pluck('id')->take(3)->toArray();
                if (!empty($orderIds)) {
                    $log->shipmentOrders()->sync($orderIds);
                }
            }

            return back()->with('success', 'Acceso autorizado correctamente.');
        } else {
            $log->update([
                'status'  => 'rejected',
                'notes'   => $request->notes,
                'user_id' => auth()->id()
            ]);
            return back()->with('warning', 'Acceso denegado.');
        }
    }

    /**
     * Delete log
     */
    public function destroy($id)
    {
        $log = AccessLog::findOrFail($id);
        $log->delete();
        return back()->with('success', 'Registro eliminado correctamente.');
    }

    /**
     * Register Exit (with manual timestamp) and auto-close linked shipment orders
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'exit_at'          => 'required|date',
            'order_id'         => 'nullable|string',
            'convoy_number'    => 'nullable|string',
            'convoy_validated' => 'nullable|boolean',
        ]);

        $log = AccessLog::with(['shipmentOrders.weight_ticket', 'shipmentOrders.loadingOrders.weight_ticket', 'shipmentOrders.client', 'subject'])->findOrFail($id);

        if ($log->exit_at && $log->status === 'completed') {
            return back()->with('error', 'Este registro ya tiene salida marcada.');
        }

        $orderId = $request->input('order_id');

        if ($orderId) {
            // Check out a specific completed ShipmentOrder
            $order = ShipmentOrder::with(['client', 'weight_ticket', 'loadingOrders.weight_ticket'])->find($orderId);
            if (!$order) {
                return back()->with('error', 'Orden de embarque no encontrada.');
            }

            // Validate that this specific order is completed (or cancelled)
            if (!$this->isOrderCompleted($order)) {
                $folio = $order->folio ?? $order->id;
                return back()->with('error', "No se puede dar salida: La orden de embarque [{$folio}] no ha completado el pesaje/destare en báscula.");
            }

            // Validate SADER Convoy if this specific order is SADER
            $consignedTo = strtoupper(trim($order->consigned_to ?? ''));
            $clientName  = strtoupper(trim($order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? ''));
            $destination = strtoupper(trim($order->destination ?? ''));
            $isSader     = (strpos($consignedTo, 'SADER') !== false) ||
                           (strpos($clientName, 'SADER') !== false) ||
                           (strpos($destination, 'SADER') !== false);

            if ($isSader) {
                $convoyNumber = trim($request->input('convoy_number', ''));
                $convoyValidated = $request->boolean('convoy_validated');

                if (empty($convoyNumber) || !$convoyValidated) {
                    $folio = $order->folio ?? $order->id;
                    return back()->with('error', "Validación de Convoy requerida: La orden [{$folio}] tiene consignado SADER y requiere ingresar el número de convoy y confirmación de custodia.");
                }
            }

            // Mark order as closed
            if (!in_array($order->status, ['cancelled', 'closed'])) {
                $order->update(['status' => 'closed']);
            }

            $notes = $log->notes;
            if ($isSader && !empty($request->convoy_number)) {
                $convoyNote = "[CONVOY SADER: {$request->convoy_number} - Orden: {$order->folio}]";
                $notes = $notes ? ($notes . " | " . $convoyNote) : $convoyNote;
            }

            // Check if there are any remaining active orders for this access log
            $remainingActiveOrders = $log->shipmentOrders()
                ->where('shipment_orders.id', '!=', $order->id)
                ->whereNotIn('shipment_orders.status', ['cancelled', 'closed'])
                ->exists();

            if (!$remainingActiveOrders) {
                // All orders for this operator have completed and exited
                $log->update([
                    'exit_at' => Carbon::parse($request->exit_at),
                    'status'  => 'completed',
                    'notes'   => $notes,
                ]);
            } else {
                // Operator stays in plant for their remaining pending orders
                $log->update([
                    'notes' => $notes,
                ]);
            }

            return back()->with('success', "Salida de la orden {$order->folio} registrada correctamente.");
        }

        // Full Operator Exit (all linked orders or no orders)
        $activeOrders = $log->shipmentOrders()->whereNotIn('shipment_orders.status', ['cancelled', 'closed'])->get();

        $hasSader = false;
        $saderFolios = [];
        $uncompleted = [];

        foreach ($activeOrders as $order) {
            $consignedTo = strtoupper(trim($order->consigned_to ?? ''));
            $clientName  = strtoupper(trim($order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? ''));
            $destination = strtoupper(trim($order->destination ?? ''));

            if (strpos($consignedTo, 'SADER') !== false || strpos($clientName, 'SADER') !== false || strpos($destination, 'SADER') !== false) {
                $hasSader = true;
                $saderFolios[] = $order->folio ?? $order->id;
            }

            if (!$this->isOrderCompleted($order)) {
                $uncompleted[] = $order->folio ?? $order->id;
            }
        }

        if ($hasSader) {
            $convoyNumber = trim($request->input('convoy_number', ''));
            $convoyValidated = $request->boolean('convoy_validated');

            if (empty($convoyNumber) || !$convoyValidated) {
                $foliosStr = implode(', ', $saderFolios);
                return back()->with('error', "Validación de Convoy requerida: La(s) orden(es) [{$foliosStr}] tienen consignado SADER y requieren ingresar el número de convoy y confirmación.");
            }
        }

        if (!empty($uncompleted)) {
            $folios = implode(', ', $uncompleted);
            return back()->with('error', "No se puede dar salida: La(s) orden(es) [{$folios}] no han sido completadas en báscula.");
        }

        $notes = $log->notes;
        if ($hasSader && !empty($request->convoy_number)) {
            $convoyNote = "[CONVOY SADER: {$request->convoy_number}]";
            $notes = $notes ? ($notes . " | " . $convoyNote) : $convoyNote;
        }

        $log->update([
            'exit_at' => Carbon::parse($request->exit_at),
            'status'  => 'completed',
            'notes'   => $notes,
        ]);

        // Auto-close active ShipmentOrders linked via pivot
        $linkedOrderIds = $activeOrders->pluck('id')->toArray();
        if (!empty($linkedOrderIds)) {
            ShipmentOrder::whereIn('id', $linkedOrderIds)
                ->whereNotIn('status', ['cancelled', 'closed'])
                ->update(['status' => 'closed']);
        }

        return back()->with('success', 'Salida registrada correctamente.');
    }

    /**
     * Register Bulk Exit (with date, time, and convoy info)
     */
    public function bulkExit(Request $request)
    {
        $request->validate([
            'items'            => 'nullable|array',
            'items.*.log_id'   => 'required_with:items|integer',
            'items.*.order_id' => 'nullable|string',
            'log_ids'          => 'nullable|array',
            'log_ids.*'        => 'integer',
            'exit_at'          => 'required|date',
            'convoy_number'    => 'nullable|string',
            'convoy_validated' => 'nullable|boolean',
        ]);

        $exitAt = Carbon::parse($request->exit_at);
        $convoyNumber = trim($request->input('convoy_number', ''));
        $convoyValidated = $request->boolean('convoy_validated');

        // Build normalized items list: [ ['log_id' => ..., 'order_id' => ...], ... ]
        $items = [];
        if ($request->has('items') && is_array($request->items)) {
            $items = $request->items;
        } elseif ($request->has('log_ids') && is_array($request->log_ids)) {
            foreach ($request->log_ids as $lid) {
                $items[] = ['log_id' => $lid, 'order_id' => null];
            }
        }

        if (empty($items)) {
            return back()->with('error', 'No se enviaron registros para dar salida.');
        }

        // Step 1: Validation pass
        foreach ($items as $item) {
            $log = AccessLog::with(['shipmentOrders.weight_ticket', 'shipmentOrders.loadingOrders.weight_ticket', 'shipmentOrders.client', 'subject'])
                ->whereNull('exit_at')
                ->find($item['log_id']);

            if (!$log) continue;

            $targetOrders = collect();
            if (!empty($item['order_id'])) {
                $order = ShipmentOrder::with(['client', 'weight_ticket', 'loadingOrders.weight_ticket'])->find($item['order_id']);
                if ($order) {
                    $targetOrders->push($order);
                }
            } else {
                $targetOrders = $log->shipmentOrders->whereNotIn('status', ['cancelled', 'closed']);
            }

            foreach ($targetOrders as $ord) {
                $consignedTo = strtoupper(trim($ord->consigned_to ?? ''));
                $clientName  = strtoupper(trim($ord->client?->business_name ?? $ord->client?->name ?? $ord->client_name ?? ''));
                $destination = strtoupper(trim($ord->destination ?? ''));
                $isSader     = (strpos($consignedTo, 'SADER') !== false) ||
                               (strpos($clientName, 'SADER') !== false) ||
                               (strpos($destination, 'SADER') !== false);

                if (!$this->isOrderCompleted($ord)) {
                    $opName = $log->subject?->operator_name ?? $log->subject?->name ?? 'Operador';
                    $folio  = $ord->folio ?? $ord->id;
                    return back()->with('error', "No se puede dar salida a {$opName}: La orden [{$folio}] no ha completado el pesaje/destare en báscula.");
                }

                if ($isSader && (empty($convoyNumber) || !$convoyValidated)) {
                    $opName = $log->subject?->operator_name ?? $log->subject?->name ?? 'Operador';
                    return back()->with('error', "Validación de Convoy requerida para {$opName}: Contiene órdenes SADER y requiere número de convoy y confirmación de custodia.");
                }
            }
        }

        // Step 2: Execution pass
        $processedCount = 0;
        foreach ($items as $item) {
            $log = AccessLog::find($item['log_id']);
            if (!$log || ($log->exit_at && $log->status === 'completed')) continue;

            if (!empty($item['order_id'])) {
                $order = ShipmentOrder::find($item['order_id']);
                if ($order && !in_array($order->status, ['cancelled', 'closed'])) {
                    $order->update(['status' => 'closed']);
                    $processedCount++;
                }

                // Check if log has remaining active orders
                $remaining = $log->shipmentOrders()
                    ->where('shipment_orders.id', '!=', $item['order_id'])
                    ->whereNotIn('shipment_orders.status', ['cancelled', 'closed'])
                    ->exists();

                if (!$remaining) {
                    $notes = $log->notes;
                    if (!empty($convoyNumber)) {
                        $convoyNote = "[CONVOY SADER: {$convoyNumber}]";
                        $notes = $notes ? ($notes . " | " . $convoyNote) : $convoyNote;
                    }
                    $log->update([
                        'exit_at' => $exitAt,
                        'status'  => 'completed',
                        'notes'   => $notes,
                    ]);
                }
            } else {
                // Full log exit
                $activeOrders = $log->shipmentOrders()->whereNotIn('shipment_orders.status', ['cancelled', 'closed'])->get();
                foreach ($activeOrders as $ord) {
                    $ord->update(['status' => 'closed']);
                    $processedCount++;
                }

                $notes = $log->notes;
                if (!empty($convoyNumber)) {
                    $convoyNote = "[CONVOY SADER: {$convoyNumber}]";
                    $notes = $notes ? ($notes . " | " . $convoyNote) : $convoyNote;
                }

                $log->update([
                    'exit_at' => $exitAt,
                    'status'  => 'completed',
                    'notes'   => $notes,
                ]);
                $processedCount++;
            }
        }

        return back()->with('success', "Salida registrada exitosamente para {$processedCount} elemento(s).");
    }

    public function vetoIndex()
    {
        return Inertia::render('Surveillance/VetoOperator');
    }

    public function searchOperators(Request $request)
    {
        $queryText = trim($request->input('q', ''));
        if (empty($queryText))
            return response()->json([]);

        return response()->json([]);
    }

    public function vetoOperator($id)
    {
        $operator = ExitOperator::findOrFail($id);
        $operator->status = 'vetoed';
        $operator->save();
        return back();
    }

    /**
     * API to scan / search a ShipmentOrder by Folio or QR,
     * detect the assigned operator and check status for entry.
     */
    public function scanOrder(Request $request)
    {
        $raw = trim($request->input('code') ?? $request->input('folio') ?? $request->input('query') ?? '');
        if (empty($raw)) {
            return response()->json(['error' => 'Por favor ingrese o escanee un folio o código de orden.'], 422);
        }

        $code = preg_replace('/^QR\s*[:#-]?\s*/i', '', $raw);

        // Find ShipmentOrder
        $order = ShipmentOrder::where('folio', $code)
            ->orWhere('id', $code)
            ->orWhere('carta_porte', $code)
            ->with([
                'client',
                'items.product',
                'origin',
                'loadingOrders.exit_operator',
                'loadingOrders.vessel_operator',
                'loadingOrders.weight_ticket',
                'weight_ticket',
            ])
            ->first();

        if (!$order) {
            // Partial match fallback
            $order = ShipmentOrder::where('folio', 'like', "%{$code}%")
                ->with([
                    'client',
                    'items.product',
                    'origin',
                    'loadingOrders.exit_operator',
                    'loadingOrders.vessel_operator',
                    'loadingOrders.weight_ticket',
                    'weight_ticket',
                ])
                ->first();
        }

        if (!$order) {
            return response()->json(['error' => "No se encontró ninguna orden de embarque con el folio o código '{$raw}'."], 404);
        }

        // Validate that order is NOT cancelled
        if ($order->status === 'cancelled') {
            return response()->json([
                'error' => "La orden de embarque '{$order->folio}' se encuentra CANCELADA y no puede utilizarse para registrar entrada.",
            ], 422);
        }

        // Validate that order is NOT already completed/destarada/closed
        if ($this->isOrderCompleted($order) || in_array($order->status, ['completed', 'closed']) || ($order->destare_status ?? '') === 'completed') {
            return response()->json([
                'error' => "La orden de embarque '{$order->folio}' ya fue DESTARADA / COMPLETADA y no se permite volver a escanearla para registrar entrada.",
            ], 422);
        }

        // Validate that order is NOT already inside plant
        $existingInPlantLog = AccessLog::where('status', 'in_plant')
            ->whereNull('exit_at')
            ->whereHas('shipmentOrders', function ($q) use ($order) {
                $q->where('shipment_orders.id', $order->id);
            })
            ->first();

        if ($existingInPlantLog) {
            $entryTime = $existingInPlantLog->entry_at ? Carbon::parse($existingInPlantLog->entry_at)->format('H:i d/m/Y') : 'recientemente';
            return response()->json([
                'error' => "La orden de embarque '{$order->folio}' ya se encuentra registrada dentro de planta (Entrada registrada a las {$entryTime}). No se permite duplicar la entrada.",
            ], 422);
        }

        // Determine Operator
        $subject = null;
        $type = 'App\Models\ExitOperator';

        // 1. Check loading orders for exit_operator
        if ($order->relationLoaded('loadingOrders')) {
            foreach ($order->loadingOrders as $lo) {
                if ($lo->exit_operator) {
                    $subject = $lo->exit_operator;
                    break;
                }
            }
        }

        // 2. Try match by name on ExitOperator
        if (!$subject && !empty($order->operator_name)) {
            $subject = ExitOperator::where('name', $order->operator_name)->first();
        }

        // 3. Try match by tractor_plate on ExitOperator
        if (!$subject && !empty($order->tractor_plate)) {
            $subject = ExitOperator::where('tractor_plate', $order->tractor_plate)->first();
        }

        // 4. If not found and operator_name is present, find or create ExitOperator
        if (!$subject && !empty($order->operator_name)) {
            $subject = ExitOperator::firstOrCreate(
                ['name' => $order->operator_name],
                [
                    'tractor_plate'   => $order->tractor_plate ?? 'S/P',
                    'trailer_plate'   => $order->trailer_plate ?? 'S/P',
                    'economic_number' => $order->economic_number ?? $order->unit_number ?? 'S/N',
                    'transport_line'  => $order->transport_company ?? $order->transporter_line ?? 'N/A',
                    'license'         => $order->license_number ?? 'N/A',
                    'status'          => 'active',
                ]
            );
        }

        if (!$subject) {
            return response()->json([
                'error' => "La orden {$order->folio} no tiene un operador asignado en el sistema.",
                'order' => $order
            ], 422);
        }

        // Check if operator is vetoed
        if ($subject->status === 'vetoed') {
            return response()->json([
                'error'   => "EL OPERADOR '{$subject->name}' ASIGNADO A ESTA ORDEN SE ENCUENTRA VETADO.",
                'subject' => $subject,
                'order'   => $order,
            ], 403);
        }

        // Query available orders for operator (excluding the primary scanned order and completed/destaradas)
        $availableOrders = collect($this->queryAvailableOrdersForOperator($subject, $type))
            ->filter(fn($o) => (string)$o['id'] !== (string)$order->id && (string)$o['folio'] !== (string)$order->folio)
            ->values()
            ->all();

        // Format order details
        $formattedOrder = [
            'id'             => $order->id,
            'folio'          => $order->folio ?? $order->id,
            'status'         => $order->status,
            'destare_status' => $order->destare_status ?? 'pending',
            'client'         => $order->client?->business_name ?? $order->client?->name ?? 'N/A',
            'product'        => $order->items->first()?->product?->name ?? $order->product_text ?? 'N/A',
            'quantity'       => $order->items->sum('quantity') ?: ($order->programmed_tons ?? 0),
            'origin'         => $order->origin?->name ?? 'N/A',
            'operator_name'  => $order->operator_name ?? $subject->name,
            'tractor_plate'  => $order->tractor_plate ?? $subject->tractor_plate,
            'economic_number'=> $order->economic_number ?? $order->unit_number ?? $subject->economic_number,
            'transport_line' => $order->transport_company ?? $subject->transport_line,
        ];

        // Delete any existing pending logs for this operator
        AccessLog::where('subject_id', $subject->id)
            ->where('subject_type', $type)
            ->where('status', 'pending')
            ->delete();

        // Automatically create in_plant AccessLog with current timestamp
        $now = Carbon::now();
        $log = AccessLog::create([
            'subject_id'       => $subject->id,
            'subject_type'     => $type,
            'status'           => 'in_plant',
            'entry_at'         => $now,
            'checklist_passed' => true,
            'user_id'          => auth()->id(),
            'notes'            => "Entrada registrada mediante escaneo de orden de embarque {$order->folio}",
        ]);

        $log->shipmentOrders()->sync([$order->id]);

        return response()->json([
            'success'          => true,
            'message'          => "¡Entrada registrada exitosamente para la orden {$order->folio} con el operador {$subject->name}!",
            'order'            => $formattedOrder,
            'subject'          => $subject,
            'log'              => $log,
            'entry_at'         => $now->toDateTimeString(),
        ]);
    }

    /**
     * Authorize direct entry for an operator scanned via ShipmentOrder.
     */
    public function authorizeOrderEntry(Request $request)
    {
        $request->validate([
            'order_id'               => 'required|string|exists:shipment_orders,id',
            'additional_order_ids'   => 'nullable|array',
            'additional_order_ids.*' => 'string|exists:shipment_orders,id',
            'notes'                  => 'nullable|string',
        ]);

        $order = ShipmentOrder::with(['weight_ticket', 'loadingOrders.weight_ticket'])->findOrFail($request->order_id);

        if ($order->status === 'cancelled') {
            return response()->json(['error' => "La orden de embarque '{$order->folio}' se encuentra cancelada."], 422);
        }

        if ($this->isOrderCompleted($order) || in_array($order->status, ['completed', 'closed']) || ($order->destare_status ?? '') === 'completed') {
            return response()->json(['error' => "La orden de embarque '{$order->folio}' ya fue destarada / completada."], 422);
        }

        // Validate that order is NOT already inside plant
        $existingInPlantLog = AccessLog::where('status', 'in_plant')
            ->whereNull('exit_at')
            ->whereHas('shipmentOrders', function ($q) use ($order) {
                $q->where('shipment_orders.id', $order->id);
            })
            ->first();

        if ($existingInPlantLog) {
            return response()->json(['error' => "La orden de embarque '{$order->folio}' ya se encuentra registrada dentro de planta."], 422);
        }

        // Resolve Operator
        $subject = null;
        $type = 'App\Models\ExitOperator';

        if ($order->relationLoaded('loadingOrders')) {
            foreach ($order->loadingOrders as $lo) {
                if ($lo->exit_operator) {
                    $subject = $lo->exit_operator;
                    break;
                }
            }
        }

        if (!$subject && !empty($order->operator_name)) {
            $subject = ExitOperator::where('name', $order->operator_name)->first();
        }

        if (!$subject && !empty($order->tractor_plate)) {
            $subject = ExitOperator::where('tractor_plate', $order->tractor_plate)->first();
        }

        if (!$subject && !empty($order->operator_name)) {
            $subject = ExitOperator::firstOrCreate(
                ['name' => $order->operator_name],
                [
                    'tractor_plate'   => $order->tractor_plate ?? 'S/P',
                    'trailer_plate'   => $order->trailer_plate ?? 'S/P',
                    'economic_number' => $order->economic_number ?? $order->unit_number ?? 'S/N',
                    'transport_line'  => $order->transport_company ?? $order->transporter_line ?? 'N/A',
                    'license'         => $order->license_number ?? 'N/A',
                    'status'          => 'active',
                ]
            );
        }

        if (!$subject) {
            return response()->json(['error' => 'No se pudo identificar el operador asignado a esta orden.'], 422);
        }

        if ($subject->status === 'vetoed') {
            return response()->json(['error' => "EL OPERADOR '{$subject->name}' SE ENCUENTRA VETADO."], 403);
        }

        // Build list of order IDs (scanned order + any valid selected additional non-completed orders, max 3)
        $additionalOrderIds = $request->input('additional_order_ids', []);
        $validAdditional = [];
        if (!empty($additionalOrderIds)) {
            $addOrders = ShipmentOrder::with(['weight_ticket', 'loadingOrders.weight_ticket'])->whereIn('id', $additionalOrderIds)->get();
            foreach ($addOrders as $addO) {
                if ($addO->id !== $order->id && $addO->status !== 'cancelled' && !$this->isOrderCompleted($addO) && !in_array($addO->status, ['completed', 'closed']) && ($addO->destare_status ?? '') !== 'completed') {
                    $validAdditional[] = $addO->id;
                }
            }
        }
        $orderIds = array_values(array_unique(array_merge([$order->id], $validAdditional)));
        $orderIds = array_slice($orderIds, 0, 3);

        // Delete any existing pending logs for this operator
        AccessLog::where('subject_id', $subject->id)
            ->where('subject_type', $type)
            ->where('status', 'pending')
            ->delete();

        // Create new in_plant AccessLog directly with entry timestamp NOW
        $now = Carbon::now();
        $log = AccessLog::create([
            'subject_id'       => $subject->id,
            'subject_type'     => $type,
            'status'           => 'in_plant',
            'entry_at'         => $now,
            'checklist_passed' => true,
            'user_id'          => auth()->id(),
            'notes'            => $request->notes ?? "Entrada registrada mediante orden de embarque {$order->folio}",
        ]);

        $log->shipmentOrders()->sync($orderIds);

        return response()->json([
            'success'  => true,
            'message'  => "¡Entrada registrada exitosamente para la orden {$order->folio} con el operador {$subject->name}!",
            'log'      => $log,
            'entry_at' => $now->toDateTimeString(),
        ]);
    }

    /**
     * Reporte de Salidas de Operadores (Formato de Vigilancia Física - Base de Datos)
     */
    public function exitsReport(Request $request)
    {
        $startDate = $request->input('start_date', $request->input('date', Carbon::today()->toDateString()));
        $endDate = $request->input('end_date', $startDate);
        $programFilter = trim($request->input('program', ''));
        $consigneeFilter = trim($request->input('consignee', ''));
        $clientFilter = trim($request->input('client', ''));

        $range = OperationalTimeHelper::getOperationalRange($startDate, $endDate);

        // Fetch logs with exit_at in range or entry_at in range or created in that range
        $logs = AccessLog::with([
            'subject',
            'user',
            'shipmentOrders.items.product',
            'shipmentOrders.client',
            'shipmentOrders.weight_ticket',
            'shipmentOrders.loadingOrders.weight_ticket',
            'shipmentOrders.origin',
        ])
            ->where(function ($q) use ($startDate, $endDate, $range) {
                $q->whereBetween('exit_at', $range)
                  ->orWhereBetween('entry_at', $range)
                  ->orWhereBetween('created_at', $range)
                  ->orWhere(function ($sq) use ($startDate, $endDate) {
                      $sq->whereIn('status', ['in_plant', 'completed'])
                         ->where(function ($w) use ($startDate, $endDate) {
                             $w->whereDate('exit_at', '>=', $startDate)->whereDate('exit_at', '<=', $endDate)
                               ->orWhere(function ($w2) use ($startDate, $endDate) {
                                   $w2->whereDate('entry_at', '>=', $startDate)->whereDate('entry_at', '<=', $endDate);
                               })
                               ->orWhere(function ($w3) use ($startDate, $endDate) {
                                   $w3->whereDate('created_at', '>=', $startDate)->whereDate('created_at', '<=', $endDate);
                               });
                         });
                  });
            })
            ->orderBy('exit_at', 'asc')
            ->orderBy('entry_at', 'asc')
            ->get();

        // Also query any ShipmentOrders completed/loaded in range
        $additionalOrders = ShipmentOrder::with([
            'items.product',
            'client',
            'weight_ticket',
            'loadingOrders.weight_ticket',
            'origin',
            'loadingOrders.exit_operator'
        ])
            ->where(function ($q) use ($startDate, $endDate, $range) {
                $q->whereBetween('loaded_at', $range)
                  ->orWhereBetween('loading_finished_at', $range)
                  ->orWhereBetween('created_at', $range)
                  ->orWhereHas('weight_ticket', function ($tq) use ($range, $startDate, $endDate) {
                      $tq->whereBetween('weigh_out_at', $range)
                         ->orWhere(function ($tq2) use ($startDate, $endDate) {
                             $tq2->whereDate('weigh_out_at', '>=', $startDate)->whereDate('weigh_out_at', '<=', $endDate);
                         });
                  });
            })
            ->whereNotIn('status', ['cancelled'])
            ->get();

        $allRows = [];
        $processedOrderIds = [];

        foreach ($logs as $log) {
            $subject = $log->subject;
            $orders = $log->shipmentOrders;

            if ($orders && $orders->count() > 0) {
                foreach ($orders as $order) {
                    $processedOrderIds[] = $order->id;
                    $ticket = $this->resolveOrderTicket($order);

                    $tons = 0.0;
                    if ($ticket && $ticket->net_weight > 0) {
                        $tons = $ticket->net_weight >= 100 ? ($ticket->net_weight / 1000) : (float)$ticket->net_weight;
                    } elseif ($order->items && $order->items->sum('quantity') > 0) {
                        $tons = (float)$order->items->sum('quantity');
                    } else {
                        $tons = (float)($order->programmed_tons ?? 0);
                    }

                    $exitDateTime = $log->exit_at ?? $ticket?->weigh_out_at ?? $log->entry_at ?? Carbon::parse($startDate);
                    $entryDateTime = $log->entry_at ?? $log->created_at ?? $ticket?->weigh_in_at;

                    $productName = $order->items->first()?->product?->name ?? $order->product_text ?? $order->product ?? 'UREA INDUSTRIAL SUPERSACO 1000 KG ENV';
                    $clientName = $order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? 'N/A';
                    $consigneeName = $order->consigned_to ?? $order->consignee ?? $order->destination ?? $clientName;

                    $allRows[] = [
                        'order_id'        => $order->id,
                        'tons'            => number_format($tons, 3, '.', ''),
                        'tons_raw'        => $tons,
                        'order_folio'     => $order->folio ?? $order->id,
                        'ticket_folio'    => $ticket?->ticket_number ?? $ticket?->folio ?? 'S/T',
                        'exit_date'       => $exitDateTime ? Carbon::parse($exitDateTime)->format('d/m/Y') : Carbon::parse($startDate)->format('d/m/Y'),
                        'caseta_time'     => $entryDateTime ? Carbon::parse($entryDateTime)->format('h:i a') : '09:00 a. m.',
                        'product'         => $productName,
                        'operator_name'   => $order->operator_name ?? $subject?->name ?? 'N/A',
                        'transport_line'  => $order->transport_company ?? $subject?->transport_line ?? 'N/A',
                        'client'          => $clientName,
                        'consignee'       => $consigneeName,
                        'unit_type'       => $order->unit_type ?? $subject?->unit_type ?? 'FULL PLATAFORMA',
                        'plates'          => $order->tractor_plate ?? $subject?->tractor_plate ?? 'S/P',
                    ];
                }
            } else if ($subject) {
                // AccessLog without explicit linked orders (fallback entry)
                $exitDateTime = $log->exit_at ?? $log->entry_at ?? Carbon::parse($startDate);
                $entryDateTime = $log->entry_at ?? $log->created_at;

                $allRows[] = [
                    'order_id'        => 'log-' . $log->id,
                    'tons'            => '0.000',
                    'tons_raw'        => 0.0,
                    'order_folio'     => 'S/O',
                    'ticket_folio'    => 'S/T',
                    'exit_date'       => $exitDateTime ? Carbon::parse($exitDateTime)->format('d/m/Y') : Carbon::parse($startDate)->format('d/m/Y'),
                    'caseta_time'     => $entryDateTime ? Carbon::parse($entryDateTime)->format('h:i a') : 'N/A',
                    'product'         => 'N/A',
                    'operator_name'   => $subject->name ?? 'N/A',
                    'transport_line'  => $subject->transport_line ?? 'N/A',
                    'client'          => 'N/A',
                    'consignee'       => 'N/A',
                    'unit_type'       => $subject->unit_type ?? 'FULL PLATAFORMA',
                    'plates'          => $subject->tractor_plate ?? 'S/P',
                ];
            }
        }

        // Add any additional shipment orders from that date range not already captured
        foreach ($additionalOrders as $order) {
            if (in_array($order->id, $processedOrderIds)) continue;

            $ticket = $this->resolveOrderTicket($order);
            $tons = 0.0;
            if ($ticket && $ticket->net_weight > 0) {
                $tons = $ticket->net_weight >= 100 ? ($ticket->net_weight / 1000) : (float)$ticket->net_weight;
            } elseif ($order->items && $order->items->sum('quantity') > 0) {
                $tons = (float)$order->items->sum('quantity');
            } else {
                $tons = (float)($order->programmed_tons ?? 0);
            }

            $exitDateTime = $ticket?->weigh_out_at ?? $order->loading_finished_at ?? $order->loaded_at ?? Carbon::parse($startDate);
            $entryDateTime = $ticket?->weigh_in_at ?? $order->created_at;
            $exitOperator = $order->loadingOrders->first()?->exit_operator;

            $productName = $order->items->first()?->product?->name ?? $order->product_text ?? $order->product ?? 'UREA INDUSTRIAL SUPERSACO 1000 KG ENV';
            $clientName = $order->client?->business_name ?? $order->client?->name ?? $order->client_name ?? 'N/A';
            $consigneeName = $order->consigned_to ?? $order->consignee ?? $order->destination ?? $clientName;

            $allRows[] = [
                'order_id'        => $order->id,
                'tons'            => number_format($tons, 3, '.', ''),
                'tons_raw'        => $tons,
                'order_folio'     => $order->folio ?? $order->id,
                'ticket_folio'    => $ticket?->ticket_number ?? $ticket?->folio ?? 'S/T',
                'exit_date'       => $exitDateTime ? Carbon::parse($exitDateTime)->format('d/m/Y') : Carbon::parse($startDate)->format('d/m/Y'),
                'caseta_time'     => $entryDateTime ? Carbon::parse($entryDateTime)->format('h:i a') : 'N/A',
                'product'         => $productName,
                'operator_name'   => $order->operator_name ?? $exitOperator?->name ?? 'N/A',
                'transport_line'  => $order->transport_company ?? $exitOperator?->transport_line ?? 'N/A',
                'client'          => $clientName,
                'consignee'       => $consigneeName,
                'unit_type'       => $order->unit_type ?? $exitOperator?->unit_type ?? 'FULL PLATAFORMA',
                'plates'          => $order->tractor_plate ?? $exitOperator?->tractor_plate ?? 'S/P',
            ];
        }

        // Distinct list for programs/products
        $programsList = array_values(array_unique(array_filter(array_merge(
            Product::pluck('name')->toArray(),
            array_column($allRows, 'product'),
            ['SADER', 'UREA INDUSTRIAL SUPERSACO 1000 KG ENV', 'UREA A GRANEL']
        ))));
        sort($programsList);

        // Distinct list for clients
        $clientsList = array_values(array_unique(array_filter(array_merge(
            Client::pluck('business_name')->toArray(),
            array_column($allRows, 'client')
        ))));
        sort($clientsList);

        // Distinct list for consignees
        $consigneesList = array_values(array_unique(array_filter(array_merge(
            ShipmentOrder::whereNotNull('consigned_to')->where('consigned_to', '!=', '')->distinct()->pluck('consigned_to')->toArray(),
            ShipmentOrder::whereNotNull('destination')->where('destination', '!=', '')->distinct()->pluck('destination')->toArray(),
            array_column($allRows, 'consignee')
        ))));
        sort($consigneesList);

        // Apply filters to rows
        $rows = array_values(array_filter($allRows, function ($r) use ($programFilter, $clientFilter, $consigneeFilter) {
            if (!empty($programFilter)) {
                $prod = mb_strtoupper($r['product'] ?? '');
                $pFilter = mb_strtoupper($programFilter);
                if (strpos($prod, $pFilter) === false) {
                    return false;
                }
            }
            if (!empty($clientFilter)) {
                $cli = mb_strtoupper($r['client'] ?? '');
                $cFilter = mb_strtoupper($clientFilter);
                if (strpos($cli, $cFilter) === false) {
                    return false;
                }
            }
            if (!empty($consigneeFilter)) {
                $cons = mb_strtoupper($r['consignee'] ?? '');
                $cnFilter = mb_strtoupper($consigneeFilter);
                if (strpos($cons, $cnFilter) === false) {
                    return false;
                }
            }
            return true;
        }));

        $totalTons = array_sum(array_column($rows, 'tons_raw'));
        $totalUnits = count($rows);
        $avgTons = $totalUnits > 0 ? ($totalTons / $totalUnits) : 0.0;

        return Inertia::render('Surveillance/ExitsReport', [
            'date'            => $startDate,
            'start_date'      => $startDate,
            'end_date'        => $endDate,
            'filters'         => [
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'program'    => $programFilter,
                'client'     => $clientFilter,
                'consignee'  => $consigneeFilter,
            ],
            'programs_list'   => $programsList,
            'clients_list'    => $clientsList,
            'consignees_list' => $consigneesList,
            'rows'            => $rows,
            'summary'         => [
                'total_tons'  => number_format($totalTons, 3, '.', ''),
                'total_units' => $totalUnits,
                'average'     => number_format($avgTons, 3, '.', ''),
            ],
            'supervisor'      => 'C. José Alfredo Fernández Jiadan',
            'position'        => 'Jefe de Vigilancia Física',
            'company'         => 'Pro- Agroindustria',
        ]);
    }

    // History endpoint for AJAX/Pagination
    public function history(Request $request)
    {
        $query = AccessLog::with(['subject', 'user', 'shipmentOrders'])
            ->whereNotNull('exit_at')
            ->orderBy('exit_at', 'desc');

        if ($request->has('date')) {
            $range = OperationalTimeHelper::getOperationalRange($request->date);
            $query->whereBetween('entry_at', $range);
        }

        return response()->json($query->paginate(15));
    }
}
