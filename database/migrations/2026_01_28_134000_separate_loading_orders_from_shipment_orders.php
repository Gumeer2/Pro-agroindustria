<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Loading Orders Table
        if (!Schema::hasTable('loading_orders')) {
            Schema::create('loading_orders', function (Blueprint $table) {
                $table->uuid('id')->primary();

                // Operational Data (Mirroring ShipmentOrder partially)
                $table->string('folio')->unique(); // Operational folio (Ticket #)
                $table->enum('status', ['created', 'authorized', 'weighing_in', 'loading', 'weighing_out', 'completed', 'cancelled'])->default('created');

                // Core Relations
                $table->foreignUuid('vessel_id')->nullable()->constrained(); // Nullable just in case, but usually required for ops
                $table->foreignId('client_id')->constrained();
                $table->foreignId('product_id')->nullable()->constrained();

                // Links to Commercial/Legacy
                $table->foreignUuid('sales_order_id')->nullable()->constrained('sales_orders')->onDelete('set null'); // Link to Commercial Order
                $table->foreignUuid('shipment_order_id')->nullable()->constrained('shipment_orders')->onDelete('set null'); // Link to Commercial Shipment Doc (if separate)

                // Timestamps / Operational Infos
                $table->timestamp('entry_at')->nullable();

                // Snapshot Operational Fields
                $table->string('operator_name')->nullable();
                $table->string('tractor_plate')->nullable();
                $table->string('trailer_plate')->nullable();
                $table->string('economic_number')->nullable();
                $table->string('transport_company')->nullable();
                $table->string('unit_type')->nullable(); // Added

                $table->string('warehouse')->nullable();
                $table->string('cubicle')->nullable();

                $table->string('origin')->nullable();
                $table->string('destination')->nullable();

                // Document References carried over for convenience/validation
                $table->string('withdrawal_letter')->nullable();
                $table->string('bill_of_lading')->nullable(); // Carta Porte
                $table->string('reference')->nullable();
                $table->string('observations')->nullable();
                $table->string('consignee')->nullable();

                $table->enum('destare_status', ['pending', 'completed'])->default('pending');
                $table->enum('operation_type', ['scale', 'burreo'])->default('scale');

                // IDs for entities if they exist (nullable)
                $table->foreignId('transporter_id')->nullable()->constrained();
                $table->foreignId('driver_id')->nullable()->constrained();
                $table->foreignId('vehicle_id')->nullable()->constrained();

                $table->timestamps();
            });
        }

        // 2. Add columns to related tables
        Schema::table('weight_tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('weight_tickets', 'loading_order_id')) {
                $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id')->constrained('loading_orders')->onDelete('cascade');
            }
        });

        Schema::table('apt_scans', function (Blueprint $table) {
            if (!Schema::hasColumn('apt_scans', 'loading_order_id')) {
                $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id')->constrained('loading_orders')->onDelete('cascade');
            }
        });

        Schema::table('loading_operations', function (Blueprint $table) {
            if (!Schema::hasColumn('loading_operations', 'loading_order_id')) {
                $table->foreignUuid('loading_order_id')->nullable()->after('shipment_order_id')->constrained('loading_orders')->onDelete('cascade');
            }
        });

        // 3. Migrate Data
        // We copy ALL shipment_orders to loading_orders using the SAME ID to preserve relationships easily.
        // We assume current shipment_orders ARE the operational records.
        $orders = DB::table('shipment_orders')->get();

        foreach ($orders as $order) {
            // Fetch product from items
            $firstItem = DB::table('shipment_items')->where('shipment_order_id', $order->id)->first();
            $productId = $firstItem ? $firstItem->product_id : null;

            DB::table('loading_orders')->insert([
                'id' => $order->id,
                'folio' => $order->folio,
                'status' => $order->status,
                'vessel_id' => $order->vessel_id,
                'client_id' => $order->client_id,
                'product_id' => $productId, // Fetched from items
                'sales_order_id' => $order->sales_order_id,
                'shipment_order_id' => null, // Initially null
                'entry_at' => $order->entry_at,
                'operator_name' => $order->operator_name ?? null,
                'tractor_plate' => $order->tractor_plate ?? null,
                'trailer_plate' => $order->trailer_plate ?? null,
                'economic_number' => $order->economic_number ?? null,
                'transport_company' => $order->transport_company ?? null,
                'unit_type' => $order->unit_type ?? null,
                'warehouse' => $order->warehouse ?? null,
                'cubicle' => $order->cubicle ?? null,
                'origin' => $order->origin ?? null,
                'destination' => $order->destination ?? null,
                'withdrawal_letter' => $order->withdrawal_letter ?? null,
                'bill_of_lading' => $order->bill_of_lading ?? null,
                'reference' => $order->reference ?? null,
                'observations' => $order->observations ?? null,
                'consignee' => $order->consignee ?? null,
                'destare_status' => $order->destare_status ?? 'pending',
                'operation_type' => $order->operation_type ?? 'scale',
                'transporter_id' => $order->transporter_id,
                'driver_id' => $order->driver_id,
                'vehicle_id' => $order->vehicle_id,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
            ]);
        }

        // 4. Update References
        // Since we used the SAME ID, we can just set loading_order_id = shipment_order_id
        DB::statement("UPDATE weight_tickets SET loading_order_id = shipment_order_id");
        DB::statement("UPDATE apt_scans SET loading_order_id = shipment_order_id");
        DB::statement("UPDATE loading_operations SET loading_order_id = shipment_order_id");

        // 5. Make old columns nullable (to deprecate them safely)
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });
        Schema::table('apt_scans', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });
        Schema::table('loading_operations', function (Blueprint $table) {
            $table->uuid('shipment_order_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('weight_tickets', function (Blueprint $table) {
            $table->dropForeign(['loading_order_id']);
            $table->dropColumn('loading_order_id');
            // Revert nullable not easily possible without knowing constraint name, but optional
        });

        Schema::table('apt_scans', function (Blueprint $table) {
            $table->dropForeign(['loading_order_id']);
            $table->dropColumn('loading_order_id');
        });

        Schema::table('loading_operations', function (Blueprint $table) {
            $table->dropForeign(['loading_order_id']);
            $table->dropColumn('loading_order_id');
        });

        Schema::dropIfExists('loading_orders');
    }
};
