<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SandboxController extends Controller
{

    public function index(Request $request)
    {

        return view('sandbox.index', [
            'message' => '¡Bienvenido al entorno de pruebas (Sandbox)!'
        ]);
    }

    // puede agregar más métodos y devolver más vistas aquí.
}
