<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrder;
use App\Models\Transporter;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Product;
use App\Models\Lot;
use App\Models\AccessLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UnitStatusExport;

class TrafficController extends Controller
{
    public function index()
    {
        return Inertia::render('Traffic/Index');
    }

    public function update(Request $request, ShipmentOrder $traffic)
    {
        $validated = $request->validate([
            'transporter_id' => 'required|exists:transporters,id',
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
        ]);

        $traffic->update([
            'transporter_id' => $validated['transporter_id'],
            'driver_id' => $validated['driver_id'],
            'vehicle_id' => $validated['vehicle_id'],
            'status' => 'weighing_in' // Move to next stage automatically? Or keep as created/assigned?
            // Let's keep it simple: assigning traffic moves it to "Ready for Weigh-in" effectively.
            // But strict status flow might be: created -> assigned -> weighing_in. 
            // The enum includes 'weighing_in'. Let's trigger that or maybe just update the fields.
            // For this flow, let's keep status as 'created' until they physically arrive at scale?
            // Or maybe update to 'assigned'? enum didn't have 'assigned'.
            // Let's keep 'created' but now it has data. Or upgrade to 'weighing_in' if that implies "Ready".
            // Actually, "weighing_in" typically means ON THE SCALE.
            // Let's leave status as is, just save the data. The Scale module will pick it up.
        ]);

        return redirect()->back();
    }

