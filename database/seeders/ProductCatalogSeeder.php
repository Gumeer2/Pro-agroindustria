<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductCatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate existing products to start fresh
        // Foreign key checks disabled to allow truncate
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\Product::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $products = [
            ['code' => '1001', 'name' => 'UREA AGRICOLA', 'default_packaging' => 'Granel'],
            ['code' => '1002', 'name' => 'UREA INDUSTRIAL', 'default_packaging' => 'Granel'],
            ['code' => '1003', 'name' => 'BARREDURA DE UREA FUERA DE ESPECIFICACION', 'default_packaging' => 'Granel'],
            ['code' => '1004', 'name' => 'AMONIACO ANHIDRO', 'default_packaging' => 'Pipa'],
            ['code' => '1005', 'name' => 'FOSFATO DIAMONICO (DAP)', 'default_packaging' => 'Granel'],
            ['code' => '1006', 'name' => 'SERVICIO DE CARGA DE AMONIACO', 'default_packaging' => 'Servicio'],
            ['code' => '1007', 'name' => 'UREA PRILADA (25 Kg.)', 'default_packaging' => 'Saco 25kg'],
        ];

        foreach ($products as $product) {
            \App\Models\Product::create($product);
        }
    }
}
