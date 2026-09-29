<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->decimal('length', 10, 2)->nullable()->comment('Eslora');
            $table->decimal('beam', 10, 2)->nullable()->comment('Manga');
            $table->decimal('draft', 10, 2)->nullable()->comment('Calado');
            $table->string('nationality')->nullable();
            $table->string('imo_number')->nullable();
            $table->string('registration_number')->nullable()->comment('Matricula');

            // Carga fields
            $table->string('destination_port')->nullable(); // Si es Carga: definir puerto destino

            // Shared/Other fields
            $table->string('importer')->nullable(); // Importador
            $table->string('consignee_agency')->nullable(); // Agencia Consignataria
            $table->string('customs_agency')->nullable(); // Agencia Aduanal

            // Descarga fields
            $table->string('origin_port')->nullable(); // Si es Descarga: Origen
            $table->string('loading_port')->nullable(); // Si es Descarga: Puerto de Carga (a veces es lo mismo que origen, pero el user lo pidió separado)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn([
                'length',
                'beam',
                'draft',
                'nationality',
                'imo_number',
                'registration_number',
                'destination_port',
                'importer',
                'consignee_agency',
                'customs_agency',
                'origin_port',
                'loading_port',
            ]);
        });
    }
};
