<?php

namespace App\Http\Controllers;

use App\Models\ExitOperatorType;
use Illuminate\Http\Request;

class ExitOperatorTypeController extends Controller
{
    public function index()
    {
        return response()->json(ExitOperatorType::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $type = ExitOperatorType::firstOrCreate(
            ['name' => $name]
        );

        return response()->json($type, 201);
    }

    public function update(Request $request, ExitOperatorType $exit_operator_type)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');

        $exists = ExitOperatorType::where('name', $name)->where('id', '!=', $exit_operator_type->id)->first();
        if ($exists) {
            return response()->json([
                'message' => 'El tipo ya existe con este nombre.',
                'errors' => ['name' => ['El tipo ya existe con este nombre.']]
            ], 422);
        }

        $exit_operator_type->update([
            'name' => $name,
        ]);

        return response()->json($exit_operator_type);
    }

    public function destroy(ExitOperatorType $exit_operator_type)
    {
        $exit_operator_type->delete();
        return response()->json(null, 204);
    }
}

