<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ExitOperatorType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientBagController extends Controller
{
    /**
     * Muestra la vista de Alta de Clientes Sacos.
     */
    public function index(Request $request)
    {
        $search = trim($request->input('search', ''));
        $bagFilter = $request->input('bag_filter', 'all');

        $query = Client::query();

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                  ->orWhere('rfc', 'like', "%{$search}%")
                  ->orWhere('contact_info', 'like', "%{$search}%");
            });
        }

        if ($bagFilter === 'configured') {
            $query->whereNotNull('bag_types')
                  ->where('bag_types', '!=', '[]')
                  ->where('bag_types', '!=', 'null');
        } elseif ($bagFilter === 'unrestricted') {
            $query->where(function ($q) {
                $q->whereNull('bag_types')
                  ->orWhere('bag_types', '[]')
                  ->orWhere('bag_types', 'null');
            });
        }

        $clients = $query->orderBy('business_name', 'asc')
            ->paginate(25)
            ->withQueryString();

        // Tipos de saco globales existentes
        $dbTypes = ExitOperatorType::orderBy('name')->pluck('name')->toArray();
        $defaults = ['ADM', 'PROAGRO', 'GENERICO', 'FERTINAL'];
        $availableBagTypes = array_values(array_unique(array_filter(array_merge($defaults, $dbTypes))));
        sort($availableBagTypes);

        // Estadísticas rápidas para las tarjetas informativas
        $totalClients = Client::count();
        $configuredClients = Client::whereNotNull('bag_types')
            ->where('bag_types', '!=', '[]')
            ->where('bag_types', '!=', 'null')
            ->count();

        return Inertia::render('Documentation/ClientBags/Index', [
            'clients' => $clients,
            'filters' => [
                'search' => $search,
                'bag_filter' => $bagFilter,
            ],
            'available_bag_types' => $availableBagTypes,
            'stats' => [
                'total_clients' => $totalClients,
                'configured_clients' => $configuredClients,
                'unrestricted_clients' => max(0, $totalClients - $configuredClients),
                'total_bag_types' => count($availableBagTypes),
            ],
        ]);
    }

    /**
     * Guarda / actualiza los tipos de saco autorizados para un cliente específico.
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'bag_types' => 'nullable|array',
            'bag_types.*' => 'string|max:100',
        ]);

        $rawTypes = (array) ($validated['bag_types'] ?? []);
        $cleaned = array_values(array_unique(array_filter(array_map(fn($t) => mb_strtoupper(trim($t), 'UTF-8'), $rawTypes))));

        // Registrar tipos nuevos en el catálogo maestro si no existían
        foreach ($cleaned as $bt) {
            if (!empty($bt)) {
                ExitOperatorType::firstOrCreate(['name' => $bt]);
            }
        }

        $client->update([
            'bag_types' => $cleaned,
        ]);

        return redirect()->back()->with('success', "Tipos de saco actualizados correctamente para {$client->business_name}.");
    }

    /**
     * Registra un nuevo tipo de saco en el catálogo general.
     */
    public function storeType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');
        if (!empty($name)) {
            ExitOperatorType::firstOrCreate(['name' => $name]);
        }

        return redirect()->back()->with('success', "Tipo de saco \"{$name}\" registrado exitosamente en el catálogo.");
    }
}
