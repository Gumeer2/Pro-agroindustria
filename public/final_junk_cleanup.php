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
    echo "Buscando registros de prueba 'N/A' en Órdenes de Venta...\n";

    // Buscar OVs con folio 'N/A' o vacíos que tengan fecha 1969/1970 (junk)
    $junkOvs = SalesOrder::where('folio', 'N/A')
        ->orWhere('folio', '')
        ->orWhereNull('folio')
        ->get();

    $count = $junkOvs->count();

    if ($count > 0) {
        $junkIds = $junkOvs->pluck('id');
        echo "Se encontraron {$count} registros basura.\n";

        // Desvincular embarques
        ShipmentOrder::whereIn('sales_order_id', $junkIds)->update(['sales_order_id' => null]);

        // Eliminar junk
        SalesOrder::whereIn('id', $junkIds)->delete();
        echo "Registros eliminados.\n";
    } else {
        echo "No se encontraron registros 'N/A'.\n";
    }

    DB::commit();
    echo "LIMPIEZA FINALIZADA.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
