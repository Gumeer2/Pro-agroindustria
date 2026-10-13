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
        // 1. Modify plant_origin to string/nullable or default 'UREA 1' to allow 'N/A' and 'IMPORTACION'
        try {
            DB::statement("ALTER TABLE lots MODIFY plant_origin VARCHAR(255) NOT NULL DEFAULT 'UREA 1'");
        } catch (\Exception $e) {
            // Ignore if already modified
        }

        // 2. Drop unique indexes on folio/warehouse so multiple N/A lots can exist without restriction
        try {
            $indexes = DB::select('SHOW INDEXES FROM lots');
            foreach ($indexes as $idx) {
                if ($idx->Key_name === 'lots_folio_unique') {
                    DB::statement("ALTER TABLE lots DROP INDEX lots_folio_unique");
                }
                if ($idx->Key_name === 'lots_folio_warehouse_unique') {
                    DB::statement("ALTER TABLE lots DROP INDEX lots_folio_warehouse_unique");
                }
            }
            // Add a regular non-unique index on folio for search performance
            DB::statement("ALTER TABLE lots ADD INDEX lots_folio_index (folio)");
        } catch (\Exception $e) {
            // Ignore if already adjusted
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            $indexes = DB::select('SHOW INDEXES FROM lots');
            $hasFolioWarehouseUnique = false;
            foreach ($indexes as $idx) {
                if ($idx->Key_name === 'lots_folio_warehouse_unique') $hasFolioWarehouseUnique = true;
            }

            if ($hasFolioWarehouseUnique) {
                DB::statement("ALTER TABLE lots DROP INDEX lots_folio_warehouse_unique");
            }
            DB::statement("ALTER TABLE lots ADD UNIQUE KEY lots_folio_unique (folio)");
        } catch (\Exception $e) {
            //
        }
    }
};
