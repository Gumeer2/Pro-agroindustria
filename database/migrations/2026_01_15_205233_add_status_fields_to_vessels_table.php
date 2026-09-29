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
            if (!Schema::hasColumn('vessels', 'vessel_type')) {
                $table->string('vessel_type')->nullable()->comment('B/T, M/V');
            }
            if (!Schema::hasColumn('vessels', 'dock')) {
                $table->string('dock')->nullable()->comment('ECO or WHISKY');
            }
            if (!Schema::hasColumn('vessels', 'eta')) {
                $table->dateTime('eta')->nullable()->comment('Estimated Time of Arrival');
            }
            if (!Schema::hasColumn('vessels', 'etb')) {
                $table->dateTime('etb')->nullable()->comment('Estimated Time of Berthing');
            }
            if (!Schema::hasColumn('vessels', 'berthal_datetime')) {
                $table->dateTime('berthal_datetime')->nullable()->comment('Fecha/Hora Atracado');
            }
            if (!Schema::hasColumn('vessels', 'operation_type')) {
                $table->string('operation_type')->nullable()->comment('Resguardo, Descarga, etc');
            }
            if (!Schema::hasColumn('vessels', 'stay_days')) {
                $table->integer('stay_days')->default(0);
            }
            if (!Schema::hasColumn('vessels', 'etc')) {
                $table->string('etc')->nullable()->comment('Estimated Time of Completion (Can be SIN FECHA)');
            }
            if (!Schema::hasColumn('vessels', 'departure_date')) {
                $table->dateTime('departure_date')->nullable();
            }
            if (!Schema::hasColumn('vessels', 'observations')) {
                $table->text('observations')->nullable();
            }
            if (!Schema::hasColumn('vessels', 'is_anchored')) {
                $table->boolean('is_anchored')->default(false);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn([
                'vessel_type',
                'dock',
                'eta',
                'etb',
                'berthal_datetime',
                'operation_type',
                'stay_days',
                'etc',
                'departure_date',
                'observations',
                'is_anchored'
            ]);
        });
    }
};
