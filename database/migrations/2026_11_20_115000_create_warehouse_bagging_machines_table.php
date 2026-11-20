<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_bagging_machines', function (Blueprint $table) {
            $table->id();
            $table->string('warehouse', 100);
            $table->unsignedInteger('warehouse_number')->default(1);
            $table->string('company', 50)->default('PRO-AGRO');
            $table->string('left_tag', 100)->default('ENS-P01');
            $table->string('left_brand', 100)->nullable()->default('VICTOR');
            $table->string('left_model', 100)->nullable()->default('EETII-60');
            $table->string('left_serial', 100)->nullable();
            $table->string('right_tag', 100)->default('ENS-P02');
            $table->string('right_brand', 100)->nullable()->default('VICTOR');
            $table->string('right_model', 100)->nullable()->default('EETII-60');
            $table->string('right_serial', 100)->nullable();
            $table->string('hopper_tag', 100)->nullable()->default('LE-P01');
            $table->string('status', 50)->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_bagging_machines');
    }
};
