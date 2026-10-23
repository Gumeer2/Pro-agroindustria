<?php

namespace App\Http\Controllers;

use App\Models\ExitOperator;
use App\Models\Client;
use App\Models\SalesOrder;
use App\Models\ClientOperatorAssignment;
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

        $operators = $query->with('clients')->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Documentation/ExitOperators/Index', [
            'operators' => $operators,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request)
    {
        $clients = Client::orderBy('business_name')->get(['id', 'business_name', 'rfc']);
        $from = $request->query('from');
        $operators = ExitOperator::with('clients')->orderBy('name')->get();
        $salesOrders = SalesOrder::with(['client', 'product'])
            ->whereIn('status', ['created', 'open'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Acumulado programado a operadores por OV (solo lectura, para la tabla de saldo)
        $programmed = ClientOperatorAssignment::selectRaw('sales_order_id, SUM(tm) as total_tm')
            ->groupBy('sales_order_id')
            ->pluck('total_tm', 'sales_order_id');
        $salesOrders->each(function ($so) use ($programmed) {
            $so->setAttribute('programmed_quantity', (float) ($programmed[$so->id] ?? 0));
        });

        // Asignaciones de operadores a Órdenes de Venta (un registro por asignación)
        $clientAssignments = ClientOperatorAssignment::with([
            'operator.clients',
            'salesOrder.product',
            'salesOrder.client'
        ])
        ->orderBy('updated_at', 'desc')
        ->get();

        $now = now()->timezone('America/Mexico_City');
        $currentOperationalDate = $now->hour < 5 ? $now->subDay()->toDateString() : $now->toDateString();

        $clientAssignments->each(function ($assignment) {
            $updated = $assignment->updated_at ? $assignment->updated_at->copy()->timezone('America/Mexico_City') : null;
            if ($updated) {
                // Corte a las 5:00 AM: si la hora es < 5, pertenece a la jornada del día anterior
                $opDate = $updated->hour < 5 ? $updated->copy()->subDay()->toDateString() : $updated->toDateString();
                $assignment->setAttribute('operational_date', $opDate);
                $assignment->setAttribute('formatted_updated_at', $updated->format('d/m/Y H:i'));
            } else {
                $assignment->setAttribute('operational_date', null);
                $assignment->setAttribute('formatted_updated_at', null);
            }

            // Exponer atributos del operador directamente en la asignación para total compatibilidad
            if ($assignment->operator) {
                $assignment->setAttribute('name', $assignment->operator->name);
                $assignment->setAttribute('transport_line', $assignment->operator->transport_line);
                $assignment->setAttribute('real_transport_line', $assignment->operator->real_transport_line);
                $assignment->setAttribute('tractor_plate', $assignment->operator->tractor_plate);
                $assignment->setAttribute('trailer_plate', $assignment->operator->trailer_plate);
                $assignment->setAttribute('economic_number', $assignment->operator->economic_number);
                $assignment->setAttribute('unit_type', $assignment->operator->unit_type);
                $assignment->setAttribute('clients', $assignment->operator->clients);
            }
        });

        return Inertia::render('Documentation/ExitOperators/Create', [
            'clients' => $clients,
            'operators' => $operators,
            'sales_orders' => $salesOrders,
            'client_operators' => $clientAssignments,
            'current_operational_date' => $currentOperationalDate,
            'from' => $from,
        ]);
    }

    public function store(Request $request)
    {
        $from = $request->input('from');

        if ($from === 'clients') {
            $validated = $request->validate([
                'assignment_id' => 'nullable|integer|exists:client_operator_assignments,id',
                'operator_id' => 'required|integer|exists:exit_operators,id',
                'sales_order_id' => 'required|uuid|exists:sales_orders,id',
                'presentation' => 'required|string|max:100',
                'tm' => 'required|numeric|min:0.01',
                'sack' => 'nullable|string|max:100',
            ], [
                'sales_order_id.required' => 'Debe seleccionar una Orden de Venta (OV).',
                'operator_id.required' => 'Debe seleccionar un operador.',
                'tm.required' => 'Debe ingresar el tonelaje a programar.',
                'tm.min' => 'El tonelaje debe ser mayor a 0.',
            ]);

            $operator = ExitOperator::findOrFail($validated['operator_id']);

            if ($operator->status === 'vetoed') {
                return back()->withErrors(['operator_id' => 'Este operador se encuentra vetado y no puede ser seleccionado.']);
            }

            $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);
            $availableBalance = (float) $salesOrder->balance;

            $currentAssignment = !empty($validated['assignment_id'])
                ? ClientOperatorAssignment::find($validated['assignment_id'])
                : null;

            $effectiveBalance = $availableBalance;
            if ($currentAssignment && $currentAssignment->sales_order_id === $salesOrder->id) {
                $effectiveBalance += (float) $currentAssignment->tm;
            }

            if ((float) $validated['tm'] > $effectiveBalance) {
                return back()->withErrors([
                    'tm' => "El tonelaje programado ({$validated['tm']} TM) excede el saldo restante de la OV ({$effectiveBalance} TM). Solo puede programar lo que queda."
                ]);
            }

            $isGranel = mb_strtoupper(trim($validated['presentation']), 'UTF-8') === 'GRANEL';
            $sackVal = (!$isGranel && !empty($validated['sack'])) ? mb_strtoupper(trim($validated['sack']), 'UTF-8') : null;

            if ($currentAssignment) {
                $currentAssignment->update([
                    'operator_id' => $operator->id,
                    'sales_order_id' => $salesOrder->id,
                    'presentation' => mb_strtoupper(trim($validated['presentation']), 'UTF-8'),
                    'tm' => $validated['tm'],
                    'sack' => $sackVal,
                ]);
            } else {
                ClientOperatorAssignment::create([
                    'operator_id' => $operator->id,
                    'sales_order_id' => $salesOrder->id,
                    'presentation' => mb_strtoupper(trim($validated['presentation']), 'UTF-8'),
                    'tm' => $validated['tm'],
                    'sack' => $sackVal,
                ]);
            }

            // También actualizamos el operador con su asignación más reciente
            $operator->update([
                'sales_order_id' => $salesOrder->id,
                'presentation' => mb_strtoupper(trim($validated['presentation']), 'UTF-8'),
                'tm' => $validated['tm'],
                'sack' => $sackVal,
            ]);

            foreach ($operator->clients as $client) {
                $operator->clients()->updateExistingPivot($client->id, [
                    'sales_order_id' => $salesOrder->id,
                    'presentation' => mb_strtoupper(trim($validated['presentation']), 'UTF-8'),
                    'tm' => $validated['tm'],
                    'sack' => $sackVal,
                ]);
            }

            return redirect()->route('documentation.exit-operators.create', ['from' => 'clients'])
                ->with('success', '¡Operador ' . $operator->name . ' asignado correctamente a la OV ' . $salesOrder->folio . '!');
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
            'clients' => 'nullable|array',
            'clients.*' => 'integer|exists:clients,id',
            'client_ids' => 'nullable|array',
            'client_ids.*' => 'integer|exists:clients,id',
        ]);

        $clientIds = $request->input('clients', $request->input('client_ids', []));
        $validated['client_ids'] = !empty($clientIds) ? array_values(array_unique(array_map('intval', (array)$clientIds))) : null;
        unset($validated['clients']);

        // Normalize to uppercase (Multibyte safe)
        foreach (['name', 'license', 'transport_line', 'economic_number', 'real_transport_line', 'policy', 'unit_type', 'brand_model', 'tractor_plate', 'trailer_plate'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = mb_strtoupper(trim($validated[$field]), 'UTF-8');
            }
        }

        $this->ensureTransportLinesExist($validated['transport_line']);

        $operator = ExitOperator::create($validated);
        if (!empty($validated['client_ids'])) {
            $operator->clients()->sync($validated['client_ids']);
        }

        return redirect()->route('documentation.exit-operators.index')->with('success', '¡Operador registrado con éxito!');
    }

    public function edit($id)
    {
        $operator = ExitOperator::with('clients')->findOrFail($id);

        if ($operator->status === 'vetoed') {
            return redirect()->route('documentation.exit-operators.index')
                ->with('error', 'No se puede editar un operador que ha sido vetado.');
        }

        // If client_ids is empty on record but pivot has rows, ensure client_ids is populated
        if (empty($operator->client_ids) && $operator->clients->isNotEmpty()) {
            $operator->client_ids = $operator->clients->pluck('id')->toArray();
        }

        $clients = Client::orderBy('business_name')->get(['id', 'business_name', 'rfc']);

        return Inertia::render('Documentation/ExitOperators/Edit', [
            'operator' => $operator,
            'clients' => $clients,
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
            'clients' => 'nullable|array',
            'clients.*' => 'integer|exists:clients,id',
            'client_ids' => 'nullable|array',
            'client_ids.*' => 'integer|exists:clients,id',
        ]);

        $clientIds = $request->input('clients', $request->input('client_ids', []));
        $validated['client_ids'] = !empty($clientIds) ? array_values(array_unique(array_map('intval', (array)$clientIds))) : null;
        unset($validated['clients']);

        // Normalize to uppercase (Multibyte safe)
        foreach (['name', 'license', 'transport_line', 'economic_number', 'real_transport_line', 'policy', 'unit_type', 'brand_model', 'tractor_plate', 'trailer_plate'] as $field) {
            if (isset($validated[$field])) {
                $validated[$field] = mb_strtoupper(trim($validated[$field]), 'UTF-8');
            }
        }

        $this->ensureTransportLinesExist($validated['transport_line']);

        $oldName = $operator->name;
        $operator->update($validated);
        $operator->clients()->sync($validated['client_ids'] ?? []);

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
