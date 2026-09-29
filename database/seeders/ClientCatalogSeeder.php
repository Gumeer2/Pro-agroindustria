<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClientCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate existing clients to start fresh
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\Client::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $clients = [
            [
                'business_name' => 'AGROINDUSTRIAS DEL BALSAS, S.A. DE C.V.',
                'rfc' => 'ABA930301AZ5',
                'address' => 'ISLA DE EN MEDIO S/N CP. 60950, LAZARO CARDENAS, MICHOACAN',
                'contact_info' => 'FERTINAL'
            ],
            [
                'business_name' => 'AGROGEN S.A. DE C.V.',
                'rfc' => 'AGR920618218',
                'address' => 'CARR. TLACOTE EL BAJO KM. 5.5, QUERETARO, QRO.',
                'contact_info' => 'CONOCIDO'
            ],
            [
                'business_name' => 'OPERADORA FERACID S.A. DE C.V.',
                'rfc' => 'OFE180209UT4',
                'address' => 'BLVD. BUGAMBILIA #4460, COL. CIUDAD BUGAMBILIA, ZAPOPAN, JALISCO',
                'contact_info' => 'CONOCIDO'
            ],
            [
                'business_name' => 'TRADE AITIRIK DE MEXICO',
                'rfc' => 'TAM220519QB7',
                'address' => 'PLAZA DEL ARBOL COL.DR ALFONSO ORTIZ TIRADO C.P.09020 CDMX',
                'contact_info' => 'CONOCIDO'
            ],
        ];

        foreach ($clients as $client) {
            \App\Models\Client::create($client);
        }
    }
}
