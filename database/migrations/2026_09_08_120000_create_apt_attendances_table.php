<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('apt_attendances', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->nullable()->index();
            $table->string('format_code')->default('GLS-AP-FO-005');
            $table->string('service_provider')->default('OBRAS Y SERVICIOS INDUSTRIALES SAN MARTIN, SA DE CV');
            $table->string('shift')->default('1A');
            $table->string('work_area')->default('APT 2');
            $table->date('date');
            $table->text('activity');
            $table->string('loading_line')->default('GLS-APT-ENV ( )');
            $table->json('personnel')->nullable();
            $table->json('squad_leader')->nullable();
            $table->json('safety_supervisor')->nullable();
            $table->text('observations')->nullable();
            $table->string('supervision_name')->default('PRO-AGROINDUSTRIA, S.A. DE C.V.');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apt_attendances');
    }
};
