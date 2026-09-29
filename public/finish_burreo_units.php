<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

$folios = [
    'BUR-20260122-143418-460',
    'BUR-20260122-143531-885'
];

echo "Iniciando limpieza de unidades burreo pendientes...\n";

try {
    foreach ($folios as $folio) {
        $order = DB::table('shipment_orders')->where('folio', $folio)->first();

        if ($order) {
            echo "Procesando folio: {$folio}\n";

            // 1. Update Order Status
            DB::table('shipment_orders')->where('id', $order->id)->update([
                'status' => 'completed',
                'updated_at' => now(),
            ]);

            // 2. Update Ticket Status
            DB::table('weight_tickets')->where('shipment_order_id', $order->id)->update([
                'weighing_status' => 'completed',
                'net_weight' => DB::raw('tare_weight'), // Asumo que el peso neto es igual al provisional (que se guardó en tare_weight)
                'weigh_out_at' => now(),
                'updated_at' => now(),
            ]);

            echo "--- Folio {$folio} marcado como COMPLETADO.\n";
        } else {
            echo "--- Folio {$folio} no encontrado.\n";
        }
    }

    echo "\nLimpieza terminada con éxito.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
