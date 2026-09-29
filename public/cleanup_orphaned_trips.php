<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\VesselOperatorTrip;

header('Content-Type: text/plain');

try {
    echo "Iniciando limpieza DIAGNÓSTICA de viajes (Muelle)...\n";

    // Total count
    $total = DB::table('vessel_operator_trips')->count();
    echo "Total de viajes en la tabla: {$total}\n";

    // Direct SQL for orphans
    $orphans = DB::table('vessel_operator_trips as t')
        ->leftJoin('vessel_operators as o', 't.vessel_operator_id', '=', 'o.id')
        ->whereNull('o.id')
        ->select('t.id', 't.vessel_operator_id')
        ->get();

    $count = $orphans->count();
    echo "Viajes sin operador (SQL directo): {$count}\n";

    if ($count > 0) {
        foreach ($orphans as $o) {
            echo "Huérfano: TripID {$o->id} -> OpID " . ($o->vessel_operator_id ?? 'NULL') . "\n";
            DB::table('vessel_operator_trips')->where('id', $o->id)->delete();
        }
        echo "✅ Registros eliminados.\n";
    }

    // Direct SQL for vessels
    $orphansV = DB::table('vessel_operator_trips as t')
        ->leftJoin('vessels as v', 't.vessel_id', '=', 'v.id')
        ->whereNull('v.id')
        ->select('t.id', 't.vessel_id')
        ->get();

    $countV = $orphansV->count();
    echo "Viajes sin barco (SQL directo): {$countV}\n";

    if ($countV > 0) {
        foreach ($orphansV as $ov) {
            echo "Huérfano (Barco): TripID {$ov->id} -> VesselID " . ($ov->vessel_id ?? 'NULL') . "\n";
            DB::table('vessel_operator_trips')->where('id', $ov->id)->delete();
        }
        echo "✅ Registros (Barco) eliminados.\n";
    }
    echo "\n[INFO] Por seguridad, borre este archivo (public/cleanup_orphaned_trips.php) después de usarlo.\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
