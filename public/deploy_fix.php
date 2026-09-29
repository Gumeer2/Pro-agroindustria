<?php

// Fix Deployment Script
// Place this in the 'public' folder and run via browser: https://domain.com/deploy_fix.php

define("LARAVEL_START", microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use App\Models\ShipmentOrder; // Ensure model exists or use DB table

echo "<h1>Starting Manual Deployment Fix...</h1>";

try {
    // Disable Transaction wrapping because DDL statements (CREATE/DROP) cause implicit commits in MySQL
// DB::beginTransaction(); 

    // 1. Check/Create Loading Orders Table
    Schema::dropIfExists('loading_orders'); // FORCE DROP to ensure correct schema

    echo "Creating loading_orders table...<br>";
    Schema::create('loading_orders', function (Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('folio')->unique();
        $table->enum('status', ['created', 'authorized', 'weighing_in', 'loading', 'weighing_out', 'completed', 'cancelled'])->default('created');

        $table->foreignUuid('vessel_id')->nullable(); // UUID
        $table->foreignId('client_id'); // Integer
        $table->foreignId('product_id')->nullable(); // Integer

        $table->foreignUuid('sales_order_id')->nullable(); // UUID
        $table->foreignUuid('shipment_order_id')->nullable(); // UUID (Legacy link)

        $table->timestamp('entry_at')->nullable();
        $table->string('operator_name')->nullable();
        $table->string('tractor_plate')->nullable();
        $table->string('trailer_plate')->nullable();
        $table->string('economic_number')->nullable();
        $table->string('transport_company')->nullable();
        $table->string('unit_type')->nullable();
        $table->string('warehouse')->nullable();
        $table->string('cubicle')->nullable();
        $table->string('origin')->nullable();
        $table->string('destination')->nullable();
        $table->string('withdrawal_letter')->nullable();
        $table->string('bill_of_lading')->nullable();
        $table->string('reference')->nullable();
        $table->string('observations')->nullable();
        $table->string('consignee')->nullable();
        $table->enum('destare_status', ['pending', 'completed'])->default('pending');
        $table->enum('operation_type', ['scale', 'burreo'])->default('scale');

        $table->foreignId('transporter_id')->nullable();
        $table->foreignId('driver_id')->nullable();
        $table->foreignId('vehicle_id')->nullable();

        $table->timestamps();
    });

    // 2. Add columns to related tables if missing
    if (!Schema::hasColumn('weight_tickets', 'loading_order_id')) {
        echo "Adding loading_order_id to weight_tickets...<br>";
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id');
        });
    }

    if (!Schema::hasColumn('apt_scans', 'loading_order_id')) {
        echo "Adding loading_order_id to apt_scans...<br>";
        Schema::table('apt_scans', function (Blueprint $table) {
            $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id');
        });
    }

    if (!Schema::hasColumn('loading_operations', 'loading_order_id')) {
        echo "Adding loading_order_id to loading_operations...<br>";
        Schema::table('loading_operations', function (Blueprint $table) {
            $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id');
        });
    }

    // 3. Migrate Data
    // Since we forced drop, we always migrate
    echo "Migrating operational data...<br>";
    $orders = DB::table('shipment_orders')->get();
    foreach ($orders as $order) {
        $firstItem = DB::table('shipment_items')->where('shipment_order_id', $order->id)->first();
        $productId = $firstItem ? $firstItem->product_id : null;

        DB::table('loading_orders')->insert([
            'id' => $order->id,
            'folio' => $order->folio,
            'status' => $order->status,
            'vessel_id' => $order->vessel_id,
            'client_id' => $order->client_id,
            'product_id' => $productId,
            'sales_order_id' => $order->sales_order_id,
            'shipment_order_id' => null,
            'entry_at' => $order->entry_at,
            'operator_name' => $order->operator_name,
            'tractor_plate' => $order->tractor_plate,
            'trailer_plate' => $order->trailer_plate,
            'economic_number' => $order->economic_number,
            'transport_company' => $order->transport_company,
            'unit_type' => $order->unit_type,
            'warehouse' => $order->warehouse,
            'cubicle' => $order->cubicle,
            'origin' => $order->origin,
            'destination' => $order->destination,
            'withdrawal_letter' => $order->withdrawal_letter,
            'bill_of_lading' => $order->bill_of_lading,
            'reference' => $order->reference,
            'observations' => $order->observations,
            'consignee' => $order->consignee,
            'destare_status' => $order->destare_status,
            'operation_type' => $order->operation_type,
            'transporter_id' => $order->transporter_id,
            'driver_id' => $order->driver_id,
            'vehicle_id' => $order->vehicle_id,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ]);
    }
    echo "Data migration completed.<br>";


    // 4. Update References
    echo "Updating references...<br>";
    DB::statement("UPDATE weight_tickets SET loading_order_id = shipment_order_id WHERE loading_order_id IS NULL");
    DB::statement("UPDATE apt_scans SET loading_order_id = shipment_order_id WHERE loading_order_id IS NULL");
    DB::statement("UPDATE loading_operations SET loading_order_id = shipment_order_id WHERE loading_order_id IS NULL");

    // DB::commit();
    echo "<h2 style='color:green'>SUCCESS: Deployment Fix Applied. You may delete this file.</h2>";

} catch (\Exception $e) {
    // DB::rollBack();
    echo "<h2 style='color:red'>ERROR: " . $e->getMessage() . "</h2>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
