<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Vessel;
use App\Models\VesselOperator;
use App\Models\LoadingOrder;
use App\Models\AptScan;
use App\Models\WeightTicket;
use App\Models\User;
use App\Models\Lot;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Helpers\OperationalTimeHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class AptController extends Controller
{
    public function index()
    {
        return Inertia::render('APT/Index');
    }

    public function production()
    {
        return Inertia::render('APT/Index', ['productionMode' => true]);
    }

    public function productionHub()
    {
        return view('production.hub');
    }

    public function productionManagement(Request $request)
    {
        $authUser = auth()->user();
        $isJefeOrAdmin = $this->isWarehouseChief($authUser);

        if (!$isJefeOrAdmin) {
            return redirect()->route('apt.management.activity');
        }

        if ($request->boolean('activity')) {
            $registrationQuery = \App\Models\ProductionShiftStart::with(['user:id,name', 'lot:id,folio,plant_origin,warehouse', 'lots:id,folio,plant_origin,warehouse'])
                ->where('shift', $request->input('shift'))
                ->where('lot_id', $request->input('lot'));

            $registration = $registrationQuery->latest('started_at')->first();

            return $this->productionActivityView($registration, $request);
        }

        $users = User::with('roles')
            ->where(function ($query) {
                $query->where('level', 'like', '%Almac%')
                    ->orWhere('position', 'like', '%Almac%')
                    ->orWhereHas('roles', function ($roleQuery) {
                        $roleQuery->where('name', 'like', '%Almac%')
                            ->orWhere('name', 'like', '%APT%')
                            ->orWhere('name', 'like', '%Operad%');
                    });
            })
            ->where(function ($query) {
                $query->where('is_blocked', false)->orWhereNull('is_blocked');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'position', 'level']);

        if ($users->isEmpty()) {
            $users = User::with('roles')
                ->where(function ($query) {
                    $query->where('is_blocked', false)->orWhereNull('is_blocked');
                })
                ->orderBy('name')
                ->get(['id', 'name', 'position', 'level']);
        }

        $authUser = auth()->user();
        $isJefeOrAdmin = $this->isWarehouseChief($authUser);
        $canManageShift = (bool) $isJefeOrAdmin;

        if ($isJefeOrAdmin) {
            $lots = Lot::orderBy('created_at', 'desc')->get(['id', 'folio', 'plant_origin', 'warehouse']);
            $latestRegistration = \App\Models\ProductionShiftStart::with(['user:id,name', 'lot:id,folio', 'lots:id,folio'])
                ->latest('started_at')
                ->first();
        } else {
            $latestRegistration = \App\Models\ProductionShiftStart::with(['user:id,name', 'lot:id,folio', 'lots:id,folio'])
                ->where('user_id', $authUser?->id)
                ->latest('started_at')
                ->first();
            $lots = $latestRegistration?->lots?->isNotEmpty()
                ? $latestRegistration->lots
                : collect();
            $users = $users->where('id', $authUser?->id)->values();
            if ($users->isEmpty() && $authUser) {
                $users = collect([$authUser]);
            }
        }

        return view('production.management', compact('users', 'lots', 'latestRegistration', 'canManageShift'));
    }

    public function storeProductionShiftStart(Request $request)
    {
        $authUser = auth()->user();
        $isJefeOrAdmin = $this->isWarehouseChief($authUser);

        if (!$isJefeOrAdmin) {
            return response()->json([
                'message' => 'Solo el Jefe de Almacén tiene autorización para iniciar o modificar la generación de lote.',
                'errors' => ['role' => ['Solo el Jefe de Almacén tiene autorización para iniciar o modificar la generación de lote.']]
            ], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'position' => 'required|string|max:100',
            'shift' => 'required|string|in:Turno 1,Turno 2,Turno 3,Turno 1A,Turno 1B',
            'lot_id' => 'nullable|exists:lots,id',
            'lot_ids' => 'required|array|min:1',
            'lot_ids.*' => 'exists:lots,id',
            'evidence' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $selectedLotIds = array_values(array_unique($validated['lot_ids']));

        // Check if user currently has any of the selected lots open (based on the latest assignment of each lot)
        $latestAssignments = DB::table('production_shift_start_lot as assignment')
            ->join('production_shift_starts as shift_start', 'shift_start.id', '=', 'assignment.production_shift_start_id')
            ->join('lots', 'lots.id', '=', 'assignment.lot_id')
            ->where('shift_start.user_id', $validated['user_id'])
            ->whereIn('assignment.lot_id', $selectedLotIds)
            ->select([
                'assignment.lot_id',
                'lots.folio',
                'assignment.status',
                'assignment.closed_at',
                'shift_start.started_at',
            ])
            ->orderByDesc('shift_start.started_at')
            ->get()
            ->groupBy('lot_id')
            ->map(fn ($group) => $group->first());

        $alreadyAssignedFolios = $latestAssignments
            ->filter(fn ($assignment) => $assignment->status !== 'closed' && is_null($assignment->closed_at))
            ->pluck('folio')
            ->unique()
            ->values();

        if ($alreadyAssignedFolios->isNotEmpty()) {
            throw ValidationException::withMessages([
                'lot_ids' => 'El usuario ya tiene asignado el lote: ' . $alreadyAssignedFolios->implode(', ') . '. Cierra ese lote antes de volver a asignarlo.',
            ]);
        }

        if (count($selectedLotIds) !== count($validated['lot_ids'])) {
            throw ValidationException::withMessages([
                'lot_ids' => 'No puedes seleccionar el mismo lote más de una vez en la misma asignación.',
            ]);
        }

        $evidencePath = $request->hasFile('evidence')
            ? $request->file('evidence')->store('production-shifts', 'public')
            : null;

        $selectedUser = User::with('roles')->findOrFail($validated['user_id']);
        $position = $selectedUser->position ?: ($selectedUser->level ?: 'Almacén');

        $registration = \App\Models\ProductionShiftStart::create([
            'user_id' => $validated['user_id'],
            'position' => $position,
            'started_at' => now(),
            'shift' => $validated['shift'],
            'lot_id' => $validated['lot_ids'][0],
            'evidence_path' => $evidencePath,
        ]);
        $registration->lots()->sync($validated['lot_ids']);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Inicio de turno registrado correctamente.',
                'redirect_url' => route('apt.management.activity', ['shift_id' => $registration->id]),
            ]);
        }

        return redirect()->route('apt.management.activity', ['shift_id' => $registration->id])
            ->with('production_shift_id', $registration->id)
            ->with('success', 'Inicio de turno registrado correctamente.');
    }

    public function productionActivity(Request $request)
    {
        $this->ensureProductionActivityTable();
        $authUser = auth()->user();
        $isJefeOrAdmin = $this->isWarehouseChief($authUser);
        $registrationQuery = \App\Models\ProductionShiftStart::with(['user:id,name', 'lot:id,folio,plant_origin,warehouse', 'lots:id,folio,plant_origin,warehouse']);

        $registration = null;
        if ($request->filled('shift_id')) {
            $registration = (clone $registrationQuery)->find($request->input('shift_id'));
        }

        if (!$registration && session('production_shift_id')) {
            $registration = (clone $registrationQuery)->find(session('production_shift_id'));
        }

        if (!$registration) {
            if ($isJefeOrAdmin) {
                $registration = (clone $registrationQuery)->latest('started_at')->first();
            } else {
                $registration = (clone $registrationQuery)
                    ->where('user_id', $authUser?->id)
                    ->whereHas('lots', function ($lotQuery) {
                        $lotQuery->where(function ($q) {
                            $q->where('production_shift_start_lot.status', 'open')
                                ->orWhereNull('production_shift_start_lot.status');
                        })->whereNull('production_shift_start_lot.closed_at');
                    })
                    ->latest('started_at')
                    ->first();
            }
        } elseif (!$isJefeOrAdmin) {
            if ((int) $registration->user_id !== (int) $authUser?->id) {
                $registration = null;
            } else {
                $hasOpenLot = $registration->lots()->where(function ($q) {
                    $q->where('production_shift_start_lot.status', 'open')
                        ->orWhereNull('production_shift_start_lot.status');
                })->whereNull('production_shift_start_lot.closed_at')->exists();

                if (!$hasOpenLot) {
                    $registration = null;
                }
            }
        }

        return $this->productionActivityView($registration, $request);
    }

    public function checkAssignedLots(Request $request)
    {
        $authUser = auth()->user();
        if (!$authUser) {
            return response()->json(['has_active_lots' => false]);
        }

        $activeShift = \App\Models\ProductionShiftStart::with(['lots' => function ($q) {
            $q->where(function ($sub) {
                $sub->where('production_shift_start_lot.status', 'open')
                    ->orWhereNull('production_shift_start_lot.status');
            })->whereNull('production_shift_start_lot.closed_at');
        }])
        ->where('user_id', $authUser->id)
        ->whereHas('lots', function ($lotQuery) {
            $lotQuery->where(function ($q) {
                $q->where('production_shift_start_lot.status', 'open')
                    ->orWhereNull('production_shift_start_lot.status');
            })->whereNull('production_shift_start_lot.closed_at');
        })
        ->latest('started_at')
        ->first();

        if ($activeShift && $activeShift->lots->isNotEmpty()) {
            $firstLot = $activeShift->lots->first();
            return response()->json([
                'has_active_lots' => true,
                'shift_id' => $activeShift->id,
                'lot_id' => $firstLot->id,
                'redirect_url' => route('apt.management.activity', ['shift_id' => $activeShift->id, 'lot_id' => $firstLot->id]),
            ]);
        }

        return response()->json([
            'has_active_lots' => false,
        ]);
    }

    public function storeProductionActivity(Request $request)
    {
        $this->ensureProductionActivityTable();
        $validated = $request->validate([
            'production_shift_start_id' => 'required|exists:production_shift_starts,id',
            'type' => 'required|in:incidencia,relevancia',
            'description' => 'required|string|max:5000',
            'location' => 'nullable|string|max:120',
            'occurred_at' => 'nullable|date_format:Y-m-d H:i:s',
            'evidence' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $shiftStart = \App\Models\ProductionShiftStart::findOrFail($validated['production_shift_start_id']);
        $authUser = auth()->user();
        if (!$this->isWarehouseChief($authUser) && (int) $shiftStart->user_id !== (int) $authUser?->id && !$authUser?->can('view apt')) {
            abort(403, 'Solo puedes registrar actividades del lote que te asignó el Jefe de Almacén.');
        }

        $evidencePath = $request->file('evidence')->store('production-activities', 'public');

        \App\Models\ProductionShiftActivity::create([
            'production_shift_start_id' => $validated['production_shift_start_id'],
            'user_id' => auth()->id(),
            'type' => $validated['type'],
            'description' => $validated['description'],
            'location' => $validated['location'] ?? null,
            'evidence_path' => $evidencePath,
            'occurred_at' => $validated['occurred_at'] ?? now(),
        ]);

        return back()->with('success', 'Actividad guardada correctamente.');
    }

    public function closeProductionLot(Request $request, int $shiftStart, string $lot)
    {
        $authUser = auth()->user();
        if (!$this->isWarehouseChief($authUser)) {
            abort(403, 'Solo el Jefe de Almacén puede cerrar un lote.');
        }

        $registration = \App\Models\ProductionShiftStart::findOrFail($shiftStart);
        $lotIsAssigned = $registration->lots()->where('lots.id', $lot)->exists();
        if (!$lotIsAssigned) {
            abort(404, 'El lote no pertenece a esta asignación.');
        }

        $now = now();

        DB::table('production_shift_start_lot as assignment')
            ->join('production_shift_starts as shift_start', 'shift_start.id', '=', 'assignment.production_shift_start_id')
            ->where('shift_start.user_id', $registration->user_id)
            ->where('assignment.lot_id', $lot)
            ->update([
                'assignment.status' => 'closed',
                'assignment.closed_at' => $now,
                'assignment.closed_by' => $authUser->id,
            ]);

        DB::table('production_shift_start_lot')
            ->where('production_shift_start_id', $registration->id)
            ->where('lot_id', $lot)
            ->update([
                'status' => 'closed',
                'closed_at' => $now,
                'closed_by' => $authUser->id,
            ]);

        $message = 'Lote cerrado para esta asignación. Puede volver a asignarse en un nuevo ciclo.';
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'status' => 'closed',
                'closed_at' => $now->toISOString(),
                'closed_by_name' => $authUser->name,
            ]);
        }

        return back()->with('success', $message);
    }

    public function reopenProductionLot(Request $request, int $shiftStart, string $lot)
    {
        $authUser = auth()->user();
        if (!$this->isWarehouseChief($authUser)) {
            abort(403, 'Solo el Jefe de Almacén puede reabrir un lote.');
        }

        $registration = \App\Models\ProductionShiftStart::findOrFail($shiftStart);
        $lotIsAssigned = $registration->lots()->where('lots.id', $lot)->exists();
        if (!$lotIsAssigned) {
            abort(404, 'El lote no pertenece a esta asignación.');
        }

        DB::table('production_shift_start_lot')
            ->where('production_shift_start_id', $registration->id)
            ->where('lot_id', $lot)
            ->update([
                'status' => 'open',
                'closed_at' => null,
                'closed_by' => null,
            ]);

        $message = 'Lote reabierto para esta asignación.';
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'status' => 'open',
                'closed_at' => null,
                'closed_by_name' => null,
            ]);
        }

        return back()->with('success', $message);
    }

    private function isWarehouseChief($user): bool
    {
        return (bool) ($user && ($user->hasRole('Jefe de Almacen') || $user->hasRole('Jefe de Almacén') || $user->hasRole('Admin') || ($user->is_admin ?? false)));
    }

    private function productionActivityView(?\App\Models\ProductionShiftStart $registration, Request $request)
    {
        $this->ensureProductionActivityTable();
        $activityType = $request->input('activity_type', 'all');
        $activityDate = $request->input('activity_date');
        $selectedLotId = $request->input('lot_id');

        if (!$selectedLotId && $registration) {
            $selectedLots = ($registration->lots->isNotEmpty() ? $registration->lots : collect([$registration->lot]))
                ->filter()
                ->sortBy(fn ($lot) => (string) $lot->folio)
                ->values();

            if ($selectedLots->count() === 1) {
                $selectedLotId = $selectedLots->first()?->id;
            }
        }

        if (!$selectedLotId) {
            $activities = collect();
            $canCloseLot = $this->isWarehouseChief(auth()->user());
            return view('production.activity', compact('registration', 'activities', 'activityType', 'activityDate', 'selectedLotId', 'canCloseLot'));
        }

        $activitiesQuery = \App\Models\ProductionShiftActivity::with(['user:id,name', 'shiftStart.lot', 'shiftStart.lots']);

        $activitiesQuery->whereHas('shiftStart', function ($query) use ($selectedLotId) {
            $query->where('lot_id', $selectedLotId)
                ->orWhereHas('lots', function ($lotQuery) use ($selectedLotId) {
                    $lotQuery->where('lots.id', $selectedLotId);
                });
        });

        if (in_array($activityType, ['incidencia', 'relevancia'], true)) {
            $activitiesQuery->where('type', $activityType);
        }

        if ($activityDate) {
            $activitiesQuery->whereDate('occurred_at', $activityDate);
        }

        $activities = $activitiesQuery->latest('occurred_at')->get();
        $canCloseLot = $this->isWarehouseChief(auth()->user());

        return view('production.activity', compact('registration', 'activities', 'activityType', 'activityDate', 'selectedLotId', 'canCloseLot'));
    }

    public function printProductionActivityReport(Request $request)
    {
        $this->ensureProductionActivityTable();
        $authUser = auth()->user();
        $registrationQuery = \App\Models\ProductionShiftStart::with(['user:id,name', 'lot:id,folio,plant_origin,warehouse', 'lots:id,folio,plant_origin,warehouse']);

        $registration = null;
        if ($request->filled('shift_id')) {
            $registration = (clone $registrationQuery)->find($request->input('shift_id'));
        }
        if (!$registration) {
            $isJefeOrAdmin = $this->isWarehouseChief($authUser);
            if ($isJefeOrAdmin) {
                $registration = (clone $registrationQuery)->latest('started_at')->first();
            } else {
                $userShift = (clone $registrationQuery)->where('user_id', $authUser?->id)->latest('started_at')->first();
                $registration = $userShift ?: (clone $registrationQuery)->latest('started_at')->first();
            }
        }

        $activityType = $request->input('activity_type', 'all');
        $activityDate = $request->input('activity_date');
        $selectedLotId = $request->input('lot_id');

        $activitiesQuery = \App\Models\ProductionShiftActivity::with(['user:id,name', 'shiftStart.lot', 'shiftStart.lots']);

        if ($selectedLotId) {
            $activitiesQuery->whereHas('shiftStart', function ($query) use ($selectedLotId) {
                $query->where('lot_id', $selectedLotId)
                    ->orWhereHas('lots', function ($lotQuery) use ($selectedLotId) {
                        $lotQuery->where('lots.id', $selectedLotId);
                    });
            });
        }

        if (in_array($activityType, ['incidencia', 'relevancia'], true)) {
            $activitiesQuery->where('type', $activityType);
        }

        if ($activityDate) {
            $activitiesQuery->whereDate('occurred_at', $activityDate);
        }

        $activities = $activitiesQuery->latest('occurred_at')->get();

        return view('production.print-activity-report', compact('registration', 'activities', 'activityType', 'activityDate'));
    }

    public function lotsReport(Request $request)
    {
        $this->ensureProductionActivityTable();
        $lots = Lot::orderBy('folio')->get(['id', 'folio']);

        $rawLotIds = $request->input('lot_ids', $request->input('lot_id'));
        $lotIds = [];
        if (is_array($rawLotIds)) {
            $lotIds = array_values(array_filter($rawLotIds, fn($v) => $v !== 'all' && !empty($v)));
        } elseif (is_string($rawLotIds) && $rawLotIds !== 'all' && !empty($rawLotIds)) {
            $lotIds = array_values(array_filter(explode(',', $rawLotIds)));
        }

        $shiftFilter = $request->input('shift', 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $hasFilters = !empty($lotIds)
            || ($request->filled('shift') && $shiftFilter !== 'all')
            || $request->filled('date_from')
            || $request->filled('date_to');

        $query = \App\Models\ProductionShiftActivity::with(['user:id,name', 'shiftStart.lot', 'shiftStart.user']);

        if (!empty($lotIds)) {
            $query->whereHas('shiftStart', function ($q) use ($lotIds) {
                $q->whereIn('lot_id', $lotIds)
                    ->orWhereHas('lots', function ($lotQuery) use ($lotIds) {
                        $lotQuery->whereIn('lots.id', $lotIds);
                    });
            });
        }
        if ($request->filled('shift') && $shiftFilter !== 'all') {
            $query->whereHas('shiftStart', function ($q) use ($shiftFilter) {
                $q->where('shift', $shiftFilter);
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('occurred_at', '>=', $dateFrom);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('occurred_at', '<=', $dateTo);
        }

        $activities = $hasFilters ? $query->orderBy('occurred_at', 'desc')->get() : collect();

        return view('production.lots-report', compact('activities', 'lots', 'lotIds', 'shiftFilter', 'dateFrom', 'dateTo', 'hasFilters'));
    }

    public function assignmentsReport(Request $request)
    {
        $status = $request->input('status', 'all');
        $search = trim((string) $request->input('search', ''));

        $query = DB::table('production_shift_start_lot as assignment')
            ->join('production_shift_starts as shift_start', 'shift_start.id', '=', 'assignment.production_shift_start_id')
            ->join('users', 'users.id', '=', 'shift_start.user_id')
            ->join('lots', 'lots.id', '=', 'assignment.lot_id')
            ->leftJoin('users as closed_users', 'closed_users.id', '=', 'assignment.closed_by')
            ->select([
                'assignment.production_shift_start_id',
                'assignment.lot_id',
                DB::raw("CASE WHEN assignment.status = 'closed' OR assignment.closed_at IS NOT NULL THEN 'closed' ELSE 'open' END as status"),
                'assignment.closed_at',
                'shift_start.started_at',
                'shift_start.shift',
                'users.name as user_name',
                'lots.folio',
                'lots.warehouse',
                'closed_users.name as closed_by_name',
            ])
            ->when(in_array($status, ['open', 'closed'], true), fn ($q) => $q->where('assignment.status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('users.name', 'like', "%{$search}%")
                        ->orWhere('lots.folio', 'like', "%{$search}%")
                        ->orWhere('shift_start.shift', 'like', "%{$search}%");
                });
            })
            ->orderBy('users.name')
            ->orderByDesc('shift_start.started_at')
            ->orderBy('lots.folio');

        $assignments = $query->get();
        $userAssignments = $assignments
            ->groupBy('user_name')
            ->map(function ($userLots, $userName) {
                $orderedLots = $userLots->sortByDesc('started_at')->values();

                return [
                    'user_name' => $userName,
                    'latest_started_at' => $orderedLots->first()?->started_at,
                    'lots' => $orderedLots,
                ];
            })
            ->sortByDesc('latest_started_at')
            ->values();
        $summary = [
            'users' => $userAssignments->count(),
            'total' => $assignments->count(),
            'open' => $assignments->where('status', 'open')->count(),
            'closed' => $assignments->where('status', 'closed')->count(),
        ];

        return view('production.assignments-report', compact('userAssignments', 'summary', 'status', 'search'));
    }

    public function assignmentsControl(Request $request)
    {
        $authUser = auth()->user();
        if (!$this->isWarehouseChief($authUser)) {
            abort(403, 'Solo el Jefe de Almacén o Administrador puede acceder al control de asignaciones.');
        }

        $statusFilter = $request->input('status', 'all');
        $search = trim((string) $request->input('search', ''));

        $query = DB::table('production_shift_start_lot as assignment')
            ->join('production_shift_starts as shift_start', 'shift_start.id', '=', 'assignment.production_shift_start_id')
            ->join('users', 'users.id', '=', 'shift_start.user_id')
            ->join('lots', 'lots.id', '=', 'assignment.lot_id')
            ->leftJoin('users as closed_users', 'closed_users.id', '=', 'assignment.closed_by')
            ->select([
                'assignment.production_shift_start_id',
                'assignment.lot_id',
                DB::raw("CASE WHEN assignment.status = 'closed' OR assignment.closed_at IS NOT NULL THEN 'closed' ELSE 'open' END as status"),
                'assignment.closed_at',
                'shift_start.started_at',
                'shift_start.shift',
                'users.id as user_id',
                'users.name as user_name',
                'lots.folio as lot_folio',
                'lots.warehouse',
                'lots.plant_origin',
                'closed_users.name as closed_by_name',
            ])
            ->whereNotNull('lots.folio')
            ->whereRaw("UPPER(TRIM(lots.folio)) NOT IN ('ABIERTO', 'CERRADO')");

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('users.name', 'like', "%{$search}%")
                    ->orWhere('lots.folio', 'like', "%{$search}%")
                    ->orWhere('shift_start.shift', 'like', "%{$search}%")
                    ->orWhere('lots.warehouse', 'like', "%{$search}%");
            });
        }

        if (in_array($statusFilter, ['open', 'closed'], true)) {
            if ($statusFilter === 'closed') {
                $query->where(function ($q) {
                    $q->where('assignment.status', 'closed')
                        ->orWhereNotNull('assignment.closed_at');
                });
            } else {
                $query->where(function ($q) {
                    $q->where('assignment.status', 'open')
                        ->orWhereNull('assignment.status');
                })->whereNull('assignment.closed_at');
            }
        }

        $query->orderBy('users.name')
            ->orderByDesc('shift_start.started_at')
            ->orderBy('lots.folio');

        $rawAssignments = $query->get();

        $assignments = $rawAssignments
            ->groupBy('user_name')
            ->map(function ($userLots, $userName) {
                $latestByLot = $userLots
                    ->sortByDesc('started_at')
                    ->unique('lot_id')
                    ->values();

                $sortedLots = $latestByLot->sort(function ($a, $b) {
                    if ($a->status !== $b->status) {
                        return $a->status === 'open' ? -1 : 1;
                    }
                    return strcmp((string) $b->started_at, (string) $a->started_at);
                })->values();

                return [
                    'user_name' => $userName,
                    'lots' => $sortedLots,
                    'has_open' => $sortedLots->contains(fn ($l) => $l->status === 'open'),
                ];
            })
            ->sort(function ($a, $b) {
                if ($a['has_open'] !== $b['has_open']) {
                    return $a['has_open'] ? -1 : 1;
                }
                $aTime = $a['lots']->first()?->started_at ?? '';
                $bTime = $b['lots']->first()?->started_at ?? '';
                return strcmp((string) $bTime, (string) $aTime);
            })
            ->values();

        $allAssignedLots = $assignments->flatMap(fn ($a) => $a['lots']);
        $summary = [
            'users' => $assignments->count(),
            'total' => $allAssignedLots->count(),
            'open' => $allAssignedLots->where('status', 'open')->count(),
            'closed' => $allAssignedLots->where('status', 'closed')->count(),
        ];

        return view('production.assignments-control', compact('assignments', 'statusFilter', 'search', 'summary'));
    }

    public function printLotsReport(Request $request)
    {
        $this->ensureProductionActivityTable();
        $rawLotIds = $request->input('lot_ids', $request->input('lot_id'));
        $lotIds = [];
        if (is_array($rawLotIds)) {
            $lotIds = array_values(array_filter($rawLotIds, fn($v) => $v !== 'all' && !empty($v)));
        } elseif (is_string($rawLotIds) && $rawLotIds !== 'all' && !empty($rawLotIds)) {
            $lotIds = array_values(array_filter(explode(',', $rawLotIds)));
        }

        $shiftFilter = $request->input('shift', 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = \App\Models\ProductionShiftActivity::with(['user:id,name', 'shiftStart.lot', 'shiftStart.user']);

        $selectedLots = collect();
        if (!empty($lotIds)) {
            $query->whereHas('shiftStart', function ($q) use ($lotIds) {
                $q->whereIn('lot_id', $lotIds)
                    ->orWhereHas('lots', function ($lotQuery) use ($lotIds) {
                        $lotQuery->whereIn('lots.id', $lotIds);
                    });
            });
            $selectedLots = Lot::whereIn('id', $lotIds)->get();
        }
        if ($request->filled('shift') && $shiftFilter !== 'all') {
            $query->whereHas('shiftStart', function ($q) use ($shiftFilter) {
                $q->where('shift', $shiftFilter);
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('occurred_at', '>=', $dateFrom);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('occurred_at', '<=', $dateTo);
        }

        $activities = $query->orderBy('occurred_at', 'desc')->get();

        return view('production.print-lots-report', compact('activities', 'selectedLots', 'lotIds', 'shiftFilter', 'dateFrom', 'dateTo'));
    }

    public function exportLotsReport(Request $request)
    {
        $this->ensureProductionActivityTable();
        $rawLotIds = $request->input('lot_ids', $request->input('lot_id'));
        $lotIds = [];
        if (is_array($rawLotIds)) {
            $lotIds = array_values(array_filter($rawLotIds, fn($v) => $v !== 'all' && !empty($v)));
        } elseif (is_string($rawLotIds) && $rawLotIds !== 'all' && !empty($rawLotIds)) {
            $lotIds = array_values(array_filter(explode(',', $rawLotIds)));
        }

        $shiftFilter = $request->input('shift', 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = \App\Models\ProductionShiftActivity::with(['user:id,name', 'shiftStart.lot', 'shiftStart.user']);

        if (!empty($lotIds)) {
            $query->whereHas('shiftStart', function ($q) use ($lotIds) {
                $q->whereIn('lot_id', $lotIds)
                    ->orWhereHas('lots', function ($lotQuery) use ($lotIds) {
                        $lotQuery->whereIn('lots.id', $lotIds);
                    });
            });
        }
        if ($request->filled('shift') && $shiftFilter !== 'all') {
            $query->whereHas('shiftStart', function ($q) use ($shiftFilter) {
                $q->where('shift', $shiftFilter);
            });
        }
        if ($request->filled('date_from')) {
            $query->whereDate('occurred_at', '>=', $dateFrom);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('occurred_at', '<=', $dateTo);
        }

        $activities = $query->orderBy('occurred_at', 'desc')->get();

        $filename = 'reporte_lotes_' . date('Ymd_His') . '.xlsx';

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ProductionLotsExport($activities),
            $filename
        );
    }

    private function ensureProductionActivityTable(): void
    {
        if (Schema::hasTable('production_shift_activities')) {
            return;
        }

        Schema::create('production_shift_activities', function ($table) {
            $table->id();
            $table->foreignId('production_shift_start_id')->constrained('production_shift_starts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->string('type', 20);
            $table->text('description');
            $table->string('location')->nullable();
            $table->string('evidence_path')->nullable();
            $table->dateTime('occurred_at');
            $table->timestamps();
            $table->index(['production_shift_start_id', 'occurred_at'], 'psa_shift_time_idx');
        });
    }
    // Operator Registration
    public function createOperator()
    {
        return Inertia::render('APT/RegisterOperator', [
            'vessels' => Vessel::active()->with('product')->orderBy('name')->get()
        ]);
    }

    public function storeOperator(Request $request)
    {
        $validated = $request->validate([
            'vessel_id' => 'required|exists:vessels,id',
            'operator_name' => 'required|string|max:255',
            'unit_type' => 'required|string',
            'economic_number' => 'required|string',
            'tractor_plate' => 'required|string',
            'trailer_plate' => 'nullable|required_unless:unit_type,VOLTEO,TORTON,CAMIONETA|string',
            'transporter_line' => 'required|string',
        ]);

        // Check for duplicate
        $exists = VesselOperator::where('vessel_id', $validated['vessel_id'])
            ->where('operator_name', $validated['operator_name'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['operator_name' => 'Este operador ya está registrado en este barco.']);
        }

        VesselOperator::create($validated);

        return back()->with('success', 'Operador registrado correctamente.');
    }

    // QR Printing
    public function qrPrint()
    {
        return Inertia::render('APT/QrPrint');
    }

    public function searchOperators(Request $request)
    {
        $query = $request->input('q');
        $operators = VesselOperator::with('vessel')
            ->where(function ($q) use ($query) {
                $q->where('operator_name', 'like', "%{$query}%")
                    ->orWhere('id', $query);
            })
            ->orderBy('operator_name')
            ->limit(20)
            ->get()
            ->map(function ($op) {
                $op->is_active = $op->vessel ? $op->vessel->is_active : false;
                return $op;
            });

        return response()->json($operators);
    }

    public function unitStatus(Request $request)
    {
        $activeTab = $request->input('tab', 'sale');

        $query = LoadingOrder::with([
            'client',
            'driver',
            'vehicle',
            'product',
            'weight_ticket',
            'exit_operator',
            'vessel_operator',
            'shipment_order.items.product',
            'shipment_order.client',
            'vessel'
        ])
            ->whereHas('weight_ticket', function ($q) {
                $q->where('weighing_status', 'in_progress')
                    ->where('is_burreo', false);
            });

        if ($activeTab === 'sale') {
            $query->whereNotNull('shipment_order_id');
        } else {
            $query->whereNull('shipment_order_id');
        }

        if ($request->filled('client_id')) {
            $clientId = $request->client_id;
            if ($activeTab === 'sale') {
                $query->whereHas('shipment_order', function ($sub) use ($clientId) {
                    $sub->where('client_id', $clientId);
                });
            } else {
                $query->where(function ($q) use ($clientId) {
                    $q->where('client_id', $clientId)
                        ->orWhereHas('vessel', function ($v) use ($clientId) {
                            $v->where('client_id', $clientId);
                        });
                });
            }
        }

        if ($request->filled('product_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('product_id', $request->product_id)
                    ->orWhereHas('shipment_order.items', function ($sub) use ($request) {
                        $sub->where('product_id', $request->product_id);
                    })
                    ->orWhereHas('shipment_order.sales_order', function ($sub) use ($request) {
                        $sub->where('product_id', $request->product_id);
                    });
            });
        }

        if ($request->filled('warehouse')) {
            $query->where('warehouse', $request->warehouse);
        }

        if ($request->filled('presentation')) {
            $query->whereHas('shipment_order', function ($sub) use ($request) {
                $sub->where('presentation', $request->presentation);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('folio', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhere('tractor_plate', 'like', "%{$search}%")
                    ->orWhere('trailer_plate', 'like', "%{$search}%")
                    ->orWhereHas('shipment_order', function ($sub) use ($search) {
                        $sub->where('folio', 'like', "%{$search}%")
                            ->orWhere('operator_name', 'like', "%{$search}%")
                            ->orWhere('tractor_plate', 'like', "%{$search}%")
                            ->orWhere('trailer_plate', 'like', "%{$search}%");
                    });
            });
        }

        // Clone query BEFORE pagination to get dynamic filter options
        $all_pending = (clone $query)->get();

        // Warehouses: ONLY those present in the current filtered list
        $warehouses = $all_pending->pluck('warehouse')->unique()->filter()->values();

        // Products: ONLY those present in the current filtered list
        $productIds = $all_pending->flatMap(function ($order) {
            $ids = [];
            if ($order->product_id) $ids[] = $order->product_id;
            if ($order->shipment_order?->product_id) $ids[] = $order->shipment_order->product_id;
            if ($order->shipment_order?->sales_order?->product_id) $ids[] = $order->shipment_order->sales_order->product_id;
            return $ids;
        })->unique()->filter()->values();

        $products = \App\Models\Product::whereIn('id', $productIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Clients: ONLY those present in the current filtered list
        $clientIds = $all_pending->flatMap(function ($order) use ($activeTab) {
            $ids = [];
            if ($activeTab === 'sale') {
                if ($order->shipment_order?->client_id) $ids[] = $order->shipment_order->client_id;
            } else {
                if ($order->client_id) $ids[] = $order->client_id;
                if ($order->vessel?->client_id) $ids[] = $order->vessel->client_id;
            }
            return $ids;
        })->unique()->filter()->values();

        $clients = \App\Models\Client::whereIn('id', $clientIds)
            ->orderBy('business_name')
            ->get(['id', 'business_name']);

        $pendingUnits = $query->orderBy('entry_at', 'asc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($order) {
                $ticket = $order->weight_ticket;
                $operatorName = $order->operator_name ?? $order->driver->name ?? 'N/A';
                $tractorPlate = $order->tractor_plate;
                $trailerPlate = $order->trailer_plate ?? 'N/A';

                if ($order->shipment_order_id && $order->shipment_order) {
                    $operatorName = $order->shipment_order->operator_name ?? $operatorName;
                    $tractorPlate = $order->shipment_order->tractor_plate ?? $tractorPlate;
                    $trailerPlate = $order->shipment_order->trailer_plate ?? $trailerPlate;
                }

                $presentation = $order->shipment_order?->presentation ?? 'GRANEL';
                $productName = $order->product?->name ?? $order->shipment_order?->product?->name ?? $order->shipment_order?->product ?? 'N/A';

                // If it's Envasado, ensure we show the bag size
                if (strtoupper($presentation) === 'ENVASADO') {
                    $sacksCount = $order->shipment_order?->sacks_count;
                    // If productName doesn't contain the size but sacksCount looks like it has it (e.g. "25 KG")
                    if (!preg_match('/\d+\s*KG/i', $productName) && $sacksCount && preg_match('/\d+\s*KG/i', $sacksCount)) {
                        $productName .= " - " . $sacksCount;
                    }
                }

                return [
                    'id' => $order->id,
                    'folio' => $order->folio,
                    'oe_folio' => $order->shipment_order?->folio ?? 'N/A',
                    'provider' => $order->shipment_order?->client?->business_name ?? $order->shipment_order?->client?->name ?? ($order->client?->business_name ?? $order->client_name),
                    'product' => $productName,
                    'entry_weight' => $ticket->tare_weight,
                    'vehicle_plate' => $tractorPlate,
                    'trailer_plate' => $trailerPlate,
                    'driver' => $operatorName,
                    'real_transport_line' => $order->transport_company ?? ($order->shipment_order?->transport_line ?? 'N/A'),
                    'economic_number' => $order->economic_number ?? 'N/A',
                    'warehouse' => $order->warehouse ?? 'N/A',
                    'cubicle' => $order->cubicle ?? 'N/A',
                    'entry_at' => $order->entry_at,
                    'vessel_name' => $order->vessel?->name ?? 'N/A',
                    'programmed_weight' => $order->shipment_order?->programmed_tons ?? $order->programmed_tons ?? 0,
                ];
            });

        return Inertia::render('APT/UnitStatus', [
            'pending_exit' => $pendingUnits,
            'filters' => $request->all(['tab', 'client_id', 'product_id', 'warehouse', 'presentation', 'search']),
            'clients' => $clients,
            'products' => $products,
            'warehouses' => $warehouses,
        ]);
    }

    // Status Dashboard
    public function status(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());

        // Define Warehouse Structure
        $warehouses = [
            ['name' => 'Almacén 1', 'type' => 'flat'],
            ['name' => 'Almacén 2', 'type' => 'flat'],
            ['name' => 'Almacén 3', 'type' => 'flat'],
            ['name' => 'Almacén 4', 'type' => 'cubicles', 'total_cubicles' => 8],
            ['name' => 'Almacén 5', 'type' => 'cubicles', 'total_cubicles' => 8],
        ];

        // Fetch Orders for the selected date (Active OR Completed)
        // AND Active orders (regardless of date) if they are currently occupying space?
        // Actually, user wants a "Log view" per day usually, but "Status" implies Current State.
        // Hybrid Approach:
        // 1. If Date == Today: Show EVERYTHING active (regardless of entry date) + Completed Today.
        // 2. If Date != Today: Show ONLY what was active/completed ON that specific day?
        //    Let's stick to: "Show me the Log of [Date]".
        //    But for "Current Status", we usually want "What is here NOW".
        //    The user asked for "lo que entró ayer", so it's a log view.

        //    Let's stick to the Date Filter on `created_at` or `entry_at`.
        // 139:

        // HOWEVER, to be safe: filtering by `entry_at` is the most "Logbook" style.

        $query = \App\Models\LoadingOrder::with(['weight_ticket', 'vessel'])
            ->whereNotNull('warehouse');

        // Filter: 
        // We want orders that were "Active" or "Completed" on that date.
        // Simplest proxy: date(entry_at) == date OR date(updated_at) == date?
        // Let's use entry_at for "Lo que entró". Or if they want "Production Report", usually it's by Exit Date.
        // Let's stick to: "Orders processed/relevant to this date".

        // Revised Logic based on "Inventory":
        // Users want to know "How much weight ended up in Almacen 1 on Date X".
        // So we filter by the date the valid action happened. 
        // For simplicity and user expectation: Filter by `entry_at` (Date of Entry) matches selected date.
        // This shows "What entered on this day".
        $range = OperationalTimeHelper::getOperationalRange($date);
        $query->whereBetween('entry_at', $range);

        // Include all relevant statuses
        $query->whereIn('status', ['loading', 'authorized', 'completed', 'closed', 'weighing_out']);

        $dailyOrders = $query->get();

        // Patch for Burreo Weights: Ensure we show the correct weight (Draft > Provisional)
        foreach ($dailyOrders as $order) {
            if ($order->operation_type === 'burreo' && $order->vessel) {
                if (!$order->weight_ticket) {
                    $order->setRelation('weight_ticket', new \App\Models\WeightTicket([
                        'net_weight' => 0
                    ]));
                }

                $v = $order->vessel;
                $draft = (float) ($v->draft_weight ?? 0);
                $prov = (float) ($v->provisional_burreo_weight ?? 0);

                // If a ticket already has a weight, we might want to keep it, 
                // but usually status view should reflect the master resolution for Burreo
                $order->weight_ticket->net_weight = ($draft > 0) ? $draft : $prov;
            }
        }

        // If Date is TODAY, we MIGHT also want to include "Leftovers" from previous days that are still Active?
        // If the view is "Inventory Status", yes. If it's "Daily Entry Log", no.
        // The Prompt said: "detalle de las ubicaciones... marca los pesos que quedaron guardados".
        // This implies INVENTORY.
        // If it's Inventory, we need:
        // 1. ALL currently Active units (regardless of entry date). -> Only if viewing Today?
        // 2. ALL units that COMPLETED/CLOSED on the requested date? 
        // Let's refine:
        // "Show me the stored weight".
        // If I pick "Yesterday", I probably want to see what was stored Yesterday.
        // Let's stick to the Date Filter on `created_at` or `entry_at`.

        // HOWEVER, to be safe: filtering by `entry_at` is the most "Logbook" style.

        $data = [];

        foreach ($warehouses as $wh) {
            $whData = [
                'name' => $wh['name'],
                'type' => $wh['type'],
                'occupied' => false,
                'orders' => [],
                'total_programmed' => 0,
                'total_net' => 0,
                'cubicles' => []
            ];

            if ($wh['type'] === 'flat') {
                $orders = $dailyOrders->where('warehouse', $wh['name']);

                if ($orders->isNotEmpty()) {
                    $whData['occupied'] = true;
                    $whData['orders'] = $orders->values()->all();
                    $whData['total_programmed'] = $orders->sum('programmed_tons');
                    // Manual sum to ensure patched weights are used
                    $netSum = 0;
                    foreach ($orders as $o) {
                        $netSum += (float) ($o->weight_ticket?->net_weight ?? 0);
                    }
                    $whData['total_net'] = $netSum;
                }
            } else {
                $occupiedCount = 0;
                for ($i = 1; $i <= 8; $i++) {
                    $cubicleName = (string) $i;
                    $orders = $dailyOrders->where('warehouse', $wh['name'])
                        ->where('cubicle', $cubicleName);

                    $hasActivity = $orders->isNotEmpty();
                    if ($hasActivity)
                        $occupiedCount++;

                    $netSum = 0;
                    foreach ($orders as $o) {
                        $netSum += (float) ($o->weight_ticket?->net_weight ?? 0);
                    }

                    $whData['cubicles'][] = [
                        'id' => $i,
                        'occupied' => $hasActivity,
                        'orders' => $orders->values()->all(),
                        'total_programmed' => $orders->sum('programmed_tons'),
                        'total_net' => $netSum
                    ];
                }
                $whData['occupancy_percentage'] = ($occupiedCount / 8) * 100;
            }
            $data[] = $whData;
        }

        return Inertia::render('APT/Status', [
            'warehouses' => $data,
            'filters' => [
                'date' => $date
            ]
        ]);
    }

    public function scanner(Request $request)
    {
        if ($request->input('from') === 'production') {
            return redirect()->route('apt.management.activity');
        }

        // Filters for active and historical vessel movements
        $filters = $request->only(['date', 'vessel_id']);
        $now = now();

        // Categorize Vessels
        $allVessels = Vessel::orderBy('created_at', 'desc')->get();
        $activeVessels = $allVessels->filter(function ($v) use ($now) {
            return !empty($v->berthal_datetime) && $v->berthal_datetime <= $now && empty($v->departure_date);
        })->values();

        $inactiveVessels = $allVessels->filter(function ($v) use ($now) {
            return empty($v->berthal_datetime) || $v->berthal_datetime > $now || !empty($v->departure_date);
        })->values();

        if (!$request->filled('vessel_id')) {
            // Priority 1: Vessel from the most recent scan
            $lastScan = \App\Models\AptScan::with('loadingOrder')->latest()->first();
            if ($lastScan && $lastScan->loadingOrder?->vessel_id) {
                $filters['vessel_id'] = (string) $lastScan->loadingOrder->vessel_id;
            }
            // Priority 2: First active vessel
            elseif ($activeVessels->isNotEmpty()) {
                $filters['vessel_id'] = (string) $activeVessels->first()->id;
            }
        }

        $query = \App\Models\AptScan::with(['operator', 'loadingOrder.vessel'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('date')) {
            $range = OperationalTimeHelper::getOperationalRange($request->date);
            $query->whereBetween('created_at', $range);
        }

        if (isset($filters['vessel_id'])) {
            $query->whereHas('loadingOrder', function ($q) use ($filters) {
                $q->where('vessel_id', $filters['vessel_id']);
            });
        }

        $recentScans = $query->paginate(10)
            ->withQueryString();

        return Inertia::render('APT/Scanner', [
            'recentScans' => $recentScans,
            'filters' => $filters,
            'activeVessels' => $activeVessels,
            'inactiveVessels' => $inactiveVessels,
        ]);
    }

    public function storeScan(Request $request)
    {
        $validated = $request->validate([
            'qr' => 'required|string', // Order ID or Operator QR
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string', // Optional depending on WH
            'operation_type' => 'required|in:scale,burreo',
        ]);

        // 1. Find Order logic
        $qr = $validated['qr'];
        $order = null;

        if (str_starts_with($qr, 'OP ')) {
            // Find active order for this operator (Scale MI or previous scan)
            $parts = explode('|', substr($qr, 3));
            $operatorId = $parts[0] ?? null;
            
            if ($operatorId) {
                // Find LATEST active order for this operator/vehicle
                // This covers BOTH 'scale' (MI) and 'burreo' (pending)
                $order = \App\Models\LoadingOrder::with(['weight_ticket', 'vessel'])
                    ->whereIn('status', ['loading', 'pending'])
                    ->where(function ($q) use ($operatorId) {
                        $q->where('vessel_operator_id', $operatorId);
                        // Fallback by plates if ID is not linked in existing orders
                        $op = \App\Models\VesselOperator::find($operatorId);
                        if ($op) {
                            $q->orWhere('tractor_plate', $op->tractor_plate);
                        }
                    })
                    ->latest()
                    ->first();
            }
        } else {
            // Assume UUID or Folio
            $order = \App\Models\LoadingOrder::with(['weight_ticket', 'vessel'])->where('id', $qr)->orWhere('folio', $qr)->first();
        }

        if ($order && $order->vessel && $order->vessel->is_external_warehouse) {
            $msg = 'ALERTA: Este barco (' . $order->vessel->name . ') utiliza un ALMACÉN EXTERNO. ';
            $msg .= $order->vessel->apt_operation_type === 'burreo' 
                ? 'El registro se realiza automáticamente en MUELLE.' 
                : 'No se requiere escaneo en APT, proceda directamente a BÁSCULA DE SALIDA.';
            return back()->withErrors(['qr' => $msg]);
        }

        if (!$order) {
            // Auto-create Logic for Burreo / Operator Scan
            if (str_starts_with($qr, 'OP ')) {
                $rawId = substr($qr, 3);
                $operatorId = null;
                if (preg_match('/^\d+/', trim($rawId), $matches)) {
                    $operatorId = $matches[0];
                }

                $operator = \App\Models\VesselOperator::with('vessel.product')->find($operatorId);

                if ($operator && $operator->vessel) {
                    // ARCHIVE CHECK: If vessel is inactive, block all scans
                    if (!$operator->vessel->is_active) {
                        return back()->withErrors(['qr' => 'ALERTA: El barco asociado a este operador no está en operación.']);
                    }

                    // STRICT CHECK: If vessel requires scale, do not allow auto-creation of Burreo
                    if (($operator->vessel->apt_operation_type ?? 'scale') !== 'burreo') {
                        return back()->withErrors(['qr' => 'ALERTA: El operador aún no pasa por báscula y por ende no se le puede asignar un almacén.']);
                    }

                    // 0. ADOPT OR BLOCK: 
                    // If the vessel is Burreo, we only block if there is a process from ANOTHER vessel or a different OE.
                    $activeOrderQuery = \App\Models\LoadingOrder::where('operator_name', $operator->operator_name)
                        ->whereIn('status', ['loading', 'pending']);
                    
                    // Allow if it's the SAME vessel (redundant check but safe)
                    $activeOrder = $activeOrderQuery->where('vessel_id', '!=', $operator->vessel_id)->exists();

                    if ($activeOrder) {
                        return back()->withErrors(['qr' => 'ALERTA: El operador tiene un proceso activo en otro barco o venta. Finalice el proceso previo.']);
                    }

                    // 1. TRIP VALIDATION: FIFO (Muelle -> APT)
                    $pendingTrip = \App\Models\VesselOperatorTrip::where('vessel_id', $operator->vessel_id)
                        ->where('vessel_operator_id', $operator->id)
                        ->whereDoesntHave('loading_order')
                        ->where('status', '!=', 'cancelled')
                        ->orderBy('created_at', 'asc')
                        ->first();

                    if (!$pendingTrip && $operator->vessel->has_chief_foreman) {
                        return back()->withErrors(['qr' => 'ALERTA: No se encontró un registro de salida en Muelle. El operador debe registrar su vuelta en Muelle antes de descargar en APT.']);
                    }

                    try {
                        // 2. WEIGHT RESOLUTION: Draft (Real) > Provisional
                        $vessel = $operator->vessel;
                        $draft = (float) ($vessel->draft_weight ?? 0);
                        $prov = (float) ($vessel->provisional_burreo_weight ?? 0);
                        $finalWeightKg = ($draft > 0) ? $draft : $prov;

                        // 3. ATOMIC TRANSACTION: Create Order, Ticket, Scan & Update Trip
                        \Illuminate\Support\Facades\DB::transaction(function () use ($operator, $pendingTrip, $validated, $finalWeightKg) {
                            $order = \App\Models\LoadingOrder::create([
                                'id' => (string) \Illuminate\Support\Str::uuid(),
                                'folio' => 'BUR-' . date('Ymd-His') . '-' . rand(100, 999),
                                'entry_at' => now(),
                                'client_id' => $operator->vessel->client_id,
                                'vessel_id' => $operator->vessel->id,
                                'product_id' => $operator->vessel->product_id,
                                'vessel_operator_id' => $operator->id, // Important for relations
                                'status' => 'completed',
                                'operator_name' => $operator->operator_name,
                                'economic_number' => $operator->economic_number,
                                'tractor_plate' => $operator->tractor_plate,
                                'trailer_plate' => $operator->trailer_plate,
                                'unit_type' => $operator->unit_type,
                                'transport_company' => $operator->transporter_line,
                                'operation_type' => 'burreo',
                                'warehouse' => $validated['warehouse'],
                                'cubicle' => $validated['cubicle'] ?? 'N/A',
                                'vessel_operator_trip_id' => $pendingTrip->id ?? null,
                            ]);

                            \App\Models\WeightTicket::create([
                                'loading_order_id' => $order->id,
                                'ticket_number' => 'B-' . $order->folio,
                                'weighing_status' => 'completed',
                                'weighmaster_id' => auth()->id(),
                                'is_burreo' => true,
                                'tare_weight' => $finalWeightKg,
                                'net_weight' => $finalWeightKg,
                                'weigh_in_at' => now(),
                                'weigh_out_at' => now(),
                            ]);

                            // HOTFIX for persistent SQL Error 1452 on operator_id
                            // Since we have the link in loading_orders.vessel_operator_id, 
                            // we nullify it here to avoid the mysterious DB constraint failure.
                            \App\Models\AptScan::create([
                                'loading_order_id' => $order->id,
                                'operator_id' => null, // Bypassing FK constraint 1452
                                'warehouse' => (string) $validated['warehouse'],
                                'cubicle' => (string) ($validated['cubicle'] ?? 'N/A'),
                                'user_id' => auth()->id(),
                            ]);

                            if ($pendingTrip) {
                                $pendingTrip->update(['status' => 'completed']);
                            }
                        });

                        $range = OperationalTimeHelper::getOperationalRange();
                        $dailyCount = \App\Models\LoadingOrder::where('operator_name', $operator->operator_name)
                            ->where('operation_type', 'burreo')
                            ->whereBetween('created_at', $range)
                            ->count();

                        $foremanLabel = $operator->vessel->has_chief_foreman ? " [MODO FOREMAN]" : "";
                        $msg = "✅ Nueva Entrada Registrada{$foremanLabel}: Descarga #{$dailyCount} del día. Peso vinculado: " . number_format($finalWeightKg) . " kg.";

                        return redirect()->back()->with('success', $msg);

                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Burreo Operation Error: ' . $e->getMessage(), [
                            'operator_id' => $operator->id ?? 'null',
                            'qr' => $qr,
                            'trace' => $e->getTraceAsString()
                        ]);
                        return back()->withErrors(['qr' => 'Error en el proceso de Burreo: ' . $e->getMessage()]);
                    }
                } else {
                    return back()->withErrors(['qr' => 'Operador o Barco no vinculados correctamente.']);
                }
            } else {
                // Case: Order ALREADY FOUND (Adopt existing order from Scale MI or previous scan)
                if ($validated['operation_type'] === 'burreo' && $order) {
                    
                    // ARCHIVE CHECK: If vessel is inactive, block all scans
                    if ($order->vessel && !$order->vessel->is_active) {
                        return back()->withErrors(['qr' => 'ALERTA: El barco asociado a esta orden ya no está en operación.']);
                    }

                    // 1. TRIP VALIDATION: FIFO (Muelle -> APT)
                    $pendingTrip = \App\Models\VesselOperatorTrip::where('vessel_id', $order->vessel_id)
                        ->where('vessel_operator_id', $order->vessel_operator_id)
                        ->where(function($q) use ($order) {
                            $q->whereDoesntHave('loading_order')
                              ->orWhere('id', $targetTripId = ($order->vessel_operator_trip_id));
                        })
                        ->where('status', '!=', 'cancelled')
                        ->orderBy('created_at', 'asc')
                        ->first();

                    if (!$pendingTrip && $order->vessel?->has_chief_foreman) {
                        return back()->withErrors(['qr' => 'ALERTA: No se encontró un registro de salida en Muelle para esta vuelta.']);
                    }

                    try {
                        // 2. WEIGHT RESOLUTION
                        $vessel = $order->vessel;
                        $draft = (float) ($vessel->draft_weight ?? 0);
                        $prov = (float) ($vessel->provisional_burreo_weight ?? 0);
                        $finalWeightKg = ($draft > 0) ? $draft : $prov;

                        // 3. ATOMIC TRANSACTION: Complete existing order
                        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $pendingTrip, $validated, $finalWeightKg) {
                            $order->update([
                                'status' => 'completed',
                                'warehouse' => $validated['warehouse'],
                                'cubicle' => $validated['cubicle'] ?? 'N/A',
                                'vessel_operator_trip_id' => $pendingTrip->id ?? $order->vessel_operator_trip_id,
                                'operation_type' => 'burreo', // Switch to burreo if it was scale
                                'entry_at' => $order->entry_at ?? now(),
                            ]);

                            // Create Weight Ticket if missing (it should exist if it came from Scale MI)
                            $ticket = \App\Models\WeightTicket::updateOrCreate(
                                ['loading_order_id' => $order->id],
                                [
                                    'ticket_number' => $order->weight_ticket->ticket_number ?? ('B-' . $order->folio),
                                    'weighing_status' => 'completed',
                                    'is_burreo' => true,
                                    'tare_weight' => $finalWeightKg,
                                    'net_weight' => $finalWeightKg,
                                    'weigh_out_at' => now(),
                                ]
                            );

                            \App\Models\AptScan::create([
                                'loading_order_id' => $order->id,
                                'operator_id' => null,
                                'warehouse' => (string) $validated['warehouse'],
                                'cubicle' => (string) ($validated['cubicle'] ?? 'N/A'),
                                'user_id' => auth()->id(),
                            ]);

                            if ($pendingTrip) {
                                $pendingTrip->update(['status' => 'completed']);
                            }
                        });

                        return redirect()->back()->with('success', "✅ Proceso de Burreo completado para la orden {$order->folio}.");

                    } catch (\Exception $e) {
                        return back()->withErrors(['qr' => 'Error al completar Burreo: ' . $e->getMessage()]);
                    }
                }

                return back()->withErrors(['qr' => 'Orden de Báscula no encontrada o no activa.']);
            }
        }

        // --- COMMON FLOW (ONLY FOR SCALE) ---
        // At this point, if it was 'burreo', it already returned.

        // status check for Scale Flow
        if ($validated['operation_type'] === 'scale') {
            // ARCHIVE CHECK: If vessel is inactive, block scans even for existing orders
            if ($order->vessel && !$order->vessel->is_active) {
                return back()->withErrors(['qr' => 'ALERTA: Este barco ya ha zarpado. No se pueden registrar nuevos movimientos.']);
            }

            // Must be 'loading' AND have a Weight Ticket
            if ($order->status !== 'loading' || !$order->weight_ticket) {
                return back()->withErrors(['qr' => 'ALERTA: El operador aún no pasa por báscula y por ende no se le puede asignar un almacén.']);
            }

            // PENDING DESTRARE CHECK: If already assigned, block re-scanning/re-assignment in APT
            if ($order->warehouse !== null) {
                return back()->withErrors(['qr' => 'ALERTA: El operador ya tiene un almacén asignado (' . $order->warehouse . ') y su proceso está pendiente de finalizar en Báscula (Destare).']);
            }
        }

        // Validation for Cubicle (WH 4 & 5)
        if (in_array($validated['warehouse'], ['4', '5', 'Almacén 4', 'Almacén 5'])) {
            if (empty($validated['cubicle'])) {
                return back()->withErrors(['cubicle' => 'El cubículo es obligatorio para el Almacén seleccionado.']);
            }
        }

        $finalCubicle = $validated['cubicle'] ?? 'N/A';
        if (!in_array($validated['warehouse'], ['Almacén 4', 'Almacén 5', '4', '5'])) {
            $finalCubicle = 'N/A';
        }

        // Get Operator ID if available
        $operatorId = null;
        if (str_starts_with($qr, 'OP ')) {
            $rawId = substr($qr, 3);
            if (preg_match('/^\d+/', $rawId, $matches)) {
                $rawOperatorId = $matches[0];
                if (\App\Models\VesselOperator::where('id', $rawOperatorId)->exists()) {
                    $operatorId = $rawOperatorId;
                }
            }
        }

        if (!$operatorId && $order) {
            $matchedOp = \App\Models\VesselOperator::where('tractor_plate', $order->tractor_plate)->first();
            if ($matchedOp) {
                $operatorId = $matchedOp->id;
            }
        }

        // Update Order (For Scale Only)
        $order->update([
            'warehouse' => $validated['warehouse'],
            'cubicle' => $finalCubicle,
            'operation_type' => $validated['operation_type'],
        ]);

        // Log Scan Record (For Scale Only)
        \App\Models\AptScan::create([
            'loading_order_id' => $order->id,
            'operator_id' => null, // Bypassing FK constraint 1452 (consistent with burreo fix Above)
            'warehouse' => (string) $validated['warehouse'],
            'cubicle' => (string) $finalCubicle,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Asignación de Almacén registrada correctamente.');
    }

    public function updateScan(Request $request, $id)
    {
        $scan = \App\Models\AptScan::findOrFail($id);

        $validated = $request->validate([
            'warehouse' => 'required|string',
            'cubicle' => 'nullable|string',
        ]);

        // Same Validation Logic as Store
        if (in_array($validated['warehouse'], ['4', '5', 'Almacén 4', 'Almacén 5'])) {
            if (empty($validated['cubicle'])) {
                return back()->withErrors(['cubicle' => 'El cubículo es obligatorio para el Almacén seleccionado.']);
            }
            // Occupancy Check REMOVED to allow multiple units
        }

        // Force 'N/A' cubicle if not WH 4/5
        if (!in_array($validated['warehouse'], ['Almacén 4', 'Almacén 5', '4', '5'])) {
            $validated['cubicle'] = 'N/A';
        }
        if (empty($validated['cubicle'])) {
            $validated['cubicle'] = 'N/A';
        }

        // Update Scan Record
        $scan->update([
            'warehouse' => $validated['warehouse'],
            'cubicle' => $validated['cubicle'],
        ]);

        // Update Linked Loading Order
        if ($scan->loading_order_id) {
            \App\Models\LoadingOrder::where('id', $scan->loading_order_id)->update([
                'warehouse' => $validated['warehouse'],
                'cubicle' => $validated['cubicle'],
            ]);
        }

        return redirect()->back()->with('success', 'Registro actualizado correctamente.');
    }

    public function destroyScan($id)
    {
        $scan = \App\Models\AptScan::findOrFail($id);

        if ($scan->loading_order_id) {
            // Deleting the LoadingOrder will automatically delete:
            // 1. The WeightTicket (cascade)
            // 2. The AptScan itself (cascade)
            // This ensures the Dashboard trip count is correctly reduced.
            \App\Models\LoadingOrder::where('id', $scan->loading_order_id)->delete();
        } else {
            // Fallback for scans without a loading order
            $scan->delete();
        }

        return redirect()->back()->with('success', 'Registro y viaje eliminados correctamente.');
    }
}
