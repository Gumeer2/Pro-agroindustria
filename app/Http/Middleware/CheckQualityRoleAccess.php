<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckQualityRoleAccess
{
    /**
     * Handle an incoming request.
     *
     * Ensures that users with the 'Calidad' role can ONLY see and access
     * what corresponds to the Quality module (index and oe-tracker).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && ($user->hasRole('Calidad') || $user->hasRole('calidad') || $user->hasRole('Quality')) && !$user->hasRole('Admin')) {
            $routeName = $request->route() ? $request->route()->getName() : '';
            $path = trim($request->path(), '/');

            // Explicitly allowed route names
            $allowedRouteNames = [
                'quality.index',
                'quality.oe-tracker',
                'documentation.orders.print-data',
                'documentation.shipment-orders.get-sampling',
                'logout',
            ];

            // Explicitly allowed exact or prefix paths
            $isAllowedPath = $path === 'quality' ||
                str_starts_with($path, 'quality/') ||
                str_starts_with($path, 'documentation/shipment-orders/') ||
                $path === 'logout';

            $isAllowed = in_array($routeName, $allowedRouteNames, true) || $isAllowedPath;

            if (!$isAllowed) {
                return redirect()->route('quality.index');
            }
        }

        return $next($request);
    }
}

