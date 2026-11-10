<?php

namespace App\Http\Controllers;

use App\Models\UnitType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class UnitTypeController extends Controller
{
    private function ensureTableAndDefaults()
    {
        if (!Schema::hasTable('unit_types')) {
            Schema::create('unit_types', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });
        } else {
            Schema::table('unit_types', function (Blueprint $table) {
                if (!Schema::hasColumn('unit_types', 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable();
                }
                if (!Schema::hasColumn('unit_types', 'updated_by')) {
                    $table->unsignedBigInteger('updated_by')->nullable();
                }
            });
        }

        if (UnitType::count() === 0) {
            $defaults = [
                'VOLTEO',
                'TORTON',
                'CAMIONETA',
                'TRACTOCAMION',
                'FULL',
                'FULL CAJA SECA',
                'FULL ENCORTINADO',
                'FULL GONDOLA',
                'FULL JAULA',
                'FULL PIPA',
                'FULL PLATAFORMA',
                'FULL TOLVA',
                'SENCILLO CAJA SECA',
                'SENCILLO GONDOLA',
                'SENCILLO JAULA',
                'SENCILLO PIPA',
                'SENCILLO PLATAFORMA',
                'SENCILLO TOLVA',
                'CONTENEDOR',
                'CISTERNA',
                'PIPA',
                'RABÓN',
            ];
            foreach ($defaults as $name) {
                UnitType::firstOrCreate(['name' => mb_strtoupper($name, 'UTF-8')]);
            }
        }
    }

    public function index()
    {
        $this->ensureTableAndDefaults();
        return response()->json(UnitType::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $this->ensureTableAndDefaults();
        $validated = $request->validate([
            'name' => 'required|string|unique:unit_types,name|max:255',
        ]);

        $unitType = UnitType::create([
            'name' => mb_strtoupper(trim($validated['name']), 'UTF-8'),
        ]);

        return response()->json($unitType, 201);
    }

    public function update(Request $request, UnitType $unitType)
    {
        $this->ensureTableAndDefaults();
        $validated = $request->validate([
            'name' => 'required|string|unique:unit_types,name,' . $unitType->id . '|max:255',
        ]);

        $unitType->update([
            'name' => mb_strtoupper(trim($validated['name']), 'UTF-8'),
        ]);

        return response()->json($unitType);
    }

    public function destroy(UnitType $unitType)
    {
        $unitType->delete();
        return response()->json(null, 204);
    }
}
