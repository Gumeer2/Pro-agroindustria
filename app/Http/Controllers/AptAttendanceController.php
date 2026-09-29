<?php

namespace App\Http\Controllers;

use App\Models\AptAttendance;
use App\Models\ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Inertia\Inertia;
use Carbon\Carbon;

class AptAttendanceController extends Controller
{
    public function __construct()
    {
        $this->ensureTableExists();
    }

    public function index(Request $request)
    {
        $query = AptAttendance::with('user:id,name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('service_provider', 'like', "%{$search}%")
                  ->orWhere('activity', 'like', "%{$search}%")
                  ->orWhere('folio', 'like', "%{$search}%")
                  ->orWhere('work_area', 'like', "%{$search}%")
                  ->orWhere('shift', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->input('date'));
        }

        if ($request->filled('shift') && $request->input('shift') !== 'all') {
            $query->where('shift', $request->input('shift'));
        }

        $attendances = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('APT/Attendance/Index', [
            'attendances' => $attendances,
            'filters' => (object) $request->only(['search', 'date', 'shift']),
        ]);
    }

    public function create()
    {
        // 12 default rows for personal list
        $defaultPersonnel = [];
        for ($i = 1; $i <= 12; $i++) {
            $num = str_pad($i, 2, '0', STR_PAD_LEFT);
            $defaultPersonnel[] = [
                'num' => $num,
                'name' => '',
                'signature' => '',
                'entry_time' => '07:00',
                'exit_time' => '19:00',
            ];
        }

        $defaultSquadLeader = [
            [
                'num' => '01',
                'name' => '',
                'signature' => '',
                'entry_time' => '07:00',
                'exit_time' => '19:00',
            ]
        ];

        $defaultSafetySupervisor = [
            [
                'num' => '01',
                'name' => '',
                'signature' => '',
                'entry_time' => '07:00',
                'exit_time' => '19:00',
            ]
        ];

        return Inertia::render('APT/Attendance/Create', [
            'serviceProviders' => ServiceProvider::orderBy('name')->get(['id', 'name']),
            'defaults' => [
                'format_code' => 'GLS-AP-FO-005',
                'service_provider' => '',
                'shift' => '',
                'work_area' => '',
                'date' => Carbon::today()->format('Y-m-d'),
                'activity' => '',
                'loading_line' => 'GLS-APT-ENV (   )',
                'personnel' => $defaultPersonnel,
                'squad_leader' => $defaultSquadLeader,
                'safety_supervisor' => $defaultSafetySupervisor,
                'observations' => '',
                'supervision_name' => 'PRO-AGROINDUSTRIA, S.A. DE C.V.',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_provider' => 'required|string|max:255',
            'shift' => 'required|string|max:50',
            'work_area' => 'required|string|max:100',
            'date' => 'required|date',
            'activity' => 'required|string|max:500',
            'loading_line' => 'nullable|string|max:100',
            'personnel' => 'nullable|array',
            'squad_leader' => 'nullable|array',
            'safety_supervisor' => 'nullable|array',
            'observations' => 'nullable|string|max:2000',
            'supervision_name' => 'nullable|string|max:255',
        ]);

        $folio = 'CAP-' . Carbon::parse($validated['date'])->format('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

        $attendance = AptAttendance::create([
            'folio' => $folio,
            'format_code' => 'GLS-AP-FO-005',
            'service_provider' => $validated['service_provider'],
            'shift' => $validated['shift'],
            'work_area' => $validated['work_area'],
            'date' => $validated['date'],
            'activity' => $validated['activity'],
            'loading_line' => $validated['loading_line'] ?? 'GLS-APT-ENV (   )',
            'personnel' => $validated['personnel'] ?? [],
            'squad_leader' => $validated['squad_leader'] ?? [],
            'safety_supervisor' => $validated['safety_supervisor'] ?? [],
            'observations' => $validated['observations'] ?? '',
            'supervision_name' => $validated['supervision_name'] ?? 'PRO-AGROINDUSTRIA, S.A. DE C.V.',
            'user_id' => auth()->id(),
        ]);

        return redirect()->route('apt.attendance.print', $attendance->id)
            ->with('success', 'Control de asistencias registrado correctamente.');
    }

    public function show($id)
    {
        return $this->printAttendance($id);
    }

    public function printAttendance($id)
    {
        $attendance = AptAttendance::with('user:id,name')->findOrFail($id);

        return Inertia::render('APT/Attendance/Print', [
            'attendance' => $attendance,
        ]);
    }

    public function edit($id)
    {
        $attendance = AptAttendance::findOrFail($id);

        return Inertia::render('APT/Attendance/Edit', [
            'attendance' => $attendance,
            'serviceProviders' => ServiceProvider::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, $id)
    {
        $attendance = AptAttendance::findOrFail($id);

        $validated = $request->validate([
            'service_provider' => 'required|string|max:255',
            'shift' => 'required|string|max:50',
            'work_area' => 'required|string|max:100',
            'date' => 'required|date',
            'activity' => 'required|string|max:500',
            'loading_line' => 'nullable|string|max:100',
            'personnel' => 'nullable|array',
            'squad_leader' => 'nullable|array',
            'safety_supervisor' => 'nullable|array',
            'observations' => 'nullable|string|max:2000',
            'supervision_name' => 'nullable|string|max:255',
        ]);

        $attendance->update([
            'service_provider' => $validated['service_provider'],
            'shift' => $validated['shift'],
            'work_area' => $validated['work_area'],
            'date' => $validated['date'],
            'activity' => $validated['activity'],
            'loading_line' => $validated['loading_line'] ?? $attendance->loading_line,
            'personnel' => $validated['personnel'] ?? [],
            'squad_leader' => $validated['squad_leader'] ?? [],
            'safety_supervisor' => $validated['safety_supervisor'] ?? [],
            'observations' => $validated['observations'] ?? '',
            'supervision_name' => $validated['supervision_name'] ?? $attendance->supervision_name,
        ]);

        return redirect()->route('apt.attendance.print', $attendance->id)
            ->with('success', 'Control de asistencias actualizado correctamente.');
    }

    public function destroy($id)
    {
        $attendance = AptAttendance::findOrFail($id);
        $attendance->delete();

        return redirect()->route('apt.attendance.index')
            ->with('success', 'Registro de asistencia eliminado correctamente.');
    }

    private function ensureTableExists(): void
    {
        if (Schema::hasTable('apt_attendances')) {
            return;
        }

        Schema::create('apt_attendances', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->nullable()->index();
            $table->string('format_code')->default('GLS-AP-FO-005');
            $table->string('service_provider')->default('OBRAS Y SERVICIOS INDUSTRIALES SAN MARTIN, SA DE CV');
            $table->string('shift')->default('1A');
            $table->string('work_area')->default('APT 2');
            $table->date('date');
            $table->text('activity');
            $table->string('loading_line')->default('GLS-APT-ENV (   )');
            $table->json('personnel')->nullable();
            $table->json('squad_leader')->nullable();
            $table->json('safety_supervisor')->nullable();
            $table->text('observations')->nullable();
            $table->string('supervision_name')->default('PRO-AGROINDUSTRIA, S.A. DE C.V.');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }
}