    public function createUser()
    {
        return Inertia::render('Traffic/CreateUser');
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:' . User::class,
            'position' => 'nullable|string|max:255',
            'level' => 'nullable|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'position' => $validated['position'],
            'level' => $validated['level'],
            'password' => Hash::make($validated['password']),
            'role_id' => 2, // Default to user or determine by level later
        ]);

        return redirect()->route('traffic.index')->with('success', 'Usuario registrado correctamente.');
    }

    public function productsIndex()
    {
        return Inertia::render('Traffic/Products/Index', [
            'products' => Product::orderBy('name')->get()
        ]);
    }

    public function productsCreate()
    {
        return Inertia::render('Traffic/Products/Create');
    }

    public function productsStore(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:products',
            'name' => 'required|string|max:255',
        ]);

        Product::create($validated);

        return redirect()->route('traffic.products.index')->with('success', 'Producto registrado correctamente.');
    }

    public function productsEdit(string $id)
    {
        return Inertia::render('Traffic/Products/Edit', [
            'product' => Product::findOrFail($id)
        ]);
    }

    public function productsUpdate(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|unique:products,code,' . $id,
            'name' => 'required|string|max:255',
        ]);

        $product->update($validated);

        return redirect()->route('traffic.products.index')->with('success', 'Producto actualizado correctamente.');
    }

    public function productsDestroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return redirect()->route('traffic.products.index')->with('success', 'Producto eliminado correctamente.');
    }

    /**
     * Estatus de Unidades: Monitoreo operativo en tiempo real para Tráfico
     */    public function unitStatusIndex(Request $request)
    {
        $data = $this->getUnitStatusData($request);

        return Inertia::render('Traffic/UnitStatus/Index', [
            'units' => $data['filteredRows'],
            'filters' => [
                'search' => $data['search'],
                'status' => $data['statusFilter'],
                'date' => $data['date'],
            ],
            'stats' => $data['stats'],
        ]);
    }

    /**
     * Exporta el reporte de Estatus de Unidades a Excel (.xlsx)
     */
    public function exportUnitStatusExcel(Request $request)
    {
        $data = $this->getUnitStatusData($request);
        $fileName = 'Estatus_Unidades_' . date('Ymd_His') . '.xlsx';

        return Excel::download(
            new UnitStatusExport($data['filteredRows']),
            $fileName
        );
    }

    /**
     * Resuelve los datos consolidados y filtrados para el módulo Estatus de Unidades
     */
    protected function getUnitStatusData(Request $request): array
    {
        $search = $request->input('search', '');
        $statusFilter = $request->input('status', 'all');
        $date = $request->input('date');

        // 1. Unidades que SOLAMENTE pasaron por vigilancia pero NO se han documentado
        $undocumentedQuery = AccessLog::where('status', 'in_plant')
            ->whereNull('exit_at')
            ->where(function ($q) {
                $q->where('subject_type', 'App\Models\ExitOperator')
                  ->orWhere('subject_type', 'like', '%ExitOperator%');
            })
            ->doesntHave('shipmentOrders')
            ->with('subject');

        if (!empty($date)) {
            $undocumentedQuery->whereDate('entry_at', $date);
        }

        $undocumentedAccessLogs = $undocumentedQuery
            ->orderByDesc('entry_at')
            ->get();

        $undocumentedRows = $undocumentedAccessLogs->map(function (AccessLog $log) {
            $subject = $log->subject;
            $tractorPlate = $subject?->tractor_plate ?: '---';
            $trailerPlate = $subject?->trailer_plate ?: '';
            $operatorName = $subject?->name ?: ($subject?->operator_name ?: '---');
            $transportCompany = $subject?->transport_line ?: ($subject?->real_transport_line ?: '---');

            return [
                'id' => 'log-' . $log->id,
                'folio' => 'Sin Documentar',
                'tractor_plate' => $tractorPlate,
                'trailer_plate' => $trailerPlate,
                'operator_name' => $operatorName,
                'transport_company' => $transportCompany,
                'client' => 'Pendiente de documentar',
                'programmed_tons' => 0.0,
                'product' => 'Pendiente de documentar',
                'presentation' => '---',
                'packaging' => '---',
                'warehouse' => '---',
                'lot_location' => '---',
                'loading_date' => '---',
                'status_key' => 'pending_entry',
                'status_label' => 'Por Ingresar',
                'status_color' => 'red',
                'observations' => $log->notes ?: '',
                'created_at' => $log->entry_at ? $log->entry_at->format('d/m/Y H:i') : '---',
            ];
        });

        // 2. Unidades ya documentadas (ShipmentOrder)
        // Se excluyen canceladas, cerradas y aquellas con salida registrada en vigilancia
        $query = ShipmentOrder::query()
            ->with([
                'client',
                'items.product',
                'lot',
                'weight_ticket',
                'accessLogs' => function ($q) {
                    $q->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at');
                },
            ])
            ->whereNotIn('status', ['cancelled', 'closed'])
            ->whereDoesntHave('accessLogs', function ($q) {
                $q->whereNotNull('access_logs.exit_at')
                  ->orWhere('access_logs.status', 'completed');
            });

        if (!empty($date)) {
            $query->whereDate('created_at', $date);
        }

        $orders = $query->orderByDesc('created_at')->take(200)->get();

        $orderRows = $orders->map(function (ShipmentOrder $order) {
            $ticket = $order->weight_ticket && $order->weight_ticket->weighing_status !== 'cancelled'
                ? $order->weight_ticket
                : null;

            // Status resolution:
            // - Destarada: Si ya pesó salida en báscula o status completed
            // - Cargada: Si finalizó carga en APT y espera báscula de salida
            // - Cargando: Si está en proceso de carga en APT
            // - Tara Registrada: Si ya registró pesaje de tara en báscula
            // - En Planta: Ya pasó por vigilancia y ya se documentó
            $isCompleted = ($order->status === 'completed') || ($ticket && !is_null($ticket->weigh_out_at));
            $hasLoadedFinished = !empty($order->loading_finished_at) || $order->status === 'loaded';
            $isLoading = ($order->status === 'loading' || !empty($order->loaded_at) || !empty($order->lot_id)) && !$hasLoadedFinished;
            $hasTareTicket = ($ticket && (!empty($ticket->weigh_in_at) || !empty($ticket->tare_weight)));

            if ($isCompleted) {
                $statusKey = 'completed';
                $statusLabel = 'Destarado';
                $statusColor = 'emerald';
            } elseif ($hasLoadedFinished) {
                $statusKey = 'loaded';
                $statusLabel = 'Cargado';
                $statusColor = 'blue';
            } elseif ($isLoading) {
                $statusKey = 'loading';
                $statusLabel = 'Cargando';
                $statusColor = 'indigo';
            } elseif ($hasTareTicket) {
                $statusKey = 'tared';
                $statusLabel = 'Tara Registrada';
                $statusColor = 'purple';
            } else {
                // Ya pasó por vigilancia y ya se documentó
                $statusKey = 'in_plant';
                $statusLabel = 'En Planta';
                $statusColor = 'amber';
            }

            // Cliente (se da tras documentar)
            $clientName = $order->client?->business_name ?: ($order->client_name ?: 'N/A');

            // Producto (se da tras documentar)
            $productName = $order->product ?: ($order->items->first()?->product?->name ?: 'N/A');

            // Almacén (depende de la carga)
            $warehouse = $order->warehouse ?: ($order->lot?->warehouse ?: ($ticket?->warehouse ?: 'Pendiente'));

            // Ubicación de Lote (depende de la carga: lote + cubículo/celda)
            $lotLocation = 'Sin asignar';
            if ($order->lot) {
                $parts = [$order->lot->folio];
                if (!empty($order->lot->cubicle)) {
                    $parts[] = "Cub. " . $order->lot->cubicle;
                }
                if (!empty($order->lot->celdas)) {
                    $parts[] = "Celda " . $order->lot->celdas;
                }
                $lotLocation = implode(' - ', $parts);
            }

            // Presentación y Envases (se da tras documentar y/o cargar)
            $packaging = $order->presentation ?: 'N/A';
            if (!empty($order->sacks_count)) {
                $packaging .= ' (' . $order->sacks_count . ')';
            }

            // Fecha de carga (depende de la carga en APT)
            $loadingDate = 'Pendiente';
            if (!empty($order->loading_finished_at)) {
                $loadingDate = Carbon::parse($order->loading_finished_at)->format('d/m/Y H:i');
            } elseif (!empty($order->loaded_at)) {
                $loadingDate = Carbon::parse($order->loaded_at)->format('d/m/Y H:i');
            }

            return [
                'id' => (string) $order->id,
                'folio' => $order->folio,
                'tractor_plate' => $order->tractor_plate ?: '---',
                'trailer_plate' => $order->trailer_plate ?: '',
                'operator_name' => $order->operator_name ?: '---',
                'transport_company' => $order->transport_company ?: '---',
                'client' => $clientName,
                'programmed_tons' => (float)($order->programmed_tons ?: 0),
                'product' => $productName,
                'presentation' => $order->presentation ?: 'N/A',
                'packaging' => $packaging,
                'warehouse' => $warehouse,
                'lot_location' => $lotLocation,
                'loading_date' => $loadingDate,
                'status_key' => $statusKey,
                'status_label' => $statusLabel,
                'status_color' => $statusColor,
                'observations' => $order->observations ?: '',
                'created_at' => $order->created_at ? $order->created_at->format('d/m/Y H:i') : '---',
            ];
        });

        // Combinar unidades por ingresar (solo vigilancia) y órdenes documentadas
        $allRows = $undocumentedRows->concat($orderRows);

        // Búsqueda si se aplicó
        if (!empty($search)) {
            $q = mb_strtolower($search, 'UTF-8');
            $allRows = $allRows->filter(function ($row) use ($q) {
                return str_contains(mb_strtolower($row['folio'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['tractor_plate'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['trailer_plate'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['operator_name'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['client'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['product'], 'UTF-8'), $q) ||
                    str_contains(mb_strtolower($row['transport_company'], 'UTF-8'), $q);
            })->values();
        }

        // Filtrado por estatus si no es 'all'
        $filteredRows = $allRows;
        if ($statusFilter !== 'all') {
            $filteredRows = $allRows->filter(function ($row) use ($statusFilter) {
                return $row['status_key'] === $statusFilter;
            })->values();
        }

        // Estadísticas de resumen (KPIs)
        $stats = [
            'total' => $allRows->count(),
            'in_plant' => $allRows->whereIn('status_key', ['pending_entry', 'in_plant', 'tared', 'loading', 'loaded'])->count(),
            'completed' => $allRows->where('status_key', 'completed')->count(),
            'total_tons' => $allRows->sum('programmed_tons'),
        ];

        return [
            'filteredRows' => $filteredRows->values(),
            'allRows' => $allRows,
            'search' => $search,
            'statusFilter' => $statusFilter,
            'date' => $date,
            'stats' => $stats,
        ];
    }

    /**
     * Actualización manual de observaciones de la unidad desde Tráfico
     */
    public function updateObservations(Request $request, string $id)
    {
        $validated = $request->validate([
            'observations' => 'nullable|string|max:1500',
        ]);

        if (str_starts_with($id, 'log-')) {
            $logId = (int) str_replace('log-', '', $id);
            $log = AccessLog::findOrFail($logId);
            $log->update(['notes' => $validated['observations']]);
            $updatedObs = $log->notes;
        } else {
            $shipmentOrder = ShipmentOrder::findOrFail($id);
            $shipmentOrder->update(['observations' => $validated['observations']]);
            $updatedObs = $shipmentOrder->observations;
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Observaciones actualizadas correctamente.',
                'observations' => $updatedObs,
            ]);
        }

        return redirect()->back()->with('success', 'Observaciones actualizadas correctamente.');
    }
}
