<?php

namespace App\Http\Controllers;

use App\Models\PackagingEquipment;
use Illuminate\Http\Request;

class PackagingEquipmentController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company' => 'required|string|in:PRO-AGRO,FERTINAL',
            'description' => 'required|string|max:255',
            'tag' => 'required|string|max:100',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'serial_number' => 'required|string|max:100',
            'category_number' => 'nullable|integer',
            'status' => 'nullable|string|max:50',
            'observations' => 'nullable|string',
        ]);

        if (empty($validated['category_number'])) {
            $descUpper = mb_strtoupper($validated['description']);
            if (str_contains($descUpper, 'TOLVA')) {
                $validated['category_number'] = 1;
            } elseif (str_contains($descUpper, 'ENSACADORA')) {
                $validated['category_number'] = 2;
            } else {
                $validated['category_number'] = 3;
            }
        }

        PackagingEquipment::create($validated);

        return redirect()->back()->with('success', 'Equipo de línea de envasado registrado exitosamente.');
    }

    public function update(Request $request, PackagingEquipment $packagingEquipment)
    {
        $validated = $request->validate([
            'company' => 'required|string|in:PRO-AGRO,FERTINAL',
            'description' => 'required|string|max:255',
            'tag' => 'required|string|max:100',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'serial_number' => 'required|string|max:100',
            'category_number' => 'nullable|integer',
            'status' => 'nullable|string|max:50',
            'observations' => 'nullable|string',
        ]);

        if (empty($validated['category_number'])) {
            $descUpper = mb_strtoupper($validated['description']);
            if (str_contains($descUpper, 'TOLVA')) {
                $validated['category_number'] = 1;
            } elseif (str_contains($descUpper, 'ENSACADORA')) {
                $validated['category_number'] = 2;
            } else {
                $validated['category_number'] = 3;
            }
        }

        $packagingEquipment->update($validated);

        return redirect()->back()->with('success', 'Equipo de línea de envasado actualizado exitosamente.');
    }

    public function destroy(PackagingEquipment $packagingEquipment)
    {
        $packagingEquipment->delete();

        return redirect()->back()->with('success', 'Equipo de línea de envasado eliminado exitosamente.');
    }
}
