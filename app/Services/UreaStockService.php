<?php

namespace App\Services;

use App\Models\LoadingOrder;
use App\Models\ShipmentOrder;
use App\Models\UreaDailyProduction;
use App\Models\UreaInitialInventory;
use App\Models\WeightTicket;
use Illuminate\Support\Facades\DB;

class UreaStockService
{
    /**
     * Normalize warehouse string to standard key: "Almacen 1", "Almacen 2", etc.
     */
    public static function normalizeWarehouse(?string $wh): ?string
    {
        if (!$wh) {
            return null;
        }

        $clean = trim($wh);
        // Replace accented e with regular e
        $clean = str_ireplace('almacén', 'Almacen', $clean);
        $clean = str_ireplace('almacen', 'Almacen', $clean);

        if (preg_match('/Almacen\s*([1-5])/i', $clean, $m)) {
            return 'Almacen ' . $m[1];
        }

        return $clean;
    }

    /**
     * Determine product type ('agricola' | 'industrial' | null) from string or model.
     */
    public static function resolveProductType($product): ?string
    {
        if (!$product) {
            return null;
        }

        $name = '';
        if (is_string($product)) {
            $name = $product;
        } elseif (is_object($product)) {
            if (isset($product->name)) {
                $name = $product->name;
            } elseif (isset($product->product)) {
                $name = is_string($product->product) ? $product->product : ($product->product->name ?? '');
            }
        }

        $upper = strtoupper($name);

        if (str_contains($upper, 'AGRICOLA') || str_contains($upper, 'AGRÍCOLA')) {
            return 'agricola';
        }

        if (str_contains($upper, 'INDUSTRIAL')) {
            return 'industrial';
        }

        return null;
    }

