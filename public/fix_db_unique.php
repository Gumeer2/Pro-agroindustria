<?php
// fix_db_unique.php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "<h1>Aplicando Parche de Base de Datos</h1>";

try {
    $tableName = 'vessel_operators';
    $indexName = 'vessel_operators_vessel_id_operator_name_unique';

    echo "<p>Verificando tabla <strong>$tableName</strong>...</p>";

    if (Schema::hasTable($tableName)) {
        // Check if index exists - raw query for MySQL
        $exists = DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName]);

        if (count($exists) > 0) {
            echo "<p>Índice '<strong>$indexName</strong>' ENCONTRADO. Procediendo a eliminar...</p>";

            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            Schema::table($tableName, function ($table) use ($indexName) {
                $table->dropUnique($indexName);
            });
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            echo "<p style='color:green; font-weight:bold;'>✔ Índice eliminado EXITOSAMENTE.</p>";
        } else {
            echo "<p style='color:blue;'>ℹ El índice '<strong>$indexName</strong>' NO EXISTE (ya fue eliminado o nunca existió).</p>";
        }
    } else {
        echo "<p style='color:red;'>✘ La tabla $tableName no existe.</p>";
    }

} catch (\Exception $e) {
    echo "<p style='color:red; font-weight:bold;'>✘ ERROR FATAL: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr><p>Operación finalizada. <a href='/'>Volver al inicio</a></p>";
