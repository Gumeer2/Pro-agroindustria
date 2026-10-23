<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('client_operator_assignments')) {
            Schema::create('client_operator_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('operator_id')->constrained('exit_operators')->onDelete('cascade');
                $table->foreignUuid('sales_order_id')->constrained('sales_orders')->onDelete('cascade');
                $table->string('presentation', 100);
                $table->decimal('tm', 10, 2);
                $table->string('sack', 100)->nullable();
                $table->timestamps();
            });

            // Migrar datos de OV-2026-3 y OV-2026-4 para ABETNEGO
            $op666 = DB::table('exit_operators')->where('id', 666)->first();
            if ($op666) {
                // Registro anterior de OV-2026-3
                DB::table('client_operator_assignments')->insert([
                    'operator_id' => 666,
                    'sales_order_id' => 'a162eb7f-35e8-4807-ab1c-2d71d102854e',
                    'presentation' => 'ENVASADO',
                    'tm' => 36.00,
                    'sack' => '25 KG',
                    'created_at' => '2026-10-23 14:24:19',
                    'updated_at' => '2026-10-23 14:24:19',
                ]);

                // Registro actual de OV-2026-4
                DB::table('client_operator_assignments')->insert([
                    'operator_id' => 666,
                    'sales_order_id' => 'a2b0d5fa-dff4-4a63-a36e-e773e7cecf9d',
                    'presentation' => 'GRANEL',
                    'tm' => 25.00,
                    'sack' => null,
                    'created_at' => '2026-10-23 15:05:00',
                    'updated_at' => '2026-10-23 15:05:00',
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('client_operator_assignments');
    }
};
