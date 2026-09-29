<?php
echo "<h2>Verificación de Despliegue</h2>";
echo "<p>Hora del servidor: " . date('Y-m-d H:i:s') . "</p>";

$file = __DIR__ . '/resources/js/Pages/Dock/Index.tsx';

if (file_exists($file)) {
    echo "<p>✅ El archivo Dock/Index.tsx existe.</p>";
    $content = file_get_contents($file);

    // Check for unique strings introduced in the refactor
    if (strpos($content, "viewMode") !== false) {
        echo "<p>✅ <b>CONFIRMADO:</b> El código contiene 'viewMode'. La actualización LLEGÓ al servidor.</p>";
    } else {
        echo "<p>❌ <b>ERROR:</b> El código NO contiene 'viewMode'. Estás viendo la versión ANTERIOR.</p>";
    }

    echo "<p>Primeras 20 líneas del archivo:</p>";
    echo "<pre>" . htmlspecialchars(substr($content, 0, 800)) . "</pre>";
} else {
    echo "<p>❌ El archivo no se encuentra en: $file</p>";
}

echo "<hr>";
echo "<h3>Diagnóstico de Assets (Vite)</h3>";
$manifestPath = __DIR__ . '/public/build/manifest.json';

if (file_exists($manifestPath)) {
    $manifest = json_decode(file_get_contents($manifestPath), true);
    $dockKey = 'resources/js/Pages/Dock/Index.tsx';

    if (isset($manifest[$dockKey])) {
        $entry = $manifest[$dockKey];
        $file = $entry['file'];
        echo "<p>✅ Mapping encontrado para Dock/Index:</p>";
        echo "<ul>";
        echo "<li><b>Archivo esperado:</b> $file</li>";
        echo "<li><b>Ruta completa:</b> public/build/$file</li>";

        if (file_exists(__DIR__ . "/public/build/$file")) {
            echo "<li>✅ <b>El archivo existe físico en el servidor.</b> (" . filesize(__DIR__ . "/public/build/$file") . " bytes)</li>";
        } else {
            echo "<li>❌ <b>EL ARCHIVO NO EXISTE FÍSICAMENTE.</b> (Posible error de extracción)</li>";
        }
        echo "</ul>";
    } else {
        echo "<p>❌ No se encontró entrada para $dockKey en manifest.json</p>";
    }
} else {
    echo "<p>❌ No se encuentra public/build/manifest.json</p>";
}
?>