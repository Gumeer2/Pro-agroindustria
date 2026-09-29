<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vessel;
use App\Models\Client;
use App\Models\Product;
use Carbon\Carbon;

class DockStatusSeeder extends Seeder
{
    public function run()
    {
        // Ensure Clients
        $pemex = Client::firstOrCreate(['business_name' => 'PEMEX'], ['rfc' => 'PEMEX000000']);
        $generic = Client::firstOrCreate(['business_name' => 'Generico'], ['rfc' => 'GEN000000']);

        // Ensure Products
        $urea = Product::firstOrCreate(['name' => 'UREA'], ['code' => 'UREA']);
        $dap = Product::firstOrCreate(['name' => 'DAP'], ['code' => 'DAP']);

        // 1. Blue Commander (ECO - Active)
        Vessel::updateOrCreate(
            ['name' => 'Blue Commander'],
            [
                'vessel_type' => 'B/T',
                'dock' => 'ECO',
                'eta' => Carbon::create(2021, 4, 21),
                'berthal_datetime' => Carbon::create(2021, 4, 21, 9, 0, 0),
                'docking_date' => Carbon::create(2021, 4, 21), // Legacy field
                'docking_time' => '09:00', // Legacy field
                'operation_type' => 'Resguardo',
                'stay_days' => 1724,
                'client_id' => $pemex->id,
                'observations' => 'N/A'
            ]
        );

        // 3. Nordorinoco
        Vessel::updateOrCreate(
            ['name' => 'Nordorinoco'],
            [
                'vessel_type' => 'M/V',
                'dock' => 'WHISKY',
                'eta' => Carbon::create(2026, 1, 17),
                'etb' => Carbon::create(2026, 1, 18),
                'docking_date' => Carbon::create(2026, 1, 18), // Legacy field
                'docking_time' => '00:00', // Legacy field
                'operation_type' => 'Descarga',
                'stay_days' => 4,
                'client_id' => $generic->id,
                'product_id' => $urea->id,
                'programmed_tonnage' => 17500,
                'observations' => 'Buque con prospecto de atraque al arribo al muelle de Asipona pajaritos'
            ]
        );

        // REMOVED: Ignacio Allende, Yasa Rose, Rojen (Explicitly requested by user to be removed)
    }
}
