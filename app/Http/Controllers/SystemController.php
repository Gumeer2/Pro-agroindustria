<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class SystemController extends Controller
{
    public function deployUpdates()
    {
        try {
            Log::info('System: Starting manual migration and seeding via web route.');

            // 1. Run migrations
            $migrationExitCode = Artisan::call('migrate', ['--force' => true]);
            $migrationOutput = Artisan::output();

            // 2. Run the legacy seeder
            $seederExitCode = Artisan::call('db:seed', [
                '--class' => 'MigrateLegacyShipmentsSeeder',
                '--force' => true
            ]);
            $seederOutput = Artisan::output();

            return response()->json([
                'success' => true,
                'message' => 'Despliegue de base de datos completado exitosamente.',
                'migration' => [
                    'exit_code' => $migrationExitCode,
                    'output' => $migrationOutput
                ],
                'seeding' => [
                    'exit_code' => $seederExitCode,
                    'output' => $seederOutput
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('System Deployment Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
