<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

print_r(Illuminate\Support\Facades\DB::select("SHOW TABLES"));
print_r(Illuminate\Support\Facades\Schema::getColumnListing('client_exit_operator'));
