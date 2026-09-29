<?php
// Load Laravel 
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;

echo "<div style='font-family: sans-serif; padding: 20px;'>";
echo "<h1>Diagnóstico y Reparación de Esquema de Base de Datos</h1>";
echo "<p>Este script verifica y corrige directamente la configuración de columnas que deben permitir valores nulos (NULL).</p>";

$tables = ['weight_tickets', 'apt_scans', 'loading_operations'];
$column = 'shipment_order_id';

foreach ($tables as $table) {
    echo "<hr><h3>Tabla: <code>$table</code></h3>";

    try {
        // Check column info using Raw MySQL
        $colInfo = DB::select("SHOW COLUMNS FROM $table LIKE '$column'");

        if (empty($colInfo)) {
            echo "<span style='color:orange'>⚠ La columna <code>$column</code> no existe en esta tabla.</span><br>";
            continue;
        }

        $currentNull = $colInfo[0]->Null; // 'YES' or 'NO'
        echo "Estado actual (Acepta NULL): <strong>$currentNull</strong><br>";

        if ($currentNull === 'NO') {
            echo "Detectado bloqueo (NOT NULL). Intentando reparar...<br>";

            // Execute ALTER TABLE directly
            DB::statement("ALTER TABLE $table MODIFY $column CHAR(36) NULL");

            // Re-check
            $newInfo = DB::select("SHOW COLUMNS FROM $table LIKE '$column'");
            $newNull = $newInfo[0]->Null;

            if ($newNull === 'YES') {
                echo "<h4 style='color:green'>✅ REPARADO EXITOSAMENTE. Ahora acepta valores nulos.</h4>";
            } else {
                echo "<h4 style='color:red'>❌ FALLÓ LA REPARACIÓN. La base de datos no aceptó el cambio.</h4>";
            }
        } else {
            echo "<h4 style='color:green'>✅ CORRECTO. La configuración ya es válida.</h4>";
        }

    } catch (\Exception $e) {
        echo "<h4 style='color:red'>❌ ERROR CRÍTICO: " . $e->getMessage() . "</h4>";
    }
}

echo "<hr><p><em>Diagnóstico finalizado. Si todos los estados son verdes, intente realizar la operación en el sistema nuevamente.</em></p>";
echo "</div>";
