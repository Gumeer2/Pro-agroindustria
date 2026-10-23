<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index()
    {
        return \Inertia\Inertia::render('Clients/Index', [
            'module' => 'clients',
        ]);
    }

    public function directory(Request $request)
    {
        $query = Client::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                    ->orWhere('rfc', 'like', "%{$search}%")
                    ->orWhere('contact_info', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return \Inertia\Inertia::render('Clients/Directory', [
            'clients' => $clients,
            'filters' => $request->only(['search']),
            'module' => 'clients',
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('Clients/Create', [
            'module' => 'clients',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'rfc' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact_info' => 'required|string|max:255',
        ]);

        Client::create($validated);

        return redirect()->route('clients.directory')->with('success', 'Cliente agregado correctamente.');
    }

    public function edit(Client $client)
    {
        return \Inertia\Inertia::render('Clients/Edit', [
            'client' => $client,
            'module' => 'clients',
        ]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'rfc' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'contact_info' => 'required|string|max:255',
        ]);

        $client->update($validated);

        return redirect()->route('clients.directory')->with('success', 'Cliente actualizado correctamente.');
    }
}
