<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$res = Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE exit_operators");
echo $res[0]->{'Create Table'} . PHP_EOL;

$count = Illuminate\Support\Facades\DB::table('exit_operators')->count();
echo "COUNT: " . $count . PHP_EOL;

$max = Illuminate\Support\Facades\DB::table('exit_operators')->max('id');
echo "MAX ID: " . $max . PHP_EOL;
