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
        Schema::create('apt_scans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('operator_id'); // Link to vessel_operators
            $table->string('warehouse');
            $table->string('cubicle');
            $table->unsignedBigInteger('user_id'); // Who scanned it
            $table->timestamps();

            $table->foreign('operator_id')->references('id')->on('vessel_operators')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apt_scans');
    }
};
