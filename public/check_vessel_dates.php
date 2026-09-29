<?php
/**
 * Script de diagnóstico SEGURO para producción.
 * Solo consulta, NO borra nada.
 */

// Ajuste de rutas para estar dentro de /public
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Vessel;
use App\Models\ShipmentOrder;
use Illuminate\Support\Facades\DB;

echo "<h1>🔍 Diagnóstico de Fechas - Producción</h1>";

$vesselName = "Nordorinoco";
$vessels = Vessel::where('name', 'like', "%$vesselName%")->get();

if ($vessels->isEmpty()) {
    echo "❌ No se encontró ningún barco con el nombre '$vesselName'.<br>";
}

foreach ($vessels as $vessel) {
    echo "<h2>Barco: {$vessel->name} (ID: {$vessel->id})</h2>";
    echo "Creado el: {$vessel->created_at}<br>";

    // Buscar órdenes que tengan actividad el 19 de enero según diferentes criterios
    $dateToCheck = '2026-01-19';

    echo "<h3>Análisis para el día $dateToCheck:</h3>";

    // 1. Basado en updated_at (Lógica vieja)
    $oldLogicCount = ShipmentOrder::where('vessel_id', $vessel->id)
        ->whereDate('updated_at', $dateToCheck)
        ->count();
    echo "📅 Órdenes con 'updated_at' el $dateToCheck: <b>$oldLogicCount</b><br>";

    // 2. Basado en weigh_out_at (Lógica nueva)
    $newLogic = DB::table('shipment_orders')
        ->join('weight_tickets', 'shipment_orders.id', '=', 'weight_tickets.shipment_order_id')
        ->where('shipment_orders.vessel_id', $vessel->id)
        ->whereDate('weight_tickets.weigh_out_at', $dateToCheck)
        ->select('shipment_orders.folio', 'weight_tickets.weigh_out_at', 'weight_tickets.net_weight')
        ->get();

    echo "📅 Órdenes con 'weigh_out_at' el $dateToCheck: <b>" . $newLogic->count() . "</b><br>";

    if ($newLogic->count() > 0) {
        echo "<h4>Detalle de registros encontrados:</h4>";
        echo "<ul>";
        foreach ($newLogic as $row) {
            $tm = number_format($row->net_weight / 1000, 2);
            echo "<li>Folio: {$row->folio} | Fecha Pesaje: {$row->weigh_out_at} | Peso: $tm TM</li>";
        }
        echo "</ul>";
    }
}

echo "<br><hr><p>Este script es solo informativo. No se ha realizado ninguna modificación en la base de datos.</p>";
