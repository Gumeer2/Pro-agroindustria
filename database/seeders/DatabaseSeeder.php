<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Product;
use App\Models\Transporter;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin User
        User::updateOrCreate(
            ['email' => 'admin@vecode.com'],
            [
                'name' => 'Admin VECODE',
                'password' => bcrypt('password'),
                'role_id' => 1
            ]
        );

        // Clients
        $clients = [
            ['business_name' => 'Agropecuaria El Sol', 'rfc' => 'ASO900101AAA', 'address' => 'Carr. Federal 45 Km 10', 'contact_info' => 'Juan Perez'],
            ['business_name' => 'Distribuidora de Granos del Bajio', 'rfc' => 'DGB800505BBB', 'address' => 'Av. Tecnologico 200', 'contact_info' => 'Maria Lopez'],
            ['business_name' => 'Alimentos Balanceados S.A.', 'rfc' => 'ABA101010CCC', 'address' => 'Zona Industrial Lote 5', 'contact_info' => 'Pedro Ramirez'],
        ];

        foreach ($clients as $c) {
            Client::updateOrCreate(['rfc' => $c['rfc']], $c);
        }

        // Products
        $products = [
            ['code' => '1001', 'name' => 'UREA AGRICOLA', 'default_packaging' => 'Granel'],
            ['code' => '1002', 'name' => 'UREA INDUSTRIAL', 'default_packaging' => 'Granel'],
            ['code' => '1003', 'name' => 'BARREDURA DE UREA FUERA DE ESPECIFICACION', 'default_packaging' => 'Granel'],
            ['code' => '1004', 'name' => 'AMONIACO ANHIDRO', 'default_packaging' => 'Granel'],
            ['code' => '1005', 'name' => 'FOSFATO DIAMONICO (DAP)', 'default_packaging' => 'Granel'],
            ['code' => '1006', 'name' => 'SERVICIO DE CARGA DE AMONIACO', 'default_packaging' => 'Granel'],
            ['code' => '1007', 'name' => 'UREA PRILADA (25 Kg.)', 'default_packaging' => '25 Kg'],
            // Keep original for back-compat or removal if desired, user asked specifically for these:
            ['code' => 'P-001', 'name' => 'Maíz Blanco', 'default_packaging' => 'Granel'],
            ['code' => 'P-002', 'name' => 'Sorgo', 'default_packaging' => 'Granel'],
        ];

        foreach ($products as $p) {
            Product::updateOrCreate(['code' => $p['code']], $p);
        }

        // Transporters
        $transporters = [
            ['name' => 'Transportes Castores', 'rfc' => 'TCA909090123'],
            ['name' => 'Fletes México', 'rfc' => 'FME808080456'],
        ];

        foreach ($transporters as $tData) {
            $t = Transporter::updateOrCreate(['rfc' => $tData['rfc']], $tData);

            if ($t->name === 'Transportes Castores') {
                // Drivers & Vehicles for Transporter 1
                \App\Models\Driver::updateOrCreate(
                    ['license_number' => 'LIC-900800'],
                    ['name' => 'Roberto Gómez', 'transporter_id' => $t->id]
                );
                \App\Models\Driver::updateOrCreate(
                    ['license_number' => 'LIC-112233'],
                    ['name' => 'Esteban Quito', 'transporter_id' => $t->id]
                );

                \App\Models\Vehicle::updateOrCreate(
                    ['plate_number' => 'GTO-2233'],
                    ['economic_number' => 'ECO-01', 'type' => 'Tortour', 'transporter_id' => $t->id]
                );
                \App\Models\Vehicle::updateOrCreate(
                    ['plate_number' => 'JAL-4455'],
                    ['economic_number' => 'ECO-02', 'type' => 'Rabón', 'transporter_id' => $t->id]
                );
            }
        }
    }
}
