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
            // Make existing fields nullable as they might not be used anymore or are conditional
            $table->string('origin')->nullable()->change();
            $table->string('destination')->nullable()->change();
            $table->string('agency')->nullable()->change();
            $table->foreignId('client_id')->nullable()->change();
            $table->foreignId('product_id')->nullable()->change();
            $table->decimal('programmed_tonnage', 10, 2)->nullable()->change();
            // sub_origin and service_type might be in the other migration, making them nullable if they exist
            // We use simple string add/change logic assumes they exist or adds them. 
            // To be safe we just add new fields and modify specific ones we know.

            // New Fields
            $table->string('vessel_type')->nullable(); // B/T, M/V
            $table->date('eta')->nullable();
            $table->string('operation_type')->nullable(); // Resguardo, Descarga
            $table->integer('stay_days')->nullable();
            $table->date('etc')->nullable();
            $table->date('departure_date')->nullable();
            $table->text('observations')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vessels', function (Blueprint $table) {
            $table->dropColumn(['vessel_type', 'eta', 'operation_type', 'stay_days', 'etc', 'departure_date', 'observations']);
            // Reverting nullable changes is complex without knowing exact previous state, skipping for now.
        });
    }
};
