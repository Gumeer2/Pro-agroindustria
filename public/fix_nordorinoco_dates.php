<?php
/**
 * Script de actualización QUIRÚRGICA para producción.
 * Cambia la fecha del 19 al 20 para folios específicos.
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ShipmentOrder;
use App\Models\WeightTicket;
use Illuminate\Support\Facades\DB;

echo "<h1>🛠️ Actualización de Fechas (19 -> 20 Ene) - Producción</h1>";

$vesselId = 'a0e0cb66-55ee-4b34-9835-0ba16b21c1b0';
$folios = ['0001', '0003', '0004', '0005', '0007'];

DB::beginTransaction();

try {
    foreach ($folios as $folio) {
        $order = ShipmentOrder::where('vessel_id', $vesselId)
            ->where('folio', $folio)
            ->first();

        if ($order) {
            echo "Procesando Folio: <b>$folio</b> (ID: {$order->id})...<br>";

            // 1. Actualizar Weight Tickets
            $ticket = WeightTicket::where('shipment_order_id', $order->id)->first();
            if ($ticket) {
                // Cambiar el día de 19 a 20 manteniendo la hora
                $newIn = $ticket->weigh_in_at ? str_replace('2026-01-19', '2026-01-20', $ticket->weigh_in_at) : null;
                $newOut = $ticket->weigh_out_at ? str_replace('2026-01-19', '2026-01-20', $ticket->weigh_out_at) : null;

                $ticket->update([
                    'weigh_in_at' => $newIn,
                    'weigh_out_at' => $newOut
                ]);
                echo "&nbsp;&nbsp;✅ Ticket de pesaje actualizado a 2026-01-20.<br>";
            }

            // 2. Actualizar Shipment Order (updated_at)
            $newUpdated = str_replace('2026-01-19', '2026-01-20', $order->updated_at);
            $order->update(['updated_at' => $newUpdated]);
            echo "&nbsp;&nbsp;✅ Orden de embarque actualizada a 2026-01-20.<br>";
        } else {
            echo "⚠️ Folio <b>$folio</b> no encontrado para este barco.<br>";
        }
    }

    DB::commit();
    echo "<br><h2>✨ ¡Actualización completada con éxito!</h2>";
    echo "<p>Consulta el dashboard ahora para verificar que los datos se movieron al día 20.</p>";

} catch (Exception $e) {
    DB::rollBack();
    echo "<br>❌ Error durante la actualización: " . $e->getMessage();
}
