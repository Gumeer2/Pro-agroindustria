<?php

namespace App\Http\Controllers;

use App\Models\PackagingEquipment;
use App\Models\WarehouseBaggingMachine;
use Illuminate\Http\Request;

class WarehouseBaggingMachineController extends Controller
{
    public function index()
    {
        $configs = WarehouseBaggingMachine::orderBy('warehouse_number')->get();
        return response()->json($configs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse' => 'required|string|max:100',
            'cubicle' => 'nullable|string|max:50',
            'warehouse_number' => 'nullable|integer',
            'company' => 'nullable|string|max:50',
            'left_tag' => 'nullable|string|max:100',
            'left_brand' => 'nullable|string|max:100',
            'left_model' => 'nullable|string|max:100',
            'left_serial' => 'nullable|string|max:100',
            'right_tag' => 'nullable|string|max:100',
            'right_brand' => 'nullable|string|max:100',
            'right_model' => 'nullable|string|max:100',
            'right_serial' => 'nullable|string|max:100',
            'hopper_tag' => 'nullable|string|max:100',
            'assistant_name' => 'nullable|string|max:255',
            'assistant_id' => 'nullable|integer',
            'status' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['warehouse_number'])) {
            preg_match('/\d+/', $validated['warehouse'], $m);
            $validated['warehouse_number'] = $m ? (int)$m[0] : ((WarehouseBaggingMachine::max('warehouse_number') ?: 5) + 1);
        }
        $validated['company'] = $validated['company'] ?? 'PRO-AGRO';

        $leftTag = !empty($validated['left_tag']) ? trim($validated['left_tag']) : null;
        $rightTag = !empty($validated['right_tag']) ? trim($validated['right_tag']) : null;

        if ($leftTag) {
            $leftEq = PackagingEquipment::where('tag', $leftTag)->first();
            $validated['left_tag'] = $leftTag;
            $validated['left_brand'] = $leftEq?->brand ?: ($validated['left_brand'] ?? 'VICTOR');
            $validated['left_model'] = $leftEq?->model ?: ($validated['left_model'] ?? 'EETII-60');
            $validated['left_serial'] = $leftEq?->serial_number ?: ($validated['left_serial'] ?? null);
        } else {
            $validated['left_tag'] = null;
            $validated['left_brand'] = null;
            $validated['left_model'] = null;
            $validated['left_serial'] = null;
        }

        if ($rightTag) {
            $rightEq = PackagingEquipment::where('tag', $rightTag)->first();
            $validated['right_tag'] = $rightTag;
            $validated['right_brand'] = $rightEq?->brand ?: ($validated['right_brand'] ?? 'VICTOR');
            $validated['right_model'] = $rightEq?->model ?: ($validated['right_model'] ?? 'EETII-60');
            $validated['right_serial'] = $rightEq?->serial_number ?: ($validated['right_serial'] ?? null);
        } else {
            $validated['right_tag'] = null;
            $validated['right_brand'] = null;
            $validated['right_model'] = null;
            $validated['right_serial'] = null;
        }

        $validated['status'] = ($validated['left_tag'] || $validated['right_tag']) ? 'active' : 'unassigned';

        // Reassign conflicts: remove these tags from any other warehouse
        $existing = WarehouseBaggingMachine::where('warehouse', $validated['warehouse'])
            ->when(isset($validated['cubicle']), function ($q) use ($validated) {
                return $q->where('cubicle', $validated['cubicle']);
            })
            ->first();
        $targetId = $existing?->id;

        if ($leftTag) {
            WarehouseBaggingMachine::where('id', '!=', $targetId)
                ->where('left_tag', $leftTag)
                ->update(['left_tag' => null, 'left_brand' => null, 'left_model' => null, 'left_serial' => null]);
            WarehouseBaggingMachine::where('id', '!=', $targetId)
                ->where('right_tag', $leftTag)
                ->update(['right_tag' => null, 'right_brand' => null, 'right_model' => null, 'right_serial' => null]);
        }

