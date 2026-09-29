<?php

namespace App\Http\Controllers;

use App\Models\LoadingOrderReference;
use Illuminate\Http\Request;

class LoadingOrderReferenceController extends Controller
{
    public function index()
    {
        return response()->json(LoadingOrderReference::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:loading_order_references,name|max:255',
        ]);

        $reference = LoadingOrderReference::create([
            'name' => strtoupper($validated['name']),
        ]);

        return response()->json($reference, 201);
    }

    public function update(Request $request, LoadingOrderReference $reference)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:loading_order_references,name,' . $reference->id . '|max:255',
        ]);

        $reference->update([
            'name' => strtoupper($validated['name']),
        ]);

        return response()->json($reference);
    }

    public function destroy(LoadingOrderReference $reference)
    {
        $reference->delete();
        return response()->json(null, 204);
    }
}
