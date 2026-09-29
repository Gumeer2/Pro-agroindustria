<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrigin;
use Illuminate\Http\Request;

class ShipmentOriginController extends Controller
{
    public function index()
    {
        return response()->json(ShipmentOrigin::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $origin = ShipmentOrigin::firstOrCreate(
            ['name' => $name]
        );

        return response()->json($origin, 201);
    }

    public function update(Request $request, ShipmentOrigin $origin)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $exists = ShipmentOrigin::where('name', $name)->where('id', '!=', $origin->id)->first();
        if ($exists) {
            return response()->json([
                'message' => 'El origen ya existe con este nombre.',
                'errors' => ['name' => ['El origen ya existe con este nombre.']]
            ], 422);
        }

        $origin->update([
            'name' => $name,
        ]);

        return response()->json($origin);
    }

    public function destroy(ShipmentOrigin $origin)
    {
        // Don't delete "PLANTA" if it's considered system default, 
        // but user asked for "option to delete" generally.
        $origin->delete();
        return response()->json(null, 204);
    }
}