    /**
     * Detect product type for a LoadingOrder or ShipmentOrder.
     */
    public static function getOrderProductType($order): ?string
    {
        if (!$order) {
            return null;
        }

        // 1. Direct product relation
        if (isset($order->product) && $order->product) {
            $type = self::resolveProductType($order->product);
            if ($type) return $type;
        }

        // 2. Direct product_id
        if (!empty($order->product_id)) {
            $prod = \App\Models\Product::find($order->product_id);
            if ($prod) {
                $type = self::resolveProductType($prod->name);
                if ($type) return $type;
            }
        }

        // 3. ShipmentOrder relation
        if (isset($order->shipment_order) && $order->shipment_order) {
            $so = $order->shipment_order;
            if (!empty($so->product)) {
                $type = self::resolveProductType($so->product);
                if ($type) return $type;
            }
            if (!empty($so->product_id)) {
                $prod = \App\Models\Product::find($so->product_id);
                if ($prod) {
                    $type = self::resolveProductType($prod->name);
                    if ($type) return $type;
                }
            }
            if ($so->items && $so->items->isNotEmpty()) {
                foreach ($so->items as $item) {
                    if ($item->product) {
                        $type = self::resolveProductType($item->product->name);
                        if ($type) return $type;
                    }
                }
            }
        }

        // 4. If $order itself is a ShipmentOrder
        if ($order instanceof ShipmentOrder) {
            if (!empty($order->product)) {
                $type = self::resolveProductType($order->product);
                if ($type) return $type;
            }
            if ($order->items && $order->items->isNotEmpty()) {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $type = self::resolveProductType($item->product->name);
                        if ($type) return $type;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get completed sales / shipment exits grouped by warehouse for a product type.
     * Returns array ['total' => float, 'by_warehouse' => ['Almacen 1' => float, ...]]
     */
    public static function getCompletedExits(string $productType): array
    {
        $normalizedType = strtolower($productType);
        $byWarehouse = [
            'Almacen 1' => 0.0,
            'Almacen 2' => 0.0,
            'Almacen 3' => 0.0,
            'Almacen 4' => 0.0,
            'Almacen 5' => 0.0,
        ];
        $totalTons = 0.0;

        // Query all completed weight tickets that represent sales / shipment exits
        $tickets = WeightTicket::with([
            'loadingOrder.product',
            'loadingOrder.shipment_order.product',
            'loadingOrder.shipment_order.items.product',
            'loadingOrder.lot',
            'shipmentOrder.product',
            'shipmentOrder.items.product',
            'shipmentOrder.lot',
            'lot',
        ])
            ->where('weighing_status', 'completed')
            ->where('is_burreo', false)
            ->where(function ($q) {
                $q->whereNotNull('shipment_order_id')
                    ->orWhereHas('loadingOrder', function ($lo) {
                        $lo->whereNotNull('shipment_order_id')
                            ->orWhere(function ($slo) {
                                $slo->whereNull('vessel_id')
                                    ->where('folio', 'not like', 'BUR%');
                            });
                    });
            })
            ->get();

        foreach ($tickets as $ticket) {
            $lo = $ticket->loadingOrder;
            $so = $ticket->shipmentOrder ?? $lo?->shipment_order;

            // Determine product type
            $type = null;
            if ($lo) {
                $type = self::getOrderProductType($lo);
            }
            if (!$type && $so) {
                $type = self::getOrderProductType($so);
            }

            if ($type !== $normalizedType) {
                continue;
            }

            // Calculate Net Weight in TM
            $net = (float) $ticket->net_weight;
            $netTons = $net >= 100 ? ($net / 1000) : $net;

            // Determine Origin Warehouse
            $rawWarehouse = $ticket->lot?->warehouse
                ?? $lo?->warehouse
                ?? $so?->warehouse
                ?? $so?->lot?->warehouse
                ?? $lo?->lot?->warehouse;

            $warehouseKey = self::normalizeWarehouse($rawWarehouse);

            $totalTons += $netTons;

            if ($warehouseKey && isset($byWarehouse[$warehouseKey])) {
                $byWarehouse[$warehouseKey] += $netTons;
            }
        }

        return [
            'total' => round($totalTons, 2),
            'by_warehouse' => array_map(fn($v) => round($v, 2), $byWarehouse),
        ];
    }

    /**
     * Get available stock in a specific warehouse for a product type.
     */
    public static function getWarehouseStock(string $productType, string $warehouse): float
    {
        $warehouseKey = self::normalizeWarehouse($warehouse);
        if (!$warehouseKey) {
            return 0.0;
        }

        $isAgricola = strtolower($productType) === 'agricola';

        $initialQuery = $isAgricola ? UreaInitialInventory::agricola() : UreaInitialInventory::industrial();
        $dailyQuery = $isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial();

        $initialTons = (float) $initialQuery->where('warehouse', $warehouseKey)->sum('quantity_tons');
        $dailyTons = (float) $dailyQuery->where('warehouse', $warehouseKey)->sum('quantity_tons');

        $exits = self::getCompletedExits($productType);
        $shippedTons = $exits['by_warehouse'][$warehouseKey] ?? 0.0;

        $availableStock = ($initialTons + $dailyTons) - $shippedTons;

        return round($availableStock, 2);
    }

    /**
     * Comprehensive Metrics for Dashboard (Urea Agrícola or Urea Industrial).
     */
    public static function getMetrics(string $productType): array
    {
        $isAgricola = strtolower($productType) === 'agricola';

        // 1. Initial Inventory
        $initialQuery = $isAgricola ? UreaInitialInventory::agricola() : UreaInitialInventory::industrial();
        $totalInitialTons = (float) $initialQuery->sum('quantity_tons');
        $totalInitialSacks = (int) $initialQuery->sum('sacks_count');

        // 2. Daily Production
        $dailyQuery = $isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial();
        $totalDailyTons = (float) $dailyQuery->sum('quantity_tons');
        $totalDailySacks = (int) $dailyQuery->sum('sacks_count');

        // Operational date cutoff at 5:00 AM
        $operationalDate = now()->hour < 5 ? now()->subDay()->toDateString() : now()->toDateString();
        $todayProductionTons = (float) ($isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial())
            ->whereDate('date', $operationalDate)
            ->sum('quantity_tons');
        $todayProductionSacks = (int) ($isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial())
            ->whereDate('date', $operationalDate)
            ->sum('sacks_count');

        // 3. Completed Shipped Exits
        $exits = self::getCompletedExits($productType);
        $totalShippedTons = $exits['total'];

        // 4. Net Stock
        $totalProducedAndInitial = $totalInitialTons + $totalDailyTons;
        $totalStockTons = round($totalProducedAndInitial - $totalShippedTons, 2);
        $totalStockSacks = $totalInitialSacks + $totalDailySacks;

        // 5. Breakdown by Plant Origin
        $byPlant = [
            'UREA 1' => [
                'initial_tons' => (float) ($isAgricola ? UreaInitialInventory::agricola() : UreaInitialInventory::industrial())->where('plant_origin', 'UREA 1')->sum('quantity_tons'),
                'daily_tons' => (float) ($isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial())->where('plant_origin', 'UREA 1')->sum('quantity_tons'),
            ],
            'UREA 2' => [
                'initial_tons' => (float) ($isAgricola ? UreaInitialInventory::agricola() : UreaInitialInventory::industrial())->where('plant_origin', 'UREA 2')->sum('quantity_tons'),
                'daily_tons' => (float) ($isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial())->where('plant_origin', 'UREA 2')->sum('quantity_tons'),
            ],
        ];
        $byPlant['UREA 1']['total_tons'] = $byPlant['UREA 1']['initial_tons'] + $byPlant['UREA 1']['daily_tons'];
        $byPlant['UREA 2']['total_tons'] = $byPlant['UREA 2']['initial_tons'] + $byPlant['UREA 2']['daily_tons'];

        // 6. Breakdown by Warehouse (Almacen 1 to 5)
        $byWarehouse = [];
        for ($i = 1; $i <= 5; $i++) {
            $whKey = "Almacen {$i}";
            $initTons = (float) ($isAgricola ? UreaInitialInventory::agricola() : UreaInitialInventory::industrial())->where('warehouse', $whKey)->sum('quantity_tons');
            $prodTons = (float) ($isAgricola ? UreaDailyProduction::agricola() : UreaDailyProduction::industrial())->where('warehouse', $whKey)->sum('quantity_tons');
            $shipped = $exits['by_warehouse'][$whKey] ?? 0.0;
            $stock = ($initTons + $prodTons) - $shipped;

            $byWarehouse[$whKey] = [
                'name' => "Almacén {$i}",
                'initial_tons' => round($initTons, 2),
                'daily_tons' => round($prodTons, 2),
                'shipped_tons' => round($shipped, 2),
                'total_inflow_tons' => round($initTons + $prodTons, 2),
                'total_tons' => round($stock, 2), // Net available stock in warehouse
                'available_tons' => round($stock, 2),
            ];
        }

        return [
            'operationalDate' => $operationalDate,
            'totalInitialTons' => round($totalInitialTons, 2),
            'totalInitialSacks' => $totalInitialSacks,
            'totalDailyTons' => round($totalDailyTons, 2),
            'totalDailySacks' => $totalDailySacks,
            'todayProductionTons' => round($todayProductionTons, 2),
            'todayProductionSacks' => $todayProductionSacks,
            'totalShippedTons' => round($totalShippedTons, 2),
            'totalStockTons' => $totalStockTons,
            'totalStockSacks' => $totalStockSacks,
            'byPlant' => $byPlant,
            'byWarehouse' => $byWarehouse,
        ];
    }

    /**
     * Validate available stock before allowing an exit (destare) in scale.
     * Throws an exception if available stock is insufficient.
     */
    public static function validateAvailableStock($order, ?string $warehouse, float $netTons): void
    {
        if (!$order) {
            return;
        }

        // Only validate sales / shipment orders
        $isShipment = !empty($order->shipment_order_id) || ($order instanceof ShipmentOrder) || (empty($order->vessel_id) && !str_starts_with((string)$order->folio, 'BUR'));
        if (!$isShipment) {
            return;
        }

        $productType = self::getOrderProductType($order);
        if (!$productType) {
            // Not Urea Agrícola or Industrial, skip validation
            return;
        }

        $warehouseKey = self::normalizeWarehouse($warehouse);
        if (!$warehouseKey) {
            throw new \Exception("ALERTA: Debe asignar un almacén válido (Almacén 1 a 5) antes de registrar la salida.");
        }

        $availableStock = self::getWarehouseStock($productType, $warehouseKey);
        $productLabel = $productType === 'agricola' ? 'Urea Agrícola' : 'Urea Industrial';

        // Check if net tons requested exceeds available stock in warehouse
        if ($netTons > $availableStock) {
            throw new \Exception(
                "ALERTA: Stock insuficiente en {$warehouseKey} para {$productLabel}. " .
                "Stock disponible: " . number_format($availableStock, 2) . " TM. " .
                "Intento de salida: " . number_format($netTons, 2) . " TM. " .
                "Faltante: " . number_format($netTons - $availableStock, 2) . " TM."
            );
        }
    }
}
