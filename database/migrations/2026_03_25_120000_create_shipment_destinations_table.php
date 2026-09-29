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
        // 1. Create shipment_destinations table
        Schema::create('shipment_destinations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });

        // 2. Add destination_id to shipment_orders
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->foreignId('destination_id')->nullable()->after('destination')->constrained('shipment_destinations')->onDelete('set null');
        });

        // 3. Data Migration: Map existing 'destination' (string) to 'destination_id'
        $orders = DB::table('shipment_orders')->whereNotNull('destination')->get();
        foreach ($orders as $order) {
            if (empty($order->destination)) continue;

            $normalized = strtoupper(trim($order->destination));
            
            $destination = DB::table('shipment_destinations')->where('name', $normalized)->first();
            
            if (!$destination) {
                $destinationId = DB::table('shipment_destinations')->insertGetId([
                    'name' => $normalized,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $destinationId = $destination->id;
            }

            DB::table('shipment_orders')
                ->where('id', $order->id)
                ->update(['destination_id' => $destinationId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropForeign(['destination_id']);
            $table->dropColumn('destination_id');
        });

        Schema::dropIfExists('shipment_destinations');
    }
};
