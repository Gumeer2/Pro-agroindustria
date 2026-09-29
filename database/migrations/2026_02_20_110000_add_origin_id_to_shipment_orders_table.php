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
        // 1. Add origin_id to shipment_orders
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->foreignId('origin_id')->nullable()->after('origin')->constrained('shipment_origins')->onDelete('set null');
        });

        // 2. Data Migration: Map existing 'origin' (string) to 'origin_id'
        $origins = DB::table('shipment_origins')->get();

        foreach ($origins as $origin) {
            DB::table('shipment_orders')
                ->where('origin', $origin->name)
                ->update(['origin_id' => $origin->id]);
        }

        // 3. Optional: Handle cases where origin string doesn't exist in shipment_origins yet
        $remainingOrigins = DB::table('shipment_orders')
            ->whereNotNull('origin')
            ->whereNull('origin_id')
            ->distinct()
            ->pluck('origin');

        foreach ($remainingOrigins as $name) {
            if (empty($name))
                continue;

            $id = DB::table('shipment_origins')->insertGetId([
                'name' => strtoupper($name),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('shipment_orders')
                ->where('origin', $name)
                ->update(['origin_id' => $id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipment_orders', function (Blueprint $table) {
            $table->dropForeign(['origin_id']);
            $table->dropColumn('origin_id');
        });
    }
};
