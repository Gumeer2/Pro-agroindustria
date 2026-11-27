<?php

namespace App\Http\Controllers;

use App\Models\SquadLeader;
use App\Models\AptAttendance;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class SquadLeaderController extends Controller
{
    public function index()
    {
        $this->ensureTablesExist();
        return response()->json(SquadLeader::orderBy('name')->get(['id', 'name']));
    }

    public function store(Request $request)
    {
        $this->ensureTablesExist();
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');
        $leader = SquadLeader::firstOrCreate(['name' => $name]);

        return response()->json($leader, 201);
    }

    public function destroy($id)
    {
        $this->ensureTablesExist();
        $leader = SquadLeader::find($id);
        if (!$leader) {
            $leader = SquadLeader::where('name', $id)->first();
        }
        if ($leader) {
            $leader->delete();
            return response()->json(['success' => true, 'message' => 'Encargado de cuadrilla eliminado correctamente.']);
        }
        return response()->json(['success' => false, 'message' => 'Encargado no encontrado.'], 404);
    }

    public function ensureTablesExist(): void
    {
        if (!Schema::hasTable('squad_leaders')) {
            Schema::create('squad_leaders', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });

            // Seed con encargados existentes en AptAttendance si hay
            $existing = AptAttendance::query()
                ->get(['squad_leader'])
                ->flatMap(function ($att) {
                    $l = is_array($att->squad_leader) ? ($att->squad_leader[0]['name'] ?? '') : '';
                    return trim((string)$l) !== '' ? [trim((string)$l)] : [];
                })
                ->unique()
                ->values();

            if ($existing->isNotEmpty()) {
                foreach ($existing as $name) {
                    SquadLeader::firstOrCreate(['name' => mb_strtoupper($name, 'UTF-8')]);
                }
            } else {
                SquadLeader::firstOrCreate(['name' => 'PABLO FRANCISCO VIVAS TORRES']);
                SquadLeader::firstOrCreate(['name' => 'Admin VECODE']);
            }
        }
    }
}
