<?php

namespace App\Http\Controllers;

use App\Models\Verifier;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class VerifierController extends Controller
{
    public function index()
    {
        $this->ensureTablesExist();
        return response()->json(Verifier::orderBy('name')->get(['id', 'name']));
    }

    public function store(Request $request)
    {
        $this->ensureTablesExist();
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');
        $verifier = Verifier::firstOrCreate(['name' => $name]);

        return response()->json($verifier, 201);
    }

    private function ensureTablesExist(): void
    {
        if (!Schema::hasTable('verifiers')) {
            Schema::create('verifiers', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }
    }
}

