<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions
        $permissions = [
            'view dashboard',
            'manage users',
            'manage roles',
            'view dock',
            'view documentation',
            'view apt',
            'view commercialization',
            'view surveillance',
            'view surveillance operators',
            'view scale',
            'view traffic',
            'access admin panel',
            'view sales orders',   // Can view sales orders index (read-only)
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Define Roles and assign permissions

        // Admin
        $role = Role::firstOrCreate(['name' => 'Admin']);
        $role->givePermissionTo(Permission::all());

        // Muelle
        $role = Role::firstOrCreate(['name' => 'Muelle']);
        $role->givePermissionTo(['view dashboard', 'view dock']);

        // Documentador
        $role = Role::firstOrCreate(['name' => 'Documentador']);
        $role->givePermissionTo(['view dashboard', 'view documentation', 'view sales orders']);

        // Almacen
        $role = Role::firstOrCreate(['name' => 'Almacen']);
        $role->givePermissionTo(['view dashboard', 'view apt']);

        // Jefe de Almacen
        $role = Role::firstOrCreate(['name' => 'Jefe de Almacen']);
        $role->givePermissionTo(['view dashboard', 'view apt']);

        // Comercializacion
        $role = Role::firstOrCreate(['name' => 'Comercializacion']);
        $role->givePermissionTo(['view dashboard', 'view commercialization', 'view sales orders']);

        // Vigilancia Caseta
        $role = Role::firstOrCreate(['name' => 'Vigilancia Caseta']);
        $role->givePermissionTo(['view dashboard', 'view surveillance operators']);

        // Vigilancia Supervisor
        $role = Role::firstOrCreate(['name' => 'Vigilancia Supervisor']);
        $role->givePermissionTo(['view dashboard', 'view surveillance', 'view surveillance operators']);

        // Bascula
        $role = Role::firstOrCreate(['name' => 'Bascula']);
        $role->givePermissionTo(['view dashboard', 'view scale']);


        // Create a default Super Admin user if not exists
        $adminEmail = 'admin@vecode.com';
        $adminUser = User::where('email', $adminEmail)->first();

        if (!$adminUser) {
            $adminUser = User::create([
                'name' => 'Super Admin',
                'username' => 'admin',
                'email' => $adminEmail,
                'password' => Hash::make('password'), // Change this in production
                'status' => 1,
            ]);
        }

        if (!$adminUser->hasRole('Admin')) {
            $adminUser->assignRole('Admin');
        }
    }
}
