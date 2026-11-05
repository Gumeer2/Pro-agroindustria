<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class QualityController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Quality/Index', [
            'context_module' => 'quality',
        ]);
    }
}

