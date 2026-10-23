<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('machinery_maintenances')) {
            Schema::create('machinery_maintenances', function (Blueprint $table) {
                $table->id();
                $table->string('folio')->unique();
                $table->string('machinery_name');
                $table->string('economic_number')->nullable();
                $table->string('machinery_code')->nullable();
                $table->enum('type', ['correctivo', 'preventivo'])->default('correctivo');
                $table->unsignedTinyInteger('current_step')->default(1);
                $table->string('status')->default('status_rojo');
                $table->string('status_color')->default('ROJO');
                $table->decimal('hours_worked', 10, 2)->nullable();

                // Paso 1: Reporte de Falla
                $table->string('operator_name')->nullable();
                $table->text('failure_description')->nullable();
                $table->timestamp('reported_at')->nullable();

                // Paso 2: Bitácora
                $table->string('supervisor_name')->nullable();
                $table->timestamp('logged_at')->nullable();

                // Paso 3: Diagnóstico
                $table->string('mechanic_name')->nullable();
                $table->text('diagnostic_notes')->nullable();
                $table->string('part_number')->nullable();
                $table->text('parts_requested')->nullable();
                $table->timestamp('diagnostic_at')->nullable();

                // Paso 4: OT + Permiso Trabajo
                $table->string('work_order_folio')->nullable();
                $table->text('root_cause')->nullable();
                $table->decimal('estimated_cost', 12, 2)->nullable();
                $table->string('work_permit_number')->nullable();
                $table->boolean('work_permit_issued')->default(false);
                $table->timestamp('ot_generated_at')->nullable();

                // Paso 5: Autorización y Compra
                $table->string('authorized_by')->nullable();
                $table->string('purchase_order_number')->nullable();
                $table->timestamp('authorized_at')->nullable();
                $table->text('authorization_notes')->nullable();

                // Paso 6: Entrega Refacción
                $table->string('parts_delivered_by')->nullable();
                $table->timestamp('parts_delivered_at')->nullable();
                $table->text('parts_delivery_notes')->nullable();

                // Paso 7: Ejecución Mantenimiento + LOTO
                $table->boolean('loto_applied')->default(false);
                $table->string('loto_tag_number')->nullable();
                $table->timestamp('executed_at')->nullable();
                $table->text('execution_notes')->nullable();

                // Paso 8: Reporte Trabajo Ejecutado
                $table->text('activities_performed')->nullable();
                $table->text('parts_actually_used')->nullable();
                $table->timestamp('report_signed_at')->nullable();

                // Paso 9: Firma Entrega y Recepción
                $table->boolean('operational_test_passed')->default(false);
                $table->string('delivered_by')->nullable();
                $table->string('received_by')->nullable();
                $table->timestamp('tested_at')->nullable();

                // Paso 10: Cierre
                $table->string('closed_by')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->text('closure_notes')->nullable();

                $table->unsignedBigInteger('created_by_user_id')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machinery_maintenances');
    }
};
