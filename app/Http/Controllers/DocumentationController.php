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
use App\Models\User;
use App\Models\WeightTicket;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
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

    public function createOrder()
    {
        return Inertia::render('Documentation/Create', [
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

    /**
     * Store a newly created Shipment Order.
     */
    public function storeOrder(Request $request)
    {
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
            'transport_company' => 'nullable|string',
            'operator_name' => 'nullable|string',
            'unit_number' => 'nullable|string',
            'tractor_plate' => 'nullable|string',
            'trailer_plate' => 'nullable|string',
            'carta_porte' => 'nullable|string',
            'license_number' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'economic_number' => 'nullable|string',
            'qr_code' => 'nullable|string',
            'qr_fertinal' => 'nullable|string',
            // Shipment
            'origin_id' => 'nullable|exists:shipment_origins,id',
            'destination_id' => 'nullable|exists:shipment_destinations,id',
            'destination' => 'nullable|string',
            'product' => 'nullable|string', // Text snapshot or ID? Form implies text/select
            'presentation' => 'required|string',
            'sack_type' => 'nullable|string', // Frontend supplemental field
            'sacks_count' => 'nullable|string',
            'programmed_tons' => 'required|numeric|gt:0',
            'balance' => 'nullable', // Frontend field for shortage_balance
            'shortage_balance' => 'nullable|string',
            'documenter_name' => 'nullable|string',
            'scale_name' => 'nullable|string',
            'observations' => 'nullable|string',
            'state' => 'nullable|string',
            'scale_operator_id' => 'nullable|exists:users,id',
        ]);

        // 1. Validation: Programmed Tons <= OV Balance
        $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);
        if ($validated['programmed_tons'] > $salesOrder->balance) {
            return back()->withErrors([
                'programmed_tons' => 'El tonelaje programado (' . $validated['programmed_tons'] . ' TM) excede el saldo disponible de la Orden de Venta (' . $salesOrder->balance . ' TM).'
            ])->withInput();
        }

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

        if (!empty($validated['destination'])) {
            $this->ensureDestinationsExist($validated['destination']);
            $destination = ShipmentDestination::where('name', strtoupper(trim($validated['destination'])))->first();
            if ($destination) {
                $validated['destination_id'] = $destination->id;
            }
        }

        $order = ShipmentOrder::create($validated + ['status' => 'created']);

        // Sync Sales Order for pre-calculated totals (especially for ENVASADO)
        $salesOrder->syncLoadedQuantity();

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

        return Inertia::render('Documentation/QrPrint', [
            'operator' => $operator,
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

                return [
                    'id' => $op->id,
                    'operator_name' => $op->name,
                    'transporter_line' => $op->transport_line,
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

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('operator_name', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhere('transporter_line', 'like', "%{$search}%")
                    ->orWhere('economic_number', 'like', "%{$search}%");
            });
        }

        if ($request->has('vessel_id')) {
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

        if ($statusFilter === 'cancelled') {
            $query->where('status', 'cancelled');
        } else {
            // Active: created, loading, closed, completed
            $query->whereIn('status', ['created', 'loading', 'closed', 'completed']);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Documentation/Orders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status']),
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
     * Print the Shipment Order (Orden de Embarque) in legacy format.
     */
    public function printOrder($id)
    {
        $order = ShipmentOrder::with(['client', 'sales_order.client', 'product', 'vessel', 'transporter', 'driver', 'vehicle', 'origin', 'scale_operator'])
            ->findOrFail($id);

        // Fallback for scale_name if scale_operator exists
        if (empty($order->scale_name) && $order->scale_operator) {
            $order->scale_name = $order->scale_operator->name;
        }

        // Patch: If plates are missing, try to find them from the Operator registry (ExitOperator)
        // Check ExitOperator first as per searchOperators method
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
        }

        return Inertia::render('Documentation/Orders/Print', [
            'order' => $order->toArray() + [
                'product_code' => $productCode,
                'product_text' => $productText,
                'scale_name' => $order->scale_name ?? $order->scale_operator?->name ?? null,
            ]
        ]);
    }

    /**
     * Print the Shipment Order (Instrucción de Carga - GLS-AP-FO-001).
     */
    public function printInstruction($id)
    {
        $order = ShipmentOrder::with(['client', 'sales_order.client', 'product', 'vessel', 'transporter', 'driver', 'vehicle', 'origin', 'scale_operator'])
            ->findOrFail($id);

        if (empty($order->scale_name) && $order->scale_operator) {
            $order->scale_name = $order->scale_operator->name;
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
            'transport_company' => 'nullable|string',
            'operator_name' => 'nullable|string',
            'unit_number' => 'nullable|string',
            'tractor_plate' => 'nullable|string',
            'trailer_plate' => 'nullable|string',
            'carta_porte' => 'nullable|string',
            'license_number' => 'nullable|string',
            'unit_type' => 'nullable|string',
            'economic_number' => 'nullable|string',
            // Shipment
            'destination_id' => 'nullable|exists:shipment_destinations,id',
            'destination' => 'nullable|string',
            'product' => 'nullable|string',
            'presentation' => 'required|string',
            'sack_type' => 'nullable|string',
            'sacks_count' => 'nullable|string',
            'programmed_tons' => 'required|numeric|gt:0',
            'origin_id' => 'required',
            'balance' => 'nullable',
            'shortage_balance' => 'nullable|string',
            'observations' => 'nullable|string',
            'state' => 'nullable|string',
            // Allow Operator/Unit IDs to be updated if re-selected
            'operator_id' => 'nullable',
            'scale_operator_id' => 'nullable|exists:users,id',
        ]);

        // Validate Balance again if programmed tons changed
        if ($validated['sales_order_id'] != $order->sales_order_id || $validated['programmed_tons'] != $order->programmed_tons) {
            $salesOrder = SalesOrder::findOrFail($validated['sales_order_id']);
            // Re-calculate available balance logic if needed, simplify for update:
            // If changing amount, check against current balance + previous amount (to not double count)
            $currentAvailable = $salesOrder->balance + ($order->sales_order_id == $salesOrder->id ? $order->programmed_tons : 0);

            if ($validated['programmed_tons'] > $currentAvailable) {
                return back()->withErrors([
                    'programmed_tons' => 'El tonelaje programado excede el saldo disponible de la OV.'
                ])->withInput();
            }
        }

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

        if (!empty($validated['destination'])) {
            $this->ensureDestinationsExist($validated['destination']);
            $destination = ShipmentDestination::where('name', strtoupper(trim($validated['destination'])))->first();
            if ($destination) {
                $validated['destination_id'] = $destination->id;
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
            if (strpos($routeName, 'apt.') === 0) {
                $module = 'apt';
            } else if (strpos($routeName, 'scale.') === 0) {
                $module = 'scale';
            } else {
                $module = 'documentation';
            }
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
                'loadingOrders.weight_ticket.lot',
                'loadingOrders.lot',
            ])
            ->whereNotIn('status', ['cancelled', 'closed']);

        $inPlant = $request->input('in_plant', 'all');

        // Apply "En Planta" filter
        if ($inPlant === 'si' || $inPlant === 'yes') {
            $baseQuery->where(function ($q) {
                $q->whereHas('weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
                    ->orWhereHas('loadingOrders.weight_ticket', fn($w) => $w->where('weighing_status', '!=', 'cancelled'))
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

        // Helper: compute status and timing for ticket
        $computeStatus = function (ShipmentOrder $order) use ($resolveTicket) {
            $ticket = $resolveTicket($order);

            // A request is completed if the OE status is 'completed'
            // OR if it has a ticket that already weighed out.
            $isCompleted = ($order->status === 'completed') || ($ticket && !is_null($ticket->weigh_out_at));
            $isPending = !$isCompleted;

            $createdAt = $order->created_at?->toIso8601String();
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
                    'detail' => 'Pendiente de ingresar a báscula para pesaje de tara.',
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

            return [
                'stage' => 'in_plant',
                'label' => 'En Planta (Espera)',
                'detail' => 'Tara registrada en báscula. Esperando asignación de almacén o inicio de carga.',
                'color' => 'amber',
            ];
        };

        // Map a single order to the row format
        $mapOrder = function (ShipmentOrder $order, int $index, $activeCompanions = []) use (
            $resolveProduct, $resolveTicket, $resolveWarehouse, $computeStatus, $resolveProcessStatus
        ) {
            $timing = $computeStatus($order);
            $ticket = $resolveTicket($order);
            
            // Ticket status for pending rows - Only checkmark if ticket is NOT cancelled
            $ticketStatus = null;
            if ($timing['is_pending']) {
                $ticketStatus = ($ticket && $ticket->weighing_status !== 'cancelled') ? 'checkmark' : 'x';
            }

            // EN PLANTA resolution:
            // SÍ if it has a ticket OR if it is a companion of an active ticket OR if it has loaded/lot in APT
            $inPlant = false;
            if ($ticket && $ticket->weighing_status !== 'cancelled') {
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

            return [
                'id'                => $order->id,
                'num'               => $index + 1,
                'folio'             => $order->folio,
                'tractor_plate'     => $order->tractor_plate ?? 'N/A',
                'operator_name'     => $order->operator_name ?? 'N/A',
                'unit_type'         => $unitType,
                'transport_company' => $order->transport_company ?? 'N/A',
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

        if ($order->lot_id) {
            return response()->json([
                'error' => "La orden de embarque {$order->folio} ya está registrada en el historial.",
            ], 409);
        }

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
            'order' => [
                'id' => $order->id,
                'folio' => $order->folio,
                'operator_name' => $order->operator_name,
                'tractor_plate' => $order->tractor_plate,
                'trailer_plate' => $order->trailer_plate,
                'client' => $order->client?->business_name ?? $order->client?->name,
                'product' => $order->product ?? $order->items->first()?->product?->name,
                'warehouse' => $order->warehouse
                    ?: $order->loadingOrders->firstWhere('warehouse', '!=', null)?->warehouse,
            ],
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
            'loaded_at' => 'nullable|date',
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

        $administrator = $request->user()?->name ?: $request->user()?->username ?: 'Administrador';

        $order->update([
            'lot_id' => $validated['lot_id'],
            'warehouse' => $validated['warehouse'],
            'loading_administrator' => $administrator,
            'loading_squad_leader' => $validated['squad_leader'] ?? null,
            'loading_assistant' => $validated['loading_assistant'] ?? null,
            'loaded_at' => now(),
            'status' => 'loading',
        ]);

        return response()->json([
            'message' => 'Embarque guardado correctamente.',
            'administrator' => $administrator,
        ]);
    }

    public function loadingHistory(Request $request)
    {
        $lotId = $request->query('lot_id');

        return response()->json($this->getLoadingHistory($lotId));
    }

    public function finishLoading(string $id)
    {
        $order = ShipmentOrder::whereNotNull('lot_id')->findOrFail($id);
        $order->update([
            'status' => 'loading',
            'loading_finished_at' => now(),
        ]);

        return response()->json([
            'message' => 'Orden de embarque finalizada correctamente.',
            'item' => $this->formatLoadingHistoryItem($order->fresh(['items.product'])),
        ]);
    }

    public function deleteLoading(string $id)
    {
        $order = ShipmentOrder::whereNotNull('lot_id')->findOrFail($id);
        $order->update([
            'lot_id' => null,
            'warehouse' => null,
            'loading_administrator' => null,
            'loading_squad_leader' => null,
            'loading_assistant' => null,
            'loaded_at' => null,
            'loading_finished_at' => null,
            'status' => 'created',
        ]);

        $order->refresh();

        return response()->json(['message' => 'Registro eliminado del historial.']);
    }

    private function getLoadingHistory(?string $lotId = null)
    {
        $query = ShipmentOrder::with(['items.product', 'lot'])
            ->whereNotNull('lot_id');

        if ($lotId) {
            $query->where('lot_id', $lotId);
        }

        return $query->orderByDesc('loaded_at')
            ->get()
            ->map(fn (ShipmentOrder $order) => $this->formatLoadingHistoryItem($order))
            ->values();
    }

    private function formatLoadingHistoryItem(ShipmentOrder $order): array
    {
        return [
            'id' => $order->id,
            'lot_id' => $order->lot_id,
            'warehouse' => $order->warehouse ?: $order->lot?->warehouse,
            'cubicle' => $order->lot?->cubicle,
            'lot_folio' => $order->lot?->folio,
            'folio' => $order->folio,
            'operator' => $order->operator_name ?? 'N/A',
            'squad_leader' => $order->loading_squad_leader ?? 'N/A',
            'product' => $order->product ?? $order->items->first()?->product?->name ?? 'N/A',
            'plates' => collect([$order->tractor_plate, $order->trailer_plate])->filter()->implode(' / ') ?: 'N/A',
            'started_at' => $order->loaded_at?->toIso8601String(),
            'finished_at' => $order->loading_finished_at?->toIso8601String(),
            'status' => $order->status,
        ];
    }

    public function shipmentProcessIndex(Request $request)
    {
        $this->ensureLoadingAssistantTables();

        $lots = Lot::orderBy('created_at', 'desc')->get(['id', 'folio', 'plant_origin', 'warehouse', 'cubicle']);
        $squadLeaders = $this->personalAgroindustrySquadLeaders();
        $assistants = LoadingAssistant::orderBy('name')->get(['id', 'name']);
        $history = $this->getLoadingHistory();

        return Inertia::render('APT/ShipmentProcess', [
            'lots' => $lots,
            'squad_leaders' => $squadLeaders,
            'assistants' => $assistants,
            'initial_history' => $history,
        ]);
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
}