<?php

namespace App\Http\Controllers;

use App\Models\Lot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class LotController extends Controller
{
    public function index(Request $request)
    {
        $query = Lot::with('user');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                  ->orWhere('warehouse', 'like', "%{$search}%")
                  ->orWhere('cubicle', 'like', "%{$search}%")
                  ->orWhere('plant_origin', 'like', "%{$search}%");
            });
        }

        $lots = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('APT/Lots/Index', [
            'lots' => $lots,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        return Inertia::render('APT/Lots/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'folio' => 'required|string|unique:lots,folio',
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
            'created_at' => 'nullable|date', // For manual override
        ]);

        $lot = Lot::create([
            'folio' => $validated['folio'],
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'],
            'plant_origin' => $validated['plant_origin'],
            'user_id' => auth()->id(),
            'status' => 'open',
            'created_at' => $validated['created_at'] ?? now(),
        ]);

        return redirect()->route('apt.lots.index')->with('success', 'Lote creado correctamente.');
    }

    public function edit(Lot $lot)
    {
        return Inertia::render('APT/Lots/Edit', [
            'lot' => $lot
        ]);
    }

    public function update(Request $request, Lot $lot)
    {
        $validated = $request->validate([
            'folio' => ['required', 'string', Rule::unique('lots')->ignore($lot->id)],
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
            'plant_origin' => ['required', Rule::in(['UREA 1', 'UREA 2'])],
            'created_at' => 'nullable|date',
        ]);

        $lot->update([
            'folio' => $validated['folio'],
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'],
            'plant_origin' => $validated['plant_origin'],
            'created_at' => $validated['created_at'] ?? $lot->created_at,
        ]);

        return redirect()->route('apt.lots.index')->with('success', 'Lote actualizado correctamente.');
    }

    public function toggleStatus(Lot $lot)
    {
        $lot->status = $lot->status === 'open' ? 'closed' : 'open';
        $lot->save();

        return redirect()->back()->with('success', 'Estatus del lote actualizado.');
    }

    public function destroy(Lot $lot)
    {
        $lot->delete();
        return redirect()->back()->with('success', 'Lote eliminado.');
    }
}
