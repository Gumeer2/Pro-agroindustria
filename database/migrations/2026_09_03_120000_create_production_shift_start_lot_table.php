<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_shift_start_lot', function (Blueprint $table) {
            $table->foreignId('production_shift_start_id')->constrained('production_shift_starts')->cascadeOnDelete();
            $table->uuid('lot_id');
            $table->foreign('lot_id')->references('id')->on('lots')->cascadeOnDelete();
            $table->primary(['production_shift_start_id', 'lot_id']);
        });

        DB::table('production_shift_starts')->select(['id', 'lot_id'])->get()->each(function ($registration) {
            DB::table('production_shift_start_lot')->insert([
                'production_shift_start_id' => $registration->id,
                'lot_id' => $registration->lot_id,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_shift_start_lot');
    }
};