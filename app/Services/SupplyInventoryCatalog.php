<?php

namespace App\Services;

class SupplyInventoryCatalog
{
    /**
     * Get all 4 Inventory Types / Submodules with their groups.
     * Basado en la estructura oficial de CONTROL DE INVENTARIO:
     * 1. Refaccionamiento Equipos de envasado (Grupos 101 a 108)
     * 2. Maquinaria (Grupos 201 a 203)
     * 3. Herramientas y equipos (Grupos 301 a 306)
     * 4. Consumibles (Grupos 401 a 410)
     */
    public static function getTypes(): array
    {
        return [
            1 => [
                'id' => 1,
                'name' => 'Refaccionamiento Equipos de envasado',
                'slug' => 'refaccionamiento-equipos-de-envasado',
                'description' => 'Refacciones y componentes para líneas de envasado, cosedoras, tolvas, compresores y bandas.',
                'icon' => 'Wrench',
                'color' => 'bg-blue-50 text-blue-600',
                'border' => 'border-blue-200',
                'hover' => 'hover:border-blue-500 hover:shadow-blue-100',
                'accent' => 'blue',
                'groups' => [
                    ['number' => 101, 'consecutive' => '0001', 'code' => '1010001', 'name' => 'Cosedoras', 'is_inventoried' => true],
                    ['number' => 102, 'consecutive' => '0002', 'code' => '1020001', 'name' => 'Envasadoras', 'is_inventoried' => true],
                    ['number' => 103, 'consecutive' => '0003', 'code' => '1030001', 'name' => 'Bandas', 'is_inventoried' => true],
                    ['number' => 104, 'consecutive' => '0004', 'code' => '1040001', 'name' => 'Basculas de piso', 'is_inventoried' => true],
                    ['number' => 105, 'consecutive' => '0005', 'code' => '1050001', 'name' => 'Compresores', 'is_inventoried' => true],
                    ['number' => 106, 'consecutive' => '0006', 'code' => '1060001', 'name' => 'Tolvas de alimentacion', 'is_inventoried' => true],
                    ['number' => 107, 'consecutive' => '0007', 'code' => '1070001', 'name' => 'Rodamientos', 'is_inventoried' => true],
                    ['number' => 108, 'consecutive' => '0008', 'code' => '1080001', 'name' => 'Tornilleria', 'is_inventoried' => true],
                ],
            ],
            2 => [
                'id' => 2,
                'name' => 'Maquinaria',
                'slug' => 'maquinaria',
                'description' => 'Maquinaria pesada, cargadores frontales, excavadoras y equipo operativo Komatsu y CAT.',
                'icon' => 'Truck',
                'color' => 'bg-amber-50 text-amber-600',
                'border' => 'border-amber-200',
                'hover' => 'hover:border-amber-500 hover:shadow-amber-100',
                'accent' => 'amber',
                'groups' => [
                    ['number' => 201, 'consecutive' => '0001', 'code' => '2010001', 'name' => 'Komatsu wa-320', 'is_inventoried' => true],
                    ['number' => 202, 'consecutive' => '0002', 'code' => '2020001', 'name' => 'Cat 938g serie II', 'is_inventoried' => true],
                    ['number' => 203, 'consecutive' => '0003', 'code' => '2030001', 'name' => 'Komatsu pc210lc', 'is_inventoried' => true],
                ],
            ],
            3 => [
                'id' => 3,
                'name' => 'Herramientas y equipos',
                'slug' => 'herramientas-y-equipos',
                'description' => 'Equipos auxiliares, herramientas mecánicas de maquinaria, envasado y preservación.',
                'icon' => 'Hammer',
                'color' => 'bg-emerald-50 text-emerald-600',
                'border' => 'border-emerald-200',
                'hover' => 'hover:border-emerald-500 hover:shadow-emerald-100',
                'accent' => 'emerald',
                'groups' => [
                    ['number' => 301, 'consecutive' => '0001', 'code' => '3010001', 'name' => 'Equipos envasado', 'is_inventoried' => true],
                    ['number' => 302, 'consecutive' => '0002', 'code' => '3020001', 'name' => 'Equipos maquinaria', 'is_inventoried' => true],
                    ['number' => 303, 'consecutive' => '0003', 'code' => '3030001', 'name' => 'Equipos auxiliares', 'is_inventoried' => true],
                    ['number' => 304, 'consecutive' => '0004', 'code' => '3040001', 'name' => 'Herramientas mecanico equipo envasado', 'is_inventoried' => true],
                    ['number' => 305, 'consecutive' => '0005', 'code' => '3050001', 'name' => 'Herramientas mecanico de maquinarias', 'is_inventoried' => true],
                    ['number' => 306, 'consecutive' => '0006', 'code' => '3060001', 'name' => 'Herramientas para preservacion y limpieza', 'is_inventoried' => true],
                ],
            ],
            4 => [
                'id' => 4,
                'name' => 'Consumibles',
                'slug' => 'consumibles',
                'description' => 'Insumos consumibles de envasado, envases vacíos, cal, hilo, rafia, polietileno y seguridad.',
                'icon' => 'ShoppingBag',
                'color' => 'bg-purple-50 text-purple-600',
                'border' => 'border-purple-200',
                'hover' => 'hover:border-purple-500 hover:shadow-purple-100',
                'accent' => 'purple',
                'groups' => [
                    ['number' => 401, 'consecutive' => '0001', 'code' => '4010001', 'name' => 'Envases vacios', 'is_inventoried' => true],
                    ['number' => 402, 'consecutive' => '0002', 'code' => '4020001', 'name' => 'Equipos de envasado', 'is_inventoried' => true],
                    ['number' => 403, 'consecutive' => '0003', 'code' => '4030001', 'name' => 'Maquinarias', 'is_inventoried' => true],
                    ['number' => 404, 'consecutive' => '0004', 'code' => '4040001', 'name' => 'Hilo', 'is_inventoried' => true],
                    ['number' => 405, 'consecutive' => '0005', 'code' => '4050001', 'name' => 'Cal', 'is_inventoried' => true],
                    ['number' => 406, 'consecutive' => '0006', 'code' => '4060001', 'name' => 'Polietileno', 'is_inventoried' => true],
                    ['number' => 407, 'consecutive' => '0007', 'code' => '4070001', 'name' => 'Rafia', 'is_inventoried' => true],
                    ['number' => 408, 'consecutive' => '0008', 'code' => '4080001', 'name' => 'Mascarilla contra polvo', 'is_inventoried' => true],
                    ['number' => 409, 'consecutive' => '0009', 'code' => '4090001', 'name' => 'Rollos de cuerda', 'is_inventoried' => true],
                    ['number' => 410, 'consecutive' => '0010', 'code' => '4100001', 'name' => 'Catalizador para lava-ojos', 'is_inventoried' => true],
                ],
            ],
        ];
    }

