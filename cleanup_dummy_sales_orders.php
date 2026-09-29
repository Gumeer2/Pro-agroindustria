<?php

use App\Models\SalesOrder;
use App\Models\ShipmentOrder;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::beginTransaction();

try {
    echo "Identificando Órdenes de Venta 'LEGACY'...\n";

    $legacyOvs = SalesOrder::where('folio', 'like', 'LEGACY-%')->get();
    $count = $legacyOvs->count();

    echo "Se encontraron {$count} registros de prueba 'LEGACY'.\n";

    if ($count > 0) {
        $legacyIds = $legacyOvs->pluck('id');

        // 1. Desvincular de Embarques
        echo "Desvinculando embarques...\n";
        $affectedShipments = ShipmentOrder::whereIn('sales_order_id', $legacyIds)->update(['sales_order_id' => null]);
        echo "Embarques actualizados: {$affectedShipments}\n";

        // 2. Eliminar OVs dummy
        echo "Eliminando registros dummy...\n";
        SalesOrder::whereIn('id', $legacyIds)->delete();
        echo "Eliminación completada.\n";
    }

    DB::commit();
    echo "PROCESO FINALIZADO CON ÉXITO.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
