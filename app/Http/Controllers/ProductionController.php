<?php

namespace App\Http\Controllers;

use App\Models\LlenaderasHistory;
use App\Models\Lot;
use App\Models\ShipmentOrder;
use App\Models\ShipmentProcessHistory;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductionController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Production/Index', [
            'context_module' => 'production',
        ]);
    }

    public function llenaderas(Request $request)
    {
        $warehouseId = (int) $request->input('warehouse_id', 1);
        $history = $this->getLlenaderasHistory();
        $lots = Lot::orderBy('folio')->get(['id', 'folio', 'warehouse']);

        return Inertia::render('Production/Llenaderas', [
            'context_module' => 'production',
            'initialHistory' => $history,
            'lots' => $lots,
            'selectedWarehouse' => $warehouseId,
        ]);
    }

    public function history(Request $request)
    {
        return response()->json([
            'success' => true,
            'history' => $this->getLlenaderasHistory(),
        ]);
    }

    private function findOrderByIdentifier(string $rawIdentifier): ?ShipmentOrder
    {
        $clean = trim($rawIdentifier);
        if ($clean === '') {
            return null;
        }

        $folio = strtoupper(preg_replace('/^QR\s*[:#-]?\s*/i', '', $clean));
        $folioHyphen = str_replace(["'", '/', '?', '_', '.'], '-', $folio);

        $order = ShipmentOrder::with(['items.product', 'lot', 'latestProcessHistory', 'sales_order.product'])
            ->where(function ($q) use ($clean, $folio, $folioHyphen) {
                $q->where('folio', $folioHyphen)
                    ->orWhere('folio', $folio)
                    ->orWhere('folio', $clean)
                    ->orWhere('qr_code', $folio)
                    ->orWhere('id', $clean);
            })
            ->first();

        if (!$order) {
            $normalizedFolio = preg_replace('/[^A-Z0-9]/', '', $folio);
            if ($normalizedFolio !== '') {
                $stripNonAlnum = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(%s), '-', ''), '_', ''), ' ', ''), '.', ''), \"'\", ''), '/', '')";
                $order = ShipmentOrder::with(['items.product', 'lot', 'latestProcessHistory', 'sales_order.product'])
                    ->where(function ($query) use ($stripNonAlnum, $normalizedFolio) {
                        $query->whereRaw(sprintf($stripNonAlnum, 'folio') . ' = ?', [$normalizedFolio])
                            ->orWhereRaw(sprintf($stripNonAlnum, 'qr_code') . ' = ?', [$normalizedFolio]);
                    })
                    ->first();
            }
        }

        return $order;
    }

    private function isAmmoniaOrder(?ShipmentOrder $order): bool
    {
        if (!$order) {
            return false;
        }

        $folio = strtoupper(trim((string) ($order->folio ?? '')));
        if ($folio !== '' && (preg_match('/^PA\d{4}-AMO-\d+/i', $folio) || str_contains($folio, '-AMO-'))) {
            return true;
        }

        $prodText = mb_strtoupper(trim((string) (is_string($order->product) ? $order->product : ($order->product?->name ?? ''))), 'UTF-8');
        if (
            $prodText !== '' && (
                str_contains($prodText, 'AMONIACO') ||
                str_contains($prodText, 'AMONÍACO') ||
                str_contains($prodText, 'NH3') ||
                str_contains($prodText, 'SERVICIO DE CARGA')
            )
        ) {
            return true;
        }

        $soFolio = strtoupper(trim((string) ($order->sales_order?->folio ?? '')));
        if ($soFolio !== '' && (str_starts_with($soFolio, 'OV-AMO') || str_contains($soFolio, '-AMO'))) {
            return true;
        }

        $soProd = mb_strtoupper(trim((string) ($order->sales_order?->product?->name ?? '')), 'UTF-8');
        if (
            $soProd !== '' && (
                str_contains($soProd, 'AMONIACO') ||
                str_contains($soProd, 'AMONÍACO') ||
                str_contains($soProd, 'NH3') ||
                str_contains($soProd, 'SERVICIO DE CARGA')
            )
        ) {
            return true;
        }

        if ($order->relationLoaded('items') && $order->items) {
            foreach ($order->items as $item) {
                $itemProd = mb_strtoupper(trim((string) ($item->product?->name ?? '')), 'UTF-8');
                if (
                    $itemProd !== '' && (
                        str_contains($itemProd, 'AMONIACO') ||
                        str_contains($itemProd, 'AMONÍACO') ||
                        str_contains($itemProd, 'NH3') ||
                        str_contains($itemProd, 'SERVICIO DE CARGA')
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    private function hasCompletedTare(ShipmentOrder $order): bool
    {
        return \App\Models\WeightTicket::where('shipment_order_id', $order->id)
            ->where('weighing_status', '!=', 'cancelled')
            ->whereNotNull('weigh_in_at')
            ->exists()
            || $order->loadingOrders()
                ->whereHas('weight_ticket', function ($query) {
                    $query->where('weighing_status', '!=', 'cancelled')
                        ->whereNotNull('weigh_in_at');
                })
                ->exists();
    }

    public function searchOrder(Request $request)
    {
        $query = trim((string) $request->input('q', $request->input('folio')));
        if (!$query) {
            return response()->json(['success' => false, 'message' => 'Folio requerido.'], 422);
        }

        $order = $this->findOrderByIdentifier($query);

        if (!$order) {
            return response()->json(['success' => false, 'message' => "No se encontró la orden con folio {$query}."], 404);
        }

        if (!$this->isAmmoniaOrder($order)) {
            return response()->json([
                'success' => false,
                'message' => "El módulo de Llenaderas es exclusivo para órdenes de Amoniaco (la orden {$order->folio} no corresponde a Amoniaco).",
            ], 422);
        }

        if ($order->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => "La orden {$order->folio} se encuentra cancelada."], 422);
        }

        if (!$this->hasCompletedTare($order)) {
            return response()->json([
                'success' => false,
                'message' => "La orden {$order->folio} aún no cuenta con pesaje de Tara en Báscula. Debe registrar primero la Tara antes de pasar al módulo de Llenaderas.",
            ], 422);
        }

        $warehouse = $request->input('warehouse') ?: ($order->warehouse ?: 'Almacén 01');
        $history = LlenaderasHistory::where('shipment_order_id', $order->id)->latest()->first();

        // Al escanear la OE en Llenaderas, registrarla en su tabla si aún no está registrada para habilitar Iniciar Carga y Finalizar Carga en las acciones
        if (!$history) {
            $plates = collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A';
            $history = LlenaderasHistory::create([
                'shipment_order_id' => $order->id,
                'folio' => $order->folio,
                'lot_id' => $order->lot_id,
                'warehouse' => $warehouse,
                'operator' => $order->operator_name,
                'product' => $order->product ?: 'AMONIACO ANHIDRO NH3',
                'presentation' => $order->presentation ?: 'GRANEL',
                'stowage_text' => $order->presentation ?: 'GRANEL',
                'plates' => $plates,
                'started_at' => $order->loaded_at,
                'finished_at' => $order->loading_finished_at,
                'loading_percentage' => (int) ($order->loading_percentage ?? 0),
                'status' => $order->loading_finished_at ? 'completed' : ($order->loaded_at ? 'loading' : 'pending'),
            ]);
            if (empty($order->warehouse)) {
                $order->update(['warehouse' => $warehouse]);
            }
        }

        $formatted = $this->formatProcessHistoryItemDirect($order->fresh(['items.product', 'lot', 'sales_order.product']), $history->fresh(['lot']));

        return response()->json([
            'success' => true,
            'order' => $formatted,
        ]);
    }

    public function startLoading(Request $request)
    {
        $identifier = trim((string) $request->input('identifier', $request->input('folio', $request->input('id'))));
        if (!$identifier) {
            return response()->json(['success' => false, 'message' => 'Folio o ID requerido.'], 422);
        }

        $order = $this->findOrderByIdentifier($identifier);

        if (!$order) {
            return response()->json(['success' => false, 'message' => "No se encontró la orden especificada."], 404);
        }

        if (!$this->isAmmoniaOrder($order)) {
            return response()->json([
                'success' => false,
                'message' => "El módulo de Llenaderas es exclusivo para órdenes de Amoniaco.",
            ], 422);
        }

        if (!$this->hasCompletedTare($order)) {
            return response()->json([
                'success' => false,
                'message' => "La orden {$order->folio} debe registrar primero su peso de Tara en Báscula antes de iniciar la carga.",
            ], 422);
        }

        $now = Carbon::now();
        $warehouse = $request->input('warehouse') ?: ($order->warehouse ?: 'Almacén 01');
        $lotId = $request->input('lot_id') ?: $order->lot_id;
        $plates = collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A';

        $order->update([
            'loaded_at' => $order->loaded_at ?: $now,
            'loading_finished_at' => null,
            'status' => 'loading',
            'warehouse' => $warehouse,
            'lot_id' => $lotId,
        ]);

        $history = LlenaderasHistory::where('shipment_order_id', $order->id)->latest()->first();
        if ($history) {
            $history->update([
                'warehouse' => $warehouse,
                'lot_id' => $lotId ?: $history->lot_id,
                'started_at' => $history->started_at ?: $now,
                'finished_at' => null,
                'status' => 'loading',
            ]);
        } else {
            $history = LlenaderasHistory::create([
                'shipment_order_id' => $order->id,
                'folio' => $order->folio,
                'lot_id' => $lotId,
                'warehouse' => $warehouse,
                'operator' => $order->operator_name,
                'product' => $order->product ?: 'AMONIACO ANHIDRO NH3',
                'presentation' => $order->presentation ?: 'GRANEL',
                'stowage_text' => $order->presentation ?: 'GRANEL',
                'plates' => $plates,
                'started_at' => $now,
                'status' => 'loading',
                'loading_percentage' => (int) ($order->loading_percentage ?? 0),
            ]);
        }

        $formatted = $this->formatProcessHistoryItemDirect($order->fresh(['items.product', 'lot', 'sales_order.product']), $history->fresh(['lot']));

        return response()->json([
            'success' => true,
            'message' => "Carga iniciada con éxito para la orden {$order->folio}.",
            'order' => $formatted,
        ]);
    }

    public function finishLoading(Request $request)
    {
        $identifier = trim((string) $request->input('identifier', $request->input('folio', $request->input('id'))));
        if (!$identifier) {
            return response()->json(['success' => false, 'message' => 'Folio o ID requerido.'], 422);
        }

        $order = $this->findOrderByIdentifier($identifier);

        if (!$order) {
            return response()->json(['success' => false, 'message' => "No se encontró la orden especificada."], 404);
        }

        if (!$this->isAmmoniaOrder($order)) {
            return response()->json([
                'success' => false,
                'message' => "El módulo de Llenaderas es exclusivo para órdenes de Amoniaco.",
            ], 422);
        }

        $history = LlenaderasHistory::where('shipment_order_id', $order->id)->latest()->first();
        if (!$order->loaded_at && (!$history || !$history->started_at)) {
            return response()->json([
                'success' => false,
                'message' => "Debe iniciar la carga de la orden {$order->folio} antes de poder finalizarla.",
            ], 422);
        }

        $now = Carbon::now();

        $order->update([
            'loading_finished_at' => $now,
            'status' => 'loading',
        ]);

        if ($history) {
            $history->update([
                'finished_at' => $now,
                'status' => 'completed',
            ]);
        } else {
            $plates = collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A';
            $history = LlenaderasHistory::create([
                'shipment_order_id' => $order->id,
                'folio' => $order->folio,
                'lot_id' => $order->lot_id,
                'warehouse' => $order->warehouse ?: 'Almacén 01',
                'operator' => $order->operator_name,
                'product' => $order->product ?: 'AMONIACO ANHIDRO NH3',
                'presentation' => $order->presentation ?: 'GRANEL',
                'stowage_text' => $order->presentation ?: 'GRANEL',
                'plates' => $plates,
                'started_at' => $order->loaded_at ?: $now,
                'finished_at' => $now,
                'status' => 'completed',
                'loading_percentage' => (int) ($order->loading_percentage ?? 0),
            ]);
        }

        $formatted = $this->formatProcessHistoryItemDirect($order->fresh(['items.product', 'lot', 'sales_order.product']), $history->fresh(['lot']));

        return response()->json([
            'success' => true,
            'message' => "Carga finalizada con éxito para la orden {$order->folio}. El destare en Báscula ha sido habilitado.",
            'order' => $formatted,
        ]);
    }

    public function updatePercentage(Request $request)
    {
        $identifier = trim((string) $request->input('identifier', $request->input('folio', $request->input('id'))));
        if (!$identifier) {
            return response()->json(['success' => false, 'message' => 'Folio o ID requerido.'], 422);
        }

        $order = $this->findOrderByIdentifier($identifier);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'No se encontró la orden especificada.'], 404);
        }

        if (!$this->isAmmoniaOrder($order)) {
            return response()->json([
                'success' => false,
                'message' => 'El módulo de Llenaderas es exclusivo para órdenes de Amoniaco.',
            ], 422);
        }

        $history = LlenaderasHistory::where('shipment_order_id', $order->id)->latest()->first();
        $isStarted = (bool) ($order->loaded_at || $history?->started_at);
        $isFinished = (bool) ($order->loading_finished_at || $history?->finished_at);

        if (!$isStarted || $isFinished) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede modificar el avance durante el proceso de carga.',
            ], 422);
        }

        $percentage = (int) $request->input('percentage', 0);
        $percentage = max(0, min(100, $percentage));

        $order->update([
            'loading_percentage' => $percentage,
        ]);

        if ($history) {
            $history->update([
                'loading_percentage' => $percentage,
            ]);
        }

        $formatted = $this->formatProcessHistoryItemDirect($order->fresh(['items.product', 'lot', 'sales_order.product']), $history?->fresh(['lot']));

        return response()->json([
            'success' => true,
            'message' => "Avance actualizado a {$percentage}%.",
            'percentage' => $percentage,
            'order' => $formatted,
        ]);
    }

    private function getLlenaderasHistory()
    {
        $histories = LlenaderasHistory::with(['shipmentOrder.items.product', 'shipmentOrder.sales_order.product', 'lot'])
            ->orderByRaw('CASE WHEN started_at IS NULL AND finished_at IS NULL THEN 0 WHEN finished_at IS NULL THEN 1 ELSE 2 END')
            ->orderByRaw('COALESCE(started_at, created_at) DESC')
            ->orderByDesc('id')
            ->get();

        $processedOrderIds = $histories->pluck('shipment_order_id')->filter()->unique()->toArray();
        $historyItems = collect();

        foreach ($histories as $lh) {
            $historyItems->push($this->formatProcessHistoryItemDirect($lh->shipmentOrder, $lh));
        }

        $stowageOrders = ShipmentOrder::with(['items.product', 'lot', 'sales_order.product'])
            ->whereNotIn('id', $processedOrderIds)
            ->where(function ($q) {
                $q->where('folio', 'like', 'PA%-AMO-%')
                    ->orWhere('product', 'like', '%AMON%')
                    ->orWhere('product', 'like', '%NH3%')
                    ->orWhere('product', 'like', '%SERVICIO DE CARGA%')
                    ->orWhereHas('sales_order', function ($sq) {
                        $sq->where('folio', 'like', '%AMO%')
                            ->orWhereHas('product', fn($pq) => $pq->where('name', 'like', '%AMON%')->orWhere('name', 'like', '%NH3%')->orWhere('name', 'like', '%SERVICIO DE CARGA%'));
                    });
            })
            ->where(function ($q) {
                $q->whereNotNull('loaded_at')
                    ->orWhereNotNull('loading_finished_at')
                    ->orWhere('status', 'loading')
                    ->orWhere('status', 'loaded');
            })
            ->orderByDesc('updated_at')
            ->get()
            ->filter(fn($so) => $this->isAmmoniaOrder($so));

        foreach ($stowageOrders as $so) {
            $history = LlenaderasHistory::where('shipment_order_id', $so->id)->latest()->first();
            $historyItems->push($this->formatProcessHistoryItemDirect($so, $history));
        }

        return $historyItems->values();
    }

    private function formatProcessHistoryItemDirect(?ShipmentOrder $order, $history): array
    {
        $warehouse = $history?->warehouse ?: ($order?->warehouse ?: 'Almacén 01');
        $startedAt = $history?->started_at ?? $order?->loaded_at;
        $finishedAt = $history?->finished_at ?? $order?->loading_finished_at;
        $plates = $history?->plates ?: ($order ? collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') : 'N/A');
        $operator = $history?->operator ?: ($order?->operator_name ?? 'N/A');
        $product = $history?->product ?: ($order?->product ?? ($order?->items?->first()?->product?->name ?? 'AMONIACO ANHIDRO NH3'));
        $presentation = $history?->presentation ?: ($order?->presentation ?? 'GRANEL');
        $stowageText = $history?->stowage_text ?: ($order?->presentation ?? 'GRANEL');
        $loadingPercentage = (int) ($history?->loading_percentage ?? $order?->loading_percentage ?? 0);

        return [
            'id' => $order ? $order->id : (string) $history?->id,
            'history_id' => $history?->id,
            'shipment_order_id' => $order?->id ?? $history?->shipment_order_id,
            'folio' => $history?->folio ?? ($order?->folio ?? 'N/A'),
            'warehouse' => $warehouse,
            'lot_id' => $history?->lot_id ?? $order?->lot_id,
            'lot_folio' => $history?->lot?->folio ?? ($order?->lot?->folio ?? 'N/A'),
            'operator' => $operator,
            'squad_leader' => 'N/A',
            'product' => $product,
            'presentation' => $presentation,
            'stowage_text' => $stowageText,
            'plates' => $plates ?: 'N/A',
            'started_at' => $startedAt ? Carbon::parse($startedAt)->toIso8601String() : null,
            'finished_at' => $finishedAt ? Carbon::parse($finishedAt)->toIso8601String() : null,
            'started_at_formatted' => $startedAt ? Carbon::parse($startedAt)->format('d/m/y, g:i a') : null,
            'finished_at_formatted' => $finishedAt ? Carbon::parse($finishedAt)->format('d/m/y, g:i a') : null,
            'status' => $finishedAt ? 'finished' : ($startedAt ? 'loading' : 'pending'),
            'loading_percentage' => $loadingPercentage,
        ];
    }
}
