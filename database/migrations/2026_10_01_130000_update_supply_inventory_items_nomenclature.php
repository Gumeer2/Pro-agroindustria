<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\SupplyInventoryItem;
use App\Models\SupplyInventoryMovement;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Updates all existing product SKU codes and their movements to the new standard: TT-GG-CCCC (e.g. 01-01-0001)
     */
    public function up(): void
    {
        $types = DB::table('supply_inventory_items')
            ->select('type_id')
            ->distinct()
            ->orderBy('type_id')
            ->pluck('type_id');

        foreach ($types as $typeId) {
            $groups = DB::table('supply_inventory_items')
                ->where('type_id', $typeId)
                ->select('group_number')
                ->distinct()
                ->orderBy('group_number')
                ->pluck('group_number');

            foreach ($groups as $groupNumber) {
                $items = DB::table('supply_inventory_items')
                    ->where('type_id', $typeId)
                    ->where('group_number', $groupNumber)
                    ->orderBy('id', 'asc')
                    ->get();

                $consecutive = 1;
                foreach ($items as $item) {
                    $newCode = sprintf('%02d-%02d-%04d', (int) $typeId, (int) $groupNumber, $consecutive);

                    DB::table('supply_inventory_items')
                        ->where('id', $item->id)
                        ->update(['code' => $newCode]);

                    DB::table('supply_inventory_movements')
                        ->where('item_id', $item->id)
                        ->update(['item_code' => $newCode]);

                    $consecutive++;
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Nomenclature update is irreversible without backup of previous arbitrary codes
    }
};
