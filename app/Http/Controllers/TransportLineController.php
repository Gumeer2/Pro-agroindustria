<?php

namespace App\Http\Controllers;

use App\Models\TransportLine;
use Illuminate\Http\Request;

class TransportLineController extends Controller
{
    public function index()
    {
        return response()->json(TransportLine::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:transport_lines,name|max:255',
        ]);

        $line = TransportLine::create([
            'name' => mb_strtoupper(trim($validated['name']), 'UTF-8'),
        ]);

        return response()->json($line, 201);
    }

    public function update(Request $request, TransportLine $transportLine)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:transport_lines,name,' . $transportLine->id . '|max:255',
        ]);

        $transportLine->update([
            'name' => mb_strtoupper(trim($validated['name']), 'UTF-8'),
        ]);

        return response()->json($transportLine);
    }

    public function destroy(TransportLine $transportLine)
    {
        $transportLine->delete();
        return response()->json(null, 204);
    }
}
