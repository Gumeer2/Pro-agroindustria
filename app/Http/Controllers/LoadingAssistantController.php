<?php

namespace App\Http\Controllers;

use App\Models\LoadingAssistant;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LoadingAssistantController extends Controller
{
    public function index()
    {
        $this->ensureTablesExist();
        return response()->json(LoadingAssistant::orderBy('name')->get(['id', 'name']));
    }

    public function store(Request $request)
    {
        $this->ensureTablesExist();
        $validated = $request->validate(['name' => 'required|string|max:255']);
        $name = mb_strtoupper(trim($validated['name']), 'UTF-8');
        $assistant = LoadingAssistant::firstOrCreate(['name' => $name]);

        return response()->json($assistant, 201);
    }

    private function ensureTablesExist(): void
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
}
