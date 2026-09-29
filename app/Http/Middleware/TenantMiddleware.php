<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $domain = $request->getHost();
        $tenantId = env('APP_TENANT', 'proagro');
        $tenant = null;

        // 1. Try to find tenant in database (if table exists)
        try {
            $tenant = \App\Models\Tenant::where('domain', $domain)
                ->orWhere('slug', $tenantId)
                ->where('is_active', true)
                ->first();
        } catch (\Exception $e) {
            // Table might not exist yet or DB connection issue
            // We ignore and use fallback below
        }

        // 2. If no tenant in DB, use environment-based fallback configuration
        if (!$tenant) {
            $tenantData = [
                'proagro' => [
                    'name' => 'PRO-AGROINDUSTRIA S.A. DE C.V.',
                    'slug' => 'proagro',
                    'logo' => '/images/Proagro2.png',
                    'primary_color' => '#16a34a',
                    'secondary_color' => '#f0fdf4',
                    'domain' => 'pro-agroindustria.com'
                ],
                'vecode' => [
                    'name' => 'VECODE LOGISTICS',
                    'slug' => 'vecode',
                    'logo' => '/images/logovecode.png',
                    'primary_color' => '#1e3a8a',
                    'secondary_color' => '#f0f9ff',
                    'domain' => 'vecode.com'
                ]
            ];

            $data = $tenantData[$tenantId] ?? $tenantData['proagro'];

            // Create a generic object to avoid breaking frontend property access
            $tenant = (object) $data;
        }

        if ($tenant) {
            if (isset($tenant->logo) && is_string($tenant->logo) && !str_starts_with($tenant->logo, 'http') && !str_starts_with($tenant->logo, 'data:')) {
                $tenant->logo = asset(ltrim($tenant->logo, '/'));
            }
            if (isset($tenant->favicon) && is_string($tenant->favicon) && !str_starts_with($tenant->favicon, 'http') && !str_starts_with($tenant->favicon, 'data:')) {
                $tenant->favicon = asset(ltrim($tenant->favicon, '/'));
            }

            config(['app.tenant' => $tenant]);
            config(['app.name' => $tenant->name]);

            \Inertia\Inertia::share([
                'tenant' => $tenant
            ]);
        }

        return $next($request);
    }
}