        if ($rightTag) {
            WarehouseBaggingMachine::where('id', '!=', $targetId)
                ->where('left_tag', $rightTag)
                ->update(['left_tag' => null, 'left_brand' => null, 'left_model' => null, 'left_serial' => null]);
            WarehouseBaggingMachine::where('id', '!=', $targetId)
                ->where('right_tag', $rightTag)
                ->update(['right_tag' => null, 'right_brand' => null, 'right_model' => null, 'right_serial' => null]);
        }

        WarehouseBaggingMachine::updateOrCreate(
            [
                'warehouse' => $validated['warehouse'],
                'cubicle' => $validated['cubicle'] ?? null,
            ],
            $validated
        );

        return redirect()->back()->with('success', 'Configuración de ensacadoras por almacén guardada.');
    }

    public function update(Request $request, WarehouseBaggingMachine $warehouseBaggingMachine)
    {
        $validated = $request->validate([
            'warehouse' => 'required|string|max:100',
            'cubicle' => 'nullable|string|max:50',
            'warehouse_number' => 'nullable|integer',
            'company' => 'nullable|string|max:50',
            'left_tag' => 'nullable|string|max:100',
            'left_brand' => 'nullable|string|max:100',
            'left_model' => 'nullable|string|max:100',
            'left_serial' => 'nullable|string|max:100',
            'right_tag' => 'nullable|string|max:100',
            'right_brand' => 'nullable|string|max:100',
            'right_model' => 'nullable|string|max:100',
            'right_serial' => 'nullable|string|max:100',
            'hopper_tag' => 'nullable|string|max:100',
            'assistant_name' => 'nullable|string|max:255',
            'assistant_id' => 'nullable|integer',
            'status' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['warehouse_number'])) {
            preg_match('/\d+/', $validated['warehouse'], $m);
            $validated['warehouse_number'] = $m ? (int)$m[0] : ((WarehouseBaggingMachine::max('warehouse_number') ?: 5) + 1);
        }
        $validated['company'] = $validated['company'] ?? 'PRO-AGRO';

        $leftTag = !empty($validated['left_tag']) ? trim($validated['left_tag']) : null;
        $rightTag = !empty($validated['right_tag']) ? trim($validated['right_tag']) : null;

        if ($leftTag) {
            $leftEq = PackagingEquipment::where('tag', $leftTag)->first();
            $validated['left_tag'] = $leftTag;
            $validated['left_brand'] = $leftEq?->brand ?: ($validated['left_brand'] ?? 'VICTOR');
            $validated['left_model'] = $leftEq?->model ?: ($validated['left_model'] ?? 'EETII-60');
            $validated['left_serial'] = $leftEq?->serial_number ?: ($validated['left_serial'] ?? null);
        } else {
            $validated['left_tag'] = null;
            $validated['left_brand'] = null;
            $validated['left_model'] = null;
            $validated['left_serial'] = null;
        }

        if ($rightTag) {
            $rightEq = PackagingEquipment::where('tag', $rightTag)->first();
            $validated['right_tag'] = $rightTag;
            $validated['right_brand'] = $rightEq?->brand ?: ($validated['right_brand'] ?? 'VICTOR');
            $validated['right_model'] = $rightEq?->model ?: ($validated['right_model'] ?? 'EETII-60');
            $validated['right_serial'] = $rightEq?->serial_number ?: ($validated['right_serial'] ?? null);
        } else {
            $validated['right_tag'] = null;
            $validated['right_brand'] = null;
            $validated['right_model'] = null;
            $validated['right_serial'] = null;
        }

        $validated['status'] = ($validated['left_tag'] || $validated['right_tag']) ? 'active' : 'unassigned';

        // Reassign conflicts: unassign these tags from other warehouses
        if ($leftTag) {
            WarehouseBaggingMachine::where('id', '!=', $warehouseBaggingMachine->id)
                ->where('left_tag', $leftTag)
                ->update(['left_tag' => null, 'left_brand' => null, 'left_model' => null, 'left_serial' => null]);
            WarehouseBaggingMachine::where('id', '!=', $warehouseBaggingMachine->id)
                ->where('right_tag', $leftTag)
                ->update(['right_tag' => null, 'right_brand' => null, 'right_model' => null, 'right_serial' => null]);
        }

        if ($rightTag) {
            WarehouseBaggingMachine::where('id', '!=', $warehouseBaggingMachine->id)
                ->where('left_tag', $rightTag)
                ->update(['left_tag' => null, 'left_brand' => null, 'left_model' => null, 'left_serial' => null]);
            WarehouseBaggingMachine::where('id', '!=', $warehouseBaggingMachine->id)
                ->where('right_tag', $rightTag)
                ->update(['right_tag' => null, 'right_brand' => null, 'right_model' => null, 'right_serial' => null]);
        }

        $warehouseBaggingMachine->update($validated);

        return redirect()->back()->with('success', 'Configuración actualizada con éxito.');
    }

    public function destroy(WarehouseBaggingMachine $warehouseBaggingMachine)
    {
        $warehouseBaggingMachine->update([
            'left_tag' => null,
            'left_brand' => null,
            'left_model' => null,
            'left_serial' => null,
            'right_tag' => null,
            'right_brand' => null,
            'right_model' => null,
            'right_serial' => null,
            'status' => 'unassigned',
        ]);

        return redirect()->back()->with('success', 'Ensacadoras desasignadas del almacén.');
    }

    public function assignAssistant(Request $request)
    {
        $validated = $request->validate([
            'warehouse' => 'required|string|max:100',
            'cubicle' => 'nullable|string|max:50',
            'assistant_name' => 'nullable|string|max:255',
            'assistant_id' => 'nullable|integer',
            'hopper_tag' => 'nullable|string|max:100',
        ]);

        preg_match('/\d+/', $validated['warehouse'], $m);
        $num = $m ? (int)$m[0] : 1;
        preg_match('/Cub[ií]culo\s*0?(\d+)/i', $validated['warehouse'], $mCub);
        $cubicle = $validated['cubicle'] ?? ($mCub ? ('Cubículo 0' . $mCub[1]) : null);

        $config = WarehouseBaggingMachine::where('warehouse', $validated['warehouse'])->first();
        if ($config) {
            $config->assistant_name = !empty($validated['assistant_name']) ? trim($validated['assistant_name']) : null;
            $config->assistant_id = !empty($validated['assistant_id']) ? $validated['assistant_id'] : null;
            if (!empty($validated['hopper_tag'])) {
                $config->hopper_tag = $validated['hopper_tag'];
                $config->company = str_contains($validated['hopper_tag'], '-F') ? 'FERTINAL' : 'PRO-AGRO';
            }
            if ($cubicle && empty($config->cubicle)) {
                $config->cubicle = $cubicle;
            }
            $config->save();
        } else {
            $comp = str_contains($validated['hopper_tag'] ?? '', '-F') ? 'FERTINAL' : 'PRO-AGRO';
            WarehouseBaggingMachine::create([
                'warehouse' => $validated['warehouse'],
                'cubicle' => $cubicle,
                'warehouse_number' => $num,
                'company' => $comp,
                'hopper_tag' => $validated['hopper_tag'] ?: "LE-P0{$num}",
                'assistant_name' => !empty($validated['assistant_name']) ? trim($validated['assistant_name']) : null,
                'assistant_id' => !empty($validated['assistant_id']) ? $validated['assistant_id'] : null,
                'status' => 'active',
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Auxiliar de carga asignado a la tolva con éxito.']);
        }

        return redirect()->back()->with('success', 'Auxiliar de carga asignado a la tolva con éxito.');
    }
}