    /**
     * Find type by ID or slug.
     */
    public static function findType($identifier): ?array
    {
        $types = self::getTypes();
        if (is_numeric($identifier) && isset($types[(int)$identifier])) {
            return $types[(int)$identifier];
        }

        foreach ($types as $type) {
            if ($type['slug'] === $identifier) {
                return $type;
            }
        }

        return null;
    }

    /**
     * Ensure all products and movements follow the 7-digit code standard: GGGCCCC (e.g. 1010001).
     */
    public static function normalizeProductCodes(): void
    {
        $needsUpdate = \App\Models\SupplyInventoryItem::where('code', 'not regexp', '^[0-9]{7}$')->exists();
        if (!$needsUpdate) {
            return;
        }

        $types = \App\Models\SupplyInventoryItem::select('type_id')->distinct()->orderBy('type_id')->pluck('type_id');
        foreach ($types as $typeId) {
            $groups = \App\Models\SupplyInventoryItem::where('type_id', $typeId)
                ->select('group_number')
                ->distinct()
                ->orderBy('group_number')
                ->pluck('group_number');

            foreach ($groups as $groupNumber) {
                $items = \App\Models\SupplyInventoryItem::where('type_id', $typeId)
                    ->where('group_number', $groupNumber)
                    ->orderBy('id', 'asc')
                    ->get();

                $consecutive = 1;
                foreach ($items as $item) {
                    $newCode = sprintf('%d%04d', (int) $groupNumber, $consecutive);
                    if ($item->code !== $newCode) {
                        $item->update(['code' => $newCode]);
                        \App\Models\SupplyInventoryMovement::where('item_id', $item->id)->update(['item_code' => $newCode]);
                    }
                    $consecutive++;
                }
            }
        }
    }

    /**
     * Ensure all movement reference documents / folios follow the standard ENT-0000 / VAL-0000 format.
     */
    public static function normalizeMovementFolios(): void
    {
        $movements = \App\Models\SupplyInventoryMovement::all();
        foreach ($movements as $m) {
            $ref = trim($m->reference_document ?? '');
            $prefix = $m->movement_type === 'entry' ? 'ENT-' : 'VAL-';
            if (empty($ref)) {
                $m->update(['reference_document' => sprintf('%s%04d', $prefix, $m->id)]);
            } elseif (ctype_digit($ref)) {
                $m->update(['reference_document' => sprintf('%s%04d', $prefix, (int) $ref)]);
            }
        }
    }
}
