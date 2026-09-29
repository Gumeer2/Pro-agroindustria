<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SandboxController;

// All URLs starting with /sandbox
Route::prefix('sandbox')->name('sandbox.')->group(function () {
    
    // Example test route
    Route::get('/', [SandboxController::class, 'index'])->name('index');
    
    // Add more test routes here...
    
});
