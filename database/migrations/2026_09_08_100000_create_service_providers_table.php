<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        DB::table('service_providers')->insert([
            ['name' => 'OBRAS Y SERVICIOS INDUSTRIALES SAN MARTIN, SA DE CV', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'SERVICIOS LOGISTICOS Y PORTUARIOS DEL GOLFO SA DE CV', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'OPERADORA PORTUARIA INTEGRAL', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'PERSONAL PROPIO PROAGROINDUSTRIA', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('service_providers');
    }
};