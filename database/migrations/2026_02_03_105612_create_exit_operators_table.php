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
        Schema::create('exit_operators', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('license')->nullable();
            $table->string('transport_line');
            $table->string('economic_number')->nullable();
            $table->string('real_transport_line')->nullable();
            $table->string('policy')->nullable();
            $table->string('unit_type')->nullable();
            $table->date('validity')->nullable();
            $table->string('brand_model')->nullable();
            $table->string('tractor_plate');
            $table->string('trailer_plate')->nullable();
            $table->enum('status', ['active', 'vetoed'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exit_operators');
    }
};
