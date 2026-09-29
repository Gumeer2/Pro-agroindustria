<?php

namespace App\Http\Controllers;

use App\Models\ServiceProvider;
use Illuminate\Http\Request;

class ServiceProviderController extends Controller
{
    public function index()
    {
        return response()->json(ServiceProvider::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');
        $provider = ServiceProvider::firstOrCreate(['name' => $name]);

        return response()->json($provider, 201);
    }

    public function update(Request $request, ServiceProvider $serviceProvider)
    {
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        if (ServiceProvider::where('name', $name)->where('id', '!=', $serviceProvider->id)->exists()) {
            return response()->json([
                'message' => 'La empresa ya existe con este nombre.',
                'errors' => ['name' => ['La empresa ya existe con este nombre.']],
            ], 422);
        }

        $serviceProvider->update(['name' => $name]);

        return response()->json($serviceProvider);
    }

    public function destroy(ServiceProvider $serviceProvider)
    {
        $serviceProvider->delete();

        return response()->json(null, 204);
    }
}