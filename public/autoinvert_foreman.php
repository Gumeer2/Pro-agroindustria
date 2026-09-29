<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

header('Content-Type: text/plain');

try {
    echo "Iniciando inversión de valores has_chief_foreman...\n";
    $vessels = DB::table('vessels')->get();
    foreach ($vessels as $vessel) {
        $newValue = $vessel->has_chief_foreman ? 0 : 1;
        DB::table('vessels')->where('id', $vessel->id)->update(['has_chief_foreman' => $newValue]);
        echo "Barco ID {$vessel->id} ({$vessel->name}): " . ($vessel->has_chief_foreman ? "1 -> 0" : "0 -> 1") . "\n";
    }
    echo "✅ Inversión completada con éxito.\n";

    // Self-destruct for security if in production or just mention it
    echo "\n[INFO] Por seguridad, borre este archivo (public/autoinvert_foreman.php) después de usarlo.\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
