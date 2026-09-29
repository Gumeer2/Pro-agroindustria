<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Tenant::updateOrCreate(
            ['slug' => 'proagro'],
            [
                'name' => 'Proagroindustria S.A. de C.V.',
                'domain' => 'pro-agroindustria.com',
                'logo' => '/images/logo_proagro.png',
                'favicon' => '/Proagro.png',
                'primary_color' => '#1e1b4b',
                'secondary_color' => '#3b82f6',
                'copyright_text' => '© 2026 Proagroindustria. Todos los derechos reservados.',
                'is_active' => true,
            ]
        );

        // Dummy tenant for testing
        \App\Models\Tenant::updateOrCreate(
            ['slug' => 'test-client'],
            [
                'name' => 'Cliente de Prueba VECODE',
                'domain' => 'vecode-test.com', // Change this to your spare domain later
                'logo' => '/images/logovecode.png',
                'favicon' => '/favicon.ico',
                'primary_color' => '#0f172a',
                'secondary_color' => '#10b981',
                'copyright_text' => '© 2026 VECODE Solutions. Marca Blanca.',
                'is_active' => true,
            ]
        );
    }
}
