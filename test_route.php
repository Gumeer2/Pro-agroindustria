<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::first();
if ($user) {
    auth()->login($user);
}

foreach ([
    '/apt/inventory/urea?tab=production&from=production',
    '/apt/inventory/urea?tab=initial&from=production',
    '/apt/production',
    '/apt/lots',
] as $url) {
    $req = Illuminate\Http\Request::create($url, 'GET');
    $res = $kernel->handle($req);
    $content = $res->getContent();
    preg_match('/data-page="([^"]+)"/', $content, $m);
    if (isset($m[1])) {
        $p = json_decode(htmlspecialchars_decode($m[1]), true);
        echo "URL: {$url} => Component: " . ($p['component'] ?? 'None') . " (Tab: " . ($p['props']['tab'] ?? 'N/A') . ")\n";
    }
}
