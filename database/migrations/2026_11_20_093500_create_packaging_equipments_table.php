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
        if (!Schema::hasTable('packaging_equipments')) {
            Schema::create('packaging_equipments', function (Blueprint $table) {
                $table->id();
                $table->string('company', 50)->comment('PRO-AGRO o FERTINAL');
                $table->unsignedInteger('category_number')->nullable();
                $table->string('description', 255);
                $table->string('tag', 100);
                $table->string('brand', 100)->default('VICTOR');
                $table->string('model', 100);
                $table->string('serial_number', 100);
                $table->string('status', 50)->default('active');
                $table->text('observations')->nullable();
                $table->timestamps();

                $table->index('company');
                $table->index('tag');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packaging_equipments');
    }
};
