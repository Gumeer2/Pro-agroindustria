<?php
/**
 * Script de Sincronización Automática de Optimización
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "--- INICIO DE OPTIMIZACIÓN EN SERVIDOR ---<br>";

try {
    if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
        die("Error: vendor/autoload.php no encontrado.");
    }

    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    echo "✅ Laravel bootstrapped.<br>";

    // 1. Ejecutar Migraciones
    echo "Ejecutando php artisan migrate --force...<br>";
    $exitCode = \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    echo "✅ Migración terminada. Resultado: " . \Illuminate\Support\Facades\Artisan::output() . "<br>";

    // 2. Sincronizar Totales
    echo "Sincronizando totales de SalesOrder...<br>";
    $orders = \App\Models\SalesOrder::all();
    $count = 0;
    foreach ($orders as $order) {
        $order->syncLoadedQuantity();
        $count++;
    }
    echo "✅ Sincronización completada. $count órdenes procesadas.<br>";

    // 3. Clear Cache
    \Illuminate\Support\Facades\Artisan::call('optimize:clear');
    echo "✅ Cache limpiado.<br>";

    echo "--- PROCESO FINALIZADO EXITOSAMENTE ---";

} catch (Exception $e) {
    echo "❌ ERROR CRÍTICO: " . $e->getMessage() . "<br>";
    echo "Traza: <pre>" . $e->getTraceAsString() . "</pre>";
}
?>