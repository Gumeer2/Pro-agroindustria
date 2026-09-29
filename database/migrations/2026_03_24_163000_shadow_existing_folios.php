<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration 
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite uses || for concatenation and doesn't have REGEXP by default in standard PHP PDO
            // We'll use a safer approach for existing numeric folios
            DB::statement("UPDATE loading_orders SET folio = '_' || folio WHERE folio GLOB '[0-9]*'");
        } else {
            // MySQL/MariaDB
            DB::statement("UPDATE loading_orders SET folio = CONCAT('_', folio) WHERE folio REGEXP '^[0-9]+$'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement("UPDATE loading_orders SET folio = SUBSTR(folio, 2) WHERE folio LIKE '_%'");
        } else {
            DB::statement("UPDATE loading_orders SET folio = LTRIM(folio, '_') WHERE folio LIKE '\_%'");
        }
    }
};
