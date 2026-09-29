<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix for CRISTIAN IVAN AYALA TOLEDO
        // Merge records with incorrect economic number 'UP 734' into the correct 'UTC 734'
        DB::table('loading_orders')
            ->where('operator_name', 'CRISTIAN IVAN AYALA TOLEDO')
            ->where('economic_number', 'UP 734')
            ->update(['economic_number' => 'UTC 734']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This data fix is irreversible as we merge values.
    }
};
