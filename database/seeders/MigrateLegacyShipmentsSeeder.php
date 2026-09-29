<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ShipmentOrder;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;

class MigrateLegacyShipmentsSeeder extends Seeder
{
    public function run()
    {
        // 1. Get all shipments not yet linked
        $legacyShipments = ShipmentOrder::whereNull('sales_order_id')->get();

        foreach ($legacyShipments as $shipment) {
            // Only try to find an EXACT match by folio/sale_order text
            $reference = $shipment->sale_order ?? $shipment->purchase_order ?? $shipment->reference;

            if ($reference) {
                $salesOrder = SalesOrder::where('folio', $reference)->first();
                if ($salesOrder) {
                    $shipment->update(['sales_order_id' => $salesOrder->id]);
                }
            }
        }
    }
}
