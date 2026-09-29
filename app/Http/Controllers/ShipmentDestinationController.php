<?php

namespace App\Http\Controllers;

use App\Models\ShipmentDestination;
use Illuminate\Http\Request;

class ShipmentDestinationController extends Controller
{
    public function index()
    {
        return response()->json(ShipmentDestination::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $destination = ShipmentDestination::firstOrCreate(
            ['name' => $name]
        );

        return response()->json($destination, 201);
    }

    public function update(Request $request, ShipmentDestination $destination)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $exists = ShipmentDestination::where('name', $name)->where('id', '!=', $destination->id)->first();
        if ($exists) {
            return response()->json([
                'message' => 'El destino ya existe con este nombre.',
                'errors' => ['name' => ['El destino ya existe con este nombre.']]
            ], 422);
        }

        $destination->update([
            'name' => $name,
        ]);

        return response()->json($destination);
    }

    public function destroy(ShipmentDestination $destination)
    {
        $destination->delete();
        return response()->json(null, 204);
    }
}
