<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckClientRoleAccess
{
    /**
     * Handle an incoming request.
     *
     * Ensures that users with the 'Clientes' role can ONLY see and perform
     * what corresponds to the Clients module and its card (exit operators assignment).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // If user is authenticated and has the role 'Clientes' (and not 'Admin')
        if ($user && $user->hasRole('Clientes') && !$user->hasRole('Admin')) {
            $routeName = $request->route() ? $request->route()->getName() : '';
            $path = trim($request->path(), '/');

            // Explicitly allowed route names
            $allowedRouteNames = [
                'clients.index',
                'documentation.exit-operators.create',
                'documentation.exit-operators.store',
                'documentation.exit-operators.destroy',
                'exit-operator-types.index',
                'exit-operator-types.store',
                'exit-operator-types.update',
                'exit-operator-types.destroy',
                'logout',
            ];

            // Explicitly allowed exact or prefix paths
            $isAllowedPath = $path === 'clients' ||
                $path === 'documentation/exit-operators' ||
                $path === 'documentation/exit-operators/create' ||
                str_starts_with($path, 'documentation/exit-operators/') ||
                $path === 'exit-operator-types' ||
                str_starts_with($path, 'exit-operator-types/') ||
                $path === 'logout';

            $isAllowedRoute = in_array($routeName, $allowedRouteNames, true) || $isAllowedPath;

            // Block access to the standard documentation exit operators list (index) and edit views
            if (
                $routeName === 'documentation.exit-operators.index' ||
                $routeName === 'documentation.exit-operators.edit' ||
                ($path === 'documentation/exit-operators' && $request->isMethod('GET')) ||
                str_ends_with($path, '/edit')
            ) {
                return redirect()->route('clients.index');
            }

            // If accessing documentation.exit-operators.create without from=clients, redirect with from=clients
            if ($routeName === 'documentation.exit-operators.create' || $path === 'documentation/exit-operators/create') {
                if ($request->query('from') !== 'clients') {
                    return redirect()->route('documentation.exit-operators.create', ['from' => 'clients']);
                }
            }

            if (!$isAllowedRoute) {
                // If attempting to access any unauthorized module/route, redirect to clients module
                return redirect()->route('clients.index');
            }
        }

        return $next($request);
    }
}
