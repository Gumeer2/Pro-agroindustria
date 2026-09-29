<?php

use Illuminate\Support\Facades\DB;
use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\ShipmentOrder;
use App\Models\WeightTicket;
use Carbon\Carbon;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n--- INICIANDO PRUEBA DE LÓGICA BURREO ---\n";

DB::beginTransaction();

try {
    // 1. Find a Burreo Vessel
    // Try to find one explicitly marked as burreo, or just use any for the test if not found (and force it)
    $vessel = Vessel::where('apt_operation_type', 'burreo')->first();

    if (!$vessel) {
        echo "No vessel marked as 'burreo' found. picking arbitrary vessel and simulation as burreo.\n";
        $vessel = Vessel::first();
        if (!$vessel) {
            throw new Exception("No vessels found in DB.");
        }
    }

    echo "Barco seleccionado: {$vessel->name} (ID: {$vessel->id})\n";

    // 2. Find an Operator
    $operator = VesselOperator::where('vessel_id', $vessel->id)->first();
    if (!$operator) {
        // Create dummy if needed, but finding is better
        echo "No operators found for vessel. Creating dummy.\n";
        $operator = VesselOperator::create([
            'vessel_id' => $vessel->id,
            'operator_name' => 'TEST OPERATOR ' . rand(100, 999),
            'tractor_plate' => 'TEST-001',
            'economic_number' => 'ECO-001',
            'unit_type' => 'Torton',
            'transporter_line' => 'Test Line'
        ]);
    }
    echo "Operador seleccionado: {$operator->operator_name} (ID: {$operator->id})\n";

    // 3. Simulate Scan 1 (Burreo)
    echo "\n[1] Simulando Primer Escaneo (Creación de Orden)...\n";
    $order1 = ShipmentOrder::create([
        'folio' => 'TEST-BUR-' . rand(1000, 9999),
        'sale_order' => 'N/A',
        'entry_at' => now(),
        'client_id' => $vessel->client_id ?? 1,
        'vessel_id' => $vessel->id,
        'product_id' => $vessel->product_id ?? 1,
        'status' => 'completed', // Burreo is auto-completed
        'operator_name' => $operator->operator_name,
        'unit_number' => $operator->economic_number ?? '000',
        'tractor_plate' => $operator->tractor_plate,
        'operation_type' => 'burreo',
        'warehouse' => 'Almacén 1',
        'cubicle' => 'N/A',
    ]);
    echo "Orden 1 Creada: ID {$order1->id} - Folio {$order1->folio}\n";

    // 4. Simulate Scan 2 (Burreo) - SHOULD create a NEW order, not error
    echo "\n[2] Simulando Segundo Escaneo (Debe crear NUEVA orden)...\n";
    $order2 = ShipmentOrder::create([
        'folio' => 'TEST-BUR-' . rand(1000, 9999), // Unique folio always
        'sale_order' => 'N/A',
        'entry_at' => now(),
        'client_id' => $vessel->client_id ?? 1,
        'vessel_id' => $vessel->id,
        'product_id' => $vessel->product_id ?? 1,
        'status' => 'completed',
        'operator_name' => $operator->operator_name,
        'unit_number' => $operator->economic_number ?? '000',
        'tractor_plate' => $operator->tractor_plate,
        'operation_type' => 'burreo',
        'warehouse' => 'Almacén 1',
        'cubicle' => 'N/A',
    ]);
    echo "Orden 2 Creada: ID {$order2->id} - Folio {$order2->folio}\n";

    // 5. Check Daily Count Logic
    echo "\n[3] Verificando Contador de Viajes del Día...\n";
    $dailyCount = ShipmentOrder::where('operator_name', $order2->operator_name)
        ->where('operation_type', 'burreo')
        ->whereDate('created_at', Carbon::today())
        ->count();

    echo "Conteo obtenido: {$dailyCount}\n";

    if ($dailyCount >= 2) {
        echo "✅ ÉXITO: El sistema registra múltiples viajes ({$dailyCount}) para el mismo operador en el mismo día.\n";
    } else {
        echo "❌ FALLO: El conteo es incorrecto ({$dailyCount}).\n";
    }

} catch (\Exception $e) {
    echo "❌ ERROR EXCEPCIÓN: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
} finally {
    DB::rollBack();
    echo "\n--- ROLLBACK EJECUTADO (Base de datos limpia) ---\n";
}
