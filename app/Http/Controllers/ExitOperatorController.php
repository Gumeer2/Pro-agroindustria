<?php

namespace App\Http\Controllers;

use App\Models\ExitOperator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExitOperatorController extends Controller
{
    public function index(Request $request)
    {
        $query = ExitOperator::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('transport_line', 'like', "%{$search}%")
                    ->orWhere('tractor_plate', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $operators = $query->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Documentation/ExitOperators/Index', [
            'operators' => $operators,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Documentation/ExitOperators/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license' => 'required|string|max:255',
            'transport_line' => 'required|string|max:255',
            'economic_number' => 'required|string|max:255',
            'real_transport_line' => 'required|string|max:255',
            'policy' => 'required|string|max:255',
            'unit_type' => 'required|string|max:255',
            'validity' => 'required|date',
            'brand_model' => 'required|string|max:255',
            'tractor_plate' => 'required|string|max:255',
            'trailer_plate' => 'nullable|required_unless:unit_type,VOLTEO,TORTON,CAMIONETA|string|max:255',
        ]);

        // Normalize to uppercase (Multibyte safe)
        foreach (['name', 'license', 'transport_line', 'economic_number', 'real_transport_line', 'policy', 'unit_type', 'brand_model', 'tractor_plate', 'trailer_plate'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = mb_strtoupper(trim($validated[$field]), 'UTF-8');
            }
        }

        $this->ensureTransportLinesExist($validated['transport_line']);

        ExitOperator::create($validated);

        return redirect()->route('documentation.exit-operators.index')->with('success', '¡Operador registrado con éxito!');
    }

    public function edit($id)
    {
        $operator = ExitOperator::findOrFail($id);

        if ($operator->status === 'vetoed') {
            return redirect()->route('documentation.exit-operators.index')
                ->with('error', 'No se puede editar un operador que ha sido vetado.');
        }

        return Inertia::render('Documentation/ExitOperators/Edit', [
            'operator' => $operator,
        ]);
    }

    public function update(Request $request, $id)
    {
        $operator = ExitOperator::findOrFail($id);

        if ($operator->status === 'vetoed') {
            return redirect()->route('documentation.exit-operators.index')
                ->with('error', 'No se puede actualizar la información de un operador vetado.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license' => 'required|string|max:255',
            'transport_line' => 'required|string|max:255',
            'economic_number' => 'required|string|max:255',
            'real_transport_line' => 'required|string|max:255',
            'policy' => 'required|string|max:255',
            'unit_type' => 'required|string|max:255',
            'validity' => 'required|date',
            'brand_model' => 'required|string|max:255',
            'tractor_plate' => 'required|string|max:255',
            'trailer_plate' => 'nullable|required_unless:unit_type,VOLTEO,TORTON,CAMIONETA|string|max:255',
        ]);

        // Normalize to uppercase (Multibyte safe)
        foreach (['name', 'license', 'transport_line', 'economic_number', 'real_transport_line', 'policy', 'unit_type', 'brand_model', 'tractor_plate', 'trailer_plate'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = mb_strtoupper(trim($validated[$field]), 'UTF-8');
            }
        }

        $this->ensureTransportLinesExist($validated['transport_line']);

        $oldName = $operator->name;
        $operator->update($validated);

        // Sync with pending shipment orders
        \App\Models\ShipmentOrder::where('operator_name', $oldName)
            ->whereIn('status', ['created', 'authorized', 'weighing_in', 'loading'])
            ->update([
            'operator_name' => $operator->name,
            'transport_company' => $operator->transport_line,
            'unit_type' => $operator->unit_type,
            'tractor_plate' => $operator->tractor_plate,
            'trailer_plate' => $operator->trailer_plate,
            'economic_number' => $operator->economic_number,
            'unit_number' => $operator->brand_model,
            'license_number' => $operator->license,
        ]);

        return redirect()->route('documentation.exit-operators.index')->with('success', '¡Información actualizada con éxito!');
    }

    public function toggleStatus($id)
    {
        $operator = ExitOperator::findOrFail($id);
        $operator->status = $operator->status === 'active' ? 'vetoed' : 'active';
        $operator->save();

        $message = $operator->status === 'vetoed' ? 'Operador vetado correctamente.' : 'Operador activado correctamente.';
        return back()->with('success', $message);
    }

    public function qr($id)
    {
        $operator = ExitOperator::findOrFail($id);

        if ($operator->status === 'vetoed') {
            return redirect()->route('documentation.exit-operators.index')
                ->with('error', 'No se puede generar QR para un operador vetado.');
        }

        return Inertia::render('Documentation/ExitOperators/Qr', [
            'operator' => $operator,
        ]);
    }

    public function destroy($id)
    {
        $operator = ExitOperator::findOrFail($id);
        $operator->delete();

        return redirect()->route('documentation.exit-operators.index')->with('success', 'Operador eliminado correctamente.');
    }

    /**
     * Helper to ensure transport lines exist in the catalogue.
     */
    private function ensureTransportLinesExist(...$names)
    {
        foreach ($names as $name) {
            if (empty($name)) continue;
            
            $normalized = mb_strtoupper(trim($name), 'UTF-8');
            
            \App\Models\TransportLine::firstOrCreate(['name' => $normalized]);
        }
    }
}
