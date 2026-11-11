<?php

namespace App\Http\Controllers;

use App\Models\ShipmentOrder;
use App\Models\Client;
use App\Models\Product;
use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\AccessLog;
use App\Models\Lot;
use App\Models\SalesOrder;
use App\Models\ShipmentDestination;
use App\Models\ShipmentOrigin;
use App\Models\AptAttendance;
use App\Models\LoadingAssistant;
use App\Models\Verifier;
use App\Models\ShipmentProcessHistory;
use App\Models\ShipmentSamplingIncident;
use App\Models\User;
use App\Models\WeightTicket;
use App\Models\ClientOperatorAssignment;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Helpers\OperationalTimeHelper;
use Carbon\Carbon;

class DocumentationController extends Controller
{
    /**
     * Display the main module menu.
     */
    public function index()
    {
        return Inertia::render('Documentation/Index');
    }

    /**
     * Show the form for creating a new Shipment Order (Orden de Embarque).
     */

    public function createOrder(Request $request)
    {
        return Inertia::render('Documentation/Create', [
            'auto_operator_id' => $request->query('auto_operator_id'),
            'first_order_id' => $request->query('first_order_id'),
            'clients' => Client::orderBy('business_name')->get()->map(function ($client) {
                return [
                    'id' => $client->id,
                    'business_name' => $client->business_name,
                    'rfc' => $client->rfc ?? '',
                    'address' => $client->address ?? '',
                    // Add other fields needed for auto-fill if available in Client model
                ];
            }),
            'products' => Product::all(),
            'origins' => ShipmentOrigin::orderBy('name')->get(['id', 'name']),
            'destinations' => ShipmentDestination::orderBy('name')->get(['id', 'name']),
            'sales_orders' => SalesOrder::with(['client', 'product', 'vessel'])
                ->whereIn('status', ['created', 'open'])
                ->get(),
            'scale_operators' => User::role('Bascula')->where('is_blocked', false)->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                ];
            }),
            'default_folio' => function () {
                $maxFolio = ShipmentOrder::where('folio', 'like', 'PA' . date('Y') . '-%')
                    ->get()
                    ->map(function ($order) {
                        $parts = explode('-', $order->folio);
                        return (count($parts) === 2 && is_numeric($parts[1])) ? (int) $parts[1] : 0;
                    })
                    ->max();

                $nextNumber = ($maxFolio ?? 0) + 1;

                return 'PA' . date('Y') . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            },
        ]);
    }

    private function ensureAssignmentColumns(): void
    {
        if (Schema::hasTable('client_operator_assignments')) {
            if (!Schema::hasColumn('client_operator_assignments', 'part_number')) {
                Schema::table('client_operator_assignments', function (Blueprint $table) {
                    $table->unsignedTinyInteger('part_number')->nullable()->after('operator_id');
                });
            }
            if (!Schema::hasColumn('client_operator_assignments', 'shipment_order_id')) {
                Schema::table('client_operator_assignments', function (Blueprint $table) {
                    $table->string('shipment_order_id', 60)->nullable()->after('destare_status');
                });
            }
        }
    }

    private function generateNextFolio(): string
    {
        $maxFolio = ShipmentOrder::where('folio', 'like', 'PA' . date('Y') . '-%')
            ->get()
            ->map(function ($order) {
                $parts = explode('-', $order->folio);
                return (count($parts) === 2 && is_numeric($parts[1])) ? (int) $parts[1] : 0;
            })
            ->max();

        $nextNumber = ($maxFolio ?? 0) + 1;

        return 'PA' . date('Y') . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Store a newly created Shipment Order.
     */
    public function storeOrder(Request $request)
    {
        $this->ensureAssignmentColumns();
        \Log::info('Store Order Request Data:', $request->all());
        $validated = $request->validate([
            'folio' => 'required|unique:shipment_orders,folio',
            'date' => 'required|date',
            'client_id' => 'required|exists:clients,id',
            'sales_order_id' => 'required|exists:sales_orders,id',
            // Snapshot fields
            'client_name' => 'nullable|string', // Re-enabled for snapshot
            'rfc' => 'nullable|string',
            'address' => 'nullable|string',
            'consigned_to' => 'required|string',
            // Transport
            'transport_company' => 'required|string',
            'operator_name' => 'required|string',
            'unit_number' => 'required|string',
            'tractor_plate' => 'required|string',
            'trailer_plate' => 'required|string',
            'carta_porte' => 'required|string',
            'license_number' => 'required|string',
            'unit_type' => 'required|string',
            'economic_number' => 'required|string',
            'qr_code' => 'nullable|string',
            'qr_fertinal' => 'nullable|string',
            // Shipment
            'origin_id' => 'required|exists:shipment_origins,id',
            'destination_id' => 'nullable|exists:shipment_destinations,id',
            'destination' => 'nullable|string',
            'product' => 'required|string',
            'presentation' => 'required|string',
            'sack_type' => 'nullable|string', // Frontend supplemental field
            'sacks_count' => 'nullable|string',
            'programmed_tons' => 'required|numeric|gt:0',
            'balance' => 'nullable', // Frontend field for shortage_balance
            'shortage_balance' => 'nullable|string',
            'documenter_name' => 'nullable|string',
            'scale_name' => 'nullable|string',
            'observations' => 'nullable|string',
            'state' => 'required|string',
            'scale_operator_id' => 'nullable|exists:users,id',
        ]);

        if (empty($validated['destination_id']) && empty($validated['destination'])) {
            return back()->withErrors(['destination_id' => 'El destino es obligatorio.'])->withInput();
        }
        if ($validated['presentation'] === 'ENVASADO' && empty($request->input('sack_type')) && empty($validated['sacks_count'])) {
            return back()->withErrors(['sack_type' => 'El tamaño de saco es obligatorio para producto envasado.'])->withInput();
        }

        // 1. Sales Order reference (Permitido guardar aunque exceda saldo para permitir Ajuste de Órdenes de Venta posterior)
        $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);

        // 2. Normalize casing for identifiers
        $toUpperFields = [
            'operator_name', 'tractor_plate', 'trailer_plate', 'unit_type', 
            'transport_company', 'consigned_to', 'destination', 
            'economic_number', 'carta_porte', 'unit_number', 'state', 'product', 'observations'
        ];
        foreach ($toUpperFields as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strtoupper(trim($validated[$field]));
            }
        }

        // 3. Validation: Unique Carta Porte per Transport Line (Exclude cancelled orders)
        $exists = ShipmentOrder::where('transport_company', $validated['transport_company'])
            ->where('carta_porte', $validated['carta_porte'])
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'carta_porte' => 'La Carta Porte "' . $validated['carta_porte'] . '" ya está en uso activo para la línea "' . $validated['transport_company'] . '".'
            ])->withInput();
        }

        // Map frontend fields to DB columns
        $validated['shortage_balance'] = $request->input('balance');

        if ($validated['presentation'] === 'ENVASADO' && $request->has('sack_type')) {
            $sackType = $request->input('sack_type');
            $validated['sacks_count'] = $sackType . ' KG';
            
            // Append sack size to product name if not already there
            if ($sackType && !empty($validated['product'])) {
                $suffix = " - {$sackType} KG";
                if (strpos($validated['product'], $suffix) === false) {
                    $validated['product'] .= $suffix;
                }
            }
        }

        // Remove auxiliary fields not in DB
        unset($validated['sack_type']);
        unset($validated['balance']);

        if (!empty($validated['scale_operator_id'])) {
            $scaleOp = User::find($validated['scale_operator_id']);
            if ($scaleOp) {
                $validated['scale_name'] = $scaleOp->name;
            }
        } elseif (!empty($request->input('scale_name'))) {
            $validated['scale_name'] = $request->input('scale_name');
        }

        if (!empty($validated['destination_id'])) {
            $dest = ShipmentDestination::find($validated['destination_id']);
            if ($dest) {
                $validated['destination'] = $dest->name;
            }
        } elseif (!empty($validated['destination'])) {
            $this->ensureDestinationsExist($validated['destination']);
            $destination = ShipmentDestination::where('name', strtoupper(trim($validated['destination'])))->first();
            if ($destination) {
                $validated['destination_id'] = $destination->id;
            }
        }

        if ($validated['presentation'] === 'ENVASADO') {
            $exitOp = !empty($validated['operator_name']) ? \App\Models\ExitOperator::where('name', $validated['operator_name'])->first() : null;
            $assignment = $exitOp && !empty($validated['sales_order_id']) 
                ? \App\Models\ClientOperatorAssignment::where('operator_id', $exitOp->id)->where('sales_order_id', $validated['sales_order_id'])->first() 
                : null;
            $sackType = $assignment?->type ?: ($exitOp?->type ?: ($assignment?->sack ?: ($exitOp?->sack ?: null)));
            if ($sackType && !str_contains(strtoupper($validated['observations'] ?? ''), strtoupper($sackType))) {
                $typeText = "TIPO DE SACO: " . strtoupper($sackType);
                $validated['observations'] = !empty($validated['observations']) 
                    ? trim($validated['observations']) . " " . $typeText 
                    : $typeText;
            }
        }

        $order = ShipmentOrder::create($validated + ['status' => 'created']);

        // Sync Sales Order for pre-calculated totals (especially for ENVASADO)
        $salesOrder->syncLoadedQuantity();

        // Vincular OE con asignación activa del operador
        $exitOp = !empty($validated['operator_name'])
            ? \App\Models\ExitOperator::where('name', $validated['operator_name'])->first()
            : null;

        $firstAssignment = null;
        if ($exitOp) {
            if ($request->filled('assignment_id') && is_numeric($request->input('assignment_id'))) {
                $firstAssignment = ClientOperatorAssignment::where('id', (int) $request->input('assignment_id'))
                    ->where('operator_id', $exitOp->id)
                    ->first();
            }

            if (!$firstAssignment) {
                $firstAssignment = ClientOperatorAssignment::where('operator_id', $exitOp->id)
                    ->where('sales_order_id', $validated['sales_order_id'])
                    ->where(function ($q) {
                        $q->whereNull('destare_status')
                          ->orWhere('destare_status', 'pending');
                    })
                    ->whereNull('shipment_order_id')
                    ->orderBy('part_number', 'asc')
                    ->orderBy('id', 'asc')
                    ->first();
            }

            if ($firstAssignment) {
                $firstAssignment->update(['shipment_order_id' => $order->id]);
            }

            // Si es unidad FULL y aún tiene la 2da parte pendiente sin documentar, pasar automáticamente a la 2da parte en el formulario
            $isFullUnit = str_contains(strtoupper($exitOp->unit_type ?? $validated['unit_type'] ?? ''), 'FULL');

            if ($isFullUnit) {
                $secondAssignment = ClientOperatorAssignment::where('operator_id', $exitOp->id)
                    ->when($firstAssignment, fn($q) => $q->where('id', '!=', $firstAssignment->id))
                    ->where(function ($q) {
                        $q->whereNull('destare_status')
                          ->orWhere('destare_status', 'pending');
                    })
                    ->where(function ($q) {
                        $q->whereNull('shipment_order_id')
                          ->orWhereNotIn('shipment_order_id', function ($sub) {
                              $sub->select('id')
                                  ->from('shipment_orders')
                                  ->whereIn('status', ['created', 'authorized', 'weighing_in', 'loading']);
                          });
                    })
                    ->orderBy('part_number', 'asc')
                    ->orderBy('id', 'asc')
                    ->first();

                $activeOrdersCount = ShipmentOrder::where('operator_name', $validated['operator_name'])
                    ->whereIn('status', ['created', 'authorized', 'weighing_in', 'loading'])
                    ->count();

                if ($secondAssignment && $activeOrdersCount < 2) {
                    return redirect()->route('documentation.create', [
                        'auto_operator_id' => $exitOp->id,
                        'first_order_id' => $order->id,
                    ])->with('success', '1ra Parte guardada (' . $order->folio . '). Se ha seleccionado automáticamente la 2da Parte.');
                }
            }
        }

        // Si viene de guardar la 2da parte teniendo una 1ra parte recién creada, imprimir ambas OEs
        if ($request->filled('first_order_id')) {
            $firstOrder = ShipmentOrder::find($request->input('first_order_id'));
            if ($firstOrder && $firstOrder->id !== $order->id) {
                return redirect()->route('documentation.orders.print', [
                    'id' => $firstOrder->id,
                    'second_order_id' => $order->id,
                ])->with('success', 'Las 2 Órdenes de Embarque (1ra y 2da Parte) fueron creadas correctamente.');
            }
        }

        return redirect()->route('documentation.orders.print', $order->id)->with('success', 'Orden de Embarque creada correctamente.');
    }

    // --- Moved Functionality from APT ---

    // QR Printing
    public function qrPrint(Request $request)
    {
        $operator = null;
        if ($request->has('qr')) {
            $qr = $request->input('qr');
            // Assuming format "OP <id>"
            if (str_starts_with($qr, 'OP ')) {
                $id = (int) substr($qr, 3);
                $operator = VesselOperator::with('vessel')->find($id);
            }
        }

        $logoPath = public_path('logo_pro_agro.png');
        if (!file_exists($logoPath)) {
            $logoPath = public_path('images/logo_proagro.png');
        }
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        return Inertia::render('Documentation/QrPrint', [
            'operator' => $operator,
            'logo' => $logoBase64,
        ]);
    }

    // Dock Submenu
    public function dock()
    {
        return Inertia::render('Documentation/Dock');
    }

    // Operator Registration (Alta Operador)
    public function createOperator()
    {
        // Strict filter: Only active vessels
        $vessels = Vessel::with('product')
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Documentation/RegisterOperator', [
            'vessels' => $vessels
        ]);
    }

    public function storeOperator(Request $request)
    {
        // ... Logic from AptController::storeOperator ...
        $validated = $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'operator_name' => 'required|string|max:255',
            'unit_type' => 'required|string',
            'economic_number' => 'required|string',
            'tractor_plate' => 'required|string',
            'trailer_plate' => 'nullable|required_unless:unit_type,VOLTEO,TORTON,CAMIONETA|string',
            'transporter_line' => 'required|string',
            'brand_model' => 'nullable|string',
        ]);

        // Normalize casing
        $toUpperFields = ['operator_name', 'unit_type', 'economic_number', 'tractor_plate', 'trailer_plate', 'transporter_line', 'brand_model'];
        foreach ($toUpperFields as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strtoupper(trim($validated[$field]));
            }
        }

        $query = VesselOperator::where('vessel_id', $validated['vessel_id'])
            ->where('operator_name', $validated['operator_name'])
            ->where('economic_number', $validated['economic_number'])
            ->where('tractor_plate', $validated['tractor_plate'])
            ->where('unit_type', $validated['unit_type'])
            ->where('transporter_line', $validated['transporter_line']);

        if (!empty($validated['trailer_plate'])) {
            $query->where('trailer_plate', $validated['trailer_plate']);
        }

        if (!empty($validated['brand_model'])) {
            $query->where('brand_model', $validated['brand_model']);
        }

        $exists = $query->exists();

        if ($exists) {
            return back()->withErrors(['operator_name' => 'Este operador ya está registrado con exactamente los mismos datos (Unidad, Placas, Línea).']);
        }

        VesselOperator::create($validated);

        return back()->with('success', 'Operador registrado correctamente.');
    }

    // Search Operators (used by Form)
    public function searchOperators(Request $request)
    {
        $query = $request->input('q');

        // El usuario se refiere a "Operadores de Salida" gestionados en ExitOperatorController
        $operators = \App\Models\ExitOperator::where(function ($q) use ($query) {
            $q->where('name', 'like', "%{$query}%")
                ->orWhere('id', $query);
        })
            ->active()
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(function ($op) {
                $lastLog = AccessLog::where('subject_id', $op->id)
                    ->where(function ($q) {
                        $q->where('subject_type', \App\Models\ExitOperator::class)
                            ->orWhere('subject_type', 'App\Models\ExitOperator');
                    })
                    ->latest('created_at')
                    ->first();

                $isAuthorizedInPlant = $lastLog && $lastLog->status === 'in_plant' && is_null($lastLog->exit_at);
                $surveillanceStatus = 'none';
                if ($lastLog) {
                    if ($lastLog->status === 'in_plant' && is_null($lastLog->exit_at)) {
                        $surveillanceStatus = 'in_plant';
                    } elseif ($lastLog->status === 'pending') {
                        $surveillanceStatus = 'pending';
                    } elseif ($lastLog->status === 'rejected') {
                        $surveillanceStatus = 'rejected';
                    } elseif ($lastLog->status === 'completed' || !is_null($lastLog->exit_at)) {
                        $surveillanceStatus = 'completed';
                    }
                }

                // Obtener asignaciones activas (pendientes de destarar) de Orden de Venta para este operador
                $this->ensureAssignmentColumns();

                $pendingAssignments = ClientOperatorAssignment::where('operator_id', $op->id)
                    ->where(function ($q) {
                        $q->whereNull('destare_status')
                          ->orWhere('destare_status', 'pending');
                    })
                    ->with(['salesOrder.client', 'salesOrder.product', 'salesOrder.vessel'])
                    ->orderBy('part_number', 'asc')
                    ->orderBy('id', 'asc')
                    ->get();

                $assignments = $pendingAssignments->isNotEmpty()
                    ? $pendingAssignments
                    : ClientOperatorAssignment::where('operator_id', $op->id)
                        ->with(['salesOrder.client', 'salesOrder.product', 'salesOrder.vessel'])
                        ->orderBy('updated_at', 'desc')
                        ->get();

                $isFullUnit = str_contains(strtoupper($op->unit_type ?? ''), 'FULL');
                $trailerParts = array_values(array_filter(array_map('trim', explode('/', $op->trailer_plate ?? ''))));

                // Obtener OEs activas en planta para este operador y detectar qué parte ya fue documentada
                $activeOrders = ShipmentOrder::where('operator_name', $op->name)
                    ->whereIn('status', ['created', 'authorized', 'weighing_in', 'loading'])
                    ->orderBy('created_at', 'asc')
                    ->get();

                $usedOrderIds = [];
                $mappedAssignments = $assignments->values()->map(function ($a, $idx) use ($isFullUnit, $trailerParts, $op, $activeOrders, &$usedOrderIds) {
                    $partNum = $a->part_number ? (int) $a->part_number : ($idx + 1);
                    $partTrailer = ($isFullUnit && count($trailerParts) > 1 && isset($trailerParts[$partNum - 1]))
                        ? $trailerParts[$partNum - 1]
                        : $op->trailer_plate;

                    $matchedOe = null;
                    if (!empty($a->shipment_order_id)) {
                        $matchedOe = $activeOrders->firstWhere('id', $a->shipment_order_id);
                    }
                    if (!$matchedOe && $activeOrders->isNotEmpty()) {
                        // Intentar emparejar por placa de remolque de la parte o por OV
                        $matchedOe = $activeOrders
                            ->whereNotIn('id', $usedOrderIds)
                            ->first(function ($oe) use ($partTrailer, $a) {
                                return (
                                    !empty($partTrailer) &&
                                    strtoupper(trim($oe->trailer_plate ?? '')) === strtoupper(trim($partTrailer))
                                ) || (string) $oe->sales_order_id === (string) $a->sales_order_id;
                            });
                        if ($matchedOe) {
                            $a->update(['shipment_order_id' => $matchedOe->id]);
                        }
                    }
                    if ($matchedOe) {
                        $usedOrderIds[] = $matchedOe->id;
                    }

                    return [
                        'id' => $a->id,
                        'part_number' => $partNum,
                        'trailer_plate' => $partTrailer,
                        'sales_order_id' => $a->sales_order_id,
                        'presentation' => $a->presentation,
                        'tm' => $a->tm,
                        'sack' => $a->sack,
                        'type' => $a->type,
                        'folio' => $a->salesOrder?->folio,
                        'balance' => $a->salesOrder?->balance,
                        'client_id' => $a->salesOrder?->client_id,
                        'client_name' => $a->salesOrder?->client?->business_name,
                        'product_name' => $a->salesOrder?->product?->name,
                        'is_documented' => (bool) $matchedOe,
                        'documented_folio' => $matchedOe?->folio,
                    ];
                })->values();

                // Seleccionar por defecto la primera asignación NO documentada (ej. si la 1ra Parte ya tiene OE, selecciona la 2da Parte)
                $defaultMapped = $mappedAssignments->firstWhere('is_documented', false) ?? $mappedAssignments->first();
                $latestAssignment = $defaultMapped
                    ? $assignments->firstWhere('id', $defaultMapped['id'])
                    : $assignments->first();

                $salesOrderId = $latestAssignment?->sales_order_id ?? $op->sales_order_id;
                $salesOrder = $latestAssignment?->salesOrder;
                if (!$salesOrder && $salesOrderId) {
                    $salesOrder = SalesOrder::with(['client', 'product', 'vessel'])->find($salesOrderId);
                }

                $presentation = $latestAssignment?->presentation ?? $op->presentation ?? 'GRANEL';
                $tm = $latestAssignment?->tm ?? $op->tm ?? '';
                $sack = $latestAssignment?->sack ?? $op->sack ?? '';
                $type = $latestAssignment?->type ?? $op->type ?? '';
                $defaultTrailerPlate = $defaultMapped['trailer_plate'] ?? $op->trailer_plate;

                return [
                    'id' => $op->id,
                    'operator_name' => $op->name,
                    'transporter_line' => $op->transport_line,
                    'unit_type' => $op->unit_type,
                    'tractor_plate' => $op->tractor_plate,
                    'trailer_plate' => $defaultTrailerPlate,
                    'full_trailer_plate' => $op->trailer_plate,
                    'default_assignment_id' => $latestAssignment?->id,
                    'economic_number' => $op->economic_number,
                    'license' => $op->license,
                    'brand_model' => $op->brand_model,
                    'is_authorized_in_plant' => $isAuthorizedInPlant,
                    'surveillance_status' => $surveillanceStatus,
                    'surveillance_notes' => $lastLog ? $lastLog->notes : null,
                    'access_denied' => $surveillanceStatus === 'rejected',
                    'sales_order_id' => $salesOrderId,
                    'presentation' => $presentation,
                    'programmed_tons' => $tm !== '' ? (string) $tm : '',
                    'sack' => $sack,
                    'type' => $type,
                    'sales_order' => $salesOrder ? [
                        'id' => $salesOrder->id,
                        'folio' => $salesOrder->folio,
                        'balance' => $salesOrder->balance,
                        'client_id' => $salesOrder->client_id,
                        'client_name' => $salesOrder->client?->business_name,
                        'rfc' => $salesOrder->client?->rfc,
                        'address' => $salesOrder->client?->address,
                        'product_name' => $salesOrder->product?->name,
                        'vessel_name' => $salesOrder->vessel?->name,
                    ] : null,
                    'assignments' => $mappedAssignments->all(),
                ];
            });

        // Fallback to VesselOperator if not found in ExitOperator
        if ($operators->isEmpty()) {
            $operators = \App\Models\VesselOperator::where(function ($q) use ($query) {
                $q->where('operator_name', 'like', "%{$query}%")
                    ->orWhere('id', $query);
            })
                ->orderBy('operator_name')
                ->limit(20)
                ->get()
                ->map(function ($op) {
                    $lastLog = AccessLog::where('subject_id', $op->id)
                        ->where(function ($q) {
                            $q->where('subject_type', \App\Models\VesselOperator::class)
                                ->orWhere('subject_type', 'App\Models\VesselOperator');
                        })
                        ->latest('created_at')
                        ->first();

                    $isAuthorizedInPlant = $lastLog && $lastLog->status === 'in_plant' && is_null($lastLog->exit_at);
                    $surveillanceStatus = 'none';
                    if ($lastLog) {
                        if ($lastLog->status === 'in_plant' && is_null($lastLog->exit_at)) {
                            $surveillanceStatus = 'in_plant';
                        } elseif ($lastLog->status === 'pending') {
                            $surveillanceStatus = 'pending';
                        } elseif ($lastLog->status === 'rejected') {
                            $surveillanceStatus = 'rejected';
                        } elseif ($lastLog->status === 'completed' || !is_null($lastLog->exit_at)) {
                            $surveillanceStatus = 'completed';
                        }
                    }

                    return [
                        'id' => $op->id,
                        'operator_name' => $op->operator_name,
                        'transporter_line' => $op->transporter_line,
                        'unit_type' => $op->unit_type,
                        'tractor_plate' => $op->tractor_plate,
                        'trailer_plate' => $op->trailer_plate,
                        'economic_number' => $op->economic_number,
                        'license' => $op->license,
                        'brand_model' => $op->brand_model,
                        'is_authorized_in_plant' => $isAuthorizedInPlant,
                        'surveillance_status' => $surveillanceStatus,
                        'surveillance_notes' => $lastLog ? $lastLog->notes : null,
                        'access_denied' => $surveillanceStatus === 'rejected',
                    ];
                });
        }

        return response()->json($operators);
    }

    // --- New Methods for Operators List ---

    public function operatorsIndex(Request $request)
    {
        $query = VesselOperator::query()->with('vessel');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('operator_name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('transporter_line', 'like', "%{$search}%")
                    ->orWhere('economic_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('vessel_id')) {
            $query->where('vessel_id', $request->input('vessel_id'));
        }

        $status = $request->input('status', 'active');
        if ($status === 'active') {
            $query->whereHas('vessel', function ($q) {
                $q->active();
            });
        } elseif ($status === 'archived') {
            $query->whereHas('vessel', function ($q) {
                $q->inactive();
            });
        }

        $operators = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        // Append is_active to each operator
        $operators->getCollection()->transform(function ($operator) {
            $operator->is_active = $operator->vessel ? $operator->vessel->is_active : false;
            return $operator;
        });

        return Inertia::render('Documentation/Operators/Index', [
            'operators' => $operators,
            'vessels' => Vessel::orderBy('created_at', 'desc')->get(),
            'filters' => $request->only(['search', 'vessel_id', 'status']),
        ]);
    }

    public function editOperator($id)
    {
        $operator = VesselOperator::with('vessel')->findOrFail($id);

        $vessels = Vessel::with('product')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Documentation/Operators/Edit', [
            'operator' => $operator,
            'vessels' => $vessels
        ]);
    }

    public function updateOperator(Request $request, $id)
    {
        $operator = VesselOperator::with('vessel')->findOrFail($id);

        if ($operator->vessel && !$operator->vessel->is_active) {
            return back()->withErrors(['error' => 'No se puede editar un operador de un barco que ya ha zarpado (Archivado).']);
        }

        $validated = $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'operator_name' => 'required|string|max:255',
            'unit_type' => 'required|string',
            'economic_number' => 'required|string',
            'tractor_plate' => 'required|string',
            'trailer_plate' => 'nullable|required_unless:unit_type,VOLTEO,TORTON,CAMIONETA|string',
            'transporter_line' => 'required|string',
            'brand_model' => 'nullable|string',
        ]);

        // Normalize casing
        $toUpperFields = ['operator_name', 'unit_type', 'economic_number', 'tractor_plate', 'trailer_plate', 'transporter_line', 'brand_model'];
        foreach ($toUpperFields as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strtoupper(trim($validated[$field]));
            }
        }

        $operator->update($validated);

        return redirect()->route('documentation.operators.index')->with('success', 'Operador actualizado correctamente.');
    }

    public function destroyOperator($id)
    {
        $operator = VesselOperator::findOrFail($id);
        $operator->delete();

        return redirect()->route('documentation.operators.index')->with('success', 'Operador eliminado correctamente.');
    }

    /**
     * Display a report of shipment orders (OB).
     */
    public function shipmentOrdersIndex(Request $request)
    {
        $query = ShipmentOrder::query()
            ->with(['client', 'vessel', 'sales_order', 'product', 'driver', 'origin', 'weight_ticket', 'loadingOrders.weight_ticket'])
            ->whereIn('operation_type', ['scale', 'burreo']);

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('origin', 'like', "%{$search}%") // Legacy string search
                    ->orWhere('destination', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhereHas('origin', function ($q2) use ($search) {
                        $q2->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('client', function ($q2) use ($search) {
                        $q2->where('business_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('sales_order', function ($q2) use ($search) {
                        $q2->where('folio', 'like', "%{$search}%")
                            ->orWhere('sale_order', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Status: 'active' (default) vs 'cancelled'
        $statusFilter = $request->input('status', 'active'); // active | cancelled

        if (!$request->has('status')) {
            $request->query->set('status', 'active');
        }

        if ($statusFilter === 'cancelled') {
            $query->where('status', 'cancelled');
        } else {
            // Active: created, loading, closed, completed
            $query->whereIn('status', ['created', 'loading', 'closed', 'completed']);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Documentation/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $statusFilter,
                'search' => $request->input('search', ''),
            ],
            'sales_orders' => SalesOrder::where('status', 'created')->orWhere('status', 'open')->get(),
            'default_folio' => 'PA' . date('Y') . '-' . str_pad(ShipmentOrder::count() + 1, 4, '0', STR_PAD_LEFT),
        ]);
    }

    /**
     * Export Standard Shipment Orders (Not SADER)
     */
    public function exportStandard(Request $request)
    {
        $filters = $request->all();
        $filters['is_sader'] = false;
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ShipmentOrdersExport($filters),
            'OE_General_' . date('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Export SADER Shipment Orders
     */
    public function exportSader(Request $request)
    {
        $filters = $request->all();
        $filters['is_sader'] = true;
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ShipmentOrdersExport($filters),
            'OE_SADER_' . date('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Format Shipment Order with all print relationships and calculated fields.
     */
    public function formatOrderForPrint(ShipmentOrder $order): array
    {
        $order->loadMissing(['client', 'sales_order.client', 'product', 'vessel', 'transporter', 'driver', 'vehicle', 'origin', 'scale_operator', 'shipment_destination', 'items.product', 'lot']);

        // Fallback for scale_name if scale_operator exists
        if (empty($order->scale_name) && $order->scale_operator) {
            $order->scale_name = $order->scale_operator->name;
        }

        // Fallback for destination if empty but shipment_destination exists
        if (empty($order->destination) && $order->shipment_destination) {
            $order->destination = $order->shipment_destination->name;
        }

        // Patch: If plates are missing, try to find them from the Operator registry (ExitOperator)
        if (empty($order->tractor_plate) || empty($order->trailer_plate) || $order->tractor_plate === 'N/A') {
            $operator = \App\Models\ExitOperator::where('name', $order->operator_name)->first();

            if ($operator) {
                if (empty($order->tractor_plate) || $order->tractor_plate === 'N/A') {
                    $order->tractor_plate = $operator->tractor_plate;
                }
                if (empty($order->trailer_plate) || $order->trailer_plate === 'N/A') {
                    $order->trailer_plate = $operator->trailer_plate;
                }
                if (empty($order->unit_type)) {
                    $order->unit_type = $operator->unit_type;
                }
                if (empty($order->license_number)) {
                    $order->license_number = $operator->license;
                }
                if (empty($order->economic_number)) {
                    $order->economic_number = $operator->economic_number;
                }
            }
        }

        // Lookup Product Code if relation is missing
        $productCode = 'N/A';
        $productText = $order->getAttributes()['product'] ?? '';

        if (is_object($order->product) && $order->product instanceof \App\Models\Product) {
            $productCode = $order->product->code;
            $productText = $order->product->name;
        } elseif ($productText) {
            $cleanProductText = trim(preg_replace('/-\s*\d+\s*KG/i', '', $productText));
            $p = \App\Models\Product::where('name', $productText)
                ->orWhere('name', $cleanProductText)
                ->first();
            
            if ($p) {
                $productCode = $p->code;
                $productText = $p->name;
            } else {
                $productText = $cleanProductText;
            }
        }

        // UI Requirement: If ENVASADO, ensure the product description doesn't have the weight suffix
        if ($order->presentation === 'ENVASADO') {
            $productText = trim(preg_replace('/-\s*\d+\s*KG/i', '', $productText));

            // Reflejar el tipo de saco seleccionado en observaciones si no está presente
            $exitOp = !empty($order->operator_name) ? \App\Models\ExitOperator::where('name', $order->operator_name)->first() : null;
            $assignment = $exitOp && $order->sales_order_id 
                ? \App\Models\ClientOperatorAssignment::where('operator_id', $exitOp->id)->where('sales_order_id', $order->sales_order_id)->first() 
                : null;
            $sackType = $assignment?->type ?: ($exitOp?->type ?: ($assignment?->sack ?: ($exitOp?->sack ?: null)));
            if ($sackType && !str_contains(strtoupper($order->observations ?? ''), strtoupper($sackType))) {
                $typeText = "TIPO DE SACO: " . strtoupper($sackType);
                $order->observations = !empty($order->observations) 
                    ? trim($order->observations) . " " . $typeText 
                    : $typeText;
            }
        }

        $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        $stowagePlan = $order->stowage_plan ?? $history?->stowage_plan;
        $stowagePlanStatus = $order->stowage_plan_status ?? $history?->stowage_plan_status ?? 'pending';
        $samples = !empty($history?->samples) ? $history->samples : ($order->samples ?? []);
        if (!is_array($samples)) {
            $samples = is_string($samples) ? (json_decode($samples, true) ?: []) : [];
        }
        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
        $targetSamples = $targetPerEnsacadora * 2;
        $breakdown = $this->computeEnsacadoraSamplingBreakdown($samples, $targetPerEnsacadora);
        $samplingStatus = $history?->sampling_status ?? ($order->sampling_status ?? ($breakdown['both_completed'] ? 'completed' : (count($samples) > 0 ? 'in_progress' : 'pending')));
        $samplingAvg = $history?->sampling_avg ?? ($order->sampling_avg ?? null);
        $samplingCompletedAt = $history?->sampling_completed_at ?? ($order->sampling_completed_at ?? null);

        return array_merge($order->toArray(), [
            'product_code' => $productCode,
            'product_text' => $productText,
            'destination' => $order->destination ?: ($order->shipment_destination?->name ?: null),
            'scale_name' => $order->scale_name ?? $order->scale_operator?->name ?? null,
            'client_name' => $order->client?->business_name ?? $order->client?->name ?? 'N/A',
            'operator_name' => $order->operator_name ?? 'N/A',
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => $stowagePlanStatus,
            'stowage_plan_saved_at' => ($order->stowage_plan_saved_at ?? $history?->stowage_plan_saved_at) ? \Carbon\Carbon::parse($order->stowage_plan_saved_at ?? $history?->stowage_plan_saved_at)->toIso8601String() : null,
            'stowage_plan_saved_by' => $order->stowage_plan_saved_by ?? $history?->stowage_plan_saved_by,
            'samples' => $samples,
            'target_samples_per_ensacadora' => $targetPerEnsacadora,
            'target_samples_count' => $targetSamples,
            'ensacadora_1_summary' => $breakdown['ensacadora_1'],
            'ensacadora_2_summary' => $breakdown['ensacadora_2'],
            'sampling_status' => $samplingStatus,
            'sampling_avg' => $samplingAvg,
            'sampling_completed_at' => $samplingCompletedAt ? \Carbon\Carbon::parse($samplingCompletedAt)->toIso8601String() : null,
        ]);
    }

    /**
     * Print the Shipment Order (Orden de Embarque) in legacy format.
     */
    public function printOrder($id)
    {
        $order = ShipmentOrder::findOrFail($id);
        $secondOrder = null;
        if (request()->filled('second_order_id')) {
            $secondOrder = ShipmentOrder::find(request('second_order_id'));
        }

        return Inertia::render('Documentation/Orders/Print', [
            'order' => $this->formatOrderForPrint($order),
            'secondOrder' => $secondOrder ? $this->formatOrderForPrint($secondOrder) : null,
        ]);
    }

    /**
     * Return JSON data of shipment order formatted for printing templates.
     */
    public function orderPrintData(string $id)
    {
        $order = ShipmentOrder::findOrFail($id);

        return response()->json([
            'order' => $this->formatOrderForPrint($order),
        ]);
    }

    /**
     * Print the Shipment Order (Instrucción de Carga - GLS-AP-FO-001).
     */
    public function printInstruction($id)
    {
        $order = ShipmentOrder::with(['client', 'sales_order.client', 'product', 'vessel', 'transporter', 'driver', 'vehicle', 'origin', 'scale_operator', 'shipment_destination'])
            ->findOrFail($id);

        if (empty($order->scale_name) && $order->scale_operator) {
            $order->scale_name = $order->scale_operator->name;
        }

        if (empty($order->destination) && $order->shipment_destination) {
            $order->destination = $order->shipment_destination->name;
        }

        // Patch: If plates are missing, try to find them from the Operator registry (ExitOperator)
        if (empty($order->tractor_plate) || empty($order->trailer_plate) || $order->tractor_plate === 'N/A') {
            $operator = \App\Models\ExitOperator::where('name', $order->operator_name)->first();

            if ($operator) {
                if (empty($order->tractor_plate) || $order->tractor_plate === 'N/A') {
                    $order->tractor_plate = $operator->tractor_plate;
                }
                if (empty($order->trailer_plate) || $order->trailer_plate === 'N/A') {
                    $order->trailer_plate = $operator->trailer_plate;
                }
                // Optional: Unit Type
                if (empty($order->unit_type)) {
                    $order->unit_type = $operator->unit_type;
                }
                // Optional: License
                if (empty($order->license_number)) {
                    $order->license_number = $operator->license;
                }
                // Optional: Economic
                if (empty($order->economic_number)) {
                    $order->economic_number = $operator->economic_number;
                }
            }
        }

        // Lookup Product Code if relation is missing
        $productCode = 'N/A';
        $productText = $order->getAttributes()['product'] ?? '';

        if (is_object($order->product) && $order->product instanceof \App\Models\Product) {
            $productCode = $order->product->code;
            $productText = $order->product->name;
        } elseif ($productText) {
            // Regex to strip "- XX KG"
            $cleanProductText = trim(preg_replace('/-\s*\d+\s*KG/i', '', $productText));
            $p = \App\Models\Product::where('name', $productText)
                ->orWhere('name', $cleanProductText)
                ->first();
            
            if ($p) {
                $productCode = $p->code;
                $productText = $p->name;
            } else {
                $productText = $cleanProductText;
            }
        }

        // UI Requirement: If ENVASADO, ensure the product description doesn't have the weight suffix
        if ($order->presentation === 'ENVASADO') {
            $productText = trim(preg_replace('/-\s*\d+\s*KG/i', '', $productText));

            // Reflejar el tipo de saco seleccionado en observaciones si no está presente
            $exitOp = !empty($order->operator_name) ? \App\Models\ExitOperator::where('name', $order->operator_name)->first() : null;
            $assignment = $exitOp && $order->sales_order_id 
                ? \App\Models\ClientOperatorAssignment::where('operator_id', $exitOp->id)->where('sales_order_id', $order->sales_order_id)->first() 
                : null;
            $sackType = $assignment?->type ?: ($exitOp?->type ?: ($assignment?->sack ?: ($exitOp?->sack ?: null)));
            if ($sackType && !str_contains(strtoupper($order->observations ?? ''), strtoupper($sackType))) {
                $typeText = "TIPO DE SACO: " . strtoupper($sackType);
                $order->observations = !empty($order->observations) 
                    ? trim($order->observations) . " " . $typeText 
                    : $typeText;
            }
        }

        return Inertia::render('Documentation/Orders/PrintInstruction', [
            'order' => $order->toArray() + [
                'product_code' => $productCode,
                'product_text' => $productText,
            ]
        ]);

    }

    /**
     * Show the form for editing the specified Shipment Order.
     */
    public function editOrder(Request $request, $id)
    {
        $order = ShipmentOrder::with(['client', 'sales_order.client', 'product'])->findOrFail($id);

        // Prevent editing if closed/completed? Usually allowed but with caution.
        // For now, allow edit unless cancelled maybe.
        if ($order->status === 'cancelled') {
            return redirect()->route('documentation.orders.index')->withErrors(['error' => 'No se puede editar una orden cancelada.']);
        }

        return Inertia::render('Documentation/Orders/Edit', [
            'order' => $order->toArray() + [
                'product_text' => $order->getAttributes()['product'] ?? null,
                'sacks_count_raw' => $order->getAttributes()['sacks_count'] ?? null,
            ],
            'queryParams' => $request->only(['search', 'status', 'page']),
            'clients' => Client::orderBy('business_name')->get()->map(function ($client) {
                return [
                    'id' => $client->id,
                    'business_name' => $client->business_name,
                    'rfc' => $client->rfc ?? '',
                    'address' => $client->address ?? '',
                ];
            }),
            'products' => Product::all(),
            'sales_orders' => SalesOrder::whereIn('status', ['created', 'open'])
                ->orWhere('id', $order->sales_order_id)
                ->with(['client', 'product'])
                ->get(),
            'origins' => ShipmentOrigin::orderBy('name')->get(['id', 'name']),
            'destinations' => ShipmentDestination::orderBy('name')->get(['id', 'name']),
            'scale_operators' => User::role('Bascula')->where('is_blocked', false)->get()->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                ];
            }),
        ]);
    }

    /**
     * Update the specified Shipment Order in storage.
     */
    public function updateOrder(Request $request, $id)
    {
        $order = ShipmentOrder::findOrFail($id);

        $validated = $request->validate([
            'folio' => 'required|unique:shipment_orders,folio,' . $id,
            'date' => 'required|date',
            'client_id' => 'required|exists:clients,id',
            'sales_order_id' => 'required|exists:sales_orders,id',
            'consigned_to' => 'required|string',
            // Transport
            'transport_company' => 'required|string',
            'operator_name' => 'required|string',
            'unit_number' => 'required|string',
            'tractor_plate' => 'required|string',
            'trailer_plate' => 'required|string',
            'carta_porte' => 'required|string',
            'license_number' => 'required|string',
            'unit_type' => 'required|string',
            'economic_number' => 'required|string',
            // Shipment
            'destination_id' => 'nullable|exists:shipment_destinations,id',
            'destination' => 'nullable|string',
            'product' => 'required|string',
            'presentation' => 'required|string',
            'sack_type' => 'nullable|string',
            'sacks_count' => 'nullable|string',
            'programmed_tons' => 'required|numeric|gt:0',
            'origin_id' => 'required',
            'balance' => 'nullable',
            'shortage_balance' => 'nullable|string',
            'observations' => 'nullable|string',
            'state' => 'required|string',
            // Allow Operator/Unit IDs to be updated if re-selected
            'operator_id' => 'nullable',
            'scale_operator_id' => 'nullable|exists:users,id',
        ]);

        if (empty($validated['destination_id']) && empty($validated['destination'])) {
            return back()->withErrors(['destination_id' => 'El destino es obligatorio.'])->withInput();
        }
        if ($validated['presentation'] === 'ENVASADO' && empty($request->input('sack_type')) && empty($validated['sacks_count'])) {
            return back()->withErrors(['sack_type' => 'El tamaño de saco es obligatorio para producto envasado.'])->withInput();
        }

        // Validate Balance again if programmed tons changed (Permitido para permitir documentar la OE y luego aplicar Ajuste)
        // if ($validated['sales_order_id'] != $order->sales_order_id || $validated['programmed_tons'] != $order->programmed_tons) {
        //     $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);
        //     $currentAvailable = $salesOrder->balance + ($order->sales_order_id == $salesOrder->id ? $order->programmed_tons : 0);
        //     if ($validated['programmed_tons'] > $currentAvailable) {
        //         return back()->withErrors([
        //             'programmed_tons' => 'El tonelaje programado excede el saldo disponible de la OV.'
        //         ])->withInput();
        //     }
        // }

        // Normalize casing for identifiers
        $toUpperFields = [
            'operator_name', 'tractor_plate', 'trailer_plate', 'unit_type', 
            'transport_company', 'consigned_to', 'destination', 
            'economic_number', 'carta_porte', 'unit_number', 'state', 'product', 'observations'
        ];
        foreach ($toUpperFields as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strtoupper(trim($validated[$field]));
            }
        }

        // Duplicate Check for Carta Porte in Update
        $exists = ShipmentOrder::where('transport_company', $validated['transport_company'])
            ->where('carta_porte', $validated['carta_porte'])
            ->where('status', '!=', 'cancelled')
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'carta_porte' => 'La Carta Porte "' . $validated['carta_porte'] . '" ya está en uso activo para la línea "' . $validated['transport_company'] . '".'
            ])->withInput();
        }

        // Logic for Sacks and Product Description
        $validated['shortage_balance'] = $request->input('balance');
        if ($validated['presentation'] === 'ENVASADO') {
            $sackType = (string)$request->input('sack_type');
            
            // Clean existing suffix if present before adding updated one to avoid duplication
            if (!empty($validated['product'])) {
                $validated['product'] = preg_replace('/\s*-\s*\d+\s*KG\s*$/i', '', $validated['product']);
            }

            // Append sack size to product name for reports if not already there
            if ($sackType) {
                $validated['product'] .= " - {$sackType} KG";
            }

            if ($request->filled('sacks_count')) {
                // Use manual count for ANY size if provided (e.g. "35 SACOS")
                $validated['sacks_count'] = $request->input('sacks_count');
            } elseif ($sackType && $sackType !== "") {
                // Fallback to automatic format "X KG" if no manual count provided
                $validated['sacks_count'] = $sackType . ' KG';
            }
        }
        unset($validated['sack_type']);
        unset($validated['balance']);
        if (!empty($validated['scale_operator_id'])) {
            $operator = User::find($validated['scale_operator_id']);
            if ($operator) {
                $validated['scale_name'] = $operator->name;
            }
        } elseif (!empty($request->input('scale_name'))) {
            $validated['scale_name'] = $request->input('scale_name');
        }
        unset($validated['operator_id']); // Not a column in DB, used for UI search only

        if (!empty($validated['destination_id'])) {
            $dest = ShipmentDestination::find($validated['destination_id']);
            if ($dest) {
                $validated['destination'] = $dest->name;
            }
        } elseif (!empty($validated['destination'])) {
            $this->ensureDestinationsExist($validated['destination']);
            $destination = ShipmentDestination::where('name', strtoupper(trim($validated['destination'])))->first();
            if ($destination) {
                $validated['destination_id'] = $destination->id;
            }
        }

        if ($validated['presentation'] === 'ENVASADO') {
            $exitOp = !empty($validated['operator_name']) ? \App\Models\ExitOperator::where('name', $validated['operator_name'])->first() : null;
            $assignment = $exitOp && !empty($validated['sales_order_id']) 
                ? \App\Models\ClientOperatorAssignment::where('operator_id', $exitOp->id)->where('sales_order_id', $validated['sales_order_id'])->first() 
                : null;
            $sackType = $assignment?->type ?: ($exitOp?->type ?: ($assignment?->sack ?: ($exitOp?->sack ?: null)));
            if ($sackType && !str_contains(strtoupper($validated['observations'] ?? ''), strtoupper($sackType))) {
                $typeText = "TIPO DE SACO: " . strtoupper($sackType);
                $validated['observations'] = !empty($validated['observations']) 
                    ? trim($validated['observations']) . " " . $typeText 
                    : $typeText;
            }
        }

        $order->update($validated);

        // Sync Sales Order (especially if programmed_tons or sales_order_id changed)
        $order->sales_order?->syncLoadedQuantity();
        if ($validated['sales_order_id'] != $order->getOriginal('sales_order_id')) {
            // Also sync the old sales order if it was changed
            $oldSalesOrder = SalesOrder::find($order->getOriginal('sales_order_id'));
            $oldSalesOrder?->syncLoadedQuantity();
        }

        return redirect()->route('documentation.orders.print', $order->id)->with('success', 'Orden de Embarque actualizada correctamente.');
    }

    /**
     * Cancel the specified Shipment Order.
     */
    public function cancelOrder($id)
    {
        $order = ShipmentOrder::with(['weight_ticket', 'loadingOrders.weight_ticket'])->findOrFail($id);

        if ($order->status === 'cancelled') {
            return back()->with('error', 'La orden ya está cancelada.');
        }

        // --- VALIDATION: Check for active tickets ---
        // 1. Direct ticket
        if ($order->weight_ticket && $order->weight_ticket->weighing_status !== 'cancelled') {
            return back()->with('error', 'Fallo de Cancelación: Esta Orden tiene un TICKET ACTIVO en Báscula. Debe CANCELAR PRIMERO EL TICKET en el módulo de Báscula (Historial) antes de cancelar la OE.');
        }

        // 2. Continuous tickets (via loading orders)
        foreach ($order->loadingOrders as $lo) {
            if ($lo->weight_ticket && $lo->weight_ticket->weighing_status !== 'cancelled') {
                return back()->with('error', 'Fallo de Cancelación: Esta Orden tiene un TICKET ACTIVO (Orden de Carga) en Báscula. Debe CANCELAR PRIMERO EL TICKET en el módulo de Báscula (Historial) antes de cancelar la OE.');
            }
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now()
        ]);

        // Sync Sales Order
        $order->sales_order?->syncLoadedQuantity();

        return back()->with('success', 'Orden de Embarque cancelada correctamente.');
    }

    /**
     * Re-open the specified Shipment Order.
     */
    public function reopenOrder($id)
    {
        $order = ShipmentOrder::findOrFail($id);

        if ($order->status !== 'cancelled') {
            return back()->with('error', 'Solo las órdenes canceladas pueden ser re-abiertas.');
        }

        // 1. Rule: Cannot reopen after 24 hours
        if ($order->cancelled_at && $order->cancelled_at->diffInHours(now()) >= 24) {
            return back()->withErrors(['error' => 'No se puede re-abrir esta orden porque han pasado más de 24 horas desde su cancelación.']);
        }

        // 2. Rule: Validate Carta Porte isn't taken by a new order
        $duplicateExists = ShipmentOrder::where('transport_company', $order->transport_company)
            ->where('carta_porte', $order->carta_porte)
            ->where('status', '!=', 'cancelled')
            ->where('id', '!=', $order->id)
            ->exists();

        if ($duplicateExists) {
            return back()->withErrors(['error' => 'No se puede re-abrir esta orden porque su Carta Porte ya está siendo utilizada en otra orden activa.']);
        }

        // Validate Balance before reopening
        $salesOrder = SalesOrder::findOrFail($order->sales_order_id);
        $neededTons = (float) ($order->programmed_tons ?? 0);

        if ($salesOrder->balance < $neededTons) {
            return back()->withErrors(['error' => 'Saldo insuficiente en la Orden de Venta para re-abrir esta orden. Requerido: ' . $neededTons . ' Toneladas. Disponible: ' . $salesOrder->balance . ' TM']);
        }

        $order->update(['status' => 'created']);

        // Sync Sales Order
        $salesOrder->syncLoadedQuantity();

        return redirect()->route('documentation.orders.index')->with('success', 'Orden de Embarque re-abierta correctamente.');
    }

    public function checkCartaPorte(Request $request)
    {
        $cartaPorte = $request->input('carta_porte');
        $transportCompany = $request->input('transport_company');
        $excludeId = $request->input('exclude_id');

        if (!$cartaPorte || !$transportCompany) {
            return response()->json(['exists' => false]);
        }

        $query = ShipmentOrder::where('carta_porte', $cartaPorte)
            ->where('transport_company', $transportCompany)
            ->where('status', '!=', 'cancelled');

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $exists = $query->exists();

        return response()->json(['exists' => $exists]);
    }

    /**
     * OE Tracker: Show all OE from the current operational cut (07:00 AM to 06:59 AM).
     * Separated by presentation type: Envasado, Granel, Envasado SADER.
     */
    
    /**
     * OE Tracker: Show all OE from the current operational cut (07:00 AM to 06:59 AM).
     * Separated by presentation type: Envasado, Granel, Envasado SADER.
     */
    
    /**
     * OE Tracker: Show all OE from the current operational cut (07:00 AM to 06:59 AM).
     * Separated by presentation type: Envasado, Granel, Envasado SADER, Granel SADER.
     */
    public function oeTrackerIndex(Request $request)
    {
        $search = $request->input('search', '');
        $clientId = $request->input('client_id', '');
        $productId = $request->input('product_id', '');
        $module = $request->input('module');
        $from = $request->input('from');

        // Keep the legacy production tracker URL on the production activity view.
        if ($module === 'apt' && $from === 'production') {
            return redirect()->route('apt.management.activity');
        }

        // Auto-detect module from route name if not explicitly provided
        if (!$module) {
            $routeName = $request->route() ? $request->route()->getName() : '';
            if (strpos($routeName, 'apt.') === 0 || str_contains($request->path(), 'apt/')) {
                $module = 'apt';
            } else if (strpos($routeName, 'scale.') === 0 || str_contains($request->path(), 'scale/')) {
                $module = 'scale';
            } else if (strpos($routeName, 'quality.') === 0 || str_contains($request->path(), 'quality/')) {
                $module = 'quality';
            } else {
                $module = 'documentation';
            }
        }

        if ($request->user() && ($request->user()->hasRole('Calidad') || $request->user()->hasRole('calidad') || $request->user()->hasRole('Quality')) && !$request->user()->hasRole('Admin')) {
            $module = 'quality';
        }

        // Operational Range Calculation: From 07:00 AM today to 06:59 AM tomorrow
        $operativeDate = OperationalTimeHelper::getOperativeDate(now());
        [$startRange, $endRange] = OperationalTimeHelper::getOperationalRange($operativeDate);

        // Base query: OE not cancelled
        $baseQuery = ShipmentOrder::query()
            ->with([
                'client',
                'sales_order',
                'items.product',
                'weight_ticket.lot',
                'lot',
                'latestProcessHistory.lot',
                'loadingOrders.weight_ticket.lot',
                'loadingOrders.lot',
                'accessLogs' => function ($q) {
                    $q->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at');
                },
            ])
            ->whereNotIn('status', ['cancelled', 'closed']);

        $inPlant = $request->input('in_plant', 'all');

        // Apply "En Planta" filter
        if ($inPlant === 'si' || $inPlant === 'yes') {
            $baseQuery->where(function ($q) {
                $q->whereHas('weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
                    ->orWhereHas('loadingOrders.weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
                    ->orWhereHas('accessLogs', fn($al) => $al->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at'))
                    ->orWhereIn('id', function ($sub) {
                        $sub->select('companion_shipment_order_id')
                            ->from('weight_tickets')
                            ->where('weighing_status', '!=', 'cancelled')
                            ->whereNotNull('companion_shipment_order_id');
                    });
            });
        } elseif ($inPlant === 'no') {
            $baseQuery->whereDoesntHave('weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
                ->whereDoesntHave('loadingOrders.weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
                ->whereDoesntHave('accessLogs', fn($al) => $al->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at'))
                ->whereNotIn('id', function ($sub) {
                    $sub->select('companion_shipment_order_id')
                        ->from('weight_tickets')
                        ->where('weighing_status', '!=', 'cancelled')
                        ->whereNotNull('companion_shipment_order_id');
                });
        }

        // --- DYNAMIC FILTERS BASE ---
        // We clone here to get the list of clients/products available AFTER "En Planta" filter
        // but BEFORE the specific search/client/product filters are applied.
        $dynamicBaseQuery = clone $baseQuery;

        // Apply search filter
        if (!empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhere('tractor_plate', 'like', "%{$search}%")
                    ->orWhere('transport_company', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($q2) use ($search) {
                        $q2->where('business_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('lot', function ($qL) use ($search) {
                        $qL->where('folio', 'like', "%{$search}%");
                    })
                    ->orWhereHas('latestProcessHistory.lot', function ($qL) use ($search) {
                        $qL->where('folio', 'like', "%{$search}%");
                    })
                    ->orWhereHas('weight_ticket.lot', function ($qL) use ($search) {
                        $qL->where('folio', 'like', "%{$search}%");
                    });
            });
        }

        // Apply Client filter
        if (!empty($clientId)) {
            $baseQuery->where('client_id', $clientId);
        }

        // Apply Product filter
        if (!empty($productId)) {
            $pm = \App\Models\Product::find($productId);
            $pmName = $pm?->name;

            $baseQuery->where(function ($q) use ($productId, $pmName) {
                $q->whereHas('items', function ($sq) use ($productId) {
                    $sq->where('product_id', $productId);
                });
                if ($pmName) {
                    $q->orWhere('product', 'like', "%{$pmName}%");
                }
            });
        }

        // Helper: resolve product text and sack size for display
        $resolveProduct = function (ShipmentOrder $order): string {
            $productName = $order->product ?? ($order->items->first()?->product?->name ?? 'N/A');
            $presentation = strtoupper($order->presentation ?? '');

            if (strpos($presentation, 'ENVASADO') !== false && !empty($order->sacks_count)) {
                $sacksCount = strtoupper($order->sacks_count);
                
                // If it's a bag count (contains "SACO"), we ignore it for this column as per user request
                if (strpos($sacksCount, 'SACO') !== false) {
                    return $productName;
                }

                // If it's a weight (contains "KG") and it's NOT already in the product name, append it
                if (strpos($sacksCount, 'KG') !== false && strpos(strtoupper($productName), $sacksCount) === false) {
                    return $productName . ' - ' . $order->sacks_count;
                }
            }

            return $productName;
        };

        // Helper: resolve the best available ticket (Prioritize non-cancelled)
        $resolveTicket = function (ShipmentOrder $order) {
            $primaryTicket = $order->weight_ticket;
            if ($primaryTicket && $primaryTicket->weighing_status !== 'cancelled') {
                return $primaryTicket;
            }

            // If primary is cancelled or null, look in loading orders for an active one
            foreach ($order->loadingOrders as $lo) {
                if ($lo->weight_ticket && $lo->weight_ticket->weighing_status !== 'cancelled') {
                    return $lo->weight_ticket;
                }
            }

            // Fallback to the first one available if all are cancelled
            return $primaryTicket ?? $order->loadingOrders->pluck('weight_ticket')->filter()->first();
        };

        // Helper: resolve warehouse from loading orders or OE directly
        $resolveWarehouse = function (ShipmentOrder $order): string {
            if (!empty($order->warehouse) && $order->warehouse !== 'N/A') {
                return $order->warehouse;
            }
            if ($order->lot && !empty($order->lot->warehouse) && $order->lot->warehouse !== 'N/A') {
                return $order->lot->warehouse;
            }
            if ($order->weight_ticket && !empty($order->weight_ticket->warehouse) && $order->weight_ticket->warehouse !== 'N/A') {
                return $order->weight_ticket->warehouse;
            }
            if ($order->weight_ticket && $order->weight_ticket->lot && !empty($order->weight_ticket->lot->warehouse) && $order->weight_ticket->lot->warehouse !== 'N/A') {
                return $order->weight_ticket->lot->warehouse;
            }
            foreach ($order->loadingOrders as $lo) {
                if (!empty($lo->warehouse) && $lo->warehouse !== 'N/A') return $lo->warehouse;
                if ($lo->lot && !empty($lo->lot->warehouse) && $lo->lot->warehouse !== 'N/A') return $lo->lot->warehouse;
                if ($lo->weight_ticket && !empty($lo->weight_ticket->warehouse) && $lo->weight_ticket->warehouse !== 'N/A') return $lo->weight_ticket->warehouse;
                if ($lo->weight_ticket && $lo->weight_ticket->lot && !empty($lo->weight_ticket->lot->warehouse) && $lo->weight_ticket->lot->warehouse !== 'N/A') return $lo->weight_ticket->lot->warehouse;
            }
            return 'N/A';
        };

        // Helper: resolve lot folio
        $resolveLot = function (ShipmentOrder $order): string {
            if ($order->lot && !empty($order->lot->folio)) {
                return $this->normalizeLotLabel($order->lot->folio);
            }
            if ($order->latestProcessHistory && $order->latestProcessHistory->lot && !empty($order->latestProcessHistory->lot->folio)) {
                return $this->normalizeLotLabel($order->latestProcessHistory->lot->folio);
            }
            if ($order->weight_ticket && $order->weight_ticket->lot && !empty($order->weight_ticket->lot->folio)) {
                return $this->normalizeLotLabel($order->weight_ticket->lot->folio);
            }
            foreach ($order->loadingOrders as $lo) {
                if ($lo->lot && !empty($lo->lot->folio)) {
                    return $this->normalizeLotLabel($lo->lot->folio);
                }
                if ($lo->weight_ticket && $lo->weight_ticket->lot && !empty($lo->weight_ticket->lot->folio)) {
                    return $this->normalizeLotLabel($lo->weight_ticket->lot->folio);
                }
            }
            return 'N/A';
        };

        // Helper: compute status and timing for ticket and access log
        $computeStatus = function (ShipmentOrder $order) use ($resolveTicket) {
            $ticket = $resolveTicket($order);

            // A request is completed if the OE status is 'completed'
            // OR if it has a ticket that already weighed out.
            $isCompleted = ($order->status === 'completed') || ($ticket && !is_null($ticket->weigh_out_at));
            $isPending = !$isCompleted;

            $activeAccessLog = $order->relationLoaded('accessLogs') 
                ? $order->accessLogs->first() 
                : $order->accessLogs()->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at')->first();

            $entryAt = $activeAccessLog?->entry_at ?? $order->created_at;
            $createdAt = $entryAt ? Carbon::parse($entryAt)->toIso8601String() : $order->created_at?->toIso8601String();
            $completedAt = null;

            if ($isCompleted) {
                if ($ticket?->weigh_out_at) {
                    $completedAt = Carbon::parse($ticket->weigh_out_at)->toIso8601String();
                } else {
                    $completedAt = $order->updated_at?->toIso8601String();
                }
            }

            return [
                'is_pending'   => $isPending,
                'created_at'   => $createdAt,
                'completed_at' => $completedAt,
            ];
        };

        // Helper: resolve real-time process status
        $resolveProcessStatus = function (ShipmentOrder $order, $timing, $ticket, $inPlant, $warehouse) {
            $isCompleted = !$timing['is_pending'];

            if ($isCompleted) {
                return [
                    'stage' => 'completed',
                    'label' => 'Destarado',
                    'detail' => 'Completada: Pesaje de salida registrado.',
                    'color' => 'emerald',
                ];
            }

            if (!$inPlant) {
                return [
                    'stage' => 'pending_entry',
                    'label' => 'Por Ingresar',
                    'detail' => 'Pendiente de registrar entrada en caseta de vigilancia / báscula.',
                    'color' => 'red',
                ];
            }

            // In Plant cases
            $hasLoadedFinished = !empty($order->loading_finished_at) || $order->status === 'loaded';
            $isLoading = ($order->status === 'loading' || !empty($order->loaded_at) || !empty($order->lot_id)) && !$hasLoadedFinished;

            if ($hasLoadedFinished) {
                $whLabel = ($warehouse !== 'N/A') ? " ({$warehouse})" : "";
                return [
                    'stage' => 'loaded',
                    'label' => 'Cargado' . $whLabel,
                    'detail' => 'Carga completada' . ($warehouse !== 'N/A' ? " en {$warehouse}" : "") . '. Esperando pesaje de salida (destare).',
                    'color' => 'blue',
                ];
            }

            if ($isLoading) {
                $whLabel = ($warehouse !== 'N/A') ? " ({$warehouse})" : "";
                return [
                    'stage' => 'loading',
                    'label' => 'Cargando' . $whLabel,
                    'detail' => 'En proceso de carga' . ($warehouse !== 'N/A' ? " en {$warehouse}" : "") . '.',
                    'color' => 'indigo',
                ];
            }

            // Has registered tare weight ticket in scale (waiting for warehouse load)
            $hasTareTicket = ($ticket && $ticket->weighing_status !== 'cancelled' && (!empty($ticket->weigh_in_at) || !empty($ticket->tare_weight)));
            if ($hasTareTicket) {
                $whLabel = ($warehouse !== 'N/A') ? " ({$warehouse})" : "";
                return [
                    'stage' => 'tared',
                    'label' => 'Tara Registrada' . $whLabel,
                    'detail' => 'Pesaje de entrada (tara) registrado en báscula. Esperando inicio de carga en almacén.',
                    'color' => 'purple',
                ];
            }

            return [
                'stage' => 'in_plant',
                'label' => 'En Planta (Espera)',
                'detail' => 'Operador ingresó a planta por vigilancia. Esperando turno para pesaje de tara en báscula.',
                'color' => 'amber',
            ];
        };

        // Map a single order to the row format
        $mapOrder = function (ShipmentOrder $order, int $index, $activeCompanions = []) use (
            $resolveProduct, $resolveTicket, $resolveWarehouse, $computeStatus, $resolveProcessStatus, $resolveLot
        ) {
            $timing = $computeStatus($order);
            $ticket = $resolveTicket($order);
            
            // Ticket status for pending rows - Only checkmark if ticket is NOT cancelled
            $ticketStatus = null;
            if ($timing['is_pending']) {
                $ticketStatus = ($ticket && $ticket->weighing_status !== 'cancelled') ? 'checkmark' : 'x';
            }

            // EN PLANTA resolution:
            // SÍ if it has an active AccessLog (scanned in Vigilancia) OR if it has a ticket OR if it is a companion of an active ticket OR if it has loaded/lot in APT
            $activeAccessLog = $order->relationLoaded('accessLogs') 
                ? $order->accessLogs->first() 
                : $order->accessLogs()->where('access_logs.status', 'in_plant')->whereNull('access_logs.exit_at')->first();

            $inPlant = false;
            if ($activeAccessLog) {
                $inPlant = true;
            } elseif ($ticket && $ticket->weighing_status !== 'cancelled') {
                $inPlant = true;
            } elseif (in_array($order->id, $activeCompanions)) {
                $inPlant = true;
            } elseif (!empty($order->loaded_at) || !empty($order->lot_id) || $order->status === 'loading' || !empty($order->loading_finished_at)) {
                $inPlant = true;
            }

            $unitType = $order->unit_type ?? 'N/A';
            if ($ticket && !empty($ticket->full_part)) {
                $partLabel = $ticket->full_part === 'primera' ? '1ra Parte' : '2da Parte';
                $unitType .= " ({$partLabel})";
            }

            $wh = $resolveWarehouse($order);
            $processStatus = $resolveProcessStatus($order, $timing, $ticket, $inPlant, $wh);

            $trailerPlate = $order->trailer_plate;
            if (empty($trailerPlate) || $trailerPlate === 'N/A') {
                $trailerPlate = $ticket?->trailer_plate ?? null;
            }
            if (empty($trailerPlate) || $trailerPlate === 'N/A') {
                foreach ($order->loadingOrders as $lo) {
                    if (!empty($lo->trailer_plate) && $lo->trailer_plate !== 'N/A') {
                        $trailerPlate = $lo->trailer_plate;
                        break;
                    }
                }
            }

            return [
                'id'                => $order->id,
                'num'               => $index + 1,
                'folio'             => $order->folio,
                'tractor_plate'     => $order->tractor_plate ?? 'N/A',
                'trailer_plate'     => $trailerPlate ?: 'N/A',
                'operator_name'     => $order->operator_name ?? 'N/A',
                'unit_type'         => $unitType,
                'transport_company' => $order->transport_company ?? 'N/A',
                'lot'               => $resolveLot($order),
                'client'            => $order->client?->business_name ?? 'N/A',
                'warehouse'         => $wh,
                'product'           => $resolveProduct($order),
                'presentation'      => $order->presentation ?? 'N/A',
                'programmed_tons'   => (float) ($order->programmed_tons ?? 0),
                'is_pending'        => $timing['is_pending'],
                'created_at'        => $timing['created_at'],
                'completed_at'      => $timing['completed_at'],
                'status'            => $order->status,
                'ticket_status'     => $ticketStatus,
                'in_plant'          => $inPlant,
                'process_status'    => $processStatus,
            ];
        };

        // Fetch all matching orders
        $allOrders = (clone $baseQuery)->orderBy('created_at', 'desc')->get();

        // --- Dynamic Filter Options ---
        $activeRefs = $dynamicBaseQuery->with(['client', 'items'])->get();
        $activeClientIds = $activeRefs->pluck('client_id')->filter()->unique();
        $activeClients = \App\Models\Client::whereIn('id', $activeClientIds)->orderBy('business_name')->get(['id', 'business_name']);

        $activeProductIds = $activeRefs->flatMap(fn($o) => $o->items->pluck('product_id'))->filter()->unique();
        $activeProductStrings = $activeRefs->pluck('product')->filter()->unique();
        
        $activeProducts = \App\Models\Product::orderBy('name')->get(['id', 'name'])
            ->filter(function($p) use ($activeProductIds, $activeProductStrings) {
                if ($activeProductIds->contains($p->id)) return true;
                foreach ($activeProductStrings as $s) {
                    if (strpos(strtoupper($s), strtoupper($p->name)) !== false) return true;
                }
                return false;
            })->values();

        // Fetch ALL active companions for "In Plant" resolution
        $activeCompanions = \App\Models\WeightTicket::where('weighing_status', '!=', 'cancelled')
            ->whereNotNull('companion_shipment_order_id')
            ->pluck('companion_shipment_order_id')
            ->toArray();

        // Classification Logic
        $envasado = collect();
        $granel = collect();
        $saderEnvasado = collect();
        $saderGranel = collect();

        foreach ($allOrders as $order) {
            $pres = strtoupper($order->presentation ?? '');
            $isEnvasado = (strpos($pres, 'ENVASADO') !== false);
            $isSader = (strpos(strtoupper($order->consigned_to ?? ''), 'SADER') !== false);

            if ($isSader) {
                if ($isEnvasado) {
                    $saderEnvasado->push($order);
                } else {
                    $saderGranel->push($order);
                }
            } else {
                if ($isEnvasado) {
                    $envasado->push($order);
                } else {
                    $granel->push($order);
                }
            }
        }

        // --- Per-Tab Filter Options ---
        $getFiltersFromGroup = function ($collection) {
            if ($collection->isEmpty()) {
                return ['clients' => [], 'products' => []];
            }

            // Extract unique clients
            $clientIds = $collection->pluck('client_id')->filter()->unique();
            $clients = \App\Models\Client::whereIn('id', $clientIds)
                ->orderBy('business_name')
                ->get(['id', 'business_name']);

            // Extract unique products (matching global logic)
            $productIds = $collection->flatMap(fn($o) => $o->items->pluck('product_id'))->filter()->unique();
            $productStrings = $collection->pluck('product')->filter()->unique();

            $products = \App\Models\Product::orderBy('name')->get(['id', 'name'])
                ->filter(function ($p) use ($productIds, $productStrings) {
                    if ($productIds->contains($p->id)) return true;
                    foreach ($productStrings as $s) {
                        if (strpos(strtoupper($s), strtoupper($p->name)) !== false) return true;
                    }
                    return false;
                })->values();

            return ['clients' => $clients, 'products' => $products];
        };

        $envasadoF = $getFiltersFromGroup($envasado);
        $granelF = $getFiltersFromGroup($granel);
        $saderEnvasadoF = $getFiltersFromGroup($saderEnvasado);
        $saderGranelF = $getFiltersFromGroup($saderGranel);

        // Pagination/Mapping helper
        $prepareGroup = function ($collection) use ($mapOrder, $activeCompanions) {
            return $collection->values()->map(fn($o, $i) => $mapOrder($o, $i, $activeCompanions));
        };

        $lots = Lot::where('status', 'open')->orderBy('folio')->get(['id', 'folio', 'warehouse'])->map(function ($lot) {
            return [
                'id' => $lot->id,
                'folio' => $this->normalizeLotLabel($lot->folio),
                'warehouse' => $lot->warehouse,
            ];
        })->values();

        $this->ensureLoadingAssistantTables();
        $loadingHistory = $this->getLoadingHistory();
        $loadingAssistants = LoadingAssistant::orderBy('name')->get(['id', 'name']);
        $squadLeaders = $this->personalAgroindustrySquadLeaders()
            ->values()
            ->map(fn (string $name, int $index) => [
                'id' => $index + 1,
                'name' => $name,
            ]);

        return Inertia::render('Documentation/OeTracker/Index', [
            'lots'          => $lots,
            'loadingHistory' => $loadingHistory,
            'squadLeaders'  => $squadLeaders,
            'loadingAssistants' => $loadingAssistants,
            'envasado'      => $prepareGroup($envasado),
            'granel'        => $prepareGroup($granel),
            'saderEnvasado' => $prepareGroup($saderEnvasado),
            'saderGranel'   => $prepareGroup($saderGranel),
            'context_module' => $module,
            'filters'  => [
                'search' => $search,
                'module' => $module,
                'from' => $from,
                'in_plant' => $inPlant,
                'client_id' => $clientId,
                'product_id' => $productId,
            ],
            // Dynamic categorized lists
            'envasadoClients'       => $envasadoF['clients'],
            'envasadoProducts'      => $envasadoF['products'],
            'granelClients'         => $granelF['clients'],
            'granelProducts'        => $granelF['products'],
            'saderEnvasadoProducts' => $saderEnvasadoF['products'],
            'saderGranelProducts'   => $saderGranelF['products'],
            'clients'               => [], // No longer used as primary
            'products'              => [], // No longer used as primary
        ]);
    }

    private function normalizeLotLabel(?string $folio): string
    {
        if (empty($folio)) {
            return '';
        }

        $cleaned = trim($folio);
        $cleaned = preg_replace('/\s*(?:[•·|]|[-–])\s*(?:Almacen|Almacén)\b.*$/i', '', $cleaned);
        $cleaned = preg_replace('/\s+\((?:Almacen|Almacén)\b.*\)$/i', '', $cleaned);
        $cleaned = preg_replace('/\s+(?:Almacen|Almacén)\s*\d*\s*$/i', '', $cleaned);

        return trim((string) $cleaned);
    }

    public function searchQr(Request $request)
    {
        $rawQr = trim((string) $request->input('qr'));
        $folio = strtoupper($rawQr);

        if (filter_var($rawQr, FILTER_VALIDATE_URL)) {
            $folio = strtoupper(trim((string) basename(parse_url($rawQr, PHP_URL_PATH))));
        }

        $folio = preg_replace('/^QR\s*[:#-]?\s*/i', '', $folio);

        $order = ShipmentOrder::with(['client', 'items.product', 'loadingOrders'])
            ->where(function ($query) use ($folio) {
                $query->whereRaw('UPPER(folio) = ?', [$folio])
                    ->orWhereRaw('UPPER(qr_code) = ?', [$folio]);
            })
            ->first();

        // Fallback for keyboard-wedge scanners that mistype separators (e.g. "'" instead of "-")
        // due to a keyboard-layout mismatch: compare folio/qr_code ignoring non-alphanumeric chars.
        if (!$order) {
            $normalizedFolio = preg_replace('/[^A-Z0-9]/', '', $folio);

            if ($normalizedFolio !== '') {
                $stripNonAlnum = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(UPPER(%s), '-', ''), '_', ''), ' ', ''), '.', ''), \"'\", ''), '/', '')";

                $order = ShipmentOrder::with(['client', 'items.product', 'loadingOrders'])
                    ->where(function ($query) use ($stripNonAlnum, $normalizedFolio) {
                        $query->whereRaw(sprintf($stripNonAlnum, 'folio') . ' = ?', [$normalizedFolio])
                            ->orWhereRaw(sprintf($stripNonAlnum, 'qr_code') . ' = ?', [$normalizedFolio]);
                    })
                    ->first();
            }
        }

        if (!$order) {
            return response()->json(['error' => "Orden de embarque no encontrada: {$folio}"], 404);
        }

        $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();

        $tractorPlate = trim($order->tractor_plate ?? '');
        if ($tractorPlate) {
            $heldLog = \App\Models\AccessLog::with('subject')
                ->where('status', 'pending')
                ->whereNotNull('notes')
                ->get()
                ->first(function ($log) use ($tractorPlate) {
                    return trim($log->subject?->tractor_plate ?? '') === $tractorPlate;
                });
                
            if ($heldLog) {
                return response()->json([
                    'error' => "La unidad {$tractorPlate} se encuentra EN PENDIENTE (Vigilancia). Motivo: " . ($heldLog->notes ?? 'Sin motivo especificado.'),
                    'blocked' => true,
                ], 409);
            }
        }

        $hasCompletedWeighing = WeightTicket::where('shipment_order_id', $order->id)
            ->where('weighing_status', '!=', 'cancelled')
            ->whereNotNull('weigh_in_at')
            ->exists()
            || $order->loadingOrders()
                ->whereHas('weight_ticket', function ($query) {
                    $query->where('weighing_status', '!=', 'cancelled')
                        ->whereNotNull('weigh_in_at');
                })
                ->exists();

        if (!$hasCompletedWeighing) {
            return response()->json([
                'error' => "La unidad debe pasar a Bascula antes de continuar con la orden {$order->folio}.",
                'blocked' => true,
            ], 409);
        }

        return response()->json([
            'order' => $this->formatOrderForPrint($order),
            'history' => $history ? $this->formatProcessHistoryItem($history) : null,
            'is_in_apt' => !empty($history) && !empty($history->lot_id),
            'is_registered' => !empty($history) && !empty($history->lot_id),
        ]);
    }

    public function saveLoading(Request $request)
    {
        $this->ensureLoadingAssistantTables();
        $validated = $request->validate([
            'shipment_order_id' => 'required|exists:shipment_orders,id',
            'lot_id' => 'required|exists:lots,id',
            'warehouse' => 'required|string|max:255',
            'squad_leader' => 'nullable|string|max:255',
            'loading_assistant' => 'nullable|string|max:255',
            'stowage_count' => 'nullable|integer',
            'loaded_at' => 'nullable|date',
            'from_estibadores' => 'nullable|boolean',
            'stowage_plan' => 'nullable|array',
        ]);

        if ($validated['squad_leader'] && !$this->personalAgroindustrySquadLeaders()
            ->contains(fn (string $name) => mb_strtoupper($name, 'UTF-8') === mb_strtoupper($validated['squad_leader'], 'UTF-8'))) {
            return response()->json([
                'message' => 'Selecciona un encargado de cuadrilla registrado en Gestión de Prestadores de Servicio.',
                'errors' => ['squad_leader' => ['El encargado debe estar registrado como Líder de Cuadrilla Responsable de Personal Propio Agroindustria.']],
            ], 422);
        }

        $order = ShipmentOrder::findOrFail($validated['shipment_order_id']);

        $hasCompletedWeighing = WeightTicket::where('shipment_order_id', $order->id)
            ->where('weighing_status', '!=', 'cancelled')
            ->whereNotNull('weigh_in_at')
            ->exists()
            || $order->loadingOrders()
                ->whereHas('weight_ticket', function ($query) {
                    $query->where('weighing_status', '!=', 'cancelled')
                        ->whereNotNull('weigh_in_at');
                })
                ->exists();

        if (!$hasCompletedWeighing) {
            return response()->json([
                'message' => "La unidad debe pasar a Bascula antes de continuar con la orden {$order->folio}.",
            ], 422);
        }

        if ($request->boolean('from_estibadores')) {
            $incomingPlan = $request->input('stowage_plan', []);
            if (is_string($incomingPlan)) {
                $incomingPlan = json_decode($incomingPlan, true) ?: [];
            }
            $existingPlan = is_array($order->stowage_plan) ? $order->stowage_plan : [];
            $mergedPlan = array_merge($existingPlan, is_array($incomingPlan) ? $incomingPlan : []);
            $mergedPlan['warehouse'] = $validated['warehouse'];
            if (!empty($validated['loading_assistant'])) {
                $mergedPlan['supervisor'] = $validated['loading_assistant'];
            }
            if (empty($mergedPlan['vobo_status'])) {
                $mergedPlan['vobo_status'] = 'pending';
            }

            $computedStowageCount = $request->input('stowage_count') ?: ($existingPlan['stowage_count'] ?? $order->stowage_count);
            if (isset($mergedPlan['stowages']) && is_array($mergedPlan['stowages'])) {
                $nonEmptyCount = collect($mergedPlan['stowages'])
                    ->filter(fn($v) => !is_null($v) && ((float)$v > 0 || strtoupper((string)$v) === 'X'))
                    ->count();
                if ($nonEmptyCount > 0) {
                    $computedStowageCount = $nonEmptyCount;
                }
            }
            if ($computedStowageCount) {
                $mergedPlan['stowage_count'] = (int) $computedStowageCount;
            }

            $now = now();
            $order->update([
                'lot_id' => $validated['lot_id'],
                'warehouse' => $validated['warehouse'],
                'loading_squad_leader' => $validated['squad_leader'] ?? null,
                'loading_assistant' => $validated['loading_assistant'] ?? null,
                'stowage_plan' => $mergedPlan,
                'loaded_at' => $order->loaded_at ?? $now,
                'status' => $order->status === 'created' || !$order->status ? 'loading' : $order->status,
            ]);

            $lot = Lot::find($validated['lot_id']);
            $existingHistory = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
            $historyRecord = ShipmentProcessHistory::updateOrCreate(
                ['shipment_order_id' => $order->id],
                [
                    'lot_id' => $validated['lot_id'],
                    'warehouse' => $validated['warehouse'],
                    'cubicle' => $lot?->cubicle,
                    'loading_administrator' => $existingHistory?->loading_administrator ?: ($request->user()?->name ?: 'Estibadores'),
                    'loading_squad_leader' => $validated['squad_leader'] ?? null,
                    'loading_assistant' => $validated['loading_assistant'] ?? null,
                    'stowage_count' => $computedStowageCount,
                    'started_at' => $existingHistory?->started_at ?? $order->loaded_at ?? $now,
                    'status' => $existingHistory?->status ?: 'loading',
                    'stowage_plan' => $mergedPlan,
                    'stowage_plan_status' => $order->stowage_plan_status ?: 'pending',
                    'stowage_plan_saved_at' => $order->stowage_plan_saved_at,
                    'stowage_plan_saved_by' => $order->stowage_plan_saved_by,
                ]
            );

            $freshOrder = $order->fresh(['items.product', 'lot', 'client', 'sales_order']);
            $orderPayload = $this->formatOrderForPrint($freshOrder);
            $orderPayload['history_id'] = $historyRecord->id;
            $orderPayload['lot_folio'] = $freshOrder->lot?->folio;
            $orderPayload['stowage_count'] = $computedStowageCount;
            $orderPayload['target_samples_count'] = $this->getTargetSamplesCount($freshOrder);
            $orderPayload['vobo_status'] = $mergedPlan['vobo_status'] ?? 'pending';
            $orderPayload['is_in_apt'] = ($mergedPlan['vobo_status'] ?? 'pending') === 'approved';

            return response()->json([
                'message' => 'Datos de carga guardados. Abriendo Nota de Estiba.',
                'order' => $orderPayload,
            ]);
        }

        $administrator = $request->user()?->name ?: $request->user()?->username ?: 'Administrador';
        $now = now();

        $order->update([
            'lot_id' => $validated['lot_id'],
            'warehouse' => $validated['warehouse'],
            'loading_administrator' => $administrator,
            'loading_squad_leader' => $validated['squad_leader'] ?? null,
            'loading_assistant' => $validated['loading_assistant'] ?? null,
            'loaded_at' => $now,
            'status' => 'loading',
        ]);

        $lot = Lot::find($validated['lot_id']);

        ShipmentProcessHistory::updateOrCreate(
            ['shipment_order_id' => $order->id],
            [
                'lot_id' => $validated['lot_id'],
                'warehouse' => $validated['warehouse'],
                'cubicle' => $lot?->cubicle,
                'loading_administrator' => $administrator,
                'loading_squad_leader' => $validated['squad_leader'] ?? null,
                'loading_assistant' => $validated['loading_assistant'] ?? null,
                'stowage_count' => $request->input('stowage_count') ?: $order->stowage_count,
                'started_at' => $now,
                'status' => 'loading',
                'stowage_plan' => $order->stowage_plan,
                'stowage_plan_status' => $order->stowage_plan_status ?: 'pending',
                'stowage_plan_saved_at' => $order->stowage_plan_saved_at,
                'stowage_plan_saved_by' => $order->stowage_plan_saved_by,
            ]
        );

        return response()->json([
            'message' => 'Embarque guardado correctamente.',
            'administrator' => $administrator,
            'order' => $this->formatOrderForPrint($order->fresh()),
        ]);
    }

    public function saveSampling(Request $request, string $id)
    {
        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order && $request->filled('shipment_order_id')) {
            $order = ShipmentOrder::where('id', $request->input('shipment_order_id'))->orWhere('folio', $request->input('shipment_order_id'))->first();
        }
        if (!$order && $request->filled('folio')) {
            $order = ShipmentOrder::where('folio', $request->input('folio'))->first();
        }
        if (!$order && $request->filled('order_id')) {
            $order = ShipmentOrder::where('id', $request->input('order_id'))->orWhere('folio', $request->input('order_id'))->first();
        }

        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        }
        if (!$history) {
            $history = ShipmentProcessHistory::find($id);
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }
        if (!$history && $request->filled('history_id')) {
            $history = ShipmentProcessHistory::find($request->input('history_id'));
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$history && $order) {
            $history = ShipmentProcessHistory::create([
                'shipment_order_id' => $order->id,
                'lot_id' => $order->lot_id,
                'warehouse' => $order->warehouse,
                'loading_administrator' => $order->loading_administrator ?? $request->user()?->name ?? 'Administrador',
                'loading_squad_leader' => $order->loading_squad_leader,
                'loading_assistant' => $order->loading_assistant,
                'started_at' => $order->loaded_at ?? now(),
                'status' => 'loading',
            ]);
        }

        if (!$history) {
            return response()->json(['message' => 'No se encontró el registro de proceso de embarque.'], 404);
        }

        $samples = $request->input('samples', []);
        if (is_string($samples)) {
            $samples = json_decode($samples, true) ?: [];
        }
        $stowageCount = $request->input('stowage_count');
        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
        $targetSamples = $targetPerEnsacadora * 2;
        $sampleCount = count($samples);
        $existingSampleCount = count($history?->samples ?? $order?->samples ?? []);

        // Candado estricto para envasados: estrictamente se debe realizar primero la Nota de Estiba y contar con el VoBo de Supervisión PROAGRO para realizar muestras
        $productText = mb_strtoupper(($order?->product ?? '') . ' ' . ($order?->presentation ?? ''));
        $isEnvasado = str_contains($productText, 'ENVASADO') || str_contains($productText, 'SACO') || str_contains($productText, '25KG') || str_contains($productText, '50KG');
        $stowageDone = ($order?->stowage_plan_status === 'completed' && !empty($order?->stowage_plan_saved_at)) 
            || ($history && ($history->stowage_plan_status === 'completed' && !empty($history->stowage_plan_saved_at)));

        if ($isEnvasado && !$stowageDone) {
            return response()->json([
                'message' => 'Candado Activo: Estrictamente se debe realizar y guardar primero la Nota de Estiba (GLS-AP-FO-002) antes de capturar las muestras de ensacadora.',
            ], 422);
        }

        $currentPlan = is_array($history->stowage_plan)
            ? $history->stowage_plan
            : (is_array($order?->stowage_plan) ? $order->stowage_plan : []);

        if ($isEnvasado && ($currentPlan['vobo_status'] ?? 'pending') !== 'approved') {
            return response()->json([
                'message' => 'Candado Activo: La Nota de Estiba (GLS-AP-FO-002) se encuentra en estado "Pendiente de VoBo". El personal de Supervisión PROAGRO debe revisarla y dar su VoBo antes de iniciar la toma de muestras.',
            ], 422);
        }

        // Regla funcional 4 y 5 (Especificación VECODE):
        // Normalizar muestras por ensacadora y validar que no se compensen muestras faltantes de una ensacadora con la otra
        $env1Seq = 0;
        $env2Seq = 0;
        $currentUserName = $request->user()?->name ?: ($request->user()?->username ?: 'Estibador');
        $orderFolio = $order?->folio ?? 'N/A';
        $progTons = (float) ($order?->programmed_tons ?: 36);
        $normalizedSamples = [];

        foreach ($samples as $s) {
            if (!is_array($s)) continue;
            $env = (int) ($s['ensacadora'] ?? $s['envasadora'] ?? 1) === 2 ? 2 : 1;
            if ($env === 1) {
                $env1Seq++;
                $seq = $env1Seq;
            } else {
                $env2Seq++;
                $seq = $env2Seq;
            }
            $s['ensacadora'] = $env;
            $s['envasadora'] = $env;
            $s['ensacadora_name'] = "Ensacadora {$env}";
            $s['num'] = $seq;
            $s['order_folio'] = $s['order_folio'] ?? $orderFolio;
            $s['programmed_tons'] = $s['programmed_tons'] ?? $progTons;
            $s['required_samples'] = $targetPerEnsacadora;
            $s['captured_by'] = $s['captured_by'] ?? $currentUserName;
            $s['captured_at'] = $s['captured_at'] ?? now()->toIso8601String();
            $normalizedSamples[] = $s;
        }

        if ($env1Seq > $targetPerEnsacadora || $env2Seq > $targetPerEnsacadora) {
            return response()->json([
                'message' => "Regla de muestreo VECODE: No se permite compensar muestras faltantes de una ensacadora con muestras adicionales de la otra. El límite requerido para esta unidad ({$progTons} TM) es de {$targetPerEnsacadora} muestras en Ensacadora 1 y {$targetPerEnsacadora} muestras en Ensacadora 2 ({$targetSamples} en total).",
            ], 422);
        }

        $samples = $normalizedSamples;
        $sampleCount = count($samples);
        $breakdown = $this->computeEnsacadoraSamplingBreakdown($samples, $targetPerEnsacadora);
        $isCompleted = $breakdown['both_completed'];

        $avg = null;
        if ($sampleCount > 0) {
            $weights = collect($samples)->pluck('weight')->map(fn ($w) => (float)$w)->filter(fn ($w) => $w > 0);
            if ($weights->count() > 0) {
                $avg = round($weights->avg(), 3);
            }
        }

        $now = now();
        $isFinalSave = $isCompleted && ($request->boolean('is_completed') || $breakdown['both_completed']);

        $existingPlan = is_array($history->stowage_plan)
            ? $history->stowage_plan
            : (is_array($order?->stowage_plan) ? $order->stowage_plan : []);

        // Regla funcional 2: Dos registros independientes de muestreo (Ensacadora 1 y Ensacadora 2)
        $existingPlan['sampling_records'] = [
            'programmed_tons' => $progTons,
            'target_per_ensacadora' => $targetPerEnsacadora,
            'target_total' => $targetSamples,
            'ensacadora_1' => $breakdown['ensacadora_1'],
            'ensacadora_2' => $breakdown['ensacadora_2'],
            'updated_at' => $now->toIso8601String(),
            'updated_by' => $currentUserName,
        ];

        $updateData = [
            'samples' => $samples,
            'sampling_avg' => $avg,
            'sampling_status' => $isCompleted ? 'completed' : ($sampleCount > 0 ? 'in_progress' : 'pending'),
            'sampling_completed_at' => $isCompleted ? ($history->sampling_completed_at ?? $now) : null,
            'stowage_plan' => $existingPlan,
            'updated_by' => auth()->id(),
        ];

        if ($request->has('is_blocked')) {
            $updateData['is_sampling_blocked'] = $request->boolean('is_blocked');
        }

        if ($stowageCount !== null && $stowageCount !== '') {
            $updateData['stowage_count'] = (int)$stowageCount;
        }

        // Al certificar y guardar el muestreo final, actualizar Peso Neto Estimado en Nota de Estiba y dejar pendiente de Liberación por Supervisión PROAGRO (Paso 4)
        if ($isFinalSave) {
            if (empty($existingPlan['sampling_release_status'])) {
                $existingPlan['sampling_release_status'] = 'pending_release';
            }

            if ($avg && $avg > 0) {
                $existingPlan['avg_unit_weight'] = $avg;
                $totalSacksForNet = 0;
                if (!empty($existingPlan['stowages']) && is_array($existingPlan['stowages'])) {
                    $numericSacksSum = collect($existingPlan['stowages'])
                        ->filter(fn($v) => is_numeric($v) && (float)$v > 0)
                        ->sum(fn($v) => (float)$v);
                    if ($numericSacksSum > 0) {
                        $totalSacksForNet = (int) round($numericSacksSum);
                    }
                }

                if ($totalSacksForNet <= 0 && $order) {
                    $tons = (float) ($order->programmed_tons ?? 0);
                    $sacksStr = (string) ($order->sacks_count ?? '');
                    if ($tons > 0) {
                        if (stripos($sacksStr, 'KG') !== false) {
                            $size = (int) preg_replace('/\D/', '', $sacksStr);
                            if ($size > 0) {
                                $totalSacksForNet = (int) round(($tons * 1000) / $size);
                            }
                        } else {
                            $pres = strtoupper((string) ($order->presentation ?? ''));
                            if (str_contains($pres, '25')) $totalSacksForNet = (int) round($tons * 40);
                            elseif (str_contains($pres, '50')) $totalSacksForNet = (int) round($tons * 20);
                            elseif (str_contains($pres, '200')) $totalSacksForNet = (int) round($tons * 5);
                            elseif (str_contains($pres, '500')) $totalSacksForNet = (int) round($tons * 2);
                            elseif (str_contains($pres, '1000')) $totalSacksForNet = (int) round($tons * 1);
                        }
                    }
                    if ($totalSacksForNet <= 0 && is_numeric($sacksStr) && (float)$sacksStr > 0) {
                        $totalSacksForNet = (int) round((float)$sacksStr);
                    }
                }

                if ($totalSacksForNet > 0) {
                    $estimatedNetTons = round(($avg * $totalSacksForNet) / 1000, 3);
                    $existingPlan['net_weight'] = number_format($estimatedNetTons, 3, '.', '') . ' TM';
                    $existingPlan['estimated_net_tons'] = $estimatedNetTons;
                }
            }

            $updateData['stowage_plan'] = $existingPlan;
        }

        $history->update($updateData);

        if ($order) {
            $orderUpdate = [
                'samples' => $samples,
                'sampling_avg' => $avg,
                'sampling_status' => $updateData['sampling_status'],
                'sampling_completed_at' => $updateData['sampling_completed_at'],
            ];
            if (isset($updateData['stowage_plan'])) {
                $orderUpdate['stowage_plan'] = $updateData['stowage_plan'];
            }
            if ($request->has('is_blocked')) {
                $orderUpdate['is_sampling_blocked'] = $request->boolean('is_blocked');
            }
            $order->update($orderUpdate);
        }

        return response()->json([
            'message' => 'Estibas y muestreo guardados correctamente en la tabla de historial.',
            'history' => $this->formatProcessHistoryItem($history->fresh(['shipmentOrder.items.product', 'lot'])),
        ]);
    }

    public function getSampling(Request $request, string $id)
    {
        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order && $request->filled('shipment_order_id')) {
            $order = ShipmentOrder::where('id', $request->input('shipment_order_id'))->orWhere('folio', $request->input('shipment_order_id'))->first();
        }
        if (!$order && $request->filled('folio')) {
            $order = ShipmentOrder::where('folio', $request->input('folio'))->first();
        }

        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        }
        if (!$history) {
            $history = ShipmentProcessHistory::find($id);
        }
        if (!$history && $request->filled('history_id')) {
            $history = ShipmentProcessHistory::find($request->input('history_id'));
        }

        if (!$history) {
            $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
            $breakdown = $this->computeEnsacadoraSamplingBreakdown([], $targetPerEnsacadora);
            return response()->json([
                'samples' => [],
                'stowage_count' => null,
                'sampling_completed_at' => null,
                'sampling_status' => 'pending',
                'sampling_avg' => null,
                'target_samples_per_ensacadora' => $targetPerEnsacadora,
                'target_samples_count' => $targetPerEnsacadora * 2,
                'ensacadora_1_summary' => $breakdown['ensacadora_1'],
                'ensacadora_2_summary' => $breakdown['ensacadora_2'],
            ]);
        }

        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order ?? $history->shipmentOrder);
        $targetSamples = $targetPerEnsacadora * 2;
        $historySamples = $history->samples ?? [];
        if (!is_array($historySamples)) {
            $historySamples = is_string($historySamples) ? (json_decode($historySamples, true) ?: []) : [];
        }
        $sampleCount = count($historySamples);
        $breakdown = $this->computeEnsacadoraSamplingBreakdown($historySamples, $targetPerEnsacadora);
        return response()->json([
            'samples' => $historySamples,
            'stowage_count' => $history->stowage_count ?? ($history->stowage_plan['stowage_count'] ?? null),
            'sampling_completed_at' => $breakdown['both_completed'] ? $history->sampling_completed_at?->toIso8601String() : null,
            'sampling_status' => $breakdown['both_completed'] ? ($history->sampling_status ?? 'completed') : ($sampleCount > 0 ? 'in_progress' : 'pending'),
            'sampling_avg' => $history->sampling_avg,
            'target_samples_per_ensacadora' => $targetPerEnsacadora,
            'target_samples_count' => $targetSamples,
            'ensacadora_1_summary' => $breakdown['ensacadora_1'],
            'ensacadora_2_summary' => $breakdown['ensacadora_2'],
            'is_sampling_blocked' => (bool) ($history->is_sampling_blocked ?? $order?->is_sampling_blocked ?? false),
            'sampling_unlock_count' => (int) ($history->sampling_unlock_count ?? $order?->sampling_unlock_count ?? 0),
        ]);
    }

    public function unlockSampling(Request $request, string $id)
    {
        $this->ensureSamplingIncidentsTable();

        $validated = $request->validate([
            'username_or_email' => 'required|string',
            'password' => 'required|string',
            'assistant_name' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order && $request->filled('shipment_order_id')) {
            $order = ShipmentOrder::where('id', $request->input('shipment_order_id'))->orWhere('folio', $request->input('shipment_order_id'))->first();
        }

        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        }
        if (!$history) {
            $history = ShipmentProcessHistory::find($id);
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$order && !$history) {
            return response()->json(['message' => 'No se encontró la orden de embarque para desbloquear.'], 404);
        }

        $identifier = trim($validated['username_or_email']);
        $user = User::where('email', $identifier)
            ->orWhere('name', $identifier)
            ->first();

        if (!$user && Schema::hasColumn('users', 'username')) {
            $user = User::where('username', $identifier)->first();
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciales inválidas. Verifique el usuario y la contraseña del Supervisor PROAGRO o Jefe de Almacén.',
            ], 422);
        }

        // Verificar rol de Supervisor PROAGRO, Jefe de Almacén o Administrador
        $isJefe = (method_exists($user, 'hasRole') && (
                $user->hasRole('Jefe de Almacen') ||
                $user->hasRole('Jefe de Almacén') ||
                $user->hasRole('Supervisor') ||
                $user->hasRole('APT') ||
                $user->hasRole('Almacen') ||
                $user->hasRole('Almacén') ||
                $user->hasRole('Admin') ||
                $user->hasRole('admin') ||
                $user->hasRole('super-admin')
            ))
            || ($user->is_admin ?? false)
            || !$this->isEstibadorUser($user)
            || str_contains(mb_strtolower($user->position ?? ''), 'jefe')
            || str_contains(mb_strtolower($user->position ?? ''), 'supervis')
            || str_contains(mb_strtolower($user->level ?? ''), 'jefe')
            || str_contains(mb_strtolower($user->position ?? ''), 'almac')
            || str_contains(mb_strtolower($user->name ?? ''), 'admin');

        if ($this->isEstibadorUser($user)) {
            return response()->json([
                'message' => 'El usuario ingresado tiene perfil de Estibador. Se requiere autorización del Supervisor de PROAGRO o Jefe de Almacén.',
            ], 403);
        }

        $orderId = $order?->id ?? $history?->shipment_order_id;
        $orderFolio = $order?->folio ?? $history?->shipmentOrder?->folio ?? 'N/A';
        $warehouse = $order?->warehouse ?: ($history?->warehouse ?: 'Almacén');
        $assistant = $validated['assistant_name'] ?: ($history?->loading_assistant ?: ($order?->loading_assistant ?: 'Auxiliar no asignado'));

        // Un solo registro por orden: buscar si ya existe para hacer el conteo acumulado
        $incident = ShipmentSamplingIncident::where(function ($q) use ($orderId, $orderFolio) {
            if ($orderId) {
                $q->where('shipment_order_id', $orderId);
            }
            if ($orderFolio && $orderFolio !== 'N/A') {
                $q->orWhere('order_folio', $orderFolio);
            }
        })->first();

        if ($incident) {
            $currentUnlockCount = ((int) $incident->unlock_count) + 1;
            $incident->update([
                'shipment_order_id' => $orderId,
                'order_folio' => $orderFolio,
                'warehouse' => $warehouse,
                'unlocked_by_user_id' => $user->id,
                'unlocked_by_name' => $user->name,
                'assistant_name' => $assistant,
                'unlock_count' => $currentUnlockCount,
                'reason' => $validated['notes'] ?: 'Desbloqueo autorizado tras alertas por pesos fuera de tolerancia',
                'unlocked_at' => now(),
            ]);
        } else {
            $currentUnlockCount = 1;
            $incident = ShipmentSamplingIncident::create([
                'shipment_order_id' => $orderId,
                'order_folio' => $orderFolio,
                'warehouse' => $warehouse,
                'unlocked_by_user_id' => $user->id,
                'unlocked_by_name' => $user->name,
                'assistant_name' => $assistant,
                'unlock_count' => 1,
                'reason' => $validated['notes'] ?: 'Desbloqueo autorizado tras alertas por pesos fuera de tolerancia',
                'unlocked_at' => now(),
            ]);
        }

        $targetSamples = $this->getTargetSamplesCount($order);
        $samples = $history?->samples ?? $order?->samples ?? [];
        $sampleCount = count($samples);
        $statusAfterUnlock = $sampleCount >= $targetSamples ? 'completed' : ($sampleCount > 0 ? 'in_progress' : 'pending');
        $completedAtAfterUnlock = $sampleCount >= $targetSamples ? $history?->sampling_completed_at : null;

        if ($history) {
            $history->update([
                'is_sampling_blocked' => false,
                'sampling_unlock_count' => $currentUnlockCount,
                'sampling_status' => $statusAfterUnlock,
                'sampling_completed_at' => $completedAtAfterUnlock,
            ]);
        }
        if ($order) {
            $order->update([
                'is_sampling_blocked' => false,
                'sampling_unlock_count' => $currentUnlockCount,
                'sampling_status' => $statusAfterUnlock,
                'sampling_completed_at' => $completedAtAfterUnlock,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Toma de muestras desbloqueada exitosamente por {$user->name}. (Desbloqueo #{$currentUnlockCount})",
            'incident' => $this->formatIncidentItem($incident),
            'unlock_count' => $currentUnlockCount,
        ]);
    }

    public function getSamplingIncidents(Request $request)
    {
        if ($this->isEstibadorUser($request->user())) {
            return response()->json(['incidents' => []]);
        }

        $this->ensureSamplingIncidentsTable();
        $this->cleanDuplicateIncidents();

        $warehouse = $request->input('warehouse');
        $folio = $request->input('folio');

        $query = ShipmentSamplingIncident::with(['shipmentOrder', 'user'])->latest('unlocked_at');

        if ($warehouse) {
            $query->where('warehouse', 'like', "%{$warehouse}%");
        }
        if ($folio) {
            $query->where('order_folio', 'like', "%{$folio}%");
        }

        $incidents = $query->limit(100)->get()->map(fn ($inc) => $this->formatIncidentItem($inc));

        return response()->json([
            'incidents' => $incidents,
        ]);
    }

    public function getStowagePlan(Request $request, string $id)
    {
        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order && $request->filled('shipment_order_id')) {
            $order = ShipmentOrder::where('id', $request->input('shipment_order_id'))->orWhere('folio', $request->input('shipment_order_id'))->first();
        }
        if (!$order && $request->filled('folio')) {
            $order = ShipmentOrder::where('folio', $request->input('folio'))->first();
        }

        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        }
        if (!$history) {
            $history = ShipmentProcessHistory::find($id);
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }
        if (!$history && $request->filled('history_id')) {
            $history = ShipmentProcessHistory::find($request->input('history_id'));
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }

        $stowagePlan = $history?->stowage_plan ?? $order?->stowage_plan ?? null;
        $status = $history?->stowage_plan_status ?? $order?->stowage_plan_status ?? 'pending';

        return response()->json([
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => $status,
            'stowage_plan_saved_at' => ($history?->stowage_plan_saved_at ?? $order?->stowage_plan_saved_at)?->toIso8601String(),
            'stowage_plan_saved_by' => $history?->stowage_plan_saved_by ?? $order?->stowage_plan_saved_by,
        ]);
    }

    public function saveStowagePlan(Request $request, string $id)
    {
        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order && $request->filled('shipment_order_id')) {
            $order = ShipmentOrder::where('id', $request->input('shipment_order_id'))->orWhere('folio', $request->input('shipment_order_id'))->first();
        }
        if (!$order && $request->filled('folio')) {
            $order = ShipmentOrder::where('folio', $request->input('folio'))->first();
        }
        if (!$order && $request->filled('order_id')) {
            $order = ShipmentOrder::where('id', $request->input('order_id'))->orWhere('folio', $request->input('order_id'))->first();
        }

        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        }
        if (!$history) {
            $history = ShipmentProcessHistory::find($id);
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }
        if (!$history && $request->filled('history_id')) {
            $history = ShipmentProcessHistory::find($request->input('history_id'));
            if ($history && !$order) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$history && !$order) {
            return response()->json(['message' => 'No se encontró la orden ni el registro de historial de embarque.'], 404);
        }

        $existingPlan = $history?->stowage_plan ?: $order?->stowage_plan ?: [];
        if (is_string($existingPlan)) {
            $existingPlan = json_decode($existingPlan, true) ?: [];
        }

        $stowagePlan = $request->input('stowage_plan', []);
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }

        if (is_array($existingPlan) && is_array($stowagePlan)) {
            $stowagePlan = array_merge($existingPlan, $stowagePlan);
        }

        if (!isset($stowagePlan['vobo_status'])) {
            $stowagePlan['vobo_status'] = $existingPlan['vobo_status'] ?? 'pending';
        }

        $warehouseInput = $request->input('warehouse');
        if ($warehouseInput && is_numeric($warehouseInput)) {
            $warehouseInput = "Almacen {$warehouseInput}";
        }
        if ($warehouseInput && is_array($stowagePlan) && !isset($stowagePlan['warehouse'])) {
            $stowagePlan['warehouse'] = $warehouseInput;
        }

        $now = now();
        $userId = auth()->id();

        $updateData = [
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => 'completed',
            'stowage_plan_saved_at' => $now,
            'stowage_plan_saved_by' => $userId,
        ];

        // Also if stowages array has values, calculate non-empty pallets count to populate stowage_count if empty
        if (isset($stowagePlan['stowages']) && is_array($stowagePlan['stowages'])) {
            $nonEmptyStowages = collect($stowagePlan['stowages'])
                ->filter(fn($val) => !is_null($val) && ((float)$val > 0 || strtoupper((string)$val) === 'X'))
                ->count();
            if ($nonEmptyStowages > 0) {
                $updateData['stowage_count'] = $nonEmptyStowages;
            }
        }

        if ($history) {
            $history->update($updateData);
        } else if ($order && $order->lot_id) {
            $whVal = $order->warehouse ?: $warehouseInput;
            $history = ShipmentProcessHistory::create([
                'shipment_order_id' => $order->id,
                'lot_id' => $order->lot_id,
                'warehouse' => $whVal,
                'cubicle' => $order->cubicle,
                'loading_administrator' => auth()->user()?->name ?: 'Estibadores',
                'loading_squad_leader' => $order->loading_squad_leader,
                'loading_assistant' => $order->loading_assistant,
                'started_at' => $order->loaded_at ?? $now,
                'status' => 'loading',
                'stowage_plan' => $stowagePlan,
                'stowage_plan_status' => 'completed',
                'stowage_plan_saved_at' => $now,
                'stowage_plan_saved_by' => $userId,
                'stowage_count' => $updateData['stowage_count'] ?? $order->stowage_count,
            ]);
        }

        if ($order) {
            $orderUpdate = [
                'stowage_plan' => $stowagePlan,
                'stowage_plan_status' => 'completed',
                'stowage_plan_saved_at' => $now,
                'stowage_plan_saved_by' => $userId,
            ];
            if ($warehouseInput) {
                $orderUpdate['warehouse'] = $warehouseInput;
            }
            if ($order->lot_id) {
                if (!$order->loaded_at) {
                    $orderUpdate['loaded_at'] = $now;
                }
                if ($order->status === 'created' || !$order->status) {
                    $orderUpdate['status'] = 'loading';
                }
            }
            $order->update($orderUpdate);
        }

        $freshHistory = $history ? $history->fresh(['shipmentOrder.items.product', 'lot']) : null;
        $formatted = $freshHistory
            ? $this->formatProcessHistoryItem($freshHistory)
            : $this->formatLoadingHistoryItem($order->fresh(['items.product', 'lot']));

        return response()->json([
            'message' => 'Plan de estiba guardado exitosamente.',
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => 'completed',
            'stowage_plan_saved_at' => $now->toIso8601String(),
            'history' => $formatted,
        ]);
    }

    public function approveStowagePlanVoBo(Request $request, string $id)
    {
        $user = $request->user();
        if ($this->isEstibadorUser($user)) {
            return response()->json([
                'message' => 'El VoBo de la Nota de Estiba solo puede ser autorizado por personal de Supervisión PROAGRO.',
            ], 403);
        }

        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        } else {
            $history = ShipmentProcessHistory::find($id);
            if ($history) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$order && !$history) {
            return response()->json(['message' => 'Orden o registro no encontrado.'], 404);
        }

        $stowagePlan = $history?->stowage_plan ?? $order?->stowage_plan ?? [];
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }

        $now = now();
        $stowagePlan['vobo_status'] = 'approved';
        $stowagePlan['vobo_by'] = $user?->name ?? 'Supervisor PROAGRO';
        $stowagePlan['vobo_user_id'] = $user?->id;
        $stowagePlan['vobo_at'] = $now->toIso8601String();

        if ($history) {
            $history->update([
                'stowage_plan' => $stowagePlan,
                'stowage_plan_status' => 'completed',
            ]);
        }

        if ($order) {
            $order->update([
                'stowage_plan' => $stowagePlan,
                'stowage_plan_status' => 'completed',
            ]);
        }

        $formatted = $history
            ? $this->formatProcessHistoryItem($history->fresh(['shipmentOrder.items.product', 'lot']))
            : $this->formatLoadingHistoryItem($order->fresh(['items.product', 'lot']));

        return response()->json([
            'message' => 'VoBo de Nota de Estiba registrado correctamente. El personal estibador ya puede iniciar la toma de muestras.',
            'stowage_plan' => $stowagePlan,
            'item' => $formatted,
        ]);
    }

    public function loadingHistory(Request $request)
    {
        $lotId = $request->query('lot_id');
        $forEstibadores = $request->boolean('is_estibadores') || $this->isEstibadorUser($request->user());

        return response()->json($this->getLoadingHistory($lotId, $forEstibadores));
    }

    public function finishLoading(string $id)
    {
        if ($this->isEstibadorUser(auth()->user())) {
            return response()->json([
                'message' => 'La liberación de la toma de muestras solo puede realizarse por personal de Supervisión PROAGRO.',
            ], 403);
        }

        $order = ShipmentOrder::where('id', $id)->orWhere('folio', $id)->first();
        if (!$order) {
            $loadingOrder = \App\Models\LoadingOrder::where('id', $id)->orWhere('folio', $id)->first();
            if ($loadingOrder && $loadingOrder->shipment_order) {
                $order = $loadingOrder->shipment_order;
            }
        }
        $history = null;

        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        } else {
            $history = ShipmentProcessHistory::find($id);
            if ($history) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$order && !$history) {
            return response()->json(['message' => 'Orden o registro no encontrado.'], 404);
        }

        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
        $targetSamples = $targetPerEnsacadora * 2;

        // CANDADO ESTRICTO DE ENVASADO (Regla funcional 7 VECODE):
        // Permitir la liberación final de la toma de muestras únicamente cuando ambas ensacadoras hayan completado su cantidad requerida y no existan autorizaciones pendientes.
        $textToCheck = mb_strtoupper(($order?->product ?? '') . ' ' . ($order?->presentation ?? '') . ' ' . ($history?->product_text ?? '') . ' ' . ($order?->sacks_count ?? ''));
        $isEnvasado = str_contains($textToCheck, 'ENVAS') || str_contains($textToCheck, 'SACO') || str_contains($textToCheck, '25KG') || str_contains($textToCheck, '50KG') || str_contains($textToCheck, '25 KG') || str_contains($textToCheck, '50 KG') || ((int)($order?->stowage_count ?? 0) > 0) || ((int)($history?->stowage_count ?? 0) > 0);

        if ($isEnvasado) {
            $isBlocked = (bool) ($history?->is_sampling_blocked ?? $order?->is_sampling_blocked ?? false);
            if ($isBlocked) {
                return response()->json([
                    'message' => "Candado Activo: No se puede liberar la toma de muestras de la orden (" . ($order?->folio ?? 'N/A') . ") porque existe una autorización de desbloqueo pendiente por peso fuera del límite.",
                ], 422);
            }

            $samples = $history?->samples ?? $order?->samples ?? [];
            if (!is_array($samples)) {
                $samples = is_string($samples) ? (json_decode($samples, true) ?: []) : [];
            }
            $sampleCount = count($samples);
            $breakdown = $this->computeEnsacadoraSamplingBreakdown($samples, $targetPerEnsacadora);
            $hasSamplingCompleted = $breakdown['both_completed'] && (
                (!empty($order?->sampling_completed_at) && $order?->sampling_status === 'completed') ||
                (!empty($history?->sampling_completed_at) && $history?->sampling_status === 'completed')
            );

            if (!$hasSamplingCompleted) {
                $e1 = $breakdown['env1_count'];
                $e2 = $breakdown['env2_count'];
                return response()->json([
                    'message' => "Candado Activo: No se puede liberar la toma de muestras de la orden (" . ($order?->folio ?? 'N/A') . ") hasta que ambas ensacadoras hayan completado su cantidad requerida (Ensacadora 1: {$e1}/{$targetPerEnsacadora}, Ensacadora 2: {$e2}/{$targetPerEnsacadora}, Total: {$sampleCount}/{$targetSamples} muestras).",
                ], 422);
            }
        }

        $now = now();
        $stowagePlan = $history?->stowage_plan ?? $order?->stowage_plan ?? [];
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }
        if (is_array($stowagePlan)) {
            $stowagePlan['sampling_release_status'] = 'released';
            $stowagePlan['released_by'] = auth()->user()?->name ?? 'Supervisor PROAGRO';
            $stowagePlan['released_user_id'] = auth()->id();
            $stowagePlan['released_at'] = $now->toIso8601String();
        }

        if ($order) {
            $order->update([
                'status' => 'loading',
                'loading_finished_at' => $order->loading_finished_at ?? $now,
                'stowage_plan' => $stowagePlan,
            ]);
        }

        if ($history) {
            $history->update([
                'finished_at' => $history->finished_at ?? $now,
                'status' => 'completed',
                'stowage_plan' => $stowagePlan,
            ]);
        }

        return response()->json([
            'message' => 'Toma de muestras liberada y orden de embarque finalizada correctamente.',
            'item' => $history
                ? $this->formatProcessHistoryItem($history->fresh(['shipmentOrder.items.product', 'lot']))
                : $this->formatLoadingHistoryItem($order->fresh(['items.product', 'lot'])),
        ]);
    }

    public function deleteLoading(Request $request, string $id)
    {
        $order = ShipmentOrder::find($id);
        $history = null;
        if ($order) {
            $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        } else {
            $history = ShipmentProcessHistory::find($id);
            if ($history) {
                $order = $history->shipmentOrder;
            }
        }

        if (!$order && !$history) {
            $order = ShipmentOrder::where('folio', $id)->orWhere('order_number', $id)->first();
            if ($order) {
                $history = ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
            }
        }

        $isEstibador = $request->boolean('is_estibadores') || $this->isEstibadorUser($request->user());
        $stowagePlan = $history?->stowage_plan ?? $order?->stowage_plan ?? [];
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }
        $samples = $history?->samples ?? $order?->samples ?? [];
        if (!is_array($samples)) {
            $samples = is_string($samples) ? (json_decode($samples, true) ?: []) : [];
        }

        if ($isEstibador) {
            $voboApproved = ($stowagePlan['vobo_status'] ?? 'pending') === 'approved';
            if ($voboApproved || count($samples) > 0 || !empty($history?->finished_at)) {
                return response()->json([
                    'message' => 'No se puede eliminar la nota de estiba porque ya cuenta con VoBo de Supervisión PROAGRO o ya inició la toma de muestras. Solicite a Supervisión PROAGRO en APT que la libere/elimine primero.'
                ], 422);
            }

            if ($order) {
                ShipmentProcessHistory::where('shipment_order_id', $order->id)->delete();
                $order->update([
                    'lot_id' => null,
                    'loading_administrator' => null,
                    'loading_squad_leader' => null,
                    'loading_assistant' => null,
                    'loaded_at' => null,
                    'loading_finished_at' => null,
                    'status' => 'created',
                    'stowage_plan' => null,
                    'stowage_plan_status' => 'pending',
                    'stowage_plan_saved_at' => null,
                    'stowage_plan_saved_by' => null,
                ]);
            } elseif ($history) {
                $history->delete();
            }

            return response()->json(['message' => 'Nota de estiba eliminada correctamente. Puede volver a escanear la orden para realizar una nueva.']);
        }

        // Eliminación desde APT (Gestión de proceso de embarques):
        // Elimina el proceso de embarque de APT (ShipmentProcessHistory, asignación de lote, muestreo, VoBo),
        // pero CONSERVA la nota de estiba que los estibadores guardaron para que ellos puedan verla, editarla o eliminarla.
        if (is_array($stowagePlan) && !empty($stowagePlan)) {
            $stowagePlan['vobo_status'] = 'pending';
            unset($stowagePlan['vobo_by'], $stowagePlan['vobo_user_id'], $stowagePlan['vobo_at'], $stowagePlan['sampling_release_status'], $stowagePlan['released_by'], $stowagePlan['released_user_id'], $stowagePlan['released_at']);
        }

        $resetFields = [
            'lot_id' => null,
            'loading_administrator' => null,
            'loading_squad_leader' => null,
            'loading_assistant' => null,
            'loaded_at' => null,
            'loading_finished_at' => null,
            'status' => 'created',
            'samples' => null,
            'sampling_status' => 'pending',
            'sampling_completed_at' => null,
            'sampling_avg' => null,
            'stowage_plan' => !empty($stowagePlan) ? $stowagePlan : $order?->stowage_plan,
        ];
        if (Schema::hasColumn('shipment_orders', 'is_sampling_blocked')) {
            $resetFields['is_sampling_blocked'] = false;
        }

        if ($order) {
            ShipmentProcessHistory::where('shipment_order_id', $order->id)->delete();
            $order->update($resetFields);
        }

        if ($history) {
            $history->delete();
        }

        return response()->json(['message' => 'Orden eliminada de Gestión de Embarques en APT. La nota de estiba ha sido liberada para que estibadores puedan editarla o eliminarla.']);
    }

    /**
     * Regla de cálculo VECODE (Especificación del muestreo de sacos por ensacadora):
     * Muestras por ensacadora = REDONDEAR HACIA ARRIBA A PAR (TM * 40 / 36)
     * Equivalente matemático: M = 2 * CEILING(((TM * 40 / 36) / 2))
     */
    private function getTargetSamplesPerEnsacadora($order): int
    {
        if (!$order) {
            return 40;
        }
        $tons = (float) ($order->programmed_tons ?: 0);
        if ($tons <= 0 && (float) ($order->programmed_weight ?? 0) > 0) {
            $w = (float) $order->programmed_weight;
            $tons = $w > 200 ? ($w / 1000.0) : $w;
        }
        if ($tons <= 0) {
            return 40;
        }
        $perEnsacadora = (int) (2 * ceil((($tons * 40.0) / 36.0) / 2.0));
        return max(2, min(40, $perEnsacadora));
    }

    private function getTargetSamplesCount($order): int
    {
        return $this->getTargetSamplesPerEnsacadora($order) * 2;
    }

    private function computeEnsacadoraSamplingBreakdown(array $samples, int $targetPerEnsacadora): array
    {
        $env1Samples = [];
        $env2Samples = [];
        foreach ($samples as $s) {
            if (!is_array($s)) continue;
            $env = (int) ($s['ensacadora'] ?? $s['envasadora'] ?? 1);
            if ($env === 2) {
                $env2Samples[] = $s;
            } else {
                $env1Samples[] = $s;
            }
        }

        $env1Count = count($env1Samples);
        $env2Count = count($env2Samples);
        $totalCount = $env1Count + $env2Count;
        $targetTotal = $targetPerEnsacadora * 2;

        $env1Weights = collect($env1Samples)->pluck('weight')->map(fn ($w) => (float) $w)->filter(fn ($w) => $w > 0);
        $env2Weights = collect($env2Samples)->pluck('weight')->map(fn ($w) => (float) $w)->filter(fn ($w) => $w > 0);

        $env1Completed = $env1Count >= $targetPerEnsacadora;
        $env2Completed = $env2Count >= $targetPerEnsacadora;

        return [
            'env1_count' => $env1Count,
            'env2_count' => $env2Count,
            'total_count' => $totalCount,
            'env1_pending' => max(0, $targetPerEnsacadora - $env1Count),
            'env2_pending' => max(0, $targetPerEnsacadora - $env2Count),
            'total_pending' => max(0, $targetTotal - $totalCount),
            'env1_completed' => $env1Completed,
            'env2_completed' => $env2Completed,
            'both_completed' => $env1Completed && $env2Completed,
            'ensacadora_1' => [
                'ensacadora' => 1,
                'name' => 'Ensacadora 1',
                'required' => $targetPerEnsacadora,
                'completed' => $env1Count,
                'pending' => max(0, $targetPerEnsacadora - $env1Count),
                'avg' => $env1Weights->count() > 0 ? round($env1Weights->avg(), 3) : null,
                'status' => $env1Completed ? 'completed' : ($env1Count > 0 ? 'in_progress' : 'pending'),
            ],
            'ensacadora_2' => [
                'ensacadora' => 2,
                'name' => 'Ensacadora 2',
                'required' => $targetPerEnsacadora,
                'completed' => $env2Count,
                'pending' => max(0, $targetPerEnsacadora - $env2Count),
                'avg' => $env2Weights->count() > 0 ? round($env2Weights->avg(), 3) : null,
                'status' => $env2Completed ? 'completed' : ($env2Count > 0 ? 'in_progress' : 'pending'),
            ],
        ];
    }

    private function getLoadingHistory(?string $lotId = null, bool $forEstibadores = false)
    {
        $processHistories = ShipmentProcessHistory::with(['shipmentOrder.items.product', 'lot'])
            ->whereNotNull('lot_id')
            ->orderByDesc('started_at')
            ->get();

        $processedOrderIds = $processHistories->pluck('shipment_order_id')->filter()->unique()->toArray();

        $historyItems = collect();

        foreach ($processHistories as $ph) {
            $historyItems->push($this->formatProcessHistoryItem($ph));
        }

        // Incluir órdenes que tienen nota de estiba aunque hayan sido liberadas de APT
        $stowageOrders = ShipmentOrder::with(['items.product', 'lot'])
            ->whereNotIn('id', $processedOrderIds)
            ->where(function ($q) {
                $q->whereNotNull('stowage_plan')
                  ->orWhere('stowage_plan_status', 'completed')
                  ->orWhereNotNull('stowage_plan_saved_at');
            })
            ->orderByDesc('updated_at')
            ->get();

        foreach ($stowageOrders as $so) {
            $historyItems->push($this->formatLoadingHistoryItem($so));
        }

        if ($lotId) {
            $historyItems = $historyItems->filter(fn ($item) => (string)($item['lot_id'] ?? '') === (string)$lotId);
        }

        return $historyItems->values();
    }

    private function formatProcessHistoryItem(ShipmentProcessHistory $history): array
    {
        $order = $history->shipmentOrder;
        $stowagePlan = $history->stowage_plan ?: $order?->stowage_plan;
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }
        $isStowageCompleted = ($order?->stowage_plan_status === 'completed')
            || ($history->stowage_plan_status === 'completed')
            || (!empty($order?->stowage_plan) && is_array($order->stowage_plan))
            || (!empty($history->stowage_plan) && is_array($history->stowage_plan));
        $stowagePlanStatus = $isStowageCompleted ? 'completed' : ($order?->stowage_plan_status ?: ($history->stowage_plan_status ?: 'pending'));

        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
        $targetSamples = $targetPerEnsacadora * 2;
        $samples = $history->samples ?? $order?->samples ?? [];
        if (!is_array($samples)) {
            $samples = is_string($samples) ? (json_decode($samples, true) ?: []) : [];
        }
        $samplesCount = count($samples);
        $breakdown = $this->computeEnsacadoraSamplingBreakdown($samples, $targetPerEnsacadora);
        $voboStatus = is_array($stowagePlan) ? ($stowagePlan['vobo_status'] ?? ($isStowageCompleted ? 'pending' : null)) : null;
        $isInApt = ($voboStatus === 'approved') || $samplesCount > 0 || !empty($history->finished_at);

        return [
            'id' => $order ? $order->id : (string)$history->id,
            'history_id' => $history->id,
            'shipment_order_id' => $order?->id,
            'is_in_apt' => $isInApt,
            'lot_id' => $history->lot_id,
            'warehouse' => $history->lot?->warehouse ?: $history->warehouse ?: $order?->warehouse ?: ($stowagePlan['warehouse'] ?? null),
            'cubicle' => $history->lot?->cubicle ?: $history->cubicle,
            'lot_folio' => $history->lot?->folio,
            'folio' => $order?->folio ?? 'N/A',
            'order_number' => $order?->order_number,
            'operator' => $order?->operator_name ?? 'N/A',
            'squad_leader' => $history->loading_squad_leader ?? $order?->loading_squad_leader ?? 'N/A',
            'product' => $order?->product ?? $order?->items?->first()?->product?->name ?? 'N/A',
            'presentation' => $order?->presentation,
            'sacks_count' => $order?->sacks_count,
            'programmed_tons' => $order?->programmed_tons,
            'programmed_weight' => $order?->programmed_weight,
            'plates' => $order ? (collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A') : 'N/A',
            'started_at' => ($history->started_at ?? $order?->loaded_at)?->toIso8601String(),
            'finished_at' => ($history->finished_at ?? $order?->loading_finished_at)?->toIso8601String(),
            'status' => $history->status ?? $order?->status ?? 'loading',
            'stowage_count' => $history->stowage_count ?? ($stowagePlan['stowage_count'] ?? null),
            'samples' => $samples,
            'target_samples_per_ensacadora' => $targetPerEnsacadora,
            'target_samples_count' => $targetSamples,
            'ensacadora_1_summary' => $breakdown['ensacadora_1'],
            'ensacadora_2_summary' => $breakdown['ensacadora_2'],
            'sampling_completed_at' => $breakdown['both_completed'] ? ($history->sampling_completed_at ?? $order?->sampling_completed_at)?->toIso8601String() : null,
            'sampling_status' => $breakdown['both_completed'] ? ($history->sampling_status ?? 'completed') : ($samplesCount > 0 ? 'in_progress' : 'pending'),
            'sampling_avg' => $history->sampling_avg ?? $order?->sampling_avg,
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => $stowagePlanStatus,
            'stowage_plan_saved_at' => ($history->stowage_plan_saved_at ?? $order?->stowage_plan_saved_at)?->toIso8601String(),
            'stowage_plan_saved_by' => $history->stowage_plan_saved_by ?? $order?->stowage_plan_saved_by,
            'vobo_status' => $voboStatus,
            'vobo_by' => is_array($stowagePlan) ? ($stowagePlan['vobo_by'] ?? null) : null,
            'vobo_at' => is_array($stowagePlan) ? ($stowagePlan['vobo_at'] ?? null) : null,
            'sampling_release_status' => is_array($stowagePlan) ? ($stowagePlan['sampling_release_status'] ?? (!empty($history->finished_at) ? 'released' : ($breakdown['both_completed'] ? 'pending_release' : null))) : null,
            'released_by' => is_array($stowagePlan) ? ($stowagePlan['released_by'] ?? null) : null,
            'released_at' => is_array($stowagePlan) ? ($stowagePlan['released_at'] ?? null) : null,
            'loading_assistant' => $history->loading_assistant ?? $order?->loading_assistant ?? 'N/A',
            'is_sampling_blocked' => (bool) ($history->is_sampling_blocked ?? $order?->is_sampling_blocked ?? false),
            'sampling_unlock_count' => (int) ($history->sampling_unlock_count ?? $order?->sampling_unlock_count ?? 0),
        ];
    }

    private function formatLoadingHistoryItem(ShipmentOrder $order): array
    {
        $history = $order->latestProcessHistory ?? ShipmentProcessHistory::where('shipment_order_id', $order->id)->latest()->first();
        $stowagePlan = $history?->stowage_plan ?: $order->stowage_plan;
        if (is_string($stowagePlan)) {
            $stowagePlan = json_decode($stowagePlan, true) ?: [];
        }
        $isStowageCompleted = ($order->stowage_plan_status === 'completed')
            || ($history?->stowage_plan_status === 'completed')
            || (!empty($order->stowage_plan) && is_array($order->stowage_plan))
            || (!empty($history?->stowage_plan) && is_array($history->stowage_plan));
        $stowagePlanStatus = $isStowageCompleted ? 'completed' : ($order->stowage_plan_status ?: ($history?->stowage_plan_status ?: 'pending'));

        $targetPerEnsacadora = $this->getTargetSamplesPerEnsacadora($order);
        $targetSamples = $targetPerEnsacadora * 2;
        $samples = $history?->samples ?? $order->samples ?? [];
        if (!is_array($samples)) {
            $samples = is_string($samples) ? (json_decode($samples, true) ?: []) : [];
        }
        $samplesCount = count($samples);
        $breakdown = $this->computeEnsacadoraSamplingBreakdown($samples, $targetPerEnsacadora);
        $voboStatus = is_array($stowagePlan) ? ($stowagePlan['vobo_status'] ?? ($isStowageCompleted ? 'pending' : null)) : null;

        return [
            'id' => $order->id,
            'history_id' => $history?->id,
            'shipment_order_id' => $order->id,
            'is_in_apt' => ($voboStatus === 'approved') || $samplesCount > 0 || !empty($order->loading_finished_at),
            'lot_id' => $order->lot_id,
            'warehouse' => $order->lot?->warehouse ?: $order->warehouse ?: ($stowagePlan['warehouse'] ?? null),
            'cubicle' => $order->lot?->cubicle,
            'lot_folio' => $order->lot?->folio,
            'folio' => $order->folio,
            'order_number' => $order->order_number,
            'operator' => $order->operator_name ?? 'N/A',
            'squad_leader' => $order->loading_squad_leader ?? 'N/A',
            'product' => $order->product ?? $order->items->first()?->product?->name ?? 'N/A',
            'presentation' => $order->presentation,
            'sacks_count' => $order->sacks_count,
            'programmed_tons' => $order->programmed_tons,
            'programmed_weight' => $order->programmed_weight,
            'plates' => collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A',
            'started_at' => $order->loaded_at?->toIso8601String(),
            'finished_at' => $order->loading_finished_at?->toIso8601String(),
            'status' => $order->status,
            'stowage_count' => $history?->stowage_count ?? $order->stowage_count ?? ($stowagePlan['stowage_count'] ?? null),
            'samples' => $samples,
            'target_samples_per_ensacadora' => $targetPerEnsacadora,
            'target_samples_count' => $targetSamples,
            'ensacadora_1_summary' => $breakdown['ensacadora_1'],
            'ensacadora_2_summary' => $breakdown['ensacadora_2'],
            'sampling_completed_at' => $breakdown['both_completed'] ? ($history?->sampling_completed_at ?? $order->sampling_completed_at)?->toIso8601String() : null,
            'sampling_status' => $breakdown['both_completed'] ? ($history?->sampling_status ?? 'completed') : ($samplesCount > 0 ? 'in_progress' : 'pending'),
            'sampling_avg' => $history?->sampling_avg ?? $order->sampling_avg,
            'stowage_plan' => $stowagePlan,
            'stowage_plan_status' => $stowagePlanStatus,
            'stowage_plan_saved_at' => ($history?->stowage_plan_saved_at ?? $order->stowage_plan_saved_at)?->toIso8601String(),
            'stowage_plan_saved_by' => $history?->stowage_plan_saved_by ?? $order->stowage_plan_saved_by,
            'vobo_status' => $voboStatus,
            'vobo_by' => is_array($stowagePlan) ? ($stowagePlan['vobo_by'] ?? null) : null,
            'vobo_at' => is_array($stowagePlan) ? ($stowagePlan['vobo_at'] ?? null) : null,
            'sampling_release_status' => is_array($stowagePlan) ? ($stowagePlan['sampling_release_status'] ?? (!empty($order->loading_finished_at) ? 'released' : ($breakdown['both_completed'] ? 'pending_release' : null))) : null,
            'released_by' => is_array($stowagePlan) ? ($stowagePlan['released_by'] ?? null) : null,
            'released_at' => is_array($stowagePlan) ? ($stowagePlan['released_at'] ?? null) : null,
            'loading_assistant' => $history?->loading_assistant ?? $order->loading_assistant ?? 'N/A',
            'is_sampling_blocked' => (bool) ($history?->is_sampling_blocked ?? $order->is_sampling_blocked ?? false),
            'sampling_unlock_count' => (int) ($history?->sampling_unlock_count ?? $order->sampling_unlock_count ?? 0),
        ];
    }

    public function estibadoresIndex(Request $request)
    {
        $this->ensureLoadingAssistantTables();
        $this->ensureVerifierTables();

        $lots = Lot::orderBy('created_at', 'desc')->get(['id', 'folio', 'plant_origin', 'warehouse', 'cubicle']);
        $squadLeaders = $this->personalAgroindustrySquadLeaders();
        $assistants = LoadingAssistant::orderBy('name')->get(['id', 'name']);
        $verifiers = Verifier::orderBy('name')->get(['id', 'name']);
        $history = $this->getLoadingHistory(null, true);

        return Inertia::render('APT/ShipmentProcess', [
            'is_estibadores_module' => true,
            'context_module' => 'estibadores',
            'lots' => $lots,
            'squad_leaders' => $squadLeaders,
            'assistants' => $assistants,
            'verifiers' => $verifiers,
            'initial_history' => $history,
            'initial_incidents' => [],
        ]);
    }

    public function shipmentProcessIndex(Request $request)
    {
        $this->ensureLoadingAssistantTables();
        $this->ensureVerifierTables();
        $this->ensureSamplingIncidentsTable();

        $lots = Lot::orderBy('created_at', 'desc')->get(['id', 'folio', 'plant_origin', 'warehouse', 'cubicle']);
        $squadLeaders = $this->personalAgroindustrySquadLeaders();
        $assistants = LoadingAssistant::orderBy('name')->get(['id', 'name']);
        $verifiers = Verifier::orderBy('name')->get(['id', 'name']);
        
        $isEstibador = $this->isEstibadorUser($request->user());
        if ($isEstibador) {
            return redirect()->route('apt.estibadores');
        }

        $history = $this->getLoadingHistory(null, false);
        $incidents = $this->getSamplingIncidentsList();

        return Inertia::render('APT/ShipmentProcess', [
            'is_estibadores_module' => false,
            'context_module' => 'apt',
            'lots' => $lots,
            'squad_leaders' => $squadLeaders,
            'assistants' => $assistants,
            'verifiers' => $verifiers,
            'initial_history' => $history,
            'initial_incidents' => $incidents,
        ]);
    }

    private function isEstibadorUser(?\App\Models\User $user = null): bool
    {
        $user = $user ?: auth()->user();
        if (!$user) {
            return false;
        }

        $isAdmin = (method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('super-admin'))) ||
            ($user->is_admin ?? false) ||
            str_contains(strtolower($user->name ?? ''), 'admin') ||
            str_contains(strtolower($user->username ?? ''), 'admin');

        if ($isAdmin) {
            return false;
        }

        return method_exists($user, 'hasRole') && ($user->hasRole('estibador') || $user->hasRole('estibadores'));
    }

    private function personalAgroindustrySquadLeaders()
    {
        $leaders = AptAttendance::query()
            ->where(function ($query) {
                $query->whereRaw('UPPER(service_provider) LIKE ?', ['%PERSONAL PROPIO%'])
                    ->orWhereRaw('UPPER(service_provider) LIKE ?', ['%AGROINDUSTRIA%']);
            })
            ->get(['squad_leader'])
            ->flatMap(function (AptAttendance $attendance) {
                $leader = is_array($attendance->squad_leader) ? ($attendance->squad_leader[0]['name'] ?? '') : '';
                return trim((string) $leader) !== '' ? [trim((string) $leader)] : [];
            })
            ->unique(fn (string $name) => mb_strtoupper($name, 'UTF-8'))
            ->sort()
            ->values();

        if ($leaders->isEmpty()) {
            $leaders = AptAttendance::query()
                ->get(['squad_leader'])
                ->flatMap(function (AptAttendance $attendance) {
                    $leader = is_array($attendance->squad_leader) ? ($attendance->squad_leader[0]['name'] ?? '') : '';
                    return trim((string) $leader) !== '' ? [trim((string) $leader)] : [];
                })
                ->unique(fn (string $name) => mb_strtoupper($name, 'UTF-8'))
                ->sort()
                ->values();
        }

        return $leaders;
    }

    private function ensureLoadingAssistantTables(): void
    {
        if (!Schema::hasTable('loading_assistants')) {
            Schema::create('loading_assistants', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }

        if (!Schema::hasColumn('shipment_orders', 'loading_assistant')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->string('loading_assistant')->nullable()->after('loading_squad_leader');
            });
        }
    }

    private function ensureVerifierTables(): void
    {
        if (!Schema::hasTable('verifiers')) {
            Schema::create('verifiers', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }
    }

    /**
     * Helper to ensure destinations exist in the catalogue.
     */
    private function ensureDestinationsExist(...$names)
    {
        foreach ($names as $name) {
            if (empty($name)) continue;
            
            $normalized = strtoupper(trim($name));
            
            ShipmentDestination::firstOrCreate(['name' => $normalized]);
        }
    }

    private function ensureSamplingIncidentsTable(): void
    {
        if (!Schema::hasTable('shipment_sampling_incidents')) {
            Schema::create('shipment_sampling_incidents', function (Blueprint $table) {
                $table->id();
                $table->foreignUuid('shipment_order_id')->nullable()->constrained('shipment_orders')->nullOnDelete();
                $table->string('order_folio')->nullable();
                $table->string('warehouse')->nullable();
                $table->foreignId('unlocked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('unlocked_by_name')->nullable();
                $table->string('assistant_name')->nullable();
                $table->integer('unlock_count')->default(1);
                $table->text('reason')->nullable();
                $table->timestamp('unlocked_at')->nullable();
                $table->timestamps();

                $table->index('shipment_order_id');
                $table->index('order_folio');
                $table->index('unlocked_at');
            });
        }

        if (!Schema::hasColumn('shipment_process_histories', 'is_sampling_blocked')) {
            Schema::table('shipment_process_histories', function (Blueprint $table) {
                $table->boolean('is_sampling_blocked')->default(false)->after('sampling_status');
                $table->integer('sampling_unlock_count')->default(0)->after('is_sampling_blocked');
            });
        }

        if (!Schema::hasColumn('shipment_orders', 'is_sampling_blocked')) {
            Schema::table('shipment_orders', function (Blueprint $table) {
                $table->boolean('is_sampling_blocked')->default(false)->after('sampling_status');
                $table->integer('sampling_unlock_count')->default(0)->after('is_sampling_blocked');
            });
        }
    }

    private function formatIncidentItem(ShipmentSamplingIncident $incident): array
    {
        return [
            'id' => $incident->id,
            'shipment_order_id' => $incident->shipment_order_id,
            'order_folio' => $incident->order_folio ?? $incident->shipmentOrder?->folio ?? 'N/A',
            'warehouse' => $incident->warehouse ?? $incident->shipmentOrder?->warehouse ?? 'N/A',
            'unlocked_by_user_id' => $incident->unlocked_by_user_id,
            'unlocked_by_name' => $incident->unlocked_by_name ?? $incident->user?->name ?? 'Jefe de Almacén',
            'assistant_name' => $incident->assistant_name ?? 'N/A',
            'unlock_count' => (int) $incident->unlock_count,
            'reason' => $incident->reason,
            'unlocked_at' => $incident->unlocked_at?->toIso8601String(),
            'unlocked_at_formatted' => $incident->unlocked_at ? $incident->unlocked_at->timezone('America/Mexico_City')->format('d/m/Y h:i:s a') : 'N/A',
        ];
    }

    private function cleanDuplicateIncidents(): void
    {
        try {
            $all = ShipmentSamplingIncident::orderByDesc('unlocked_at')->get();
            $grouped = [];
            foreach ($all as $inc) {
                $folioKey = !empty($inc->order_folio) && $inc->order_folio !== 'N/A' ? trim($inc->order_folio) : null;
                $orderIdKey = !empty($inc->shipment_order_id) ? (string)$inc->shipment_order_id : null;
                $key = $folioKey ?: ($orderIdKey ?: ('id_' . $inc->id));
                $grouped[$key][] = $inc;
            }

            foreach ($grouped as $key => $records) {
                if (count($records) > 1) {
                    $primary = $records[0];
                    $maxUnlock = 0;
                    foreach ($records as $r) {
                        $c = (int) ($r->unlock_count ?? 1);
                        if ($c > $maxUnlock) {
                            $maxUnlock = $c;
                        }
                    }
                    $finalCount = max($maxUnlock, count($records));
                    $primary->update(['unlock_count' => $finalCount]);

                    for ($i = 1; $i < count($records); $i++) {
                        $records[$i]->delete();
                    }
                }
            }
        } catch (\Throwable $e) {
            \Log::error('Error en cleanDuplicateIncidents: ' . $e->getMessage());
        }
    }

    private function getSamplingIncidentsList(): array
    {
        $this->ensureSamplingIncidentsTable();
        $this->cleanDuplicateIncidents();

        return ShipmentSamplingIncident::with(['shipmentOrder', 'user'])
            ->latest('unlocked_at')
            ->limit(100)
            ->get()
            ->map(fn ($inc) => $this->formatIncidentItem($inc))
            ->toArray();
    }
}