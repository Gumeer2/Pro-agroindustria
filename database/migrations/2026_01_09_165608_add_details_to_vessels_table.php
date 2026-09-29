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
            $table->date('docking_date')->nullable();
            $table->time('docking_time')->nullable();
            $table->string('origin')->nullable();
            $table->string('sub_origin')->nullable();
            $table->string('destination')->nullable();
            $table->string('agency')->nullable();
            $table->decimal('programmed_tonnage', 15, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn(['docking_date', 'docking_time', 'origin', 'sub_origin', 'destination', 'agency', 'programmed_tonnage']);
        });
    }
};
