<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('shipment_process_histories')) {
            Schema::create('shipment_process_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('shipment_order_id')->constrained('shipment_orders')->cascadeOnDelete();
                $table->foreignUuid('lot_id')->nullable()->constrained('lots')->nullOnDelete();
                $table->string('warehouse')->nullable();
                $table->string('cubicle')->nullable();
                $table->string('loading_administrator')->nullable();
                $table->string('loading_squad_leader')->nullable();
                $table->string('loading_assistant')->nullable();
                $table->integer('stowage_count')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('finished_at')->nullable();
                $table->string('status')->default('loading');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('shipment_order_id');
                $table->index('lot_id');
                $table->index('started_at');
                $table->index('status');
            });
        }

        // Migrate existing loading records from shipment_orders into shipment_process_histories
        $existing = DB::table('shipment_orders')
            ->where(function ($query) {
                $query->whereNotNull('lot_id')
                    ->orWhereNotNull('loaded_at');
            })
            ->get();

        foreach ($existing as $order) {
            $alreadyExists = DB::table('shipment_process_histories')
                ->where('shipment_order_id', $order->id)
                ->exists();

            if (!$alreadyExists) {
                DB::table('shipment_process_histories')->insert([
                    'shipment_order_id' => $order->id,
                    'lot_id' => $order->lot_id,
                    'warehouse' => $order->warehouse,
                    'loading_administrator' => $order->loading_administrator ?? null,
                    'loading_squad_leader' => $order->loading_squad_leader ?? null,
                    'loading_assistant' => $order->loading_assistant ?? null,
                    'started_at' => $order->loaded_at ?? $order->created_at,
                    'finished_at' => $order->loading_finished_at ?? null,
                    'status' => $order->status ?? 'loading',
                    'created_by' => $order->created_by ?? null,
                    'updated_by' => $order->updated_by ?? null,
                    'created_at' => $order->loaded_at ?? $order->created_at ?? now(),
                    'updated_at' => $order->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_process_histories');
    }
};
